-- CreateTable
CREATE TABLE IF NOT EXISTS "SelfVerification" (
    "address" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "proofId" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "sessionId" TEXT,
    "disclosures" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SelfVerification_pkey" PRIMARY KEY ("address")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SelfVerification_isVerified_idx" ON "SelfVerification"("isVerified");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SelfVerification_verifiedAt_idx" ON "SelfVerification"("verifiedAt");
