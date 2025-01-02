import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';
import { ChainConfig, SyncConfig } from '../types';
import { logger } from '../utils/logger';
import Moralis from 'moralis';

const SOLVER_ADDRESS = process.env.SOLVER_ADDRESS || '0xa4804247ee79AcF5Fd0E4a3390cae048c8829713';

interface GasInfo {
  currentBalance: string;
  totalDeposited: string;
  currentBalanceUSD: number;
  totalDepositedUSD: number;
  lastSyncBlock: bigint;
}

interface ChainTokenInfo {
  nativeToken: string;
  wrappedTokenAddress: string;
  priceGroup: 'ETH' | 'MATIC' | 'AVAX';
}

export class GasTrackingService {
  private prisma: PrismaClient;
  private providers: Map<number, ethers.JsonRpcProvider> = new Map();
  private _isSyncing: boolean = false;
  private readonly configs: Record<number, SyncConfig>;
  private readonly chainTokens: Record<number, ChainTokenInfo> = {
    1: { 
      nativeToken: 'ETH',
      wrappedTokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
      priceGroup: 'ETH'
    },
    137: { 
      nativeToken: 'MATIC',
      wrappedTokenAddress: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0', // WMATIC on ETH
      priceGroup: 'MATIC'
    },
    43114: { 
      nativeToken: 'AVAX',
      wrappedTokenAddress: '0x85f138bfEE4ef8e540890CFb48F620571d67Eda3', // WAVAX on ETH
      priceGroup: 'AVAX'
    },
    10: { 
      nativeToken: 'ETH',
      wrappedTokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
      priceGroup: 'ETH'
    },
    42161: { 
      nativeToken: 'ETH',
      wrappedTokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
      priceGroup: 'ETH'
    },
    8453: { 
      nativeToken: 'ETH',
      wrappedTokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
      priceGroup: 'ETH'
    }
  };

  private tokenPrices: Record<'ETH' | 'MATIC' | 'AVAX', number> = {
    ETH: 0,
    MATIC: 0,
    AVAX: 0
  };

  private lastPriceUpdate: number = 0;
  private readonly PRICE_UPDATE_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

  // Add new property to track last transaction sync
  private lastTransactionSync: Record<number, number> = {};
  private readonly TRANSACTION_SYNC_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

  constructor(chainConfigs: ChainConfig[], syncConfigs: Record<number, SyncConfig>) {
    this.prisma = new PrismaClient();
    this.configs = syncConfigs;
    chainConfigs.forEach(config => {
      this.providers.set(config.domain, new ethers.JsonRpcProvider(config.rpcUrl));
    });

    // Initialize Moralis
    const moralisApiKey = process.env.MORALIS_API_KEY;
    if (!moralisApiKey) {
      throw new Error('MORALIS_API_KEY not found in environment variables');
    }
    Moralis.start({ apiKey: moralisApiKey }).catch(error => {
      logger.error('Failed to initialize Moralis:', error);
    });
  }

  private shouldUpdatePrices(): boolean {
    const now = Date.now();
    return now - this.lastPriceUpdate >= this.PRICE_UPDATE_INTERVAL;
  }

   async updateTokenPrices(): Promise<void> {
    try {
      logger.info('[GasTracking] Checking cached token prices...');
      
      // Try to get cached prices first
      const cachedPrices = await this.prisma.tokenPrice.findMany();
      const now = Date.now();
      
      // Create a map of which prices need updating
      const needsUpdate: Record<'ETH' | 'MATIC' | 'AVAX', boolean> = {
        ETH: true,
        MATIC: true,
        AVAX: true
      };

      // Check which prices are still valid
      for (const cached of cachedPrices) {
        const timeSinceUpdate = now - cached.lastUpdateTime.getTime();
        if (timeSinceUpdate < this.PRICE_UPDATE_INTERVAL) {
          this.tokenPrices[cached.priceGroup as keyof typeof this.tokenPrices] = Number(cached.priceUSD);
          needsUpdate[cached.priceGroup as keyof typeof this.tokenPrices] = false;
          logger.info(`[GasTracking] Using cached price for ${cached.priceGroup}: $${cached.priceUSD}`);
        }
      }

      // Only fetch prices that need updating
      const updates: Promise<void>[] = [];
      
      if (needsUpdate.ETH) {
        updates.push(this.updateSingleTokenPrice('ETH', this.chainTokens[1].wrappedTokenAddress));
      }
      if (needsUpdate.MATIC) {
        updates.push(this.updateSingleTokenPrice('MATIC', this.chainTokens[137].wrappedTokenAddress));
      }
      if (needsUpdate.AVAX) {
        updates.push(this.updateSingleTokenPrice('AVAX', this.chainTokens[43114].wrappedTokenAddress));
      }

      await Promise.all(updates);
      this.lastPriceUpdate = now;
      logger.info('[GasTracking] Updated token prices:', this.tokenPrices);
    } catch (error) {
      logger.error('[GasTracking] Failed to update token prices:', error);
    }
  }

  private async updateSingleTokenPrice(priceGroup: 'ETH' | 'MATIC' | 'AVAX', tokenAddress: string): Promise<void> {
    try {
      const price = await this.getTokenPrice(tokenAddress);
      if (price > 0) {
        this.tokenPrices[priceGroup] = price;
        // Update cache in database
        await this.prisma.tokenPrice.upsert({
          where: { priceGroup },
          create: {
            id: `${priceGroup}-PRICE`,
            priceGroup,
            priceUSD: price
          },
          update: {
            priceUSD: price
          }
        });
        logger.info(`[GasTracking] Updated ${priceGroup} price in database: $${price}`);
      }
    } catch (error) {
      logger.error(`[GasTracking] Failed to update ${priceGroup} price:`, error);
    }
  }

  private async getTokenPrice(tokenAddress: string): Promise<number> {
    try {
      logger.info(`[GasTracking] Fetching price for token ${tokenAddress}`);
      
      const response = await Moralis.EvmApi.token.getTokenPrice({
        chain: "0x1", 
        include: "percent_change",
        address: tokenAddress
      });

      const price = response.raw.usdPrice;
      if (typeof price !== 'number' || price <= 0) {
        logger.error(`[GasTracking] Invalid price for token ${tokenAddress}: ${price}`);
        return 0;
      }

      logger.info(`[GasTracking] Price for token ${tokenAddress}: $${price}`);
      return price;
    } catch (error) {
      logger.error(`[GasTracking] Error fetching price for token ${tokenAddress}:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return 0;
    }
  }

  get isSyncing(): boolean {
    return this._isSyncing;
  }

  private shouldSyncTransactions(chainId: number): boolean {
    const lastSync = this.lastTransactionSync[chainId] || 0;
    const now = Date.now();
    return now - lastSync >= this.TRANSACTION_SYNC_INTERVAL;
  }

  private calculateTotalDeposits(transactions: any[]): number {
    return transactions
      .filter(tx => tx.native_transfers?.length > 0)
      .reduce((total: number, tx) => {
        // Find all incoming native transfers in this transaction
        const deposits = tx.native_transfers
          .filter((transfer: { direction: string; internal_transaction: boolean; to_address: string }) => 
            transfer.direction === "receive" && 
            !transfer.internal_transaction &&
            transfer.to_address?.toLowerCase() === SOLVER_ADDRESS.toLowerCase()
          )
          .map((transfer: { value_formatted: string }) => Number(transfer.value_formatted))
          .reduce((sum: number, amount: number) => sum + amount, 0);

        return total + deposits;
      }, 0);
  }

  async syncGasInfo(chainConfig: ChainConfig): Promise<void> {
    const syncConfig = this.configs[chainConfig.domain];
    if (!syncConfig) {
      throw new Error(`No sync config found for chain ${chainConfig.domain}`);
    }

    try {
      // Always update prices if interval has passed
      if (this.shouldUpdatePrices()) {
        await this.updateTokenPrices();
      }
      // Fallback: if we still don't have prices, try to update them
      else if (Object.values(this.tokenPrices).every(price => price === 0)) {
        await this.updateTokenPrices();
      }

      const provider = this.providers.get(chainConfig.domain);
      if (!provider) {
        throw new Error(`No provider found for chain ${chainConfig.name}`);
      }

      // Get last sync block
      const lastSync = await this.getLastSync(chainConfig.domain);
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = lastSync ? Number(lastSync.lastSyncBlock) : syncConfig.deploymentBlock;

      logger.info(`[GasTracking][${chainConfig.name}] Fetching gas info from block ${fromBlock} to ${currentBlock}`);

      // Get current balance and format it
      const currentBalance = await provider.getBalance(SOLVER_ADDRESS);
      const currentBalanceFormatted = Number(ethers.formatEther(currentBalance));
      
      logger.info(`[GasTracking][${chainConfig.name}] Current balance: ${currentBalanceFormatted} ${this.chainTokens[chainConfig.domain].nativeToken} (${currentBalance.toString()} wei)`);

      let totalDepositedFormatted = 0;
      
      // Get existing total deposited value from database
      const existingData = await this.prisma.gasTracking.findUnique({
        where: { chainId: chainConfig.domain },
        select: { totalDeposited: true, lastSyncBlock: true }
      });

      // Only use cached value if it's non-zero
      if (existingData?.totalDeposited && Number(existingData.totalDeposited) > 0) {
        totalDepositedFormatted = Number(existingData.totalDeposited);
        logger.info(`[GasTracking][${chainConfig.name}] Found cached total deposits: ${totalDepositedFormatted} ${this.chainTokens[chainConfig.domain].nativeToken}`);
      }

      // Fetch transaction history if cache is empty or sync interval passed
      if (Number(totalDepositedFormatted) <= 0 || this.shouldSyncTransactions(chainConfig.domain)) {
        try {
          logger.info(`[GasTracking][${chainConfig.name}] Fetching new transaction history from Moralis`);
          
          const startBlock = existingData ? Number(existingData.lastSyncBlock) : syncConfig.deploymentBlock;
          
          let cursor: string | undefined = undefined;
          let allTransactions: any[] = [];

          do {
            const response = await Moralis.EvmApi.wallets.getWalletHistory({
              chain: chainConfig.domain.toString(), 
              address: SOLVER_ADDRESS,
              fromBlock: startBlock,
              cursor
            });

            const result = response.toJSON().result;
            if (result && result.length > 0) {
              allTransactions = allTransactions.concat(result);
              cursor = response.toJSON().cursor;
              logger.info(`[GasTracking][${chainConfig.name}] Fetched ${result.length} transactions, total so far: ${allTransactions.length}`);
            } else {
              cursor = undefined;
            }
          } while (cursor);

          // Calculate total deposits using the new helper method
          totalDepositedFormatted = this.calculateTotalDeposits(allTransactions);

          logger.info(`[GasTracking][${chainConfig.name}] Updated total deposits: ${totalDepositedFormatted} ${this.chainTokens[chainConfig.domain].nativeToken}`);
          
          // Update last sync timestamp
          this.lastTransactionSync[chainConfig.domain] = Date.now();
        } catch (error) {
          logger.error(`[GasTracking][${chainConfig.name}] Error fetching transaction history:`, error);
          // Keep existing total if there's an error
          totalDepositedFormatted = existingData ? Number(existingData.totalDeposited) : 0;
        }
      } else {
        // Use existing total deposited value
        totalDepositedFormatted = existingData ? Number(existingData.totalDeposited) : 0;
        logger.info(`[GasTracking][${chainConfig.name}] Using cached total deposits: ${totalDepositedFormatted} ${this.chainTokens[chainConfig.domain].nativeToken}`);
      }

      // Get token price from cache
      const chainToken = this.chainTokens[chainConfig.domain];
      const tokenPriceUSD = this.tokenPrices[chainToken.priceGroup];

      // Calculate USD values
      const currentBalanceUSD = currentBalanceFormatted * tokenPriceUSD;
      const totalDepositedUSD = totalDepositedFormatted * tokenPriceUSD;

      logger.info(`[GasTracking][${chainConfig.name}] Current balance in USD: $${currentBalanceUSD.toFixed(2)}`);
      logger.info(`[GasTracking][${chainConfig.name}] Total deposited in USD: $${totalDepositedUSD.toFixed(2)}`);

      // Update database
      await this.prisma.$executeRaw`
        INSERT INTO "GasTracking" (
          "chainId", 
          "chainName", 
          "currentBalance", 
          "totalDeposited", 
          "currentBalanceUSD", 
          "totalDepositedUSD", 
          "lastSyncBlock", 
          "lastSyncTime",
          "lastUpdateTime"
        ) 
        VALUES (
          ${chainConfig.domain},
          ${chainConfig.name},
          ${currentBalanceFormatted}::decimal,
          ${totalDepositedFormatted}::decimal,
          ${currentBalanceUSD}::decimal,
          ${totalDepositedUSD}::decimal,
          ${currentBlock}::bigint,
          NOW(),
          NOW()
        )
        ON CONFLICT ("chainId") DO UPDATE SET
          "chainName" = EXCLUDED."chainName",
          "currentBalance" = EXCLUDED."currentBalance",
          "totalDeposited" = EXCLUDED."totalDeposited",
          "currentBalanceUSD" = EXCLUDED."currentBalanceUSD",
          "totalDepositedUSD" = EXCLUDED."totalDepositedUSD",
          "lastSyncBlock" = EXCLUDED."lastSyncBlock",
          "lastSyncTime" = EXCLUDED."lastSyncTime",
          "lastUpdateTime" = NOW()
      `;

      logger.info(`[GasTracking][${chainConfig.name}] Updated gas tracking info successfully`);
    } catch (error) {
      logger.error(`[GasTracking][${chainConfig.name}] Error syncing gas info:`, {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        chainId: chainConfig.domain,
        chainName: chainConfig.name
      });
      throw error;
    }
  }

  async syncAllChains(chainConfigs: ChainConfig[]): Promise<void> {
    if (this._isSyncing) {
      logger.warn('Gas tracking sync already in progress, skipping...');
      return;
    }

    this._isSyncing = true;
    try {
      logger.info(`Starting gas tracking sync for chains: ${chainConfigs.map(c => c.name).join(', ')}`);
      await Promise.all(chainConfigs.map(config => this.syncGasInfo(config)));
      logger.info('Completed gas tracking sync for all chains');
    } catch (error) {
      logger.error('Failed gas tracking sync:', error);
      throw error;
    } finally {
      this._isSyncing = false;
    }
  }

  private async getLastSync(chainId: number): Promise<{ lastSyncBlock: bigint } | null> {
    const gasTracking = await this.prisma.$queryRaw<Array<{ lastSyncBlock: bigint }>>`
      SELECT "lastSyncBlock" FROM "GasTracking" WHERE "chainId" = ${chainId}
    `;
    return gasTracking[0] || null;
  }
} 