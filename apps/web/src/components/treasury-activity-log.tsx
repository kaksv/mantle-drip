"use client";

import { useState, useMemo } from "react";
import { useTreasury } from "@/lib/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { History, Search, Filter } from "lucide-react";
import { formatEther, formatUnits } from "viem";
import { getTokenByAddress } from "@/components/token-selector";
import { useChainId } from "wagmi";

type ActivityType = "all" | "stream" | "subscription";
type ActivityStatus = "all" | "active" | "paused" | "completed" | "cancelled";

export function TreasuryActivityLog() {
  const { streams, subscriptions } = useTreasury();
  const chainId = useChainId();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<ActivityType>("all");
  const [statusFilter, setStatusFilter] = useState<ActivityStatus>("all");

  const activities = useMemo(() => {
    const allActivities: any[] = [];

    // Add streams
    if (streams && Array.isArray(streams)) {
      streams.forEach((stream: any) => {
        // Skip if streamId is missing or undefined
        if (!stream.streamId) return;
        
        allActivities.push({
          id: stream.streamId.toString(),
          type: "stream",
          title: stream.title || `Stream #${stream.streamId}`,
          description: stream.description || "",
          status: Number(stream.status ?? 0),
          // Contract enum: 0 = Pending, 1 = Active, 2 = Paused, 3 = Cancelled, 4 = Completed
          statusLabel: ["Pending", "Active", "Paused", "Cancelled", "Completed"][Number(stream.status ?? 0)],
          createdAt: Number(stream.startTime || 0n) * 1000,
          token: stream.token,
          amount: stream.deposit,
          data: stream,
        });
      });
    }

    // Add subscriptions
    if (subscriptions && Array.isArray(subscriptions)) {
      subscriptions.forEach((sub: any) => {
        // Skip if subscriptionId is missing or undefined
        if (!sub.subscriptionId) return;
        
        allActivities.push({
          id: sub.subscriptionId.toString(),
          type: "subscription",
          title: sub.title || `Subscription #${sub.subscriptionId}`,
          description: sub.description || "",
          status: Number(sub.status ?? 0),
          statusLabel: ["Active", "Paused", "Cancelled"][Number(sub.status ?? 0)],
          createdAt: Number(sub.nextPaymentTime || 0n) * 1000,
          token: sub.token,
          amount: sub.amount,
          data: sub,
        });
      });
    }

    // Sort by creation date (newest first)
    allActivities.sort((a, b) => b.createdAt - a.createdAt);

    // Apply filters
    let filtered = allActivities;

    if (typeFilter !== "all") {
      filtered = filtered.filter((a) => a.type === typeFilter);
    }

    if (statusFilter !== "all") {
      const statusMap: Record<ActivityStatus, number[]> = {
        all: [],
        active: [0],
        paused: [1],
        completed: [2],
        cancelled: [2, 3],
      };
      filtered = filtered.filter((a) => statusMap[statusFilter].includes(a.status));
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          a.description.toLowerCase().includes(query) ||
          a.id.includes(query)
      );
    }

    return filtered;
  }, [streams, subscriptions, typeFilter, statusFilter, searchQuery]);

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Treasury Activity Log
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Complete audit trail of all streams and subscriptions
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, description, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as ActivityType)}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="stream">Streams</SelectItem>
              <SelectItem value="subscription">Subscriptions</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ActivityStatus)}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Activity List */}
        <div className="max-h-96 overflow-y-auto space-y-2">
          {activities.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No activities found
            </p>
          ) : (
            activities.map((activity) => {
              const tokenInfo = getTokenByAddress(activity.token as `0x${string}`, chainId) || {
                decimals: 18,
                symbol: "CELO",
              };
              const formattedAmount = formatUnits(activity.amount || 0n, tokenInfo.decimals);

              return (
                <div
                  key={`${activity.type}-${activity.id}`}
                  className="p-4 rounded-lg border bg-background/50 hover:bg-background/80 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium px-2 py-1 rounded bg-primary/10 text-primary">
                          {activity.type === "stream" ? "Stream" : "Subscription"}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            // For streams: 0 = Pending, 1 = Active, 2 = Paused, 3 = Cancelled, 4 = Completed
                            // For subscriptions: 0 = Active, 1 = Paused, 2 = Cancelled
                            activity.type === "stream"
                              ? activity.status === 1
                                ? "bg-green-100 text-green-800"
                                : activity.status === 2
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                              : activity.status === 0
                              ? "bg-green-100 text-green-800"
                              : activity.status === 1
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {activity.statusLabel}
                        </span>
                      </div>
                      <h4 className="font-semibold text-sm">{activity.title}</h4>
                      {activity.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {activity.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>ID: {activity.id}</span>
                        <span>
                          {formattedAmount} {tokenInfo.symbol}
                        </span>
                        <span>
                          {new Date(activity.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

