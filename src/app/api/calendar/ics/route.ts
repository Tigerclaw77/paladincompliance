import { NextResponse } from "next/server";
import { getSpendAccess } from "@/lib/paladin/benefits/spendAccount";
import { buildIcs } from "@/lib/paladin/calendar/ics";
import { computeCalendar } from "@/lib/paladin/calendar/events";
import { getSiteOrigin } from "@/lib/paladin/siteUrl";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Downloadable .ics for the signed-in member's own organization (derived from
// the session, never from the request). Requires an active membership.
export async function GET() {
  const access = await getSpendAccess();

  if (!access) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const subscription = await prisma.subscription.findUnique({
    where: { organizationId: access.organizationId },
  });

  if (
    !subscription ||
    !["active", "trialing"].includes(subscription.status) ||
    !subscription.currentPeriodStart ||
    !subscription.currentPeriodEnd
  ) {
    return NextResponse.json(
      { error: "The compliance calendar needs an active membership." },
      { status: 403 }
    );
  }

  const siteUrl = getSiteOrigin();
  const now = new Date();
  const events = computeCalendar({
    from: now,
    periodEnd: subscription.currentPeriodEnd,
    periodStart: subscription.currentPeriodStart,
  });
  const ics = buildIcs({
    calendarName: `Paladin compliance calendar: ${access.organizationName}`,
    events: events.map((event) => ({
      date: event.dueDate,
      description: `${event.description} (internal review date, not a legal deadline)`,
      summary: event.title,
      uid: `${access.organizationId}-${event.key}-${event.dueDate}@paladincompliance.com`,
      url: `${siteUrl}${event.path}`,
    })),
    now,
  });

  return new NextResponse(ics, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": 'attachment; filename="paladin-compliance-calendar.ics"',
      "Content-Type": "text/calendar; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
