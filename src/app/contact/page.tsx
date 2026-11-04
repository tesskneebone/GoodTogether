import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — GoodTogether LA",
  description: "Get in touch with GoodTogether LA.",
};

const CONTACT_EMAIL = "goodtogetherapp@gmail.com";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-stone-900">Get in touch</h1>
      <p className="mt-6 text-stone-700">
        Running a nonprofit or community group in LA and want your opportunities listed?
        Found a listing that looks wrong, or a site you think we should pull in? Running
        into a bug, or just have feedback? We want to hear from it.
      </p>

      <ul className="mt-6 space-y-3 text-stone-700">
        <li>
          <span className="font-semibold text-stone-900">General questions, feedback, bug reports:</span>{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-700 hover:underline">
            {CONTACT_EMAIL}
          </a>
        </li>
        <li>
          <span className="font-semibold text-stone-900">Get your organization listed:</span> same
          email — tell us a bit about your org and we&apos;ll follow up.
        </li>
        <li>
          <span className="font-semibold text-stone-900">Report a problem with a listing or a user:</span>{" "}
          same email, with a link to what you&apos;re reporting.
        </li>
      </ul>

      <p className="mt-6 text-sm text-stone-500">
        GoodTogether LA is a small, independent project — response times may vary, but
        every message gets read.
      </p>
    </div>
  );
}
