-- Phase 0: trust & security
-- Hand-written and idempotent (matches the earlier billing_and_logic migration)
-- so it can be applied to partially consistent Neon state.

-- AlterTable: User gains email verification state
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: Session (rotating refresh-token sessions)
CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AiUsage (monthly AI analysis quota counters)
CREATE TABLE IF NOT EXISTS "AiUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable: RateLimiterFlexible (Postgres-backed fixed-window rate limits)
CREATE TABLE IF NOT EXISTS "RateLimiterFlexible" (
    "key" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "expire" TIMESTAMP(3),

    CONSTRAINT "RateLimiterFlexible_pkey" PRIMARY KEY ("key")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");
CREATE INDEX IF NOT EXISTS "AiUsage_userId_createdAt_idx" ON "AiUsage"("userId", "createdAt");

-- Foreign keys
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiUsage" ADD CONSTRAINT "AiUsage_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiUsage" ADD CONSTRAINT "AiUsage_formId_fkey"
  FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop the unused MULTI_SELE block type. Remap any legacy rows first so the
-- enum value is no longer referenced, then rebuild the enum without it.
-- Postgres has no `ALTER TYPE ... DROP VALUE`, so the type is recreated.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type JOIN pg_enum ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'BlockType' AND pg_enum.enumlabel = 'MULTI_SELE') THEN
    UPDATE "FormBlock" SET "type" = 'MULT_CHOICE' WHERE "type" = 'MULTI_SELE';

    CREATE TYPE "BlockType_new" AS ENUM ('SHORT_ANS', 'LONG_ANS', 'MULT_CHOICE', 'CHECKBOXES', 'DROPDOWN', 'NUM', 'EMAIL', 'PHONE_NUM', 'LINK', 'FILE_UPLOAD', 'DATE', 'RATING', 'DIVIDER', 'H3');
    ALTER TABLE "FormBlock" ALTER COLUMN "type" TYPE "BlockType_new" USING ("type"::text::"BlockType_new");
    DROP TYPE "BlockType";
    ALTER TYPE "BlockType_new" RENAME TO "BlockType";
  END IF;
END $$;