"use client";

import { useAccount } from "wagmi";
import { useEffect, useState, useCallback, useRef } from "react";
import type { SelfVerificationStatus, QRCodeState, QRCodeData } from "../types";
import { getSelfConfig, SELF_VERIFICATION_SESSION_KEY } from "../constants";
import {
  createQRCodeExpiry,
  generateSessionId,
  isQRCodeExpired,
  storeVerificationSession,
  clearVerificationSession,
} from "../utils";

/**
 * Hook for interacting with Self Protocol identity verification
 *
 * Provides:
 * - QR code generation for verification
 * - Verification state management
 * - Universal link handling
 * - Callback management after verification
 */
export function useSelfProtocol() {
  const { address, isConnected } = useAccount();
  const [verificationStatus, setVerificationStatus] = useState<SelfVerificationStatus>({
    isVerified: false,
    verifiedAt: null,
    proofId: null,
    isLoading: false,
    error: null,
  });
  const [qrCodeState, setQrCodeState] = useState<QRCodeState>("idle");
  const [qrCodeData, setQrCodeData] = useState<QRCodeData | null>(null);
  const [selfApp, setSelfApp] = useState<any>(null); // SelfApp instance
  const [isInitializing, setIsInitializing] = useState(true);
  const sessionIdRef = useRef<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize SelfApp when wallet is connected
  useEffect(() => {
    if (!isConnected || !address) {
      setSelfApp(null);
      return;
    }

    const initializeSelfApp = async () => {
      setIsInitializing(true);
      try {
        // Dynamic import to avoid SSR issues
        // SelfAppBuilder is from @selfxyz/qrcode, not @selfxyz/core
        const { SelfAppBuilder } = await import("@selfxyz/qrcode");
        
        const config = getSelfConfig(address);
        console.log("Initializing SelfApp with config:", {
          appName: config.appName,
          scope: config.scope,
          endpoint: config.endpoint,
          userId: config.userId,
          userIdType: "hex",
        });
        const app = new SelfAppBuilder({
          version: 2,
          appName: config.appName,
          scope: config.scope,
          endpoint: config.endpoint,
          userId: config.userId,
          userIdType: "hex", // Address is hex format
          disclosures: config.disclosures,
        }).build();

        setSelfApp(app);
        setVerificationStatus((prev) => ({
          ...prev,
          error: null,
        }));
      } catch (error) {
        console.error("Failed to initialize SelfApp:", error);
        setVerificationStatus((prev) => ({
          ...prev,
          error: error instanceof Error ? error : new Error("Failed to initialize Self Protocol"),
        }));
      } finally {
        setIsInitializing(false);
      }
    };

    initializeSelfApp();
  }, [isConnected, address]);

  // Check if user is already verified (from localStorage or backend)
  const checkVerificationStatus = useCallback(async () => {
    if (!address) {
      console.log("checkVerificationStatus: No address, skipping");
      return;
    }

    console.log("checkVerificationStatus: Starting check for", address);
    setVerificationStatus((prev) => ({ ...prev, isLoading: true }));

    try {
      // Check localStorage for cached verification status
      const cached = localStorage.getItem(`${SELF_VERIFICATION_SESSION_KEY}-${address}`);
      if (cached) {
        const data = JSON.parse(cached);
        if (data.isVerified && data.verifiedAt) {
          setVerificationStatus({
            isVerified: true,
            verifiedAt: new Date(data.verifiedAt),
            proofId: data.proofId || null,
            isLoading: false,
            error: null,
          });
          return;
        }
      }

      // Check backend for verification status using the status endpoint
      const statusEndpoint = typeof window !== 'undefined'
        ? `${window.location.origin}/api/self/verify/status`
        : '/api/self/verify/status';
      
      try {
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(`${statusEndpoint}?userId=${address}`, {
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        if (response.ok) {
          const result = await response.json();
          if (result.verified || result.isVerified) {
            setVerificationStatus({
              isVerified: true,
              verifiedAt: result.verifiedAt ? new Date(result.verifiedAt) : new Date(),
              proofId: result.proofId || null,
              isLoading: false,
              error: null,
            });
            // Cache the result
            localStorage.setItem(
              `${SELF_VERIFICATION_SESSION_KEY}-${address}`,
              JSON.stringify({
                isVerified: true,
                verifiedAt: result.verifiedAt || new Date().toISOString(),
                proofId: result.proofId,
              })
            );
            return;
          }
        } else {
          // Response not ok, but not an error - user just not verified yet
          console.log("User not verified yet, status:", response.status);
        }
      } catch (fetchError) {
        console.error("Failed to fetch verification status:", fetchError);
        // Don't throw, just continue - might be network issue
      }

      console.log("checkVerificationStatus: User not verified, clearing loading state");
      setVerificationStatus((prev) => ({
        ...prev,
        isLoading: false,
      }));
    } catch (error) {
      console.error("checkVerificationStatus: Error occurred:", error);
      // Don't set error here, just log it - verification might not be set up yet
      setVerificationStatus((prev) => ({
        ...prev,
        isLoading: false,
        error: null, // Clear any previous errors
      }));
    }
  }, [address]);

  // Poll for verification status
  const startPolling = useCallback((sessionId: string) => {
    // Clear any existing polling
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    const poll = async () => {
      try {
        if (!address) return;
        
        // Use the status endpoint, not the verify endpoint
        const statusEndpoint = typeof window !== 'undefined'
          ? `${window.location.origin}/api/self/verify/status`
          : '/api/self/verify/status';
        
        // Check by userId (address) since Self Protocol doesn't return the same sessionId
        const response = await fetch(`${statusEndpoint}?userId=${address}`);

        if (response.ok) {
          const result = await response.json();
          if (result.verified || result.isVerified) {
            // Verification successful
            setVerificationStatus({
              isVerified: true,
              verifiedAt: result.verifiedAt ? new Date(result.verifiedAt) : new Date(),
              proofId: result.proofId || null,
              isLoading: false,
              error: null,
            });

            // Cache the result
            if (address) {
              localStorage.setItem(
                `${SELF_VERIFICATION_SESSION_KEY}-${address}`,
                JSON.stringify({
                  isVerified: true,
                  verifiedAt: result.verifiedAt || new Date().toISOString(),
                  proofId: result.proofId,
                })
              );
            }

            setQrCodeState("verified");
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
          }
        }
      } catch (error) {
        console.error("Polling error:", error);
        // Continue polling on error
      }
    };

    // Poll every 2 seconds
    pollIntervalRef.current = setInterval(poll, 2000);

    // Stop polling after 5 minutes (QR code expiry)
    setTimeout(() => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (qrCodeState === "displaying") {
        setQrCodeState("expired");
      }
    }, 5 * 60 * 1000);
  }, [address, qrCodeState]);

  // Generate QR code for verification
  const generateQRCode = useCallback(async () => {
    if (!selfApp || !address) {
      setVerificationStatus((prev) => ({
        ...prev,
        error: new Error("SelfApp not initialized or wallet not connected"),
      }));
      return;
    }

    setQrCodeState("generating");
    setVerificationStatus((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const sessionId = generateSessionId();
      sessionIdRef.current = sessionId;

      const config = getSelfConfig(address);
      const expiresAt = createQRCodeExpiry();

      // The SelfQRcodeWrapper component will handle QR code generation
      // We just need to set the state to displaying and let the component render
      // The SelfApp instance contains all the necessary configuration
      const qrCodeData: QRCodeData = {
        qrCodeUrl: '', // Will be generated by SelfQRcodeWrapper
        universalLink: '', // Will be generated by SelfQRcodeWrapper
        expiresAt,
        sessionId,
      };

      setQrCodeData(qrCodeData);
      setQrCodeState("displaying");

      // Store session data
      storeVerificationSession(sessionId, {
        address,
        expiresAt: expiresAt.toISOString(),
        qrCodeData,
      });

      // Start polling for verification status
      startPolling(sessionId);

      setVerificationStatus((prev) => ({
        ...prev,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Failed to generate QR code:", error);
      setQrCodeState("error");
      setVerificationStatus((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error("Failed to generate QR code"),
      }));
    }
  }, [selfApp, address, startPolling]);

  // Handle verification callback (called after user scans QR code)
  const handleVerificationCallback = useCallback(async (sessionId: string, proof: any) => {
    if (!address) return;

    setVerificationStatus((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const config = getSelfConfig(address);
      const endpoint = config.endpoint.startsWith('/') 
        ? `${window.location.origin}${config.endpoint}` 
        : config.endpoint;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          proof,
          userId: address,
        }),
      });

      if (!response.ok) {
        throw new Error("Verification failed");
      }

      const result = await response.json();

      if (result.success && result.verified) {
        setVerificationStatus({
          isVerified: true,
          verifiedAt: result.verifiedAt ? new Date(result.verifiedAt) : new Date(),
          proofId: result.proofId || null,
          isLoading: false,
          error: null,
        });

        // Cache the result
        localStorage.setItem(
          `${SELF_VERIFICATION_SESSION_KEY}-${address}`,
          JSON.stringify({
            isVerified: true,
            verifiedAt: result.verifiedAt || new Date().toISOString(),
            proofId: result.proofId,
          })
        );

        setQrCodeState("verified");
        clearVerificationSession(sessionId);
      } else {
        throw new Error(result.error || "Verification failed");
      }
    } catch (error) {
      console.error("Verification callback error:", error);
      setVerificationStatus((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error("Verification failed"),
      }));
      setQrCodeState("error");
    }
  }, [address]);

  // Reset verification state
  const resetVerification = useCallback(() => {
    setQrCodeState("idle");
    setQrCodeData(null);
    if (sessionIdRef.current) {
      clearVerificationSession(sessionIdRef.current);
      sessionIdRef.current = null;
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Check verification status on mount
  useEffect(() => {
    // Only check verification status after initialization is complete
    if (isConnected && address && !isInitializing && selfApp) {
      console.log("Checking verification status for:", address);
      checkVerificationStatus().catch((error) => {
        console.error("Error checking verification status:", error);
        // Ensure loading state is cleared even on error
        setVerificationStatus((prev) => ({
          ...prev,
          isLoading: false,
        }));
      });
    }
  }, [isConnected, address, isInitializing, selfApp]); // Removed checkVerificationStatus from deps to avoid infinite loops

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Check QR code expiry
  useEffect(() => {
    if (!qrCodeData || qrCodeState !== "displaying") return;

    const checkExpiry = setInterval(() => {
      if (isQRCodeExpired(qrCodeData.expiresAt)) {
        setQrCodeState("expired");
        clearInterval(checkExpiry);
      }
    }, 1000);

    return () => clearInterval(checkExpiry);
  }, [qrCodeData, qrCodeState]);

  return {
    selfApp,
    verificationStatus,
    qrCodeState,
    qrCodeData,
    isInitializing,
    isReady: !isInitializing && !!selfApp,
    generateQRCode,
    checkVerificationStatus,
    handleVerificationCallback,
    resetVerification,
  };
}

