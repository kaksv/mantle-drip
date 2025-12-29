"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAccount } from "wagmi";
import { useSubscription, SubscriptionCadence } from "@/lib/contracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TokenSelector } from "@/components/token-selector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const subscriptionSchema = z.object({
  recipient: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid address"),
  token: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Token required"),
  amount: z
    .string()
    .min(1, "Amount required")
    .refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
      "Must be a positive number"
    ),
  cadence: z.enum(["daily", "weekly", "monthly"], {
    required_error: "Choose how often it should charge",
  }),
  title: z.string().max(120, "Title too long").optional(),
  description: z.string().max(1024, "Description too long").optional(),
});

type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

type CadenceOption = SubscriptionFormData["cadence"];

const cadenceToEnum: Record<CadenceOption, SubscriptionCadence> = {
  daily: SubscriptionCadence.DAILY,
  weekly: SubscriptionCadence.WEEKLY,
  monthly: SubscriptionCadence.MONTHLY,
};

export function CreateSubscriptionForm() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const { createSubscription, isPending, isConfirming, isConfirmed, hash } =
    useSubscription();
  const [selectedToken, setSelectedToken] = useState<
    `0x${string}` | undefined
  >("0x0000000000000000000000000000000000000000");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      recipient: "",
      token: "0x0000000000000000000000000000000000000000",
      amount: "",
      cadence: "monthly",
      title: "",
      description: "",
    },
  });

  // Watch for transaction confirmation
  useEffect(() => {
    if (isConfirmed && hash) {
      toast.success("Subscription created successfully!", {
        id: "create-subscription",
      });
      // Navigate to subscriptions page after a short delay
      setTimeout(() => {
        router.push("/subscriptions");
      }, 1500);
    }
  }, [isConfirmed, hash, router]);

  const onSubmit = async (data: SubscriptionFormData) => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      const cadenceEnum = cadenceToEnum[data.cadence];

      toast.loading("Submitting transaction...", { id: "create-subscription" });

      await createSubscription(
        data.recipient as `0x${string}`,
        data.token as `0x${string}`,
        data.amount,
        cadenceEnum,
        0, // customInterval (not used for non-Custom cadences)
        0, // firstPaymentTime (0 => now + interval)
        data.title || "",
        data.description || ""
      );

      toast.loading("Waiting for confirmation...", { id: "create-subscription" });
    } catch (error: any) {
      toast.error(error?.message || "Failed to create subscription", {
        id: "create-subscription",
      });
    }
  };

  // Watch for transaction confirmation
  useEffect(() => {
  if (isConfirmed && hash) {
    toast.success("Subscription created successfully!", {
        id: "create-subscription",
    });
    setTimeout(() => {
      router.push("/subscriptions");
    }, 2000);
  }
  }, [isConfirmed, hash, router]);

  if (!isConnected) {
    return (
      <Card className="glass-card">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Connect your wallet to create a subscription.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basics */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Subscription basics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Who are you paying, how much, and how often?
            </p>

            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient address</Label>
              <Input
                id="recipient"
                placeholder="0x…"
                {...register("recipient")}
              />
              {errors.recipient && (
                <p className="text-sm text-destructive">
                  {errors.recipient.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="token">Payment token</Label>
              <TokenSelector
                value={selectedToken}
                onValueChange={(value) => {
                  setSelectedToken(value);
                  setValue("token", value);
                }}
              />
              {errors.token && (
                <p className="text-sm text-destructive">
                  {errors.token.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount per payment</Label>
              <Input
                id="amount"
                type="number"
                step="0.000001"
                placeholder="e.g. 100"
                {...register("amount")}
              />
              {errors.amount && (
                <p className="text-sm text-destructive">
                  {errors.amount.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cadence">How often should it charge?</Label>
              <select
                id="cadence"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...register("cadence")}
              >
                <option value="daily">Every day</option>
                <option value="weekly">Every week</option>
                <option value="monthly">Every month</option>
              </select>
              {errors.cadence && (
                <p className="text-sm text-destructive">
                  {errors.cadence.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Optional details */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Details (optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Subscription name</Label>
              <Input
                id="title"
                placeholder="e.g. SaaS – Pro Plan"
                maxLength={120}
                {...register("title")}
              />
              {errors.title && (
                <p className="text-sm text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Notes (for you)</Label>
              <textarea
                id="description"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Short note so you remember what this subscription is for…"
                maxLength={1024}
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={isPending || isConfirming}
          className="flex-1"
        >
          {isPending || isConfirming ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isConfirming ? "Confirming..." : "Creating..."}
            </>
          ) : (
            "Create Subscription"
          )}
        </Button>
      </div>
    </form>
  );
}


