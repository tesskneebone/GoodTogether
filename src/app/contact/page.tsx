import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — GoodTogether LA",
  description: "Get in touch with GoodTogether LA.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-stone-900">Get in touch</h1>
      <p className="mt-6 text-stone-700">
        Running a nonprofit or community group in LA and want your opportunities listed?
        Found a listing that looks wrong, or a site you think we should include? Just have
        feedback on the platform? We&apos;d like to hear from you.
      </p>
      <p className="mt-4 text-stone-700">
        A dedicated contact channel is coming soon — in the meantime, reach out to whoever
        shared this site with you, or check back here shortly.
      </p>
    </div>
  );
}
