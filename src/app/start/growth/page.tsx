import { redirect } from "next/navigation";

type LegacyOperationalCompatibilityPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LegacyOperationalCompatibilityPage({
  searchParams,
}: LegacyOperationalCompatibilityPageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      value.forEach((entry) => query.append(key, entry));
    } else if (value) {
      query.set(key, value);
    }
  }

  const queryString = query.toString();

  redirect(`/start/operational${queryString ? `?${queryString}` : ""}`);
}
