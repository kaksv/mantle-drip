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
import { Loader2, Lock, AlertCircle } from "lucide-react";
import { useDrip, useStreamRateLockStatus } from "@/lib/contracts";

interface LockStreamRateModalProps {
  streamId: bigint;
  isOpen: boolean;
  onClose: () => void;
  currentLockUntil?: number;
}

export function LockStreamRateModal({
  streamId,
  isOpen,
  onClose,
}: LockStreamRateModalProps) {
  const { lockStreamRate, isPending, isConfirming, isConfirmed } = useDrip();
  const { isLocked, lockUntil, timeRemaining } = useStreamRateLockStatus(streamId);
  const [lockDuration, setLockDuration] = useState<string>("");
  const [durationUnit, setDurationUnit] = useState<"days" | "hours" | "minutes">("days");
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Watch for transaction confirmation
  useEffect(() => {
    if (hasSubmitted && isConfirmed) {
      toast.success("Stream rates locked successfully!", { id: "lock-rate" });
      setHasSubmitted(false);
      setTimeout(() => {
        onClose();
        setLockDuration("");
      }, 100);
    }
  }, [isConfirmed, hasSubmitted, onClose]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setLockDuration("");
      setDurationUnit("days");
      setHasSubmitted(false);
    }
  }, [isOpen]);

  const handleLock = async () => {
    if (!lockDuration || parseFloat(lockDuration) <= 0) {
      toast.error("Please enter a valid duration");
      return;
    }

    const durationValue = parseFloat(lockDuration);
    if (isNaN(durationValue) || durationValue <= 0) {
      toast.error("Duration must be greater than 0");
      return;
    }

    // Convert to seconds based on unit
    let durationInSeconds: number;
    switch (durationUnit) {
      case "days":
        durationInSeconds = Math.floor(durationValue * 86400);
        break;
      case "hours":
        durationInSeconds = Math.floor(durationValue * 3600);
        break;
      case "minutes":
        durationInSeconds = Math.floor(durationValue * 60);
        break;
      default:
        durationInSeconds = 0;
    }

    if (durationInSeconds <= 0) {
      toast.error("Duration must be at least 1 minute");
      return;
    }

    try {
      toast.loading("Submitting transaction...", { id: "lock-rate" });
      await lockStreamRate(streamId, durationInSeconds);
      setHasSubmitted(true);
      toast.loading("Waiting for confirmation...", { id: "lock-rate" });
    } catch (error: any) {
      toast.error(error?.message || "Failed to lock stream rates", {
        id: "lock-rate",
      });
      setHasSubmitted(false);
    }
  };

  const formatLockUntil = (timestamp: number | null) => {
    if (!timestamp) return null;
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Lock Stream Rates
          </DialogTitle>
          <DialogDescription>
            Prevent modifications to recipient rates and list for a specified duration.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Lock Status */}
          {isLocked && lockUntil && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-600 mb-1">
                    Rates Currently Locked
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Lock expires: {formatLockUntil(lockUntil)}
                  </p>
                  {timeRemaining && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Time remaining: {timeRemaining}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    You can extend the lock duration, but it must be longer than the current lock period.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Lock Duration Input */}
          <div className="space-y-2">
            <Label htmlFor="duration">Lock Duration</Label>
            <div className="flex gap-2">
              <Input
                id="duration"
                type="number"
                step="0.1"
                min="0.1"
                placeholder="1"
                value={lockDuration}
                onChange={(e) => setLockDuration(e.target.value)}
                className="flex-1"
              />
              <select
                value={durationUnit}
                onChange={(e) =>
                  setDurationUnit(e.target.value as "days" | "hours" | "minutes")
                }
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter how long you want to lock the stream rates.
            </p>
          </div>

          {/* Warning Box */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">What gets locked:</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Adding new recipients</li>
              <li>Removing existing recipients</li>
              <li>Updating recipient rates</li>
              <li>Extending stream duration</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-3">
              <strong>Note:</strong> Pausing, resuming, and canceling the stream are still allowed.
            </p>
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
            onClick={handleLock}
            disabled={
              isPending ||
              isConfirming ||
              !lockDuration ||
              parseFloat(lockDuration) <= 0
            }
          >
            {isPending || isConfirming ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isConfirming ? "Confirming..." : "Processing..."}
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Lock Rates
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

