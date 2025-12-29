/**
 * Type definitions for Good Dollar UBI integration
 */

import type { Address } from "viem";

/**
 * Good Dollar environment configuration
 */
export type GoodDollarEnv = "production" | "staging" | "development";

/**
 * Identity verification status
 */
export interface IdentityStatus {
  isWhitelisted: boolean;
  root: Address;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Identity expiry information
 */
export interface IdentityExpiry {
  lastAuthenticated: bigint;
  authPeriod: bigint;
  expiryTimestamp: Date;
  isExpired: boolean;
}

/**
 * Claim entitlement result
 */
export interface ClaimEntitlement {
  entitlement: bigint;
  entitlementFormatted: string; // Human-readable amount
  altClaimAvailable: boolean;
  canClaim: boolean;
}

/**
 * Wallet claim status
 */
export type WalletClaimStatusType = "not_whitelisted" | "can_claim" | "already_claimed";

export interface WalletClaimStatus {
  status: WalletClaimStatusType;
  entitlement: bigint;
  nextClaimTime?: Date;
}

/**
 * Claim transaction state
 */
export type ClaimTransactionState = "idle" | "checking" | "claiming" | "success" | "error";

export interface ClaimState {
  state: ClaimTransactionState;
  error: Error | null;
  transactionHash: string | null;
}

/**
 * Face verification link generation options
 */
export interface FaceVerificationOptions {
  popupMode?: boolean;
  callbackUrl?: string;
  chainId?: number;
}

