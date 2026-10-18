import { DISCLAIMER_SHORT } from "@/lib/paladin/copy";

export default function DisclaimerBanner() {
  return (
    <div
      className="w-full border-b border-amber-200/20 bg-[#1a2238] px-4 py-2 text-center text-xs leading-5 text-amber-100"
      role="note"
    >
      <strong className="font-black">Please note:</strong> {DISCLAIMER_SHORT}
    </div>
  );
}
