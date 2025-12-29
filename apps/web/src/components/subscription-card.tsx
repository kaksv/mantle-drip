"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEther } from "viem";

interface SubscriptionCardProps {
  subscriptionId: bigint;
  amount: bigint;
  token: string;
  title?: string;
}

export function SubscriptionCard({
  subscriptionId,
  amount,
  token,
  title,
}: SubscriptionCardProps) {
  const formattedAmount = `${formatEther(amount)} ${
    token === "0x0000000000000000000000000000000000000000" ? "CELO" : "Token"
  }`;

  const displayTitle =
    title && typeof title === "string" && title.trim().length > 0
      ? title
      : `Subscription #${subscriptionId.toString()}`;

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{displayTitle}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">Amount per payment</p>
        <p className="text-xl font-semibold">{formattedAmount}</p>
      </CardContent>
    </Card>
  );
}

