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
import { getTokenByAddress } from "@/components/token-selector";
import { useChainId } from "wagmi";
import { Loader2 } from "lucide-react";
import { useSubscription } from "@/lib/contracts";

interface DepositSubscriptionModalProps {
  subscriptionId: bigint;
  token: `0x${string}`;
  onClose: () => void;
}

export function DepositSubscriptionModal({
  subscriptionId,
  token,
  onClose,
}: DepositSubscriptionModalProps) {
  const chainId = useChainId();
  const { depositToSubscription, isPending, isConfirming, isConfirmed } = useSubscription();
  const [amount, setAmount] = useState<string>("");
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Get token info for formatting
  const tokenInfo = getTokenByAddress(token, chainId) || {
    decimals: 18,
    symbol: "CELO",
  };

  // Watch for transaction confirmation
  useEffect(() => {
    if (hasSubmitted && isConfirmed) {
      toast.success("Deposit successful!", { id: "deposit-sub" });
      setHasSubmitted(false);
      // Use setTimeout to avoid calling onClose during render
      setTimeout(() => {
        onClose();
      }, 100);
    }
  }, [isConfirmed, hasSubmitted]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      toast.loading("Submitting transaction...", { id: "deposit-sub" });
      await depositToSubscription(subscriptionId, amount, token);
      setHasSubmitted(true);
      toast.loading("Waiting for confirmation...", { id: "deposit-sub" });
    } catch (error: any) {
      toast.error(error?.message || "Failed to deposit", { id: "deposit-sub" });
      setHasSubmitted(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="glass-card">
        <DialogHeader>
          <DialogTitle>Top Up Subscription</DialogTitle>
          <DialogDescription>
            Deposit funds into the subscription escrow. These funds will be used
            for future payments.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ({tokenInfo.symbol})</Label>
            <Input
              id="amount"
              type="number"
              step="0.000001"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Enter the amount you want to deposit into this subscription.
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
            onClick={handleDeposit}
            disabled={isPending || isConfirming || !amount || parseFloat(amount) <= 0}
          >
            {isPending || isConfirming ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isConfirming ? "Confirming..." : "Processing..."}
              </>
            ) : (
              "Deposit"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

