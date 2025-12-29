"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pause, Play, X, Download } from "lucide-react";
import { formatEther } from "viem";
import { useDrip } from "@/lib/contracts";

interface StreamCardProps {
  streamId: bigint;
  sender: string;
  recipients: string[];
  token: string;
  ratePerSecond: bigint;
  startTime: bigint;
  endTime: bigint;
  isPaused: boolean;
  isActive: boolean;
}

export function StreamCard({
  streamId,
  sender,
  recipients,
  token,
  ratePerSecond,
  startTime,
  endTime,
  isPaused,
  isActive,
}: StreamCardProps) {
  const { pauseStream, resumeStream, cancelStream, isPending } = useDrip();

  const handlePause = () => {
    pauseStream(streamId);
  };

  const handleResume = () => {
    resumeStream(streamId);
  };

  const handleCancel = () => {
    cancelStream(streamId);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatToken = (tokenAddress: string) => {
    if (tokenAddress === "0x0000000000000000000000000000000000000000") {
      return "CELO";
    }
    // You can add token symbol mapping here
    return "Token";
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Stream #{streamId.toString()}</CardTitle>
          <div className="flex items-center gap-2">
            {isActive && !isPaused && (
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                Active
              </span>
            )}
            {isPaused && (
              <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                Paused
              </span>
            )}
            {!isActive && (
              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                Completed
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">From:</span>
            <span className="font-mono">{formatAddress(sender)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Recipients:</span>
            <span className="font-mono">{recipients.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Token:</span>
            <span>{formatToken(token)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Rate:</span>
            <span>{formatEther(ratePerSecond)} {formatToken(token)}/sec</span>
          </div>
        </div>

        {isActive && (
          <div className="flex gap-2 pt-2 border-t">
            {!isPaused ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePause}
                disabled={isPending}
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResume}
                disabled={isPending}
              >
                <Play className="h-4 w-4 mr-2" />
                Resume
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={handleCancel}
              disabled={isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

