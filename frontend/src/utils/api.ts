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

const API_URL = import.meta.env.VITE_NODE_ENV === 'production' 
  ? 'https://skip-go-fast-solver-ui.vercel.app/api/'
  : 'http://localhost:3001/api/';

const fetchData = async (endpoint: string) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include'
  });
  return response.json();
};

export const api = {
  async getSettlements(): Promise<SettlementsResponse> {
    return fetchData('settlements');
  },

  async getSyncStatus(): Promise<SyncStatus[]> {
    return fetchData('sync-status');
  },

  async getGasInfo(): Promise<Record<number, GasInfo>> {
    return fetchData('gas-info');
  }
}; 