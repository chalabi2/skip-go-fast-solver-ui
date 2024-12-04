import React, { useState } from "react";
import { useDashboard } from "../hooks/useDashboard";
import { CHAIN_CONFIGS } from "../utils/metrics";

import { useAuth } from "../context/AuthContext";

type SortField = "amount" | "profit" | "timestamp";
type SortDirection = "asc" | "desc";

export const Dashboard: React.FC = () => {
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const { user, signOut } = useAuth();

  const {
    chainBalances,
    gasMetrics,
    profitMetrics,
    chainProfits,
    selectedChain,
    setSelectedChain,
    isLoading,
    isError,
  } = useDashboard();

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getSortedOrders = (
    orders: {
      orderId: string;
      amount: string;
      profit: string;
      timestamp: number;
    }[]
  ) => {
    const chainConfig = CHAIN_CONFIGS.find(
      (config) => config.domain.toString() === selectedChain
    );
    return [...orders]
      .map((order) => ({
        ...order,
        chainId: selectedChain,
        chainName: chainConfig?.name || "",
      }))
      .sort((a, b) => {
        const multiplier = sortDirection === "asc" ? 1 : -1;
        switch (sortField) {
          case "amount":
            return (Number(a.amount) - Number(b.amount)) * multiplier;
          case "profit":
            return (Number(a.profit) - Number(b.profit)) * multiplier;
          case "timestamp":
            return (a.timestamp - b.timestamp) * multiplier;
          default:
            return 0;
        }
      });
  };

  if (isError) {
    return (
      <div className="p-6">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">
            Failed to fetch dashboard data. Please try again later.
          </span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>

          {/* Summary Metrics Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>

          {/* Chain Profits Skeleton */}
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>

          {/* Settlement Details Skeleton */}
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="bg-white p-6 rounded-lg shadow overflow-x-auto mb-8">
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 bg-gray-200 rounded w-24"></div>
              ))}
            </div>
            <table className="min-w-full">
              <thead>
                <tr>
                  {["Order ID", "Amount", "Profit", "Time"].map((header) => (
                    <th key={header} className="text-left px-4 py-2">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="border-t">
                    <td className="px-4 py-2">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Chain Balances Skeleton */}
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>

          {/* Gas Balances Skeleton */}
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="bg-white p-6 rounded-lg shadow overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  {["Chain", "Gas Token", "Balance"].map((header) => (
                    <th key={header} className="text-left px-4 py-2">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map((i) => (
                  <tr key={i} className="border-t">
                    <td className="px-4 py-2">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  const totalVolume = (profitMetrics || []).reduce(
    (acc, metric) => acc + (metric?.metrics?.totalVolume || BigInt(0)),
    BigInt(0)
  );
  const totalFees = (profitMetrics || []).reduce(
    (acc, metric) => acc + (metric?.metrics?.totalFees || BigInt(0)),
    BigInt(0)
  );
  const totalOrders = (profitMetrics || []).reduce(
    (acc, metric) => acc + (metric?.metrics?.totalOrders || 0),
    0
  );

  const largestOrder = Object.values(chainProfits || {}).reduce(
    (max, chain) => {
      if (!chain?.ordersWithProfits) return max;
      const chainMax = chain.ordersWithProfits.reduce(
        (acc, order) => Math.max(acc, Number(order.amount)),
        0
      );
      return Math.max(max, chainMax);
    },
    0
  );

  return (
    <div>
      {/* Header */}
      <div className="bg-white shadow-lg relative z-10">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">
                <span className="text-black">Skip Go Gas Solver Dashboard</span>
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">{user?.email}</span>
              <button
                onClick={signOut}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 relative z-10">
        {isError && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">
              Failed to fetch dashboard data. Please try again later.
            </span>
          </div>
        )}

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <h2 className="text-xl font-semibold mb-2 t">
              Total Orders Settled
            </h2>
            <p className="text-3xl">{totalOrders}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <h2 className="text-xl font-semibold mb-2 text-skip-pink">
              Total Volume Alltime
            </h2>
            <p className="text-3xl ">
              $
              {(Number(totalVolume) / 1e6).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <h2 className="text-xl font-semibold mb-2 text-skip-yellow">
              Total Fees Alltime
            </h2>
            <p className="text-3xl text-green-600">
              $
              {(Number(totalFees) / 1e6).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="text-sm text-gray-500">
              {totalVolume > 0
                ? ((Number(totalFees) / Number(totalVolume)) * 100).toFixed(3)
                : "0.000"}
              % fee
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <h2 className="text-xl font-semibold mb-2 text-skip-blue">
              Largest Order
            </h2>
            <p className="text-3xl">${largestOrder.toLocaleString()}</p>
            <p className="text-sm text-gray-500">
              Fee {(largestOrder * 0.001).toFixed(4)} USDC
            </p>
          </div>
        </div>

        {/* Chain Profits */}
        <h2 className="text-2xl font-bold mb-4 text-skip-pink">
          Chain Profits
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {CHAIN_CONFIGS.map((config) => {
            const profits = chainProfits?.[config.domain.toString()];
            if (!profits) return null;

            return (
              <div
                key={config.domain}
                className={`bg-white p-6 rounded-lg shadow-lg transition-all duration-200 cursor-pointer hover:shadow-xl ${
                  selectedChain === config.domain.toString()
                    ? "ring-2 ring-skip-blue"
                    : "hover:ring-2 hover:ring-skip-pink"
                }`}
                onClick={() => setSelectedChain(config.domain.toString())}
              >
                <h3 className="text-lg font-semibold mb-2">{config.name}</h3>
                <div className="text-2xl font-bold text-green-600">
                  {Number(profits.totalProfit).toLocaleString()} USDC
                </div>
                <div className="text-sm text-gray-500">
                  From {profits.ordersWithProfits.length} orders
                </div>
              </div>
            );
          })}
        </div>

        {/* Settlement Details Table */}
        <h2 className="text-2xl font-bold mb-4">Settlement Details</h2>
        <div className="bg-white p-6 rounded-lg shadow overflow-x-auto mb-8">
          <div className="flex gap-2 mb-4">
            {CHAIN_CONFIGS.map((config) => (
              <button
                key={config.domain}
                className={`px-4 py-2 rounded-lg ${
                  selectedChain === config.domain.toString()
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
                onClick={() => setSelectedChain(config.domain.toString())}
              >
                {config.name}
              </button>
            ))}
          </div>
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="text-left px-4 py-2">Order ID</th>
                <th
                  className="text-left px-4 py-2 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort("amount")}
                >
                  Amount (USDC){" "}
                  {sortField === "amount" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="text-left px-4 py-2 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort("profit")}
                >
                  Profit (USDC){" "}
                  {sortField === "profit" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="text-left px-4 py-2 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort("timestamp")}
                >
                  Time{" "}
                  {sortField === "timestamp" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </th>
              </tr>
            </thead>
            <tbody>
              {chainProfits?.[selectedChain]?.ordersWithProfits &&
                getSortedOrders(
                  chainProfits[selectedChain].ordersWithProfits
                ).map((order) => (
                  <tr key={order.orderId} className="border-t">
                    <td className="px-4 py-2 font-medium">
                      {order.orderId.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-2">
                      {Number(order.amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-green-600">
                      {Number(order.profit).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-gray-500">
                      {new Date(order.timestamp * 1000).toLocaleString()}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {/* Chain Balances */}
        <h2 className="text-2xl font-bold mb-4">Chain Balances</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {(chainBalances || []).map((balance) => (
            <div
              key={balance.chainId}
              className="bg-white p-6 rounded-lg shadow"
            >
              <h3 className="text-lg font-semibold mb-2">
                {balance.chainName}
              </h3>
              <p className="text-2xl">{balance.balance.toFixed(2)} USDC</p>
            </div>
          ))}
        </div>

        {/* Gas Balances */}
        <h2 className="text-2xl font-bold mb-4">Gas Balances</h2>
        <div className="bg-white p-6 rounded-lg shadow overflow-x-auto mb-8">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="text-left px-4 py-2">Chain</th>
                <th className="text-left px-4 py-2">Gas Token</th>
                <th className="text-left px-4 py-2">Balance</th>
              </tr>
            </thead>
            <tbody>
              {(gasMetrics || []).map((metric, index) => (
                <tr key={index} className="border-t">
                  <td className="px-4 py-2">
                    {metric.metric.source_chain_name}
                  </td>
                  <td className="px-4 py-2">
                    {metric.metric.gas_token_symbol}
                  </td>
                  <td className="px-4 py-2">
                    {Number(metric.value[1]).toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
