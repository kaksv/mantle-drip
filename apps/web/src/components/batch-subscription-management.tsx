"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useUserSubscriptionsAll, useSubscription } from "@/lib/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Pause, Play, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { formatEther } from "viem";

export function BatchSubscriptionManagement() {
  const { address, isConnected } = useAccount();
  const { subscriptions, isLoading } = useUserSubscriptionsAll(
    address as `0x${string}` | undefined
  );
  const {
    pauseSubscription,
    resumeSubscription,
    cancelSubscription,
    isPending,
    isConfirmed,
  } = useSubscription();
  const [selectedIds, setSelectedIds] = useState<Set<bigint>>(new Set());
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [action, setAction] = useState<string | null>(null);

  if (!isConnected || !address) {
    return (
      <Card className="glass-card">
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">
            Connect your wallet to manage subscriptions
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleToggle = (subscriptionId: bigint) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(subscriptionId)) {
      newSelected.delete(subscriptionId);
    } else {
      newSelected.add(subscriptionId);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (!subscriptions || !Array.isArray(subscriptions)) return;
    if (selectedIds.size === subscriptions.length) {
      setSelectedIds(new Set());
    } else {
      const allIds = new Set(
        subscriptions.map((sub: any) => BigInt(sub.subscriptionId))
      );
      setSelectedIds(allIds);
    }
  };

  const handleBatchAction = async (actionType: "pause" | "resume" | "cancel") => {
    if (selectedIds.size === 0) {
      toast.error("Please select at least one subscription");
      return;
    }

    try {
      setAction(actionType);
      setHasSubmitted(true);
      toast.loading("Submitting transaction...", { id: `batch-${actionType}` });

      const idsArray = Array.from(selectedIds);
      for (const id of idsArray) {
        switch (actionType) {
          case "pause":
            await pauseSubscription(id);
            break;
          case "resume":
            await resumeSubscription(id);
            break;
          case "cancel":
            await cancelSubscription(id);
            break;
        }
      }

      toast.loading("Waiting for confirmation...", { id: `batch-${actionType}` });
    } catch (error: any) {
      toast.error(error?.message || `Failed to ${actionType} subscriptions`, {
        id: `batch-${actionType}`,
      });
      setHasSubmitted(false);
      setAction(null);
    }
  };

  // Watch for transaction confirmation
  useEffect(() => {
    if (hasSubmitted && isConfirmed && action) {
      toast.success(`Successfully ${action}d ${selectedIds.size} subscription(s)`, {
        id: `batch-${action}`,
      });
      setHasSubmitted(false);
      setAction(null);
      setSelectedIds(new Set());
    }
  }, [isConfirmed, hasSubmitted, action, selectedIds.size]);

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const subs = (subscriptions as any[]) || [];
  const activeSubs = subs.filter((s) => Number(s.status ?? 0) === 0);
  const pausedSubs = subs.filter((s) => Number(s.status ?? 0) === 1);

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Batch Subscription Management</CardTitle>
        <p className="text-sm text-muted-foreground">
          Select multiple subscriptions to manage at once
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {subs.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No subscriptions found
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {selectedIds.size === subs.length ? "Deselect All" : "Select All"}
              </Button>
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} selected
              </span>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-4">
              {subs.map((sub: any) => {
                const subId = BigInt(sub.subscriptionId);
                const isSelected = selectedIds.has(subId);
                const isActive = Number(sub.status ?? 0) === 0;
                const isPaused = Number(sub.status ?? 0) === 1;

                return (
                  <div
                    key={Number(subId)}
                    className="flex items-center gap-3 p-2 rounded hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggle(subId)}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {sub.title || `Subscription #${subId}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatEther(sub.amount)} {sub.token === "0x0000000000000000000000000000000000000000" ? "CELO" : "Token"}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        isActive
                          ? "bg-green-100 text-green-800"
                          : isPaused
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {isActive ? "Active" : isPaused ? "Paused" : "Cancelled"}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBatchAction("pause")}
                disabled={isPending || selectedIds.size === 0}
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBatchAction("resume")}
                disabled={isPending || selectedIds.size === 0}
              >
                <Play className="h-4 w-4 mr-2" />
                Resume Selected
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleBatchAction("cancel")}
                disabled={isPending || selectedIds.size === 0}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel Selected
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

