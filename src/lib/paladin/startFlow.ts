import "server-only";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getStartFlowContext(callbackPath: string) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`);
  }

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
    include: {
      memberships: {
        include: {
          organization: {
            include: {
              acquisitionIntent: true,
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
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`);
  }

  const membership = user.memberships[0];

  if (!membership) {
    redirect(`/onboarding?callbackUrl=${encodeURIComponent(callbackPath)}`);
  }

  return {
    membership,
    organization: membership.organization,
    user,
  };
}

export function getSafeCallbackUrl(callbackUrl: string | undefined) {
  if (
    !callbackUrl ||
    !callbackUrl.startsWith("/") ||
    callbackUrl.startsWith("//")
  ) {
    return "/dashboard";
  }

  return callbackUrl;
}
