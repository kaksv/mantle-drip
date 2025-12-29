"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, AlertTriangle } from "lucide-react";
import { useSubscription } from "@/lib/contracts";
import { toast } from "sonner";

interface CancelSubscriptionModalProps {
  subscriptionId: bigint;
  onClose: () => void;
}

export function CancelSubscriptionModal({
  subscriptionId,
  onClose,
}: CancelSubscriptionModalProps) {
  const { cancelSubscription, isPending, isConfirming, isConfirmed } = useSubscription();
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Watch for transaction confirmation
  useEffect(() => {
    if (hasSubmitted && isConfirmed) {
      toast.success("Subscription cancelled", { id: "cancel-sub" });
      setHasSubmitted(false);
      // Use setTimeout to avoid calling onClose during render
      setTimeout(() => {
        onClose();
      }, 100);
    }
  }, [isConfirmed, hasSubmitted]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCancel = async () => {
    try {
      toast.loading("Submitting transaction...", { id: "cancel-sub" });
      await cancelSubscription(subscriptionId);
      setHasSubmitted(true);
      toast.loading("Waiting for confirmation...", { id: "cancel-sub" });
    } catch (error: any) {
      toast.error(error?.message || "Failed to cancel subscription", {
        id: "cancel-sub",
      });
      setHasSubmitted(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="glass-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Cancel Subscription
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel this subscription? Remaining escrow
            balance will be refunded to you.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. Once cancelled, the subscription
              will stop processing payments and any remaining funds in escrow
              will be returned to your wallet.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending || isConfirming}
          >
            Keep Subscription
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isPending || isConfirming}
          >
            {isPending || isConfirming ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isConfirming ? "Confirming..." : "Cancelling..."}
              </>
            ) : (
              "Cancel Subscription"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

