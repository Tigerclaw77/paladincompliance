import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import LockedFeature from "@/components/entitlements/LockedFeature";
import SubscriptionEntitlementBadge from "@/components/entitlements/SubscriptionEntitlementBadge";
import VerificationQrCard from "@/components/verification/VerificationQrCard";
import { getCurrentOrganization } from "@/lib/paladin/currentOrganization";
import {
  canAccessFeature,
  resolveOrganizationEntitlements,
} from "@/lib/paladin/entitlements/service";
import { getAbsoluteVerificationUrl } from "@/lib/paladin/siteUrl";
import {
  appendNumericSlugSuffix,
  isValidOrganizationSlug,
  normalizeOrganizationSlug,
} from "@/lib/paladin/slugs";
import { prisma } from "@/lib/prisma";

type SettingsPageProps = {
  searchParams: Promise<{
    error?: string;
    saved?: string;
  }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const { organization } = await getCurrentOrganization();
  const entitlements = resolveOrganizationEntitlements({
    acquisitionIntent: organization.acquisitionIntent,
    subscription: organization.subscription,
  });
  const downloadsEnabled = canAccessFeature(entitlements, "downloadableAssets");
  const verificationSlug = organization.verificationPage?.slug ?? organization.slug;
  const verificationUrl = getAbsoluteVerificationUrl(verificationSlug);
  const params = await searchParams;
  const errorMessage = getErrorMessage(params.error);
  const savedMessage =
    params.saved === "true" ? "Organization settings updated." : "";

  return (
    <div className="grid gap-6">
      <header className="rounded-2xl border border-white/10 bg-slate-900/88 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.38)] sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200">
          Organization Settings
        </p>
        <div className="mt-4 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Workspace identity
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
              Keep the organization name and public registry record slug consistent
              across binders, customer packets, and stakeholder-facing
              references.
            </p>
          </div>
          <SubscriptionEntitlementBadge entitlements={entitlements} />
        </div>
      </header>

      <section className="rounded-2xl border border-white/10 bg-slate-900/90 p-6 shadow-[0_22px_70px_rgba(2,6,23,0.34)]">
        <form action={updateOrganizationSettings} className="grid gap-5">
          <input name="organizationId" type="hidden" value={organization.id} />

          <label className="grid gap-2 text-sm font-semibold text-slate-200">
            Organization name
            <input
              className="h-12 rounded-lg border border-white/10 bg-slate-950/70 px-4 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/25"
              defaultValue={organization.name}
              maxLength={96}
              name="name"
              required
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-200">
            Registry record slug
            <input
              className="h-12 rounded-lg border border-white/10 bg-slate-950/70 px-4 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/25"
              defaultValue={verificationSlug}
              maxLength={64}
              name="slug"
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              required
            />
            <span className="text-xs font-medium leading-5 text-slate-500">
              This becomes your public registry record URL.
            </span>
          </label>

          {savedMessage && (
            <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
              {savedMessage}
            </div>
          )}

          {errorMessage && (
            <div className="rounded-lg border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-100">
              {errorMessage}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-slate-400">
              Public verification URL: /verify/{verificationSlug}
            </p>
            <button
              className="h-12 rounded-lg border border-blue-300/20 bg-gradient-to-r from-blue-700 to-blue-500 px-5 text-sm font-black text-white shadow-[0_14px_32px_rgba(37,99,235,0.24)] transition hover:from-blue-600 hover:to-blue-400"
              type="submit"
            >
              Save Settings
            </button>
          </div>
        </form>
      </section>

      {!downloadsEnabled && (
        <LockedFeature
          entitlement={entitlements.features.downloadableAssets}
          title="QR assets become available after activation"
        />
      )}

      <VerificationQrCard
        downloadHref={`/api/verification-qr/${verificationSlug}`}
        organizationName={organization.name}
        showDownload={downloadsEnabled}
        verificationUrl={verificationUrl}
      />
    </div>
  );
}

async function updateOrganizationSettings(formData: FormData) {
  "use server";

  const { organization } = await getCurrentOrganization();
  const organizationId = getString(formData, "organizationId");
  const name = getString(formData, "name");
  const baseSlug = normalizeOrganizationSlug(getString(formData, "slug"));

  if (organizationId !== organization.id) {
    redirect("/dashboard/settings?error=unauthorized");
  }

  if (!isValidOrganizationName(name) || !isValidOrganizationSlug(baseSlug)) {
    redirect("/dashboard/settings?error=invalid");
  }

  const slug = await getUniqueEditableOrganizationSlug(baseSlug, organization.id);

  try {
    await prisma.$transaction([
      prisma.organization.update({
        where: {
          id: organization.id,
        },
        data: {
          name,
          slug,
        },
      }),
      prisma.verificationPage.upsert({
        where: {
          organizationId: organization.id,
        },
        create: {
          organizationId: organization.id,
          publicTitle: name,
          slug,
          status: "draft",
        },
        update: {
          publicTitle: name,
          slug,
        },
      }),
    ]);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      redirect("/dashboard/settings?error=slug");
    }

    throw error;
  }

  redirect("/dashboard/settings?saved=true");
}

async function getUniqueEditableOrganizationSlug(
  baseSlug: string,
  organizationId: string
) {
  for (let suffix = 1; suffix <= 999; suffix += 1) {
    const candidate = appendNumericSlugSuffix(baseSlug, suffix);
    const [organization, verificationPage] = await prisma.$transaction([
      prisma.organization.findUnique({
        where: { slug: candidate },
        select: { id: true },
      }),
      prisma.verificationPage.findUnique({
        where: { slug: candidate },
        select: { organizationId: true },
      }),
    ]);

    const organizationAvailable =
      !organization || organization.id === organizationId;
    const verificationPageAvailable =
      !verificationPage || verificationPage.organizationId === organizationId;

    if (organizationAvailable && verificationPageAvailable) {
      return candidate;
    }
  }

  redirect("/dashboard/settings?error=slug");
}

function getString(formData: FormData, field: string) {
  const value = formData.get(field);

  return typeof value === "string" ? value.trim() : "";
}

function isValidOrganizationName(value: string) {
  return value.length >= 2 && value.length <= 96;
}

function getErrorMessage(error: string | undefined) {
  if (error === "slug") {
    return "That verification URL is already reserved. Choose a different slug.";
  }

  if (error === "invalid") {
    return "Enter a valid organization name and public registry record slug.";
  }

  if (error === "unauthorized") {
    return "The submitted organization did not match your current workspace.";
  }

  return "";
}
