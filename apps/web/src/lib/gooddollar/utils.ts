/**
 * Utility functions for Good Dollar UBI integration
 */

import { formatUnits } from "viem";
import type { ClaimEntitlement } from "./types";

/**
 * Format a bigint entitlement amount to a human-readable string
 * @param entitlement - The entitlement amount in wei (smallest unit)
 * @param decimals - Token decimals (default: 18 for G$)
 * @returns Formatted string with appropriate decimal places
 */
export function formatEntitlement(
  entitlement: bigint | undefined | null,
  decimals: number = 18
): string {
  if (!entitlement || entitlement === 0n) {
    return "0";
  }

  try {
    const formatted = formatUnits(entitlement, decimals);
    
    // Remove trailing zeros and unnecessary decimal points
    return parseFloat(formatted).toString();
  } catch (error) {
    console.error("Error formatting entitlement:", error);
    return "0";
  }
}

/**
 * Create a ClaimEntitlement object with formatted amount
 * @param entitlement - Raw entitlement amount
 * @param altClaimAvailable - Whether alternative claim is available
 * @param decimals - Token decimals
 */
export function createClaimEntitlement(
  entitlement: bigint | undefined | null,
  altClaimAvailable: boolean = false,
  decimals: number = 18
): ClaimEntitlement {
  const entitlementAmount = entitlement ?? 0n;
  return {
    entitlement: entitlementAmount,
    entitlementFormatted: formatEntitlement(entitlementAmount, decimals),
    altClaimAvailable,
    canClaim: entitlementAmount > 0n,
  };
}

/**
 * Calculate time until next claim
 * @param nextClaimTime - Date when next claim is available
 * @returns Human-readable time string (e.g., "2 hours", "1 day")
 */
export function getTimeUntilNextClaim(nextClaimTime: Date): string {
  const now = new Date();
  const diff = nextClaimTime.getTime() - now.getTime();

  if (diff <= 0) {
    return "Available now";
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? "s" : ""}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  } else {
    return `${minutes} minute${minutes > 1 ? "s" : ""}`;
  }
}

/**
 * Check if a chain ID is supported by Good Dollar
 * @param chainId - The chain ID to check
 * @returns Whether the chain is supported
 */
export function isSupportedChain(chainId: number): boolean {
  return chainId === 42220 || chainId === 11142220; // Celo Mainnet or Sepolia
}

/**
 * Get a user-friendly error message from an error
 * @param error - The error object
 * @returns User-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Handle specific error cases
    if (error.message.includes("not whitelisted")) {
      return "Your wallet is not verified. Please complete identity verification first.";
    }
    if (error.message.includes("already claimed")) {
      return "You have already claimed your UBI for today. Please try again tomorrow.";
    }
    if (error.message.includes("insufficient balance")) {
      return "Insufficient balance for gas fees. Please add some CELO to your wallet.";
    }
    if (error.message.includes("user rejected")) {
      return "Transaction was cancelled.";
    }
    
    return error.message;
  }
  
  return "An unexpected error occurred. Please try again.";
}

