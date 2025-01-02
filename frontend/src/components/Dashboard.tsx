import React, { Fragment } from "react";
import { useDashboard } from "../hooks/useDashboard";
import { CHAIN_CONFIGS } from "../utils/metrics";
import { useAuth } from "../context/AuthContext";
import { SettlementsGrid } from "./grids/SettlementsGrid";
import { fromDomainToChainName } from "../utils/string";
import { GasGrid } from "./grids/GasGrid";
import { RiUserLine } from "@remixicon/react";
import {
  Menu,
  MenuButton,
  MenuItems,
  MenuItem,
  Transition,
} from "@headlessui/react";

import { AreaChart } from "./charts";

const transformChainProfitsToChartData = (chainProfits: any) => {
  if (!chainProfits) return [];

  // Create a map of dates to chain profits
  const profitsByDate = new Map();

  // Process each chain's orders
  Object.entries(chainProfits).forEach(([chainId, data]: [string, any]) => {
    if (!data?.ordersWithProfits?.length) return;

    data.ordersWithProfits.forEach((order: any) => {
      const date = new Date(order.timestamp * 1000);
      const dateStr = date.toISOString().split("T")[0];

      if (!profitsByDate.has(dateStr)) {
        const initialChainValues: Record<string, number> = {};
        CHAIN_CONFIGS.forEach((config) => {
          initialChainValues[config.name] = 0;
        });
        profitsByDate.set(dateStr, { date: dateStr, ...initialChainValues });
      }

      const chainName = CHAIN_CONFIGS.find(
        (config) => config.domain.toString() === chainId
      )?.name;

      if (chainName) {
        const currentValue = profitsByDate.get(dateStr)[chainName] || 0;
        // Parse the profit value and ensure it's a proper number
        const profit = parseFloat(order.profit);
        if (!isNaN(profit)) {
          profitsByDate.get(dateStr)[chainName] = currentValue + profit;
        }
      }
    });
  });

  // Convert to array and sort by date
  const result = Array.from(profitsByDate.values())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((day) => {
      // Ensure all values are proper numbers
      const processed = { ...day };
      CHAIN_CONFIGS.forEach((config) => {
        processed[config.name] = Number(processed[config.name] || 0);
      });
      return processed;
    });

  return result;
};

export const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();

  const {
    profitMetrics,
    chainProfits,
    selectedChain,
    setSelectedChain,
    isLoading,
    isError,
    syncStatus,
    gasInfo,
  } = useDashboard();

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
      <div className="p-6 bg-vercel-background">
        <div className="animate-pulse">
          <div className="h-8 bg-vercel-card-background rounded w-1/3 mb-8"></div>

          {/* Summary Metrics Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-vercel-card-background border border-vercel-border rounded-lg shadow p-6"
              >
                <div className="h-4 bg-vercel-muted rounded w-2/3 mb-4"></div>
                <div className="h-8 bg-vercel-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>

          {/* Chain Profits Skeleton */}
          <div className="h-6 bg-vercel-card-background rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-vercel-card-background border border-vercel-border rounded-lg shadow p-6"
              >
                <div className="h-4 bg-vercel-muted rounded w-1/3 mb-2"></div>
                <div className="h-6 bg-vercel-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-vercel-muted rounded w-1/4"></div>
              </div>
            ))}
          </div>

          {/* Settlement Details Skeleton */}
          <div className="h-6 bg-vercel-card-background rounded w-1/4 mb-4"></div>
          <div className="bg-vercel-card-background border border-vercel-border rounded-lg overflow-x-auto mb-8">
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 bg-vercel-muted rounded w-24"></div>
              ))}
            </div>
            <table className="min-w-full">
              <thead>
                <tr>
                  {["Order ID", "Amount", "Profit", "Time"].map((header) => (
                    <th key={header} className="text-left px-4 py-2">
                      <div className="h-4 bg-vercel-muted rounded w-20"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="border-t">
                    <td className="px-4 py-2">
                      <div className="h-4 bg-vercel-muted rounded w-16"></div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="h-4 bg-vercel-muted rounded w-24"></div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="h-4 bg-vercel-muted rounded w-20"></div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="h-4 bg-vercel-muted rounded w-32"></div>
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
    (acc, metric) => acc + (metric?.metrics?.settledOrders || 0),
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

  const allSettlements = Object.entries(chainProfits || {}).flatMap(
    ([chainId, data]) =>
      data.ordersWithProfits.map((order) => ({
        ...order,
        chainId,
        chainName:
          CHAIN_CONFIGS.find((config) => config.domain.toString() === chainId)
            ?.name || chainId,
      }))
  );

  const chartData = transformChainProfitsToChartData(chainProfits);

  return (
    <div className="min-h-screen bg-vercel-background text-vercel-foreground">
      {/* Header */}
      <div className="border-b border-vercel-border bg-vercel-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-4 gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto justify-center sm:justify-start">
              <img
                src="/favicon.svg"
                alt="Skip Go Fast Solver"
                className="w-22 h-22"
              />
              <h1 className="text-2xl font-bold text-vercel-foreground">
                Skip Go Fast Solver Dashboard
              </h1>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
              {syncStatus.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-vercel-card-foreground text-sm">
                    Last sync:{" "}
                    {new Date(syncStatus[0].lastSyncTime).toLocaleString()}
                  </span>
                  <div className="w-2 h-2 rounded-full bg-vercel-success animate-pulse"></div>
                </div>
              )}

              <Menu as="div" className="relative">
                <MenuButton className="size-10 rounded-full items-center justify-center flex bg-vercel-card-background border border-vercel-border hover:bg-vercel-card-hovered transition-colors">
                  <RiUserLine className="text-vercel-foreground" size={20} />
                </MenuButton>

                <MenuItems className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-lg bg-vercel-card-background border border-vercel-border shadow-lg focus:outline-none">
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <div>
                      <div className="px-4 py-3 border-b border-vercel-border">
                        <p className="text-sm text-vercel-secondary">
                          Signed in as
                        </p>
                        <p className="truncate text-sm font-medium text-vercel-foreground">
                          {user?.email}
                        </p>
                      </div>

                      <div className="py-1">
                        <MenuItem>
                          {({ active }) => (
                            <button
                              onClick={signOut}
                              className={`block w-full px-4 py-2 text-left text-sm ${
                                active
                                  ? "bg-vercel-card-hovered text-vercel-foreground"
                                  : "text-vercel-secondary"
                              }`}
                            >
                              Sign out
                            </button>
                          )}
                        </MenuItem>
                      </div>
                    </div>
                  </Transition>
                </MenuItems>
              </Menu>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
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
          <div className="bg-vercel-card-background border border-vercel-border p-6 rounded-lg hover:bg-vercel-card-hovered transition-all">
            <h2 className="text-xl font-semibold mb-2 text-vercel-foreground">
              Total Orders Settled
            </h2>
            <p className="text-3xl text-vercel-foreground">{totalOrders}</p>
          </div>

          <div className="bg-vercel-card-background border border-vercel-border p-6 rounded-lg hover:bg-vercel-card-hovered transition-all">
            <h2 className="text-xl font-semibold mb-2 text-vercel-foreground">
              Total Volume All Time
            </h2>
            <p className="text-3xl text-vercel-foreground">
              $
              {(Number(totalVolume) / 1e6).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          <div className="bg-vercel-card-background border border-vercel-border p-6 rounded-lg hover:bg-vercel-card-hovered transition-all">
            <h2 className="text-xl font-semibold mb-2 text-vercel-foreground">
              Total Fees All Time
            </h2>
            <p className="text-3xl text-vercel-success">
              $
              {(Number(totalFees) / 1e6).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="text-sm text-vercel-secondary">
              {totalVolume > 0
                ? ((Number(totalFees) / Number(totalVolume)) * 100).toFixed(3)
                : "0.000"}
              % fee
            </p>
          </div>

          <div className="bg-vercel-card-background border border-vercel-border p-6 rounded-lg hover:bg-vercel-card-hovered transition-all">
            <h2 className="text-xl font-semibold mb-2 text-vercel-foreground">
              Largest Order
            </h2>
            <p className="text-3xl text-vercel-foreground">
              ${largestOrder.toLocaleString()}
            </p>
            <p className="text-sm text-vercel-secondary">
              Fee {(largestOrder * 0.001).toFixed(4)} USDC
            </p>
          </div>
        </div>

        {/* Chain Profits */}
        <h2 className="text-2xl font-bold mb-4 text-vercel-foreground">
          Chain Profits
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {CHAIN_CONFIGS.map((config) => {
            const profits = chainProfits?.[config.domain.toString()];
            if (!profits) return null;

            return (
              <div
                key={config.domain}
                className={`bg-vercel-card-background border border-vercel-border p-6 rounded-lg transition-all cursor-pointer
                  ${
                    selectedChain === config.domain.toString()
                      ? "ring-2 ring-vercel-primary"
                      : "hover:bg-vercel-card-hovered"
                  }`}
                onClick={() =>
                  setSelectedChain(
                    selectedChain === config.domain.toString()
                      ? ""
                      : config.domain.toString()
                  )
                }
              >
                <h3 className="text-lg font-semibold mb-2 text-vercel-foreground">
                  {config.name}
                </h3>
                <div className="text-2xl font-bold text-vercel-success">
                  {Number(profits.totalProfit).toLocaleString()} USDC
                </div>
                <div className="text-sm text-vercel-secondary">
                  From {profits.ordersWithProfits.length} orders
                </div>
              </div>
            );
          })}
        </div>

        {/* Settlements Grid */}
        <h2 className="text-2xl font-bold mb-4">
          {selectedChain
            ? `${fromDomainToChainName(selectedChain)} Settlements`
            : "All Settlements"}
        </h2>
        <div className="mb-8">
          {chainProfits && allSettlements.length > 0 ? (
            <SettlementsGrid
              settlements={allSettlements}
              selectedChain={selectedChain}
            />
          ) : (
            <div className="p-4 text-gray-500 bg-white rounded-lg shadow">
              No settlements data available
            </div>
          )}
        </div>

        {/* Settlements Grid */}
        <h2 className="text-2xl font-bold mb-4">Gas Balances</h2>
        <div className="mb-8">
          {gasInfo ? (
            <GasGrid gasInfo={gasInfo} />
          ) : (
            <div className="p-4 text-gray-500 bg-white rounded-lg shadow">
              No gas data available
            </div>
          )}
        </div>
        <h2 className="text-2xl font-bold mb-4">Daily Profits</h2>
        <div className="relative bg-vercel-card-background border border-vercel-border p-4 rounded-lg w-full h-full">
          <AreaChart
            className="h-80"
            data={chartData}
            index="date"
            categories={CHAIN_CONFIGS.map((config) => config.name)}
            valueFormatter={(number: number) =>
              `$${number.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`
            }
            showLegend={true}
            showGridLines={true}
            startEndOnly={false}
            showXAxis={true}
            showYAxis={true}
            allowDecimals={true}
            autoMinValue={true}
            connectNulls={true}
            yAxisLabel="Profit (USDC)"
            xAxisLabel="Date"
            minValue={0}
            onValueChange={(v) => v}
            tickGap={50}
            intervalType="equidistantPreserveStart"
          />
        </div>
      </div>
    </div>
  );
};
