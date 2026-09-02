import "server-only";

import { randomUUID } from "node:crypto";
import type { DownloadableAsset } from "@prisma/client";
import {
  canAccessFeature,
  resolveOrganizationEntitlements,
  type FeatureEntitlement,
} from "@/lib/paladin/entitlements/service";
import { logOperationalEvent } from "@/lib/paladin/logging";
import { generateBinderPdf } from "@/lib/paladin/pdf/binder";
import { getAbsoluteVerificationUrl } from "@/lib/paladin/siteUrl";
import { getStorageAdapter } from "@/lib/paladin/storage";
import { prisma } from "@/lib/prisma";

type SaveDownloadableAssetInput = {
  assetType: string;
  body: string | Uint8Array;
  description?: string;
  filename: string;
  mimeType: string;
  organizationId: string;
  title: string;
};

export class AssetStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssetStorageError";
  }
}

type AssetDownload = {
  asset: DownloadableAsset;
  body: Uint8Array;
  status: "ready";
};

type AssetDownloadResult =
  | AssetDownload
  | {
      locked: FeatureEntitlement;
      status: "locked";
    }
  | {
      status: "not_found";
    }
  | {
      asset: DownloadableAsset;
      status: "storage_missing";
    }
  | {
      asset: DownloadableAsset;
      status: "storage_error";
    };

export async function listOrganizationAssets(organizationId: string) {
  return prisma.downloadableAsset.findMany({
    orderBy: {
      createdAt: "desc",
    },
    where: {
      organizationId,
    },
  });
}

export async function saveDownloadableAsset({
  assetType,
  body,
  description,
  filename,
  mimeType,
  organizationId,
  title,
}: SaveDownloadableAssetInput) {
  const normalizedBody = normalizeBody(body);
  const normalizedFilename = sanitizeFilename(filename);
  const fileKey = buildAssetKey({
    filename: normalizedFilename,
    organizationId,
  });

  try {
    await getStorageAdapter().putObject({
      body: normalizedBody,
      contentType: mimeType,
      key: fileKey,
    });
  } catch (error) {
    logOperationalEvent("error", "asset_storage_write_failed", {
      error: error instanceof Error ? error.message : "Unknown storage error",
      organizationId,
    });

    throw new AssetStorageError("Asset storage is not currently available.");
  }

  return prisma.downloadableAsset.create({
    data: {
      assetType,
      description,
      fileKey,
      filename: normalizedFilename,
      mimeType,
      organizationId,
      sizeBytes: normalizedBody.byteLength,
      title,
    },
  });
}

export async function getAssetDownloadForMember({
  assetId,
  userEmail,
}: {
  assetId: string;
  userEmail: string;
}): Promise<AssetDownloadResult> {
  const asset = await prisma.downloadableAsset.findFirst({
    include: {
      organization: {
        include: {
          acquisitionIntent: true,
          subscription: true,
        },
      },
    },
    where: {
      id: assetId,
      organization: {
        memberships: {
          some: {
            user: {
              email: userEmail,
            },
          },
        },
      },
    },
  });

  if (!asset) {
    return {
      status: "not_found",
    };
  }

  const entitlements = resolveOrganizationEntitlements({
    acquisitionIntent: asset.organization.acquisitionIntent,
    subscription: asset.organization.subscription,
  });

  if (!canAccessFeature(entitlements, "downloadableAssets")) {
    return {
      locked: entitlements.features.downloadableAssets,
      status: "locked",
    };
  }

  let storedObject;

  try {
    storedObject = await getStorageAdapter().getObject(asset.fileKey);
  } catch (error) {
    logOperationalEvent("error", "asset_storage_read_failed", {
      assetId,
      error: error instanceof Error ? error.message : "Unknown storage error",
      organizationId: asset.organizationId,
    });

    return {
      asset,
      status: "storage_error",
    };
  }

  if (!storedObject) {
    logOperationalEvent("warn", "asset_storage_object_missing", {
      assetId,
      fileKey: asset.fileKey,
      organizationId: asset.organizationId,
    });

    return {
      asset,
      status: "storage_missing",
    };
  }

  return {
    asset,
    body: storedObject.body,
    status: "ready",
  };
}

export async function createVerificationQrPackManifestAsset({
  organizationId,
  organizationName,
  verificationSlug,
}: {
  organizationId: string;
  organizationName: string;
  verificationSlug: string;
}) {
  const generatedAt = new Date();
  const verificationUrl = getAbsoluteVerificationUrl(verificationSlug);
  const body = [
    "Paladin Compliance Verification QR Pack",
    "",
    `Organization: ${organizationName}`,
    `Verification URL: ${verificationUrl}`,
    `Generated: ${generatedAt.toISOString()}`,
    "",
    "This manifest records the current verification QR asset context for binder and vendor review packets.",
    "Additional QR exports can be generated from this record when needed for printed materials.",
  ].join("\n");

  return saveDownloadableAsset({
    assetType: "QR_PACK",
    body,
    description:
      "Verification QR pack manifest for binder and vendor review packets.",
    filename: `${verificationSlug}-verification-qr-pack.txt`,
    mimeType: "text/plain; charset=utf-8",
    organizationId,
    title: "Verification QR Pack Manifest",
  });
}

export async function createBinderPdfAsset({
  organizationId,
  organizationName,
  subscriptionTier,
  verificationSlug,
  verificationStatus,
}: {
  organizationId: string;
  organizationName: string;
  subscriptionTier: string;
  verificationSlug: string;
  verificationStatus: string;
}) {
  const verificationUrl = getAbsoluteVerificationUrl(verificationSlug);
  const pdfBytes = await generateBinderPdf({
    organizationName,
    subscriptionTier,
    verificationStatus,
    verificationUrl,
  });

  return saveDownloadableAsset({
    assetType: "BINDER_PDF",
    body: pdfBytes,
    description:
      "AI governance binder generated from organization and verification records.",
    filename: `${verificationSlug}-paladin-binder.pdf`,
    mimeType: "application/pdf",
    organizationId,
    title: "Paladin Compliance Binder PDF",
  });
}

export function getAssetDownloadFilename(
  asset: Pick<DownloadableAsset, "filename" | "title">
) {
  return asset.filename || `${sanitizeFilename(asset.title)}.txt`;
}

function normalizeBody(body: string | Uint8Array) {
  if (typeof body === "string") {
    return new TextEncoder().encode(body);
  }

  return body;
}

function buildAssetKey({
  filename,
  organizationId,
}: {
  filename: string;
  organizationId: string;
}) {
  return `organizations/${organizationId}/assets/${randomUUID()}-${filename}`;
}

function sanitizeFilename(filename: string) {
  const normalizedFilename = filename
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalizedFilename || "paladin-asset.txt";
}
