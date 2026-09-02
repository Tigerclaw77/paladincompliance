-- CreateTable
CREATE TYPE "PlanTier" AS ENUM ('STARTER', 'GROWTH', 'ENTERPRISE');
CREATE TYPE "BillingInterval" AS ENUM ('MONTH', 'YEAR');

-- CreateTable
CREATE TABLE "AcquisitionIntent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plan" "PlanTier" NOT NULL,
    "billingInterval" "BillingInterval" NOT NULL DEFAULT 'YEAR',
    "industry" TEXT NOT NULL,
    "hipaaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "teamSize" TEXT,
    "employeeCount" INTEGER,
    "locationCount" INTEGER,
    "estimatedAnnualCents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    CONSTRAINT "AcquisitionIntent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AcquisitionIntent_organizationId_key" ON "AcquisitionIntent"("organizationId");
