"use client";

import { useChainId, useReadContract } from "wagmi";
import { useMemo } from "react";
import { getContractAddress } from "../config";
import { DRIP_CORE_ABI } from "../abis";

/**
 * Hook for getting all recipients info for a stream
 */
export function useStreamRecipientsInfo(streamId: bigint | undefined) {
  const chainId = useChainId();
  const contractAddress = useMemo(() => {
    return getContractAddress(chainId, "DripCore");
  }, [chainId]);

  const { data: recipientsInfo, isLoading, error, refetch } = useReadContract({
    address: contractAddress || undefined,
    abi: DRIP_CORE_ABI,
    functionName: "getAllRecipientsInfo",
    args: streamId !== undefined ? [streamId] : undefined,
    query: {
      enabled: !!streamId && !!contractAddress,
      refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    },
  });

  return { recipientsInfo, isLoading, error, refetch };
}

/**
 * Hook for getting a specific recipient's info
 */
export function useRecipientInfo(streamId: bigint | undefined, recipient: `0x${string}` | undefined) {
  const chainId = useChainId();
  const contractAddress = useMemo(() => {
    return getContractAddress(chainId, "DripCore");
  }, [chainId]);

  const { data: recipientInfo, isLoading, error, refetch } = useReadContract({
    address: contractAddress || undefined,
    abi: DRIP_CORE_ABI,
    functionName: "getRecipientInfo",
    args: streamId !== undefined && recipient ? [streamId, recipient] : undefined,
    query: {
      enabled: !!streamId && !!recipient && !!contractAddress,
      refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    },
  });

  return { recipientInfo, isLoading, error, refetch };
}

