import VerificationStatusBadge from "@/components/verification/VerificationStatusBadge";
import {
  formatDisplayDate,
  getStatusLabel,
  type VerificationLifecycle,
} from "@/lib/paladin/verification";

type OrganizationStatusCardsProps = {
  activeThroughDate: Date | null | undefined;
  assetCount: number;
  lifecycle: VerificationLifecycle;
  subscriptionStatus: string | null | undefined;
  verificationStatus: string | null | undefined;
};

export default function OrganizationStatusCards({
  activeThroughDate,
  assetCount,
  lifecycle,
  subscriptionStatus,
  verificationStatus,
}: OrganizationStatusCardsProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatusCard label="Registry Record">
        <VerificationStatusBadge lifecycle={lifecycle} status={verificationStatus} />
      </StatusCard>
      <StatusCard label="Subscription">
        <p className="text-2xl font-black capitalize text-white">
          {getStatusLabel(subscriptionStatus) || "Prepared"}
        </p>
      </StatusCard>
      <StatusCard label="Active Through">
        <p className="text-2xl font-black text-white">
          {formatDisplayDate(activeThroughDate)}
        </p>
      </StatusCard>
      <StatusCard label="Assets">
        <p className="text-2xl font-black text-white">{assetCount}</p>
      </StatusCard>
    </section>
  );
}

function StatusCard({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/90 p-5 shadow-[0_18px_50px_rgba(2,6,23,0.28)]">
      <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      {children}
    </div>
  );
}
