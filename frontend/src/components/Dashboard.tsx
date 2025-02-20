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
import { DonutChart, DonutChartEventProps } from "./charts/DonutChart";
import { TooltipProps } from "./charts/DonutChart";

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

const transformChainFeesToChartData = (profitMetrics: any) => {
  if (!profitMetrics) return [];

  return profitMetrics
    .map((metric: any) => ({
      name:
        CHAIN_CONFIGS.find(
          (config) => config.domain.toString() === metric.chainId
        )?.name || metric.chainId,
      amount: Number(metric.metrics?.totalFees || 0) / 1e6, // Convert from BigInt to number and adjust decimals
    }))
    .filter((item: any) => item.amount > 0);
};

// Add this helper function at the top level
const getChainIdFromName = (chainName: string) => {
  const chain = CHAIN_CONFIGS.find((config) => config.name === chainName);
  return chain?.domain.toString() || null;
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

  const [selectedFee, setSelectedFee] = React.useState<TooltipProps | null>(
    null
  );

  const [selectedDonutSection, setSelectedDonutSection] = React.useState<
    string | null
  >(null);

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
      <div className="min-h-screen bg-vercel-background text-vercel-foreground">
        {/* Header - Always visible */}
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
                {/* Sync Status Skeleton */}
                <div className="flex items-center gap-2">
                  <div className="h-4 bg-vercel-muted rounded w-40"></div>
                  <div className="w-2 h-2 rounded-full bg-vercel-muted"></div>
                </div>

                <div className="size-10 rounded-full items-center justify-center flex bg-vercel-card-background border border-vercel-border">
                  <div className="h-5 w-5 bg-vercel-muted rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 bg-vercel-background">
          <div className="animate-pulse">
            {/* Summary Metrics Skeleton - Updated to 5 columns */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="bg-vercel-card-background border border-vercel-border rounded-lg p-6"
                >
                  <div className="h-6 bg-vercel-muted rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-vercel-muted rounded w-2/3"></div>
                  {i === 1 && (
                    <div className="h-4 bg-vercel-muted rounded w-1/2 mt-2"></div>
                  )}
                </div>
              ))}
            </div>

            {/* Chain Profits Section */}
            <div className="h-8 bg-vercel-muted rounded w-40 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-vercel-card-background border border-vercel-border rounded-lg p-6"
                >
                  <div className="h-6 bg-vercel-muted rounded w-1/3 mb-4"></div>
                  <div className="h-8 bg-vercel-muted rounded w-2/3 mb-2"></div>
                  <div className="h-4 bg-vercel-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>

            {/* Settlements Section */}
            <div className="h-8 bg-vercel-muted rounded w-48 mb-4"></div>
            <div className="bg-vercel-card-background border border-vercel-border rounded-lg p-4 mb-8">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      {[
                        "Chain",
                        "Order ID",
                        "Amount",
                        "Profit",
                        "Time",
                        "Actions",
                      ].map((header) => (
                        <th
                          key={header}
                          className="text-left px-4 py-2 border-b border-vercel-border"
                        >
                          <div className="h-4 bg-vercel-muted rounded w-20"></div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 border-b border-vercel-border">
                          <div className="h-4 bg-vercel-muted rounded w-24"></div>
                        </td>
                        <td className="px-4 py-3 border-b border-vercel-border">
                          <div className="h-4 bg-vercel-muted rounded w-32"></div>
                        </td>
                        <td className="px-4 py-3 border-b border-vercel-border">
                          <div className="h-4 bg-vercel-muted rounded w-24"></div>
                        </td>
                        <td className="px-4 py-3 border-b border-vercel-border">
                          <div className="h-4 bg-vercel-muted rounded w-20"></div>
                        </td>
                        <td className="px-4 py-3 border-b border-vercel-border">
                          <div className="h-4 bg-vercel-muted rounded w-32"></div>
                        </td>
                        <td className="px-4 py-3 border-b border-vercel-border">
                          <div className="h-4 bg-vercel-muted rounded w-16"></div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Gas Section */}
            <div className="h-8 bg-vercel-muted rounded w-36 mb-4"></div>
            <div className="bg-vercel-card-background border border-vercel-border rounded-lg p-4 mb-8">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      {["Chain", "Balance", "Deposited", "USD Value"].map(
                        (header) => (
                          <th
                            key={header}
                            className="text-left px-4 py-2 border-b border-vercel-border"
                          >
                            <div className="h-4 bg-vercel-muted rounded w-24"></div>
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4].map((i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 border-b border-vercel-border">
                          <div className="h-4 bg-vercel-muted rounded w-24"></div>
                        </td>
                        <td className="px-4 py-3 border-b border-vercel-border">
                          <div className="h-4 bg-vercel-muted rounded w-32"></div>
                        </td>
                        <td className="px-4 py-3 border-b border-vercel-border">
                          <div className="h-4 bg-vercel-muted rounded w-28"></div>
                        </td>
                        <td className="px-4 py-3 border-b border-vercel-border">
                          <div className="h-4 bg-vercel-muted rounded w-24"></div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Chart Section */}
            <div className="h-8 bg-vercel-muted rounded w-36 mb-4"></div>
            <div className="bg-vercel-card-background border border-vercel-border p-4 rounded-lg">
              <div className="h-80 bg-vercel-muted rounded"></div>
            </div>
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
  const totalOrdersTotal = (profitMetrics || []).reduce(
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

  const profitCalculations = {
    totalProfit: (profitMetrics || []).reduce(
      (acc, metric) => acc + (metric?.metrics?.totalFees || BigInt(0)),
      BigInt(0)
    ),
    gasSpent: Object.values(gasInfo || {}).reduce((acc, chain) => {
      // Calculate how much gas was spent (deposited - current balance)
      const spent = chain.totalDepositedUSD - chain.currentBalanceUSD;
      return acc + spent;
    }, 0),
    get netProfit() {
      // Convert totalProfit from BigInt (with 6 decimals) to number
      const totalProfitUSD = Number(this.totalProfit) / 1e6;
      return totalProfitUSD - this.gasSpent;
    },
  };

  const handleDonutChartSelection = (value: DonutChartEventProps) => {
    if (value && "categoryClicked" in value) {
      const chainName = value.categoryClicked;
      setSelectedDonutSection((prev) =>
        prev === chainName ? null : chainName
      );

      // Update selectedChain when donut selection changes
      if (chainName) {
        const chainId = getChainIdFromName(chainName);
        if (chainId) {
          setSelectedChain(chainId);
        }
      } else {
        // Set to empty string to show all settlements
        setSelectedChain("");
      }
    } else {
      setSelectedDonutSection(null);
      // Set to empty string to show all settlements
      setSelectedChain("");
    }
  };

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

        {/* Info Card */}
        <div className="bg-vercel-card-background border border-vercel-border p-6 rounded-lg transition-all mb-8">
          {/* Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-vercel-foreground">
              Chandra Station Solver Metrics
            </h1>
          </div>

          {/* Content Row - Modified for mobile responsiveness */}
          <div className="flex flex-col lg:flex-row gap-6 mb-4">
            {/* Donut Chart Section */}
            <div className="w-full lg:w-1/4">
              <div className="bg-vercel-card-background border border-vercel-border p-6 rounded-lg hover:bg-vercel-card-hovered transition-all">
                <div className="flex flex-col justify-center items-center h-full">
                  <p className="text-xl font-semibold text-vercel-success transition-all duration-300 ease-in-out">
                    $
                    <span className="inline-block transition-all duration-300 ease-in-out">
                      {selectedDonutSection
                        ? transformChainFeesToChartData(profitMetrics)
                            .find((item) => item.name === selectedDonutSection)
                            ?.amount.toLocaleString()
                        : selectedFee?.payload?.[0]?.value?.toLocaleString() ??
                          (Number(totalFees) / 1e6).toLocaleString()}
                    </span>
                  </p>
                  <p className="text-sm text-vercel-foreground mb-4 h-5 transition-all duration-300 ease-in-out">
                    {selectedDonutSection
                      ? `${selectedDonutSection} Fees`
                      : selectedFee?.payload?.[0]?.category
                      ? `${selectedFee.payload[0].category} Fees`
                      : "Total Fees by Chain"}
                  </p>
                  <div className="w-full flex justify-center">
                    <div className=" aspect-square">
                      <DonutChart
                        data={transformChainFeesToChartData(profitMetrics)}
                        category="name"
                        value="amount"
                        onValueChange={handleDonutChartSelection}
                        valueFormatter={(value) => `$${value.toLocaleString()}`}
                        tooltipCallback={(props) => {
                          if (props.active && !selectedDonutSection) {
                            setSelectedFee(props as unknown as TooltipProps);
                          } else if (!props.active && !selectedDonutSection) {
                            setSelectedFee(null);
                          }
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-sm mt-4 text-center text-vercel-tertiary">
                    The total fees earned by the solver from each chain.
                  </p>
                </div>
              </div>
            </div>

            {/* Area Chart */}
            <div className="w-full lg:flex-1 bg-vercel-card-background border border-vercel-border p-6 rounded-lg">
              <div className="h-[300px] lg:h-80">
                <AreaChart
                  className="h-full"
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

          {/* Summary Metrics - Modified grid for mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
            <div className="bg-vercel-card-background border border-vercel-border p-6 rounded-lg hover:bg-vercel-card-hovered transition-all">
              <h2 className="text-xl font-semibold mb-2 text-vercel-foreground">
                Orders Settled / Total Orders
              </h2>
              <p className="text-3xl">
                <span className="text-vercel-success">{totalOrders}</span>

                {" / "}
                <span className="text-red-500">{totalOrdersTotal}</span>
              </p>
              <p className="text-sm text-vercel-secondary">
                {totalOrdersTotal - totalOrders} orders missed
              </p>
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
                Total Profit
              </h2>
              <p className="text-3xl text-vercel-success">
                $
                {profitCalculations.netProfit.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-sm text-vercel-secondary">
                Total Fees - Gas Spent
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
      </div>
    </div>
  );
};
