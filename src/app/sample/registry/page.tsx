import type { Metadata } from "next";
import Link from "next/link";
import RegistryRecordView from "@/components/verification/RegistryRecordView";
import { getSampleRegistryProps } from "@/lib/paladin/sampleRegistry";

const SITE_URL = "https://www.paladincompliance.com";

export const metadata: Metadata = {
  title: "Sample Registry Record",
  description:
    "A clearly labeled SAMPLE of the public registry record and QR lookup page, using fictitious data.",
  alternates: { canonical: "/sample/registry" },
  robots: { index: false, follow: true },
};

export default function SampleRegistryPage() {
  return (
    <>
      <div className="bg-slate-950 px-4 pt-6 text-center text-sm text-slate-300 sm:px-6">
        This is what a buyer&apos;s public registry record and QR lookup page
        looks like.{" "}
        <Link className="font-bold text-amber-200 underline" href="/sample">
          See the sample binder contents
        </Link>
        .
      </div>
      <RegistryRecordView {...getSampleRegistryProps(SITE_URL)} />
    </>
  );
}
