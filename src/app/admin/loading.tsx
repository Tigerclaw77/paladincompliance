import SkeletonState from "@/components/ui/SkeletonState";

export default function AdminLoading() {
  return (
    <main className="min-h-[calc(100vh-8rem)] bg-slate-950 px-5 py-6 text-white">
      <div className="mx-auto max-w-7xl">
        <SkeletonState title="Loading admin operations" />
      </div>
    </main>
  );
}
