"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useClaimSDK } from "@/lib/gooddollar/hooks/useClaimSDK";
import { useAccount, useChainId } from "wagmi";
import {
  Coins,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { isSupportedChain, formatEntitlement } from "@/lib/gooddollar/utils";
import { getTimeUntilNextClaim } from "@/lib/gooddollar/utils";
import { GOODDOLLAR_DOCS } from "@/lib/gooddollar/constants";
import { useState } from "react";

export function UbiClaimCard() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const {
    entitlement,
    walletClaimStatus,
    nextClaimTime,
    claim,
    claimState,
    isInitializing,
    isReady,
    canClaim,
    isWhitelisted,
    checkEntitlement,
  } = useClaimSDK();
  const [isClaiming, setIsClaiming] = useState(false);

  if (!isConnected || !address) {
    return null;
  }

  if (!isSupportedChain(chainId)) {
    return null;
  }

  const handleClaim = async () => {
    if (!canClaim || isClaiming) {
      return;
    }

    setIsClaiming(true);
    try {
      await claim((message) => {
        toast.info(message, { duration: 3000 });
      });

      toast.success("Successfully claimed G$ tokens!", {
        description: "Your Good Dollar tokens have been added to your wallet.",
        duration: 5000,
      });

      // Refresh entitlement
      await checkEntitlement();
    } catch (error) {
      console.error("Claim failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to claim G$ tokens. Please try again.",
        { duration: 5000 }
      );
    } finally {
      setIsClaiming(false);
    }
  };

  const isLoading = isInitializing || claimState.state === "checking";
  const isClaimingTransaction = isClaiming || claimState.state === "claiming";
  const hasError = claimState.state === "error";
  const isSuccess = claimState.state === "success";

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-green" />
              Good Dollar UBI
            </CardTitle>
            <CardDescription>Claim your daily Universal Basic Income tokens</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* Not Whitelisted State */}
        {!isWhitelisted && (
          <div className="p-4 rounded-lg bg-muted/30 border border-white/10">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Identity Verification Required</p>
                <p className="text-xs text-muted-foreground">
                  You need to verify your identity before you can claim UBI tokens. Complete the face verification process above.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isWhitelisted && isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-green" />
            <span className="ml-2 text-muted-foreground">Checking entitlement...</span>
          </div>
        )}

        {/* Error State */}
        {isWhitelisted && !isLoading && hasError && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive mb-1">Error</p>
                <p className="text-xs text-muted-foreground mb-3">
                  {claimState.error?.message || "Failed to check entitlement"}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => checkEntitlement()}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Success State (After Claim) */}
        {isWhitelisted && !isLoading && isSuccess && (
          <div className="p-4 rounded-lg bg-green/10 border border-green/20">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green mb-1">Claim Successful!</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Your G$ tokens have been added to your wallet.
                </p>
                {claimState.transactionHash && (
                  <a
                    href={`https://celoscan.io/tx/${claimState.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green hover:underline flex items-center gap-1"
                  >
                    View transaction
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Content - Ready to Claim */}
        {isWhitelisted &&
          !isLoading &&
          !hasError &&
          !isSuccess &&
          walletClaimStatus && (
            <>
              {/* Claimable Amount */}
              <div className="p-4 rounded-lg bg-green/10 border border-green/20">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Available to Claim</p>
                  {walletClaimStatus.status === "can_claim" && (
                    <span className="text-xs px-2 py-1 rounded-full bg-green/20 text-green">
                      Ready
                    </span>
                  )}
                </div>
                <p className="text-3xl font-bold text-green">
                  {/* Use entitlement from walletClaimStatus if available, otherwise fallback to entitlement state */}
                  {walletClaimStatus.entitlement && walletClaimStatus.entitlement > 0n
                    ? formatEntitlement(walletClaimStatus.entitlement)
                    : entitlement?.entitlementFormatted || "0"} G$
                </p>
                {entitlement?.altClaimAvailable && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Alternative claim available
                  </p>
                )}
              </div>

              {/* Status Information */}
              {walletClaimStatus.status === "already_claimed" && nextClaimTime && (
                <div className="p-4 rounded-lg bg-muted/30 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Next Claim Available</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getTimeUntilNextClaim(nextClaimTime)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {nextClaimTime.toLocaleString()}
                  </p>
                </div>
              )}

              {/* Claim Button */}
              <Button
                onClick={handleClaim}
                disabled={!canClaim || isClaimingTransaction || walletClaimStatus.status !== "can_claim"}
                className="w-full"
                size="lg"
              >
                {isClaimingTransaction ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Claiming...
                  </>
                ) : walletClaimStatus.status === "already_claimed" ? (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    Already Claimed Today
                  </>
                ) : canClaim ? (
                  <>
                    <Coins className="h-4 w-4 mr-2" />
                    Claim G$ Tokens
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    No Claim Available
                  </>
                )}
              </Button>

              {/* Info Link */}
              <div className="pt-2 border-t border-white/10">
                <a
                  href={GOODDOLLAR_DOCS.UBI}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-green transition-colors flex items-center gap-1"
                >
                  Learn more about Good Dollar UBI
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </>
          )}
      </CardContent>
    </Card>
  );
}

