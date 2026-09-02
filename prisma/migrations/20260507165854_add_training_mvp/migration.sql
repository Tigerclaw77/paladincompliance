-- CreateTable
CREATE TABLE "TrainingModule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    CONSTRAINT "TrainingModule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TrainingCompletion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "certificateAssetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "moduleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "TrainingCompletion_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "TrainingModule" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TrainingModule_organizationId_idx" ON "TrainingModule"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingModule_organizationId_slug_key" ON "TrainingModule"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "TrainingCompletion_moduleId_idx" ON "TrainingCompletion"("moduleId");

-- CreateIndex
CREATE INDEX "TrainingCompletion_userId_idx" ON "TrainingCompletion"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingCompletion_userId_moduleId_key" ON "TrainingCompletion"("userId", "moduleId");
