"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useIdentitySDK } from "@/lib/gooddollar/hooks/useIdentitySDK";
import { useAccount, useChainId } from "wagmi";
import { CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isSupportedChain } from "@/lib/gooddollar/utils";
import { formatAddress } from "@/lib/utils";

export function IdentityStatus() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const {
    identityStatus,
    identityExpiry,
    isInitializing,
    isReady,
    checkWhitelistStatus,
  } = useIdentitySDK();

  if (!isConnected || !address) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Identity Status</CardTitle>
          <CardDescription>Connect your wallet to check your identity status</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!isSupportedChain(chainId)) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Identity Status</CardTitle>
          <CardDescription>Good Dollar is only available on Celo Mainnet and Sepolia</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Please switch to Celo Mainnet or Celo Sepolia to use Good Dollar features.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isLoading = isInitializing || identityStatus.isLoading;

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Identity Status</CardTitle>
            <CardDescription>Your Good Dollar identity verification status</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={checkWhitelistStatus}
            disabled={isLoading || !isReady}
            className="h-8 w-8"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-green" />
            <span className="ml-2 text-muted-foreground">Checking identity status...</span>
          </div>
        ) : identityStatus.error ? (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <XCircle className="h-5 w-5 text-destructive" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">Error</p>
              <p className="text-xs text-muted-foreground mt-1">{identityStatus.error.message}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Verification Status */}
            <div className="flex items-center gap-3 p-4 rounded-lg border border-white/10">
              {identityStatus.isWhitelisted ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green">Verified</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your wallet is verified and whitelisted. You can now claim your daily Good Dollar UBI tokens.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Not Verified</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Complete identity verification to claim UBI
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Identity Root Address */}
            {identityStatus.isWhitelisted && identityStatus.root !== "0x0000000000000000000000000000000000000000" && (
              <div className="p-4 rounded-lg bg-muted/30 border border-white/10">
                <p className="text-xs text-muted-foreground mb-1">Identity Root</p>
                <p className="text-sm font-mono">{formatAddress(identityStatus.root)}</p>
              </div>
            )}

            {/* Identity Expiry */}
            {identityExpiry && (
              <div className="p-4 rounded-lg bg-muted/30 border border-white/10">
                <p className="text-xs text-muted-foreground mb-1">Identity Expiry</p>
                <p className="text-sm">
                  {identityExpiry.isExpired ? (
                    <span className="text-destructive">Expired</span>
                  ) : (
                    <span className="text-green">Valid until {identityExpiry.expiryTimestamp.toLocaleDateString()}</span>
                  )}
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

