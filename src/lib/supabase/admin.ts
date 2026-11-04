import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Service-role Supabase client for server-only jobs (the scraper import).
 * Bypasses Row Level Security, so this must never be imported from any
 * client component or route that isn't locked down (see api/cron/scrape).
 * Requires SUPABASE_SERVICE_ROLE_KEY (from Supabase Project Settings ->
 * API -> service_role secret) -- never prefix this env var with
 * NEXT_PUBLIC_ or it will be bundled into client JS.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for admin client"
    );
  }

  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
