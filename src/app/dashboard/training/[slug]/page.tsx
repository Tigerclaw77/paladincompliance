import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PrintButton from "@/components/dashboard/PrintButton";
import LockedFeature from "@/components/entitlements/LockedFeature";
import { logOperationalEvent } from "@/lib/paladin/logging";
import { getMemberAccess } from "@/lib/paladin/memberAccess";
import {
  TRAINING_ACKNOWLEDGMENT_NOTICE,
  getTrainingModule,
  validateAcknowledgmentInput,
} from "@/lib/paladin/training/content";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
};

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-white placeholder:text-slate-500";

async function recordAcknowledgment(formData: FormData) {
  "use server";

  // Organization and role come from the session, never from the form.
  const { canWrite, hasActiveMembership, organization, user } = await getMemberAccess();
  const slug = String(formData.get("moduleSlug") ?? "");
  const back = `/dashboard/training/${encodeURIComponent(slug)}`;
  const trainingModule = getTrainingModule(slug);

  if (!trainingModule) {
    redirect("/dashboard/training");
  }

  if (!hasActiveMembership || !canWrite) {
    redirect(`${back}?error=${encodeURIComponent("Only owners and admins of an active membership can record acknowledgments.")}`);
  }

  const forSelf = formData.get("mode") === "self";
  const parsed = validateAcknowledgmentInput({
    acknowledgedOn: formData.get("acknowledgedOn"),
    moduleSlug: slug,
    personEmail: forSelf ? user.email : formData.get("personEmail"),
    personName: forSelf ? (user.name || formData.get("personName")) : formData.get("personName"),
    personRole: formData.get("personRole"),
  });

  if (!parsed.ok) {
    redirect(`${back}?error=${encodeURIComponent(parsed.error)}`);
  }

  await prisma.trainingAcknowledgment.create({
    data: {
      acknowledgedOn: new Date(`${parsed.value.acknowledgedOn}T00:00:00.000Z`),
      moduleSlug: parsed.value.moduleSlug,
      moduleVersion: trainingModule.version,
      organizationId: organization.id,
      personEmail: parsed.value.personEmail,
      personName: parsed.value.personName,
      personRole: parsed.value.personRole,
      recordedByUserId: user.id,
      selfAcknowledged: forSelf,
    },
  });

  logOperationalEvent("info", "training_acknowledgment_recorded", {
    moduleSlug: slug,
    organizationId: organization.id,
  });

  redirect(`${back}?saved=1`);
}

export default async function TrainingModulePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const trainingModule = getTrainingModule(slug);

  if (!trainingModule) {
    notFound();
  }

  const { canWrite, entitlements, hasActiveMembership, user } = await getMemberAccess();

  if (!hasActiveMembership) {
    return (
      <LockedFeature
        entitlement={entitlements.features.trainingModules}
        title="Training modules become available with an active membership"
      />
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="grid gap-6">
      <header className="rounded-2xl border border-white/10 bg-slate-900/88 p-6 sm:p-8">
        <Link className="text-sm font-bold text-blue-200 hover:text-white" href="/dashboard/training">
          All modules
        </Link>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
          {trainingModule.title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          {trainingModule.summary} About {trainingModule.minutes} minutes. Audience:{" "}
          {trainingModule.audience} Content version {trainingModule.version}.
        </p>
        <div className="mt-4">
          <PrintButton />
        </div>
      </header>

      <article className="grid gap-6 rounded-2xl border border-white/10 bg-slate-900/90 p-6 sm:p-8">
        {trainingModule.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-lg font-black text-white">{section.heading}</h2>
            {section.paragraphs?.map((paragraph) => (
              <p className="mt-3 text-sm leading-7 text-slate-300" key={paragraph}>
                {paragraph}
              </p>
            ))}
            {section.bullets && (
              <ul className="mt-3 grid list-disc gap-2 pl-5 text-sm leading-7 text-slate-300">
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <section>
          <h2 className="text-lg font-black text-white">Check your understanding</h2>
          <p className="mt-2 text-xs text-slate-400">Not graded and not recorded.</p>
          <ol className="mt-3 grid list-decimal gap-3 pl-5 text-sm leading-7 text-slate-300">
            {trainingModule.selfCheck.map((item) => (
              <li key={item.question}>
                {item.question}
                <details className="mt-1">
                  <summary className="cursor-pointer text-xs font-bold text-blue-200">Show answer</summary>
                  <p className="mt-1 text-slate-400">{item.answer}</p>
                </details>
              </li>
            ))}
          </ol>
        </section>
      </article>

      <section className="rounded-2xl border border-white/10 bg-slate-900/90 p-6 sm:p-8 print:hidden">
        <h2 className="text-lg font-black text-white">Acknowledgment</h2>
        <p className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm leading-6 text-slate-200">
          {trainingModule.acknowledgment}
        </p>
        <p className="mt-3 text-xs leading-5 text-slate-400">{TRAINING_ACKNOWLEDGMENT_NOTICE}</p>

        {query.error && (
          <p className="mt-4 rounded-xl border border-red-300/30 bg-red-300/10 p-3 text-sm font-bold text-red-100">
            {query.error}
          </p>
        )}
        {query.saved && (
          <p className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm font-semibold text-emerald-100">
            Acknowledgment recorded.
          </p>
        )}

        {canWrite ? (
          <div className="mt-5 grid gap-6 lg:grid-cols-2">
            <form action={recordAcknowledgment} className="grid gap-3">
              <h3 className="text-sm font-black text-white">I read this module</h3>
              <input name="moduleSlug" type="hidden" value={trainingModule.slug} />
              <input name="mode" type="hidden" value="self" />
              <label className="grid gap-1 text-xs font-bold text-slate-300">
                Your name
                <input className={inputClass} defaultValue={user.name ?? ""} maxLength={120} name="personName" required />
              </label>
              <label className="grid gap-1 text-xs font-bold text-slate-300">
                Role (optional)
                <input className={inputClass} maxLength={120} name="personRole" />
              </label>
              <label className="grid gap-1 text-xs font-bold text-slate-300">
                Date
                <input className={inputClass} defaultValue={today} name="acknowledgedOn" required type="date" />
              </label>
              <button className="w-fit rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-black text-white hover:bg-blue-400" type="submit">
                Record my acknowledgment
              </button>
            </form>

            <form action={recordAcknowledgment} className="grid gap-3">
              <h3 className="text-sm font-black text-white">Record for a staff member</h3>
              <input name="moduleSlug" type="hidden" value={trainingModule.slug} />
              <input name="mode" type="hidden" value="staff" />
              <label className="grid gap-1 text-xs font-bold text-slate-300">
                Name
                <input className={inputClass} maxLength={120} name="personName" required />
              </label>
              <label className="grid gap-1 text-xs font-bold text-slate-300">
                Email (optional)
                <input className={inputClass} maxLength={254} name="personEmail" type="email" />
              </label>
              <label className="grid gap-1 text-xs font-bold text-slate-300">
                Role (optional)
                <input className={inputClass} maxLength={120} name="personRole" />
              </label>
              <label className="grid gap-1 text-xs font-bold text-slate-300">
                Date they read it
                <input className={inputClass} defaultValue={today} name="acknowledgedOn" required type="date" />
              </label>
              <button className="w-fit rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-black text-white hover:bg-blue-400" type="submit">
                Record staff acknowledgment
              </button>
              <p className="text-xs leading-5 text-slate-400">
                Use this after the person has read the module (printed or on
                screen) and confirmed the acknowledgment statement above.
              </p>
            </form>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-400">
            Only owners and admins can record acknowledgments. Ask an owner or
            admin to record yours.
          </p>
        )}
      </section>
    </div>
  );
}
