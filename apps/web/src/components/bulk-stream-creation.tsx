"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAccount, useChainId } from "wagmi";
import { useDrip } from "@/lib/contracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TokenSelector, getTokenByAddress } from "@/components/token-selector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { parseEther } from "viem";
import { useRouter } from "next/navigation";

const bulkStreamSchema = z.object({
  streams: z
    .array(
      z.object({
        recipients: z
          .array(
            z.object({
              address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid address"),
              amountPerPeriod: z.string().min(1, "Amount required"),
            })
          )
          .min(1, "At least one recipient required"),
        periodDays: z.string().min(1, "Period required"),
        totalPeriods: z.string().min(1, "Total periods required"),
        title: z.string().max(120, "Title too long").optional(),
      })
    )
    .min(1, "At least one stream required"),
  token: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Token required"),
});

type BulkStreamFormData = z.infer<typeof bulkStreamSchema>;

export function BulkStreamCreation() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const router = useRouter();
  const { createStream, isPending, isConfirming, isConfirmed } = useDrip();
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BulkStreamFormData>({
    resolver: zodResolver(bulkStreamSchema),
    defaultValues: {
      streams: [
        {
          recipients: [{ address: "", amountPerPeriod: "" }],
          periodDays: "30",
          totalPeriods: "1",
          title: "",
        },
      ],
      token: "0x0000000000000000000000000000000000000000",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "streams",
  });

  const watchedToken = watch("token");
  const watchedStreams = watch("streams");

  // Watch for transaction confirmation
  useEffect(() => {
    if (hasSubmitted && isConfirmed) {
      toast.success("Bulk streams created successfully!", { id: "bulk-streams" });
      setHasSubmitted(false);
      setTimeout(() => {
        router.push("/streams");
      }, 1500);
    }
  }, [isConfirmed, hasSubmitted, router]);

  const onSubmit = async (data: BulkStreamFormData) => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      toast.loading("Creating bulk streams...", { id: "bulk-streams" });

      const tokenInfo = getTokenByAddress(data.token as `0x${string}`, chainId);
      if (!tokenInfo) {
        toast.error("Invalid token");
        return;
      }

      // Create streams sequentially
      for (const stream of data.streams) {
        const recipients = stream.recipients.map((r) => r.address as `0x${string}`);
        const amountsPerPeriod = stream.recipients.map((r) => r.amountPerPeriod);
        const periodSeconds = parseInt(stream.periodDays) * 24 * 60 * 60;
        const totalPeriods = parseInt(stream.totalPeriods);
        const totalAmountPerPeriod = stream.recipients.reduce(
          (sum, r) => sum + parseFloat(r.amountPerPeriod || "0"),
          0
        );
        const deposit = (totalAmountPerPeriod * totalPeriods).toFixed(6);

        await createStream(
          recipients,
          data.token as `0x${string}`,
          amountsPerPeriod,
          periodSeconds,
          deposit,
          stream.title || "",
          ""
        );
      }

      setHasSubmitted(true);
      toast.loading("Waiting for confirmation...", { id: "bulk-streams" });
    } catch (error: any) {
      toast.error(error?.message || "Failed to create bulk streams", {
        id: "bulk-streams",
      });
      setHasSubmitted(false);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Bulk Stream Creation
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Create multiple payment streams at once
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label>Token</Label>
            <TokenSelector
              value={watchedToken as `0x${string}`}
              onValueChange={(value) => setValue("token", value)}
            />
          </div>

          {fields.map((field, streamIndex) => (
            <Card key={field.id} className="p-4 border">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">Stream {streamIndex + 1}</h4>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(streamIndex)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Recipients</Label>
                  {streamIndex < watchedStreams.length &&
                    watchedStreams[streamIndex]?.recipients?.map(
                      (recipient: any, recipientIndex: number) => (
                        <div key={recipientIndex} className="flex gap-2">
                          <Input
                            placeholder="0x..."
                            {...register(
                              `streams.${streamIndex}.recipients.${recipientIndex}.address`
                            )}
                          />
                          <Input
                            type="number"
                            step="0.000001"
                            placeholder="Amount"
                            {...register(
                              `streams.${streamIndex}.recipients.${recipientIndex}.amountPerPeriod`
                            )}
                          />
                          {watchedStreams[streamIndex]?.recipients?.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const currentRecipients = watchedStreams[streamIndex]?.recipients || [];
                                const newRecipients = currentRecipients.filter(
                                  (_: any, idx: number) => idx !== recipientIndex
                                );
                                setValue(`streams.${streamIndex}.recipients`, newRecipients);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )
                    )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentRecipients = watchedStreams[streamIndex]?.recipients || [];
                      setValue(`streams.${streamIndex}.recipients`, [
                        ...currentRecipients,
                        { address: "", amountPerPeriod: "" },
                      ]);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Recipient
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Period (days)</Label>
                    <Input
                      type="number"
                      {...register(`streams.${streamIndex}.periodDays`)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Periods</Label>
                    <Input
                      type="number"
                      {...register(`streams.${streamIndex}.totalPeriods`)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Title (optional)</Label>
                  <Input {...register(`streams.${streamIndex}.title`)} />
                </div>
              </div>
            </Card>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              append({
                recipients: [{ address: "", amountPerPeriod: "" }],
                periodDays: "30",
                totalPeriods: "1",
                title: "",
              })
            }
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Stream
          </Button>

          <Button
            type="submit"
            disabled={isPending || isConfirming}
            className="w-full"
          >
            {isPending || isConfirming ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isConfirming ? "Confirming..." : "Creating..."}
              </>
            ) : (
              `Create ${fields.length} Stream${fields.length !== 1 ? "s" : ""}`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

