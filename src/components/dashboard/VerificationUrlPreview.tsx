import Link from "next/link";

type VerificationUrlPreviewProps = {
  slug: string;
};

export default function VerificationUrlPreview({
  slug,
}: VerificationUrlPreviewProps) {
  return (
    <section className="rounded-2xl border border-blue-300/20 bg-blue-300/10 p-6">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-100">
        Verification URL
      </p>
      <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/70 p-4">
        <p className="break-all font-mono text-sm text-blue-100">
          /verify/{slug}
        </p>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-300">
        This is the public URL customers, vendors, insurers, and partners can
        use to validate the organization record.
      </p>
      <Link
        className="mt-5 inline-flex rounded-lg border border-blue-300/20 bg-gradient-to-r from-blue-700 to-blue-500 px-4 py-3 text-sm font-black text-white shadow-[0_14px_32px_rgba(37,99,235,0.22)]"
        href={`/verify/${slug}`}
      >
        Preview Page
      </Link>
    </section>
  );
}
