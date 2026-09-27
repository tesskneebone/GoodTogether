import { test } from "node:test";
import assert from "node:assert/strict";
import { planSchedule } from "../src/planner.mjs";
import { DEFAULTS } from "../src/config.mjs";
import { atLocal, addDays, localParts, MIN } from "../src/time.mjs";
import { demoTravel } from "../src/traffic.mjs";

const TZ = "America/Los_Angeles";
// A Monday comfortably in the future so departures aren't filtered as "past".
const MONDAY = "2031-09-29";

const config = (over = {}) => ({
  ...DEFAULTS,
  ...over,
  places: { home: "home", school: "school" },
  gym: { ...DEFAULTS.gym, ...over.gym },
  commute: { ...DEFAULTS.commute, ...over.commute },
});
const cls = (date, s, e, subject = "LEC") => ({
  subject,
  start: atLocal(TZ, date, s),
  end: atLocal(TZ, date, e),
  isClass: true,
});
const hhmm = (t) => {
  const p = localParts(TZ, t);
  return `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
};

test("atLocal handles DST changes", () => {
  assert.equal(new Date(atLocal(TZ, "2031-07-01", "09:00")).toISOString(), "2031-07-01T16:00:00.000Z");
  assert.equal(new Date(atLocal(TZ, "2031-12-01", "09:00")).toISOString(), "2031-12-01T17:00:00.000Z");
});

test("drives at a time that dodges rush hour when the drive fits the limit", async () => {
  const plan = await planSchedule({
    days: [MONDAY],
    events: [cls(MONDAY, "10:00", "11:00")],
    travel: demoTravel(TZ),
    config: config({ gym: { daysPerWeek: 0 } }),
  });
  const toSchool = plan.days[0].trips.find((t) => t.label === "school");
  assert.equal(toSchool.mode, "drive");
  assert.ok(toSchool.minutes <= 40);
  assert.ok(toSchool.arrive <= atLocal(TZ, MONDAY, "09:50"));
});

test("takes transit when every drive would exceed 40 minutes", async () => {
  const alwaysJammed = async ({ mode }) => (mode === "drive" ? 55 : 45);
  const plan = await planSchedule({
    days: [MONDAY],
    events: [cls(MONDAY, "10:00", "11:00")],
    travel: alwaysJammed,
    config: config({ gym: { daysPerWeek: 0 } }),
  });
  const trips = plan.days[0].trips;
  assert.deepEqual(trips.map((t) => t.mode), ["transit", "transit"]);
  assert.equal(trips[0].arrive, atLocal(TZ, MONDAY, "09:50"));
  const titles = plan.days[0].blocks.map((b) => b.title);
  assert.ok(titles.includes("Transit to school") && titles.includes("Transit home"));
});

test("puts the gym after a late class to skip evening rush hour", async () => {
  const plan = await planSchedule({
    days: [MONDAY],
    events: [cls(MONDAY, "15:30", "17:00")],
    travel: demoTravel(TZ),
    config: config({ gym: { daysPerWeek: 1 } }),
  });
  const gym = plan.days[0].blocks.find((b) => b.kind === "gym");
  assert.equal(hhmm(gym.start), "17:00");
  assert.equal(gym.end - gym.start, 120 * MIN);
  const home = plan.days[0].trips.find((t) => t.label === "home");
  assert.ok(home.depart >= gym.end);
  assert.ok(home.minutes <= 40);
});

test("limits gym sessions per week and never overlaps anything", async () => {
  const days = Array.from({ length: 7 }, (_, i) => addDays(MONDAY, i));
  const events = days.slice(0, 5).flatMap((d) => [cls(d, "10:00", "11:50"), cls(d, "14:00", "15:00")]);
  const plan = await planSchedule({
    days,
    events,
    travel: demoTravel(TZ),
    config: config({ gym: { daysPerWeek: 3 } }),
  });
  const all = plan.days.flatMap((d) => d.blocks);
  assert.equal(all.filter((b) => b.kind === "gym").length, 3);

  for (const day of plan.days) {
    const items = [...day.existing, ...day.blocks].sort((a, b) => a.start - b.start);
    for (let i = 1; i < items.length; i++) {
      assert.ok(items[i].start >= items[i - 1].end, `overlap on ${day.date}: ${items[i - 1].title ?? items[i - 1].subject} / ${items[i].title}`);
    }
  }
});

test("fills the daily homework target inside the homework window", async () => {
  const plan = await planSchedule({
    days: [MONDAY],
    events: [cls(MONDAY, "10:00", "11:50")],
    travel: demoTravel(TZ),
    config: config({ gym: { daysPerWeek: 0 } }),
  });
  const hw = plan.days[0].blocks.filter((b) => b.kind === "homework");
  const total = hw.reduce((s, b) => s + (b.end - b.start), 0);
  assert.equal(total, 3 * 60 * MIN);
  for (const b of hw) {
    assert.ok(hhmm(b.start) >= "08:00" && hhmm(b.end) <= "22:00");
  }
});
