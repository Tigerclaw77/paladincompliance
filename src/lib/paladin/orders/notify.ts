import "server-only";

import { createSmtpMailer } from "@/lib/paladin/benefits/mailer";
import { isEmailProviderConfigured } from "@/lib/paladin/env";
import { logOperationalEvent } from "@/lib/paladin/logging";
import {
  buildOrderNotificationEmail,
  isFulfillableOrder,
  type OrderSessionShape,
} from "./notification";

/**
 * Best-effort fulfillment alert to PALADIN_ORDER_NOTIFY_EMAIL. It never throws,
 * because a failed alert must not make Stripe retry the webhook (which would
 * re-run provisioning). If the owner address or the email provider is not
 * configured, it logs a warning and the Stripe dashboard remains the order
 * record.
 */
export async function notifyOwnerOfOrder(session: OrderSessionShape) {
  try {
    if (!isFulfillableOrder(session)) {
      return;
    }

    const to = (process.env.PALADIN_ORDER_NOTIFY_EMAIL ?? "").trim();

    if (!to || !isEmailProviderConfigured()) {
      logOperationalEvent("warn", "order_alert_not_sent_unconfigured", {
        checkoutSessionId: session.id,
        hasRecipient: Boolean(to),
      });
      return;
    }

    const message = buildOrderNotificationEmail(session);

    await createSmtpMailer()({ to, ...message });
    logOperationalEvent("info", "order_alert_sent", { checkoutSessionId: session.id });
  } catch (error) {
    logOperationalEvent("error", "order_alert_failed", {
      checkoutSessionId: session.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
