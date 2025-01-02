export interface ChainConfig {
  domain: number;
  name: string;
  rpcUrl: string;
  token: string;
  fastTransferGateway: string;
  mailbox: string;
}

export interface SyncConfig {
  batchSize: number;
  retryAttempts: number;
  retryDelay: number;
  concurrentChains: number;
  syncInterval: number;
  deploymentBlock: number;
}

export interface GasTrackingSyncConfig {
  domain: number;
  nativeToken: string;
  wrappedTokenAddress: string;
  priceGroup: 'ETH' | 'MATIC' | 'AVAX';
  decimals: number;
  deploymentBlock: number;
}

export interface SettlementDetails {
  orderId: string;
  chainId: number;
  chainName: string;
  amount: string;
  profit: string;
  timestamp: Date;
  blockNumber: bigint;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
}

export interface ChainSyncStatus {
  chainId: number;
  lastSyncBlock: bigint;
  lastSyncTime: Date;
  lastUpdateTime: Date;
} 