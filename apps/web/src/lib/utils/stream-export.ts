/**
 * Stream Export Utilities
 * Functions for preparing and exporting stream data to CSV
 */

import { formatTokenAmount } from "./format";
import {
  convertKeyValueToCSV,
  convertToCSV,
  formatAddress,
  formatDate,
  formatDuration,
  combineCSVSections,
} from "./csv-export";
import { getTokenByAddress } from "@/lib/tokens/config";

/**
 * Type definitions for stream export data
 */
export interface StreamExportData {
  stream: {
    id: string;
    title: string;
    description: string;
    sender: string;
    token: {
      symbol: string;
      address: string;
      decimals: number;
    };
    deposit: string;
    startTime: string;
    endTime: string;
    status: string;
    contractAddress: string;
    explorerUrl: string;
  };
  analytics: {
    totalDeposit: string;
    totalDistributed: string;
    totalAvailable: string;
    remainingDeposit: string;
    duration: string;
    elapsed: string;
    remaining?: string;
  };
  recipients: RecipientExportData[];
  metadata: {
    exportedAt: string;
    exportedBy: string;
    network: string;
  };
}

export interface RecipientExportData {
  address: string;
  ratePerSecond: string;
  ratePerHour: string;
  ratePerDay: string;
  totalWithdrawn: string;
  currentAvailable: string;
  totalReceived: string;
  lastWithdrawalTime: string;
  percentageOfDeposit: string;
  percentageOfDistributed: string;
}

export interface RecipientMetrics {
  ratePerSecond: string;
  ratePerHour: string;
  ratePerDay: string;
  totalReceived: string;
  percentageOfDeposit: number;
  percentageOfDistributed: number;
}

/**
 * Calculate derived metrics for a recipient
 * @param recipient - Recipient info object
 * @param totalDeposit - Total stream deposit
 * @param totalDistributed - Total amount distributed to all recipients
 * @param tokenDecimals - Token decimals
 * @returns Calculated metrics
 */
export function calculateRecipientMetrics(
  recipient: any,
  totalDeposit: bigint,
  totalDistributed: bigint,
  tokenDecimals: number
): RecipientMetrics {
  const ratePerSecond = recipient.ratePerSecond || 0n;
  const totalWithdrawn = recipient.totalWithdrawn || 0n;
  const currentAvailable = recipient.currentAccrued || 0n;

  // Calculate rates
  const ratePerSecondFormatted = formatTokenAmount(ratePerSecond, tokenDecimals);
  const ratePerHour = formatTokenAmount(ratePerSecond * 3600n, tokenDecimals);
  const ratePerDay = formatTokenAmount(ratePerSecond * 86400n, tokenDecimals);

  // Calculate total received
  const totalReceived = totalWithdrawn + currentAvailable;
  const totalReceivedFormatted = formatTokenAmount(totalReceived, tokenDecimals);

  // Calculate percentages
  const percentageOfDeposit =
    totalDeposit > 0n
      ? (Number(totalReceived) / Number(totalDeposit)) * 100
      : 0;
  const percentageOfDistributed =
    totalDistributed > 0n
      ? (Number(totalReceived) / Number(totalDistributed)) * 100
      : 0;

  return {
    ratePerSecond: ratePerSecondFormatted,
    ratePerHour,
    ratePerDay,
    totalReceived: totalReceivedFormatted,
    percentageOfDeposit,
    percentageOfDistributed,
  };
}

/**
 * Prepare stream data for export
 * @param streamData - Stream data from contract
 * @param recipientsInfo - Array of recipient info objects
 * @param analytics - Analytics data (calculated values)
 * @param tokenInfo - Token information
 * @param chainId - Chain ID for network identification
 * @param contractAddress - Contract address
 * @param explorerUrl - Block explorer URL
 * @param userAddress - Address of user exporting (for metadata)
 * @returns Prepared export data
 */
export function prepareStreamDataForExport(
  streamData: any,
  recipientsInfo: any[],
  analytics: {
    totalDeposit: bigint;
    totalDistributed: bigint;
    totalAccrued: bigint;
    remainingDeposit: bigint;
    periodSeconds: number;
    elapsed: number;
    remaining?: number;
  },
  tokenInfo: { symbol: string; decimals: number } | null,
  chainId: number,
  contractAddress: string,
  explorerUrl: string,
  userAddress: string
): StreamExportData {
  const decimals = tokenInfo?.decimals || 18;
  const symbol = tokenInfo?.symbol || "Token";

  // Map status number to readable text
  const statusMap: Record<number, string> = {
    0: "Pending",
    1: "Active",
    2: "Paused",
    3: "Cancelled",
    4: "Completed",
  };
  const status = statusMap[Number(streamData.status)] || "Unknown";

  // Get network name
  const networkMap: Record<number, string> = {
    42220: "Celo Mainnet",
    44787: "Celo Alfajores",
    11142220: "Celo Sepolia",
  };
  const network = networkMap[chainId] || `Chain ${chainId}`;

  // Prepare stream section
  const stream = {
    id: streamData.streamId?.toString() || "Unknown",
    title: streamData.title || "",
    description: streamData.description || "",
    sender: streamData.sender || "",
    token: {
      symbol,
      address: streamData.token || "",
      decimals,
    },
    deposit: `${formatTokenAmount(BigInt(streamData.deposit || 0), decimals)} ${symbol}`,
    startTime: formatDate(Number(streamData.startTime || 0)),
    endTime: formatDate(Number(streamData.endTime || 0)),
    status,
    contractAddress,
    explorerUrl,
  };

  // Prepare analytics section
  const analyticsData = {
    totalDeposit: `${formatTokenAmount(analytics.totalDeposit, decimals)} ${symbol}`,
    totalDistributed: `${formatTokenAmount(analytics.totalDistributed, decimals)} ${symbol}`,
    totalAvailable: `${formatTokenAmount(analytics.totalAccrued, decimals)} ${symbol}`,
    remainingDeposit: `${formatTokenAmount(analytics.remainingDeposit, decimals)} ${symbol}`,
    duration: formatDuration(analytics.periodSeconds),
    elapsed: formatDuration(analytics.elapsed),
    ...(analytics.remaining !== undefined && {
      remaining: formatDuration(analytics.remaining),
    }),
  };

  // Prepare recipients section
  const totalDepositBigInt = BigInt(streamData.deposit || 0);
  const totalDistributedBigInt = analytics.totalDistributed;
  
  const recipients: RecipientExportData[] = recipientsInfo.map((recipient: any) => {
    const metrics = calculateRecipientMetrics(
      recipient,
      totalDepositBigInt,
      totalDistributedBigInt,
      decimals
    );
    const totalWithdrawn = formatTokenAmount(
      BigInt(recipient.totalWithdrawn || 0),
      decimals
    );
    const currentAvailable = formatTokenAmount(
      BigInt(recipient.currentAccrued || 0),
      decimals
    );

    return {
      address: formatAddress(recipient.recipient || "", "full"),
      ratePerSecond: `${metrics.ratePerSecond} ${symbol}/sec`,
      ratePerHour: `${metrics.ratePerHour} ${symbol}/hr`,
      ratePerDay: `${metrics.ratePerDay} ${symbol}/day`,
      totalWithdrawn: `${totalWithdrawn} ${symbol}`,
      currentAvailable: `${currentAvailable} ${symbol}`,
      totalReceived: `${metrics.totalReceived} ${symbol}`,
      lastWithdrawalTime: formatDate(Number(recipient.lastWithdrawTime || 0)),
      percentageOfDeposit: `${metrics.percentageOfDeposit.toFixed(2)}%`,
      percentageOfDistributed: `${metrics.percentageOfDistributed.toFixed(2)}%`,
    };
  });

  // Prepare metadata
  const metadata = {
    exportedAt: formatDate(Math.floor(Date.now() / 1000), "iso"),
    exportedBy: formatAddress(userAddress, "full"),
    network,
  };

  return {
    stream,
    analytics: analyticsData,
    recipients,
    metadata,
  };
}

/**
 * Generate complete CSV content from stream export data
 * @param exportData - Prepared stream export data
 * @returns Complete CSV string
 */
export function generateStreamCSV(exportData: StreamExportData): string {
  const sections: Array<{ title?: string; content: string }> = [];

  // Section 1: Stream Information
  const streamInfo = {
    "Stream ID": exportData.stream.id,
    Title: exportData.stream.title || "(No title)",
    Description: exportData.stream.description || "(No description)",
    "Sender Address": exportData.stream.sender,
    "Token Symbol": exportData.stream.token.symbol,
    "Token Address": exportData.stream.token.address,
    "Total Deposit": exportData.stream.deposit,
    "Start Time": exportData.stream.startTime,
    "End Time": exportData.stream.endTime,
    Status: exportData.stream.status,
    "Contract Address": exportData.stream.contractAddress,
    "Explorer URL": exportData.stream.explorerUrl,
  };
  sections.push({
    title: "Stream Information",
    content: convertKeyValueToCSV(streamInfo),
  });

  // Section 2: Analytics Summary
  const analyticsInfo: Record<string, any> = {
    "Total Deposit": exportData.analytics.totalDeposit,
    "Total Distributed": exportData.analytics.totalDistributed,
    "Total Available to Withdraw": exportData.analytics.totalAvailable,
    "Remaining Deposit": exportData.analytics.remainingDeposit,
    Duration: exportData.analytics.duration,
    "Time Elapsed": exportData.analytics.elapsed,
  };
  if (exportData.analytics.remaining) {
    analyticsInfo["Time Remaining"] = exportData.analytics.remaining;
  }
  sections.push({
    title: "Analytics Summary",
    content: convertKeyValueToCSV(analyticsInfo),
  });

  // Section 3: Recipients Data
  if (exportData.recipients.length > 0) {
    const recipientHeaders = [
      "Recipient Address",
      "Rate Per Second",
      "Rate Per Hour",
      "Rate Per Day",
      "Total Withdrawn",
      "Current Available",
      "Total Received",
      "Last Withdrawal Time",
      "% of Deposit",
      "% of Distributed",
    ];
    sections.push({
      title: "Recipients",
      content: convertToCSV(exportData.recipients, recipientHeaders),
    });
  } else {
    sections.push({
      title: "Recipients",
      content: "No recipients found",
    });
  }

  // Section 4: Export Metadata
  const metadataInfo = {
    "Exported At": exportData.metadata.exportedAt,
    "Exported By": exportData.metadata.exportedBy,
    Network: exportData.metadata.network,
  };
  sections.push({
    title: "Export Metadata",
    content: convertKeyValueToCSV(metadataInfo),
  });

  return combineCSVSections(sections);
}

/**
 * Generate filename for stream export
 * @param streamId - Stream ID
 * @param includeTimestamp - Whether to include timestamp in filename
 * @returns Generated filename
 */
export function generateStreamExportFilename(
  streamId: bigint | string,
  includeTimestamp: boolean = false
): string {
  const baseName = `drip-stream-${streamId}`;

  if (includeTimestamp) {
    const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    return `${baseName}-${timestamp}`;
  }

  return baseName;
}

/**
 * Prepare all streams for export
 * @param streamsAnalytics - Array of stream analytics data
 * @param chainId - Chain ID for network identification
 * @param contractAddress - Contract address
 * @param explorerUrl - Block explorer URL
 * @param userAddress - Address of user exporting (for metadata)
 * @param filterOptions - Optional filter options
 * @returns Array of prepared export data
 */
export function prepareAllStreamsForExport(
  streamsAnalytics: any[],
  chainId: number,
  contractAddress: string,
  explorerUrl: string,
  userAddress: string,
  filterOptions?: {
    status?: number[];
    token?: string;
    activeOnly?: boolean;
  }
): StreamExportData[] {
  let filteredStreams = streamsAnalytics;

  // Apply filters
  if (filterOptions) {
    if (filterOptions.status && filterOptions.status.length > 0) {
      filteredStreams = filteredStreams.filter((stream) =>
        filterOptions.status!.includes(stream.status)
      );
    }
    if (filterOptions.token) {
      filteredStreams = filteredStreams.filter(
        (stream) => stream.token.toLowerCase() === filterOptions.token!.toLowerCase()
      );
    }
    if (filterOptions.activeOnly) {
      filteredStreams = filteredStreams.filter((stream) => stream.isActive);
    }
  }

  // Prepare each stream for export
  return filteredStreams.map((stream) => {
    const tokenInfo = getTokenByAddress(stream.token as `0x${string}`, chainId);
    const decimals = tokenInfo?.decimals || 18;
    const symbol = tokenInfo?.symbol || "Token";

    // Map status to readable text
    const statusMap: Record<number, string> = {
      0: "Pending",
      1: "Active",
      2: "Paused",
      3: "Cancelled",
      4: "Completed",
    };
    const status = statusMap[stream.status] || "Unknown";

    // Get network name
    const networkMap: Record<number, string> = {
      42220: "Celo Mainnet",
      44787: "Celo Alfajores",
      11142220: "Celo Sepolia",
    };
    const network = networkMap[chainId] || `Chain ${chainId}`;

    // Prepare stream section
    const streamData = {
      id: stream.streamId.toString(),
      title: stream.title || "",
      description: "",
      sender: stream.sender || "",
      token: {
        symbol,
        address: stream.token,
        decimals,
      },
      deposit: `${stream.depositFormatted} ${symbol}`,
      startTime: formatDate(Number(stream.startTime)),
      endTime: formatDate(Number(stream.endTime)),
      status,
      contractAddress,
      explorerUrl,
    };

    // Prepare analytics section
    const analyticsData = {
      totalDeposit: `${stream.depositFormatted} ${symbol}`,
      totalDistributed: `${stream.totalDistributedFormatted} ${symbol}`,
      totalAvailable: `${stream.totalAccruedFormatted} ${symbol}`,
      remainingDeposit: `${stream.remainingDepositFormatted} ${symbol}`,
      duration: formatDuration(stream.periodSeconds),
      elapsed: formatDuration(stream.elapsedSeconds),
      ...(stream.remainingSeconds !== null && {
        remaining: formatDuration(stream.remainingSeconds),
      }),
    };

    // Prepare recipients section
    const recipients: RecipientExportData[] = stream.recipients.map((recipient: any) => {
      const totalReceived = recipient.totalReceivedFormatted || "0";
      const percentageOfDeposit = recipient.percentageOfDeposit || 0;
      const percentageOfDistributed = recipient.percentageOfDistributed || 0;
      
      // Calculate rates if not already formatted
      const ratePerSecondFormatted = recipient.ratePerSecondFormatted || 
        formatTokenAmount(recipient.ratePerSecond || 0n, decimals);
      const ratePerHour = recipient.ratePerHour || 
        formatTokenAmount((recipient.ratePerSecond || 0n) * 3600n, decimals);
      const ratePerDay = recipient.ratePerDay || 
        formatTokenAmount((recipient.ratePerSecond || 0n) * 86400n, decimals);

      return {
        address: formatAddress(recipient.recipient || "", "full"),
        ratePerSecond: `${ratePerSecondFormatted} ${symbol}/sec`,
        ratePerHour: `${ratePerHour} ${symbol}/hr`,
        ratePerDay: `${ratePerDay} ${symbol}/day`,
        totalWithdrawn: `${recipient.totalWithdrawnFormatted || "0"} ${symbol}`,
        currentAvailable: `${recipient.currentAccruedFormatted || "0"} ${symbol}`,
        totalReceived: `${totalReceived} ${symbol}`,
        lastWithdrawalTime: formatDate(Number(recipient.lastWithdrawTime || 0)),
        percentageOfDeposit: `${percentageOfDeposit.toFixed(2)}%`,
        percentageOfDistributed: `${percentageOfDistributed.toFixed(2)}%`,
      };
    });

    // Prepare metadata
    const metadata = {
      exportedAt: formatDate(Math.floor(Date.now() / 1000), "iso"),
      exportedBy: formatAddress(userAddress, "full"),
      network,
    };

    return {
      stream: streamData,
      analytics: analyticsData,
      recipients,
      metadata,
    };
  });
}

/**
 * Generate comprehensive CSV for all streams
 * @param allStreamsData - Array of prepared stream export data
 * @param summaryStats - Optional summary statistics to include
 * @returns Complete CSV string
 */
export function generateAllStreamsCSV(
  allStreamsData: StreamExportData[],
  summaryStats?: {
    totalStreams: number;
    activeStreams: number;
    pausedStreams: number;
    completedStreams: number;
    cancelledStreams: number;
    totalDeposits: Record<string, string>;
    totalDistributed: Record<string, string>;
    totalRecipients: number;
  }
): string {
  const sections: Array<{ title?: string; content: string }> = [];

  // Section 1: Summary Statistics (if provided)
  if (summaryStats) {
    const summaryInfo: Record<string, any> = {
      "Total Streams": summaryStats.totalStreams,
      "Active Streams": summaryStats.activeStreams,
      "Paused Streams": summaryStats.pausedStreams,
      "Completed Streams": summaryStats.completedStreams,
      "Cancelled Streams": summaryStats.cancelledStreams,
      "Total Recipients": summaryStats.totalRecipients,
    };

    // Add token-specific totals
    Object.entries(summaryStats.totalDeposits).forEach(([token, amount]) => {
      summaryInfo[`Total Deposits (${token})`] = amount;
    });
    Object.entries(summaryStats.totalDistributed).forEach(([token, amount]) => {
      summaryInfo[`Total Distributed (${token})`] = amount;
    });

    sections.push({
      title: "Summary Statistics",
      content: convertKeyValueToCSV(summaryInfo),
    });
  }

  // Section 2: All Streams Summary Table
  if (allStreamsData.length > 0) {
    const streamsSummary = allStreamsData.map((data) => ({
      "Stream ID": data.stream.id,
      Title: data.stream.title || "(No title)",
      Status: data.stream.status,
      "Token Symbol": data.stream.token.symbol,
      "Total Deposit": data.stream.deposit,
      "Total Distributed": data.analytics.totalDistributed,
      "Remaining Deposit": data.analytics.remainingDeposit,
      "Recipients Count": data.recipients.length.toString(),
      "Start Time": data.stream.startTime,
      "End Time": data.stream.endTime,
    }));

    sections.push({
      title: "All Streams Summary",
      content: convertToCSV(streamsSummary, [
        "Stream ID",
        "Title",
        "Status",
        "Token Symbol",
        "Total Deposit",
        "Total Distributed",
        "Remaining Deposit",
        "Recipients Count",
        "Start Time",
        "End Time",
      ]),
    });
  }

  // Section 3: Detailed Stream Data (one section per stream)
  allStreamsData.forEach((streamData, index) => {
    sections.push({
      title: `Stream ${streamData.stream.id} - ${streamData.stream.title || "Untitled"}`,
      content: generateStreamCSV(streamData),
    });
  });

  return combineCSVSections(sections);
}

/**
 * Generate filename for all streams export
 * @param filterType - Type of filter applied (if any)
 * @param includeTimestamp - Whether to include timestamp in filename
 * @returns Generated filename
 */
export function generateAllStreamsExportFilename(
  filterType?: "all" | "active" | "token",
  includeTimestamp: boolean = true
): string {
  const timestamp = includeTimestamp
    ? `-${new Date().toISOString().split("T")[0]}`
    : "";
  const filterSuffix = filterType && filterType !== "all" ? `-${filterType}` : "";

  return `drip-all-streams${filterSuffix}${timestamp}`;
}

