-- Additive migration: compliance calendar reminders, email opt-outs,
-- training acknowledgments and periodic review records. Create-only.

-- CreateTable
CREATE TABLE "ComplianceReminder" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "dueDate" DATE NOT NULL,
    "email" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailOptOut" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'reminders',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailOptOut_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingAcknowledgment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "moduleSlug" TEXT NOT NULL,
    "moduleVersion" TEXT NOT NULL,
    "personName" TEXT NOT NULL,
    "personEmail" TEXT NOT NULL DEFAULT '',
    "personRole" TEXT NOT NULL DEFAULT '',
    "acknowledgedOn" DATE NOT NULL,
    "recordedByUserId" TEXT,
    "selfAcknowledged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingAcknowledgment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "checklistKey" TEXT NOT NULL,
    "checklistVersion" TEXT NOT NULL,
    "reviewedOn" DATE NOT NULL,
    "reviewerName" TEXT NOT NULL,
    "itemsJson" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "recordedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceReminder_organizationId_eventKey_dueDate_email_key" ON "ComplianceReminder"("organizationId", "eventKey", "dueDate", "email");

-- CreateIndex
CREATE INDEX "ComplianceReminder_organizationId_idx" ON "ComplianceReminder"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailOptOut_email_key" ON "EmailOptOut"("email");

-- CreateIndex
CREATE INDEX "TrainingAcknowledgment_organizationId_moduleSlug_idx" ON "TrainingAcknowledgment"("organizationId", "moduleSlug");

-- CreateIndex
CREATE INDEX "ReviewRecord_organizationId_checklistKey_reviewedOn_idx" ON "ReviewRecord"("organizationId", "checklistKey", "reviewedOn");

-- AddForeignKey
ALTER TABLE "ComplianceReminder" ADD CONSTRAINT "ComplianceReminder_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingAcknowledgment" ADD CONSTRAINT "TrainingAcknowledgment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewRecord" ADD CONSTRAINT "ReviewRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
