import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms — GoodTogether LA",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-stone-900">Terms</h1>
      <p className="mt-6 text-stone-700">
        Full terms of service are coming soon. In the meantime: GoodTogether LA is a
        directory connecting volunteers with opportunities posted directly by
        organizations or sourced from their own public listings. We don&apos;t run the
        opportunities themselves, and the organization or site listed for each one is
        responsible for what actually happens there.
      </p>
      <p className="mt-4 text-stone-700">
        For opportunities marked as pulled in from another site, signing up happens on
        that site, not here — please review their own terms before doing so.
      </p>
    </div>
  );
}
