 "use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { useAccount } from "wagmi";
import { useUserSubscriptionsAll } from "@/lib/contracts";
import { SubscriptionCard } from "@/components/subscription-card";

export default function SubscriptionsPage() {
  const { address, isConnected } = useAccount();
  const { subscriptions, isLoading, error } = useUserSubscriptionsAll(
    address as `0x${string}` | undefined
  );

  const hasSubscriptions =
    Array.isArray(subscriptions) && subscriptions.length > 0;

  return (
    <main className="flex-1">
      <div className="container px-4 mx-auto max-w-[1280px] py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Subscriptions</h1>
            <p className="text-muted-foreground">
              Manage your recurring payment subscriptions.
            </p>
          </div>
          <Button asChild>
            <Link href="/subscriptions/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Subscription
            </Link>
          </Button>
        </div>

        {!isConnected || !address ? (
          <div className="glass-card rounded-lg p-8 text-center">
            <p className="text-muted-foreground">
              Connect your wallet to view your subscriptions.
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">
              Loading subscriptions...
            </span>
          </div>
        ) : error ? (
          <div className="glass-card rounded-lg p-8 text-center">
            <p className="text-destructive">
              Error loading subscriptions: {error.message}
            </p>
          </div>
        ) : !hasSubscriptions ? (
          <div className="glass-card rounded-lg p-8 text-center">
            <p className="text-muted-foreground">No subscriptions yet</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/subscriptions/create">
                Create your first subscription
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subscriptions.map((sub: any) => (
              <Link
                key={Number(sub.subscriptionId)}
                href={`/subscriptions/${Number(sub.subscriptionId)}`}
                className="block"
              >
                <SubscriptionCard
                  subscriptionId={BigInt(sub.subscriptionId)}
                  amount={BigInt(sub.amount)}
                  token={sub.token}
                  title={sub.title}
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

