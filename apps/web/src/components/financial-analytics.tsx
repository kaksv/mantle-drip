"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, BarChart3, DollarSign } from "lucide-react";

interface FinancialAnalyticsProps {
  outflowProjections: {
    monthly: Record<string, { amount: number; decimals: number; symbol: string }>;
    yearly: Record<string, { amount: number; decimals: number; symbol: string }>;
  };
  analytics: {
    totalOutflow: Record<string, { amount: number; decimals: number; symbol: string }>;
    activePayments: number;
    avgAmounts: Record<string, number>;
  };
}

export function FinancialAnalytics({
  outflowProjections,
  analytics,
}: FinancialAnalyticsProps) {
  const monthlyTokens = Object.entries(outflowProjections.monthly);
  const yearlyTokens = Object.entries(outflowProjections.yearly);
  const avgTokens = Object.entries(analytics.avgAmounts);

  return (
    <div className="space-y-6">
      {/* Outflow Projections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Monthly Outflow */}
        <Card className="glass-card">
          <CardHeader className="px-3 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />
              Estimated Monthly Outflow
            </CardTitle>
            <p className="text-xs md:text-sm text-muted-foreground">
              Projected monthly spending across all active payments
            </p>
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-4 md:pb-6">
            {monthlyTokens.length === 0 ? (
              <p className="text-muted-foreground text-center py-4 text-sm">
                No active payments to project
              </p>
            ) : (
              <div className="space-y-2 md:space-y-3">
                {monthlyTokens.map(([token, { amount, symbol }]) => (
                  <div
                    key={token}
                    className="flex items-center justify-between p-2 md:p-3 rounded-lg border bg-background/50"
                  >
                    <span className="font-medium text-sm md:text-base">{symbol}</span>
                    <span className="text-base md:text-lg font-bold">
                      {amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 4,
                      })}{" "}
                      {symbol}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Yearly Outflow */}
        <Card className="glass-card">
          <CardHeader className="px-3 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <BarChart3 className="h-4 w-4 md:h-5 md:w-5" />
              Estimated Yearly Outflow
            </CardTitle>
            <p className="text-xs md:text-sm text-muted-foreground">
              Projected yearly spending across all active payments
            </p>
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-4 md:pb-6">
            {yearlyTokens.length === 0 ? (
              <p className="text-muted-foreground text-center py-4 text-sm">
                No active payments to project
              </p>
            ) : (
              <div className="space-y-2 md:space-y-3">
                {yearlyTokens.map(([token, { amount, symbol }]) => (
                  <div
                    key={token}
                    className="flex items-center justify-between p-2 md:p-3 rounded-lg border bg-background/50"
                  >
                    <span className="font-medium text-sm md:text-base">{symbol}</span>
                    <span className="text-base md:text-lg font-bold">
                      {amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      {symbol}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Average Payment Amounts */}
      <Card className="glass-card">
        <CardHeader className="px-3 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <DollarSign className="h-4 w-4 md:h-5 md:w-5" />
            Average Payment Amounts
          </CardTitle>
          <p className="text-xs md:text-sm text-muted-foreground">
            Average payment amount per active stream/subscription by token
          </p>
        </CardHeader>
        <CardContent className="px-3 md:px-6 pb-4 md:pb-6">
          {avgTokens.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No payment data available
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {avgTokens.map(([token, amount]) => {
                // Get symbol from monthly outflow (they should have same tokens)
                const tokenData = outflowProjections.monthly[token];
                const symbol = tokenData?.symbol || "Token";

                return (
                  <div
                    key={token}
                    className="p-3 md:p-4 rounded-lg border bg-background/50 backdrop-blur-sm"
                  >
                    <p className="text-xs md:text-sm text-muted-foreground mb-1">{symbol}</p>
                    <p className="text-lg md:text-2xl font-bold">
                      {amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6,
                      })}
                    </p>
                    <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Average per payment</p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

