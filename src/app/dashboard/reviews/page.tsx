import { redirect } from "next/navigation";
import PrintButton from "@/components/dashboard/PrintButton";
import LockedFeature from "@/components/entitlements/LockedFeature";
import { logOperationalEvent } from "@/lib/paladin/logging";
import { getMemberAccess } from "@/lib/paladin/memberAccess";
import {
  CHECKLISTS,
  CHECKLIST_VERSION,
  validateReviewInput,
} from "@/lib/paladin/reviews/checklists";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Recurring reviews" };

type PageProps = { searchParams: Promise<{ error?: string; saved?: string }> };

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-white placeholder:text-slate-500";

async function saveReview(formData: FormData) {
  "use server";

  const { canWrite, hasActiveMembership, organization, user } = await getMemberAccess();

  if (!hasActiveMembership || !canWrite) {
    redirect(`/dashboard/reviews?error=${encodeURIComponent("Only owners and admins of an active membership can save reviews.")}`);
  }

  const parsed = validateReviewInput({
    checkedItemIds: formData.getAll("item"),
    checklistKey: formData.get("checklistKey"),
    notes: formData.get("notes"),
    reviewedOn: formData.get("reviewedOn"),
    reviewerName: formData.get("reviewerName"),
  });

  if (!parsed.ok) {
    redirect(`/dashboard/reviews?error=${encodeURIComponent(parsed.error)}`);
  }

  await prisma.reviewRecord.create({
    data: {
      checklistKey: parsed.value.checklistKey,
      checklistVersion: CHECKLIST_VERSION,
      itemsJson: JSON.stringify(parsed.value.checkedItemIds),
      notes: parsed.value.notes,
      organizationId: organization.id,
      recordedByUserId: user.id,
      reviewedOn: new Date(`${parsed.value.reviewedOn}T00:00:00.000Z`),
      reviewerName: parsed.value.reviewerName,
    },
  });

  logOperationalEvent("info", "review_record_saved", {
    checklistKey: parsed.value.checklistKey,
    organizationId: organization.id,
  });

  redirect("/dashboard/reviews?saved=1");
}

export default async function ReviewsPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const { canWrite, entitlements, hasActiveMembership, organization } = await getMemberAccess();
  const records = hasActiveMembership
    ? await prisma.reviewRecord.findMany({
        orderBy: { reviewedOn: "desc" },
        take: 40,
        where: { organizationId: organization.id },
      })
    : [];
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="grid gap-6">
      <header className="rounded-2xl border border-white/10 bg-slate-900/88 p-6 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200">Reviews</p>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
          Recurring review checklists
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
          Two short checklists to run on the dates in your compliance calendar:
          the AI tool inventory review (quarterly) and the AI vendor review
          (semiannual). Saving a checklist creates a dated record you can show
          a broker, client, or board. It is your own internal record, not an
          audit or certification.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <PrintButton />
          <a
            className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm font-bold text-slate-200 hover:bg-white/[0.09]"
            href="/api/reviews/export"
          >
            Export review records (CSV)
          </a>
        </div>
      </header>

      {query.error && (
        <p className="rounded-xl border border-red-300/30 bg-red-300/10 p-4 text-sm font-bold text-red-100">{query.error}</p>
      )}
      {query.saved && (
        <p className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm font-semibold text-emerald-100">Review saved.</p>
      )}

      {!hasActiveMembership ? (
        <LockedFeature
          entitlement={entitlements.features.downloadableAssets}
          title="Review checklists become available with an active membership"
        />
      ) : (
        <>
          {CHECKLISTS.map((checklist) => (
            <form
              action={saveReview}
              className="grid gap-3 rounded-2xl border border-white/10 bg-slate-900/90 p-6"
              key={checklist.key}
            >
              <input name="checklistKey" type="hidden" value={checklist.key} />
              <h2 className="text-lg font-black text-white">{checklist.title}</h2>
              <p className="text-xs font-bold text-amber-200">{checklist.cadence}</p>
              <p className="text-sm leading-6 text-slate-300">{checklist.purpose}</p>
              <ul className="grid gap-2">
                {checklist.items.map((item) => (
                  <li key={item.id}>
                    <label className="flex items-start gap-2 text-sm leading-6 text-slate-200">
                      <input className="mt-1.5" name="item" type="checkbox" value={item.id} />
                      {item.text}
                    </label>
                  </li>
                ))}
              </ul>
              <label className="grid gap-1 text-xs font-bold text-slate-300">
                Notes (decisions, follow-ups, tools approved or stopped)
                <textarea className={inputClass} maxLength={4000} name="notes" rows={3} />
              </label>
              {canWrite ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="grid gap-1 text-xs font-bold text-slate-300">
                    Reviewer name
                    <input className={inputClass} maxLength={120} name="reviewerName" required />
                  </label>
                  <label className="grid gap-1 text-xs font-bold text-slate-300">
                    Review date
                    <input className={inputClass} defaultValue={today} name="reviewedOn" required type="date" />
                  </label>
                  <div className="flex items-end">
                    <button className="rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-black text-white hover:bg-blue-400 print:hidden" type="submit">
                      Save review record
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">Only owners and admins can save review records.</p>
              )}
            </form>
          ))}

          <section className="rounded-2xl border border-white/10 bg-slate-900/90 p-6">
            <h2 className="text-lg font-black text-white">Saved review records</h2>
            {records.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">None yet.</p>
            ) : (
              <ul className="mt-3 grid gap-2 text-sm text-slate-300">
                {records.map((record) => {
                  const checklist = CHECKLISTS.find((c) => c.key === record.checklistKey);
                  let checked = 0;

                  try {
                    checked = (JSON.parse(record.itemsJson) as string[]).length;
                  } catch {
                    checked = 0;
                  }

                  return (
                    <li className="border-t border-white/10 py-2" key={record.id}>
                      <strong className="text-white">{record.reviewedOn.toISOString().slice(0, 10)}</strong>{" "}
                      {checklist?.title ?? record.checklistKey}: {checked} of {checklist?.items.length ?? "?"} items
                      checked, reviewer {record.reviewerName}
                      {record.notes ? ` (${record.notes.slice(0, 160)})` : ""}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
