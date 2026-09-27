import { readFile } from "node:fs/promises";

export const DEFAULTS = {
  timeZone: "America/Los_Angeles",
  places: { home: "", school: "" },
  outlook: { clientId: "", tenant: "common" },
  // How to recognize class events in your calendar: any event with one of
  // these Outlook categories, or whose subject contains one of these words.
  classes: { categories: ["Class"], subjectKeywords: ["LEC", "DIS", "LAB", "SEM", "Lecture", "Discussion"] },
  commute: {
    maxDriveMinutes: 40, // above this, take transit instead
    arrivalBufferMinutes: 10, // parking + walking to class
    leaveBufferMinutes: 10, // walking back to the car after class
    searchWindowMinutes: 150, // how far from class time to look for a better departure
    stepMinutes: 15,
    earliestDeparture: "06:30", // never plan to leave home before this
    // Each minute spent waiting (arriving early / staying late) counts as this
    // many minutes of driving. 0.25 = you'd wait 20 extra minutes to save 5 in traffic.
    waitCostPerMinute: 0.25,
  },
  gym: { durationMinutes: 120, daysPerWeek: 4, open: "06:00", close: "22:00" },
  homework: {
    hoursPerDay: 3,
    weekendHoursPerDay: 4,
    earliest: "08:00",
    latest: "22:00",
    minBlockMinutes: 45,
    maxBlockMinutes: 90,
    breakMinutes: 15,
  },
  // Events the planner creates get this Outlook category, so re-running
  // replaces them instead of piling up duplicates.
  plannerCategory: "AutoPlan",
};

function merge(base, over) {
  if (over === undefined) return base;
  if (typeof base !== "object" || base === null || Array.isArray(base)) return over;
  const out = { ...base };
  for (const k of Object.keys(over)) out[k] = merge(base[k], over[k]);
  return out;
}

export async function loadConfig(path, { optional = false } = {}) {
  let user = {};
  try {
    user = JSON.parse(await readFile(path, "utf8"));
  } catch (err) {
    if (!(optional && err.code === "ENOENT")) throw err;
  }
  return merge(DEFAULTS, user);
}

export function isClassEvent(event, config) {
  const cats = new Set(config.classes.categories.map((c) => c.toLowerCase()));
  if (event.categories?.some((c) => cats.has(c.toLowerCase()))) return true;
  return config.classes.subjectKeywords.some((kw) =>
    new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(event.subject),
  );
}
