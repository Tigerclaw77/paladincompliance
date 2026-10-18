import "server-only";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type SpendAccess = {
  organizationId: string;
  organizationName: string;
  role: string;
  userId: string;
};

/**
 * Resolves the caller's organization from the NextAuth session ONLY. The
 * organization id is never read from the request, so one organization cannot
 * read or write another's spend record. Mirrors getCurrentOrganization()
 * (first membership) without redirecting, for use in API routes.
 */
export async function getSpendAccess(): Promise<SpendAccess | null> {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    include: {
      memberships: {
        include: { organization: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
    where: { email },
  });
  const membership = user?.memberships[0];

  if (!user || !membership) {
    return null;
  }

  return {
    organizationId: membership.organization.id,
    organizationName: membership.organization.name,
    role: membership.role,
    userId: user.id,
  };
}
