import "server-only";

import { Prisma } from "@prisma/client";
import { saveDownloadableAsset } from "@/lib/paladin/assets";
import { generateTrainingCertificatePdf } from "@/lib/paladin/pdf/certificate";
import { prisma } from "@/lib/prisma";
import {
  getStarterModuleContent,
  starterTrainingModules,
} from "@/lib/paladin/training/modules";

export async function ensureStarterTrainingModules(organizationId: string) {
  await Promise.all(
    starterTrainingModules.map((module) =>
      prisma.trainingModule.upsert({
        where: {
          organizationId_slug: {
            organizationId,
            slug: module.slug,
          },
        },
        create: {
          description: module.description,
          estimatedMinutes: module.estimatedMinutes,
          isPublished: true,
          organizationId,
          slug: module.slug,
          title: module.title,
        },
        update: {
          description: module.description,
          estimatedMinutes: module.estimatedMinutes,
          isPublished: true,
          title: module.title,
        },
      })
    )
  );
}

export async function getTrainingDashboard({
  organizationId,
  userId,
}: {
  organizationId: string;
  userId: string;
}) {
  await ensureStarterTrainingModules(organizationId);

  const [modules, organizationCompletionCount, recentCompletions] =
    await Promise.all([
    prisma.trainingModule.findMany({
      orderBy: {
        createdAt: "asc",
      },
      where: {
        isPublished: true,
        organizationId,
      },
      include: {
        completions: {
          where: {
            userId,
          },
          take: 1,
        },
      },
    }),
    prisma.trainingCompletion.count({
      where: {
        module: {
          organizationId,
        },
      },
    }),
    prisma.trainingCompletion.findMany({
      orderBy: {
        completedAt: "desc",
      },
      take: 6,
      where: {
        module: {
          organizationId,
        },
      },
      include: {
        module: true,
        user: true,
      },
    }),
  ]);

  const completedCount = modules.filter(
    (module) => module.completions.length > 0
  ).length;

  return {
    completedCount,
    modules,
    organizationCompletionCount,
    recentCompletions,
    totalCount: modules.length,
  };
}

export async function getTrainingModuleForUser({
  organizationId,
  slug,
  userId,
}: {
  organizationId: string;
  slug: string;
  userId: string;
}) {
  await ensureStarterTrainingModules(organizationId);

  const trainingModule = await prisma.trainingModule.findFirst({
    where: {
      isPublished: true,
      organizationId,
      slug,
    },
    include: {
      completions: {
        where: {
          userId,
        },
        take: 1,
      },
    },
  });

  if (!trainingModule) {
    return null;
  }

  return {
    content: getStarterModuleContent(trainingModule.slug),
    module: trainingModule,
  };
}

export async function completeTrainingModule({
  moduleSlug,
  organizationId,
  organizationName,
  userId,
  userName,
}: {
  moduleSlug: string;
  organizationId: string;
  organizationName: string;
  userId: string;
  userName: string;
}) {
  await ensureStarterTrainingModules(organizationId);

  const trainingModule = await prisma.trainingModule.findFirst({
    where: {
      isPublished: true,
      organizationId,
      slug: moduleSlug,
    },
  });

  if (!trainingModule) {
    return {
      status: "not_found" as const,
    };
  }

  const existingCompletion = await prisma.trainingCompletion.findUnique({
    where: {
      userId_moduleId: {
        moduleId: trainingModule.id,
        userId,
      },
    },
  });

  if (existingCompletion) {
    return {
      completion: existingCompletion,
      status: "already_complete" as const,
    };
  }

  const completedAt = new Date();
  const certificatePdf = await generateTrainingCertificatePdf({
    completedAt,
    moduleTitle: trainingModule.title,
    organizationName,
    userName,
  });
  const certificateAsset = await saveDownloadableAsset({
    assetType: "TRAINING_CERTIFICATE",
    body: certificatePdf,
    description: `Training completion attestation for ${trainingModule.title}.`,
    filename: `${trainingModule.slug}-${sanitizeCertificateName(userName)}-certificate.pdf`,
    mimeType: "application/pdf",
    organizationId,
    title: `${trainingModule.title} Attestation`,
  });

  try {
    const completion = await prisma.trainingCompletion.create({
      data: {
        certificateAssetId: certificateAsset.id,
        completedAt,
        moduleId: trainingModule.id,
        userId,
      },
    });

    return {
      completion,
      status: "completed" as const,
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        completion: await prisma.trainingCompletion.findUnique({
          where: {
            userId_moduleId: {
              moduleId: trainingModule.id,
              userId,
            },
          },
        }),
        status: "already_complete" as const,
      };
    }

    throw error;
  }
}

export async function getOrganizationTrainingOverview(organizationId: string) {
  await ensureStarterTrainingModules(organizationId);

  const [moduleCount, completionCount, recentCompletions] = await Promise.all([
    prisma.trainingModule.count({
      where: {
        isPublished: true,
        organizationId,
      },
    }),
    prisma.trainingCompletion.count({
      where: {
        module: {
          organizationId,
        },
      },
    }),
    prisma.trainingCompletion.findMany({
      orderBy: {
        completedAt: "desc",
      },
      take: 4,
      where: {
        module: {
          organizationId,
        },
      },
      include: {
        module: true,
        user: true,
      },
    }),
  ]);

  return {
    completionCount,
    moduleCount,
    recentCompletions,
  };
}

export function getUserDisplayName(user: {
  email: string | null;
  name: string | null;
}) {
  return user.name || user.email || "Paladin User";
}

function sanitizeCertificateName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
