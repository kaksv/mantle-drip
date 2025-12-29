"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LeaderboardEntry {
  address: string;
  streamsCreated: number;
  withdrawalsClaimed: number;
  totalDeposited: string;
  totalWithdrawn: string;
  points: string;
  rank: number;
  updatedAt: string;
}

interface UserStats {
  address: string;
  streamsCreated: number;
  withdrawalsClaimed: number;
  totalDeposited: string;
  totalWithdrawn: string;
  points: string;
  rank: number | null;
  updatedAt?: string;
}

export default function LeaderboardPage() {
  const { address } = useAccount();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/leaderboard", { cache: "no-store" });
        const data = await res.json();
        setEntries(Array.isArray(data) ? data : []);

        if (address) {
          const userRes = await fetch(
            `/api/leaderboard/user/${address}`,
            { cache: "no-store" }
          );
          const userData = await userRes.json();
          setUserStats(userData);
        } else {
          setUserStats(null);
        }
      } catch (e) {
        console.error("Failed to load leaderboard", e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [address]);

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Leaderboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            See who is most active creating and withdrawing from streams. Activity here
            earns points towards the daily rewards pool.
          </p>
        </div>
        {userStats && (
          <Card className="glass-card w-full md:w-auto card-hover border-green/40">
            <CardContent className="pt-4 pb-4 px-4 flex flex-col gap-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Your rank
              </p>
              <p className="text-3xl font-bold text-green leading-tight">
                {userStats.rank ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                Points: <span className="font-semibold text-foreground">{userStats.points}</span>
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="glass-card overflow-hidden">
        <CardHeader className="border-b border-white/10 bg-black/20">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-green shadow-[0_0_12px_rgba(16,185,129,0.9)]" />
            Top Users
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">
              Loading leaderboard...
            </div>
          ) : entries.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              No activity yet. Create a stream or withdraw from one to appear here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-black/40">
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3">Rank</th>
                    <th className="px-4 py-3">Address</th>
                    <th className="px-4 py-3 hidden md:table-cell">
                      Streams Created
                    </th>
                    <th className="px-4 py-3 hidden md:table-cell">
                      Withdrawals
                    </th>
                    <th className="px-4 py-3">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr
                      key={entry.address}
                      className="border-t border-border/40 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-semibold">
                        #{entry.rank}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs md:text-sm">
                        {entry.address.slice(0, 6)}...
                        {entry.address.slice(-4)}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {entry.streamsCreated}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {entry.withdrawalsClaimed}
                      </td>
                      <td className="px-4 py-3 font-semibold text-green">
                        {entry.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


