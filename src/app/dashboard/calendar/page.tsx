import Link from "next/link";
import LockedFeature from "@/components/entitlements/LockedFeature";
import { computeCalendar } from "@/lib/paladin/calendar/events";
import { getMemberAccess } from "@/lib/paladin/memberAccess";

export const metadata = { title: "Compliance calendar" };

export default async function CalendarPage() {
  const { entitlements, hasActiveMembership, organization } = await getMemberAccess();
  const subscription = organization.subscription;
  const events = hasActiveMembership
    ? computeCalendar({
        from: new Date(),
        periodEnd: subscription?.currentPeriodEnd,
        periodStart: subscription?.currentPeriodStart,
      })
    : [];

  return (
    <div className="grid gap-6">
      <header className="rounded-2xl border border-white/10 bg-slate-900/88 p-6 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200">
          Calendar
        </p>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
          Compliance calendar
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
          Your organization&apos;s own review dates for the current membership
          year: AI tool inventory, vendor review, training acknowledgments,
          policy review and the annual spend record. These are suggested
          internal dates, not legal deadlines. Owners and admins get one email
          reminder about a week before each date (not for the renewal, which has
          its own billing notice). Reminder emails have an opt-out link.
        </p>
        {hasActiveMembership && events.length > 0 && (
          <a
            className="mt-5 inline-block rounded-lg border border-blue-300/20 bg-blue-500/20 px-4 py-2.5 text-sm font-black text-blue-100 hover:bg-blue-500/30"
            href="/api/calendar/ics"
          >
            Download calendar file (.ics)
          </a>
        )}
      </header>

      {!hasActiveMembership ? (
        <LockedFeature
          entitlement={entitlements.features.downloadableAssets}
          title="The compliance calendar becomes available with an active membership"
        />
      ) : events.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-300">
          No upcoming dates yet. The calendar appears once billing has recorded
          your membership period.
        </p>
      ) : (
        <section className="rounded-2xl border border-white/10 bg-slate-900/90 p-6">
          <ol className="grid gap-3">
            {events.map((event) => (
              <li
                className="rounded-xl border border-white/10 bg-white/[0.04] p-4"
                key={`${event.key}-${event.dueDate}`}
              >
                <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-200">
                  {event.dueDate}
                </p>
                <p className="mt-1 text-sm font-black text-white">{event.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {event.description}
                </p>
                <Link
                  className="mt-2 inline-block text-sm font-bold text-blue-200 hover:text-white"
                  href={event.path}
                >
                  Open
                </Link>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            Dates are derived from your membership period and move when the
            membership renews. Importing the .ics file adds a one-day-before alert
            in most calendar apps; it is a one-time export, so download it again
            after renewal.
          </p>
        </section>
      )}
    </div>
  );
}
