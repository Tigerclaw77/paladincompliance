import Link from "next/link";
import type { DownloadableAsset } from "@prisma/client";
import EmptyState from "@/components/ui/EmptyState";

type AssetValue = Pick<
  DownloadableAsset,
  | "assetType"
  | "createdAt"
  | "description"
  | "filename"
  | "id"
  | "mimeType"
  | "sizeBytes"
  | "title"
>;

type DownloadableAssetsSectionProps = {
  assets: AssetValue[];
  downloadsEnabled?: boolean;
  manageHref?: string;
};

export default function DownloadableAssetsSection({
  assets,
  downloadsEnabled = true,
  manageHref,
}: DownloadableAssetsSectionProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/90 p-6 shadow-[0_22px_70px_rgba(2,6,23,0.34)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">
            Downloadable Assets
          </p>
          <h2 className="mt-3 text-2xl font-black text-white">
            Quick-reference records and registry downloads
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            Protected organization files: the 13-page quick-reference record,
            registry records, and QR packs. The full binder is the printed copy.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-full border border-amber-200/25 bg-amber-200/10 px-3 py-1 text-xs font-black text-amber-100">
            {assets.length} available
          </div>
          {!downloadsEnabled && (
            <div className="rounded-full border border-slate-400/25 bg-slate-400/10 px-3 py-1 text-xs font-black text-slate-200">
              Available After Activation
            </div>
          )}
          {manageHref && (
            <Link
              className="rounded-lg border border-blue-300/20 bg-blue-400/10 px-3 py-2 text-xs font-black text-blue-100 transition hover:bg-blue-400/15"
              href={manageHref}
            >
              Manage Assets
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        {assets.length > 0 ? (
          assets.map((asset) => (
            <AssetRow
              asset={asset}
              downloadsEnabled={downloadsEnabled}
              key={asset.id}
            />
          ))
        ) : (
          <EmptyState
            message="Registry record assets will appear here once an active subscription is in place."
            title="Registry record assets pending"
          />
        )}
      </div>
    </section>
  );
}

function AssetRow({
  asset,
  downloadsEnabled,
}: {
  asset: AssetValue;
  downloadsEnabled: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-black text-white">{asset.title}</p>
            <span className="rounded-full border border-blue-300/20 bg-blue-300/10 px-2 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-blue-100">
              {asset.assetType}
            </span>
          </div>
          {asset.description && (
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {asset.description}
            </p>
          )}
          <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-400">
            <AssetMeta label="Filename" value={asset.filename || "Untitled"} />
            <AssetMeta label="Type" value={asset.mimeType} />
            <AssetMeta label="Size" value={formatBytes(asset.sizeBytes)} />
            <AssetMeta label="Created" value={formatDisplayDate(asset.createdAt)} />
          </dl>
        </div>
        {downloadsEnabled ? (
          <Link
            className="inline-flex justify-center rounded-lg border border-amber-200/25 bg-amber-200/10 px-4 py-2.5 text-sm font-black text-amber-100 transition hover:bg-amber-200/15"
            href={`/api/assets/${asset.id}/download`}
          >
            Download
          </Link>
        ) : (
          <span className="inline-flex justify-center rounded-lg border border-slate-400/20 bg-slate-400/10 px-4 py-2.5 text-sm font-black text-slate-300">
            Activation Required
          </span>
        )}
      </div>
    </div>
  );
}

function AssetMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 break-all font-mono text-slate-300">{value}</dd>
    </div>
  );
}

function formatDisplayDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatBytes(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}
