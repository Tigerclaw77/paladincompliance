import Stripe from "stripe";
import { getPublicSiteUrl, validateRuntimeEnvironment } from "@/lib/paladin/env";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = new Stripe(
  stripeSecretKey ?? "sk_test_missing_stripe_secret_key",
  {
    apiVersion: "2026-04-22.dahlia",
    appInfo: {
      name: "Paladin Compliance",
      version: "0.1.0",
    },
  }
);

export function assertStripeServerConfig() {
  validateRuntimeEnvironment({
    strict: process.env.NODE_ENV === "production",
  });
}

export function getAppUrl() {
  return getPublicSiteUrl();
}

export function getStripeWebhookSecret() {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("Missing STRIPE_WEBHOOK_SECRET environment variable.");
  }

  return webhookSecret;
}
