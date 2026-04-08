"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full border-b bg-white">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg">
          Paladin Compliance
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          <Link href="/pricing" className="hover:opacity-70">
            Pricing
          </Link>
          <Link href="/contact" className="hover:opacity-70">
            Contact
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 rounded-md border hover:bg-gray-50"
          >
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}