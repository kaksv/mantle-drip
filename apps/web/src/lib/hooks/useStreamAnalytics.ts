"use client";

import { useMemo } from "react";
import { useChainId } from "wagmi";
import { useAllUserStreams } from "@/lib/contracts/hooks/useUserStreams";
import { useStreamRecipientsInfo } from "@/lib/contracts/hooks/useStreamRecipients";
import {
  calculateStreamAnalytics,
  aggregateStreamAnalytics,
  calculateTimeBasedAnalytics,
  StreamAnalytics,
  AggregatedAnalytics,
  TimeBasedAnalytics,
} from "@/lib/utils/stream-analytics";

/**
 * Hook for getting comprehensive stream analytics
 * Aggregates stream data with recipient information and calculates metrics
 */
export function useStreamAnalytics(userAddress: `0x${string}` | undefined) {
  const chainId = useChainId();
  const { streams, isLoading: streamsLoading, error: streamsError } = useAllUserStreams(userAddress);

  // Fetch recipients info for all streams
  // We'll need to fetch this for each stream
  // For now, we'll use a simplified approach where we fetch recipients when needed
  // In a production app, you might want to batch these calls or use a different strategy

  // Calculate individual stream analytics
  const streamsAnalytics = useMemo(() => {
    if (!streams || !Array.isArray(streams) || streams.length === 0) {
      return [];
    }

    // For Phase 1, we'll return basic analytics without recipient details
    // Recipient details will be fetched on-demand in Phase 3
    return streams.map((stream: any) => {
      const recipientsInfo = stream.recipients || [];
      return calculateStreamAnalytics(stream, recipientsInfo, chainId);
    });
  }, [streams, chainId]);

  // Aggregate analytics
  const aggregated = useMemo(() => {
    if (streamsAnalytics.length === 0) {
      return null;
    }
    return aggregateStreamAnalytics(streamsAnalytics, chainId);
  }, [streamsAnalytics, chainId]);

  // Time-based analytics
  const timeBased = useMemo(() => {
    if (streamsAnalytics.length === 0) {
      return null;
    }
    return calculateTimeBasedAnalytics(streamsAnalytics);
  }, [streamsAnalytics]);

  return {
    streamsAnalytics,
    aggregated,
    timeBased,
    isLoading: streamsLoading,
    error: streamsError,
  };
}

/**
 * Hook for getting analytics for a single stream with full recipient details
 * This fetches recipient info from the contract
 */
export function useStreamAnalyticsWithRecipients(streamId: bigint | undefined) {
  const chainId = useChainId();
  const { recipientsInfo, isLoading: recipientsLoading, error: recipientsError } =
    useStreamRecipientsInfo(streamId);

  // This would be used when you have a specific stream ID
  // For now, we'll return the recipients info
  // The full analytics calculation would happen in the component using this hook

  return {
    recipientsInfo,
    isLoading: recipientsLoading,
    error: recipientsError,
  };
}

/**
 * Enhanced hook that fetches recipient details for all streams
 * This is more expensive but provides complete analytics
 * Use this when you need full recipient data for all streams
 */
export function useStreamAnalyticsComplete(userAddress: `0x${string}` | undefined) {
  const chainId = useChainId();
  const { streams, isLoading: streamsLoading, error: streamsError } = useAllUserStreams(userAddress);

  // Note: Fetching recipients for all streams can be expensive
  // In a production app, consider:
  // 1. Pagination
  // 2. Lazy loading
  // 3. Caching
  // 4. Server-side aggregation

  const streamsAnalytics = useMemo(() => {
    if (!streams || !Array.isArray(streams) || streams.length === 0) {
      return [];
    }

    // For now, use the recipients data that comes with the stream
    // In Phase 3, we'll enhance this to fetch detailed recipient info
    return streams.map((stream: any) => {
      const recipientsInfo = stream.recipients || [];
      return calculateStreamAnalytics(stream, recipientsInfo, chainId);
    });
  }, [streams, chainId]);

  const aggregated = useMemo(() => {
    if (streamsAnalytics.length === 0) {
      return null;
    }
    return aggregateStreamAnalytics(streamsAnalytics, chainId);
  }, [streamsAnalytics, chainId]);

  const timeBased = useMemo(() => {
    if (streamsAnalytics.length === 0) {
      return null;
    }
    return calculateTimeBasedAnalytics(streamsAnalytics);
  }, [streamsAnalytics]);

  return {
    streamsAnalytics,
    aggregated,
    timeBased,
    isLoading: streamsLoading,
    error: streamsError,
  };
}





