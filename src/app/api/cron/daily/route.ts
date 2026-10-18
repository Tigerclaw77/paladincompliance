import { NextRequest, NextResponse } from "next/server";
import { checkCronAuthorization } from "@/lib/paladin/benefits/cronAuth";
import {
  getMaxEmailsPerRun,
  runComplianceRemindersWithPrisma,
  runRenewalRemindersWithPrisma,
} from "@/lib/paladin/benefits/server";
import { createSendBudget } from "@/lib/paladin/benefits/types";
import { logOperationalEvent } from "@/lib/paladin/logging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// One daily job: 30-day renewal notices plus compliance-calendar reminders.
// Auth: `Authorization: Bearer $CRON_SECRET` (Vercel Cron sends this header
// automatically when the CRON_SECRET env var exists). `?dryRun=1` previews
// without sending or recording anything. A single per-run budget
// (PALADIN_MAX_EMAILS_PER_RUN, default 50) caps total emails; anything capped is
// retried by the next run because nothing is recorded for it.
async function handle(request: NextRequest) {
  const authorization = checkCronAuthorization(
    request.headers.get("authorization"),
    process.env.CRON_SECRET
  );

  if (authorization === "unconfigured") {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured (minimum 16 characters)." },
      { status: 503 }
    );
  }

  if (authorization !== "ok") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const dryRun = request.nextUrl.searchParams.get("dryRun") === "1";
  const budget = createSendBudget(getMaxEmailsPerRun());

  try {
    const renewal = await runRenewalRemindersWithPrisma({ budget, dryRun });
    const calendar = await runComplianceRemindersWithPrisma({ budget, dryRun });
    const summary = {
      calendar,
      capped: budget.capped,
      dryRun,
      emailConfigured: renewal.emailConfigured,
      renewal,
    };

    logOperationalEvent("info", "daily_cron_run", {
      calendarSent: calendar.sent,
      capped: budget.capped,
      dryRun,
      failed: calendar.failed + renewal.failed,
      renewalSent: renewal.sent,
    });

    if (!renewal.emailConfigured && !dryRun) {
      return NextResponse.json(
        { ...summary, error: "No email provider is configured; nothing was sent." },
        { status: 503 }
      );
    }

    return NextResponse.json(summary);
  } catch (error) {
    logOperationalEvent("error", "daily_cron_failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json({ error: "Daily job failed." }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
