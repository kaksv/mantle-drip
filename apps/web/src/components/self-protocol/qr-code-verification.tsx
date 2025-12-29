"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSelfProtocol } from "@/lib/self-protocol/hooks/useSelfProtocol";

// Only import if we need the hook as fallback
import { QrCode, Loader2, RefreshCw, Clock, CheckCircle2, XCircle } from "lucide-react";
import { getTimeUntilExpiry } from "@/lib/self-protocol/utils";
import { useEffect, useState, useCallback, type ComponentType } from "react";

// QR Code Wrapper Component - uses SelfQRcodeWrapper when available
function QRCodeWrapper({ 
  selfApp, 
  onVerified,
  handleVerificationCallback 
}: { 
  selfApp: any; 
  onVerified?: (proof: any, sessionId: string) => void;
  handleVerificationCallback?: (sessionId: string, proof: any) => void;
}) {
  const [QRCodeComponent, setQRCodeComponent] = useState<ComponentType<any> | null>(null);

  useEffect(() => {
    if (!selfApp) return;

    // Dynamically import SelfQRcodeWrapper
    import("@selfxyz/qrcode")
      .then((module) => {
        const { SelfQRcodeWrapper } = module;
        setQRCodeComponent(() => SelfQRcodeWrapper);
      })
      .catch((error) => {
        console.error("Failed to load SelfQRcodeWrapper:", error);
        // Fallback to img if SDK not available
        setQRCodeComponent(null);
      });
  }, [selfApp]);

  // Handle verification callback from SelfQRcodeWrapper
  const handleVerified = useCallback((proof: any, sessionId?: string) => {
    console.log("Self Protocol verification callback received:", { proof, sessionId });
    if (onVerified) {
      onVerified(proof, sessionId || '');
    }
    // Also call the hook's callback handler
    if (handleVerificationCallback && sessionId) {
      handleVerificationCallback(sessionId, proof);
    }
  }, [onVerified, handleVerificationCallback]);

  if (!selfApp) {
    return (
      <div className="w-64 h-64 flex items-center justify-center bg-muted rounded-lg">
        <p className="text-xs text-muted-foreground">Initializing...</p>
      </div>
    );
  }

  if (QRCodeComponent) {
    // SelfQRcodeWrapper typically takes the SelfApp instance and callback props
    // Common prop names: onVerified, onSuccess, callback, onProof
    return (
      <QRCodeComponent 
        selfApp={selfApp} 
        onVerified={handleVerified}
        onSuccess={handleVerified}
        callback={handleVerified}
        onProof={handleVerified}
      />
    );
  }

  // Fallback: try to get QR code URL from selfApp
  const qrCodeUrl = (selfApp as any)?.qrCodeUrl || (selfApp as any)?.url || '';
  
  if (qrCodeUrl) {
    return (
      <img
        src={qrCodeUrl}
        alt="Self Protocol QR Code"
        className="w-64 h-64"
      />
    );
  }

  return (
    <div className="w-64 h-64 flex items-center justify-center bg-muted rounded-lg">
      <p className="text-xs text-muted-foreground">QR Code not available</p>
    </div>
  );
}

interface QRCodeVerificationProps {
  onVerified?: () => void;
  qrCodeState?: any;
  qrCodeData?: any;
  verificationStatus?: any;
  generateQRCode?: () => void;
  resetVerification?: () => void;
  isReady?: boolean;
  selfApp?: any;
  handleVerificationCallback?: (sessionId: string, proof: any) => void;
}

export function QRCodeVerification({ 
  onVerified,
  qrCodeState: propQrCodeState,
  qrCodeData: propQrCodeData,
  verificationStatus: propVerificationStatus,
  generateQRCode: propGenerateQRCode,
  resetVerification: propResetVerification,
  isReady: propIsReady,
  selfApp: propSelfApp,
  handleVerificationCallback: propHandleVerificationCallback,
}: QRCodeVerificationProps) {
  // Always call hook (React rules), but use props if provided
  const hookValues = useSelfProtocol();
  
  // Use props if provided, otherwise fall back to hook values
  const qrCodeState = propQrCodeState ?? hookValues.qrCodeState;
  const qrCodeData = propQrCodeData ?? hookValues.qrCodeData;
  const verificationStatus = propVerificationStatus ?? hookValues.verificationStatus;
  const generateQRCode = propGenerateQRCode ?? hookValues.generateQRCode;
  const resetVerification = propResetVerification ?? hookValues.resetVerification;
  const isReady = propIsReady ?? hookValues.isReady;
  const selfApp = propSelfApp ?? hookValues.selfApp;
  const handleVerificationCallback = propHandleVerificationCallback ?? hookValues.handleVerificationCallback;
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  // Update time remaining
  useEffect(() => {
    if (!qrCodeData || qrCodeState !== "displaying") {
      setTimeRemaining("");
      return;
    }

    const updateTime = () => {
      setTimeRemaining(getTimeUntilExpiry(qrCodeData.expiresAt));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [qrCodeData, qrCodeState]);

  // Call onVerified when verification is complete
  useEffect(() => {
    if (verificationStatus.isVerified && onVerified) {
      onVerified();
    }
  }, [verificationStatus.isVerified, onVerified]);

  if (verificationStatus.isVerified) {
    return null; // Don't show QR code if already verified
  }

  if (qrCodeState === "idle") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          Click the button below to generate a QR code for verification
        </p>
        <Button
          onClick={generateQRCode}
          disabled={!isReady || verificationStatus.isLoading}
          className="w-full"
          size="lg"
        >
          {verificationStatus.isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <QrCode className="h-4 w-4 mr-2" />
              Generate QR Code
            </>
          )}
        </Button>
      </div>
    );
  }

  if (qrCodeState === "generating") {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-green mb-4" />
        <p className="text-sm text-muted-foreground">Generating QR code...</p>
      </div>
    );
  }

  if (qrCodeState === "error") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">Error</p>
            <p className="text-xs text-muted-foreground mt-1">
              {verificationStatus.error?.message || "Failed to generate QR code"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={resetVerification} variant="outline" className="flex-1">
            Try Again
          </Button>
          <Button onClick={generateQRCode} className="flex-1">
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate
          </Button>
        </div>
      </div>
    );
  }

  if (qrCodeState === "expired") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <Clock className="h-5 w-5 text-yellow-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-500">QR Code Expired</p>
            <p className="text-xs text-muted-foreground mt-1">
              The QR code has expired. Please generate a new one.
            </p>
          </div>
        </div>
        <Button onClick={resetVerification} className="w-full" size="lg">
          <RefreshCw className="h-4 w-4 mr-2" />
          Generate New QR Code
        </Button>
      </div>
    );
  }

  if (qrCodeState === "verified") {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-green/10 border border-green/20">
        <CheckCircle2 className="h-5 w-5 text-green flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-green">Verification Successful</p>
          <p className="text-xs text-muted-foreground mt-1">
            Your identity has been verified using Self Protocol
          </p>
        </div>
      </div>
    );
  }

  if (qrCodeState === "displaying" && (qrCodeData || selfApp)) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center">
          <div className="p-4 bg-white rounded-lg mb-4">
            {/* QR Code - using SelfQRcodeWrapper with SelfApp instance */}
            {typeof window !== "undefined" && selfApp ? (
              <QRCodeWrapper 
                selfApp={selfApp} 
                handleVerificationCallback={handleVerificationCallback}
                onVerified={(proof, sessionId) => {
                  console.log("QR Code verification completed:", { proof, sessionId });
                }}
              />
            ) : qrCodeData?.qrCodeUrl ? (
              <img
                src={qrCodeData.qrCodeUrl}
                alt="Self Protocol QR Code"
                className="w-64 h-64"
              />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Generating QR code...</p>
              </div>
            )}
          </div>
          {timeRemaining && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Expires in {timeRemaining}</span>
            </div>
          )}
        </div>

        <div className="p-4 rounded-lg bg-muted/30 border border-white/10">
          <p className="text-sm text-muted-foreground mb-2">
            Scan this QR code with the Self mobile app to verify your identity.
          </p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Open the Self app on your mobile device</li>
            <li>Tap "Scan QR Code"</li>
            <li>Point your camera at this QR code</li>
            <li>Follow the prompts to complete verification</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <Button onClick={resetVerification} variant="outline" className="flex-1">
            Cancel
          </Button>
          <Button onClick={generateQRCode} variant="outline" className="flex-1">
            <RefreshCw className="h-4 w-4 mr-2" />
            New QR Code
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

