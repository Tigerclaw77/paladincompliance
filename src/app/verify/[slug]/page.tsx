import type { Metadata } from "next";
import RegistryRecordView from "@/components/verification/RegistryRecordView";
import {
  getActiveModules,
  getVerificationId,
  getVerificationRevisionId,
  resolveVerificationLifecycle,
} from "@/lib/paladin/verification";
import { resolveCoveragePlanSnapshot } from "@/lib/paladin/billing/coveragePlan";
import { resolveOrganizationEntitlements } from "@/lib/paladin/entitlements/service";
import { getAbsoluteVerificationUrl } from "@/lib/paladin/siteUrl";
import { normalizeOrganizationSlug } from "@/lib/paladin/slugs";
import { prisma } from "@/lib/prisma";

const SITE_URL = "https://www.paladincompliance.com";

type VerifyPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: VerifyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const normalizedSlug = normalizeOrganizationSlug(slug);

  if (!normalizedSlug) {
    return {
      title: "Paladin Registry Record",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const verificationPage = await prisma.verificationPage.findUnique({
    include: {
      organization: {
        select: {
          name: true,
        },
      },
    },
    where: {
      slug: normalizedSlug,
    },
  });

  const organizationName = verificationPage?.organization.name;
  const title = organizationName
    ? organizationName === "Paladin Compliance"
      ? "Paladin Registry Record"
      : `${organizationName} Registry Record`
    : "Paladin Registry Record";
  const description = organizationName
    ? `Public registry record showing an AI Policy & Evidence Binder was issued to ${organizationName} by Paladin Compliance.`
    : "Public registry record of AI Policy & Evidence Binders issued by Paladin Compliance.";
  const verificationUrl = `${SITE_URL}/verify/${encodeURIComponent(
    normalizedSlug
  )}`;

  return {
    title,
    description,
    alternates: verificationPage
      ? {
          canonical: verificationUrl,
        }
      : undefined,
    openGraph: {
      description: organizationName
        ? `Public registry record showing a binder was issued to ${organizationName}. Documentation only; not a certification.`
        : "Public registry record of binders issued by Paladin Compliance. Documentation only; not a certification.",
      title: organizationName
        ? `${organizationName} | Paladin Registry Record`
        : "Paladin Registry Record",
      type: "website",
      url: verificationUrl,
    },
    robots: verificationPage
      ? undefined
      : {
          index: false,
          follow: false,
        },
    twitter: {
      title: `${title} | Paladin Compliance`,
      description,
    },
  };
}

export default async function VerifyPage({ params }: VerifyPageProps) {
  const { slug } = await params;
  const normalizedSlug = normalizeOrganizationSlug(slug);

  if (!normalizedSlug) {
    return <VerificationNotFound slug="unknown" />;
  }

  const verificationPage = await prisma.verificationPage.findUnique({
    where: {
      slug: normalizedSlug,
    },
    include: {
      organization: {
        include: {
          downloadableAssets: true,
          acquisitionIntent: true,
          subscription: true,
        },
      },
    },
  });

  if (!verificationPage) {
    return <VerificationNotFound slug={normalizedSlug} />;
  }

  const organization = verificationPage.organization;
  const entitlements = resolveOrganizationEntitlements({
    acquisitionIntent: organization.acquisitionIntent,
    subscription: organization.subscription,
  });
  const planSnapshot = resolveCoveragePlanSnapshot({
    acquisitionIntent: organization.acquisitionIntent,
    subscription: organization.subscription,
  });
  const publicVerificationStatus = entitlements.hasActiveSubscription
    ? verificationPage.status
    : getInactiveVerificationStatus(entitlements.status);
  const activeModules = getActiveModules(
    publicVerificationStatus,
    organization.subscription,
    organization.downloadableAssets,
    entitlements
  );
  const issueDate = verificationPage.publishedAt ?? verificationPage.createdAt;
  const activeThroughDate = organization.subscription?.currentPeriodEnd;
  const verificationUrl = getAbsoluteVerificationUrl(verificationPage.slug);
  const verificationId = getVerificationId({
    organizationId: organization.id,
    verificationPageId: verificationPage.id,
  });
  const revisionId = getVerificationRevisionId(verificationPage.updatedAt);
  const lifecycle = resolveVerificationLifecycle({
    currentPeriodEnd: activeThroughDate,
    subscriptionStatus: organization.subscription?.status,
    verificationStatus: publicVerificationStatus,
  });
  const certificateHref = `/api/verification-certificate/${verificationPage.slug}`;

  return (
    <RegistryRecordView
      activeModules={activeModules}
      activeThroughDate={activeThroughDate}
      recordDownloadHref={certificateHref}
      issueDate={issueDate}
      lifecycle={lifecycle}
      organizationName={organization.name}
      organizationSlug={organization.slug}
      planLabel={planSnapshot.label}
      planStatusLabel={entitlements.statusLabel}
      revisionId={revisionId}
      verificationId={verificationId}
      verificationUrl={verificationUrl}
    />
  );
}

function getInactiveVerificationStatus(status: string) {
  if (status === "past_due" || status === "unpaid") {
    return "pending_renewal";
  }

  return "inactive";
}

function VerificationNotFound({ slug }: { slug: string }) {
  return (
    <main className="verification-public-page min-h-[calc(100vh-8rem)] bg-slate-950 px-5 py-16 text-white">
      <section className="print-surface mx-auto max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900/88 shadow-[0_28px_90px_rgba(2,6,23,0.56)]">
        <div className="h-1 bg-gradient-to-r from-transparent via-slate-400 to-transparent" />
        <div className="p-7 text-center sm:p-10">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
            Paladin Compliance Registry
          </p>
          <h1 className="mt-5 text-3xl font-black text-white">
            Registry Record Not Found
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-300 print-muted">
            No Paladin Compliance registry record is associated with this
            public URL.
          </p>
          <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
            /verify/{slug || "unknown"}
          </div>
        </div>
      </section>
    </main>
  );
}
