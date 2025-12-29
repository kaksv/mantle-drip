import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/self/verify/status
 * Get verification status for a user or session
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    const sessionId = url.searchParams.get("sessionId");

    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: "Missing userId or sessionId parameter" },
        { status: 400 }
      );
    }

    let verification;
    if (userId) {
      verification = await prisma.selfVerification.findUnique({
        where: { address: userId.toLowerCase() },
      });
    } else if (sessionId) {
      verification = await prisma.selfVerification.findFirst({
        where: { sessionId },
      });
    }

    if (!verification) {
      return NextResponse.json({
        verified: false,
        isVerified: false,
      });
    }

    return NextResponse.json({
      verified: verification.isVerified,
      isVerified: verification.isVerified,
      proofId: verification.proofId,
      verifiedAt: verification.verifiedAt?.toISOString(),
      disclosures: verification.disclosures,
      metadata: verification.metadata,
    });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

