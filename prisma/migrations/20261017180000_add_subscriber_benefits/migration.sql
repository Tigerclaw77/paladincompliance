-- CreateTable
CREATE TABLE "BinderRevision" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "changes" TEXT NOT NULL DEFAULT '',
    "releasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BinderRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BinderRevisionNotice" (
    "id" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BinderRevisionNotice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RenewalReminder" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RenewalReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiSpendEntry" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "entryDate" DATE NOT NULL,
    "category" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "recurrence" TEXT NOT NULL DEFAULT 'One-time',
    "reference" TEXT NOT NULL DEFAULT '',
    "approvedBy" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiSpendEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BinderRevision_version_key" ON "BinderRevision"("version");

-- CreateIndex
CREATE INDEX "BinderRevisionNotice_organizationId_idx" ON "BinderRevisionNotice"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "BinderRevisionNotice_revisionId_email_key" ON "BinderRevisionNotice"("revisionId", "email");

-- CreateIndex
CREATE INDEX "RenewalReminder_organizationId_idx" ON "RenewalReminder"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "RenewalReminder_subscriptionId_periodEnd_email_key" ON "RenewalReminder"("subscriptionId", "periodEnd", "email");

-- CreateIndex
CREATE INDEX "AiSpendEntry_organizationId_entryDate_idx" ON "AiSpendEntry"("organizationId", "entryDate");

-- CreateIndex
CREATE UNIQUE INDEX "AiSpendEntry_organizationId_clientId_key" ON "AiSpendEntry"("organizationId", "clientId");

-- AddForeignKey
ALTER TABLE "BinderRevisionNotice" ADD CONSTRAINT "BinderRevisionNotice_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "BinderRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiSpendEntry" ADD CONSTRAINT "AiSpendEntry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

