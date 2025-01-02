import express from 'express';
import cron from 'node-cron';
import cors from 'cors';
import { BlockchainSyncService } from './services/BlockchainSyncService';
import { GasTrackingService } from './services/GasTrackingService';
import { CHAIN_CONFIGS } from './utils/constants';
import { logger } from './utils/logger';
import { PrismaClient } from '@prisma/client';
import { SettlementDetails, ChainSyncStatus, GasTrackingSyncConfig } from './types';

const app = express();
const port = process.env.PORT || 3001;
const prisma = new PrismaClient();
const syncService = new BlockchainSyncService();

// Map sync configs to gas tracking configs
const gasTrackingConfigs: Record<number, GasTrackingSyncConfig> = Object.entries(syncService.configs).reduce((acc, [chainId, config]) => ({
  ...acc,
  [chainId]: {
    domain: Number(chainId),
    nativeToken: chainId === '137' ? 'MATIC' : chainId === '43114' ? 'AVAX' : 'ETH',
    wrappedTokenAddress: chainId === '137' ? '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0' : 
                        chainId === '43114' ? '0x85f138bfEE4ef8e540890CFb48F620571d67Eda3' : 
                        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    priceGroup: chainId === '137' ? 'MATIC' : chainId === '43114' ? 'AVAX' : 'ETH',
    decimals: 18,
    deploymentBlock: config.deploymentBlock
  }
}), {});

const gasTrackingService = new GasTrackingService(CHAIN_CONFIGS, gasTrackingConfigs);

// Middleware
app.use(cors({
  origin: [
    'https://solver.chandrastation.com',
    'http://localhost:5173',
    'https://skip-go-fast-solver-ui.vercel.app'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors()); // Enable pre-flight for all routes
app.use(express.json());

// Add a basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Create a separate cron job for price updates every 4 hours
cron.schedule('0 */4 * * *', async () => {
  try {
    logger.info('Starting scheduled token price update');
    await gasTrackingService.updateTokenPrices();
  } catch (error) {
    logger.error('Failed to update token prices:', error);
  }
});

// Modify the existing 5-minute cron to only sync data
cron.schedule('*/5 * * * *', async () => {
  if (syncService.isSyncing || gasTrackingService.isSyncing) {
    logger.warn('Previous sync still in progress, skipping this cron run');
    return;
  }

  try {
    logger.info('Starting parallel sync for all chains');
    await Promise.all([
      syncService.syncAllChains(CHAIN_CONFIGS),
      gasTrackingService.syncAllChains(CHAIN_CONFIGS)
    ]);
    logger.info('Completed parallel sync for all chains');
  } catch (error) {
    logger.error('Failed parallel sync:', error);
  }
});

// API endpoints
app.get('/api/settlements', async (req, res) => {
  try {
    // Add timeout to the sync operation
    const syncPromise = Promise.all([
      syncService.syncAllChains(CHAIN_CONFIGS),
      gasTrackingService.syncAllChains(CHAIN_CONFIGS)
    ]);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Sync timeout')), 30000);
    });

    try {
      await Promise.race([syncPromise, timeoutPromise]);
    } catch (error: any) {
      logger.warn('Sync timed out or failed, proceeding with existing data');
    }
    
    // Get raw count per chain first for verification
    const chainCounts = await prisma.settlement.groupBy({
      by: ['chainId'],
      _count: {
        _all: true
      }
    });
    
    logger.info('Raw settlement counts per chain:', chainCounts);
    
    // Get all settlements ordered by timestamp
    const settlements = await prisma.settlement.findMany({
      orderBy: {
        timestamp: 'desc'
      }
    });

    // Get Osmosis orders to determine expected counts
    const osmosisOrders = await syncService.fetchOsmosisOrders();
    const expectedCountsByChain = osmosisOrders.reduce((acc, order) => {
      acc[order.source_domain] = (acc[order.source_domain] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    logger.info('Expected settlement counts from Osmosis:', expectedCountsByChain);
  
    // Group settlements by chainId with verification and include gas info
    const groupedSettlements = settlements.reduce((acc: Record<number, { 
      chainName: string; 
      settlements: any[]; 
      total: number;
      expectedTotal: number;
    }>, settlement: SettlementDetails) => {
      const chainId = settlement.chainId;
      const chainName = CHAIN_CONFIGS.find(c => c.domain === chainId)?.name || 'Unknown';
      
      if (!acc[chainId]) {
        acc[chainId] = {
          chainName,
          settlements: [],
          total: 0,
          expectedTotal: expectedCountsByChain[chainId] || 0,
        
        };
      }
      
      acc[chainId].settlements.push({
        ...settlement,
        blockNumber: settlement.blockNumber.toString(),
        amount: settlement.amount.toString(),
        profit: settlement.profit.toString()
      });
      acc[chainId].total++;
      
      return acc;
    }, {} as Record<number, { 
      chainName: string; 
      settlements: any[]; 
      total: number;
      expectedTotal: number;
   
    }>);

    // Add chains that have expected settlements but no actual settlements yet
    Object.entries(expectedCountsByChain).forEach(([chainId, count]) => {
      const numericChainId = Number(chainId);
      if (!groupedSettlements[numericChainId]) {
        const chainName = CHAIN_CONFIGS.find(c => c.domain === numericChainId)?.name || 'Unknown';
        groupedSettlements[numericChainId] = {
          chainName,
          settlements: [],
          total: 0,
          expectedTotal: count,
         
        };
      }
    });

    res.json({
      settlements: groupedSettlements,
      totalSettlements: settlements.length,
      expectedTotalSettlements: osmosisOrders.length
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Error fetching settlements:', { error: errorMessage });
    res.status(500).json({ 
      error: 'Internal server error', 
      details: errorMessage 
    });
  }
});

app.get('/api/sync-status', async (req, res) => {
  try {
    logger.info('Fetching sync status');
    const syncStatus = await prisma.chainSync.findMany({
      orderBy: {
        chainId: 'asc'
      }
    });
    logger.info(`Found ${syncStatus.length} chain sync records`);
    
    // Convert BigInt to string in the response
    const serializedStatus = syncStatus.map((status: ChainSyncStatus) => ({
      ...status,
      lastSyncBlock: status.lastSyncBlock.toString(),
      chainName: CHAIN_CONFIGS.find(c => c.domain === status.chainId)?.name || 'Unknown'
    }));
    
    res.json(serializedStatus);
  } catch (error) {
    logger.error('Error fetching sync status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Internal server error', 
      details: errorMessage 
    });
  }
});

// Add new gas-info endpoint
app.get('/api/gas-info', async (req, res) => {
 
  try {
    // Get gas tracking info from database
    const gasInfo = await prisma.$queryRaw<Array<{
      chainId: number;
      chainName: string;
      currentBalance: string;
      totalDeposited: string;
      currentBalanceUSD: string;
      totalDepositedUSD: string;
    }>>`
      SELECT 
        "chainId",
        "chainName",
        "currentBalance"::text,
        "totalDeposited"::text,
        "currentBalanceUSD"::text,
        "totalDepositedUSD"::text
      FROM "GasTracking"
      ORDER BY "chainId" ASC
    `;
    
    const formattedGasInfo = gasInfo.reduce((acc: Record<number, {
      chainName: string;
      currentBalance: string;
      totalDeposited: string;
      currentBalanceUSD: number;
      totalDepositedUSD: number;
    }>, info: {
      chainId: number;
      chainName: string;
      currentBalance: string;
      totalDeposited: string;
      currentBalanceUSD: string;
      totalDepositedUSD: string;
    }) => {
      acc[info.chainId] = {
        chainName: info.chainName,
        currentBalance: info.currentBalance,
        totalDeposited: info.totalDeposited,
        currentBalanceUSD: Number(info.currentBalanceUSD),
        totalDepositedUSD: Number(info.totalDepositedUSD)
      };
      return acc;
    }, {} as Record<number, any>);

    res.json(formattedGasInfo);
  } catch (error) {
    logger.error('Error fetching gas info:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add this near your other routes
app.get('/test', (req, res) => {
  res.json({ message: 'Backend is running!' });
});

// Start the server
app.listen(port, async () => {
  logger.info(`Server is running on port ${port}`);
  
  // Test database connection
  try {
    const count = await prisma.settlement.count();
    logger.info(`Database connection successful. Current settlement count: ${count}`);
  } catch (error) {
    logger.error('Database connection test failed:', error);
  }

  // Log current sync status
  try {
    const currentSyncStatus = await prisma.chainSync.findMany({
      orderBy: { chainId: 'asc' }
    });
    
    logger.info('Current sync status:');
    currentSyncStatus.forEach((status: ChainSyncStatus) => {
      logger.info(`${CHAIN_CONFIGS.find(c => c.domain === status.chainId)?.name}: Block ${status.lastSyncBlock.toString()}`);
    });

    // Initialize sync for chains that don't have a sync record
    const syncedChainIds = new Set(currentSyncStatus.map((s: ChainSyncStatus) => s.chainId));
    const chainsToInitialize = CHAIN_CONFIGS.filter(c => !syncedChainIds.has(c.domain));
    
    if (chainsToInitialize.length > 0) {
      logger.info('Initializing sync for new chains:', chainsToInitialize.map(c => c.name).join(', '));
    }
  } catch (error) {
    logger.error('Error checking sync status:', error);
  }
  
  // Initial parallel sync for all chains
  try {
    logger.info('Starting initial parallel sync for all chains');
    await Promise.all([
      syncService.syncAllChains(CHAIN_CONFIGS),
      gasTrackingService.syncAllChains(CHAIN_CONFIGS)
    ]);
    logger.info('Completed initial parallel sync for all chains');

    // Initial token price update
    await gasTrackingService.updateTokenPrices();
  } catch (error) {
    logger.error('Failed initial parallel sync:', error);
  }
}); 