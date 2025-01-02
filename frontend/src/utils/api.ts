interface Settlement {
  orderId: string;
  chainId: number;
  chainName: string;
  amount: string;
  profit: string;
  timestamp: Date;
  blockNumber: string;
  status: string;
}

interface ChainSettlements {
  chainName: string;
  settlements: Settlement[];
  total: number;
  expectedTotal: number;
}

interface SettlementsResponse {
  settlements: Record<number, ChainSettlements>;
  totalSettlements: number;
  expectedTotalSettlements: number;
}

interface SyncStatus {
  chainId: number;
  chainName: string;
  lastSyncBlock: string;
  lastSyncTime: string;
  lastUpdateTime: string;
}

interface GasInfo {
  chainName: string;
  currentBalance: string;
  totalDeposited: string;
  currentBalanceUSD: number;
  totalDepositedUSD: number;
}

const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://solver.chandratation.com/api'
  : 'http://localhost:3001/api';

export const api = {
  async getSettlements(): Promise<SettlementsResponse> {
    const response = await fetch(`${API_URL}/settlements`);
    if (!response.ok) {
      throw new Error('Failed to fetch settlements');
    }
    return response.json();
  },

  async getSyncStatus(): Promise<SyncStatus[]> {
    const response = await fetch(`${API_URL}/sync-status`);
    if (!response.ok) {
      throw new Error('Failed to fetch sync status');
    }
    return response.json();
  },

  async getGasInfo(): Promise<Record<number, GasInfo>> {
    const response = await fetch(`${API_URL}/gas-info`);
    if (!response.ok) {
      throw new Error('Failed to fetch gas info');
    }
    return response.json();
  }
}; 