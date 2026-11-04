import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms — GoodTogether LA",
};

const CONTACT_EMAIL = "goodtogetherapp@gmail.com";
const LAST_UPDATED = "November 2026";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-stone-900">Terms of Service</h1>
      <p className="mt-2 text-sm text-stone-500">Last updated: {LAST_UPDATED}</p>

      <p className="mt-6 text-stone-700">By using GoodTogether LA, you agree to these terms.</p>

      <h2 className="mt-8 text-xl font-semibold text-stone-900">1. Who can use this</h2>
      <p className="mt-3 text-stone-700">
        You must be at least 13 years old. By creating an account, you confirm the
        information you provide is accurate.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-stone-900">2. Your account</h2>
      <p className="mt-3 text-stone-700">
        You&apos;re responsible for keeping your login secure and for activity under your
        account. One account per person or organization.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-stone-900">3. Volunteer opportunities</h2>
      <p className="mt-3 text-stone-700">
        Organizations are responsible for the opportunities they post — accuracy, safety,
        and running the actual activity. GoodTogether LA doesn&apos;t run, supervise, or
        guarantee any opportunity, whether posted directly by an organization or imported
        from a public listing elsewhere. Volunteers participate at their own risk and
        should use their own judgment about any opportunity, just as with any in-person
        activity arranged online.
      </p>
      <p className="mt-3 text-stone-700">
        Opportunities marked as imported link out to where they actually come from —
        signing up happens there, under that site&apos;s own terms, not ours.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-stone-900">4. Your content</h2>
      <p className="mt-3 text-stone-700">
        You own what you post (photos, comments, your bio). By posting it, you give us a
        license to display it on the platform. You&apos;re responsible for what you post —
        don&apos;t post anything you don&apos;t have the right to share, or anything that violates
        these terms.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-stone-900">5. Hours, badges, and the leaderboard</h2>
      <p className="mt-3 text-stone-700">
        Volunteer hours are self-reported — either generated automatically when you sign up
        for and complete a posted opportunity, or logged manually by you. We don&apos;t
        independently verify attendance or hours. Badges and leaderboard rankings are based
        on this self-reported data.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-stone-900">6. Acceptable use</h2>
      <p className="mt-3 text-stone-700">
        Don&apos;t use GoodTogether LA to harass, discriminate against, defraud, or endanger
        anyone; post false opportunities; impersonate someone else; or interfere with the
        platform&apos;s operation. We can remove content or suspend accounts that violate this.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-stone-900">7. Disclaimers</h2>
      <p className="mt-3 text-stone-700">
        GoodTogether LA is provided &quot;as is.&quot; We don&apos;t guarantee the accuracy of listings
        (especially imported ones), the conduct of organizations or volunteers, or that the
        service will be uninterrupted or error-free.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-stone-900">8. Limitation of liability</h2>
      <p className="mt-3 text-stone-700">
        To the extent allowed by law, GoodTogether LA isn&apos;t liable for indirect,
        incidental, or consequential damages arising from your use of the platform or
        participation in any opportunity listed on it.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-stone-900">9. Termination</h2>
      <p className="mt-3 text-stone-700">
        We can suspend or terminate accounts that violate these terms. You can stop using
        the service, or request account deletion, at any time.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-stone-900">10. Changes to these terms</h2>
      <p className="mt-3 text-stone-700">
        We&apos;ll update the date above when these terms change. Continued use after a change
        means you accept the update.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-stone-900">11. Governing law</h2>
      <p className="mt-3 text-stone-700">
        These terms are governed by the laws of the State of California.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-stone-900">12. Contact</h2>
      <p className="mt-3 text-stone-700">
        Questions about these terms:{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-700 hover:underline">
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    </div>
  );
}
