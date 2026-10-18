// Shared, dependency-free types for subscriber benefit services. These modules
// take their database, mailer and clock as injected dependencies so they can be
// unit-tested without a database or an email provider.

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  headers?: Record<string, string>;
};

export type Mailer = (message: MailMessage) => Promise<void>;

export class EmailNotConfiguredError extends Error {
  constructor() {
    super(
      "No outbound email provider is configured (set EMAIL_SERVER and EMAIL_FROM)."
    );
    this.name = "EmailNotConfiguredError";
  }
}

/** Per-run volume cap shared by every job in one cron invocation. */
export type SendBudget = { remaining: number; capped: number };

export const DEFAULT_MAX_EMAILS_PER_RUN = 50;

export function createSendBudget(max: number | undefined | null): SendBudget {
  const value =
    typeof max === "number" && Number.isFinite(max) && max >= 0
      ? Math.floor(max)
      : DEFAULT_MAX_EMAILS_PER_RUN;

  return { remaining: value, capped: 0 };
}

/**
 * Sends one message if budget remains. Returns "capped" (nothing sent, nothing
 * should be recorded, so a later run retries) when the cap is reached, and
 * "failed" when the mailer throws.
 */
export async function sendWithBudget(
  budget: SendBudget,
  mailer: Mailer,
  message: MailMessage
): Promise<"sent" | "capped" | "failed"> {
  if (budget.remaining <= 0) {
    budget.capped += 1;
    return "capped";
  }

  budget.remaining -= 1;

  try {
    await mailer(message);
    return "sent";
  } catch {
    return "failed";
  }
}
