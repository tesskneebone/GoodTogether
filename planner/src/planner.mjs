// The scheduling logic. Pure apart from the injected `travel` function, so it
// can be tested with a fake traffic model.
//
// travel({ mode: "drive" | "transit", from, to, departAt?, arriveBy? })
//   resolves to trip minutes, or null when no estimate is available.

import { MIN, atLocal, dayBounds, localParts, weekKey, weekdayOf } from "./time.mjs";

const byStart = (a, b) => a.start - b.start;
const overlaps = (a, b) => a.start < b.end && b.start < a.end;

/**
 * @param {object} args
 * @param {string[]} args.days       "YYYY-MM-DD" dates to plan
 * @param {Array<{subject: string, start: number, end: number, isClass: boolean}>} args.events
 *        existing busy calendar events (planner-created events already removed)
 * @param {Function} args.travel
 * @param {object} args.config
 */
export async function planSchedule({ days, events, travel, config }) {
  const memo = new Map();
  const ctx = {
    config,
    tz: config.timeZone,
    warnings: [],
    travel(q) {
      const key = JSON.stringify(q);
      if (!memo.has(key)) memo.set(key, Promise.resolve(travel(q)).catch(() => null));
      return memo.get(key);
    },
  };

  const infos = [];
  for (const date of days) {
    const [ds, de] = dayBounds(ctx.tz, date);
    const dayEvents = events.filter((e) => e.end > ds && e.start < de).sort(byStart);
    const classes = dayEvents.filter((e) => e.isClass);
    const info = { date, dayEvents, classes, options: null };
    if (classes.length) info.options = await schoolDayOptions(ctx, info);
    infos.push(info);
  }

  const gymDays = chooseGymDays(ctx, infos);

  const planned = infos.map((info) => {
    let blocks = [];
    let trips = [];
    if (info.options) {
      const opt = gymDays.has(info.date) ? info.options.gym : info.options.base;
      blocks = opt.blocks;
      trips = [opt.toSchool, opt.toHome].filter(Boolean);
    }
    blocks = [...blocks, ...fillHomework(ctx, info, blocks, trips)].sort(byStart);
    return { date: info.date, existing: info.dayEvents, blocks, trips };
  });

  return { days: planned, warnings: ctx.warnings };
}

// Build the commute plan for a school day, both without the gym and with the
// best-placed gym session, so the week-level pass can pick which days get gym.
async function schoolDayOptions(ctx, info) {
  const { config, tz } = ctx;
  const c = config.commute;
  const g = config.gym;
  const first = info.classes[0].start;
  const last = Math.max(...info.classes.map((e) => e.end));
  const defaultArriveBy = first - c.arrivalBufferMinutes * MIN;
  const defaultLeaveAfter = last + c.leaveBufferMinutes * MIN;

  const base = await buildOption(ctx, {
    arriveBy: defaultArriveBy,
    leaveAfter: defaultLeaveAfter,
    gym: null,
    required: true,
  });

  // Gym candidates, in order of preference when commute cost ties: after the
  // last class (doubles as a way to wait out evening traffic), in a gap between
  // classes, or before the first class.
  const gymMs = g.durationMinutes * MIN;
  const candidates = [{ start: last, end: last + gymMs, where: "after" }];
  let cursor = first;
  for (const e of info.dayEvents.filter((e) => e.start < last && e.end > first)) {
    if (e.start - cursor >= gymMs) candidates.push({ start: cursor, end: cursor + gymMs, where: "between" });
    cursor = Math.max(cursor, e.end);
  }
  candidates.push({ start: first - gymMs, end: first, where: "before" });

  const open = atLocal(tz, info.date, g.open);
  const close = atLocal(tz, info.date, g.close);
  const valid = candidates.filter(
    (s) => s.start >= open && s.end <= close && !info.dayEvents.some((e) => overlaps(e, s)),
  );

  let gym = null;
  for (const slot of valid) {
    const opt = await buildOption(ctx, {
      arriveBy: slot.where === "before" ? slot.start - c.arrivalBufferMinutes * MIN : defaultArriveBy,
      leaveAfter: slot.where === "after" ? slot.end : defaultLeaveAfter,
      gym: slot,
    });
    if (opt && (!gym || opt.cost < gym.cost)) gym = opt;
  }
  return { base, gym };
}

// `required` options (the no-gym plan) always come back, warning about any
// trip that couldn't be planned; optional gym placements are just dropped.
async function buildOption(ctx, { arriveBy, leaveAfter, gym, required = false }) {
  const { places } = ctx.config;
  const [toSchool, toHome] = await Promise.all([
    planTrip(ctx, { from: places.home, to: places.school, label: "school", arriveBy }),
    planTrip(ctx, { from: places.school, to: places.home, label: "home", leaveAfter }),
  ]);
  for (const [trip, label] of [[toSchool, "school"], [toHome, "home"]]) {
    if (trip && !trip.problem) continue;
    if (!required) return null;
    ctx.warnings.push(trip ? trip.problem : `Couldn't get any travel estimate for the trip ${label === "home" ? "home" : "to school"}.`);
  }
  const blocks = [toSchool, toHome].filter(Boolean).map(tripBlock);
  if (gym) {
    blocks.push({
      kind: "gym",
      title: "Gym",
      start: gym.start,
      end: gym.end,
      note: `${ctx.config.gym.durationMinutes} min including changing and walking over`,
    });
  }
  const cost = (toSchool?.score ?? 0) + (toHome?.score ?? 0);
  return { blocks, cost, toSchool, toHome };
}

/**
 * Pick a departure time. For `arriveBy` trips, try departures in the window
 * before the deadline; for `leaveAfter` trips, try departures in the window
 * after it. Drive if any departure keeps the drive within maxDriveMinutes,
 * otherwise take transit.
 */
export async function planTrip(ctx, { from, to, label, arriveBy, leaveAfter }) {
  const c = ctx.config.commute;
  const step = c.stepMinutes * MIN;
  const windowMs = c.searchWindowMinutes * MIN;
  const now = Date.now();

  const departs = [];
  if (arriveBy != null) {
    for (let d = arriveBy - windowMs; d <= arriveBy - step; d += step) departs.push(d);
  } else {
    for (let d = leaveAfter; d <= leaveAfter + windowMs; d += step) departs.push(d);
  }

  const [eh, em] = c.earliestDeparture.split(":").map(Number);
  const notTooEarly = (d) => {
    const p = localParts(ctx.tz, d);
    return p.hour * 60 + p.minute >= eh * 60 + em;
  };
  const results = await Promise.all(
    departs
      .filter((d) => d > now && notTooEarly(d))
      .map(async (d) => ({ depart: d, minutes: await ctx.travel({ mode: "drive", from, to, departAt: d }) })),
  );
  let usable = results.filter((r) => r.minutes != null);
  if (arriveBy != null) usable = usable.filter((r) => r.depart + r.minutes * MIN <= arriveBy);

  // Score each departure as drive time plus a discounted cost for time spent
  // waiting around (arriving early or staying late): you can do homework on
  // campus, but it's still worse than being home.
  const wait = (r) => (arriveBy != null ? arriveBy - (r.depart + r.minutes * MIN) : r.depart - leaveAfter) / MIN;
  const score = (r) => r.minutes + c.waitCostPerMinute * wait(r);
  // On equal scores: going to school, leave later; coming home, leave earlier.
  const bestOf = (list) =>
    (arriveBy != null ? [...list].reverse() : list).reduce((best, r) => (score(r) < score(best) ? r : best));
  const asDrive = (r) => ({
    mode: "drive",
    label,
    depart: r.depart,
    arrive: r.depart + r.minutes * MIN,
    minutes: r.minutes,
    score: score(r),
    worstMinutes: Math.max(...usable.map((u) => u.minutes)),
  });

  // Drive whenever some departure keeps the drive within the limit.
  const withinLimit = usable.filter((r) => r.minutes <= c.maxDriveMinutes);
  if (withinLimit.length) return asDrive(bestOf(withinLimit));
  const drive = usable.length ? asDrive(bestOf(usable)) : null;

  const transitQuery =
    arriveBy != null
      ? { mode: "transit", from, to, arriveBy }
      : { mode: "transit", from, to, departAt: Math.max(leaveAfter, now) };
  const transitMinutes = await ctx.travel(transitQuery);
  const transitDepart =
    transitMinutes == null ? null : arriveBy != null ? arriveBy - transitMinutes * MIN : transitQuery.departAt;
  if (transitMinutes != null && (arriveBy == null || notTooEarly(transitDepart))) {
    const depart = transitDepart;
    return {
      mode: "transit",
      label,
      depart,
      arrive: depart + transitMinutes * MIN,
      minutes: transitMinutes,
      score: transitMinutes,
      driveMinutes: usable.length ? Math.min(...usable.map((r) => r.minutes)) : null,
    };
  }

  if (drive) {
    return {
      ...drive,
      overLimit: true,
      problem: `No usable transit route (trip ${label === "home" ? "home" : "to school"}); the best drive is ${drive.minutes} min, over your ${c.maxDriveMinutes} min limit.`,
    };
  }
  return null;
}

function tripBlock(trip) {
  const verb = trip.mode === "drive" ? "Drive" : "Transit";
  let note = `${trip.minutes} min`;
  if (trip.mode === "drive" && trip.worstMinutes > trip.minutes) {
    note += ` (up to ${trip.worstMinutes} min at other times)`;
  }
  if (trip.mode === "transit" && trip.driveMinutes != null) {
    note += ` (driving would take ${trip.driveMinutes} min)`;
  }
  if (trip.overLimit) note += " (over your driving limit, no transit found)";
  const where = trip.label === "home" ? "home" : `to ${trip.label}`;
  return { kind: "commute", title: `${verb} ${where}`, start: trip.depart, end: trip.arrive, note };
}

// Gym goes on the school days where it saves the most commute time (usually
// by letting you skip rush hour), up to gym.daysPerWeek per week.
function chooseGymDays(ctx, infos) {
  const perWeek = ctx.config.gym.daysPerWeek;
  const weeks = new Map();
  for (const info of infos) {
    if (!info.options?.gym) continue;
    const k = weekKey(info.date);
    if (!weeks.has(k)) weeks.set(k, []);
    weeks.get(k).push(info);
  }
  const chosen = new Set();
  for (const [week, list] of weeks) {
    list
      .map((i) => ({ date: i.date, saved: i.options.base.cost - i.options.gym.cost }))
      .sort((a, b) => b.saved - a.saved || a.date.localeCompare(b.date))
      .slice(0, perWeek)
      .forEach((x) => chosen.add(x.date));
    const wholeWeekPlanned = infos.filter((i) => weekKey(i.date) === week).length === 7;
    if (list.length < perWeek && wholeWeekPlanned) {
      ctx.warnings.push(
        `Week of ${week}: only ${list.length} school day(s) had room for a ${ctx.config.gym.durationMinutes} min gym session.`,
      );
    }
  }
  return chosen;
}

function fillHomework(ctx, info, blocks, trips) {
  const { tz, config } = ctx;
  const h = config.homework;
  const weekend = [0, 6].includes(weekdayOf(info.date));
  let remaining = (weekend ? h.weekendHoursPerDay : h.hoursPerDay) * 60 * MIN;
  if (remaining <= 0) return [];

  const windowStart = atLocal(tz, info.date, h.earliest);
  const windowEnd = atLocal(tz, info.date, h.latest);
  const busy = [...info.dayEvents, ...blocks].sort(byStart);

  const gaps = [];
  let cursor = windowStart;
  for (const b of busy) {
    if (b.end <= cursor) continue;
    if (b.start >= windowEnd) break;
    if (b.start > cursor) gaps.push({ start: cursor, end: Math.min(b.start, windowEnd) });
    cursor = Math.max(cursor, b.end);
  }
  if (cursor < windowEnd) gaps.push({ start: cursor, end: windowEnd });

  const toSchool = trips.find((t) => t.label === "school");
  const toHome = trips.find((t) => t.label === "home");
  const onCampus = (t) => toSchool && toHome && t >= toSchool.arrive && t < toHome.depart;

  const out = [];
  for (const gap of gaps) {
    let t = gap.start;
    while (remaining > 0) {
      const len = Math.min(h.maxBlockMinutes * MIN, gap.end - t, remaining);
      // Short blocks are only worth it when they finish off the day's target.
      if (len < h.minBlockMinutes * MIN && !(len === remaining && len >= 15 * MIN)) break;
      out.push({
        kind: "homework",
        title: onCampus(t) ? "Homework (on campus)" : "Homework",
        start: t,
        end: t + len,
      });
      remaining -= len;
      t += len + h.breakMinutes * MIN;
    }
  }
  return out;
}
