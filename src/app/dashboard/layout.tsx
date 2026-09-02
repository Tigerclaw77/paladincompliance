import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { getCurrentOrganization } from "@/lib/paladin/currentOrganization";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { organization } = await getCurrentOrganization();
  const verificationSlug = organization.verificationPage?.slug ?? organization.slug;

  return (
    <main className="min-h-[calc(100vh-8rem)] bg-slate-950 px-5 py-6 text-white">
      <div className="absolute inset-x-0 top-16 -z-0 h-96 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.24),transparent_34%),radial-gradient(circle_at_top_right,rgba(198,168,91,0.12),transparent_28%)]" />
      <div className="relative mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <DashboardSidebar
          organizationName={organization.name}
          verificationSlug={verificationSlug}
        />
        <section className="min-w-0">{children}</section>
      </div>
    </main>
  );
}
