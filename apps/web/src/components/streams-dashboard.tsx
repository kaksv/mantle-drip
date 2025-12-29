"use client";

import { useAccount } from "wagmi";
import { useAllUserStreams } from "@/lib/contracts";
import { StreamCardEnhanced } from "@/components/stream-card-enhanced";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Loader2 } from "lucide-react";
import { useMemo } from "react";

type StreamStatus = "active" | "paused" | "completed" | "cancelled";

interface Stream {
  streamId: bigint;
  sender: string;
  recipients: string[];
  token: string;
  deposit: bigint;
  startTime: bigint;
  endTime: bigint;
  status: number; // 0 = Pending, 1 = Active, 2 = Paused, 3 = Cancelled, 4 = Completed
  title: string;
  description: string;
  userRole?: "sender" | "recipient" | "both";
}

export function StreamsDashboard() {
  const { address, isConnected } = useAccount();
  const { streams, isLoading, error } = useAllUserStreams(address);

  const groupedStreams = useMemo(() => {
    // If no address or streams is undefined/null, return empty groups
    if (!address || !streams) return { active: [], paused: [], completed: [], cancelled: [] };
    
    // If streams is an empty array, return empty groups
    if (Array.isArray(streams) && streams.length === 0) {
      return { active: [], paused: [], completed: [], cancelled: [] };
    }

    const grouped: Record<StreamStatus, Stream[]> = {
      active: [],
      paused: [],
      completed: [],
      cancelled: [],
    };

    streams.forEach((stream: any) => {
      const status = stream.status;
      // Contract enum: 0 = Pending, 1 = Active, 2 = Paused, 3 = Cancelled, 4 = Completed
      if (status === 1) grouped.active.push(stream);
      else if (status === 2) grouped.paused.push(stream);
      else if (status === 4) grouped.completed.push(stream);
      else if (status === 3) grouped.cancelled.push(stream);
      // Note: status === 0 (Pending) streams are not shown in any group
    });

    return grouped;
  }, [streams, address]);

  if (!isConnected || !address) {
    return (
      <Card className="glass-card">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Please connect your wallet to view your streams
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading streams...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="glass-card">
        <CardContent className="pt-6">
          <p className="text-center text-destructive">
            Error loading streams: {error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalStreams = streams?.length || 0;
  const hasStreams = totalStreams > 0;

  if (!hasStreams) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground mb-4">No streams yet</p>
        <Button asChild variant="outline">
          <Link href="/streams/create">
            <Plus className="h-4 w-4 mr-2" />
            Create your first stream
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary Stats - DeFi Style */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="glass-card card-hover">
          <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
            <div className="text-xl md:text-2xl font-bold text-foreground">{totalStreams}</div>
            <div className="text-xs md:text-sm text-muted-foreground mt-1">Total Streams</div>
          </CardContent>
        </Card>
        <Card className="glass-card card-hover">
          <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
            <div className="text-xl md:text-2xl font-bold text-green">
              {groupedStreams.active.length}
            </div>
            <div className="text-xs md:text-sm text-muted-foreground mt-1">Active</div>
          </CardContent>
        </Card>
        <Card className="glass-card card-hover">
          <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
            <div className="text-xl md:text-2xl font-bold text-orange">
              {groupedStreams.paused.length}
            </div>
            <div className="text-xs md:text-sm text-muted-foreground mt-1">Paused</div>
          </CardContent>
        </Card>
        <Card className="glass-card card-hover">
          <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
            <div className="text-xl md:text-2xl font-bold text-muted-foreground">
              {groupedStreams.completed.length + groupedStreams.cancelled.length}
            </div>
            <div className="text-xs md:text-sm text-muted-foreground mt-1">Completed</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Streams */}
      {groupedStreams.active.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Active Streams</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-green">●</span>
              <span>{groupedStreams.active.length} Active</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupedStreams.active
              .filter((stream: any) => stream.streamId != null)
              .map((stream: any) => (
              <Link
                key={Number(stream.streamId)}
                href={`/streams/${stream.streamId.toString()}`}
                className="block w-full"
              >
                <StreamCardEnhanced
                  streamId={stream.streamId}
                  sender={stream.sender}
                  recipients={stream.recipients}
                  token={stream.token}
                  startTime={stream.startTime}
                  endTime={stream.endTime}
                  status={stream.status}
                  title={stream.title}
                  userRole={stream.userRole}
                />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Paused Streams */}
      {groupedStreams.paused.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Paused Streams</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-orange">●</span>
              <span>{groupedStreams.paused.length} Paused</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupedStreams.paused
              .filter((stream: any) => stream.streamId != null)
              .map((stream: any) => (
              <Link
                key={Number(stream.streamId)}
                href={`/streams/${stream.streamId.toString()}`}
                className="block"
              >
                <StreamCardEnhanced
                  streamId={stream.streamId}
                  sender={stream.sender}
                  recipients={stream.recipients}
                  token={stream.token}
                  startTime={stream.startTime}
                  endTime={stream.endTime}
                  status={stream.status}
                  title={stream.title}
                  userRole={stream.userRole}
                />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Completed/Cancelled Streams */}
      {(groupedStreams.completed.length > 0 || groupedStreams.cancelled.length > 0) && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Completed Streams</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>●</span>
              <span>{groupedStreams.completed.length + groupedStreams.cancelled.length} Completed</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...groupedStreams.completed, ...groupedStreams.cancelled]
              .filter((stream: any) => stream.streamId != null)
              .map((stream: any) => (
              <Link
                key={Number(stream.streamId)}
                href={`/streams/${stream.streamId.toString()}`}
                className="block w-full"
              >
                <StreamCardEnhanced
                  streamId={stream.streamId}
                  sender={stream.sender}
                  recipients={stream.recipients}
                  token={stream.token}
                  startTime={stream.startTime}
                  endTime={stream.endTime}
                  status={stream.status}
                  title={stream.title}
                  userRole={stream.userRole}
                />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

