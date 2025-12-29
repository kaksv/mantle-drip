"use client";

import { useAccount } from "wagmi";
import { useTreasury } from "@/lib/contracts/hooks/useTreasury";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BarChart3, Settings, Shield, Wallet } from "lucide-react";
import { formatUnits } from "viem";
import { TreasuryOverview } from "@/components/treasury-overview";
import { TokenBalances } from "@/components/token-balances";
import { FinancialAnalytics } from "@/components/financial-analytics";
import { StreamsAnalyticsDashboard } from "@/components/streams-analytics-dashboard";
import { BulkStreamCreation } from "@/components/bulk-stream-creation";
import { BatchSubscriptionManagement } from "@/components/batch-subscription-management";
import { ExportData } from "@/components/export-data";
import { TreasuryActivityLog } from "@/components/treasury-activity-log";
import { BudgetControls } from "@/components/budget-controls";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IdentityStatus } from "@/components/gooddollar/identity-status";
import { FaceVerification } from "@/components/gooddollar/face-verification";
import { UbiClaimCard } from "@/components/gooddollar/ubi-claim-card";
import { SelfIdentityCard } from "@/components/self-protocol/self-identity-card";

export default function TreasuryPage() {
  const { address, isConnected } = useAccount();
  const {
    activeStreamsCount,
    activeSubscriptionsCount,
    tokenBalances,
    outflowProjections,
    analytics,
    isLoading,
    error,
  } = useTreasury();

  if (!isConnected || !address) {
    return (
      <main className="flex-1">
        <div className="container px-4 mx-auto max-w-[1280px] py-8">
          <div className="glass-card rounded-lg p-8 text-center">
            <p className="text-muted-foreground">
              Connect your wallet to view your treasury dashboard.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="flex-1">
        <div className="container px-4 mx-auto max-w-[1280px] py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading treasury data...</span>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1">
        <div className="container px-4 mx-auto max-w-[1280px] py-8">
          <div className="glass-card rounded-lg p-8 text-center">
            <p className="text-destructive">
              Error loading treasury data: {error.message}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <div className="container px-4 mx-auto max-w-[1280px] py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Treasury</h1>
          <p className="text-muted-foreground">
            Manage your payment streams and subscriptions
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="wallet" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Wallet
            </TabsTrigger>
            <TabsTrigger value="identity" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Identity
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6 mt-6">
            {/* Streams Analytics Dashboard - First Section */}
            <StreamsAnalyticsDashboard />
          </TabsContent>

          {/* Wallet Tab */}
          <TabsContent value="wallet" className="space-y-6 mt-6">
            {/* Overview Cards */}
            <TreasuryOverview
              activeStreamsCount={activeStreamsCount}
              activeSubscriptionsCount={activeSubscriptionsCount}
              totalActivePayments={analytics.activePayments}
            />

            {/* Good Dollar UBI Claim Card - Floating (removed from here, now floating) */}

            {/* Token Balances */}
            <TokenBalances tokenBalances={tokenBalances} />

            {/* Financial Analytics */}
            <FinancialAnalytics
              outflowProjections={outflowProjections}
              analytics={analytics}
            />
          </TabsContent>

          {/* Management Tab - Disabled for now */}
          {/* <TabsContent value="management" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BulkStreamCreation />
              <BatchSubscriptionManagement />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ExportData />
              <TreasuryActivityLog />
            </div>
            <BudgetControls />
          </TabsContent> */}

          {/* Identity Tab */}
          <TabsContent value="identity" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Good Dollar Identity Card */}
              <div className="space-y-4">
                <IdentityStatus />
                <FaceVerification />
              </div>

              {/* Self Protocol Identity Card */}
              <SelfIdentityCard />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

