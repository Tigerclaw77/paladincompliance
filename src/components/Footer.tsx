export default function Footer() {
  return (
    <footer className="w-full border-t mt-20">
      <div className="max-w-6xl mx-auto px-6 py-8 text-sm text-gray-500 flex justify-between">
        <span>© {new Date().getFullYear()} Paladin Compliance</span>
        <span>Not legal advice</span>
      </div>
    </footer>
  );
}