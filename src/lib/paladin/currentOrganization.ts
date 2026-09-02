import "server-only";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentOrganization() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      memberships: {
        include: {
          organization: {
            include: {
              acquisitionIntent: true,
              downloadableAssets: {
                orderBy: {
                  createdAt: "desc",
                },
              },
              subscription: true,
              verificationPage: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
        take: 1,
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const membership = user.memberships[0];

  if (!membership) {
    redirect("/onboarding");
  }

  return {
    membership,
    organization: membership.organization,
    user,
  };
}
