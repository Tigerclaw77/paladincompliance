import { NextRequest, NextResponse } from "next/server";
import { getSpendAccess } from "@/lib/paladin/benefits/spendAccount";
import {
  annualSummaryToCsv,
  parseIsoDate,
  spendEntriesToCsv,
  spendRowToEntry,
  summarizeSpend,
} from "@/lib/paladin/spendRecord";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/spend-record/export?start=YYYY-MM-DD&kind=summary|log
// Any member of the organization may export its own record.
export async function GET(request: NextRequest) {
  const access = await getSpendAccess();

  if (!access) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const start =
    request.nextUrl.searchParams.get("start") ??
    `${new Date().getUTCFullYear()}-01-01`;
  const kind = request.nextUrl.searchParams.get("kind") === "log" ? "log" : "summary";
  const startDate = parseIsoDate(start);

  if (!startDate) {
    return NextResponse.json({ error: "start must be YYYY-MM-DD." }, { status: 400 });
  }

  const end = new Date(
    Date.UTC(startDate.getUTCFullYear() + 1, startDate.getUTCMonth(), startDate.getUTCDate())
  );
  const rows = await prisma.aiSpendEntry.findMany({
    orderBy: { entryDate: "asc" },
    where: {
      entryDate: { gte: startDate, lt: end },
      organizationId: access.organizationId,
    },
  });
  const entries = rows.map(spendRowToEntry);
  const summary = summarizeSpend(entries, start);
  const body =
    kind === "log" || !summary
      ? spendEntriesToCsv(entries)
      : annualSummaryToCsv(access.organizationName, summary);

  return new NextResponse(body, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="ai-governance-spend-${kind}-${start}.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
