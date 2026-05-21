import Hero from "@/components/Hero";
import PaladinSystem from "@/components/PaladinSystem";

export default function Home() {
  return (
    <main>
      <Hero />
      <PaladinSystem />

      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h2 className="text-2xl font-semibold">
          AI governance works best with a clear record
        </h2>

        <p className="mt-4 text-gray-600">
          Paladin gives you a structured system with documentation, logs, and
          verification without unnecessary operational complexity.
        </p>
      </section>

      <section className="mx-auto grid max-w-5xl gap-8 px-6 py-16 md:grid-cols-3">
        <div>
          <h3 className="text-lg font-semibold">Structured Binder</h3>
          <p className="mt-2 text-gray-600">
            Organized policies and procedures you can actually use.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold">Logs & Records</h3>
          <p className="mt-2 text-gray-600">
            Track incidents, policy updates, and review records.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold">Verification</h3>
          <p className="mt-2 text-gray-600">
            Show when your system was issued and maintained.
          </p>
        </div>
      </section>
    </main>
  );
}
