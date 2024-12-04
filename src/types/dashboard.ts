

export interface OrderMetrics {
  totalOrders: number;
  successfulOrders: number;
  pendingOrders: number;
}

export interface ChainBalance {
  chainId: string;
  chainName: string;
  balance: number;
}

export interface GasMetric {
  metric: {
    source_chain_id: string;
    source_chain_name: string;
    gas_token_symbol: string;
    gas_balance: number;
  };
  value: [number, number];
}

export interface ChainProfitMetric {
  chainId: string;
  chainName: string;
  metrics: {
    totalOrders: number;
    totalVolume: bigint;
    totalFees: bigint;
    settledOrders: number;
  };
}

export interface ChainProfits {
  totalProfit: string;
  ordersWithProfits: Array<{
    orderId: string;
    amount: string;
    profit: string;
    timestamp: number;
  }>;
}

export interface SettlementDetails {
  orderId: string;
  amount: string;
  profit: string;
  timestamp: number;
  chainId: string;
}

export interface DashboardState {
  orderMetrics: OrderMetrics | null;
  chainBalances: ChainBalance[];
  gasMetrics: GasMetric[];
  profitMetrics: ChainProfitMetric[];
  settlementDetails: SettlementDetails[];
  chainProfits: Record<string, ChainProfits>;
  selectedChain: string;
} 