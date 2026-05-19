import Link from "next/link";

const footerLinks = [
  { href: "/whats-included", label: "What's Included" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/10 bg-[#0f172a] text-slate-400">
      <div className="mx-auto grid max-w-6xl gap-4 px-6 py-8 text-sm sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="grid gap-1">
          <span>&copy; {new Date().getFullYear()} Paladin Compliance</span>
          <span className="text-xs text-slate-500">
            Operational governance reference materials. Not legal advice.
          </span>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          {footerLinks.map((link) => (
            <Link
              className="font-semibold text-slate-300 transition hover:text-white"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
