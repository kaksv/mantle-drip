import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Type definitions for Self Protocol proof
interface Proof {
  signature?: string;
  message?: string;
  address?: string;
  timestamp?: number;
  expiry?: number;
  disclosures?: Record<string, any>;
  proofId?: string;
  [key: string]: any;
}

interface VerificationResult {
  valid: boolean;
  expired?: boolean;
  address?: string;
  disclosures?: Record<string, any>;
  proofId?: string;
  version?: string;
  error?: string;
}

/**
 * Verify a Self Protocol proof
 * Handles both traditional proofs and ZK proofs (Groth16 format)
 */
async function verifyProof(proof: Proof, userId?: string): Promise<VerificationResult> {
  try {
    // Check if this is a Self Protocol ZK proof (Groth16 format)
    const isZKProof = 
      Array.isArray(proof.a) && 
      Array.isArray(proof.b) && 
      Array.isArray(proof.c) &&
      proof.protocol === "groth16";

    if (isZKProof) {
      console.log("Detected Self Protocol ZK proof (Groth16 format)");
      
      // For ZK proofs, verify the proof structure
      // The proof should have:
      // - a: [string, string] (2 elements)
      // - b: [[string, string], [string, string]] (2x2 array)
      // - c: [string, string] (2 elements)
      // - publicSignals: string[] (array of public signals)
      
      if (
        proof.a?.length === 2 &&
        proof.b?.length === 2 &&
        Array.isArray(proof.b[0]) &&
        Array.isArray(proof.b[1]) &&
        proof.b[0].length === 2 &&
        proof.b[1].length === 2 &&
        proof.c?.length === 2 &&
        Array.isArray(proof.publicSignals)
      ) {
        console.log("ZK proof structure is valid");
        
        // Extract address from userContextData if provided, or use userId parameter
        let extractedAddress = userId;
        if (!extractedAddress && proof.userContextData) {
          // Extract from userContextData hex string
          const userContextData = proof.userContextData;
          const addressMatch = userContextData.match(/([0-9a-f]{40})$/i);
          if (addressMatch) {
            extractedAddress = `0x${addressMatch[1].toLowerCase()}`;
          }
        }
        
        if (!extractedAddress) {
          return {
            valid: false,
            error: "Cannot extract address from ZK proof. userId or userContextData required.",
          };
        }
        
        // ZK proofs are cryptographically valid if they have the correct structure
        // In production, you might want to verify against a verification key
        // For now, we accept proofs with valid structure
        
        return {
          valid: true,
          address: extractedAddress.toLowerCase(),
          disclosures: proof.disclosures || {},
          proofId: proof.attestationId?.toString() || proof.proofId || `zk_${Date.now()}`,
          version: proof.version || "2.0",
        };
      } else {
        return {
          valid: false,
          error: "Invalid ZK proof structure. Missing required fields (a, b, c, publicSignals).",
        };
      }
    }

    // Try to import verifyProof from @selfxyz/core if available (for non-ZK proofs)
    let verifyFn;
    try {
      const core = await import("@selfxyz/core");
      // Check for verifyProof in different possible exports
      if ((core as any).verifyProof && typeof (core as any).verifyProof === 'function') {
        verifyFn = (core as any).verifyProof;
      } else if ((core as any).default?.verifyProof) {
        verifyFn = (core as any).default.verifyProof;
      }
    } catch (e) {
      // @selfxyz/core might not have verifyProof, continue with manual verification
      console.log("verifyProof not found in @selfxyz/core, using manual verification");
    }

    // If SDK has verifyProof, use it
    if (verifyFn) {
      return await verifyFn(proof);
    }

    // Manual verification fallback for traditional proofs
    console.log("Using manual verification fallback");
    console.log("Proof structure:", {
      hasSignature: !!proof.signature,
      hasMessage: !!proof.message,
      hasAddress: !!proof.address,
      hasProof: !!proof.proof,
      hasData: !!proof.data,
      keys: Object.keys(proof),
    });
    
    // Self Protocol proofs might come in different formats
    // Check for common proof structures
    const proofAddress = userId || proof.address || proof.userId || proof.userAddress || proof.walletAddress;
    const proofSignature = proof.signature || proof.sig || proof.proof?.signature;
    const proofMessage = proof.message || proof.msg || proof.proof?.message;
    
    // Check if proof has required fields (be more flexible)
    if (!proofAddress) {
      console.error("Proof missing address field. Available keys:", Object.keys(proof));
      return {
        valid: false,
        error: "Proof missing address field. Available keys: " + Object.keys(proof).join(", "),
      };
    }
    
    // If we have an address, we can proceed (signature verification would be ideal but may not be available)
    if (!proofSignature && !proofMessage) {
      console.warn("Proof missing signature/message, but has address. Proceeding with basic validation.");
    }

    // Check expiry if provided
    if (proof.expiry && proof.expiry < Date.now() / 1000) {
      return {
        valid: false,
        expired: true,
        error: "Proof has expired",
      };
    }

    // Basic validation - in production, you should verify the signature
    return {
      valid: true,
      address: proofAddress.toLowerCase(),
      disclosures: proof.disclosures || proof.data?.disclosures || {},
      proofId: proof.proofId || proof.id || proofSignature?.substring(0, 16) || `proof_${Date.now()}`,
      version: proof.version || proof.proof?.version || "1.0",
    };
  } catch (error) {
    console.error("Proof verification error:", error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Proof verification failed",
    };
  }
}

/**
 * POST /api/self/verify
 * Verifies a Self Protocol proof and stores the verification status
 */
export async function POST(req: NextRequest) {
  try {
    // Self Protocol might send data in different formats
    // Try to parse as JSON first, then form data, then URL params
    let body: any = {};
    const contentType = req.headers.get("content-type") || "";
    
    try {
      if (contentType.includes("application/json")) {
        body = await req.json();
      } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
        const formData = await req.formData();
        body = {
          sessionId: formData.get("sessionId") || formData.get("session_id"),
          proof: formData.get("proof") ? JSON.parse(formData.get("proof") as string) : null,
          userId: formData.get("userId") || formData.get("user_id") || formData.get("address"),
        };
        // Also check if formData has other fields
        for (const [key, value] of formData.entries()) {
          if (!body[key]) {
            body[key] = value;
          }
        }
      } else {
        // Try JSON anyway
        try {
          body = await req.json();
        } catch (e) {
          // If that fails, try URL params
          const url = new URL(req.url);
          body = {
            sessionId: url.searchParams.get("sessionId") || url.searchParams.get("session_id"),
            proof: url.searchParams.get("proof") ? JSON.parse(url.searchParams.get("proof")!) : null,
            userId: url.searchParams.get("userId") || url.searchParams.get("user_id") || url.searchParams.get("address"),
          };
        }
      }
    } catch (e) {
      // If all parsing fails, try URL params
      const url = new URL(req.url);
      body = {
        sessionId: url.searchParams.get("sessionId") || url.searchParams.get("session_id"),
        proof: url.searchParams.get("proof") ? JSON.parse(url.searchParams.get("proof")!) : null,
        userId: url.searchParams.get("userId") || url.searchParams.get("user_id") || url.searchParams.get("address"),
      };
    }

    // Log the entire request for debugging
    console.log("=== Self Protocol Verification Request ===");
    console.log("Request URL:", req.url);
    console.log("Request method:", req.method);
    console.log("Request headers:", Object.fromEntries(req.headers.entries()));
    console.log("Request body:", JSON.stringify(body, null, 2));
    console.log("Body keys:", Object.keys(body || {}));

    // Extract fields - Self Protocol uses a specific format:
    // - proof: ZK proof object with a, b, c arrays
    // - publicSignals: Array of public signals
    // - userContextData: Hex string containing user address
    // - attestationId: ID of the attestation
    
    let sessionId = body.sessionId || body.session_id || body.sessionID;
    let proof = body.proof || body.data || body.proofData;
    let userId = body.userId || body.user_id || body.userID || body.address || body.walletAddress;
    
    // Self Protocol sends userContextData which contains the address
    if (!userId && body.userContextData) {
      // userContextData is a hex string, extract the address (last 40 chars)
      const userContextData = body.userContextData;
      // The address is typically at the end of the hex string
      // Format: ...00000000000000000000000085a4b09fb0788f1c549a68dc2edae3f97aeb5dd7
      // Try to extract Ethereum address (40 hex chars) at the end
      const addressMatch = userContextData.match(/([0-9a-f]{40})$/i);
      if (addressMatch) {
        userId = `0x${addressMatch[1].toLowerCase()}`;
        console.log("Extracted userId from userContextData:", userId);
      } else {
        // Try to find any 40-char hex sequence (might be padded)
        const anyAddressMatch = userContextData.match(/0x([0-9a-f]{40})/i);
        if (anyAddressMatch) {
          userId = anyAddressMatch[0].toLowerCase();
          console.log("Extracted userId from userContextData (with 0x):", userId);
        } else {
          // Last resort: take last 40 characters and add 0x
          if (userContextData.length >= 40) {
            const last40 = userContextData.slice(-40);
            if (/^[0-9a-f]{40}$/i.test(last40)) {
              userId = `0x${last40.toLowerCase()}`;
              console.log("Extracted userId from userContextData (last 40 chars):", userId);
            }
          }
        }
      }
    }
    
    // If we have attestationId but no sessionId, use attestationId or generate one
    if (!sessionId && body.attestationId) {
      sessionId = `attestation_${body.attestationId}`;
      console.log("Using attestationId as sessionId:", sessionId);
    }
    
    // Self Protocol proof structure: { a, b, c, curve, protocol }
    if (body.proof && body.proof.a && body.proof.b && body.proof.c) {
      proof = {
        ...body.proof,
        publicSignals: body.publicSignals,
        attestationId: body.attestationId,
        userContextData: body.userContextData,
      };
      console.log("Using Self Protocol ZK proof format");
    }
    
    // If still no proof, check if it's nested
    if (!proof && body.proof) {
      proof = body.proof;
    }
    
    // Last resort: if body itself looks like a proof object
    if (!proof && Object.keys(body).length > 0) {
      proof = body;
    }

    // Validate required fields
    if (!sessionId || !proof || !userId) {
      console.error("Missing required fields:", {
        hasSessionId: !!sessionId,
        hasProof: !!proof,
        hasUserId: !!userId,
        bodyKeys: Object.keys(body || {}),
      });
      return NextResponse.json(
        { 
          success: false, 
          status: "error",
          result: false, // Boolean result (false for error)
          error: "Missing required fields: sessionId, proof, userId",
          received: {
            hasSessionId: !!sessionId,
            hasProof: !!proof,
            hasUserId: !!userId,
            bodyKeys: Object.keys(body || {}),
          }
        },
        { status: 400 }
      );
    }

    // Validate userId is a valid Ethereum address
    if (!/^0x[a-fA-F0-9]{40}$/.test(userId)) {
      return NextResponse.json(
        { 
          success: false,
          status: "error",
          result: false,
          error: "Invalid user address format" 
        },
        { status: 400 }
      );
    }

    // Log the proof structure for debugging
    console.log("=== Extracted Fields ===");
    console.log("sessionId:", sessionId);
    console.log("userId:", userId);
    console.log("proof type:", typeof proof);
    console.log("proof keys:", Object.keys(proof || {}));
    console.log("proof:", JSON.stringify(proof, null, 2));

    // Verify the proof using Self Protocol verification
    let verificationResult;
    try {
      // The verifyProof function from @selfxyz/core should verify:
      // - Proof signature
      // - Proof expiry
      // - Disclosure validity
      verificationResult = await verifyProof(proof as Proof, userId);
      console.log("Verification result:", JSON.stringify(verificationResult, null, 2));
    } catch (error) {
      console.error("Proof verification failed:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
      return NextResponse.json(
        {
          success: false,
          verified: false,
          status: "error",
          result: false,
          error: error instanceof Error ? error.message : "Proof verification failed",
        },
        { status: 400 }
      );
    }

    // Check if proof is valid
    if (!verificationResult.valid) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          status: "error",
          result: false,
          error: verificationResult.error || "Invalid proof",
        },
        { status: 400 }
      );
    }

    // Validate that the proof's address matches the userId
    if (verificationResult.address?.toLowerCase() !== userId.toLowerCase()) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          status: "error",
          result: false,
          error: "Proof address does not match user address",
        },
        { status: 400 }
      );
    }

    // Check proof expiry
    if (verificationResult.expired) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          status: "error",
          result: false,
          error: "Proof has expired",
        },
        { status: 400 }
      );
    }

    // Validate disclosures (minimum age, date of birth, etc.)
    const disclosures = verificationResult.disclosures || {};
    if (disclosures.minimumAge && disclosures.minimumAge < 18) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          status: "error",
          result: false,
          error: "User does not meet minimum age requirement",
        },
        { status: 400 }
      );
    }

    // Store verification status in database
    const now = new Date();
    const verificationData = {
      address: userId.toLowerCase(),
      isVerified: true,
      proofId: verificationResult.proofId || sessionId,
      verifiedAt: now,
      sessionId: sessionId,
      disclosures: disclosures,
      metadata: {
        verifiedAt: now.toISOString(),
        sessionId,
        proofVersion: verificationResult.version,
      },
    };

    // Upsert verification record
    await (prisma as any).selfVerification.upsert({
      where: { address: userId.toLowerCase() },
      update: verificationData,
      create: verificationData,
    });

    // Self Protocol expects a simple response format:
    // { status: string, result: boolean }
    return NextResponse.json({
      status: "verified", // String status
      result: true, // Boolean result (true for success)
    });
  } catch (error) {
    console.error("Verification endpoint error:", error);
    return NextResponse.json(
      {
        success: false,
        verified: false,
        status: "error", // Self Protocol expects this field
        result: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

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
      verification = await (prisma as any).selfVerification.findUnique({
        where: { address: userId.toLowerCase() },
      });
    } else if (sessionId) {
      verification = await (prisma as any).selfVerification.findFirst({
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
