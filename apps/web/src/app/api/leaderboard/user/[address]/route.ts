import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: { address: string };
}

// Force dynamic rendering (this route uses database and dynamic params)
export const dynamic = 'force-dynamic';

// GET /api/leaderboard/user/[address]
// Returns stats and rank for a specific user
export async function GET(
  _req: NextRequest,
  { params }: RouteContext
) {
  try {
    const address = params.address?.toLowerCase();

    if (!address || !address.startsWith("0x") || address.length !== 42) {
      return NextResponse.json(
        { error: "Invalid address" },
        { status: 400 }
      );
    }

    const user = await prisma.userStats.findUnique({
      where: { address },
    });

    if (!user) {
      return NextResponse.json(
        {
          address,
          streamsCreated: 0,
          withdrawalsClaimed: 0,
          totalDeposited: "0",
          totalWithdrawn: "0",
          points: "0",
          rank: null,
        },
        { status: 200 }
      );
    }

    // Compute rank: count users with strictly higher points
    const higherCount = await prisma.userStats.count({
      where: {
        points: {
          gt: user.points,
        },
      },
    });

    const rank = higherCount + 1;

    return NextResponse.json({
      address: user.address,
      streamsCreated: user.streamsCreated,
      withdrawalsClaimed: user.withdrawalsClaimed,
      totalDeposited: user.totalDeposited.toString(),
      totalWithdrawn: user.totalWithdrawn.toString(),
      points: user.points.toString(),
      rank,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error("Error in GET /api/leaderboard/user/[address]:", error);
    return NextResponse.json(
      { error: "Failed to load user leaderboard stats" },
      { status: 500 }
    );
  }
}


