import Link from "next/link";
import { auth, signOut } from "@/auth";

export default async function Header() {
  const session = await auth();
  const isAuthenticated = Boolean(session?.user);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0f172a] text-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-1 text-[15px] font-semibold tracking-tight"
        >
          <span className="text-white">Paladin</span>
          <span className="bg-gradient-to-r from-[#c6a85b] to-[#e7d39f] bg-clip-text text-transparent">
            Compliance
          </span>
        </Link>

        <nav className="flex shrink-0 items-center gap-3 text-sm sm:gap-6">
          <Link
            href="/pricing"
            className="text-gray-300 hover:text-white transition-colors"
          >
            Pricing
          </Link>

          <Link
            href="/contact"
            className="hidden sm:inline text-gray-300 hover:text-white transition-colors"
          >
            Contact
          </Link>

          {isAuthenticated ? <AuthenticatedNav /> : <AnonymousNav />}
        </nav>
      </div>

      <div className="h-[1px] bg-gradient-to-r from-transparent via-[#3b82f6]/40 to-transparent" />
    </header>
  );
}

function AnonymousNav() {
  return (
    <Link
      href="/login"
      className="hidden rounded-md bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] px-3 py-2 text-white transition hover:opacity-90 sm:inline-flex sm:px-4"
    >
      Login
    </Link>
  );
}

function AuthenticatedNav() {
  return (
    <div className="flex items-center gap-3">
      <Link
        href="/dashboard"
        className="text-gray-300 hover:text-white transition-colors"
      >
        Dashboard
      </Link>
      <Link
        href="/dashboard/settings"
        className="hidden text-gray-300 transition-colors hover:text-white sm:inline"
      >
        Account
      </Link>
      <form action={signOutAction} className="hidden sm:block">
        <button
          className="rounded-md bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] px-3 py-2 text-white transition hover:opacity-90 sm:px-4"
          type="submit"
        >
          Sign Out
        </button>
      </form>
    </div>
  );
}

async function signOutAction() {
  "use server";

  await signOut({
    redirectTo: "/login",
  });
}
