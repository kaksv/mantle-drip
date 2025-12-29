"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useIdentitySDK } from "@/lib/gooddollar/hooks/useIdentitySDK";
import { useAccount, useChainId } from "wagmi";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { isSupportedChain } from "@/lib/gooddollar/utils";
import { GOODDOLLAR_DOCS } from "@/lib/gooddollar/constants";
import { UbiClaimCard } from "./ubi-claim-card";

export function FaceVerification() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { identityStatus, generateFaceVerificationLink, isReady, checkWhitelistStatus } = useIdentitySDK();
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [verificationLink, setVerificationLink] = useState<string | null>(null);

  // Auto-refresh status when component mounts (in case user just returned from verification)
  useEffect(() => {
    if (isReady && address) {
      // Check if we're returning from verification
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('verification') === 'complete' || urlParams.get('fv') === 'success') {
        // Status will be refreshed by useIdentitySDK hook, but we can also trigger it here
        setTimeout(() => {
          checkWhitelistStatus();
        }, 1000);
      }
    }
  }, [isReady, address, checkWhitelistStatus]);

  if (!isConnected || !address) {
    return null;
  }

  if (!isSupportedChain(chainId)) {
    return null;
  }

  // Show UBI claim card if already verified
  if (identityStatus.isWhitelisted) {
    return <UbiClaimCard />;
  }

  const handleGenerateLink = async () => {
    if (!isReady) {
      toast.error("Identity SDK is not ready. Please wait...");
      return;
    }

    setIsGeneratingLink(true);
    try {
      const callbackUrl = `${window.location.origin}${window.location.pathname}?verification=complete`;
      const link = await generateFaceVerificationLink({
        popupMode: false,
        callbackUrl,
        chainId,
      });

      setVerificationLink(link);
      
      // Set flag in localStorage to indicate verification in progress
      if (address && typeof window !== 'undefined') {
        localStorage.setItem(`gd_verification_${address}`, 'in_progress');
      }
      
      toast.success("Verification link generated. Opening in new tab...");
      
      // Open in new tab
      if (link) {
        window.open(link, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      console.error("Failed to generate verification link:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to generate verification link. Please try again."
      );
    } finally {
      setIsGeneratingLink(false);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Face Verification
        </CardTitle>
        <CardDescription>
          Verify your identity to start claiming Good Dollar UBI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-muted/30 border border-white/10">
          <p className="text-sm text-muted-foreground mb-2">
            To claim Good Dollar UBI, you need to verify your identity through face verification.
            This is a one-time process that helps prevent fraud and ensures fair distribution.
          </p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>One person = One identity</li>
            <li>Secure and privacy-preserving</li>
            <li>Required to claim daily UBI</li>
          </ul>
        </div>

        {verificationLink ? (
          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-green/10 border border-green/20">
              <p className="text-sm text-green font-medium mb-2">
                Verification link generated
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Complete the verification process in the new tab. Once verified, return here and refresh.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(verificationLink, "_blank", "noopener,noreferrer")}
                  className="flex-1"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Verification
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    setVerificationLink(null);
                    toast.info("Refreshing identity status...");
                    // Refresh identity status without page reload
                    await checkWhitelistStatus();
                    toast.success("Status refreshed!");
                  }}
                >
                  Refresh Status
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Button
            onClick={handleGenerateLink}
            disabled={isGeneratingLink || !isReady || identityStatus.isLoading}
            className="w-full"
            size="lg"
          >
            {isGeneratingLink ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Link...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Verify Identity
              </>
            )}
          </Button>
        )}

        <div className="pt-2 border-t border-white/10">
          <a
            href={GOODDOLLAR_DOCS.IDENTITY}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-green transition-colors flex items-center gap-1"
          >
            Learn more about identity verification
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

