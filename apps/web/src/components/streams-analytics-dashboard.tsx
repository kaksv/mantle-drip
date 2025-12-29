"use client";

import { useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { useStreamAnalyticsComplete } from "@/lib/hooks/useStreamAnalytics";
import { StreamsDataTable } from "./streams-data-table";
import { PieChart, PieChartData } from "./charts/PieChart";
import { BarChart, BarChartData } from "./charts/BarChart";
import { LineChart, LineChartData } from "./charts/LineChart";
import { AreaChart, AreaChartData } from "./charts/AreaChart";
import { StreamStatus } from "@/lib/utils/stream-analytics";
import { Loader2, Download, ChevronDown } from "lucide-react";
import { useMemo } from "react";
import { formatUnits } from "viem";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { toast } from "sonner";
import {
  prepareAllStreamsForExport,
  generateAllStreamsCSV,
  generateAllStreamsExportFilename,
} from "@/lib/utils/stream-export";
import { downloadCSV } from "@/lib/utils/csv-export";
import { generateStreamsPDF, downloadPDF } from "@/lib/utils/pdf-export";
import { getContractAddress } from "@/lib/contracts/config";
import { CELO_SEPOLIA_ID, CELO_MAINNET_ID, CELO_ALFAJORES_ID } from "@/lib/contracts/config";

export function StreamsAnalyticsDashboard() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { streamsAnalytics, aggregated, timeBased, isLoading, error } = useStreamAnalyticsComplete(
    address as `0x${string}` | undefined
  );
  const [isExporting, setIsExporting] = useState(false);

  // Prepare chart data
  const statusDistributionData = useMemo<PieChartData[]>(() => {
    if (!aggregated) return [];
    return [
      {
        name: "Active",
        value: aggregated.activeStreamsCount,
        color: "hsl(var(--chart-1))",
      },
      {
        name: "Paused",
        value: aggregated.pausedStreamsCount,
        color: "hsl(var(--chart-2))",
      },
      {
        name: "Completed",
        value: aggregated.completedStreamsCount,
        color: "hsl(var(--chart-3))",
      },
      {
        name: "Cancelled",
        value: aggregated.cancelledStreamsCount,
        color: "hsl(var(--chart-5))",
      },
    ].filter((item) => item.value > 0);
  }, [aggregated]);

  const depositsByTokenData = useMemo<BarChartData[]>(() => {
    if (!aggregated) return [];
    return Object.entries(aggregated.totalDepositsFormatted).map(([token, amount]) => {
      const tokenInfo = streamsAnalytics.find((s) => s.token === token);
      return {
        name: tokenInfo?.tokenSymbol || "Unknown",
        deposit: parseFloat(amount),
      };
    });
  }, [aggregated, streamsAnalytics]);

  const tokenDistributionData = useMemo<PieChartData[]>(() => {
    if (!aggregated) return [];
    return Object.entries(aggregated.streamsByToken).map(([token, count], index) => {
      const tokenInfo = streamsAnalytics.find((s) => s.token === token);
      const colors = [
        "hsl(var(--chart-1))",
        "hsl(var(--chart-2))",
        "hsl(var(--chart-3))",
        "hsl(var(--chart-4))",
        "hsl(var(--chart-5))",
      ];
      return {
        name: tokenInfo?.tokenSymbol || "Unknown",
        value: count,
        color: colors[index % colors.length],
      };
    });
  }, [aggregated, streamsAnalytics]);

  const recipientsDistributionData = useMemo<BarChartData[]>(() => {
    if (!streamsAnalytics || streamsAnalytics.length === 0) return [];
    // Group by recipient count ranges
    const ranges: Record<string, number> = {
      "1": 0,
      "2-5": 0,
      "6-10": 0,
      "11+": 0,
    };

    streamsAnalytics.forEach((stream) => {
      const count = stream.totalRecipients;
      if (count === 1) ranges["1"]++;
      else if (count >= 2 && count <= 5) ranges["2-5"]++;
      else if (count >= 6 && count <= 10) ranges["6-10"]++;
      else ranges["11+"]++;
    });

    return Object.entries(ranges)
      .filter(([_, count]) => count > 0)
      .map(([range, count]) => ({
        name: `${range} recipients`,
        count,
      }));
  }, [streamsAnalytics]);

  const outflowOverTimeData = useMemo<AreaChartData[]>(() => {
    if (!timeBased || !aggregated) return [];
    // Use monthly data if available, otherwise create sample data
    const monthlyData = timeBased.monthly;
    const tokens = Object.keys(monthlyData);
    
    if (tokens.length === 0) {
      // Create sample data from streams
      const months: Record<string, { distributed: bigint; withdrawn: bigint }> = {};
      streamsAnalytics.forEach((stream) => {
        const date = new Date(Number(stream.startTime) * 1000);
        const monthKey = date.toISOString().substring(0, 7); // YYYY-MM
        
        if (!months[monthKey]) {
          months[monthKey] = { distributed: 0n, withdrawn: 0n };
        }
        months[monthKey].distributed += stream.totalDistributed;
        months[monthKey].withdrawn += stream.totalWithdrawn;
      });

      // Use the first stream's token decimals for formatting
      const firstStream = streamsAnalytics[0];
      const decimals = firstStream?.tokenDecimals || 18;
      
      return Object.entries(months)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]) => ({
          name: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" }),
          distributed: Number(formatUnits(data.distributed, decimals)),
          withdrawn: Number(formatUnits(data.withdrawn, decimals)),
        }));
    }

    // Use actual time-based data
    const firstToken = tokens[0];
    return monthlyData[firstToken].map((entry) => ({
      name: new Date(entry.month + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      distributed: Number(formatUnits(entry.distributed, 18)),
      withdrawn: Number(formatUnits(entry.withdrawn, 18)),
    }));
  }, [timeBased, aggregated, streamsAnalytics]);

  const withdrawalActivityData = useMemo<LineChartData[]>(() => {
    if (!streamsAnalytics || streamsAnalytics.length === 0) return [];
    // Group withdrawals by month
    const months: Record<string, bigint> = {};
    streamsAnalytics.forEach((stream) => {
      const date = new Date(Number(stream.startTime) * 1000);
      const monthKey = date.toISOString().substring(0, 7);
      
      if (!months[monthKey]) {
        months[monthKey] = 0n;
      }
      months[monthKey] += stream.totalWithdrawn;
    });

    // Use the first stream's token decimals for formatting
    const firstStream = streamsAnalytics[0];
    const decimals = firstStream?.tokenDecimals || 18;
    
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, withdrawn]) => ({
        name: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        withdrawn: Number(formatUnits(withdrawn, decimals)),
      }));
  }, [streamsAnalytics]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card rounded-lg p-8 text-center">
        <p className="text-destructive">Error loading analytics: {error.message}</p>
      </div>
    );
  }

  if (!streamsAnalytics || streamsAnalytics.length === 0) {
    return (
      <div className="glass-card rounded-lg p-8 text-center">
        <p className="text-muted-foreground">No streams data available</p>
      </div>
    );
  }

  // Export handler
  const handleExport = async (
    format: "csv" | "pdf",
    filterType: "all" | "active" | "token",
    tokenAddress?: string
  ) => {
    if (!address || !streamsAnalytics || streamsAnalytics.length === 0) {
      toast.error("No streams data to export");
      return;
    }

    setIsExporting(true);
    try {
      const contractAddress = getContractAddress(chainId, "DripCore");
      if (!contractAddress) {
        toast.error("Contract address not found for current network");
        return;
      }

      // Get explorer URL
      const explorerUrls: Record<number, string> = {
        [CELO_MAINNET_ID]: "https://celoscan.io",
        [CELO_SEPOLIA_ID]: "https://celo-sepolia.blockscout.com",
        [CELO_ALFAJORES_ID]: "https://alfajores-blockscout.celo-testnet.org",
      };
      const explorerUrl = explorerUrls[chainId] || "";

      // Prepare filter options
      const filterOptions =
        filterType === "active"
          ? { activeOnly: true }
          : filterType === "token" && tokenAddress
          ? { token: tokenAddress }
          : undefined;

      // Prepare all streams for export
      const exportData = prepareAllStreamsForExport(
        streamsAnalytics,
        chainId,
        contractAddress,
        explorerUrl,
        address,
        filterOptions
      );

      // Prepare summary statistics
      const summaryStats = aggregated
        ? {
            totalStreams: aggregated.totalStreams,
            activeStreams: aggregated.activeStreamsCount,
            pausedStreams: aggregated.pausedStreamsCount,
            completedStreams: aggregated.completedStreamsCount,
            cancelledStreams: aggregated.cancelledStreamsCount,
            totalDeposits: aggregated.totalDepositsFormatted,
            totalDistributed: aggregated.totalDistributedFormatted,
            totalRecipients: aggregated.totalRecipients,
          }
        : undefined;

      // Generate and download based on format
      const filename = generateAllStreamsExportFilename(filterType, true);

      if (format === "csv") {
        // Generate CSV
        const csvContent = generateAllStreamsCSV(exportData, summaryStats);
        downloadCSV(csvContent, filename);
        toast.success(`Exported ${exportData.length} stream(s) to CSV`);
      } else {
        // Generate PDF
        const pdfDoc = generateStreamsPDF(exportData, summaryStats);
        downloadPDF(pdfDoc, filename);
        toast.success(`Exported ${exportData.length} stream(s) to PDF`);
      }
    } catch (error: any) {
      console.error("Export error:", error);
      toast.error(`Failed to export: ${error.message || "Unknown error"}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Get unique tokens for token filter
  const uniqueTokens = useMemo(() => {
    const tokens = new Set<string>();
    streamsAnalytics.forEach((stream) => tokens.add(stream.token));
    return Array.from(tokens).map((token) => {
      const stream = streamsAnalytics.find((s) => s.token === token);
      return {
        address: token,
        symbol: stream?.tokenSymbol || "Unknown",
      };
    });
  }, [streamsAnalytics]);

  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Streams Analytics</h2>
          <p className="text-muted-foreground text-sm">
            Comprehensive analytics and data for all your streams
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={isExporting || isLoading}>
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                  <ChevronDown className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Export as CSV
            </div>
            <DropdownMenuItem onClick={() => handleExport("csv", "all")}>
              All Streams (CSV)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("csv", "active")}>
              Active Streams Only (CSV)
            </DropdownMenuItem>
            {uniqueTokens.length > 0 && (
              <>
                {uniqueTokens.map((token) => (
                  <DropdownMenuItem
                    key={`csv-${token.address}`}
                    onClick={() => handleExport("csv", "token", token.address)}
                  >
                    {token.symbol} Streams (CSV)
                  </DropdownMenuItem>
                ))}
              </>
            )}
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2 border-t">
              Export as PDF
            </div>
            <DropdownMenuItem onClick={() => handleExport("pdf", "all")}>
              All Streams (PDF)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("pdf", "active")}>
              Active Streams Only (PDF)
            </DropdownMenuItem>
            {uniqueTokens.length > 0 && (
              <>
                {uniqueTokens.map((token) => (
                  <DropdownMenuItem
                    key={`pdf-${token.address}`}
                    onClick={() => handleExport("pdf", "token", token.address)}
                  >
                    {token.symbol} Streams (PDF)
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stream Status Distribution */}
        <PieChart
          data={statusDistributionData}
          title="Stream Status Distribution"
          description="Breakdown of streams by status"
          height={300}
        />

        {/* Token Distribution */}
        <PieChart
          data={tokenDistributionData}
          title="Token Distribution"
          description="Percentage of streams by token type"
          height={300}
        />

        {/* Total Deposits by Token */}
        <BarChart
          data={depositsByTokenData}
          dataKeys={[{ key: "deposit", name: "Total Deposit" }]}
          title="Total Deposits by Token"
          description="Compare deposits across different tokens"
          height={300}
          yAxisLabel="Amount"
          formatter={(value) => `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
        />

        {/* Recipients Distribution */}
        <BarChart
          data={recipientsDistributionData}
          dataKeys={[{ key: "count", name: "Number of Streams" }]}
          title="Recipients Distribution"
          description="Number of streams by recipient count"
          height={300}
          yAxisLabel="Streams"
        />

        {/* Outflow Over Time */}
        <AreaChart
          data={outflowOverTimeData}
          dataKeys={[
            { key: "distributed", name: "Distributed", color: "hsl(var(--chart-1))" },
            { key: "withdrawn", name: "Withdrawn", color: "hsl(var(--chart-2))" },
          ]}
          title="Outflow Over Time"
          description="Monthly distribution and withdrawal trends"
          height={300}
          yAxisLabel="Amount"
          formatter={(value) => `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
          stacked={false}
        />

        {/* Withdrawal Activity */}
        <LineChart
          data={withdrawalActivityData}
          dataKeys={[{ key: "withdrawn", name: "Total Withdrawn" }]}
          title="Withdrawal Activity"
          description="Total withdrawals over time"
          height={300}
          yAxisLabel="Amount"
          formatter={(value) => `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
        />
      </div>

      {/* Streams Data Table */}
      <StreamsDataTable streams={streamsAnalytics} isLoading={isLoading} />
    </div>
  );
}

