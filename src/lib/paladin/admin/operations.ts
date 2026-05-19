import "server-only";

import { requireAdmin } from "@/lib/paladin/admin/auth";
import {
  createBinderPdfAsset,
  createVerificationQrPackManifestAsset,
} from "@/lib/paladin/assets";
import { resolveCoveragePlanSnapshot } from "@/lib/paladin/billing/coveragePlan";
import { logOperationalEvent } from "@/lib/paladin/logging";
import { getStatusLabel } from "@/lib/paladin/verification";
import { prisma } from "@/lib/prisma";

export async function adminSetVerificationStatus({
  organizationId,
  status,
}: {
  organizationId: string;
  status: "inactive" | "verified";
}) {
  const admin = await requireAdmin();

  const organization = await prisma.organization.findUnique({
    include: {
      verificationPage: true,
    },
    where: {
      id: organizationId,
    },
  });

  if (!organization) {
    return null;
  }

  const slug = organization.verificationPage?.slug ?? organization.slug;

  const verificationPage = await prisma.verificationPage.upsert({
    create: {
      organizationId: organization.id,
      publicTitle: organization.name,
      publishedAt: status === "verified" ? new Date() : null,
      slug,
      status,
    },
    update: {
      publishedAt: status === "verified" ? new Date() : null,
      status,
    },
    where: {
      organizationId: organization.id,
    },
  });

  logOperationalEvent("info", "admin_verification_status_updated", {
    adminEmail: admin.email,
    organizationId,
    status,
  });

  return verificationPage;
}

export async function adminRefreshVerificationAssets(organizationId: string) {
  const admin = await requireAdmin();

  const organization = await prisma.organization.findUnique({
    include: {
      verificationPage: true,
    },
    where: {
      id: organizationId,
    },
  });

  if (!organization) {
    return null;
  }

  const asset = await createVerificationQrPackManifestAsset({
    organizationId: organization.id,
    organizationName: organization.name,
    verificationSlug: organization.verificationPage?.slug ?? organization.slug,
  });

  logOperationalEvent("info", "admin_verification_assets_refreshed", {
    adminEmail: admin.email,
    assetId: asset.id,
    organizationId,
  });

  return asset;
}

export async function adminRegenerateBinder(organizationId: string) {
  const admin = await requireAdmin();

  const organization = await prisma.organization.findUnique({
    include: {
      acquisitionIntent: true,
      subscription: true,
      verificationPage: true,
    },
    where: {
      id: organizationId,
    },
  });

  if (!organization) {
    return null;
  }

  const asset = await createBinderPdfAsset({
    organizationId: organization.id,
    organizationName: organization.name,
    subscriptionTier: resolveCoveragePlanSnapshot({
      acquisitionIntent: organization.acquisitionIntent,
      subscription: organization.subscription,
    }).label,
    verificationSlug: organization.verificationPage?.slug ?? organization.slug,
    verificationStatus: getStatusLabel(organization.verificationPage?.status),
  });

  logOperationalEvent("info", "admin_binder_regenerated", {
    adminEmail: admin.email,
    assetId: asset.id,
    organizationId,
  });

  return asset;
}
