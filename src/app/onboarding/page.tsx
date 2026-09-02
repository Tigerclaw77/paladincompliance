import { MembershipRole, Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import OrganizationOnboardingForm from "@/components/onboarding/OrganizationOnboardingForm";
import { getPublicSiteUrl } from "@/lib/paladin/env";
import {
  appendNumericSlugSuffix,
  createSlugFromOrganizationName,
  isValidOrganizationSlug,
  normalizeOrganizationSlug,
} from "@/lib/paladin/slugs";
import { getSafeCallbackUrl } from "@/lib/paladin/startFlow";
import { prisma } from "@/lib/prisma";

type OnboardingPageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
    error?: string;
  }>;
};

export default async function OnboardingPage({
  searchParams,
}: OnboardingPageProps) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      memberships: {
        take: 1,
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const callbackUrl = getSafeCallbackUrl(params.callbackUrl);
  const errorMessage = getErrorMessage(params.error);

  if (user.memberships.length > 0) {
    redirect(callbackUrl);
  }

  return (
    <main className="min-h-[calc(100vh-8rem)] bg-slate-950 px-5 py-12 text-white">
      <div className="mx-auto grid min-h-[620px] max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200">
            Paladin Onboarding
          </p>
          <h1 className="mt-5 max-w-xl text-4xl font-black tracking-tight text-white sm:text-5xl">
            Create the organization workspace.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
            This workspace becomes the operational home for policy assets,
            subscription status, and the public verification page.
          </p>
        </section>

        <section className="overflow-hidden rounded-xl border border-white/10 bg-slate-900/90 shadow-[0_24px_80px_rgba(2,6,23,0.55)]">
          <div className="h-1 bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
          <div className="relative p-7 sm:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.24),transparent_34%)]" />
            <OrganizationOnboardingForm
              action={createOrganization}
              callbackUrl={callbackUrl}
              errorMessage={errorMessage}
              siteUrl={getPublicSiteUrl()}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

async function createOrganization(formData: FormData) {
  "use server";

  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const name = getRequiredString(formData, "name");
  const submittedSlug = normalizeOrganizationSlug(
    getOptionalString(formData, "slug") ?? ""
  );
  const fallbackSlug = createSlugFromOrganizationName(name);
  const baseSlug = submittedSlug || fallbackSlug;
  const callbackUrl = getSafeCallbackUrl(getOptionalString(formData, "callbackUrl"));

  if (!isValidOrganizationName(name) || !isValidOrganizationSlug(baseSlug)) {
    redirect("/onboarding?error=invalid");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    redirect("/login");
  }

  const existingMembership = await prisma.membership.findFirst({
    where: { userId: user.id },
    select: { id: true },
  });

  if (existingMembership) {
    redirect(callbackUrl);
  }

  const slug = await getUniqueOrganizationSlug(baseSlug);

  try {
    await prisma.organization.create({
      data: {
        name,
        slug,
        memberships: {
          create: {
            role: MembershipRole.OWNER,
            userId: user.id,
          },
        },
        verificationPage: {
          create: {
            publicTitle: name,
            slug,
            status: "draft",
          },
        },
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      redirect("/onboarding?error=slug");
    }

    throw error;
  }

  redirect(callbackUrl);
}

async function getUniqueOrganizationSlug(baseSlug: string) {
  for (let suffix = 1; suffix <= 999; suffix += 1) {
    const candidate = appendNumericSlugSuffix(baseSlug, suffix);
    const [organization, verificationPage] = await prisma.$transaction([
      prisma.organization.findUnique({
        where: { slug: candidate },
        select: { id: true },
      }),
      prisma.verificationPage.findUnique({
        where: { slug: candidate },
        select: { id: true },
      }),
    ]);

    if (!organization && !verificationPage) {
      return candidate;
    }
  }

  redirect("/onboarding?error=slug");
}

function getRequiredString(formData: FormData, field: string) {
  const value = formData.get(field);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function getOptionalString(formData: FormData, field: string) {
  const value = formData.get(field);

  return typeof value === "string" ? value.trim() : undefined;
}

function isValidOrganizationName(value: string) {
  return value.length >= 2 && value.length <= 96;
}

function getErrorMessage(error: string | undefined) {
  if (error === "slug") {
    return "That verification URL is already reserved. Choose a different slug.";
  }

  if (error === "invalid") {
    return "Enter an organization name and a valid public verification slug.";
  }

  return "";
}
