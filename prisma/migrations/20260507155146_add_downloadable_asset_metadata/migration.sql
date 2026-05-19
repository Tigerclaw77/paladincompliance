-- AlterTable
ALTER TABLE "DownloadableAsset" ADD COLUMN "filename" TEXT NOT NULL DEFAULT '';
ALTER TABLE "DownloadableAsset" ADD COLUMN "mimeType" TEXT NOT NULL DEFAULT 'application/octet-stream';
ALTER TABLE "DownloadableAsset" ADD COLUMN "sizeBytes" INTEGER NOT NULL DEFAULT 0;
