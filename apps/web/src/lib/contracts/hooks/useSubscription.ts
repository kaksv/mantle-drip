"use client";

import { useAccount, useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { getContractAddress } from "../config";
import { SUBSCRIPTION_MANAGER_ABI } from "../abis";
import { parseEther, parseUnits } from "viem";
import { useMemo } from "react";

/**
 * Subscription cadence types
 */
export enum SubscriptionCadence {
  DAILY = 0,
  WEEKLY = 1,
  MONTHLY = 2,
  CUSTOM = 3,
}

/**
 * Hook for interacting with SubscriptionManager contract
 */
export function useSubscription() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const contractAddress = useMemo(() => {
    return getContractAddress(chainId, "SubscriptionManager");
  }, [chainId]);

  /**
   * Create a new subscription
   * @param recipient Recipient address
   * @param token Token address (address(0) for native CELO)
   * @param amount Amount per payment (human-readable)
   * @param cadence Payment cadence
   * @param customInterval Custom interval in seconds (only for CUSTOM cadence)
   * @param firstPaymentTime Timestamp for first payment (0 for now + interval)
   * @param title Optional title
   * @param description Optional description
   */
  const createSubscription = async (
    recipient: `0x${string}`,
    token: `0x${string}`, // Token address (address(0) for native CELO)
    amount: string, // Human-readable amount (e.g., "100")
    cadence: SubscriptionCadence,
    customInterval: number = 0, // Custom interval in seconds (only for CUSTOM cadence)
    firstPaymentTime: number = 0, // Timestamp for first payment (0 for now + interval)
    title: string = "",
    description: string = ""
  ) => {
    if (!contractAddress) {
      throw new Error("SubscriptionManager contract not deployed on this network");
    }

    const amountInWei = parseEther(amount); // Assuming 18 decimals - should be dynamic

    const baseContract = {
      address: contractAddress,
      abi: SUBSCRIPTION_MANAGER_ABI,
      functionName: "createSubscription" as const,
      args: [
        recipient,
        token,
        amountInWei,
        cadence,
        BigInt(customInterval),
        BigInt(firstPaymentTime),
        title,
        description,
      ],
    };

    // Note: createSubscription does not escrow funds; deposits are done via depositToSubscription.
    // We intentionally do NOT send value here, even for native CELO.
    return writeContract(baseContract as any);
  };

  /**
   * Deposit funds to a subscription (escrow)
   */
  const depositToSubscription = async (
    subscriptionId: bigint,
    amount: string, // Human-readable amount
    token: `0x${string}`
  ) => {
    if (!contractAddress) {
      throw new Error("SubscriptionManager contract not deployed on this network");
    }

    const amountInWei = parseEther(amount); // Assuming 18 decimals - should be dynamic

    const isNativeToken = token === "0x0000000000000000000000000000000000000000";

    const baseContract = {
      address: contractAddress,
      abi: SUBSCRIPTION_MANAGER_ABI,
      functionName: "depositToSubscription" as const,
      args: [subscriptionId, amountInWei],
    };

    return writeContract(
      (isNativeToken ? { ...baseContract, value: amountInWei } : baseContract) as any
    );
  };

  /**
   * Execute a payment for a subscription
   */
  const executePayment = async (subscriptionId: bigint) => {
    if (!contractAddress) {
      throw new Error("SubscriptionManager contract not deployed on this network");
    }

    return writeContract({
      address: contractAddress,
      abi: SUBSCRIPTION_MANAGER_ABI,
      functionName: "executePayment",
      args: [subscriptionId],
    });
  };

  /**
   * Execute batch payments
   */
  const executeBatchPayments = async (subscriptionIds: bigint[]) => {
    if (!contractAddress) {
      throw new Error("SubscriptionManager contract not deployed on this network");
    }

    return writeContract({
      address: contractAddress,
      abi: SUBSCRIPTION_MANAGER_ABI,
      functionName: "executeBatchPayments",
      args: [subscriptionIds],
    });
  };

  /**
   * Modify a subscription
   */
  const modifySubscription = async (
    subscriptionId: bigint,
    newAmount: string, // Human-readable amount
    newCadence: SubscriptionCadence,
    newCustomInterval: number = 0
  ) => {
    if (!contractAddress) {
      throw new Error("SubscriptionManager contract not deployed on this network");
    }

    const amountInWei = parseEther(newAmount); // Assuming 18 decimals - should be dynamic

    return writeContract({
      address: contractAddress,
      abi: SUBSCRIPTION_MANAGER_ABI,
      functionName: "modifySubscription",
      args: [subscriptionId, amountInWei, newCadence, newCustomInterval],
    });
  };

  /**
   * Pause a subscription
   */
  const pauseSubscription = async (subscriptionId: bigint) => {
    if (!contractAddress) {
      throw new Error("SubscriptionManager contract not deployed on this network");
    }

    return writeContract({
      address: contractAddress,
      abi: SUBSCRIPTION_MANAGER_ABI,
      functionName: "pauseSubscription",
      args: [subscriptionId],
    });
  };

  /**
   * Resume a subscription
   */
  const resumeSubscription = async (subscriptionId: bigint) => {
    if (!contractAddress) {
      throw new Error("SubscriptionManager contract not deployed on this network");
    }

    return writeContract({
      address: contractAddress,
      abi: SUBSCRIPTION_MANAGER_ABI,
      functionName: "resumeSubscription",
      args: [subscriptionId],
    });
  };

  /**
   * Cancel a subscription
   */
  const cancelSubscription = async (subscriptionId: bigint) => {
    if (!contractAddress) {
      throw new Error("SubscriptionManager contract not deployed on this network");
    }

    return writeContract({
      address: contractAddress,
      abi: SUBSCRIPTION_MANAGER_ABI,
      functionName: "cancelSubscription",
      args: [subscriptionId],
    });
  };

  return {
    contractAddress,
    isConnected,
    createSubscription,
    depositToSubscription,
    executePayment,
    executeBatchPayments,
    modifySubscription,
    pauseSubscription,
    resumeSubscription,
    cancelSubscription,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    error,
  };
}

/**
 * Hook for reading subscription data
 */
export function useSubscriptionData(subscriptionId: bigint | undefined) {
  const chainId = useChainId();
  const contractAddress = useMemo(() => {
    return getContractAddress(chainId, "SubscriptionManager");
  }, [chainId]);

  const { data: subscription, isLoading, error, refetch } = useReadContract({
    address: contractAddress || undefined,
    abi: SUBSCRIPTION_MANAGER_ABI,
    functionName: "getSubscription",
    args: subscriptionId !== undefined ? [subscriptionId] : undefined,
    query: {
      enabled: !!subscriptionId && !!contractAddress,
    },
  });

  return { subscription, isLoading, error, refetch };
}

/**
 * Hook for getting subscription balance (escrow)
 */
export function useSubscriptionBalance(subscriptionId: bigint | undefined) {
  const chainId = useChainId();
  const contractAddress = useMemo(() => {
    return getContractAddress(chainId, "SubscriptionManager");
  }, [chainId]);

  const { data: balance, isLoading, error, refetch } = useReadContract({
    address: contractAddress || undefined,
    abi: SUBSCRIPTION_MANAGER_ABI,
    functionName: "getSubscriptionBalance",
    args: subscriptionId !== undefined ? [subscriptionId] : undefined,
    query: {
      enabled: !!subscriptionId && !!contractAddress,
    },
  });

  return { balance, isLoading, error, refetch };
}

/**
 * Hook for getting user's subscriptions
 */
export function useUserSubscriptions(userAddress: `0x${string}` | undefined) {
  const chainId = useChainId();
  const contractAddress = useMemo(() => {
    return getContractAddress(chainId, "SubscriptionManager");
  }, [chainId]);

  const { data: subscriptionIds, isLoading, error } = useReadContract({
    address: contractAddress || undefined,
    abi: SUBSCRIPTION_MANAGER_ABI,
    functionName: "getUserSubscriptions",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress && !!contractAddress,
    },
  });

  return { subscriptionIds, isLoading, error };
}

/**
 * Hook for getting all subscriptions (sent and received) for a user
 */
export function useUserSubscriptionsAll(userAddress: `0x${string}` | undefined) {
  const chainId = useChainId();
  const contractAddress = useMemo(() => {
    return getContractAddress(chainId, "SubscriptionManager");
  }, [chainId]);

  const { data: subscriptions, isLoading, error } = useReadContract({
    address: contractAddress || undefined,
    abi: SUBSCRIPTION_MANAGER_ABI,
    functionName: "getUserSubscriptionsAll",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress && !!contractAddress,
    },
  });

  return { subscriptions, isLoading, error };
}

/**
 * Hook for getting payment history for a subscription
 */
export function usePaymentHistory(
  subscriptionId: bigint | undefined,
  offset: number = 0,
  limit: number = 10
) {
  const chainId = useChainId();
  const contractAddress = useMemo(() => {
    return getContractAddress(chainId, "SubscriptionManager");
  }, [chainId]);

  const { data, isLoading, error, refetch } = useReadContract({
    address: contractAddress || undefined,
    abi: SUBSCRIPTION_MANAGER_ABI,
    functionName: "getPaymentHistory",
    args:
      subscriptionId !== undefined
        ? [subscriptionId, BigInt(offset), BigInt(limit)]
        : undefined,
    query: {
      enabled: !!subscriptionId && !!contractAddress,
      refetchInterval: 10000, // Auto-refresh every 10 seconds
    },
  });

  // Data is returned as [payments, total]
  const payments = Array.isArray(data) && data.length > 0 ? (data[0] as any[]) : [];
  const total = Array.isArray(data) && data.length > 1 ? (data[1] as bigint) : 0n;

  return { payments, total: Number(total), isLoading, error, refetch };
}

/**
 * Hook for checking if a payment is due
 */
export function usePaymentDue(subscriptionId: bigint | undefined) {
  const chainId = useChainId();
  const contractAddress = useMemo(() => {
    return getContractAddress(chainId, "SubscriptionManager");
  }, [chainId]);

  const { data, isLoading, error } = useReadContract({
    address: contractAddress || undefined,
    abi: SUBSCRIPTION_MANAGER_ABI,
    functionName: "isPaymentDue",
    args: subscriptionId !== undefined ? [subscriptionId] : undefined,
    query: {
      enabled: !!subscriptionId && !!contractAddress,
      refetchInterval: 30000, // Check every 30 seconds
    },
  });

  // Data is returned as [isDue, nextPaymentTime]
  const isDue = Array.isArray(data) && data.length > 0 ? (data[0] as boolean) : false;
  const nextPaymentTime = Array.isArray(data) && data.length > 1 ? (data[1] as bigint) : 0n;

  return { isDue, nextPaymentTime, isLoading, error };
}


