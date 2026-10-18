import { NextRequest, NextResponse } from "next/server";
import { getSpendAccess } from "@/lib/paladin/benefits/spendAccount";
import {
  SPEND_FIELD_LIMITS,
  canWriteSpendRecords,
  parseSpendEntryInput,
  spendRowToEntry,
} from "@/lib/paladin/spendRecord";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const access = await getSpendAccess();

  if (!access) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const rows = await prisma.aiSpendEntry.findMany({
    orderBy: { entryDate: "asc" },
    where: { organizationId: access.organizationId },
  });

  return NextResponse.json({
    canWrite: canWriteSpendRecords(access.role),
    entries: rows.map(spendRowToEntry),
  });
}

// Upserts a batch of entries (merge, never deletes) for the caller's
// organization. JSON content type is required, which also blocks cross-site
// form posts.
export async function POST(request: NextRequest) {
  const access = await getSpendAccess();

  if (!access) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!canWriteSpendRecords(access.role)) {
    return NextResponse.json(
      { error: "Only organization owners and admins can save the spend record." },
      { status: 403 }
    );
  }

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "Expected JSON." }, { status: 415 });
  }

  const body = (await request.json().catch(() => null)) as {
    entries?: unknown;
  } | null;

  if (
    !body ||
    !Array.isArray(body.entries) ||
    body.entries.length > SPEND_FIELD_LIMITS.maxBatch
  ) {
    return NextResponse.json(
      { error: `Provide up to ${SPEND_FIELD_LIMITS.maxBatch} entries.` },
      { status: 400 }
    );
  }

  const parsed = body.entries.map(parseSpendEntryInput);
  const invalid = parsed.findIndex((result) => !result.ok);

  if (invalid >= 0) {
    const failure = parsed[invalid];

    return NextResponse.json(
      {
        error: `Entry ${invalid + 1}: ${failure.ok ? "invalid" : failure.error}`,
      },
      { status: 400 }
    );
  }

  const existing = await prisma.aiSpendEntry.count({
    where: { organizationId: access.organizationId },
  });

  if (existing >= SPEND_FIELD_LIMITS.maxEntriesPerOrganization) {
    return NextResponse.json(
      { error: "Spend record entry limit reached." },
      { status: 409 }
    );
  }

  await prisma.$transaction(
    parsed.flatMap((result) => {
      if (!result.ok) return [];
      const { clientId, date, ...rest } = result.value;
      const data = { ...rest, entryDate: new Date(`${date}T00:00:00.000Z`) };

      return [
        prisma.aiSpendEntry.upsert({
          create: {
            ...data,
            clientId,
            createdByUserId: access.userId,
            organizationId: access.organizationId,
          },
          update: data,
          where: {
            organizationId_clientId: {
              clientId,
              organizationId: access.organizationId,
            },
          },
        }),
      ];
    })
  );

  return NextResponse.json({ saved: parsed.length });
}

export async function DELETE(request: NextRequest) {
  const access = await getSpendAccess();

  if (!access) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!canWriteSpendRecords(access.role)) {
    return NextResponse.json(
      { error: "Only organization owners and admins can change the spend record." },
      { status: 403 }
    );
  }

  const clientId = request.nextUrl.searchParams.get("id") ?? "";

  if (!/^[A-Za-z0-9_-]{1,64}$/.test(clientId)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  const result = await prisma.aiSpendEntry.deleteMany({
    where: { clientId, organizationId: access.organizationId },
  });

  return NextResponse.json({ deleted: result.count });
}
