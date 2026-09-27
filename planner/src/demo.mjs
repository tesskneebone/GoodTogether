// A sample class schedule for --demo, so you can see the planner work before
// connecting Outlook or Google Maps.

import { atLocal, weekdayOf } from "./time.mjs";

const SCHEDULE = {
  1: [["COM SCI 31 - LEC", "10:00", "11:50"], ["MATH 32A - DIS", "14:00", "14:50"]],
  2: [["PHYSICS 1A - LEC", "09:00", "10:15"], ["PHYSICS 1A - LAB", "12:00", "14:50"]],
  3: [["COM SCI 31 - LEC", "10:00", "11:50"], ["MATH 32A - LEC", "13:00", "13:50"]],
  4: [["PHYSICS 1A - LEC", "09:00", "10:15"], ["ENGCOMP 3 - SEM", "15:30", "17:20"]],
  5: [["MATH 32A - LEC", "11:00", "11:50"]],
};

const OTHER = {
  3: [["Dinner with family", "18:30", "19:30"]],
  6: [["Shift at work", "10:00", "15:00"]],
};

export function demoEvents(days, tz) {
  const events = [];
  for (const date of days) {
    const wd = weekdayOf(date);
    for (const [subject, s, e] of SCHEDULE[wd] ?? []) {
      events.push({ subject, start: atLocal(tz, date, s), end: atLocal(tz, date, e), isClass: true });
    }
    for (const [subject, s, e] of OTHER[wd] ?? []) {
      events.push({ subject, start: atLocal(tz, date, s), end: atLocal(tz, date, e), isClass: false });
    }
  }
  return events;
}
