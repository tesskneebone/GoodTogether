/**
 * The sources these adapters read from publish wall-clock times in Pacific
 * time (America/Los_Angeles), but the import runs on a server whose local
 * timezone is UTC. Combining a date + time string with `new Date(...)` or
 * `setHours` would silently store the wrong instant (off by 7-8 hours
 * depending on DST), so event times are built through this converter
 * instead.
 */
export function laTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): Date {
  const guessUtc = Date.UTC(year, month - 1, day, hour, minute, 0);

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = formatter.formatToParts(new Date(guessUtc));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);

  // What the guessed UTC instant actually reads as in LA time -- the gap
  // between that and the guess is the current UTC offset (handles DST).
  const asIfLocal = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second")
  );
  const offset = guessUtc - asIfLocal;

  return new Date(guessUtc + offset);
}

/** Parses a 12-hour time string like "9:00 am" or "11:30 PM". */
export function parse12HourTime(text: string): { hour: number; minute: number } | null {
  const match = text.trim().match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
  if (!match) return null;
  let hour = Number(match[1]) % 12;
  const minute = Number(match[2]);
  if (/pm/i.test(match[3])) hour += 12;
  return { hour, minute };
}
