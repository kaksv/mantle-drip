/**
 * Utility functions for Self Protocol identity verification integration
 */

import type { SelfVerificationResult } from "./types";
import { QR_CODE_EXPIRY_MS } from "./constants";

/**
 * Check if QR code is expired
 * @param expiresAt - Expiry timestamp
 * @returns Whether the QR code is expired
 */
export function isQRCodeExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

/**
 * Get time until QR code expires
 * @param expiresAt - Expiry timestamp
 * @returns Human-readable time string (e.g., "2 minutes", "30 seconds")
 */
export function getTimeUntilExpiry(expiresAt: Date): string {
  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();

  if (diff <= 0) {
    return "Expired";
  }

  const minutes = Math.floor(diff / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? "s" : ""}`;
  } else {
    return `${seconds} second${seconds > 1 ? "s" : ""}`;
  }
}

/**
 * Create expiry date for QR code
 * @returns Date object for QR code expiry
 */
export function createQRCodeExpiry(): Date {
  return new Date(Date.now() + QR_CODE_EXPIRY_MS);
}

/**
 * Generate a unique session ID
 * @returns Random session ID string
 */
export function generateSessionId(): string {
  return `self_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Get user-friendly error message from verification result
 * @param result - Verification result
 * @returns User-friendly error message
 */
export function getVerificationErrorMessage(result: SelfVerificationResult): string {
  if (result.success && result.verified) {
    return "";
  }

  if (result.error) {
    // Handle specific error cases
    if (result.error.includes("expired")) {
      return "Verification proof has expired. Please scan the QR code again.";
    }
    if (result.error.includes("invalid")) {
      return "Invalid verification proof. Please try again.";
    }
    if (result.error.includes("signature")) {
      return "Proof signature verification failed. Please try again.";
    }
    
    return result.error;
  }

  return "Verification failed. Please try again.";
}

/**
 * Store verification session in localStorage
 * @param sessionId - Session ID
 * @param data - Session data
 */
export function storeVerificationSession(sessionId: string, data: unknown): void {
  try {
    const dataObj = typeof data === 'object' && data !== null ? data : {};
    localStorage.setItem(
      `self-session-${sessionId}`,
      JSON.stringify({
        ...dataObj,
        createdAt: new Date().toISOString(),
      })
    );
  } catch (error) {
    console.error("Failed to store verification session:", error);
  }
}

/**
 * Get verification session from localStorage
 * @param sessionId - Session ID
 * @returns Session data or null
 */
export function getVerificationSession(sessionId: string): unknown | null {
  try {
    const stored = localStorage.getItem(`self-session-${sessionId}`);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.error("Failed to get verification session:", error);
    return null;
  }
}

/**
 * Clear verification session from localStorage
 * @param sessionId - Session ID
 */
export function clearVerificationSession(sessionId: string): void {
  try {
    localStorage.removeItem(`self-session-${sessionId}`);
  } catch (error) {
    console.error("Failed to clear verification session:", error);
  }
}

