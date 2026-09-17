-- CreateEnum (idempotent: the type may already exist from a prior db push)
DO $$ BEGIN
  CREATE TYPE "Plan" AS ENUM ('FREE', 'PRO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT,
  ADD COLUMN IF NOT EXISTS "subscriptionId" TEXT,
  ADD COLUMN IF NOT EXISTS "plan" "Plan" NOT NULL DEFAULT 'FREE',
  ADD COLUMN IF NOT EXISTS "planStatus" TEXT NOT NULL DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS "planRenewsAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "FormBlock" ADD COLUMN IF NOT EXISTS "logic" JSONB;

-- AlterEnum
ALTER TYPE "BlockType" ADD VALUE IF NOT EXISTS 'RATING';
ALTER TYPE "BlockType" ADD VALUE IF NOT EXISTS 'DIVIDER';
ALTER TYPE "BlockType" ADD VALUE IF NOT EXISTS 'H3';
