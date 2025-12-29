import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering (this route uses database)
export const dynamic = 'force-dynamic';

// GET /api/leaderboard
// Returns top users ordered by points (desc)
export async function GET() {
  try {
    const users = await prisma.userStats.findMany({
      orderBy: { points: "desc" },
      take: 50,
    });

    // Attach rank (1-based index)
    const ranked = users.map((u: typeof users[number], idx: number): {
      address: string;
      streamsCreated: number;
      withdrawalsClaimed: number;
      totalDeposited: string;
      totalWithdrawn: string;
      points: string;
      rank: number;
      updatedAt: Date;
    } => ({
      address: u.address,
      streamsCreated: u.streamsCreated,
      withdrawalsClaimed: u.withdrawalsClaimed,
      totalDeposited: u.totalDeposited.toString(),
      totalWithdrawn: u.totalWithdrawn.toString(),
      points: u.points.toString(),
      rank: idx + 1,
      updatedAt: u.updatedAt,
    }));

    return NextResponse.json(ranked);
  } catch (error) {
    console.error("Error in GET /api/leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to load leaderboard" },
      { status: 500 }
    );
  }
}


