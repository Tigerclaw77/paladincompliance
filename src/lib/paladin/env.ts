type EnvironmentIssue = {
  message: string;
  severity: "error" | "warn";
};

export type StripeRuntimeMode = "live" | "test";

const localDevelopmentSiteUrl = "http://localhost:3000";
const publicSiteUrlEnvKeys = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_APP_URL",
  "AUTH_URL",
  "NEXTAUTH_URL",
] as const;

export class EnvironmentValidationError extends Error {
  constructor(public readonly issues: EnvironmentIssue[]) {
    super(issues.map((issue) => issue.message).join("\n"));
    this.name = "EnvironmentValidationError";
  }
}

export type StorageDriver = "local" | "r2" | "s3" | "vercel-tmp";

export function getRuntimeEnvironment() {
  return process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development";
}

export function isDevelopmentRuntime() {
  return process.env.NODE_ENV === "development";
}

export function isProductionRuntime() {
  return (
    process.env.NODE_ENV === "production" &&
    (process.env.VERCEL_ENV === "production" || !process.env.VERCEL_ENV)
  );
}

export function getPublicSiteUrl() {
  const configuredUrl = getConfiguredPublicSiteUrl();

  if (configuredUrl) {
    return configuredUrl;
  }

  if (isDevelopmentRuntime()) {
    return localDevelopmentSiteUrl;
  }

  throw createMissingPublicSiteUrlError();
}

export function getConfiguredPublicSiteUrl() {
  const allowLocalhost = isDevelopmentRuntime();
  const configuredUrl = getPublicSiteUrlCandidates()
    .map(normalizePublicSiteUrl)
    .find((value): value is string => {
      if (!value) {
        return false;
      }

      return allowLocalhost || !isLocalhostUrl(value);
    });

  return configuredUrl ?? null;
}

// Public contact address shown on the site. Deliberately NOT overridable by
// PALADIN_SUPPORT_EMAIL / EMAIL_FROM so a stale production env var cannot
// re-introduce a legacy address on /contact, /terms, /privacy or /pricing.
export const PUBLIC_CONTACT_EMAIL = "contact@passportinformatics.com";

export function getSupportEmail() {
  return PUBLIC_CONTACT_EMAIL;
}

export function getEmailConfig() {
  return {
    from:
      process.env.EMAIL_FROM ??
      "Paladin Compliance <security@paladincompliance.local>",
    replyTo: process.env.EMAIL_REPLY_TO ?? getSupportEmail(),
    server: process.env.EMAIL_SERVER ?? "smtp://localhost:1025",
  };
}

export function getStorageDriver(): StorageDriver {
  const configuredDriver = process.env.PALADIN_STORAGE_DRIVER;

  if (
    configuredDriver === "local" ||
    configuredDriver === "r2" ||
    configuredDriver === "s3" ||
    configuredDriver === "vercel-tmp"
  ) {
    return configuredDriver;
  }

  return process.env.VERCEL ? "vercel-tmp" : "local";
}

export function getConfiguredStripeMode(): StripeRuntimeMode | null {
  const secretMode = getStripeKeyMode(process.env.STRIPE_SECRET_KEY);
  const publishableMode = getStripeKeyMode(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  );

  return secretMode ?? publishableMode;
}

export function validateRuntimeEnvironment({
  strict = isProductionRuntime(),
}: {
  strict?: boolean;
} = {}) {
  const issues: EnvironmentIssue[] = [];

  validateSiteUrl(issues, strict);
  validateAuth(issues, strict);
  validateDatabase(issues, strict);
  validateEmail(issues, strict);
  validateAdmin(issues, strict);
  validateStripe(issues, strict);
  validateStorage(issues, strict);

  const errors = issues.filter((issue) => issue.severity === "error");

  if (errors.length > 0) {
    throw new EnvironmentValidationError(errors);
  }

  return issues;
}

function validateSiteUrl(issues: EnvironmentIssue[], strict: boolean) {
  const siteUrl =
    getConfiguredPublicSiteUrl() ??
    (isDevelopmentRuntime() ? localDevelopmentSiteUrl : null);

  if (!siteUrl) {
    issues.push({
      message:
        "A production site URL is required. Configure NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_APP_URL, AUTH_URL, NEXTAUTH_URL, or VERCEL_URL; refusing to fall back to http://localhost:3000 outside local development.",
      severity: strict ? "error" : "warn",
    });
    return;
  }

  try {
    const parsedUrl = new URL(siteUrl);

    if (strict && (parsedUrl.protocol !== "https:" || isLocalhostUrl(siteUrl))) {
      issues.push({
        message:
          "NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_APP_URL, AUTH_URL, NEXTAUTH_URL, or VERCEL_URL must use a non-local HTTPS URL in production.",
        severity: "error",
      });
    }
  } catch {
    issues.push({
      message:
        "NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_APP_URL, AUTH_URL, NEXTAUTH_URL, or VERCEL_URL must be a valid URL.",
      severity: strict ? "error" : "warn",
    });
  }
}

function getVercelDeploymentUrl() {
  const vercelUrl = process.env.VERCEL_URL?.trim();

  if (!vercelUrl) {
    return "";
  }

  return vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`;
}

function getPublicSiteUrlCandidates() {
  return [
    ...publicSiteUrlEnvKeys.map((key) => process.env[key] ?? ""),
    getVercelDeploymentUrl(),
  ];
}

function normalizePublicSiteUrl(value: string) {
  const trimmedValue = value.trim().replace(/\/$/, "");

  if (!trimmedValue) {
    return null;
  }

  try {
    return new URL(trimmedValue).origin;
  } catch {
    return null;
  }
}

export function isLocalhostUrl(value: string) {
  try {
    const hostname = new URL(value).hostname;

    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname === "[::1]"
    );
  } catch {
    return false;
  }
}

function createMissingPublicSiteUrlError() {
  return new EnvironmentValidationError([
    {
      message:
        "Public site URL is required outside local development. Configure NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_APP_URL, AUTH_URL, NEXTAUTH_URL, or VERCEL_URL; refusing to generate http://localhost:3000 links.",
      severity: "error",
    },
  ]);
}

function validateAuth(issues: EnvironmentIssue[], strict: boolean) {
  const authSecret = process.env.AUTH_SECRET;

  if (!authSecret) {
    issues.push({
      message: "AUTH_SECRET is required.",
      severity: strict ? "error" : "warn",
    });
    return;
  }

  if (strict && authSecret.length < 32) {
    issues.push({
      message: "AUTH_SECRET should be at least 32 characters in production.",
      severity: "error",
    });
  }
}

function validateDatabase(issues: EnvironmentIssue[], strict: boolean) {
  const databaseUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;

  if (!databaseUrl) {
    issues.push({
      message: "DATABASE_URL is required for the application database.",
      severity: strict ? "error" : "warn",
    });
  } else if (!isPostgresConnectionUrl(databaseUrl)) {
    issues.push({
      message: "DATABASE_URL must be a Postgres connection string for Neon production deployment.",
      severity: strict ? "error" : "warn",
    });
  }

  if (directUrl && !isPostgresConnectionUrl(directUrl)) {
    issues.push({
      message: "DIRECT_URL must be a Postgres connection string when configured.",
      severity: strict ? "error" : "warn",
    });
  }

  if (strict && !directUrl) {
    issues.push({
      message: "DIRECT_URL is recommended for Neon migrations and direct Prisma maintenance commands.",
      severity: "warn",
    });
  }
}

function isPostgresConnectionUrl(value: string) {
  return value.startsWith("postgresql://") || value.startsWith("postgres://");
}

function validateEmail(issues: EnvironmentIssue[], strict: boolean) {
  const emailConfig = getEmailConfig();

  if (!process.env.EMAIL_SERVER) {
    issues.push({
      message: "EMAIL_SERVER is required for production magic-link delivery.",
      severity: strict ? "error" : "warn",
    });
  }

  if (!process.env.EMAIL_FROM) {
    issues.push({
      message: "EMAIL_FROM should be configured for production email delivery.",
      severity: strict ? "error" : "warn",
    });
  }

  if (strict && emailConfig.server.includes("localhost")) {
    issues.push({
      message: "EMAIL_SERVER must not point to localhost in production.",
      severity: "error",
    });
  }
}

function validateAdmin(issues: EnvironmentIssue[], strict: boolean) {
  const adminEmails = process.env.PALADIN_ADMIN_EMAILS ?? process.env.ADMIN_EMAILS;

  if (!adminEmails) {
    issues.push({
      message: "PALADIN_ADMIN_EMAILS or ADMIN_EMAILS is required for admin access.",
      severity: strict ? "error" : "warn",
    });
  }
}

function validateStripe(issues: EnvironmentIssue[], strict: boolean) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey) {
    issues.push({
      message: "STRIPE_SECRET_KEY is required.",
      severity: strict ? "error" : "warn",
    });
  }

  if (!publishableKey) {
    issues.push({
      message: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required.",
      severity: strict ? "error" : "warn",
    });
  }

  if (!webhookSecret) {
    issues.push({
      message: "STRIPE_WEBHOOK_SECRET is required.",
      severity: strict ? "error" : "warn",
    });
  } else if (strict && !webhookSecret.startsWith("whsec_")) {
    issues.push({
      message: "STRIPE_WEBHOOK_SECRET must be a Stripe webhook signing secret.",
      severity: "error",
    });
  }

  const secretMode = getStripeKeyMode(secretKey);
  const publishableMode = getStripeKeyMode(publishableKey);

  if (secretKey && !secretMode) {
    issues.push({
      message: "STRIPE_SECRET_KEY must start with sk_test_ or sk_live_.",
      severity: strict ? "error" : "warn",
    });
  }

  if (publishableKey && !publishableMode) {
    issues.push({
      message:
        "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must start with pk_test_ or pk_live_.",
      severity: strict ? "error" : "warn",
    });
  }

  if (secretMode && publishableMode && secretMode !== publishableMode) {
    issues.push({
      message: "Stripe secret and publishable keys must both be test or both be live.",
      severity: "error",
    });
  }
}

function validateStorage(issues: EnvironmentIssue[], strict: boolean) {
  const driver = getStorageDriver();
  const allowEphemeral = process.env.PALADIN_ALLOW_EPHEMERAL_STORAGE === "true";

  if (strict && (driver === "local" || driver === "vercel-tmp") && !allowEphemeral) {
    issues.push({
      message:
        "Production asset storage is ephemeral. Configure durable storage or set PALADIN_ALLOW_EPHEMERAL_STORAGE=true for an explicit pilot exception.",
      severity: "error",
    });
  }

  if ((driver === "s3" || driver === "r2") && !process.env.PALADIN_STORAGE_BUCKET) {
    issues.push({
      message: "PALADIN_STORAGE_BUCKET is required for S3/R2 storage.",
      severity: strict ? "error" : "warn",
    });
  }
}

export function getStripeKeyMode(key: string | undefined) {
  if (!key) {
    return null;
  }

  if (key.startsWith("sk_live_") || key.startsWith("pk_live_")) {
    return "live";
  }

  if (key.startsWith("sk_test_") || key.startsWith("pk_test_")) {
    return "test";
  }

  return null;
}
