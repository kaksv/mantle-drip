"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Loader2,
  X,
  Play,
  PlusCircle,
  Pause,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Calendar,
  TrendingUp,
  Wallet,
  Clock,
  Edit,
} from "lucide-react";
import { useAccount } from "wagmi";
import {
  useSubscriptionData,
  useSubscriptionBalance,
  useSubscription,
  usePaymentHistory,
  usePaymentDue,
} from "@/lib/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEther } from "viem";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { DepositSubscriptionModal } from "@/components/deposit-subscription-modal";
import { CancelSubscriptionModal } from "@/components/cancel-subscription-modal";
import { ModifySubscriptionModal } from "@/components/modify-subscription-modal";

export default function SubscriptionDetailsPage() {
  const params = useParams();
  const { address } = useAccount();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const paymentsPerPage = 10;
  const subscriptionId =
    params?.id && typeof params.id === "string"
      ? BigInt(params.id)
      : undefined;

  const { subscription, isLoading, error, refetch: refetchSubscription } = useSubscriptionData(
    subscriptionId
  );
  const { balance, refetch: refetchBalance } = useSubscriptionBalance(subscriptionId);
  const { payments, total: totalPayments, isLoading: historyLoading } =
    usePaymentHistory(subscriptionId, currentPage * paymentsPerPage, paymentsPerPage);
  const { isDue, nextPaymentTime: dueNextPaymentTime } = usePaymentDue(
    subscriptionId
  );
  const {
    executePayment,
    pauseSubscription,
    resumeSubscription,
    cancelSubscription,
    isPending,
    isConfirmed,
  } = useSubscription();
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  // Watch for transaction confirmation - must be before any early returns
  useEffect(() => {
    if (pendingAction && isConfirmed) {
      switch (pendingAction) {
        case "execute":
          toast.success("Payment executed", { id: "exec-sub" });
          break;
        case "pause":
          toast.success("Subscription paused", { id: "pause-sub" });
          break;
        case "resume":
          toast.success("Subscription resumed", { id: "resume-sub" });
          break;
      }
      setPendingAction(null);
      refetchSubscription();
      refetchBalance();
    }
  }, [isConfirmed, pendingAction, refetchSubscription, refetchBalance]);

  if (!subscriptionId) {
    return (
      <main className="flex-1">
        <div className="container px-4 mx-auto max-w-[1280px] py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Invalid subscription ID</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/subscriptions">Back to Subscriptions</Link>
            </Button>
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
            <span className="ml-2 text-muted-foreground">
              Loading subscription...
            </span>
          </div>
        </div>
      </main>
    );
  }

  if (error || !subscription) {
    return (
      <main className="flex-1">
        <div className="container px-4 mx-auto max-w-[1280px] py-8">
          <div className="text-center py-12">
            <p className="text-destructive">
              {error?.message || "Subscription not found"}
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/subscriptions">Back to Subscriptions</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const sub = subscription as any;

  const isSubscriber =
    address && sub.subscriber.toLowerCase() === address.toLowerCase();
  const isRecipient =
    address && sub.recipient.toLowerCase() === address.toLowerCase();

  const isActive = Number(sub.status ?? 0) === 0;
  const isPaused = Number(sub.status ?? 0) === 1;
  const isCancelled = Number(sub.status ?? 0) === 2;

  const tokenLabel =
    sub.token === "0x0000000000000000000000000000000000000000"
      ? "CELO"
      : "Token";

  const formatAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const formatTime = (timestamp: bigint) => {
    if (!timestamp || timestamp === 0n) return "-";
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString();
  };

  const getCadenceLabel = (cadence: number) => {
    switch (cadence) {
      case 0:
        return "Daily";
      case 1:
        return "Weekly";
      case 2:
        return "Monthly";
      case 3:
        return "Custom";
      default:
        return "Unknown";
    }
  };

  const formattedAmount = `${formatEther(sub.amount)} ${tokenLabel}`;
  const formattedBalance =
    balance !== undefined && balance !== null
      ? `${formatEther(balance as bigint)} ${tokenLabel}`
      : `0 ${tokenLabel}`;

  const statusLabel = isActive
    ? "Active"
    : isPaused
    ? "Paused"
    : "Cancelled";

  // Calculate metrics
  const totalPaidAmount = formatEther(sub.totalPaid as bigint);
  const paymentCount = Number(sub.paymentCount ?? 0);
  const avgPayment =
    paymentCount > 0 ? parseFloat(totalPaidAmount) / paymentCount : 0;

  // Calculate estimated monthly/yearly outflow
  const getEstimatedOutflow = () => {
    const cadence = Number(sub.cadence ?? 0);
    const amountPerPayment = parseFloat(formatEther(sub.amount));
    let monthly = 0;
    let yearly = 0;

    switch (cadence) {
      case 0: // Daily
        monthly = amountPerPayment * 30;
        yearly = amountPerPayment * 365;
        break;
      case 1: // Weekly
        monthly = amountPerPayment * 4.33;
        yearly = amountPerPayment * 52;
        break;
      case 2: // Monthly
        monthly = amountPerPayment;
        yearly = amountPerPayment * 12;
        break;
      default:
        monthly = 0;
        yearly = 0;
    }

    return { monthly, yearly };
  };

  const { monthly, yearly } = getEstimatedOutflow();

  // Calculate time until next payment
  const getTimeUntilNextPayment = () => {
    if (!isActive || isCancelled) return null;
    const nextTime = Number(sub.nextPaymentTime as bigint);
    const now = Math.floor(Date.now() / 1000);
    const diff = nextTime - now;

    if (diff <= 0) return "Due now";
    if (diff < 3600) return `Due in ${Math.floor(diff / 60)} minutes`;
    if (diff < 86400) return `Due in ${Math.floor(diff / 3600)} hours`;
    return `Due in ${Math.floor(diff / 86400)} days`;
  };

  const timeUntilNext = getTimeUntilNextPayment();

  const handleExecutePayment = async () => {
    if (!isSubscriber || isCancelled) return;
    try {
      toast.loading("Submitting transaction...", { id: "exec-sub" });
      await executePayment(subscriptionId);
      setPendingAction("execute");
      toast.loading("Waiting for confirmation...", { id: "exec-sub" });
    } catch (e: any) {
      toast.error(e?.message || "Failed to execute payment", {
        id: "exec-sub",
      });
      setPendingAction(null);
    }
  };

  const handleTopUp = () => {
    if (!isSubscriber || isCancelled) return;
    setShowDepositModal(true);
  };

  const handlePause = async () => {
    if (!isSubscriber || !isActive) return;
    try {
      toast.loading("Submitting transaction...", { id: "pause-sub" });
      await pauseSubscription(subscriptionId);
      setPendingAction("pause");
      toast.loading("Waiting for confirmation...", { id: "pause-sub" });
    } catch (e: any) {
      toast.error(e?.message || "Failed to pause", { id: "pause-sub" });
      setPendingAction(null);
    }
  };

  const handleResume = async () => {
    if (!isSubscriber || !isPaused) return;
    try {
      toast.loading("Submitting transaction...", { id: "resume-sub" });
      await resumeSubscription(subscriptionId);
      setPendingAction("resume");
      toast.loading("Waiting for confirmation...", { id: "resume-sub" });
    } catch (e: any) {
      toast.error(e?.message || "Failed to resume", { id: "resume-sub" });
      setPendingAction(null);
    }
  };

  const handleCancel = () => {
    if (!isSubscriber || isCancelled) return;
    setShowCancelModal(true);
  };

  const handleModify = () => {
    if (!isSubscriber || isCancelled) return;
    setShowModifyModal(true);
  };

  return (
    <main className="flex-1">
      <div className="container px-4 mx-auto max-w-[1280px] py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost">
            <Link href="/subscriptions">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Subscriptions
            </Link>
          </Button>
        </div>

        {/* Overview */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl mb-1">
                  {sub.title || `Subscription #${subscriptionId.toString()}`}
                </CardTitle>
                {sub.description && (
                  <p className="text-sm text-muted-foreground">
                    {sub.description}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                  {statusLabel}
                </span>
                {isSubscriber && (
                  <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                    You pay
                  </span>
                )}
                {isRecipient && !isSubscriber && (
                  <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                    You receive
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
              <Card className="glass-card">
                <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs md:text-sm text-muted-foreground">Total Paid</p>
                    <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xl md:text-2xl font-bold">
                    {totalPaidAmount} {tokenLabel}
                  </p>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                    {paymentCount} payment{paymentCount !== 1 ? "s" : ""}
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Escrow Balance
                    </p>
                    <Wallet className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xl md:text-2xl font-bold">{formattedBalance}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                    Available for payments
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Avg Payment
                    </p>
                    <Calendar className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xl md:text-2xl font-bold">
                    {avgPayment.toFixed(6)} {tokenLabel}
                  </p>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                    Per payment
                  </p>
                </CardContent>
              </Card>

              {monthly > 0 && (
                <Card className="glass-card">
                  <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs md:text-sm text-muted-foreground">
                        Est. Monthly
                      </p>
                      <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                    </div>
                    <p className="text-xl md:text-2xl font-bold">
                      {monthly.toFixed(4)} {tokenLabel}
                    </p>
                    <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                      ~{yearly.toFixed(2)} {tokenLabel}/year
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Payment Due Card */}
              {isActive && timeUntilNext && (
                <Card className="glass-card col-span-2 lg:col-span-1">
                  <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs md:text-sm text-muted-foreground">
                        Payment Due
                      </p>
                      <Clock className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                    </div>
                    <p
                      className={`text-xl md:text-2xl font-bold ${
                        isDue ? "text-orange-500" : "text-blue-500"
                      }`}
                    >
                      {isDue ? "Due now" : timeUntilNext.replace("Due in ", "")}
                    </p>
                    <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                      {isDue
                        ? "Execute payment"
                        : "Next scheduled payment"}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Subscription Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Subscriber</p>
                <p className="font-mono text-sm">
                  {formatAddress(sub.subscriber)}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Recipient</p>
                <p className="font-mono text-sm">
                  {formatAddress(sub.recipient)}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Amount per payment</p>
                <p className="font-semibold">{formattedAmount}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Cadence</p>
                <p>{getCadenceLabel(Number(sub.cadence ?? 0))}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Next payment</p>
                <p>{formatTime(sub.nextPaymentTime as bigint)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Last payment</p>
                <p>{formatTime(sub.lastPaymentTime as bigint)}</p>
              </div>
            </div>

            {/* Subscriber controls */}
            {isSubscriber && (
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                {isActive && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleExecutePayment}
                    disabled={isPending}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Execute Payment
                  </Button>
                )}
                {isActive && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePause}
                    disabled={isPending}
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                )}
                {isPaused && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResume}
                    disabled={isPending}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Resume
                  </Button>
                )}
                {!isCancelled && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleModify}
                    disabled={isPending}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Modify
                  </Button>
                )}
                {!isCancelled && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTopUp}
                    disabled={isPending}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Top up
                  </Button>
                )}
                {!isCancelled && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isPending}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deposit Modal */}
        {showDepositModal && (
          <DepositSubscriptionModal
            subscriptionId={subscriptionId}
            token={sub.token as `0x${string}`}
            onClose={() => {
              setShowDepositModal(false);
              refetchBalance();
              refetchSubscription();
            }}
          />
        )}

        {/* Cancel Modal */}
        {showCancelModal && (
          <CancelSubscriptionModal
            subscriptionId={subscriptionId}
            onClose={() => setShowCancelModal(false)}
          />
        )}

        {/* Modify Modal */}
        {showModifyModal && (
          <ModifySubscriptionModal
            subscriptionId={subscriptionId}
            token={sub.token as `0x${string}`}
            currentAmount={sub.amount as bigint}
            currentCadence={Number(sub.cadence ?? 0)}
            currentInterval={sub.interval as bigint}
            onClose={() => {
              setShowModifyModal(false);
              refetchSubscription();
            }}
          />
        )}

        {/* Payment History */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <p className="text-sm text-muted-foreground">
              {totalPayments > 0
                ? `${totalPayments} payment${totalPayments !== 1 ? "s" : ""} recorded`
                : "No payments yet"}
            </p>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">
                  Loading payment history...
                </span>
              </div>
            ) : !payments || (Array.isArray(payments) && payments.length === 0) ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No payment history available yet.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Payments will appear here after they are executed.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Payment ID
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Amount
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(payments as any[]).map((payment: any) => {
                      const isSuccess = payment.success !== false;
                      const paymentDate = new Date(
                        Number(payment.timestamp) * 1000
                      );
                      return (
                        <tr
                          key={Number(payment.paymentId)}
                          className="border-b hover:bg-muted/50"
                        >
                          <td className="py-3 px-4 text-sm font-mono">
                            #{payment.paymentId.toString()}
                          </td>
                          <td className="py-3 px-4 text-sm font-medium">
                            {formatEther(payment.amount)} {tokenLabel}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {paymentDate.toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {isSuccess ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  <span className="text-sm text-green-500">
                                    Success
                                  </span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 text-destructive" />
                                  <span className="text-sm text-destructive">
                                    Failed
                                  </span>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                
                {/* Pagination Controls */}
                {totalPayments > paymentsPerPage && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Showing {currentPage * paymentsPerPage + 1} to{" "}
                      {Math.min(
                        (currentPage + 1) * paymentsPerPage,
                        totalPayments
                      )}{" "}
                      of {totalPayments} payments
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                        disabled={currentPage === 0 || historyLoading}
                      >
                        Previous
                      </Button>
                      <div className="text-sm text-muted-foreground px-2">
                        Page {currentPage + 1} of{" "}
                        {Math.ceil(totalPayments / paymentsPerPage)}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(
                              prev + 1,
                              Math.ceil(totalPayments / paymentsPerPage) - 1
                            )
                          )
                        }
                        disabled={
                          currentPage >=
                            Math.ceil(totalPayments / paymentsPerPage) - 1 ||
                          historyLoading
                        }
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}


