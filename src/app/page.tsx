import Hero from "@/components/Hero";

export default function Home() {
  return (
    <main>
      <Hero />

      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl font-semibold">
          Most organizations have no compliance system
        </h2>

        <p className="mt-4 text-gray-600">
          Paladin gives you a structured system with documentation, logs, and
          verification—without complexity or legal overhead.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-8">
        <div>
          <h3 className="font-semibold text-lg">Structured Binder</h3>
          <p className="text-gray-600 mt-2">
            Organized policies and procedures you can actually use.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-lg">Logs & Records</h3>
          <p className="text-gray-600 mt-2">
            Track training, incidents, and policy reviews.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-lg">Verification</h3>
          <p className="text-gray-600 mt-2">
            Show when your system was issued and maintained.
          </p>
        </div>
      </section>
    </main>
  );
}