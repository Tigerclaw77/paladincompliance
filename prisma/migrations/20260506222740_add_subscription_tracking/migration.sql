-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN "planName" TEXT;
ALTER TABLE "Subscription" ADD COLUMN "billingInterval" TEXT;
ALTER TABLE "Subscription" ADD COLUMN "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Subscription" ADD COLUMN "currentPeriodStart" TIMESTAMP(3);
ALTER TABLE "Subscription" ADD COLUMN "trialEndsAt" TIMESTAMP(3);
ALTER TABLE "Subscription" ADD COLUMN "canceledAt" TIMESTAMP(3);
