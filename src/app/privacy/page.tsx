import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy — GoodTogether LA",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-stone-900">Privacy</h1>
      <p className="mt-6 text-stone-700">
        A full privacy policy is coming soon. In short: account information (your name,
        email, and anything you add to your profile) is used to run the volunteer
        matching and hour-tracking features on this site, and isn&apos;t sold or shared with
        anyone outside of that.
      </p>
      <p className="mt-4 text-stone-700">
        Some opportunity listings are pulled in from the public event pages of LA-area
        nonprofits; that&apos;s sourced, public information about their own volunteer
        programs, not anything about you as a visitor.
      </p>
    </div>
  );
}
