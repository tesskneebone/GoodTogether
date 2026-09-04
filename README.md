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
   (age/neighborhood/avatar columns + the `avatars` storage bucket), and
   `004_leaderboard_avatars.sql` (adds avatars to the leaderboard views).

3. Copy the env template and fill in your Supabase project's URL and anon key
   (Project Settings -> API in the Supabase dashboard):

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

## Deploying to Vercel

1. Push this repo to GitHub (already done if you're reading this from the repo).
2. In the [Vercel dashboard](https://vercel.com/new), import the GitHub
   repository. Vercel auto-detects the Next.js framework settings.
3. Add the environment variables from `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in the Vercel project's Settings ->
   Environment Variables.
4. Deploy. Every push to the connected branch will trigger a new deployment.
5. In Supabase, add your Vercel deployment URL (and `http://localhost:3000`
   for local dev) under Authentication -> URL Configuration -> Redirect URLs
   so the email-confirmation link (`/auth/callback`) works correctly.
