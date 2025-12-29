"use client";

import { useAccount } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pause, Play, X, Download, ExternalLink, Lock } from "lucide-react";
import { formatEther, formatUnits } from "viem";
import { formatTokenAmount } from "@/lib/utils/format";
import { useDrip, useRecipientBalance, useStreamRateLockStatus } from "@/lib/contracts";
import { getTokenByAddress } from "@/components/token-selector";
import { useChainId } from "wagmi";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Tooltip } from "@/components/ui/tooltip";

interface StreamCardEnhancedProps {
  streamId: bigint;
  sender: string;
  recipients: string[];
  token: string;
  startTime: bigint;
  endTime: bigint;
  status: number; // 0 = Pending, 1 = Active, 2 = Paused, 3 = Cancelled, 4 = Completed
  title?: string;
  userRole?: "sender" | "recipient" | "both";
}

export function StreamCardEnhanced({
  streamId,
  sender,
  recipients,
  token,
  startTime,
  endTime,
  status,
  title,
  userRole,
}: StreamCardEnhancedProps) {
  const { address } = useAccount();
  const chainId = useChainId();
  const { pauseStream, resumeStream, cancelStream, withdrawFromStream, isPending, isConfirming, isConfirmed } = useDrip();
  const rateLockStatus = useStreamRateLockStatus(streamId);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  // Contract enum: 0 = Pending, 1 = Active, 2 = Paused, 3 = Cancelled, 4 = Completed
  const isStreamPending = status === 0;
  const isActive = status === 1;
  const isPaused = status === 2;
  const isCancelled = status === 3;
  const isCompleted = status === 4;

  const tokenInfo = getTokenByAddress(token as `0x${string}`, chainId);
  const decimals = tokenInfo?.decimals || 18;
  const symbol = tokenInfo?.symbol || "Token";

  // Calculate if stream has expired
  const now = Math.floor(Date.now() / 1000);
  const endTimeNum = Number(endTime);
  const hasExpired = now >= endTimeNum;

  // Fetch balance for user if they are a recipient
  // Allow balance fetching for Active, Paused, and Completed streams (even if expired, recipients can still withdraw their share)
  // The contract allows withdrawals from Active, Paused, and Completed streams, and distributes remaining deposit when expired
  const isUserRecipient = address && recipients.some(r => r.toLowerCase() === address.toLowerCase());
  const canWithdraw = (isActive || isPaused || isCompleted); // Contract allows withdrawals from Active, Paused, and Completed streams
  const { balance: userBalance, refetch: refetchBalance } = useRecipientBalance(
    isUserRecipient && canWithdraw ? streamId : undefined,
    isUserRecipient ? address : undefined
  );

  // Poll for balance updates every 15 seconds for active/paused/expired streams
  // Reduced from 5 seconds to improve performance
  useEffect(() => {
    if (!isUserRecipient || !canWithdraw) return;

    const interval = setInterval(() => {
      refetchBalance();
    }, 15000); // Increased from 5000ms to 15000ms

    return () => clearInterval(interval);
  }, [isUserRecipient, canWithdraw, refetchBalance]);

  // Watch for transaction confirmation
  useEffect(() => {
    if (pendingAction && isConfirmed) {
      switch (pendingAction) {
        case "pause":
          toast.success("Stream paused", { id: "pause-stream" });
          break;
        case "resume":
          toast.success("Stream resumed", { id: "resume-stream" });
          break;
        case "cancel":
          toast.success("Stream cancelled. All accrued funds were sent to recipients.", { id: "cancel-stream" });
          break;
        case "withdraw":
          toast.success("Withdrawal successful", { id: "withdraw-stream" });
          // Refetch balance after withdrawal
          setTimeout(() => refetchBalance(), 2000);
          break;
      }
      setPendingAction(null);
    }
  }, [isConfirmed, pendingAction, refetchBalance]);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatTime = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString();
  };

  const getTimeRemaining = () => {
    if (!isActive && !isPaused) return null;
    const now = BigInt(Math.floor(Date.now() / 1000));
    if (endTime > now) {
      const remaining = Number(endTime - now);
      const days = Math.floor(remaining / 86400);
      const hours = Math.floor((remaining % 86400) / 3600);
      return `${days}d ${hours}h`;
    }
    return "Ended";
  };

  const handlePause = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      toast.loading("Submitting transaction...", { id: "pause-stream" });
      setPendingAction("pause");
      await pauseStream(streamId);
      toast.loading("Waiting for confirmation...", { id: "pause-stream" });
    } catch (error: any) {
      toast.error(error?.message || "Failed to pause stream", { id: "pause-stream" });
      setPendingAction(null);
    }
  };

  const handleResume = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      toast.loading("Submitting transaction...", { id: "resume-stream" });
      setPendingAction("resume");
      await resumeStream(streamId);
      toast.loading("Waiting for confirmation...", { id: "resume-stream" });
    } catch (error: any) {
      toast.error(error?.message || "Failed to resume stream", { id: "resume-stream" });
      setPendingAction(null);
    }
  };

  const handleCancel = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to cancel this stream? All accrued funds will be automatically sent to recipients, and any remaining deposit will be refunded to you.")) return;
    
    try {
      toast.loading("Submitting transaction...", { id: "cancel-stream" });
      setPendingAction("cancel");
      await cancelStream(streamId);
      toast.loading("Waiting for confirmation...", { id: "cancel-stream" });
    } catch (error: any) {
      toast.error(error?.message || "Failed to cancel stream", { id: "cancel-stream" });
      setPendingAction(null);
    }
  };

  const handleWithdraw = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!address) return;
    
    try {
      toast.loading("Submitting transaction...", { id: "withdraw-stream" });
      setPendingAction("withdraw");
      // Withdraw maximum available (0 means withdraw all)
      await withdrawFromStream(streamId, address);
      toast.loading("Waiting for confirmation...", { id: "withdraw-stream" });
    } catch (error: any) {
      toast.error(error?.message || "Failed to withdraw", { id: "withdraw-stream" });
      setPendingAction(null);
    }
  };

  const isUserSender = address && sender.toLowerCase() === address.toLowerCase();

  return (
    <Card className="glass-card card-hover cursor-pointer w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg text-foreground">
              {title || `Stream #${streamId.toString()}`}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              ID: {streamId.toString()}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {isActive && !isPaused && (
              <span className="px-2 py-1 text-xs font-medium bg-green/20 text-green rounded-full border border-green/30">
                Active
              </span>
            )}
            {isPaused && (
              <span className="px-2 py-1 text-xs font-medium bg-orange/20 text-orange rounded-full border border-orange/30">
                Paused
              </span>
            )}
            {isCompleted && (
              <span className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-full border border-border">
                Completed
              </span>
            )}
            {isCancelled && (
              <span className="px-2 py-1 text-xs font-medium bg-destructive/20 text-destructive rounded-full border border-destructive/30">
                Cancelled
              </span>
            )}
            {rateLockStatus.isLocked && (
              <Tooltip
                content={
                  <div className="space-y-1">
                    <p className="font-semibold">Stream Rates are Locked</p>
                    <p className="text-xs opacity-90">
                      {isUserSender
                        ? "As the sender, you cannot modify recipients while rates are locked. This protects recipients from unexpected changes."
                        : "As a recipient, your payment rate is protected and cannot be changed by the sender while rates are locked."}
                    </p>
                    {rateLockStatus.timeRemaining && (
                      <p className="text-xs opacity-75 mt-1">
                        Time remaining: {rateLockStatus.timeRemaining}
                      </p>
                    )}
                  </div>
                }
              >
                <span className="px-2 py-1 text-xs font-medium bg-yellow-500/20 text-yellow-600 rounded-full border border-yellow-500/30 flex items-center gap-1 cursor-help">
                  <Lock className="h-3 w-3" />
                  Locked
                </span>
              </Tooltip>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">From:</span>
            <span className="font-mono">{formatAddress(sender)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Recipients:</span>
            <span>{recipients.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Token:</span>
            <span>{symbol}</span>
          </div>
          {(isActive || isPaused) && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time Remaining:</span>
              <span>{getTimeRemaining()}</span>
            </div>
          )}
          {isUserRecipient && userBalance !== undefined && userBalance !== null && (
            <div className="flex justify-between pt-2 border-t border-border">
              <span className="text-muted-foreground">Your Balance:</span>
              <span className="font-semibold text-green">
                {formatTokenAmount((userBalance ?? 0n) as bigint, decimals)} {symbol}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t border-border">
          {isUserSender && (isActive || isPaused) && (
            <>
              {!isPaused ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePause}
                  disabled={isPending || isConfirming}
                  className="flex-1"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResume}
                  disabled={isPending || isConfirming}
                  className="flex-1"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={handleCancel}
                disabled={isPending || isConfirming}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          )}
          {isUserRecipient && userBalance !== undefined && userBalance !== null && typeof userBalance === 'bigint' && userBalance > 0n && (
            <Button
              variant="default"
              size="sm"
              onClick={handleWithdraw}
              disabled={isPending || isConfirming}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Withdraw
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

