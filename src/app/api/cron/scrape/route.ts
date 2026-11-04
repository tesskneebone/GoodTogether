import { NextResponse } from "next/server";
import { runImport } from "@/lib/scrape/run-import";
import { ADAPTERS } from "@/lib/scrape/adapters";

// Serverless function time budget for the scrape run (seconds).
export const maxDuration = 60;

/**
 * Invoked by Vercel Cron (see the "crons" entry in vercel.json). Vercel
 * automatically sends `Authorization: Bearer $CRON_SECRET` on scheduled
 * invocations, which is what's checked below -- set CRON_SECRET in the
 * Vercel project's environment variables to any random string.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summaries = await runImport(ADAPTERS);
  return NextResponse.json({ ranAt: new Date().toISOString(), summaries });
}
