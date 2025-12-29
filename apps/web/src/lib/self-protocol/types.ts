/**
 * Type definitions for Self Protocol identity verification integration
 */

import type { Address } from "viem";

/**
 * Self Protocol verification status
 */
export interface SelfVerificationStatus {
  isVerified: boolean;
  verifiedAt: Date | null;
  proofId: string | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Self Protocol verification request configuration
 */
export interface SelfVerificationConfig {
  appName: string;
  scope: string;
  endpoint: string;
  userId: Address;
  disclosures: {
    date_of_birth?: boolean;
    minimumAge?: number;
    [key: string]: boolean | number | undefined;
  };
}

/**
 * QR code verification state
 */
export type QRCodeState = "idle" | "generating" | "displaying" | "scanning" | "verified" | "expired" | "error";

/**
 * Self Protocol verification result from backend
 */
export interface SelfVerificationResult {
  success: boolean;
  verified: boolean;
  proofId?: string;
  verifiedAt?: Date;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * QR code data
 */
export interface QRCodeData {
  qrCodeUrl: string;
  universalLink: string;
  expiresAt: Date;
  sessionId: string;
}

