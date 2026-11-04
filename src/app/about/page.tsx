import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — GoodTogether LA",
  description: "Why GoodTogether LA exists and what it's trying to do.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-stone-900">Our mission</h1>
      <p className="mt-6 text-stone-700">
        GoodTogether LA exists to make it easy to find — and actually show up for — real
        volunteer work across Los Angeles. Not a static list of good intentions, but real
        opportunities with real dates, posted either directly by the organizations running
        them or pulled in from the public listings of nonprofits already doing the work
        across the city.
      </p>
      <p className="mt-4 text-stone-700">
        For volunteers, that means being able to search and filter by cause and
        neighborhood, see opportunities on a map, and keep a running record of the hours
        you&apos;ve put in. For nonprofits and community groups, it means a free, simple way to
        post an opportunity and reach people who are actively looking — no cost, no
        middleman.
      </p>
      <p className="mt-4 text-stone-700">
        Los Angeles is a big, sprawling city, and the organizations doing good work in it
        are often hard to find unless you already know where to look. GoodTogether LA is an
        attempt to make that easier.
      </p>
    </div>
  );
}
