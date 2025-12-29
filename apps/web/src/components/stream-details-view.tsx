"use client";

import { useAccount, useChainId } from "wagmi";
import { useStream, useStreamRecipientsInfo, useDrip, useStreamRateLockStatus } from "@/lib/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pause, Play, X, Download, Loader2, ExternalLink, Plus, Edit, Trash2, Lock, TrendingUp } from "lucide-react";
import { formatEther, formatUnits } from "viem";
import { formatTokenAmount } from "@/lib/utils/format";
import { getContractAddress } from "@/lib/contracts/config";
import { getTokenByAddress } from "@/components/token-selector";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import Link from "next/link";
import { WithdrawModal } from "@/components/withdraw-modal";
import { AddRecipientModal } from "@/components/add-recipient-modal";
import { EditRecipientModal } from "@/components/edit-recipient-modal";
import { LockStreamRateModal } from "@/components/lock-stream-rate-modal";
import { ExtendStreamModal } from "@/components/extend-stream-modal";
import { Tooltip } from "@/components/ui/tooltip";
import {
  prepareStreamDataForExport,
  generateStreamCSV,
  generateStreamExportFilename,
} from "@/lib/utils/stream-export";
import { downloadCSV } from "@/lib/utils/csv-export";

interface StreamDetailsViewProps {
  streamId: bigint;
}

export function StreamDetailsView({ streamId }: StreamDetailsViewProps) {
  const { address } = useAccount();
  const chainId = useChainId();
  const { stream, isLoading: streamLoading, error: streamError, refetch: streamRefetch } = useStream(streamId);
  const { recipientsInfo, isLoading: recipientsLoading, refetch: recipientsRefetch } = useStreamRecipientsInfo(streamId);
  const { pauseStream, resumeStream, cancelStream, removeRecipient, isPending, isConfirming, isConfirmed } = useDrip();
  const rateLockStatus = useStreamRateLockStatus(streamId);
  const [withdrawRecipient, setWithdrawRecipient] = useState<`0x${string}` | null>(null);
  const [showAddRecipient, setShowAddRecipient] = useState(false);
  const [editRecipient, setEditRecipient] = useState<{ address: `0x${string}`, rate: bigint } | null>(null);
  const [showLockRateModal, setShowLockRateModal] = useState(false);
  const [showExtendStreamModal, setShowExtendStreamModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Watch for transaction confirmation - MUST be before any conditional returns
  useEffect(() => {
    if (pendingAction && isConfirmed) {
      switch (pendingAction) {
        case "pause":
          toast.success("Stream paused successfully!", { id: "pause-stream" });
          break;
        case "resume":
          toast.success("Stream resumed successfully!", { id: "resume-stream" });
          break;
        case "cancel":
          toast.success("Stream cancelled successfully! All accrued funds were sent to recipients.", { id: "cancel-stream" });
          break;
      }
      setPendingAction(null);
      if (streamRefetch) streamRefetch();
      if (recipientsRefetch) recipientsRefetch();
    }
  }, [isConfirmed, pendingAction, streamRefetch, recipientsRefetch]);

  if (streamLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading stream details...</span>
      </div>
    );
  }

  if (streamError || !stream) {
    const errorMessage = streamError?.message || "Stream not found";
    const isStreamNotFound = errorMessage.includes("Stream does not exist") || errorMessage.includes("not found");
    
    return (
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <p className="text-destructive">
              {isStreamNotFound 
                ? "This stream doesn't exist on the current contract. It may have been created on a previous deployment."
                : errorMessage}
            </p>
            {isStreamNotFound && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  The contract was recently redeployed with new features. Please create a new streamData.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button asChild variant="outline">
                    <Link href="/streams">View All Streams</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/streams/create">Create New Stream</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Type assertion: stream is guaranteed to exist at this point
  const streamData = stream as any;
  const tokenInfo = getTokenByAddress(streamData.token as `0x${string}`, chainId);
  const decimals = tokenInfo?.decimals || 18;
  const symbol = tokenInfo?.symbol || "Token";

  const status = Number(streamData.status);
  // Contract enum: 0 = Pending, 1 = Active, 2 = Paused, 3 = Cancelled, 4 = Completed
  const isStreamPending = status === 0;
  const isActive = status === 1;
  const isPaused = status === 2;
  const isCancelled = status === 3;
  const isCompleted = status === 4;

  const startTime = Number(streamData.startTime);
  const endTime = Number(streamData.endTime);
  const now = Math.floor(Date.now() / 1000);
  const elapsed = Math.max(0, now - startTime);
  const remaining = Math.max(0, endTime - now);
  const periodSeconds = endTime - startTime;

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatDuration = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Calculate analytics
  const totalDeposit = BigInt(streamData.deposit || 0);
  const allRecipients = (recipientsInfo || []) as any[];
  
  // Filter recipients based on user role
  // If user is recipient (not sender), only show their own info
  const isUserSender = address && streamData.sender.toLowerCase() === address.toLowerCase();
  const isUserRecipient = address && !isUserSender && streamData.recipients.some(
    (r: string) => r.toLowerCase() === address.toLowerCase()
  );
  
  const recipients = isUserRecipient && address
    ? allRecipients.filter((r: any) => r.recipient.toLowerCase() === address.toLowerCase())
    : allRecipients;
  
  // Calculate analytics - if user is recipient, only show their data
  const totalWithdrawn = recipients.reduce((sum: bigint, r: any) => {
    return sum + (r.totalWithdrawn || 0n);
  }, 0n);
  const totalAccrued = recipients.reduce((sum: bigint, r: any) => {
    return sum + (r.currentAccrued || 0n);
  }, 0n);
  
  // For recipients, show only their data. For senders, show all recipients' data
  const totalDistributed = isUserRecipient 
    ? totalWithdrawn + totalAccrued  // Only current user's data
    : allRecipients.reduce((sum: bigint, r: any) => {
        return sum + (r.totalWithdrawn || 0n) + (r.currentAccrued || 0n);
      }, 0n);
  
  // Calculate remaining deposit (ensure it doesn't go negative)
  const remainingDeposit = totalDeposit > totalDistributed 
    ? totalDeposit - totalDistributed 
    : 0n;

  const handlePause = async () => {
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

  const handleResume = async () => {
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

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this stream? All accrued funds will be automatically sent to recipients, and any remaining deposit will be refunded to you.")) {
      return;
    }
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

  const contractAddress = getContractAddress(chainId, "DripCore");
  const explorerUrl = chainId === 11142220 
    ? `https://celo-sepolia.blockscout.com/address/${contractAddress}`
    : chainId === 44787
    ? `https://alfajores.celoscan.io/address/${contractAddress}`
    : `https://celoscan.io/address/${contractAddress}`;

  const handleExportStream = async () => {
    if (!address || !isUserSender) {
      toast.error("Only the stream owner can export stream data");
      return;
    }

    if (!streamData || !recipientsInfo) {
      toast.error("Stream data not available. Please wait for data to load.");
      return;
    }

    try {
      setIsExporting(true);
      toast.loading("Preparing export...", { id: "export-stream" });

      // Calculate analytics for export (always use all recipients, not filtered)
      const exportTotalWithdrawn = allRecipients.reduce((sum: bigint, r: any) => {
        return sum + (r.totalWithdrawn || 0n);
      }, 0n);
      const exportTotalAccrued = allRecipients.reduce((sum: bigint, r: any) => {
        return sum + (r.currentAccrued || 0n);
      }, 0n);
      const exportTotalDistributed = exportTotalWithdrawn + exportTotalAccrued;
      const exportRemainingDeposit = totalDeposit > exportTotalDistributed 
        ? totalDeposit - exportTotalDistributed 
        : 0n;

      // Prepare analytics data for export
      const analytics = {
        totalDeposit,
        totalDistributed: exportTotalDistributed,
        totalAccrued: exportTotalAccrued,
        remainingDeposit: exportRemainingDeposit,
        periodSeconds,
        elapsed,
        remaining: isActive || isPaused ? remaining : undefined,
      };

      // Prepare export data
      const exportData = prepareStreamDataForExport(
        streamData,
        allRecipients, // Use allRecipients for export (not filtered)
        analytics,
        tokenInfo ? { symbol: tokenInfo.symbol, decimals: tokenInfo.decimals } : null,
        chainId,
        contractAddress || "",
        explorerUrl,
        address
      );

      // Generate CSV
      const csvContent = generateStreamCSV(exportData);

      // Generate filename
      const filename = generateStreamExportFilename(streamId, true);

      // Download CSV
      downloadCSV(csvContent, filename);

      toast.success("Stream data exported successfully!", { id: "export-stream" });
    } catch (error: any) {
      console.error("Error exporting stream:", error);
      toast.error(
        error?.message || "Failed to export stream data. Please try again.",
        { id: "export-stream", duration: 5000 }
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stream Header */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">
                {streamData.title || `Stream #${streamId.toString()}`}
              </CardTitle>
              {streamData.description && (
                <p className="text-muted-foreground">{streamData.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {isUserSender && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportStream}
                  disabled={isExporting || streamLoading || recipientsLoading}
                  className="flex items-center gap-2"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Export CSV
                    </>
                  )}
                </Button>
              )}
              {isActive && !isPaused && (
                <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">
                  Active
                </span>
              )}
              {isPaused && (
                <span className="px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 rounded-full">
                  Paused
                </span>
              )}
              {isCompleted && (
                <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                  Completed
                </span>
              )}
              {isCancelled && (
                <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded-full">
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
                          ? "As the sender, you cannot add, remove, or modify recipients while rates are locked. This protects recipients from unexpected changes."
                          : "As a recipient, your payment rate is protected and cannot be changed by the sender while rates are locked."}
                      </p>
                      {rateLockStatus.lockUntil && (
                        <p className="text-xs opacity-75 mt-1">
                          Lock expires: {formatTime(rateLockStatus.lockUntil)}
                        </p>
                      )}
                    </div>
                  }
                >
                  <span className="px-3 py-1 text-sm font-medium bg-yellow-500/20 text-yellow-600 rounded-full border border-yellow-500/30 flex items-center gap-1.5 cursor-help">
                    <Lock className="h-4 w-4" />
                    <span>Rates Locked</span>
                    {rateLockStatus.timeRemaining && (
                      <span className="text-xs opacity-75">({rateLockStatus.timeRemaining})</span>
                    )}
                  </span>
                </Tooltip>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">From</p>
              <p className="font-mono text-sm">{formatAddress(streamData.sender)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Token</p>
              <p className="font-medium">{symbol}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Started</p>
              <p className="text-sm">{formatTime(startTime)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {isActive || isPaused ? "Time Remaining" : "Ended"}
              </p>
              <p className="text-sm">
                {isActive || isPaused ? formatDuration(remaining) : formatTime(endTime)}
              </p>
            </div>
          </div>

          {/* Rate Lock Status */}
          {rateLockStatus.isLocked && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-600">
                <Lock className="h-4 w-4" />
                <Tooltip
                  content={
                    <div className="space-y-1">
                      <p className="font-semibold">What does "Rates Locked" mean?</p>
                      <p className="text-xs opacity-90">
                        {isUserSender
                          ? "As the sender, you cannot add, remove, or modify recipients while rates are locked. This protects recipients from unexpected changes to their payment rates."
                          : "As a recipient, your payment rate is protected and cannot be changed by the sender while rates are locked. This ensures payment stability."}
                      </p>
                    </div>
                  }
                >
                  <span className="text-sm font-medium cursor-help">
                    Stream rates are locked until {rateLockStatus.lockUntil ? formatTime(rateLockStatus.lockUntil) : "unknown"}
                    {rateLockStatus.timeRemaining && ` (${rateLockStatus.timeRemaining} remaining)`}
                  </span>
                </Tooltip>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isUserSender
                  ? "You cannot add, remove, or modify recipients while rates are locked."
                  : "The sender cannot modify recipient rates while locked. Your payment rate is protected."}
              </p>
            </div>
          )}

          {/* Stream Controls */}
          {isUserSender && (isActive || isPaused) && (
            <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t">
              {!isPaused ? (
                <Button variant="outline" onClick={handlePause} disabled={isPending || isConfirming}>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause Stream
                </Button>
              ) : (
                <Button variant="outline" onClick={handleResume} disabled={isPending || isConfirming}>
                  <Play className="h-4 w-4 mr-2" />
                  Resume Stream
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => setShowLockRateModal(true)} 
                disabled={isPending || isConfirming || rateLockStatus.isLocked}
              >
                <Lock className="h-4 w-4 mr-2" />
                Lock Rate
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowExtendStreamModal(true)} 
                disabled={isPending || isConfirming || rateLockStatus.isLocked}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Extend / Top Up
              </Button>
              <Button variant="destructive" onClick={handleCancel} disabled={isPending || isConfirming}>
                <X className="h-4 w-4 mr-2" />
                Cancel Stream
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {isUserRecipient ? (
          // Show recipient-specific analytics
          <>
            <Card className="glass-card">
              <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
                <div className="text-xl md:text-2xl font-bold text-blue-600">
                  {formatTokenAmount(totalAccrued, decimals)}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">Available to Withdraw ({symbol})</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
                <div className="text-xl md:text-2xl font-bold text-green-600">
                  {formatTokenAmount(totalWithdrawn, decimals)}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">Total Withdrawn ({symbol})</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
                <div className="text-xl md:text-2xl font-bold">
                  {formatTokenAmount(totalWithdrawn + totalAccrued, decimals)}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">Total Received ({symbol})</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
                <div className="text-xl md:text-2xl font-bold">
                  {formatTokenAmount(recipients[0]?.ratePerSecond || 0n, decimals)}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">Rate ({symbol}/sec)</div>
              </CardContent>
            </Card>
          </>
        ) : (
          // Show sender analytics (all recipients)
          <>
            <Card className="glass-card">
              <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
                <div className="text-xl md:text-2xl font-bold">
                  {formatTokenAmount(totalDeposit, decimals)}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">Total Deposit ({symbol})</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
                <div className="text-xl md:text-2xl font-bold text-green-600">
                  {formatTokenAmount(totalDistributed, decimals)}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">Total Distributed ({symbol})</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
                <div className="text-xl md:text-2xl font-bold text-blue-600">
                  {formatTokenAmount(totalAccrued, decimals)}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">Available to Withdraw ({symbol})</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
                <div className="text-xl md:text-2xl font-bold">
                  {formatTokenAmount(remainingDeposit, decimals)}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">Remaining ({symbol})</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Recipients List */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {isUserRecipient 
                ? "Your Recipient Info" 
                : `Recipients (${isUserSender ? streamData.recipients.length : recipients.length})`}
            </CardTitle>
            {isUserSender && (isActive || isPaused) && (
              <Button 
                onClick={() => setShowAddRecipient(true)} 
                size="sm"
                disabled={rateLockStatus.isLocked}
                title={rateLockStatus.isLocked ? "Cannot add recipients while rates are locked" : ""}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Recipient
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {recipientsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : recipients.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No recipients found</p>
          ) : (
            <div className="space-y-4">
              {recipients.map((recipient: any, index: number) => {
                const isCurrentUser = address && recipient.recipient.toLowerCase() === address.toLowerCase();
                const balance = recipient.currentAccrued || 0n;
                const withdrawn = recipient.totalWithdrawn || 0n;
                const rate = recipient.ratePerSecond || 0n;

                return (
                  <div
                    key={recipient.recipient}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium">
                          {formatAddress(recipient.recipient)}
                        </p>
                        {(isCurrentUser || isUserRecipient) && (
                          <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded">
                            You
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Rate</p>
                          <p className="font-medium">
                            {formatTokenAmount(rate, decimals)} {symbol}/sec
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Available</p>
                          <p className="font-medium text-green-600">
                            {formatTokenAmount(balance, decimals)} {symbol}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Withdrawn</p>
                          <p className="font-medium">
                            {formatTokenAmount(withdrawn, decimals)} {symbol}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {isCurrentUser && balance > 0n && (isActive || isPaused || isCompleted) && (
                        <Button
                          onClick={() => setWithdrawRecipient(recipient.recipient as `0x${string}`)}
                          size="sm"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Withdraw
                        </Button>
                      )}
                      {isUserSender && (isActive || isPaused) && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditRecipient({ address: recipient.recipient as `0x${string}`, rate })}
                            disabled={rateLockStatus.isLocked}
                            title={rateLockStatus.isLocked ? "Cannot edit recipients while rates are locked" : ""}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={async () => {
                              if (!confirm(`Are you sure you want to remove ${formatAddress(recipient.recipient)}?`)) return;
                              try {
                                toast.loading("Removing recipient...", { id: "remove-recipient" });
                                await removeRecipient(streamId, recipient.recipient as `0x${string}`);
                                toast.success("Recipient removed", { id: "remove-recipient" });
                              } catch (error: any) {
                                toast.error(error?.message || "Failed to remove recipient", { id: "remove-recipient" });
                              }
                            }}
                            disabled={rateLockStatus.isLocked}
                            title={rateLockStatus.isLocked ? "Cannot remove recipients while rates are locked" : ""}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contract Link */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Stream ID</p>
              <p className="font-mono">{streamId.toString()}</p>
            </div>
            <Button variant="outline" asChild>
              <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Explorer
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Withdraw Modal */}
      {withdrawRecipient && (
        <WithdrawModal
          streamId={streamId}
          recipient={withdrawRecipient}
          token={streamData.token as `0x${string}`}
          onClose={() => setWithdrawRecipient(null)}
        />
      )}

      {/* Add Recipient Modal */}
      {showAddRecipient && (
        <AddRecipientModal
          streamId={streamId}
          token={streamData.token as `0x${string}`}
          periodSeconds={periodSeconds}
          onClose={() => setShowAddRecipient(false)}
          onSuccess={() => {
            // Refetch recipients info
            if (recipientsRefetch) recipientsRefetch();
            if (streamRefetch) streamRefetch();
          }}
        />
      )}

      {/* Edit Recipient Modal */}
      {editRecipient && (
        <EditRecipientModal
          streamId={streamId}
          recipient={editRecipient.address}
          token={streamData.token as `0x${string}`}
          currentRate={editRecipient.rate}
          periodSeconds={periodSeconds}
          onClose={() => setEditRecipient(null)}
          onSuccess={() => {
            // Refetch recipients info
            if (recipientsRefetch) recipientsRefetch();
            if (streamRefetch) streamRefetch();
          }}
        />
      )}

      {/* Lock Stream Rate Modal */}
      {showLockRateModal && (
        <LockStreamRateModal
          streamId={streamId}
          isOpen={showLockRateModal}
          onClose={() => setShowLockRateModal(false)}
          currentLockUntil={rateLockStatus.lockUntil || undefined}
        />
      )}

      {/* Extend Stream Modal */}
      {showExtendStreamModal && streamData && (
        <ExtendStreamModal
          streamId={streamId}
          currentEndTime={endTime}
          token={streamData.token as `0x${string}`}
          recipients={streamData.recipients as `0x${string}`[]}
          isOpen={showExtendStreamModal}
          onClose={() => {
            setShowExtendStreamModal(false);
            // Refetch stream data after closing
            if (streamRefetch) streamRefetch();
            if (recipientsRefetch) recipientsRefetch();
          }}
        />
      )}
    </div>
  );
}

