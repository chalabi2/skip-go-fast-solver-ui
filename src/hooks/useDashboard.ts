import { useQuery, useQueries } from '@tanstack/react-query';

import { useState } from 'react';
import { 
  CHAIN_CONFIGS, 
  calculateChainProfits, 
  getUSDCBalance,
  type ChainBalance,
  type ChainProfitResult,
  type OrderWithProfit
} from '../utils/metrics';
import type { DashboardState } from '../types/dashboard';

const POLLING_INTERVAL = 30000; // 30 seconds

interface OsmosisResponse {
  data: {
    order_id: string;
    filler: string;
    source_domain: number;
  }[];
}

export function useDashboard() {
  const [selectedChain, setSelectedChain] = useState(CHAIN_CONFIGS[0].domain.toString());

  // Query for Osmosis orders
  const { data: osmosisOrders, isLoading: isLoadingOrders } = useQuery<OsmosisResponse>({
    queryKey: ['osmosisOrders'],
    queryFn: async () => {
      const response = await fetch(
        "https://nodes.chandrastation.com/api/osmosis/cosmwasm/wasm/v1/contract/osmo1vy34lpt5zlj797w7zqdta3qfq834kapx88qtgudy7jgljztj567s73ny82/smart/eyJvcmRlcl9maWxsc19ieV9maWxsZXIiOnsiZmlsbGVyIjoib3NtbzF2eTdtZDhxazZjeXhzajJwNzhwbnR4dWtqajRueDBwZzRtNjR1OSIsImxpbWl0IjoxMDAwfX0K"
      );
      const data = await response.json();
      console.log('Osmosis orders:', data);
      return data;
    },
    refetchInterval: POLLING_INTERVAL,
  });


  // Query for USDC balances
  const balanceQueries = useQueries({
    queries: CHAIN_CONFIGS.map(config => ({
      queryKey: ['balance', config.domain],
      queryFn: () => getUSDCBalance(config),
      refetchInterval: POLLING_INTERVAL,
    }))
  });

  // Chain profits queries using unified function
  const chainProfitsQueries = useQueries({
    queries: CHAIN_CONFIGS.map(config => ({
      queryKey: ['chainProfits', config.domain],
      queryFn: async () => {
        if (!osmosisOrders?.data) return null;
        console.log(`Calculating profits for ${config.name}...`);
        return calculateChainProfits(config, osmosisOrders.data);
      },
      enabled: !!osmosisOrders,
      refetchInterval: POLLING_INTERVAL,
    }))
  });

  // Map chain profits to their respective domains
  const chainProfits = Object.fromEntries(
    chainProfitsQueries
      .map((query, index) => {
        const config = CHAIN_CONFIGS[index];
        return [config.domain.toString(), query.data];
      })
      .filter(([, data]) => data !== null)
  ) as Record<string, ChainProfitResult>;

  // Calculate total metrics
  const totalOrders = Object.values(chainProfits).reduce(
    (acc, chain) => acc + (chain?.ordersWithProfits.length || 0),
    0
  );



  const dashboardState: DashboardState = {
    orderMetrics: {
      totalOrders,
      successfulOrders: totalOrders, // All orders we see are successful
      pendingOrders: 0,
    },
    profitMetrics: CHAIN_CONFIGS.map(config => ({
      chainId: config.domain.toString(),
      chainName: config.name,
      metrics: {
        totalOrders: chainProfits[config.domain.toString()]?.ordersWithProfits.length || 0,
        totalVolume: BigInt(Math.floor((chainProfits[config.domain.toString()]?.ordersWithProfits.reduce(
          (sum: number, order: OrderWithProfit) => sum + Number(order.amount),
          0
        ) || 0) * 1e6)),
        totalFees: BigInt(Math.floor((chainProfits[config.domain.toString()]?.ordersWithProfits.reduce(
          (sum: number, order: OrderWithProfit) => sum + Number(order.profit),
          0
        ) || 0) * 1e6)),
        settledOrders: chainProfits[config.domain.toString()]?.ordersWithProfits.length || 0,
      },
    })),
    settlementDetails: Object.values(chainProfits)
      .flatMap(chain => chain?.ordersWithProfits || [])
      .sort((a, b) => b.timestamp - a.timestamp),
    chainBalances: balanceQueries
      .filter(query => query.data)
      .map(query => query.data!) as ChainBalance[],
   
    chainProfits,
    selectedChain,
  };

  return {
    ...dashboardState,
    setSelectedChain,
    isLoading: isLoadingOrders  || chainProfitsQueries.some(query => query.isLoading) || balanceQueries.some(query => query.isLoading),
    isError: chainProfitsQueries.some(query => query.isError) || balanceQueries.some(query => query.isError),
  };
} 