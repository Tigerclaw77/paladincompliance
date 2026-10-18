import { timingSafeEqual } from "node:crypto";

/**
 * Bearer-token check for cron-callable endpoints. Returns "unconfigured" when
 * CRON_SECRET is not set (the endpoint must then refuse to run), so the route
 * can never be open by accident.
 */
export function checkCronAuthorization(
  authorizationHeader: string | null | undefined,
  secret: string | null | undefined
): "ok" | "unauthorized" | "unconfigured" {
  const expected = (secret ?? "").trim();

  if (expected.length < 16) {
    return "unconfigured";
  }

  const match = /^Bearer\s+(.+)$/i.exec((authorizationHeader ?? "").trim());

  if (!match) {
    return "unauthorized";
  }

  const provided = Buffer.from(match[1].trim());
  const wanted = Buffer.from(expected);

  if (provided.length !== wanted.length) {
    return "unauthorized";
  }

  return timingSafeEqual(provided, wanted) ? "ok" : "unauthorized";
}
