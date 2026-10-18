"use client";

import { useMemo, useState } from "react";
import {
  createSlugFromOrganizationName,
  normalizeOrganizationSlug,
} from "@/lib/paladin/slugs";

type OrganizationOnboardingFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  callbackUrl: string;
  errorMessage: string;
  siteUrl: string;
};

export default function OrganizationOnboardingForm({
  action,
  callbackUrl,
  errorMessage,
  siteUrl,
}: OrganizationOnboardingFormProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const siteOrigin = siteUrl.replace(/\/$/, "");
  const previewSlug = useMemo(
    () => slug || createSlugFromOrganizationName(name) || "your-organization",
    [name, slug]
  );

  function handleNameChange(value: string) {
    setName(value);

    if (!slugEdited) {
      setSlug(createSlugFromOrganizationName(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlugEdited(true);
    setSlug(normalizeOrganizationSlug(value));
  }

  return (
    <form action={action} className="relative grid gap-5">
      <input name="callbackUrl" type="hidden" value={callbackUrl} />

      <div>
        <h2 className="text-2xl font-black text-white">
          Organization profile
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Add your organization name and confirm the public registry record URL.
        </p>
      </div>

      <label className="grid gap-2 text-sm font-semibold text-slate-200">
        Organization name
        <input
          className="h-12 rounded-lg border border-white/10 bg-slate-950/70 px-4 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/25"
          maxLength={96}
          name="name"
          onChange={(event) => handleNameChange(event.target.value)}
          placeholder="Acme Dental Group"
          required
          value={name}
        />
      </label>

      <label className="grid gap-2 text-sm font-semibold text-slate-200">
        Registry record slug
        <input
          className="h-12 rounded-lg border border-white/10 bg-slate-950/70 px-4 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/25"
          maxLength={64}
          name="slug"
          onChange={(event) => handleSlugChange(event.target.value)}
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          placeholder="acme-dental-group"
          required
          value={slug}
        />
        <span className="text-xs font-medium leading-5 text-slate-500">
          This becomes your public registry record URL.
        </span>
      </label>

      <div className="rounded-lg border border-blue-300/15 bg-blue-500/10 px-4 py-3">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-200">
          Public registry record preview
        </p>
        <p className="mt-2 break-all text-sm font-semibold text-white">
          {siteOrigin}/verify/{previewSlug}
        </p>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-100">
          {errorMessage}
        </div>
      )}

      <button
        className="h-12 rounded-lg border border-blue-300/20 bg-gradient-to-r from-blue-700 to-blue-500 px-4 text-sm font-black text-white shadow-[0_14px_32px_rgba(37,99,235,0.28)] transition hover:from-blue-600 hover:to-blue-400"
        type="submit"
      >
        Create Organization
      </button>
    </form>
  );
}
