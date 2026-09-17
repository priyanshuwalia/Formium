-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'PRO');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "subscriptionId" TEXT,
ADD COLUMN     "plan" "Plan" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "planStatus" TEXT NOT NULL DEFAULT 'inactive',
ADD COLUMN     "planRenewsAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "FormBlock" ADD COLUMN     "logic" JSONB;

-- AlterEnum
ALTER TYPE "BlockType" ADD VALUE 'RATING';
ALTER TYPE "BlockType" ADD VALUE 'DIVIDER';
ALTER TYPE "BlockType" ADD VALUE 'H3';
