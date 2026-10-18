import "server-only";

import { getCurrentOrganization } from "@/lib/paladin/currentOrganization";
import {
  canAccessFeature,
  resolveOrganizationEntitlements,
} from "@/lib/paladin/entitlements/service";

/**
 * Organization context for dashboard pages and server actions. The
 * organization is always the signed-in user's first membership (never a
 * request parameter), so every new route is org-scoped by construction.
 */
export async function getMemberAccess() {
  const { membership, organization, user } = await getCurrentOrganization();
  const entitlements = resolveOrganizationEntitlements({
    acquisitionIntent: organization.acquisitionIntent,
    subscription: organization.subscription,
  });

  return {
    canWrite: membership.role === "OWNER" || membership.role === "ADMIN",
    entitlements,
    hasActiveMembership: canAccessFeature(entitlements, "downloadableAssets"),
    membership,
    organization,
    user,
  };
}
