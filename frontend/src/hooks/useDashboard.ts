import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { CHAIN_CONFIGS } from '../utils/metrics';
import { api } from '../utils/api';
import type { DashboardState } from '../types/dashboard';

const POLLING_INTERVAL = 30000; // 30 seconds
const USDC_DECIMALS = 6;
const STALE_TIME = 30 * 60 * 1000; // 30 minutes


function formatUSDC(amount: string): string {
  // Convert string to number, handling scientific notation
  const value = Number(amount);
  // Format with 6 decimal places and remove trailing zeros
  return (value / Math.pow(10, USDC_DECIMALS)).toFixed(USDC_DECIMALS).replace(/\.?0+$/, '');
}

type GasInfo = {
  chainName: string;
  currentBalance: string;
  totalDeposited: string;
  currentBalanceUSD: number;
  totalDepositedUSD: number;
};

export function useDashboard() {
  const [selectedChain, setSelectedChain] = useState(CHAIN_CONFIGS[0].domain.toString());

  // Query for settlements and sync status
  const { 
    data: settlementsData, 
    isLoading: isLoadingSettlements,
    isError: isSettlementsError
  } = useQuery({
    queryKey: ['settlements'],
    queryFn: api.getSettlements,
    refetchInterval: POLLING_INTERVAL,
  });

  const {
    data: syncStatus,
    isLoading: isLoadingSyncStatus,
    isError: isSyncStatusError
  } = useQuery({
    queryKey: ['syncStatus'],
    queryFn: api.getSyncStatus,
    refetchInterval: POLLING_INTERVAL,
  });

  const {
    data: gasInfo,
    isLoading: isLoadingGasInfo,
    isError: isGasInfoError
  } = useQuery({
    queryKey: ['gasInfo'],
    queryFn: api.getGasInfo,
    refetchInterval: POLLING_INTERVAL,
    staleTime: STALE_TIME,
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });

  if (!settlementsData) {
    return {
      orderMetrics: {
        totalOrders: 0,
        successfulOrders: 0,
        pendingOrders: 0,
      },
      profitMetrics: [],
      settlementDetails: [],
      chainBalances: [],
      chainProfits: {},
      selectedChain,
      setSelectedChain,
      gasInfo: {} as Record<string, GasInfo>,
      isLoading: isLoadingSettlements || isLoadingSyncStatus || isLoadingGasInfo,
      isError: isSettlementsError || isSyncStatusError || isGasInfoError,
      syncStatus: syncStatus || [],
    };
  }

  // Calculate metrics from settlements data
  const profitMetrics = CHAIN_CONFIGS.map(config => {
    const chainData = settlementsData.settlements[config.domain];
    const totalVolume = chainData?.settlements.reduce(
      (sum, settlement) => sum + BigInt(settlement.amount),
      BigInt(0)
    ) || BigInt(0);
    const totalFees = chainData?.settlements.reduce(
      (sum, settlement) => sum + BigInt(settlement.profit),
      BigInt(0)
    ) || BigInt(0);

    return {
      chainId: config.domain.toString(),
      chainName: config.name,
      metrics: {
        totalOrders: chainData?.expectedTotal || 0,
        totalVolume,
        totalFees,
        settledOrders: chainData?.total || 0,
      },
    };
  });

  // Format chain profits
  const chainProfits = Object.entries(settlementsData.settlements).reduce((acc, [chainId, data]) => {
    acc[chainId] = {
      totalProfit: formatUSDC(
        data.settlements.reduce((sum, s) => sum + BigInt(s.profit), BigInt(0)).toString()
      ),
      ordersWithProfits: data.settlements.map(s => ({
        orderId: s.orderId,
        chainId: Number(chainId),
        chainName: data.chainName,
        amount: formatUSDC(s.amount),
        profit: formatUSDC(s.profit),
        timestamp: new Date(s.timestamp).getTime() / 1000
      }))
    };
    return acc;
  }, {} as Record<string, any>);

  const dashboardState: DashboardState = {
    orderMetrics: {
      totalOrders: settlementsData.expectedTotalSettlements,
      successfulOrders: settlementsData.totalSettlements,
      pendingOrders: settlementsData.expectedTotalSettlements - settlementsData.totalSettlements,
    },
    profitMetrics,
    settlementDetails: Object.values(settlementsData.settlements)
      .flatMap(chain => chain.settlements)
      .map(s => ({
        ...s,
        chainId: s.chainId.toString(),
        amount: formatUSDC(s.amount),
        profit: formatUSDC(s.profit),
        timestamp: new Date(s.timestamp).getTime() / 1000
      }))
      .sort((a, b) => b.timestamp - a.timestamp),
    chainBalances: CHAIN_CONFIGS.map(config => ({
      chainId: config.domain.toString(),
      chainName: config.name,
      balance: 0 // We'll need to add this endpoint to the backend if needed
    })),
    chainProfits,
    selectedChain,
  };

  return {
    ...dashboardState,
    setSelectedChain,
    gasInfo: gasInfo || {},
    isLoading: isLoadingSettlements || isLoadingSyncStatus || isLoadingGasInfo,
    isError: isSettlementsError || isSyncStatusError || isGasInfoError,
    syncStatus: syncStatus || [],
  };
} 