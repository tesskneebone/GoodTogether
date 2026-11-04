# GoodTogether LA

Connect volunteers with volunteer opportunities across Los Angeles. Nonprofits
and community organizations post opportunities; volunteers browse, filter by
cause and neighborhood, and sign up.

## Stack

- [Next.js](https://nextjs.org/) (App Router, TypeScript)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/) (Postgres, Auth, Row Level Security)
- Deployed on [Vercel](https://vercel.com/)

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a [Supabase project](https://supabase.com/dashboard), then open the
   SQL editor and run everything in [`supabase/schema.sql`](./supabase/schema.sql).
   This creates the `profiles`, `opportunities`, and `signups` tables, an
   auto-profile-creation trigger, and Row Level Security policies. Then run,
   in order, each file in [`supabase/migrations`](./supabase/migrations):
   `002_leaderboard_views.sql` (leaderboard views), `003_profile_extras.sql`
   (age/neighborhood/avatar columns + the `avatars` storage bucket),
   `004_leaderboard_avatars.sql` (adds avatars to the leaderboard views),
   and `005_imported_opportunities.sql` (adds support for opportunities
   imported from external sources -- see "Importing opportunities" below).

3. Copy the env template and fill in the values (Supabase project URL/keys,
   optionally an Unsplash key -- see below):

   ```bash
   cp .env.local.example .env.local
   ```

4. Run the dev server:

   ```bash
   npm run dev
   ```

   Visit http://localhost:3000.

By default Supabase requires email confirmation for new accounts. For local
testing, you can disable that under Authentication -> Providers -> Email in
the Supabase dashboard, or check the confirmation email in Supabase's
Authentication -> Users logs / your test inbox.

## How it works

- **Volunteers** sign up, browse `/opportunities` (filterable by cause and LA
  neighborhood), and sign up for a specific opportunity. Their signups are
  listed at `/dashboard`.
- **Organizations** sign up (choosing the "organization" role), then post and
  manage opportunities from `/dashboard` and `/dashboard/new`.
- A Postgres trigger keeps `spots_filled` on each opportunity in sync with
  confirmed signups, and RLS policies ensure orgs can only edit their own
  listings and volunteers can only manage their own signups.
- **Imported opportunities** (see below) show up in the same `/opportunities`
  list with an "Imported" badge; instead of an in-app signup button they link
  out to where the listing actually came from.

## Opportunity photos (Unsplash)

New opportunities -- whether posted by an org or imported -- automatically
get a representative photo via the [Unsplash API](https://unsplash.com/developers),
matched by category (and the listing's title, as a more specific first try).
This is optional: without a key, opportunities just show no photo.

1. Create a free app at [unsplash.com/developers](https://unsplash.com/developers)
   and copy its **Access Key**.
2. Add it to `.env.local` (and to Vercel's environment variables) as
   `UNSPLASH_ACCESS_KEY`.

Per [Unsplash's API guidelines](https://help.unsplash.com/en/articles/2511315-guideline-attribution),
every photo pulled this way is shown with a "Photo by \<name\> on Unsplash"
credit linking back to the photographer -- see `image_credit` /
`image_credit_url` on `opportunities` and where they're rendered in
`src/app/opportunities/[id]/page.tsx`.

## Importing opportunities from external sources

`src/lib/scrape/` is a small, pluggable framework for pulling in listings
from outside GoodTogether LA, so volunteers see more than just what's been
posted natively. Each **adapter** (`src/lib/scrape/adapters/`) knows how to
fetch opportunities from one source; `runImport()` (`run-import.ts`) runs
every *enabled* adapter and upserts the results into `opportunities`, keyed
on `(source, external_id)` so re-running an import updates existing rows
instead of duplicating them.

Two adapter kinds are provided:

- **RSS** (`adapters/rss.ts`) -- the recommended, lowest-risk option. RSS
  feeds exist specifically for syndication, so pulling from one doesn't
  raise the Terms-of-Service concerns that scraping raw HTML does. Many
  nonprofits and city volunteer boards publish a feed for their
  events/opportunities page even without advertising it.
- **HTML** (`adapters/html.ts`) -- a config-driven scraper (CSS selectors
  for title/link/date/description) for a specific site's own listings page.
  It checks `robots.txt` before every fetch and refuses to run against a
  disallowed path, but **that's a courtesy check, not a legal opinion** --
  read the site's actual Terms of Service yourself before enabling an
  adapter against it.

**VolunteerMatch and Idealist are intentionally left disabled** in
`adapters/index.ts`, with a comment explaining why: both are listing
marketplaces whose inventory is their core product, and sites in that
category near-universally prohibit scraping their search results. Pursue
their official partner/API programs instead of scraping either one.

To add a real source, edit `src/lib/scrape/adapters/index.ts` -- either call
`createRssAdapter({...})` with a real feed URL, or `createHtmlAdapter({...})`
with real CSS selectors for a site you've confirmed is okay to pull from,
then add it to the exported `ADAPTERS` array with `enabled: true`.

### Running imports

Imports run via `GET /api/cron/scrape`, authenticated with a `CRON_SECRET`
you set yourself (any random string) as both an env var and the
`Authorization: Bearer <value>` header on the request. Vercel sends that
header automatically for the scheduled run configured in `vercel.json`
(`crons`, currently daily); to trigger one manually:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://your-deployment.vercel.app/api/cron/scrape
```

The route runs server-side with the Supabase **service role** key
(`SUPABASE_SERVICE_ROLE_KEY`, from Project Settings -> API -> service_role
secret in Supabase -- keep this out of version control and never prefix it
with `NEXT_PUBLIC_`), since imported listings have no owning org to satisfy
the normal RLS insert policy.

## Deploying to Vercel

1. Push this repo to GitHub (already done if you're reading this from the repo).
2. In the [Vercel dashboard](https://vercel.com/new), import the GitHub
   repository. Vercel auto-detects the Next.js framework settings.
3. Add the environment variables from `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in the Vercel project's Settings ->
   Environment Variables. Add `UNSPLASH_ACCESS_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   and `CRON_SECRET` there too if you want opportunity photos and the
   scraper cron job working in production.
4. Deploy. Every push to the connected branch will trigger a new deployment.
5. In Supabase, add your Vercel deployment URL (and `http://localhost:3000`
   for local dev) under Authentication -> URL Configuration -> Redirect URLs
   so the email-confirmation link (`/auth/callback`) works correctly.
