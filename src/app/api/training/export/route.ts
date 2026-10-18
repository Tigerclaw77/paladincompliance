import { NextResponse } from "next/server";
import { getSpendAccess } from "@/lib/paladin/benefits/spendAccount";
import { toCsv } from "@/lib/paladin/csv";
import { TRAINING_MODULES } from "@/lib/paladin/training/content";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// CSV of the caller's own organization's training acknowledgments (org derived
// from the session). Any member of the organization may export.
export async function GET() {
  const access = await getSpendAccess();

  if (!access) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const rows = await prisma.trainingAcknowledgment.findMany({
    orderBy: [{ acknowledgedOn: "desc" }, { createdAt: "desc" }],
    take: 5000,
    where: { organizationId: access.organizationId },
  });
  const csv = toCsv([
    ["Date", "Person", "Email", "Role", "Module", "Module version", "Recorded by the person themselves"],
    ...rows.map((row) => [
      row.acknowledgedOn.toISOString().slice(0, 10),
      row.personName,
      row.personEmail,
      row.personRole,
      TRAINING_MODULES.find((m) => m.slug === row.moduleSlug)?.title ?? row.moduleSlug,
      row.moduleVersion,
      row.selfAcknowledged ? "yes" : "no",
    ]),
  ]);

  return new NextResponse(csv, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": 'attachment; filename="paladin-training-acknowledgments.csv"',
      "Content-Type": "text/csv; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
