import { formatUnits } from "viem";
import { getTokenByAddress } from "@/lib/tokens/config";

/**
 * Stream status enum from contract
 * 0 = Pending, 1 = Active, 2 = Paused, 3 = Cancelled, 4 = Completed
 */
export enum StreamStatus {
  Pending = 0,
  Active = 1,
  Paused = 2,
  Cancelled = 3,
  Completed = 4,
}

/**
 * Stream analytics data structure
 */
export interface StreamAnalytics {
  streamId: bigint;
  title: string;
  status: StreamStatus;
  token: string;
  tokenSymbol: string;
  tokenDecimals: number;
  sender: string;
  deposit: bigint;
  depositFormatted: string;
  startTime: bigint;
  endTime: bigint;
  periodSeconds: number;
  recipients: RecipientAnalytics[];
  totalRecipients: number;
  totalDistributed: bigint;
  totalDistributedFormatted: string;
  totalWithdrawn: bigint;
  totalWithdrawnFormatted: string;
  totalAccrued: bigint;
  totalAccruedFormatted: string;
  remainingDeposit: bigint;
  remainingDepositFormatted: string;
  elapsedSeconds: number;
  remainingSeconds: number | null;
  isActive: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  isCancelled: boolean;
  durationDays: number;
  completionPercentage: number;
  distributionRate: bigint; // Total rate per second across all recipients
  distributionRateFormatted: string;
}

/**
 * Recipient analytics data structure
 */
export interface RecipientAnalytics {
  recipient: string;
  ratePerSecond: bigint;
  ratePerSecondFormatted: string;
  totalWithdrawn: bigint;
  totalWithdrawnFormatted: string;
  currentAccrued: bigint;
  currentAccruedFormatted: string;
  totalReceived: bigint;
  totalReceivedFormatted: string;
  percentageOfDeposit: number;
  percentageOfDistributed: number;
  lastWithdrawTime: bigint;
}

/**
 * Aggregated analytics across all streams
 */
export interface AggregatedAnalytics {
  totalStreams: number;
  streamsByStatus: Record<StreamStatus, number>;
  streamsByToken: Record<string, number>;
  totalDeposits: Record<string, bigint>;
  totalDepositsFormatted: Record<string, string>;
  totalDistributed: Record<string, bigint>;
  totalDistributedFormatted: Record<string, string>;
  totalWithdrawn: Record<string, bigint>;
  totalWithdrawnFormatted: Record<string, string>;
  totalAccrued: Record<string, bigint>;
  totalAccruedFormatted: Record<string, string>;
  totalRecipients: number;
  averageRecipientsPerStream: number;
  averageDepositPerStream: Record<string, number>;
  averageDistributionRate: Record<string, bigint>;
  averageDistributionRateFormatted: Record<string, string>;
  activeStreamsCount: number;
  pausedStreamsCount: number;
  completedStreamsCount: number;
  cancelledStreamsCount: number;
  pendingStreamsCount: number;
}

/**
 * Time-based analytics for charts
 */
export interface TimeBasedAnalytics {
  daily: Record<string, { date: string; distributed: bigint; withdrawn: bigint }[]>;
  weekly: Record<string, { week: string; distributed: bigint; withdrawn: bigint }[]>;
  monthly: Record<string, { month: string; distributed: bigint; withdrawn: bigint }[]>;
}

/**
 * Calculate analytics for a single stream
 */
export function calculateStreamAnalytics(
  stream: any,
  recipientsInfo: any[],
  chainId: number
): StreamAnalytics {
  const streamId = BigInt(stream.streamId || 0);
  const status = Number(stream.status ?? 0) as StreamStatus;
  const token = stream.token as string;
  const tokenInfo = getTokenByAddress(token as `0x${string}`, chainId) || {
    decimals: 18,
    symbol: "CELO",
  };
  const deposit = BigInt(stream.deposit || 0);
  const startTime = BigInt(stream.startTime || 0);
  const endTime = BigInt(stream.endTime || 0);
  const periodSeconds = Number(stream.periodSeconds || 0);
  const now = BigInt(Math.floor(Date.now() / 1000));

  // Calculate recipient analytics
  const recipientAnalytics: RecipientAnalytics[] = recipientsInfo.map((recipient: any) => {
    const ratePerSecond = BigInt(recipient.ratePerSecond || 0);
    const totalWithdrawn = BigInt(recipient.totalWithdrawn || 0);
    const currentAccrued = BigInt(recipient.currentAccrued || 0);
    const totalReceived = totalWithdrawn + currentAccrued;

    const ratePerSecondFormatted = formatUnits(ratePerSecond, tokenInfo.decimals);
    const totalWithdrawnFormatted = formatUnits(totalWithdrawn, tokenInfo.decimals);
    const currentAccruedFormatted = formatUnits(currentAccrued, tokenInfo.decimals);
    const totalReceivedFormatted = formatUnits(totalReceived, tokenInfo.decimals);

    const percentageOfDeposit =
      deposit > 0n ? (Number(totalReceived) / Number(deposit)) * 100 : 0;

    // Calculate total distributed across all recipients for percentage calculation
    const totalDistributedAllRecipients = recipientsInfo.reduce((sum: bigint, r: any) => {
      return sum + BigInt(r.totalWithdrawn || 0) + BigInt(r.currentAccrued || 0);
    }, 0n);

    const percentageOfDistributed =
      totalDistributedAllRecipients > 0n
        ? (Number(totalReceived) / Number(totalDistributedAllRecipients)) * 100
        : 0;

    return {
      recipient: recipient.recipient as string,
      ratePerSecond,
      ratePerSecondFormatted,
      totalWithdrawn,
      totalWithdrawnFormatted,
      currentAccrued,
      currentAccruedFormatted,
      totalReceived,
      totalReceivedFormatted,
      percentageOfDeposit,
      percentageOfDistributed,
      lastWithdrawTime: BigInt(recipient.lastWithdrawTime || 0),
    };
  });

  // Calculate totals
  const totalDistributed = recipientAnalytics.reduce((sum, r) => sum + r.totalReceived, 0n);
  const totalWithdrawn = recipientAnalytics.reduce((sum, r) => sum + r.totalWithdrawn, 0n);
  const totalAccrued = recipientAnalytics.reduce((sum, r) => sum + r.currentAccrued, 0n);
  const remainingDeposit = deposit > totalDistributed ? deposit - totalDistributed : 0n;

  // Calculate time metrics
  const elapsedSeconds = startTime > 0n ? Number(now - startTime) : 0;
  const remainingSeconds =
    status === StreamStatus.Active && endTime > now ? Number(endTime - now) : null;
  const durationDays = periodSeconds > 0 ? periodSeconds / (24 * 60 * 60) : 0;

  // Calculate completion percentage
  const completionPercentage =
    deposit > 0n ? (Number(totalDistributed) / Number(deposit)) * 100 : 0;

  // Calculate total distribution rate (sum of all recipient rates)
  const distributionRate = recipientAnalytics.reduce(
    (sum, r) => sum + r.ratePerSecond,
    0n
  );

  return {
    streamId,
    title: stream.title || `Stream #${streamId}`,
    status,
    token,
    tokenSymbol: tokenInfo.symbol,
    tokenDecimals: tokenInfo.decimals,
    sender: stream.sender as string,
    deposit,
    depositFormatted: formatUnits(deposit, tokenInfo.decimals),
    startTime,
    endTime,
    periodSeconds,
    recipients: recipientAnalytics,
    totalRecipients: recipientAnalytics.length,
    totalDistributed,
    totalDistributedFormatted: formatUnits(totalDistributed, tokenInfo.decimals),
    totalWithdrawn,
    totalWithdrawnFormatted: formatUnits(totalWithdrawn, tokenInfo.decimals),
    totalAccrued,
    totalAccruedFormatted: formatUnits(totalAccrued, tokenInfo.decimals),
    remainingDeposit,
    remainingDepositFormatted: formatUnits(remainingDeposit, tokenInfo.decimals),
    elapsedSeconds,
    remainingSeconds,
    isActive: status === StreamStatus.Active,
    isPaused: status === StreamStatus.Paused,
    isCompleted: status === StreamStatus.Completed,
    isCancelled: status === StreamStatus.Cancelled,
    durationDays,
    completionPercentage,
    distributionRate,
    distributionRateFormatted: formatUnits(distributionRate, tokenInfo.decimals),
  };
}

/**
 * Aggregate analytics across all streams
 */
export function aggregateStreamAnalytics(
  streamsAnalytics: StreamAnalytics[],
  chainId: number
): AggregatedAnalytics {
  const streamsByStatus: Record<StreamStatus, number> = {
    [StreamStatus.Pending]: 0,
    [StreamStatus.Active]: 0,
    [StreamStatus.Paused]: 0,
    [StreamStatus.Cancelled]: 0,
    [StreamStatus.Completed]: 0,
  };

  const streamsByToken: Record<string, number> = {};
  const totalDeposits: Record<string, bigint> = {};
  const totalDistributed: Record<string, bigint> = {};
  const totalWithdrawn: Record<string, bigint> = {};
  const totalAccrued: Record<string, bigint> = {};
  const depositCounts: Record<string, number> = {};
  const distributionRateSums: Record<string, bigint> = {};
  const distributionRateCounts: Record<string, number> = {};

  let totalRecipients = 0;

  streamsAnalytics.forEach((stream) => {
    // Count by status
    streamsByStatus[stream.status] = (streamsByStatus[stream.status] || 0) + 1;

    // Count by token
    streamsByToken[stream.token] = (streamsByToken[stream.token] || 0) + 1;

    // Aggregate by token
    if (!totalDeposits[stream.token]) {
      totalDeposits[stream.token] = 0n;
      totalDistributed[stream.token] = 0n;
      totalWithdrawn[stream.token] = 0n;
      totalAccrued[stream.token] = 0n;
      depositCounts[stream.token] = 0;
      distributionRateSums[stream.token] = 0n;
      distributionRateCounts[stream.token] = 0;
    }

    totalDeposits[stream.token] += stream.deposit;
    totalDistributed[stream.token] += stream.totalDistributed;
    totalWithdrawn[stream.token] += stream.totalWithdrawn;
    totalAccrued[stream.token] += stream.totalAccrued;
    depositCounts[stream.token] += 1;
    distributionRateSums[stream.token] += stream.distributionRate;
    distributionRateCounts[stream.token] += 1;

    totalRecipients += stream.totalRecipients;
  });

  // Format totals
  const totalDepositsFormatted: Record<string, string> = {};
  const totalDistributedFormatted: Record<string, string> = {};
  const totalWithdrawnFormatted: Record<string, string> = {};
  const totalAccruedFormatted: Record<string, string> = {};
  const averageDepositPerStream: Record<string, number> = {};
  const averageDistributionRate: Record<string, bigint> = {};
  const averageDistributionRateFormatted: Record<string, string> = {};

  Object.keys(totalDeposits).forEach((token) => {
    const tokenInfo = getTokenByAddress(token as `0x${string}`, chainId) || {
      decimals: 18,
      symbol: "CELO",
    };

    totalDepositsFormatted[token] = formatUnits(totalDeposits[token], tokenInfo.decimals);
    totalDistributedFormatted[token] = formatUnits(totalDistributed[token], tokenInfo.decimals);
    totalWithdrawnFormatted[token] = formatUnits(totalWithdrawn[token], tokenInfo.decimals);
    totalAccruedFormatted[token] = formatUnits(totalAccrued[token], tokenInfo.decimals);

    const count = depositCounts[token];
    if (count > 0) {
      averageDepositPerStream[token] = Number(totalDepositsFormatted[token]) / count;
    }

    const rateCount = distributionRateCounts[token];
    if (rateCount > 0) {
      averageDistributionRate[token] = distributionRateSums[token] / BigInt(rateCount);
      averageDistributionRateFormatted[token] = formatUnits(
        averageDistributionRate[token],
        tokenInfo.decimals
      );
    }
  });

  return {
    totalStreams: streamsAnalytics.length,
    streamsByStatus,
    streamsByToken,
    totalDeposits,
    totalDepositsFormatted,
    totalDistributed,
    totalDistributedFormatted,
    totalWithdrawn,
    totalWithdrawnFormatted,
    totalAccrued,
    totalAccruedFormatted,
    totalRecipients,
    averageRecipientsPerStream:
      streamsAnalytics.length > 0 ? totalRecipients / streamsAnalytics.length : 0,
    averageDepositPerStream,
    averageDistributionRate,
    averageDistributionRateFormatted,
    activeStreamsCount: streamsByStatus[StreamStatus.Active],
    pausedStreamsCount: streamsByStatus[StreamStatus.Paused],
    completedStreamsCount: streamsByStatus[StreamStatus.Completed],
    cancelledStreamsCount: streamsByStatus[StreamStatus.Cancelled],
    pendingStreamsCount: streamsByStatus[StreamStatus.Pending],
  };
}

/**
 * Calculate time-based analytics for charts
 */
export function calculateTimeBasedAnalytics(
  streamsAnalytics: StreamAnalytics[]
): TimeBasedAnalytics {
  const daily: Record<string, Map<string, { distributed: bigint; withdrawn: bigint }>> = {};
  const weekly: Record<string, Map<string, { distributed: bigint; withdrawn: bigint }>> = {};
  const monthly: Record<string, Map<string, { distributed: bigint; withdrawn: bigint }>> = {};

  streamsAnalytics.forEach((stream) => {
    const token = stream.token;
    if (!daily[token]) {
      daily[token] = new Map();
      weekly[token] = new Map();
      monthly[token] = new Map();
    }

    // For now, we'll use the current state as a snapshot
    // In a full implementation, you'd track historical data
    const date = new Date(Number(stream.startTime) * 1000);
    const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD

    // Calculate week (ISO week)
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekStr = weekStart.toISOString().split("T")[0];

    // Calculate month
    const monthStr = date.toISOString().substring(0, 7); // YYYY-MM

    // Update daily
    const dailyEntry = daily[token].get(dateStr) || { distributed: 0n, withdrawn: 0n };
    dailyEntry.distributed += stream.totalDistributed;
    dailyEntry.withdrawn += stream.totalWithdrawn;
    daily[token].set(dateStr, dailyEntry);

    // Update weekly
    const weeklyEntry = weekly[token].get(weekStr) || { distributed: 0n, withdrawn: 0n };
    weeklyEntry.distributed += stream.totalDistributed;
    weeklyEntry.withdrawn += stream.totalWithdrawn;
    weekly[token].set(weekStr, weeklyEntry);

    // Update monthly
    const monthlyEntry = monthly[token].get(monthStr) || { distributed: 0n, withdrawn: 0n };
    monthlyEntry.distributed += stream.totalDistributed;
    monthlyEntry.withdrawn += stream.totalWithdrawn;
    monthly[token].set(monthStr, monthlyEntry);
  });

  // Convert Maps to arrays
  const dailyArray: Record<string, { date: string; distributed: bigint; withdrawn: bigint }[]> = {};
  const weeklyArray: Record<string, { week: string; distributed: bigint; withdrawn: bigint }[]> = {};
  const monthlyArray: Record<string, { month: string; distributed: bigint; withdrawn: bigint }[]> = {};

  Object.keys(daily).forEach((token) => {
    dailyArray[token] = Array.from(daily[token].entries()).map(([date, data]) => ({
      date,
      ...data,
    }));
    weeklyArray[token] = Array.from(weekly[token].entries()).map(([week, data]) => ({
      week,
      ...data,
    }));
    monthlyArray[token] = Array.from(monthly[token].entries()).map(([month, data]) => ({
      month,
      ...data,
    }));
  });

  return {
    daily: dailyArray,
    weekly: weeklyArray,
    monthly: monthlyArray,
  };
}





