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
  ? 'https://skip-go-fast-solver-ui.vercel.app/'
  : 'http://localhost:3000/api/';

  const API_KEY = import.meta.env.VITE_API_KEY;


const fetchData = async (endpoint: string) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    },
    credentials: 'include'
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized - Invalid API key');
    }
    throw new Error(`API request failed: ${response.statusText}`);
  }

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