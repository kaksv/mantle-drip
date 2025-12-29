"use client";

import { useAccount, useChainId, usePublicClient, useWalletClient } from "wagmi";
import { useEffect, useState, useCallback } from "react";
import { ClaimSDK } from "@goodsdks/citizen-sdk";
import { useIdentitySDK } from "./useIdentitySDK";
import type {
  ClaimEntitlement,
  WalletClaimStatus,
  ClaimState,
  ClaimTransactionState,
} from "../types";
import { isSupportedChain } from "../utils";
import { createClaimEntitlement } from "../utils";

/**
 * Hook for interacting with Good Dollar Claim SDK
 * 
 * Provides:
 * - Claim entitlement checking
 * - Wallet claim status
 * - Claim transaction execution
 * - Next claim time tracking
 */
export function useClaimSDK() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { identitySDK, identityStatus, isReady: isIdentityReady } = useIdentitySDK();

  const [claimSDK, setClaimSDK] = useState<ClaimSDK | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [entitlement, setEntitlement] = useState<ClaimEntitlement | null>(null);
  const [walletClaimStatus, setWalletClaimStatus] = useState<WalletClaimStatus | null>(null);
  const [nextClaimTime, setNextClaimTime] = useState<Date | null>(null);
  const [claimState, setClaimState] = useState<ClaimState>({
    state: "idle",
    error: null,
    transactionHash: null,
  });

  // Initialize ClaimSDK when IdentitySDK is ready and user is whitelisted
  useEffect(() => {
    if (!isConnected || !address || !publicClient || !walletClient || !identitySDK) {
      setClaimSDK(null);
      return;
    }

    // Check if chain is supported
    if (!isSupportedChain(chainId)) {
      return;
    }

    // Only initialize if identity is verified
    if (!identityStatus.isWhitelisted) {
      // Clear ClaimSDK if user is not whitelisted
      if (claimSDK) {
        setClaimSDK(null);
      }
      return;
    }

    // If ClaimSDK already exists and user is whitelisted, don't re-initialize
    if (claimSDK && identityStatus.isWhitelisted) {
      return;
    }

    const initializeSDK = async () => {
      // Prevent duplicate initialization
      if (isInitializing) {
        return;
      }

      setIsInitializing(true);
      try {
        const sdk = await ClaimSDK.init({
          publicClient,
          walletClient,
          identitySDK,
        });
        setClaimSDK(sdk);
        setClaimState((prev) => ({
          ...prev,
          error: null,
        }));
      } catch (error) {
        console.error("Failed to initialize ClaimSDK:", error);
        setClaimState({
          state: "error",
          error: error instanceof Error ? error : new Error("Failed to initialize Claim SDK"),
          transactionHash: null,
        });
      } finally {
        setIsInitializing(false);
      }
    };

    // Initialize when identity is ready and user is whitelisted
    if (isIdentityReady && identityStatus.isWhitelisted) {
      initializeSDK();
    }
  }, [
    isConnected,
    address,
    publicClient,
    walletClient,
    identitySDK,
    chainId,
    identityStatus.isWhitelisted,
    isIdentityReady,
    claimSDK,
    isInitializing,
  ]);

  // Check entitlement
  const checkEntitlement = useCallback(async () => {
    if (!claimSDK) {
      return null;
    }

    setClaimState((prev) => ({ ...prev, state: "checking" }));

    try {
      const result = await claimSDK.checkEntitlement();
      
      // Log the result to debug
      console.log("checkEntitlement result:", result);
      
      // Handle different return formats
      // The result might be:
      // 1. A bigint directly
      // 2. An object with { entitlement: bigint, altClaimAvailable?: boolean }
      // 3. An object with just the entitlement property
      let entitlementAmount: bigint = 0n;
      let altClaimAvailable = false;
      
      if (typeof result === 'bigint') {
        entitlementAmount = result;
      } else if (result && typeof result === 'object') {
        // Check for entitlement property
        if ('entitlement' in result && typeof result.entitlement === 'bigint') {
          entitlementAmount = result.entitlement;
        } else if ('amount' in result && typeof result.amount === 'bigint') {
          entitlementAmount = result.amount;
        } else if ('value' in result && typeof result.value === 'bigint') {
          entitlementAmount = result.value;
        }
        
        // Check for altClaimAvailable
        if ('altClaimAvailable' in result && typeof result.altClaimAvailable === 'boolean') {
          altClaimAvailable = result.altClaimAvailable;
        }
      }
      
      const entitlementData = createClaimEntitlement(
        entitlementAmount,
        altClaimAvailable
      );
      setEntitlement(entitlementData);
      setClaimState((prev) => ({ ...prev, state: "idle", error: null }));
      return entitlementData;
    } catch (error) {
      console.error("Failed to check entitlement:", error);
      setClaimState({
        state: "error",
        error: error instanceof Error ? error : new Error("Failed to check entitlement"),
        transactionHash: null,
      });
      return null;
    }
  }, [claimSDK]);

  // Get wallet claim status
  const getWalletClaimStatus = useCallback(async () => {
    if (!claimSDK) {
      return null;
    }

    try {
      const status = await claimSDK.getWalletClaimStatus();
      
      // Log the status to debug
      console.log("getWalletClaimStatus result:", status);
      
      setWalletClaimStatus(status);
      
      // IMPORTANT: Use entitlement from walletClaimStatus if it's available
      // This is the authoritative source for claimable amount
      if (status && 'entitlement' in status && typeof status.entitlement === 'bigint') {
        const statusEntitlement = status.entitlement;
        
        // Update entitlement from wallet claim status if it's different or if current entitlement is 0
        if (statusEntitlement > 0n) {
          const altClaimAvailable = (status as any)?.altClaimAvailable ?? false;
          const entitlementData = createClaimEntitlement(
            statusEntitlement,
            altClaimAvailable
          );
          setEntitlement(entitlementData);
        }
      }
      
      return status;
    } catch (error) {
      console.error("Failed to get wallet claim status:", error);
      return null;
    }
  }, [claimSDK]);

  // Get next claim time
  const getNextClaimTime = useCallback(async () => {
    if (!claimSDK) {
      return null;
    }

    try {
      const time = await claimSDK.nextClaimTime();
      setNextClaimTime(time);
      return time;
    } catch (error) {
      console.error("Failed to get next claim time:", error);
      return null;
    }
  }, [claimSDK]);

  // Execute claim transaction
  const claim = useCallback(
    async (onProgress?: (message: string) => void) => {
      if (!claimSDK) {
        throw new Error("Claim SDK not initialized");
      }

      setClaimState((prev) => ({
        ...prev,
        state: "claiming",
        error: null,
        transactionHash: null,
      }));

      try {
        onProgress?.("Preparing claim transaction...");

        const receipt = await claimSDK.claim((message) => {
          onProgress?.(message);
        });

        setClaimState({
          state: "success",
          error: null,
          transactionHash: receipt.transactionHash || null,
        });

        // Refresh entitlement and status after successful claim
        await Promise.all([checkEntitlement(), getWalletClaimStatus(), getNextClaimTime()]);

        return receipt;
      } catch (error) {
        console.error("Claim transaction failed:", error);
        setClaimState({
          state: "error",
          error: error instanceof Error ? error : new Error("Claim transaction failed"),
          transactionHash: null,
        });
        throw error;
      }
    },
    [claimSDK, checkEntitlement, getWalletClaimStatus, getNextClaimTime]
  );

  // Auto-check entitlement when SDK is ready
  // IMPORTANT: getWalletClaimStatus should be called first as it contains the authoritative entitlement
  useEffect(() => {
    if (claimSDK && !isInitializing) {
      // Call getWalletClaimStatus first - it will update entitlement
      getWalletClaimStatus().then(() => {
        // Then call checkEntitlement as a fallback/verification
        checkEntitlement();
        getNextClaimTime();
      });
    }
  }, [claimSDK, isInitializing, checkEntitlement, getWalletClaimStatus, getNextClaimTime]);

  return {
    // SDK instance
    claimSDK,
    isInitializing,

    // Entitlement
    entitlement,
    checkEntitlement,

    // Wallet claim status
    walletClaimStatus,
    getWalletClaimStatus,

    // Next claim time
    nextClaimTime,
    getNextClaimTime,

    // Claim transaction
    claim,
    claimState,

    // Helpers
    isReady: !!claimSDK && !isInitializing,
    // canClaim should check both entitlement state and walletClaimStatus
    canClaim: (walletClaimStatus?.entitlement && walletClaimStatus.entitlement > 0n && walletClaimStatus.status === "can_claim") || 
              (entitlement?.canClaim ?? false),
    isWhitelisted: identityStatus.isWhitelisted,
  };
}

