"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logOperationalEvent } from "@/lib/paladin/logging";
import {
  getCoveragePriceKey,
  getPaladinPlanName,
  getPaladinPriceItem,
} from "@/lib/paladin/pricing";
import { assertStripeServerConfig } from "@/lib/stripe";
import {
  getStripeCatalogItem,
  getStripePriceId,
} from "@/lib/stripe/catalog";
import {
  createSubscriptionCheckoutSession,
  getCheckoutUserContext,
} from "@/lib/stripe/checkout";

type StartPlan = "STARTER" | "GROWTH";
const allowedIndustries = new Set([
  "Finance",
  "Healthcare",
  "Other",
  "Technology",
]);

export async function saveStarterIntent(formData: FormData) {
  await saveStartIntent("STARTER", "/start/starter", formData);
}

export async function saveOperationalIntent(formData: FormData) {
  await saveStartIntent("GROWTH", "/start/operational", formData);
}

async function saveStartIntent(
  plan: StartPlan,
  callbackPath: string,
  formData: FormData
) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`);
  }

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
    include: {
      memberships: {
        orderBy: {
          createdAt: "asc",
        },
        take: 1,
      },
    },
  });

  if (!user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`);
  }

  const membership = user.memberships[0];

  if (!membership) {
    redirect(`/onboarding?callbackUrl=${encodeURIComponent(callbackPath)}`);
  }

  const industry = getString(formData, "industry");

  if (industry && !allowedIndustries.has(industry)) {
    redirect(`${callbackPath}?error=industry`);
  }

  const billingInterval = "YEAR" as const;
  const employeeCount =
    plan === "GROWTH"
      ? Math.max(26, getPositiveInteger(formData, "employees"))
      : null;
  // The HIPAA add-on is not offered (no deliverable exists); never persist it.
  const hipaaEnabled = false;

  if (plan === "GROWTH" && employeeCount && employeeCount > 250) {
    redirect("/start/enterprise?reason=employee-count");
  }

  const selectedPriceKey = getSelectedCoveragePriceKey({
    employeeCount,
    hipaaEnabled,
    plan,
  });
  const selectedPriceItem = getPaladinPriceItem(selectedPriceKey);

  await prisma.$transaction([
    prisma.acquisitionIntent.upsert({
      where: {
        organizationId: membership.organizationId,
      },
      create: {
        billingInterval,
        employeeCount,
        estimatedAnnualCents: selectedPriceItem.amountCents,
        hipaaEnabled,
        industry,
        locationCount: null,
        organizationId: membership.organizationId,
        plan,
        teamSize: null,
      },
      update: {
        billingInterval,
        employeeCount,
        estimatedAnnualCents: selectedPriceItem.amountCents,
        hipaaEnabled,
        industry,
        locationCount: null,
        plan,
        teamSize: null,
      },
    }),
    prisma.subscription.updateMany({
      where: {
        organizationId: membership.organizationId,
        status: "pending_checkout",
      },
      data: {
        billingInterval: selectedPriceItem.interval ?? "year",
        planName: getPaladinPlanName(selectedPriceItem),
        stripePriceId: getStripePriceId(selectedPriceKey),
      },
    }),
  ]);

  const checkoutUserContext = await getCheckoutUserContext(session.user.email);

  if (!checkoutUserContext?.organization) {
    redirect("/dashboard/billing?checkout=not-started");
  }

  let checkoutUrl = "";

  try {
    assertStripeServerConfig();

    const checkoutSession = await createSubscriptionCheckoutSession({
      catalogItem: getStripeCatalogItem(selectedPriceKey),
      userContext: checkoutUserContext,
    });

    checkoutUrl = checkoutSession.url ?? "";
  } catch (error) {
    logOperationalEvent("error", "stripe_start_checkout_failed", {
      error:
        error instanceof Error
          ? error.message
          : "Unable to create Stripe Checkout Session",
      organizationId: membership.organizationId,
      priceKey: selectedPriceKey,
    });

    redirect("/dashboard/billing?checkout=not-started");
  }

  if (!checkoutUrl) {
    redirect("/dashboard/billing?checkout=not-started");
  }

  redirect(checkoutUrl);
}

function getString(formData: FormData, field: string) {
  const value = formData.get(field);

  return typeof value === "string" ? value.trim() : "";
}

function getPositiveInteger(formData: FormData, field: string) {
  const value = Number.parseInt(getString(formData, field), 10);

  if (!Number.isFinite(value) || value < 1) {
    return 1;
  }

  return Math.min(value, 100000);
}

function getSelectedCoveragePriceKey({
  employeeCount,
  hipaaEnabled,
  plan,
}: {
  employeeCount: number | null;
  hipaaEnabled: boolean;
  plan: StartPlan;
}) {
  return getCoveragePriceKey({
    employeeCount,
    hipaaEnabled,
    plan,
  });
}
