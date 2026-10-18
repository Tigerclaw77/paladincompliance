import { createHmac, timingSafeEqual } from "node:crypto";

// Stateless, signed opt-out tokens: HMAC-SHA256 over the normalized email with a
// server secret. No token table is needed and a token cannot be forged for
// another address without the secret.

const MIN_SECRET_LENGTH = 16;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function signUnsubscribeToken(email: string, secret: string) {
  if ((secret ?? "").length < MIN_SECRET_LENGTH) {
    throw new Error("A secret of at least 16 characters is required.");
  }

  return createHmac("sha256", secret)
    .update(`unsubscribe:${normalizeEmail(email)}`)
    .digest("base64url");
}

export function verifyUnsubscribeToken(
  email: string,
  token: string,
  secret: string
) {
  if ((secret ?? "").length < MIN_SECRET_LENGTH || !token) {
    return false;
  }

  const expected = Buffer.from(signUnsubscribeToken(email, secret));
  const provided = Buffer.from(token);

  return (
    expected.length === provided.length && timingSafeEqual(expected, provided)
  );
}

export function buildUnsubscribeUrl({
  email,
  secret,
  siteUrl,
}: {
  email: string;
  secret: string;
  siteUrl: string;
}) {
  const query = new URLSearchParams({
    e: normalizeEmail(email),
    t: signUnsubscribeToken(email, secret),
  });

  return `${siteUrl}/unsubscribe?${query.toString()}`;
}
