"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Activity, DollarSign } from "lucide-react";

interface TreasuryOverviewProps {
  activeStreamsCount: number;
  activeSubscriptionsCount: number;
  totalActivePayments: number;
}

export function TreasuryOverview({
  activeStreamsCount,
  activeSubscriptionsCount,
  totalActivePayments,
}: TreasuryOverviewProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
      <Card className="glass-card">
        <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs md:text-sm text-muted-foreground">Active Streams</p>
            <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </div>
          <p className="text-xl md:text-3xl font-bold">{activeStreamsCount}</p>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
            Currently active payment streams
          </p>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs md:text-sm text-muted-foreground">Active Subscriptions</p>
            <Activity className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </div>
          <p className="text-xl md:text-3xl font-bold">{activeSubscriptionsCount}</p>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
            Currently active subscriptions
          </p>
        </CardContent>
      </Card>

      <Card className="glass-card col-span-2 md:col-span-1">
        <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs md:text-sm text-muted-foreground">Total Active Payments</p>
            <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </div>
          <p className="text-xl md:text-3xl font-bold">{totalActivePayments}</p>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
            Streams + Subscriptions combined
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

