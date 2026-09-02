import { NextResponse } from "next/server";
import { resolveOrganizationEntitlements } from "@/lib/paladin/entitlements/service";
import { generateVerificationCertificatePdf } from "@/lib/paladin/pdf/certificate";
import { getAbsoluteVerificationUrl } from "@/lib/paladin/siteUrl";
import { normalizeOrganizationSlug } from "@/lib/paladin/slugs";
import {
  getVerificationId,
  getVerificationRevisionId,
  resolveVerificationLifecycle,
} from "@/lib/paladin/verification";
import { prisma } from "@/lib/prisma";

type VerificationCertificateRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(
  request: Request,
  { params }: VerificationCertificateRouteContext
) {
  const { slug } = await params;
  const normalizedSlug = normalizeOrganizationSlug(slug);

  if (!normalizedSlug) {
    return NextResponse.json(
      { error: "Verification page not found." },
      { status: 404 }
    );
  }

  const verificationPage = await prisma.verificationPage.findUnique({
    where: {
      slug: normalizedSlug,
    },
    include: {
      organization: {
        include: {
          acquisitionIntent: true,
          subscription: true,
        },
      },
    },
  });

  if (!verificationPage) {
    return NextResponse.json(
      { error: "Verification page not found." },
      { status: 404 }
    );
  }

  const organization = verificationPage.organization;
  const entitlements = resolveOrganizationEntitlements({
    acquisitionIntent: organization.acquisitionIntent,
    subscription: organization.subscription,
  });
  const lifecycle = resolveVerificationLifecycle({
    currentPeriodEnd: organization.subscription?.currentPeriodEnd,
    subscriptionStatus: organization.subscription?.status,
    verificationStatus: verificationPage.status,
  });
  const verificationUrl = getAbsoluteVerificationUrl(
    verificationPage.slug,
    request
  );
  const verificationId = getVerificationId({
    organizationId: organization.id,
    verificationPageId: verificationPage.id,
  });
  const revisionId = getVerificationRevisionId(verificationPage.updatedAt);
  const pdf = await generateVerificationCertificatePdf({
    expirationDate: organization.subscription?.currentPeriodEnd,
    hipaaActive: entitlements.features.hipaaAddOn.allowed,
    issueDate: verificationPage.publishedAt ?? verificationPage.createdAt,
    organizationName: organization.name,
    revisionId,
    status: lifecycle.badgeLabel,
    verificationId,
    verificationUrl,
  });
  const responseBytes = new Uint8Array(pdf.byteLength);
  responseBytes.set(pdf);

  return new NextResponse(responseBytes, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${sanitizeFilename(
        organization.name
      )}-paladin-verification-certificate.pdf"`,
      "Content-Length": String(pdf.byteLength),
      "Content-Type": "application/pdf",
    },
  });
}

function sanitizeFilename(value: string) {
  const sanitized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return sanitized || "organization";
}
