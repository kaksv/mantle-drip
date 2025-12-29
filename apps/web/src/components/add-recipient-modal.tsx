"use client";

import { useState, useEffect } from "react";
import { useDrip } from "@/lib/contracts";
import { formatTokenAmount } from "@/lib/utils/format";
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
import { getTokenByAddress } from "@/components/token-selector";
import { useChainId } from "wagmi";
import { Loader2 } from "lucide-react";
import { isAddress } from "viem";

interface AddRecipientModalProps {
  streamId: bigint;
  token: `0x${string}`;
  periodSeconds: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddRecipientModal({
  streamId,
  token,
  periodSeconds,
  onClose,
  onSuccess,
}: AddRecipientModalProps) {
  const chainId = useChainId();
  const { addRecipient, isPending, isConfirming, isConfirmed, hash, error } = useDrip();
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amountPerPeriod, setAmountPerPeriod] = useState("");

  const tokenInfo = getTokenByAddress(token, chainId) || { decimals: 18, symbol: "CELO" };

  // Calculate required deposit - should be amountPerPeriod (covers full period)
  const calculateDeposit = () => {
    if (!amountPerPeriod || parseFloat(amountPerPeriod) <= 0 || periodSeconds <= 0) return "0.000000";
    try {
      const amount = parseFloat(amountPerPeriod);
      // Deposit should be the amount per period (which covers the full period)
      return amount.toFixed(6);
    } catch {
      return "0.000000";
    }
  };

  const requiredDeposit = calculateDeposit();

  // Wait for transaction hash to be set
  useEffect(() => {
    if (hash && !isPending) {
      toast.loading("Waiting for confirmation...", { id: "add-recipient" });
    }
  }, [hash, isPending]);

  // Wait for transaction confirmation
  useEffect(() => {
    if (isConfirmed && hash) {
      toast.success("Recipient added successfully!", { id: "add-recipient" });
      // Small delay to ensure state updates
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 500);
    }
  }, [isConfirmed, hash, onSuccess, onClose]);

  // Handle errors
  useEffect(() => {
    if (error) {
      console.error("Transaction error:", error);
      const errorMessage = error?.message || "Failed to add recipient";
      toast.error(errorMessage, { id: "add-recipient", duration: 5000 });
    }
  }, [error]);

  const handleAdd = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (!isAddress(recipientAddress)) {
      toast.error("Please enter a valid recipient address");
      return;
    }

    if (!amountPerPeriod || parseFloat(amountPerPeriod) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (periodSeconds <= 0) {
      toast.error("Invalid period duration");
      return;
    }

    try {
      toast.loading("Adding recipient...", { id: "add-recipient" });
      
      // Validate inputs before submitting
      const depositNum = parseFloat(requiredDeposit);
      if (isNaN(depositNum) || depositNum <= 0) {
        throw new Error("Invalid deposit amount");
      }

      const amountNum = parseFloat(amountPerPeriod);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error("Invalid amount per period");
      }

      // writeContract doesn't return a hash - it triggers the transaction
      // The hash will be available in the hook's hash property
      await addRecipient(streamId, recipientAddress as `0x${string}`, amountPerPeriod, requiredDeposit, token);
      
      // Transaction submitted - wait for hash and confirmation via useEffect
      // Note: hash might not be immediately available, so we wait for it in useEffect
    } catch (error: any) {
      console.error("Error adding recipient:", error);
      let errorMessage = "Failed to add recipient";
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.reason) {
        errorMessage = error.reason;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast.error(errorMessage, { id: "add-recipient", duration: 5000 });
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => {
      // Only close if not pending/confirming and user explicitly closes
      if (!open && !isPending && !isConfirming) {
        onClose();
      }
    }}>
      <DialogContent onInteractOutside={(e) => {
        // Prevent closing when clicking outside during transaction
        if (isPending || isConfirming) {
          e.preventDefault();
        }
      }}>
        <DialogHeader>
          <DialogTitle>Add Recipient</DialogTitle>
          <DialogDescription>
            Add a new recipient to this payment stream
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Address</Label>
            <Input
              id="recipient"
              placeholder="0x..."
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount Per Period ({tokenInfo.symbol})</Label>
            <Input
              id="amount"
              type="number"
              step="0.000001"
              placeholder="0.0"
              value={amountPerPeriod}
              onChange={(e) => setAmountPerPeriod(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              This is the amount the recipient will receive per period
            </p>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Required Deposit:</span>
              <span className="text-lg font-bold">
                {requiredDeposit} {tokenInfo.symbol}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This deposit will cover the full period for the new recipient
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }} 
            disabled={isPending || isConfirming}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAdd} 
            disabled={isPending || isConfirming || !recipientAddress || !amountPerPeriod}
            type="button"
          >
            {isPending || isConfirming ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isConfirming ? "Confirming..." : "Processing..."}
              </>
            ) : (
              "Add Recipient"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

