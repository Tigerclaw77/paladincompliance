import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/paladin/admin/auth";
import {
  canAccessFeature,
  resolveOrganizationEntitlements,
} from "@/lib/paladin/entitlements/service";
import { logOperationalEvent } from "@/lib/paladin/logging";
import { getAbsoluteVerificationUrl } from "@/lib/paladin/siteUrl";
import { normalizeOrganizationSlug } from "@/lib/paladin/slugs";
import { generateVerificationQrAssetSvg } from "@/lib/paladin/qr";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type VerificationQrRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(
  request: NextRequest,
  { params }: VerificationQrRouteContext
) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { slug } = await params;
  const normalizedSlug = normalizeOrganizationSlug(slug);

  if (!normalizedSlug) {
    return NextResponse.json(
      { error: "Registry record not found." },
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
          memberships: {
            include: {
              user: true,
            },
          },
          subscription: true,
        },
      },
    },
  });

  if (!verificationPage) {
    return NextResponse.json(
      { error: "Registry record not found." },
      { status: 404 }
    );
  }

  const userEmail = session.user.email.trim().toLowerCase();
  const isMember = verificationPage.organization.memberships.some(
    (membership) => membership.user.email.toLowerCase() === userEmail
  );

  if (!isMember && !isAdminEmail(userEmail)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const entitlements = resolveOrganizationEntitlements({
    acquisitionIntent: verificationPage.organization.acquisitionIntent,
    subscription: verificationPage.organization.subscription,
  });

  if (!canAccessFeature(entitlements, "downloadableAssets")) {
    return NextResponse.json(
      { error: entitlements.features.downloadableAssets.message },
      { status: 403 }
    );
  }

  const verificationUrl = getAbsoluteVerificationUrl(
    verificationPage.slug,
    request
  );

  try {
    const svg = await generateVerificationQrAssetSvg({
      organizationName: verificationPage.organization.name,
      verificationUrl,
    });

    return new NextResponse(svg, {
      headers: {
        "Cache-Control": "private, max-age=0, must-revalidate",
        "Content-Disposition": `attachment; filename="${verificationPage.slug}-paladin-verification-qr.svg"`,
        "Content-Type": "image/svg+xml; charset=utf-8",
      },
    });
  } catch (error) {
    logOperationalEvent("error", "verification_qr_generation_failed", {
      error: error instanceof Error ? error.message : "Unknown QR error",
      slug: verificationPage.slug,
    });

    return NextResponse.json(
      { error: "Registry record QR could not be generated. Please try again." },
      { status: 503 }
    );
  }
}
