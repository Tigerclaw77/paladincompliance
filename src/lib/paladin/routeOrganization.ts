import "server-only";

import { prisma } from "@/lib/prisma";

/** First-membership organization for a session email, for API routes. */
export async function getCurrentOrganizationForRoute(email: string) {
  const user = await prisma.user.findUnique({
    include: {
      memberships: {
        include: {
          organization: {
            include: {
              acquisitionIntent: true,
              subscription: true,
              verificationPage: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
    where: { email },
  });

  return user?.memberships[0]?.organization ?? null;
}
