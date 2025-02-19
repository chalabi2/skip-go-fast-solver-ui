import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';
import { ChainConfig, GasTrackingSyncConfig } from '../types';
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
  decimals: number;
}

interface NativeTransfer {
  direction: string;
  token_symbol: string;
  value: string;
}

interface Transaction {
  nativeTransfers?: NativeTransfer[];
}

interface EtherscanResponse {
  status: string;
  message: string;
  result: Array<{
    timeStamp: string;
    from: string;
    to: string;
    value: string;
    isError: string;
  }>;
}

interface ExplorerConfig {
  apiUrl: string;
  apiKey?: string;
}

const EXPLORER_CONFIGS: Record<number, ExplorerConfig> = {
  1: {
    apiUrl: 'https://api.etherscan.io/api',
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  10: {
    apiUrl: 'https://api-optimistic.etherscan.io/api',
    apiKey: process.env.OPTIMISM_API_KEY
  },
  137: {
    apiUrl: 'https://api.polygonscan.com/api',
    apiKey: process.env.POLYGONSCAN_API_KEY
  },
  42161: {
    apiUrl: 'https://api.basescan.org/api',
    apiKey: process.env.BASESCAN_API_KEY
  },
  8453: {
    apiUrl: 'https://api.basescan.org/api',
    apiKey: process.env.BASESCAN_API_KEY
  },
  43114: {
    apiUrl: 'https://api.snowtrace.io/api',
    apiKey: undefined // No API key needed
  }
};

export class GasTrackingService {
  private prisma: PrismaClient;
  private providers: Map<number, ethers.JsonRpcProvider> = new Map();
  private _isSyncing: boolean = false;
  private readonly configs: Record<number, GasTrackingSyncConfig>;
  private readonly chainTokens: Record<number, ChainTokenInfo> = {
    1: { 
      nativeToken: 'ETH',
      wrappedTokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
      priceGroup: 'ETH',
      decimals: 18
    },
    137: { 
      nativeToken: 'MATIC',
      wrappedTokenAddress: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0', // WMATIC on ETH
      priceGroup: 'MATIC',
      decimals: 18
    },
    43114: { 
      nativeToken: 'AVAX',
      wrappedTokenAddress: '0x85f138bfEE4ef8e540890CFb48F620571d67Eda3', // WAVAX on ETH
      priceGroup: 'AVAX',
      decimals: 18
    },
    10: { 
      nativeToken: 'ETH',
      wrappedTokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
      priceGroup: 'ETH',
      decimals: 18
    },
    42161: { 
      nativeToken: 'ETH',
      wrappedTokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
      priceGroup: 'ETH',
      decimals: 18
    },
    8453: { 
      nativeToken: 'ETH',
      wrappedTokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
      priceGroup: 'ETH',
      decimals: 18
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

  constructor(chainConfigs: ChainConfig[], syncConfigs: Record<number, GasTrackingSyncConfig>) {
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

  private calculateTotalDeposits(transactions: Transaction[], chainId: number): string {
    logger.info(`Calculating total deposits from ${transactions.length} transactions`);
    
    // Get native token symbol for this chain
    const chainConfig = Object.values(this.configs).find((c: GasTrackingSyncConfig) => c.domain === chainId);
    if (!chainConfig) {
      logger.warn(`No chain config found for chain ID ${chainId}`);
      return '0';
    }

    const nativeTokenSymbol = chainConfig.nativeToken;
    logger.info(`Looking for native transfers with token symbol: ${nativeTokenSymbol}`);
    
    // Filter and sum native token transfers
    const totalDeposits = transactions.reduce((sum, tx) => {
      const nativeTransfers = tx.nativeTransfers || [];
      
      const relevantTransfers = nativeTransfers.filter(transfer => {
        const isReceive = transfer.direction === "receive";
        const isNativeToken = transfer.token_symbol === nativeTokenSymbol;
        logger.debug(`Transfer - Direction: ${transfer.direction}, Token: ${transfer.token_symbol}, Value: ${transfer.value}, IsRelevant: ${isReceive && isNativeToken}`);
        return isReceive && isNativeToken;
      });

      logger.debug(`Found ${relevantTransfers.length} relevant transfers in transaction`);

      const transferSum = relevantTransfers.reduce((transferTotal, transfer) => {
        return transferTotal + BigInt(transfer.value);
      }, BigInt(0));

      return sum + transferSum;
    }, BigInt(0));

    logger.info(`Total deposits calculated: ${totalDeposits.toString()} ${nativeTokenSymbol}`);
    return totalDeposits.toString();
  }

  private getChainHexId(chainId: number): string {
    return `0x${chainId.toString(16)}`;
  }

  private async getTotalDeposited(chainId: number): Promise<string> {
    const config = EXPLORER_CONFIGS[chainId];
    if (!config) {
      throw new Error(`No explorer config for chain ${chainId}`);
    }

    try {
      const params = new URLSearchParams({
        module: 'account',
        action: 'txlist',
        address: SOLVER_ADDRESS,
        startblock: '0',
        endblock: '99999999',
        sort: 'asc'
      });

      if (config.apiKey) {
        params.append('apikey', config.apiKey);
      }

      const response = await fetch(`${config.apiUrl}?${params.toString()}`);
      const data = await response.json() as EtherscanResponse;

      if (data.status !== '1') {
        throw new Error(`Explorer API error: ${data.message}`);
      }

      // Sum up all incoming transactions
      const totalDeposited = data.result.reduce((sum, tx) => {
        if (
          tx.to.toLowerCase() === SOLVER_ADDRESS.toLowerCase() &&
          tx.isError === '0'
        ) {
          return sum + BigInt(tx.value);
        }
        return sum;
      }, BigInt(0));

      return totalDeposited.toString();
    } catch (error) {
      logger.error(`Failed to fetch total deposits for chain ${chainId}:`, error);
      throw error;
    }
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
      const currentBlock = await provider.getBlockNumber();

      // Get current balance and format it
      const currentBalance = await provider.getBalance(SOLVER_ADDRESS);
      const currentBalanceFormatted = Number(ethers.formatEther(currentBalance));
      
      logger.info(`[GasTracking][${chainConfig.name}] Current balance: ${currentBalanceFormatted} ${this.chainTokens[chainConfig.domain].nativeToken} (${currentBalance.toString()} wei)`);

      // Get total deposited from explorer API
      const totalDeposited = await this.getTotalDeposited(chainConfig.domain);

      // Get token price from cache
      const chainToken = this.chainTokens[chainConfig.domain];
      const tokenPriceUSD = this.tokenPrices[chainToken.priceGroup];

      // Calculate USD values
      const currentBalanceUSD = currentBalanceFormatted * tokenPriceUSD;
      const totalDepositedUSD = Number(ethers.formatEther(BigInt(totalDeposited))) * tokenPriceUSD;

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
          ${Number(ethers.formatEther(currentBalance))}::decimal,
          ${Number(ethers.formatEther(BigInt(totalDeposited)))}::decimal,
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