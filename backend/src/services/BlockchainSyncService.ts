import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { BASE_TRANSFER_GATEWAY_ABI } from '../utils/constants';
import { SyncConfig, ChainConfig } from '../types';

interface OsmosisResponse {
  data: {
    order_id: string;
    filler: string;
    source_domain: number;
  }[];
}

async function getLogsWithRetry(
  provider: ethers.JsonRpcProvider,
  filter: ethers.Filter,
  config: SyncConfig
): Promise<ethers.Log[]> {
  const CHUNK_SIZE = 2000;
  let logs: ethers.Log[] = [];
  
  try {
    return await provider.getLogs(filter);
  } catch (error) {
    const fromBlock = Number(filter.fromBlock);
    const toBlock = await provider.getBlockNumber();
    
    for (let from = fromBlock; from <= toBlock; from += CHUNK_SIZE) {
      const to = Math.min(from + CHUNK_SIZE - 1, toBlock);
      
      let attempt = 0;
      while (attempt < config.retryAttempts) {
        try {
          const chunkLogs = await provider.getLogs({
            ...filter,
            fromBlock: from,
            toBlock: to
          });
          logs = logs.concat(chunkLogs);
          break;
        } catch (err) {
          attempt++;
          if (attempt === config.retryAttempts) throw err;
          await new Promise(resolve => setTimeout(resolve, config.retryDelay * attempt));
        }
      }
    }
    
    return logs;
  }
}

export class BlockchainSyncService {
  private prisma: PrismaClient;
  private _isSyncing: boolean = false;
  readonly configs: Record<number, SyncConfig> = {
    1: { 
      batchSize: 1000,
      retryAttempts: 3,
      retryDelay: 1000,
      concurrentChains: 3,
      syncInterval: 300000,
      deploymentBlock: 0x142825A
    },
    137: {
      batchSize: 5,
      retryAttempts: 5,
      retryDelay: 2000,
      concurrentChains: 1,
      syncInterval: 300000,
      deploymentBlock: 0x3D07966
    },
    43114: {
      batchSize: 25,
      retryAttempts: 5,
      retryDelay: 2000,
      concurrentChains: 3,
      syncInterval: 300000,
      deploymentBlock: 0x3253B57
    },
    10: {
      batchSize: 1000,
      retryAttempts: 3,
      retryDelay: 1000,
      concurrentChains: 3,
      syncInterval: 300000,
      deploymentBlock: 0x79C6C77
    },
    42161: {
      batchSize: 1000,
      retryAttempts: 3,
      retryDelay: 1000,
      concurrentChains: 3,
      syncInterval: 300000,
      deploymentBlock: 0x10315733
    },
    8453: {
      batchSize: 1000,
      retryAttempts: 3,
      retryDelay: 1000,
      concurrentChains: 3,
      syncInterval: 300000,
      deploymentBlock: 0x1512B9B
    }
  };

  constructor() {
    this.prisma = new PrismaClient();
  }

  get isSyncing(): boolean {
    return this._isSyncing;
  }

  async syncAllChains(chainConfigs: ChainConfig[]): Promise<void> {
    if (this._isSyncing) {
      logger.warn('Sync already in progress, skipping...');
      return;
    }

    this._isSyncing = true;
    try {
      logger.info(`Starting parallel sync for chains: ${chainConfigs.map(c => c.name).join(', ')}`);
      
      const osmosisOrders = await this.fetchOsmosisOrders();
      logger.info(`Fetched ${osmosisOrders.length} total orders from Osmosis`);
      
      const ordersByChain = osmosisOrders.reduce((acc, order) => {
        acc[order.source_domain] = (acc[order.source_domain] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      Object.entries(ordersByChain).forEach(([chainId, count]) => {
        const chainName = chainConfigs.find(c => c.domain === Number(chainId))?.name || chainId;
        logger.info(`Expected ${count} orders for ${chainName}`);
      });

      await Promise.all(chainConfigs.map(config => this.syncChain(config, osmosisOrders)));
    } catch (error) {
      logger.error('Failed parallel sync:', error);
      throw error;
    } finally {
      this._isSyncing = false;
    }
  }

  async syncChain(chainConfig: ChainConfig, osmosisOrders: OsmosisResponse['data']): Promise<void> {
    const syncConfig = this.configs[chainConfig.domain];
    if (!syncConfig) {
      throw new Error(`No sync config found for chain ${chainConfig.domain}`);
    }

    // Filter out orders we already have data for
    const existingSettlements = await this.prisma.settlement.findMany({
      where: {
        chainId: chainConfig.domain,
        status: 'COMPLETED'
      },
      select: {
        orderId: true
      }
    });
    const existingOrderIds = new Set(existingSettlements.map(s => s.orderId.toLowerCase()));
    
    const chainOrders = osmosisOrders.filter(order => {
      const orderIdHex = order.order_id.startsWith('0x') ? order.order_id : `0x${order.order_id}`;
      return order.source_domain === chainConfig.domain && !existingOrderIds.has(orderIdHex.toLowerCase());
    });

    if (chainOrders.length === 0) {
      logger.info(`[${chainConfig.name}] No new orders to process`);
      return;
    }

    logger.info(`[${chainConfig.name}] Processing ${chainOrders.length} new orders from Osmosis`);

    try {
      const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
      await this.withRetry(async () => {
        await provider.ready;
      }, syncConfig, `${chainConfig.name} provider ready check`);

      const contract = new ethers.Contract(
        chainConfig.fastTransferGateway,
        BASE_TRANSFER_GATEWAY_ABI,
        provider
      );

      // Only fetch settlement events for new orders
      const currentBlock = await provider.getBlockNumber();
      const deploymentBlock = Number(this.configs[chainConfig.domain].deploymentBlock);
      const settlementTopic = ethers.id('OrderSettled(bytes32)');

      logger.info(`[${chainConfig.name}] Fetching settlement events from block ${deploymentBlock} to ${currentBlock}`);

      // Get settlement events
      const allSettlementLogs = await getLogsWithRetry(
        provider,
        {
          address: chainConfig.fastTransferGateway,
          fromBlock: deploymentBlock,
          toBlock: currentBlock,
          topics: [settlementTopic]
        },
        this.configs[chainConfig.domain]
      );

      // Create a map of orderId to event details
      const settlementMap = new Map<string, ethers.Log>();
      for (const log of allSettlementLogs) {
        const orderId = log.topics[1]; // The orderId is the first indexed parameter
        settlementMap.set(orderId.toLowerCase(), log);
      }

      // Process orders in parallel batches
      const batchSize = 10;
      const batches = [];
      for (let i = 0; i < chainOrders.length; i += batchSize) {
        batches.push(chainOrders.slice(i, i + batchSize));
      }

      let processedCount = 0;
      let successCount = 0;
      let failedCount = 0;
      let skippedCount = 0;

      for (const batch of batches) {
        const results = await Promise.allSettled(batch.map(order => 
          this.processOrderWithEvent(order, chainConfig, contract, settlementMap)
        ));
        
        results.forEach((result, index) => {
          const order = batch[index];
          if (result.status === 'fulfilled') {
            if (result.value === true) {
              successCount++;
            } else {
              skippedCount++;
            }
          } else {
            failedCount++;
            logger.warn(`[${chainConfig.name}] Failed to process order ${order.order_id}: ${result.reason}`);
          }
        });

        processedCount += batch.length;
        logger.info(`[${chainConfig.name}] Progress: ${processedCount}/${chainOrders.length} orders (${successCount} successful, ${skippedCount} skipped, ${failedCount} failed)`);
      }

      logger.info(`[${chainConfig.name}] Final results: ${successCount} successful, ${skippedCount} skipped, ${failedCount} failed out of ${chainOrders.length} total orders`);

      // Update the last synced block to current
      await this.updateSyncProgress(chainConfig.domain, currentBlock);
    } catch (error) {
      logger.error(`[${chainConfig.name}] Chain sync failed:`, error);
      throw error;
    }
  }

  async fetchOsmosisOrders(): Promise<OsmosisResponse['data']> {
    try {
      let allOrders: OsmosisResponse['data'] = [];
      let startAfter: string | null = null;
      const limit = 1000;
      let hasMoreOrders = true;
      
      while (hasMoreOrders) {
        const query = {
          order_fills_by_filler: {
            filler: "osmo1vy7md8qk6cyxsj2p78pntxukjj4nx0pg4m64u9",
            start_after: startAfter,
            limit: limit
          }
        };

        const encodedQuery = Buffer.from(JSON.stringify(query)).toString('base64');
        const url = `https://nodes.chandrastation.com/api/osmosis/cosmwasm/wasm/v1/contract/osmo1vy34lpt5zlj797w7zqdta3qfq834kapx88qtgudy7jgljztj567s73ny82/smart/${encodedQuery}`;
        
        logger.debug(`Fetching orders with query: ${JSON.stringify(query)}`);
        const response = await fetch(url);
        const data = await response.json() as OsmosisResponse;
        const orders = data.data;
        
        if (!orders || orders.length === 0) {
          logger.info('No more orders to fetch');
          hasMoreOrders = false;
          break;
        }
        
        allOrders = allOrders.concat(orders);
        logger.info(`Fetched ${orders.length} orders, total so far: ${allOrders.length}`);
        
        if (orders.length < limit) {
          logger.info('Reached last page of orders');
          hasMoreOrders = false;
          break;
        }
        
        startAfter = orders[orders.length - 1].order_id;
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      logger.info(`Total Osmosis orders fetched: ${allOrders.length}`);
      return allOrders;
    } catch (error) {
      logger.error('Error fetching Osmosis orders:', error);
      throw error;
    }
  }

  private async updateSyncProgress(chainId: number, blockNumber: number | bigint): Promise<void> {
    await this.prisma.chainSync.upsert({
      where: { chainId },
      create: {
        chainId,
        lastSyncBlock: BigInt(blockNumber),
        lastSyncTime: new Date()
      },
      update: {
        lastSyncBlock: BigInt(blockNumber),
        lastSyncTime: new Date()
      }
    });
  }

  private async withRetry<T>(
    fn: () => Promise<T>,
    config: SyncConfig,
    context: string = ''
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let i = 0; i < config.retryAttempts; i++) {
      try {
        return await fn();
      } catch (error) {
        const typedError = error as Error;
        lastError = typedError;
        logger.warn(`Retry ${i + 1}/${config.retryAttempts} failed${context ? ` for ${context}` : ''}: ${typedError.message}`);
        await new Promise(resolve => setTimeout(resolve, config.retryDelay * (i + 1)));
      }
    }
    
    throw lastError;
  }

  private async processOrderWithEvent(
    order: any,
    chainConfig: ChainConfig,
    contract: ethers.Contract,
    settlementMap: Map<string, ethers.Log>
  ): Promise<boolean> {
    const orderIdHex = order.order_id.startsWith('0x') ? order.order_id : `0x${order.order_id}`;
    const paddedOrderId = ethers.zeroPadValue(orderIdHex, 32);

    try {
      logger.debug(`Processing order ${orderIdHex} on ${chainConfig.name}`);

      // Get settlement details
      let details;
      try {
        details = await contract.settlementDetails(paddedOrderId);
      } catch (error: any) {
        if (error.message?.includes('batch size too large')) {
          logger.debug(`Retrying with latest block for ${orderIdHex}`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          details = await contract.settlementDetails(paddedOrderId, { blockTag: 'latest' });
        } else {
          throw error;
        }
      }

      if (!details || !details.amount) {
        logger.debug(`No settlement details for order ${orderIdHex} on ${chainConfig.name}`);
        return false;
      }

      // Check if we have a settlement event for this order
      const event = settlementMap.get(paddedOrderId.toLowerCase());
      if (!event) {
        logger.warn(`No settlement event found for order ${orderIdHex} on ${chainConfig.name}`);
        return false;
      }

      const block = await event.getBlock();
      
      // Format the amounts properly - ensure positive values
      let amount: bigint;
      let profit: bigint;
      
      try {
        // Convert to absolute value
        const amountBigInt = details.amount;
        amount = amountBigInt < 0n ? -amountBigInt : amountBigInt;
        
        // Calculate profit (0.1%)
        const profitBigInt = amount * BigInt(1) / BigInt(1000);
        profit = profitBigInt;
        
        logger.debug(`Formatted amounts - Amount: ${amount}, Profit: ${profit}`);
      } catch (error) {
        logger.error(`Error formatting amounts for order ${orderIdHex}:`, error);
        return false;
      }

      // Save to database
      await this.prisma.settlement.upsert({
        where: {
          orderId_chainId: {
            orderId: orderIdHex,
            chainId: chainConfig.domain
          }
        },
        create: {
          orderId: orderIdHex,
          chainId: chainConfig.domain,
          chainName: chainConfig.name,
          amount: amount.toString(),
          profit: profit.toString(),
          timestamp: new Date(block.timestamp * 1000),
          blockNumber: block.number,
          status: 'COMPLETED'
        },
        update: {
          amount: amount.toString(),
          profit: profit.toString(),
          timestamp: new Date(block.timestamp * 1000),
          blockNumber: block.number,
          status: 'COMPLETED'
        }
      });

      return true;
    } catch (error) {
      logger.error(`Error processing order ${orderIdHex}:`, error);
      return false;
    }
  }
} 