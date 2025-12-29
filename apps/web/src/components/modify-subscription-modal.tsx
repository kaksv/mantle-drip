"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTokenByAddress } from "@/components/token-selector";
import { useChainId } from "wagmi";
import { Loader2 } from "lucide-react";
import { useSubscription, SubscriptionCadence } from "@/lib/contracts";
import { formatEther } from "viem";

interface ModifySubscriptionModalProps {
  subscriptionId: bigint;
  token: `0x${string}`;
  currentAmount: bigint;
  currentCadence: number;
  currentInterval: bigint;
  onClose: () => void;
}

export function ModifySubscriptionModal({
  subscriptionId,
  token,
  currentAmount,
  currentCadence,
  currentInterval,
  onClose,
}: ModifySubscriptionModalProps) {
  const chainId = useChainId();
  const { modifySubscription, isPending, isConfirming, isConfirmed } = useSubscription();
  const [amount, setAmount] = useState<string>("");
  const [cadence, setCadence] = useState<string>("");
  const [customInterval, setCustomInterval] = useState<string>("");
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Get token info for formatting
  const tokenInfo = getTokenByAddress(token, chainId) || {
    decimals: 18,
    symbol: "CELO",
  };

  // Initialize form with current values
  useEffect(() => {
    const currentAmountFormatted = formatEther(currentAmount);
    setAmount(currentAmountFormatted);

    // Map cadence enum to string
    switch (currentCadence) {
      case 0: // Daily
        setCadence("daily");
        break;
      case 1: // Weekly
        setCadence("weekly");
        break;
      case 2: // Monthly
        setCadence("monthly");
        break;
      case 3: // Custom
        setCadence("custom");
        setCustomInterval(currentInterval.toString());
        break;
      default:
        setCadence("monthly");
    }
  }, [currentAmount, currentCadence, currentInterval]);

  const cadenceToEnum: Record<string, SubscriptionCadence> = {
    daily: SubscriptionCadence.DAILY,
    weekly: SubscriptionCadence.WEEKLY,
    monthly: SubscriptionCadence.MONTHLY,
    custom: SubscriptionCadence.CUSTOM,
  };

  // Watch for transaction confirmation
  useEffect(() => {
    if (hasSubmitted && isConfirmed) {
      toast.success("Subscription modified successfully!", { id: "modify-sub" });
      setHasSubmitted(false);
      // Use setTimeout to avoid calling onClose during render
      setTimeout(() => {
        onClose();
      }, 100);
    }
  }, [isConfirmed, hasSubmitted]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleModify = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!cadence) {
      toast.error("Please select a cadence");
      return;
    }

    if (cadence === "custom") {
      const interval = parseInt(customInterval);
      if (!customInterval || isNaN(interval) || interval <= 0) {
        toast.error("Please enter a valid custom interval (in seconds)");
        return;
      }
      // Validate minimum interval (1 hour = 3600 seconds)
      if (interval < 3600) {
        toast.error("Custom interval must be at least 1 hour (3600 seconds)");
        return;
      }
    }

    try {
      toast.loading("Submitting transaction...", { id: "modify-sub" });
      const cadenceEnum = cadenceToEnum[cadence];
      const customIntervalNum = cadence === "custom" ? parseInt(customInterval) : 0;

      await modifySubscription(
        subscriptionId,
        amount,
        cadenceEnum,
        customIntervalNum
      );

      setHasSubmitted(true);
      toast.loading("Waiting for confirmation...", { id: "modify-sub" });
    } catch (error: any) {
      toast.error(error?.message || "Failed to modify subscription", {
        id: "modify-sub",
      });
      setHasSubmitted(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="glass-card max-w-md">
        <DialogHeader>
          <DialogTitle>Modify Subscription</DialogTitle>
          <DialogDescription>
            Update the payment amount and cadence for this subscription.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Payment Amount ({tokenInfo.symbol})</Label>
            <Input
              id="amount"
              type="number"
              step="0.000001"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The amount to be paid per payment cycle.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cadence">Payment Cadence</Label>
            <Select value={cadence} onValueChange={setCadence}>
              <SelectTrigger id="cadence">
                <SelectValue placeholder="Select cadence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="custom">Custom Interval</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              How often payments should be executed.
            </p>
          </div>

          {cadence === "custom" && (
            <div className="space-y-2">
              <Label htmlFor="customInterval">
                Custom Interval (seconds)
              </Label>
              <Input
                id="customInterval"
                type="number"
                placeholder="3600"
                value={customInterval}
                onChange={(e) => setCustomInterval(e.target.value)}
                min={3600}
              />
              <p className="text-xs text-muted-foreground">
                Minimum: 1 hour (3600 seconds). Examples: 1 hour = 3600, 1 day =
                86400, 1 week = 604800.
              </p>
            </div>
          )}
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
            onClick={handleModify}
            disabled={
              isPending ||
              isConfirming ||
              !amount ||
              parseFloat(amount) <= 0 ||
              !cadence ||
              (cadence === "custom" &&
                (!customInterval ||
                  isNaN(parseInt(customInterval)) ||
                  parseInt(customInterval) < 3600))
            }
          >
            {isPending || isConfirming ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isConfirming ? "Confirming..." : "Processing..."}
              </>
            ) : (
              "Modify Subscription"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

