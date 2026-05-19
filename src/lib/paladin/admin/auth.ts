import "server-only";

import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";

const adminEmailEnvKeys = ["PALADIN_ADMIN_EMAILS", "ADMIN_EMAILS"] as const;

export type AdminSession = {
  email: string;
  name: string | null;
};

export async function requireAdmin(): Promise<AdminSession> {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();

  if (!email) {
    redirect("/login?callbackUrl=/admin");
  }

  if (!isAdminEmail(email)) {
    notFound();
  }

  return {
    email,
    name: session?.user?.name ?? null,
  };
}

export function isAdminEmail(email: string | null | undefined) {
  if (!email) {
    return false;
  }

  const allowlist = getAdminEmailAllowlist();

  return allowlist.has(email.trim().toLowerCase());
}

export function getAdminEmailAllowlist() {
  return new Set(
    adminEmailEnvKeys
      .flatMap((key) => (process.env[key] ?? "").split(","))
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}
