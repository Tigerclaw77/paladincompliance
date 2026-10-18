// Pure helpers for the guest (no-account) Starter checkout. No server-only or
// database imports so they can be unit tested with `node --test`.

export const GUEST_STARTER_CATALOG_KEYS = ["starter"] as const;
export type GuestStarterCatalogKey = (typeof GUEST_STARTER_CATALOG_KEYS)[number];

export const GUEST_CHECKOUT_METADATA_FLAG = "guest_checkout";
export const STARTER_STAFF_RANGE = "1-25";

const ALLOWED_INDUSTRIES = new Set(["Finance", "Healthcare", "Other", "Technology"]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type GuestStarterInput = {
  email: string;
  /** Always false: the HIPAA add-on is not offered. */
  hipaaEnabled: false;
  industry: string;
  organizationName: string;
};

export function isGuestStarterCatalogKey(
  value: string
): value is GuestStarterCatalogKey {
  return (GUEST_STARTER_CATALOG_KEYS as readonly string[]).includes(value);
}

export function parseGuestStarterInput(
  body: Record<string, unknown>
): { ok: true; value: GuestStarterInput } | { ok: false; error: string } {
  const organizationName = asTrimmedString(body.organizationName);
  const email = asTrimmedString(body.email).toLowerCase();
  const industry = asTrimmedString(body.industry);

  if (organizationName.length < 2 || organizationName.length > 96) {
    return { ok: false, error: "Enter your organization name (2-96 characters)." };
  }

  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  if (industry && !ALLOWED_INDUSTRIES.has(industry)) {
    return { ok: false, error: "Select a valid industry or leave it blank." };
  }

  if (body.staffAttestation !== true) {
    return {
      ok: false,
      error: `Starter is for organizations with ${STARTER_STAFF_RANGE} staff. Confirm your organization fits, or contact us about Operational.`,
    };
  }

  return {
    ok: true,
    value: {
      email,
      hipaaEnabled: false,
      industry,
      organizationName,
    },
  };
}

export function buildGuestStarterMetadata(input: GuestStarterInput) {
  return {
    [GUEST_CHECKOUT_METADATA_FLAG]: "true",
    contact_email: input.email,
    industry: input.industry,
    organization_name: input.organizationName,
    staff_range_attested: STARTER_STAFF_RANGE,
  };
}

export function isGuestCheckoutMetadata(
  metadata: Record<string, string> | null | undefined
) {
  return metadata?.[GUEST_CHECKOUT_METADATA_FLAG] === "true";
}

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
