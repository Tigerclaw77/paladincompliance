import { NextResponse } from "next/server";
import { getSpendAccess } from "@/lib/paladin/benefits/spendAccount";
import { toCsv } from "@/lib/paladin/csv";
import { CHECKLISTS } from "@/lib/paladin/reviews/checklists";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const access = await getSpendAccess();

  if (!access) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const rows = await prisma.reviewRecord.findMany({
    orderBy: { reviewedOn: "desc" },
    take: 5000,
    where: { organizationId: access.organizationId },
  });
  const csv = toCsv([
    ["Review date", "Checklist", "Checklist version", "Reviewer", "Items checked", "Items total", "Notes"],
    ...rows.map((row) => {
      const checklist = CHECKLISTS.find((c) => c.key === row.checklistKey);
      let checked = 0;

      try {
        checked = (JSON.parse(row.itemsJson) as string[]).length;
      } catch {
        checked = 0;
      }

      return [
        row.reviewedOn.toISOString().slice(0, 10),
        checklist?.title ?? row.checklistKey,
        row.checklistVersion,
        row.reviewerName,
        checked,
        checklist?.items.length ?? 0,
        row.notes,
      ];
    }),
  ]);

  return new NextResponse(csv, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": 'attachment; filename="paladin-review-records.csv"',
      "Content-Type": "text/csv; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
