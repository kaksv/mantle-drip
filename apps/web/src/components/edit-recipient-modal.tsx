"use client";

import { useState, useEffect } from "react";
import { useDrip } from "@/lib/contracts";
import { formatTokenAmount } from "@/lib/utils/format";
import { parseEther } from "viem";
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

interface EditRecipientModalProps {
  streamId: bigint;
  recipient: `0x${string}`;
  token: `0x${string}`;
  currentRate: bigint;
  periodSeconds: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditRecipientModal({
  streamId,
  recipient,
  token,
  currentRate,
  periodSeconds,
  onClose,
  onSuccess,
}: EditRecipientModalProps) {
  const chainId = useChainId();
  const { updateRecipientRate, isPending, isConfirming } = useDrip();
  const [newAmountPerPeriod, setNewAmountPerPeriod] = useState("");
  const [additionalDeposit, setAdditionalDeposit] = useState("");

  const tokenInfo = getTokenByAddress(token, chainId) || { decimals: 18, symbol: "CELO" };

  // Calculate current amount per period from rate
  useEffect(() => {
    const currentAmount = (Number(currentRate) * periodSeconds) / Number(10n ** BigInt(tokenInfo.decimals));
    setNewAmountPerPeriod(currentAmount.toFixed(6));
  }, [currentRate, periodSeconds, tokenInfo.decimals]);

  // Calculate deposit difference
  useEffect(() => {
    if (!newAmountPerPeriod || parseFloat(newAmountPerPeriod) <= 0) {
      setAdditionalDeposit("0.000000");
      return;
    }

    try {
      const currentAmount = (Number(currentRate) * periodSeconds) / Number(10n ** BigInt(tokenInfo.decimals));
      const newAmount = parseFloat(newAmountPerPeriod);
      const difference = newAmount - currentAmount;
      setAdditionalDeposit(difference > 0 ? difference.toFixed(6) : "0.000000");
    } catch {
      setAdditionalDeposit("0.000000");
    }
  }, [newAmountPerPeriod, currentRate, periodSeconds, tokenInfo.decimals]);

  const handleUpdate = async () => {
    if (!newAmountPerPeriod || parseFloat(newAmountPerPeriod) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      toast.loading("Updating recipient rate...", { id: "update-recipient" });
      await updateRecipientRate(
        streamId,
        recipient,
        newAmountPerPeriod,
        additionalDeposit,
        token
      );
      toast.success("Recipient rate updated!", { id: "update-recipient" });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update recipient", { id: "update-recipient" });
    }
  };

  const currentAmountPerPeriod = (Number(currentRate) * periodSeconds) / Number(10n ** BigInt(tokenInfo.decimals));

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Recipient Rate</DialogTitle>
          <DialogDescription>
            Update the payment rate for this recipient
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Current Rate:</span>
              <span className="font-medium">
                {formatTokenAmount(currentRate, tokenInfo.decimals)} {tokenInfo.symbol}/sec
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Current Amount Per Period:</span>
              <span className="font-medium">
                {currentAmountPerPeriod.toFixed(6)} {tokenInfo.symbol}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newAmount">New Amount Per Period ({tokenInfo.symbol})</Label>
            <Input
              id="newAmount"
              type="number"
              step="0.000001"
              placeholder="0.0"
              value={newAmountPerPeriod}
              onChange={(e) => setNewAmountPerPeriod(e.target.value)}
            />
          </div>

          {parseFloat(additionalDeposit) > 0 && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Additional Deposit Required:</span>
                <span className="text-lg font-bold text-yellow-700 dark:text-yellow-400">
                  {additionalDeposit} {tokenInfo.symbol}
                </span>
              </div>
            </div>
          )}

          {parseFloat(additionalDeposit) < 0 && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Refund Amount:</span>
                <span className="text-lg font-bold text-green-700 dark:text-green-400">
                  {Math.abs(parseFloat(additionalDeposit)).toFixed(6)} {tokenInfo.symbol}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                This amount will be refunded to you
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending || isConfirming}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={isPending || isConfirming || !newAmountPerPeriod}>
            {isPending || isConfirming ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isConfirming ? "Confirming..." : "Processing..."}
              </>
            ) : (
              "Update Rate"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

