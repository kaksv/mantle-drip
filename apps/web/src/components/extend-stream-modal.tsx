"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Clock, TrendingUp } from "lucide-react";
import { useDrip, useStreamRecipientsInfo } from "@/lib/contracts";
import { getTokenByAddress } from "@/components/token-selector";
import { useChainId } from "wagmi";
import { formatEther, formatUnits, parseUnits } from "viem";

interface ExtendStreamModalProps {
  streamId: bigint;
  currentEndTime: number;
  token: `0x${string}`;
  recipients: `0x${string}`[];
  isOpen: boolean;
  onClose: () => void;
}

export function ExtendStreamModal({
  streamId,
  currentEndTime,
  token,
  recipients,
  isOpen,
  onClose,
}: ExtendStreamModalProps) {
  const chainId = useChainId();
  const { extendStream, isPending, isConfirming, isConfirmed } = useDrip();
  const { recipientsInfo } = useStreamRecipientsInfo(streamId);
  const [extensionMode, setExtensionMode] = useState<"extend" | "topup" | "both">("extend");
  const [extensionDays, setExtensionDays] = useState<string>("");
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const tokenInfo = getTokenByAddress(token, chainId) || {
    decimals: 18,
    symbol: "CELO",
  };

  // Calculate total rate from recipients
  const totalRatePerSecond = useMemo(() => {
    if (!recipientsInfo || !Array.isArray(recipientsInfo)) return 0n;
    
    return (recipientsInfo as any[]).reduce((sum: bigint, r: any) => {
      return sum + BigInt(r.ratePerSecond || 0);
    }, 0n);
  }, [recipientsInfo]);

  // Calculate required deposit for extension
  const requiredDepositForExtension = useMemo(() => {
    if (extensionMode !== "extend" && extensionMode !== "both") return 0n;
    if (!extensionDays || parseFloat(extensionDays) <= 0) return 0n;
    if (totalRatePerSecond === 0n) return 0n;

    const extensionSeconds = BigInt(Math.floor(parseFloat(extensionDays) * 86400));
    const required = totalRatePerSecond * extensionSeconds;
    return required;
  }, [extensionDays, totalRatePerSecond, extensionMode]);

  // Calculate new end time
  const newEndTime = useMemo(() => {
    if (extensionMode !== "extend" && extensionMode !== "both") {
      return currentEndTime; // Keep current
    }
    if (!extensionDays || parseFloat(extensionDays) <= 0) {
      return currentEndTime; // Keep current
    }
    const extensionSeconds = parseFloat(extensionDays) * 86400;
    return currentEndTime + Math.floor(extensionSeconds);
  }, [extensionDays, currentEndTime, extensionMode]);

  // Watch for transaction confirmation
  useEffect(() => {
    if (hasSubmitted && isConfirmed) {
      toast.success("Stream extended successfully!", { id: "extend-stream" });
      setHasSubmitted(false);
      setTimeout(() => {
        onClose();
        setExtensionDays("");
        setDepositAmount("");
      }, 100);
    }
  }, [isConfirmed, hasSubmitted, onClose]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setExtensionDays("");
      setDepositAmount("");
      setExtensionMode("extend");
      setHasSubmitted(false);
    }
  }, [isOpen]);

  const handleExtend = async () => {
    // Validation
    if (extensionMode === "extend" || extensionMode === "both") {
      if (!extensionDays || parseFloat(extensionDays) <= 0) {
        toast.error("Please enter a valid extension duration");
        return;
      }
    }

    if (extensionMode === "topup" || extensionMode === "both") {
      if (!depositAmount || parseFloat(depositAmount) <= 0) {
        toast.error("Please enter a valid deposit amount");
        return;
      }
    }

    // Check if deposit is sufficient for extension
    if (extensionMode === "extend" || extensionMode === "both") {
      const depositInWei = depositAmount
        ? parseUnits(depositAmount, tokenInfo.decimals)
        : 0n;
      
      if (depositInWei < requiredDepositForExtension) {
        const requiredFormatted = formatUnits(requiredDepositForExtension, tokenInfo.decimals);
        toast.error(
          `Insufficient deposit. Need at least ${requiredFormatted} ${tokenInfo.symbol} to extend for ${extensionDays} days.`
        );
        return;
      }
    }

    try {
      toast.loading("Submitting transaction...", { id: "extend-stream" });
      
      // newEndTime: 0 to keep current, or future timestamp to extend
      const endTimeToUse = extensionMode === "topup" ? 0 : newEndTime;
      
      // Calculate total deposit to use
      let depositToUse: string;
      if (extensionMode === "extend") {
        // Extend only: use required deposit
        depositToUse = formatUnits(requiredDepositForExtension, tokenInfo.decimals);
      } else if (extensionMode === "topup") {
        // Top up only: use user input
        depositToUse = depositAmount || "0";
      } else {
        // Both: sum of required deposit + additional deposit
        const requiredFormatted = formatUnits(requiredDepositForExtension, tokenInfo.decimals);
        const additional = depositAmount || "0";
        const total = (parseFloat(requiredFormatted) + parseFloat(additional)).toFixed(6);
        depositToUse = total;
      }

      await extendStream(streamId, endTimeToUse, depositToUse, token);
      setHasSubmitted(true);
      toast.loading("Waiting for confirmation...", { id: "extend-stream" });
    } catch (error: any) {
      toast.error(error?.message || "Failed to extend stream", {
        id: "extend-stream",
      });
      setHasSubmitted(false);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatRequiredDeposit = () => {
    if (requiredDepositForExtension === 0n) return "0";
    return formatUnits(requiredDepositForExtension, tokenInfo.decimals);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Extend Stream / Top Up
          </DialogTitle>
          <DialogDescription>
            Extend the stream duration and/or add more deposit to the stream.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Mode Selection */}
          <div className="space-y-2">
            <Label>What would you like to do?</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={extensionMode === "extend" ? "default" : "outline"}
                onClick={() => setExtensionMode("extend")}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <Clock className="h-4 w-4" />
                <span className="text-xs">Extend Only</span>
              </Button>
              <Button
                type="button"
                variant={extensionMode === "topup" ? "default" : "outline"}
                onClick={() => setExtensionMode("topup")}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs">Top Up Only</span>
              </Button>
              <Button
                type="button"
                variant={extensionMode === "both" ? "default" : "outline"}
                onClick={() => setExtensionMode("both")}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <Clock className="h-4 w-4" />
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs">Both</span>
              </Button>
            </div>
          </div>

          {/* Extension Duration */}
          {(extensionMode === "extend" || extensionMode === "both") && (
            <div className="space-y-2">
              <Label htmlFor="extensionDays">Extension Duration (Days)</Label>
              <Input
                id="extensionDays"
                type="number"
                step="0.1"
                min="0.1"
                placeholder="30"
                value={extensionDays}
                onChange={(e) => setExtensionDays(e.target.value)}
              />
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Current end time: {formatTime(currentEndTime)}</p>
                {newEndTime > currentEndTime && (
                  <p className="text-green-600">
                    New end time: {formatTime(newEndTime)}
                  </p>
                )}
                {requiredDepositForExtension > 0n && (
                  <p className="text-blue-600 font-medium">
                    Required deposit: {formatRequiredDeposit()} {tokenInfo.symbol}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Deposit Amount */}
          {(extensionMode === "topup" || extensionMode === "both") && (
            <div className="space-y-2">
              <Label htmlFor="depositAmount">
                Additional Deposit ({tokenInfo.symbol})
              </Label>
              <Input
                id="depositAmount"
                type="number"
                step="0.000001"
                min="0"
                placeholder="0.0"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {extensionMode === "both"
                  ? "This deposit will be used for the extension. You can add more if needed."
                  : "Add funds to the stream without extending the duration."}
              </p>
            </div>
          )}

          {/* Summary */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <p className="text-sm font-medium">Summary:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              {extensionMode === "extend" && (
                <>
                  <li>• Extending stream by {extensionDays || "0"} days</li>
                  <li>
                    • Required deposit: {formatRequiredDeposit()} {tokenInfo.symbol}
                  </li>
                </>
              )}
              {extensionMode === "topup" && (
                <li>• Adding {depositAmount || "0"} {tokenInfo.symbol} to stream</li>
              )}
              {extensionMode === "both" && (
                <>
                  <li>• Extending stream by {extensionDays || "0"} days</li>
                  <li>
                    • Required for extension: {formatRequiredDeposit()}{" "}
                    {tokenInfo.symbol}
                  </li>
                  <li>
                    • Additional deposit: {depositAmount || "0"} {tokenInfo.symbol}
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending || isConfirming}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExtend}
            disabled={
              isPending ||
              isConfirming ||
              (extensionMode !== "topup" &&
                (!extensionDays || parseFloat(extensionDays) <= 0)) ||
              (extensionMode !== "extend" &&
                (!depositAmount || parseFloat(depositAmount) <= 0))
            }
          >
            {isPending || isConfirming ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isConfirming ? "Confirming..." : "Processing..."}
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                {extensionMode === "extend"
                  ? "Extend Stream"
                  : extensionMode === "topup"
                  ? "Top Up"
                  : "Extend & Top Up"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

