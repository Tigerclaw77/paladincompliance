import { NextRequest, NextResponse } from "next/server";
import { checkCronAuthorization } from "@/lib/paladin/benefits/cronAuth";
import {
  getMaxEmailsPerRun,
  runRenewalRemindersWithPrisma,
} from "@/lib/paladin/benefits/server";
import { createSendBudget } from "@/lib/paladin/benefits/types";
import { logOperationalEvent } from "@/lib/paladin/logging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Legacy single-job endpoint (renewal notices only). Prefer /api/cron/daily.
// See docs/SUBSCRIBER_BENEFITS.md for scheduling options. Authenticate with
// `Authorization: Bearer $CRON_SECRET`. Add `?dryRun=1` to preview.
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
  const result = await runRenewalRemindersWithPrisma({
    budget: createSendBudget(getMaxEmailsPerRun()),
    dryRun,
  });

  logOperationalEvent("info", "renewal_reminders_run", { ...result });

  if (!result.emailConfigured && !dryRun) {
    return NextResponse.json(
      { ...result, error: "No email provider is configured; nothing was sent." },
      { status: 503 }
    );
  }

  return NextResponse.json(result);
}

export const GET = handle;
export const POST = handle;
