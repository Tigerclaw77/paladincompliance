import Link from "next/link";
import {
  formatGeneratedDate,
  generateVerificationQrSvg,
} from "@/lib/paladin/qr";
import { getDisplayUrlFromAbsoluteUrl } from "@/lib/paladin/siteUrl";

type VerificationQrCardProps = {
  className?: string;
  downloadHref?: string;
  displayVerificationUrl?: string;
  generatedAt?: Date;
  organizationName: string;
  showDownload?: boolean;
  variant?: "dashboard" | "public";
  verificationUrl: string;
};

export default async function VerificationQrCard({
  className = "",
  downloadHref,
  displayVerificationUrl,
  generatedAt = new Date(),
  organizationName,
  showDownload = false,
  variant = "dashboard",
  verificationUrl,
}: VerificationQrCardProps) {
  const qrSvg = await generateVerificationQrSvg(verificationUrl);
  const isPublic = variant === "public";
  const visibleVerificationUrl =
    displayVerificationUrl ?? getDisplayUrlFromAbsoluteUrl(verificationUrl);

  return (
    <section
      className={`rounded-3xl border border-amber-200/18 bg-amber-200/[0.045] p-7 shadow-[0_24px_80px_rgba(2,6,23,0.30)] sm:p-8 ${className}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-100">
            Registry QR
          </p>
          <h2 className="mt-3 text-2xl font-black text-white">
            {isPublic ? "QR registry lookup" : "Binder-ready registry link"}
          </h2>
          {isPublic && (
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 print-muted">
              The QR code opens this Paladin-hosted registry record so a
              reviewer can confirm this binder was issued to this organization.
            </p>
          )}
        </div>
        {showDownload && downloadHref && (
          <Link
            className="inline-flex rounded-lg border border-amber-200/25 bg-amber-200/10 px-4 py-2.5 text-sm font-black text-amber-100 transition hover:bg-amber-200/15 print:hidden"
            href={downloadHref}
          >
            Download SVG
          </Link>
        )}
      </div>

      <div
        className={`mt-6 rounded-2xl border border-white/10 bg-white p-3 shadow-[0_18px_40px_rgba(2,6,23,0.24)] ${
          isPublic ? "max-w-[300px]" : "max-w-[240px]"
        }`}
      >
        <div
          aria-label={`QR code for ${organizationName} Paladin registry record`}
          className="[&>svg]:h-full [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/45 p-4">
        <p className="text-sm font-black text-white">
          {isPublic
            ? "Registry record link"
            : "Binder issued by Paladin Compliance"}
        </p>
        <p className="mt-2 break-all font-mono text-xs leading-5 text-blue-100">
          {visibleVerificationUrl}
        </p>
        <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
          Generated {formatGeneratedDate(generatedAt)}
        </p>
        {isPublic && (
          <p className="mt-3 text-xs leading-5 text-slate-400 print-muted">
            Registry check: printed or forwarded copies should match this
            Paladin-hosted URL.
          </p>
        )}
      </div>
    </section>
  );
}
