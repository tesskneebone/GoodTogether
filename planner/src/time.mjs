// Time-zone helpers. Everything internally is epoch milliseconds; these convert
// between that and wall-clock times in the planner's configured time zone.

export const MIN = 60_000;

const partsFormatters = new Map();
function partsFormatter(tz) {
  if (!partsFormatters.has(tz)) {
    partsFormatters.set(
      tz,
      new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hourCycle: "h23",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        weekday: "short",
      }),
    );
  }
  return partsFormatters.get(tz);
}

/** Wall-clock parts of an instant in `tz`. */
export function localParts(tz, epoch) {
  const p = Object.fromEntries(
    partsFormatter(tz)
      .formatToParts(new Date(epoch))
      .map((x) => [x.type, x.value]),
  );
  return {
    year: +p.year,
    month: +p.month,
    day: +p.day,
    hour: +p.hour,
    minute: +p.minute,
    second: +p.second,
    weekday: p.weekday,
  };
}

function offsetMs(tz, epoch) {
  const p = localParts(tz, epoch);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - (epoch - (epoch % 1000));
}

/** Epoch ms for a wall-clock time on a "YYYY-MM-DD" date in `tz`. */
export function atLocal(tz, date, hhmm = "00:00") {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = hhmm.split(":").map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const first = guess - offsetMs(tz, guess);
  const second = guess - offsetMs(tz, first);
  return second;
}

/** "YYYY-MM-DD" of an instant in `tz`. */
export function dateKey(tz, epoch) {
  const p = localParts(tz, epoch);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

export function addDays(date, n) {
  const [y, mo, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, d + n)).toISOString().slice(0, 10);
}

/** 0 = Sunday ... 6 = Saturday. */
export function weekdayOf(date) {
  const [y, mo, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
}

/** Monday of the week containing `date`, used to group days into weeks. */
export function weekKey(date) {
  return addDays(date, -((weekdayOf(date) + 6) % 7));
}

export function dayBounds(tz, date) {
  return [atLocal(tz, date), atLocal(tz, addDays(date, 1))];
}

export function fmtTime(tz, epoch) {
  return new Date(epoch).toLocaleTimeString("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
  });
}

export function fmtDate(date) {
  const [y, mo, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, d)).toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
