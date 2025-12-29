"use client";

import { useState } from "react";
import { useTreasury } from "@/lib/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileJson, FileSpreadsheet } from "lucide-react";
import { formatEther, formatUnits } from "viem";
import { getTokenByAddress } from "@/components/token-selector";
import { useChainId } from "wagmi";

export function ExportData() {
  const { streams, subscriptions } = useTreasury();
  const chainId = useChainId();
  const [exporting, setExporting] = useState(false);

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            if (value === null || value === undefined) return "";
            if (typeof value === "object") return JSON.stringify(value);
            return String(value).includes(",") ? `"${value}"` : value;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = (data: any[], filename: string) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportStreams = (format: "csv" | "json") => {
    if (!streams || !Array.isArray(streams)) return;

    setExporting(true);
    const exportData = streams
      .filter((stream: any) => stream.streamId != null) // Filter out streams without streamId
      .map((stream: any) => {
      const tokenInfo = getTokenByAddress(stream.token as `0x${string}`, chainId) || {
        decimals: 18,
        symbol: "CELO",
      };

      return {
        streamId: stream.streamId.toString(),
        sender: stream.sender,
        recipients: stream.recipients?.join("; ") || "",
        token: stream.token,
        tokenSymbol: tokenInfo.symbol,
        deposit: formatUnits(stream.deposit || 0n, tokenInfo.decimals),
        startTime: new Date(Number(stream.startTime || 0n) * 1000).toISOString(),
        endTime: new Date(Number(stream.endTime || 0n) * 1000).toISOString(),
        // Contract enum: 0 = Pending, 1 = Active, 2 = Paused, 3 = Cancelled, 4 = Completed
        status: ["Pending", "Active", "Paused", "Cancelled", "Completed"][Number(stream.status ?? 0)],
        title: stream.title || "",
        description: stream.description || "",
      };
    });

    if (format === "csv") {
      exportToCSV(exportData, `streams-${Date.now()}.csv`);
    } else {
      exportToJSON(exportData, `streams-${Date.now()}.json`);
    }

    setExporting(false);
  };

  const handleExportSubscriptions = (format: "csv" | "json") => {
    if (!subscriptions || !Array.isArray(subscriptions)) return;

    setExporting(true);
    const exportData = subscriptions
      .filter((sub: any) => sub.subscriptionId != null) // Filter out subscriptions without subscriptionId
      .map((sub: any) => {
      const tokenInfo = getTokenByAddress(sub.token as `0x${string}`, chainId) || {
        decimals: 18,
        symbol: "CELO",
      };

      const cadenceLabels = ["Daily", "Weekly", "Monthly", "Custom"];
      const statusLabels = ["Active", "Paused", "Cancelled"];

      return {
        subscriptionId: sub.subscriptionId.toString(),
        subscriber: sub.subscriber,
        recipient: sub.recipient,
        token: sub.token,
        tokenSymbol: tokenInfo.symbol,
        amount: formatUnits(sub.amount || 0n, tokenInfo.decimals),
        cadence: cadenceLabels[Number(sub.cadence ?? 0)],
        interval: sub.interval?.toString() || "0",
        nextPaymentTime: sub.nextPaymentTime
          ? new Date(Number(sub.nextPaymentTime) * 1000).toISOString()
          : "",
        lastPaymentTime: sub.lastPaymentTime
          ? new Date(Number(sub.lastPaymentTime) * 1000).toISOString()
          : "",
        totalPaid: formatUnits(sub.totalPaid || 0n, tokenInfo.decimals),
        paymentCount: sub.paymentCount?.toString() || "0",
        balance: formatUnits(sub.balance || 0n, tokenInfo.decimals),
        status: statusLabels[Number(sub.status ?? 0)],
        title: sub.title || "",
        description: sub.description || "",
      };
    });

    if (format === "csv") {
      exportToCSV(exportData, `subscriptions-${Date.now()}.csv`);
    } else {
      exportToJSON(exportData, `subscriptions-${Date.now()}.json`);
    }

    setExporting(false);
  };

  const streamCount = streams && Array.isArray(streams) ? streams.length : 0;
  const subscriptionCount =
    subscriptions && Array.isArray(subscriptions) ? subscriptions.length : 0;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Data
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Export streams and subscriptions data for reconciliation
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Streams Export */}
        <div className="space-y-2">
          <h4 className="font-semibold">Streams ({streamCount})</h4>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportStreams("csv")}
              disabled={exporting || streamCount === 0}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportStreams("json")}
              disabled={exporting || streamCount === 0}
            >
              <FileJson className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </div>

        {/* Subscriptions Export */}
        <div className="space-y-2 pt-4 border-t">
          <h4 className="font-semibold">Subscriptions ({subscriptionCount})</h4>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportSubscriptions("csv")}
              disabled={exporting || subscriptionCount === 0}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportSubscriptions("json")}
              disabled={exporting || subscriptionCount === 0}
            >
              <FileJson className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

