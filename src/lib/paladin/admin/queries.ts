import "server-only";

import { Prisma } from "@prisma/client";
import { resolveOrganizationEntitlements } from "@/lib/paladin/entitlements/service";
import { getAbsoluteVerificationUrl } from "@/lib/paladin/siteUrl";
import { prisma } from "@/lib/prisma";

export type AdminOrganizationRow = Awaited<
  ReturnType<typeof getAdminOrganizations>
>[number];

export type AdminActivity = {
  description: string;
  href: string;
  id: string;
  occurredAt: Date;
  organizationId: string;
  organizationName: string;
  title: string;
  type:
    | "binder_generated"
    | "certificate_generated"
    | "subscription_updated"
    | "training_completed";
};

export async function getAdminDashboardOverview(query: string) {
  const [organizations, organizationCount, activeSubscriptions, hipaaCount] =
    await Promise.all([
      getAdminOrganizations(query, 12),
      prisma.organization.count(),
      prisma.subscription.count({
        where: {
          status: {
            in: ["active", "trialing"],
          },
        },
      }),
      prisma.acquisitionIntent.count({
        where: {
          hipaaEnabled: true,
        },
      }),
    ]);

  const recentActivity = await getAdminRecentActivity();

  return {
    activeSubscriptions,
    hipaaCount,
    organizationCount,
    organizations,
    recentActivity,
  };
}

export async function getAdminOrganizations(query = "", take = 50) {
  const organizations = await prisma.organization.findMany({
    include: {
      _count: {
        select: {
          downloadableAssets: true,
          memberships: true,
          trainingModules: true,
        },
      },
      acquisitionIntent: true,
      downloadableAssets: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        where: {
          assetType: "BINDER_PDF",
        },
      },
      subscription: true,
      trainingModules: {
        select: {
          completions: {
            include: {
              user: true,
            },
            orderBy: {
              completedAt: "desc",
            },
            take: 1,
          },
          title: true,
        },
      },
      verificationPage: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take,
    where: getOrganizationSearchWhere(query),
  });

  return organizations.map((organization) => {
    const entitlements = resolveOrganizationEntitlements({
      acquisitionIntent: organization.acquisitionIntent,
      subscription: organization.subscription,
    });
    const latestTrainingCompletion = organization.trainingModules
      .flatMap((module) =>
        module.completions.map((completion) => ({
          completedAt: completion.completedAt,
          moduleTitle: module.title,
          userEmail: completion.user.email,
        }))
      )
      .sort((left, right) => right.completedAt.getTime() - left.completedAt.getTime())[0];

    return {
      assetCount: organization._count.downloadableAssets,
      createdAt: organization.createdAt,
      hipaaEnabled: Boolean(organization.acquisitionIntent?.hipaaEnabled),
      id: organization.id,
      latestBinder: organization.downloadableAssets[0] ?? null,
      latestTrainingCompletion: latestTrainingCompletion ?? null,
      memberCount: organization._count.memberships,
      name: organization.name,
      planLabel: entitlements.planLabel,
      slug: organization.slug,
      subscriptionStatus: organization.subscription?.status ?? "inactive",
      trainingModuleCount: organization._count.trainingModules,
      verificationStatus: organization.verificationPage?.status ?? "draft",
    };
  });
}

export async function getAdminOrganizationDetail(organizationId: string) {
  const organization = await prisma.organization.findUnique({
    include: {
      acquisitionIntent: true,
      downloadableAssets: {
        orderBy: {
          createdAt: "desc",
        },
        take: 50,
      },
      memberships: {
        include: {
          user: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      subscription: true,
      trainingModules: {
        include: {
          completions: {
            include: {
              user: true,
            },
            orderBy: {
              completedAt: "desc",
            },
            take: 20,
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      verificationPage: true,
    },
    where: {
      id: organizationId,
    },
  });

  if (!organization) {
    return null;
  }

  const verificationSlug = organization.verificationPage?.slug ?? organization.slug;

  return {
    entitlements: resolveOrganizationEntitlements({
      acquisitionIntent: organization.acquisitionIntent,
      subscription: organization.subscription,
    }),
    organization,
    verificationUrl: getAbsoluteVerificationUrl(verificationSlug),
  };
}

export async function getAdminRecentActivity(take = 16) {
  const [binderAssets, certificateAssets, trainingCompletions, subscriptions] =
    await Promise.all([
      prisma.downloadableAsset.findMany({
        include: {
          organization: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take,
        where: {
          assetType: "BINDER_PDF",
        },
      }),
      prisma.downloadableAsset.findMany({
        include: {
          organization: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take,
        where: {
          assetType: "TRAINING_CERTIFICATE",
        },
      }),
      prisma.trainingCompletion.findMany({
        include: {
          module: {
            include: {
              organization: true,
            },
          },
          user: true,
        },
        orderBy: {
          completedAt: "desc",
        },
        take,
      }),
      prisma.subscription.findMany({
        include: {
          organization: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
        take,
      }),
    ]);

  return [
    ...binderAssets.map(
      (asset): AdminActivity => ({
        description: asset.title,
        href: `/admin/organizations/${asset.organizationId}`,
        id: `binder-${asset.id}`,
        occurredAt: asset.createdAt,
        organizationId: asset.organizationId,
        organizationName: asset.organization.name,
        title: "Binder generated",
        type: "binder_generated",
      })
    ),
    ...certificateAssets.map(
      (asset): AdminActivity => ({
        description: asset.title,
        href: `/admin/organizations/${asset.organizationId}`,
        id: `certificate-${asset.id}`,
        occurredAt: asset.createdAt,
        organizationId: asset.organizationId,
        organizationName: asset.organization.name,
        title: "Attestation generated",
        type: "certificate_generated",
      })
    ),
    ...trainingCompletions.map(
      (completion): AdminActivity => ({
        description: `${completion.user.email} completed ${completion.module.title}.`,
        href: `/admin/organizations/${completion.module.organizationId}`,
        id: `training-${completion.id}`,
        occurredAt: completion.completedAt,
        organizationId: completion.module.organizationId,
        organizationName: completion.module.organization.name,
        title: "Training completed",
        type: "training_completed",
      })
    ),
    ...subscriptions.map(
      (subscription): AdminActivity => ({
        description: `Coverage status is ${subscription.status}.`,
        href: `/admin/organizations/${subscription.organizationId}`,
        id: `subscription-${subscription.id}`,
        occurredAt: subscription.updatedAt,
        organizationId: subscription.organizationId,
        organizationName: subscription.organization.name,
        title: "Coverage updated",
        type: "subscription_updated",
      })
    ),
  ]
    .sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime())
    .slice(0, take);
}

function getOrganizationSearchWhere(query: string): Prisma.OrganizationWhereInput {
  const search = query.trim();

  if (!search) {
    return {};
  }

  return {
    OR: [
      {
        name: {
          contains: search,
        },
      },
      {
        slug: {
          contains: search,
        },
      },
      {
        verificationPage: {
          is: {
            slug: {
              contains: search,
            },
          },
        },
      },
      {
        memberships: {
          some: {
            user: {
              email: {
                contains: search,
              },
            },
          },
        },
      },
    ],
  };
}
