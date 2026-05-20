"use client";

import { loadStripe } from "@stripe/stripe-js";
import { useState, type CSSProperties } from "react";
import type { CheckoutPriceKey } from "@/lib/paladin/pricing";
import {
  getStripePriceId,
  isConfiguredStripePriceId,
} from "@/lib/stripe/catalog";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

type CheckoutButtonProps = {
  label: string;
  priceKey: CheckoutPriceKey;
  quantity?: number;
  style?: CSSProperties;
};

type CheckoutSessionResponse = {
  error?: string;
  sessionId?: string;
  url?: string | null;
};

export default function CheckoutButton({
  label,
  priceKey,
  quantity,
  style,
}: CheckoutButtonProps) {
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleCheckout() {
    setErrorMessage("");
    setIsLoading(true);

    try {
      if (!publishableKey || !stripePromise) {
        throw new Error(
          "Checkout is not configured yet. Please contact Paladin support."
        );
      }

      if (!isConfiguredStripePriceId(getStripePriceId(priceKey))) {
        throw new Error(
          "This billing option is not configured yet. Please contact Paladin support."
        );
      }

      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceKey,
          quantity,
        }),
      });
      const payload = await readCheckoutSessionResponse(response);

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to start checkout.");
      }

      const stripe = await stripePromise;

      if (!stripe) {
        throw new Error("Unable to initialize Stripe Checkout.");
      }

      if (!payload.sessionId || !payload.url) {
        throw new Error("Stripe did not return a Checkout Session URL.");
      }

      window.location.assign(payload.url);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to start checkout."
      );
      setIsLoading(false);
    }
  }

  return (
    <div style={wrapperStyle}>
      <button
        aria-busy={isLoading}
        disabled={isLoading}
        onClick={handleCheckout}
        style={{ ...buttonStyle, ...style }}
        type="button"
      >
        {isLoading ? "Opening Checkout..." : label}
      </button>
      {errorMessage && (
        <p role="alert" style={errorStyle}>
          {errorMessage}
        </p>
      )}
    </div>
  );
}

async function readCheckoutSessionResponse(response: Response) {
  try {
    return (await response.json()) as CheckoutSessionResponse;
  } catch {
    return {
      error: "Coverage checkout is unavailable right now. Please try again.",
    };
  }
}

const wrapperStyle: CSSProperties = {
  display: "grid",
  gap: 8,
};

const buttonStyle: CSSProperties = {
  background: "linear-gradient(145deg, #1e3a8a, #2563eb)",
  border: "1px solid rgba(198, 168, 91, 0.46)",
  borderRadius: 8,
  boxShadow: "0 4px 10px rgba(15, 23, 42, 0.24)",
  color: "#ffffff",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 900,
  padding: "13px 14px",
  textAlign: "center",
  width: "100%",
};

const errorStyle: CSSProperties = {
  color: "#991b1b",
  fontSize: 13,
  lineHeight: 1.4,
  margin: 0,
};
