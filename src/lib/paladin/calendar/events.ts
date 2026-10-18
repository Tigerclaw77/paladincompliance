// Lightweight compliance calendar. Pure date arithmetic (UTC, date-only) so it
// is deterministic and unit tested. Dates are derived from the membership
// period; nothing here is a legal deadline: these are the organization's own
// internal review dates.

export type CalendarEventDefinition = {
  key: string;
  title: string;
  description: string;
  /** Repeat every N months from the period start (first occurrence = N). */
  everyMonths?: number;
  /** Fixed number of days before the period end (single event per period). */
  daysBeforePeriodEnd?: number;
  /** Where in the workspace the task is done. */
  path: string;
};

export const CALENDAR_EVENT_DEFINITIONS: CalendarEventDefinition[] = [
  {
    key: "ai_tool_inventory_review",
    title: "Quarterly AI tool inventory review",
    description:
      "Re-check the list of AI tools in use (including free and personal accounts used for work), who uses them, and what data goes in. Record the review.",
    everyMonths: 3,
    path: "/dashboard/reviews",
  },
  {
    key: "vendor_review",
    title: "Semiannual AI vendor review",
    description:
      "Review each AI vendor's data handling, retention, subprocessor and contract terms for changes. Record the review.",
    everyMonths: 6,
    path: "/dashboard/reviews",
  },
  {
    key: "training_refresh",
    title: "Annual AI training acknowledgments refresh",
    description:
      "Have staff re-read the short AI training modules and record fresh acknowledgments, including new hires.",
    daysBeforePeriodEnd: 30,
    path: "/dashboard/training",
  },
  {
    key: "policy_review",
    title: "Annual AI policy review",
    description:
      "Read the AI policy sections with your leadership, update anything that no longer matches how AI is actually used, and note the review date.",
    daysBeforePeriodEnd: 60,
    path: "/dashboard/updates",
  },
  {
    key: "spend_record_review",
    title: "Annual AI spend record review",
    description:
      "Confirm the year's AI governance spend entries are complete and export the annual summary before renewal.",
    daysBeforePeriodEnd: 45,
    path: "/dashboard/spend-record/annual",
  },
  {
    key: "renewal",
    title: "Membership renewal",
    description:
      "Annual membership renews through Stripe. Review billing details or cancel before this date if you do not want to renew.",
    daysBeforePeriodEnd: 0,
    path: "/dashboard/billing",
  },
];

export type CalendarEvent = {
  key: string;
  title: string;
  description: string;
  path: string;
  /** YYYY-MM-DD */
  dueDate: string;
};

const DAY_MS = 86_400_000;

export function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function parseDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));

  return toDateOnly(date) === value ? date : null;
}

/** Adds calendar months in UTC, clamping to the end of shorter months. */
export function addMonthsUtc(date: Date, months: number) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + months;
  const day = date.getUTCDate();
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  return new Date(Date.UTC(year, month, Math.min(day, lastDay)));
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * Events due on or after `from` and on or before the period end. Needs the
 * membership period; without one there is nothing to schedule.
 */
export function computeCalendar({
  from,
  periodEnd,
  periodStart,
}: {
  from: Date;
  periodEnd: Date | null | undefined;
  periodStart: Date | null | undefined;
}): CalendarEvent[] {
  if (!periodStart || !periodEnd) {
    return [];
  }

  const start = startOfUtcDay(periodStart);
  const end = startOfUtcDay(periodEnd);
  const floor = startOfUtcDay(from);
  const events: CalendarEvent[] = [];

  for (const definition of CALENDAR_EVENT_DEFINITIONS) {
    const dates: Date[] = [];

    if (definition.everyMonths) {
      for (let n = 1; n <= 24; n += 1) {
        const due = addMonthsUtc(start, n * definition.everyMonths);

        if (due.getTime() > end.getTime()) {
          break;
        }

        dates.push(due);
      }
    } else if (definition.daysBeforePeriodEnd !== undefined) {
      dates.push(new Date(end.getTime() - definition.daysBeforePeriodEnd * DAY_MS));
    }

    for (const due of dates) {
      if (due.getTime() >= floor.getTime()) {
        events.push({
          description: definition.description,
          dueDate: toDateOnly(due),
          key: definition.key,
          path: definition.path,
          title: definition.title,
        });
      }
    }
  }

  // The annual review lands on the same day as the period end; keep it unique
  // and sorted by date then definition order.
  return events.sort((a, b) =>
    a.dueDate === b.dueDate ? 0 : a.dueDate < b.dueDate ? -1 : 1
  );
}

export const CALENDAR_REMINDER_LEAD_DAYS = 7;

/** True when `today` is inside [due - lead days, due]. */
export function isReminderDue(dueDate: string, today: Date, leadDays = CALENDAR_REMINDER_LEAD_DAYS) {
  const due = parseDateOnly(dueDate);

  if (!due) {
    return false;
  }

  const t = startOfUtcDay(today).getTime();

  return t >= due.getTime() - leadDays * DAY_MS && t <= due.getTime();
}
