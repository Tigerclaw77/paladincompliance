import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCurrentOrganizationForRoute } from "@/lib/paladin/routeOrganization";
import { resolveCoveragePlanSnapshot } from "@/lib/paladin/billing/coveragePlan";
import {
  canAccessFeature,
  resolveOrganizationEntitlements,
} from "@/lib/paladin/entitlements/service";
import { generateBinderPdf } from "@/lib/paladin/pdf/binder";
import { getAbsoluteVerificationUrl } from "@/lib/paladin/siteUrl";
import { getStatusLabel } from "@/lib/paladin/verification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Generates the 13-page quick-reference record on demand and streams it. Nothing
// is stored, so it works without a durable object store (production storage is
// otherwise unconfigured). Organization comes from the session only.
export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const organization = await getCurrentOrganizationForRoute(session.user.email);

  if (!organization) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const entitlements = resolveOrganizationEntitlements({
    acquisitionIntent: organization.acquisitionIntent,
    subscription: organization.subscription,
  });

  if (!canAccessFeature(entitlements, "binderPdfGeneration")) {
    return NextResponse.json(
      { error: entitlements.features.binderPdfGeneration.message },
      { status: 403 }
    );
  }

  const slug = organization.verificationPage?.slug ?? organization.slug;
  const pdf = await generateBinderPdf({
    organizationName: organization.name,
    subscriptionTier: resolveCoveragePlanSnapshot({
      acquisitionIntent: organization.acquisitionIntent,
      subscription: organization.subscription,
    }).label,
    verificationStatus: getStatusLabel(organization.verificationPage?.status ?? "draft"),
    verificationUrl: getAbsoluteVerificationUrl(slug),
  });
  const bytes = new Uint8Array(pdf.byteLength);

  bytes.set(pdf);

  return new NextResponse(bytes.buffer, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${slug.replace(/[^a-z0-9-]/gi, "")}-paladin-quick-reference-record.pdf"`,
      "Content-Type": "application/pdf",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
