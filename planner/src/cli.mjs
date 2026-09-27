#!/usr/bin/env node
// Usage: node src/cli.mjs [--demo] [--write] [--days 7] [--start YYYY-MM-DD]
//                         [--config path] [--list-events]

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadConfig, isClassEvent } from "./config.mjs";
import { planSchedule } from "./planner.mjs";
import { googleRoutesTravel, demoTravel } from "./traffic.mjs";
import { getAccessToken, fetchEvents, deleteEvent, createEvent } from "./outlook.mjs";
import { demoEvents } from "./demo.mjs";
import { addDays, atLocal, dateKey, fmtDate, fmtTime } from "./time.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv) {
  const args = { demo: false, write: false, listEvents: false, days: 7, start: null, config: join(root, "config.json") };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--demo") args.demo = true;
    else if (a === "--write") args.write = true;
    else if (a === "--list-events") args.listEvents = true;
    else if (a === "--days") args.days = Number(argv[++i]);
    else if (a === "--start") args.start = argv[++i];
    else if (a === "--config") args.config = argv[++i];
    else throw new Error(`Unknown option ${a}`);
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const config = await loadConfig(args.config, { optional: args.demo });
  const tz = config.timeZone;

  const start = args.start ?? addDays(dateKey(tz, Date.now()), 1);
  const days = Array.from({ length: args.days }, (_, i) => addDays(start, i));
  const rangeStart = atLocal(tz, days[0]);
  const rangeEnd = atLocal(tz, addDays(days[days.length - 1], 1));

  let events;
  let travel;
  let token;
  let previousPlan = [];

  if (args.demo) {
    config.places = { home: "Home (demo)", school: "Campus (demo)" };
    events = demoEvents(days, tz);
    travel = demoTravel(tz);
  } else {
    if (!config.places.home || !config.places.school) throw new Error("Set places.home and places.school in config.json.");
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) throw new Error("Set the GOOGLE_MAPS_API_KEY environment variable (see planner/README.md).");
    travel = googleRoutesTravel(apiKey);

    token = await getAccessToken(config.outlook, join(root, ".outlook-token.json"));
    const raw = await fetchEvents(token, rangeStart, rangeEnd);
    previousPlan = raw.filter((e) => e.categories.includes(config.plannerCategory));
    events = raw
      .filter((e) => !e.categories.includes(config.plannerCategory))
      .filter((e) => !e.isAllDay && !e.isCancelled && e.showAs !== "free")
      .map((e) => ({ ...e, isClass: isClassEvent(e, config) }));
  }

  if (args.listEvents) {
    for (const e of events) {
      console.log(`${e.isClass ? "CLASS" : "     "}  ${fmtDate(dateKey(tz, e.start))} ${fmtTime(tz, e.start)}  ${e.subject}`);
    }
    return;
  }

  const plan = await planSchedule({ days, events, travel, config });
  printPlan(plan, tz);

  if (args.write && !args.demo) {
    console.log(`\nReplacing ${previousPlan.length} earlier planner event(s) in Outlook...`);
    for (const e of previousPlan) await deleteEvent(token, e.id);
    const blocks = plan.days.flatMap((d) => d.blocks);
    for (const b of blocks) await createEvent(token, b, config.plannerCategory);
    console.log(`Added ${blocks.length} event(s) to Outlook with category "${config.plannerCategory}".`);
  } else if (!args.demo) {
    console.log("\nPreview only. Run again with --write to add these to Outlook.");
  }
}

function printPlan(plan, tz) {
  for (const day of plan.days) {
    console.log(`\n${fmtDate(day.date)}`);
    const rows = [
      ...day.existing.map((e) => ({ ...e, mark: " ", title: e.subject })),
      ...day.blocks.map((b) => ({ ...b, mark: "+" })),
    ].sort((a, b) => a.start - b.start);
    if (!rows.length) console.log("  (nothing scheduled)");
    for (const r of rows) {
      const time = `${fmtTime(tz, r.start)}-${fmtTime(tz, r.end)}`.padEnd(19);
      console.log(`  ${r.mark} ${time} ${r.title}${r.note ? `  - ${r.note}` : ""}`);
    }
    const hw = day.blocks.filter((b) => b.kind === "homework").reduce((s, b) => s + (b.end - b.start), 0) / 3_600_000;
    const commute = day.trips.reduce((s, t) => s + t.minutes, 0);
    const summary = [commute ? `${commute} min commuting` : null, hw ? `${hw.toFixed(1)} h homework` : null].filter(Boolean);
    if (summary.length) console.log(`    ${summary.join(", ")}`);
  }
  for (const w of plan.warnings) console.log(`\nWarning: ${w}`);
  console.log("\n(+ = added by the planner)");
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
