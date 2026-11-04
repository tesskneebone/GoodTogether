import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy — GoodTogether LA",
};

const CONTACT_EMAIL = "goodtogetherapp@gmail.com";
const LAST_UPDATED = "November 2026";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-stone-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-stone-500">Last updated: {LAST_UPDATED}</p>

      <p className="mt-6 text-stone-700">
        GoodTogether LA (&quot;we,&quot; &quot;us&quot;) connects volunteers with opportunities across Los
        Angeles. This page explains what information we collect, how we use it, and
        what&apos;s visible to other people on the platform.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-stone-900">Information we collect</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-stone-700">
        <li>
          <span className="font-semibold">Account info:</span> your email and password
          (handled by our authentication provider, Supabase), and whether you&apos;re signing
          up as a volunteer or an organization.
        </li>
        <li>
          <span className="font-semibold">Profile info you add:</span> full name, username,
          bio, age, neighborhood, and a profile photo. For organizations: your
          organization&apos;s name and description.
        </li>
        <li>
          <span className="font-semibold">Activity you log:</span> opportunities you sign up
          for, hours and activities you self-report, photos you attach to a logged
          activity, comments you post, and who you follow.
        </li>
        <li>
          <span className="font-semibold">Usage data:</span> basic technical data (like IP
          address and browser type) collected automatically by our hosting provider,
          Vercel, for security and reliability — we don&apos;t run ad trackers or analytics
          beyond this.
        </li>
      </ul>

      <h2 className="mt-8 text-xl font-semibold text-stone-900">How we use it</h2>
      <p className="mt-3 text-stone-700">
        To run the core features of the site: matching you with opportunities, showing
        your profile and activity to other users, tracking self-reported hours for badges
        and the leaderboard, and letting you follow other volunteers and organizations.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-stone-900">What&apos;s visible to other people</h2>
      <p className="mt-3 text-stone-700">
        GoodTogether LA is a social platform, not a private one. Your username, full name,
        profile photo, neighborhood, bio, logged activities and their photos, comments,
        and follower/following counts are all visible to anyone using the site, logged in
        or not. Your email address is never shown to other users.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-stone-900">Imported opportunity listings</h2>
      <p className="mt-3 text-stone-700">
        Some opportunities come from the public event listings of LA-area nonprofits, not
        from GoodTogether LA accounts. That&apos;s public information about the
        organization&apos;s own programs — nothing about you. Signing up for one of these
        happens on the organization&apos;s own site, under their own privacy policy, not ours.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-stone-900">Third-party services we use</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-stone-700">
        <li>
          <span className="font-semibold">Supabase</span> — authentication, database, and
          file storage.
        </li>
        <li>
          <span className="font-semibold">Vercel</span> — hosting.
        </li>
        <li>
          <span className="font-semibold">Unsplash</span> — stock photography shown on some
          opportunity listings (not connected to your account).
        </li>
      </ul>
      <p className="mt-3 text-stone-700">
        We don&apos;t sell your information, and we don&apos;t share it with advertisers.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-stone-900">Data retention and deletion</h2>
      <p className="mt-3 text-stone-700">
        We keep your account data as long as your account is active. To delete your
        account and associated data, email us at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-700 hover:underline">
          {CONTACT_EMAIL}
        </a>{" "}
        — we don&apos;t yet have a self-service delete button, but we&apos;ll process the request
        promptly.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-stone-900">Children&apos;s privacy</h2>
      <p className="mt-3 text-stone-700">
        GoodTogether LA is intended for people 13 and older. We don&apos;t knowingly collect
        information from children under 13.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-stone-900">Security</h2>
      <p className="mt-3 text-stone-700">
        We rely on our infrastructure providers&apos; security practices (Supabase, Vercel) and
        standard protections like password hashing and row-level database access controls.
        No system is perfectly secure, so we can&apos;t guarantee absolute security.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-stone-900">Changes to this policy</h2>
      <p className="mt-3 text-stone-700">
        If we make material changes, we&apos;ll update the date at the top of this page.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-stone-900">Contact</h2>
      <p className="mt-3 text-stone-700">
        Questions about this policy:{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-700 hover:underline">
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    </div>
  );
}
