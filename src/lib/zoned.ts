/** Time-zone helpers for bookings: opening hours and bookings live in the business's own zone, not the browser's. */

/** How far ahead of UTC the zone is at that instant, in ms. */
function offsetMs(tz: string, utcMs: number): number {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
      .formatToParts(new Date(utcMs)).map((x) => [x.type, x.value]),
  );
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - Math.floor(utcMs / 1000) * 1000;
}

/** The ISO instant when the clock in `tz` reads `date` (YYYY-MM-DD) and `time` (HH:MM). */
export function zonedToIso(date: string, time: string, tz: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  const naive = Date.UTC(y, m - 1, d, h, min);
  const guess = naive - offsetMs(tz, naive);
  return new Date(naive - offsetMs(tz, guess)).toISOString();
}

/** "Monday 26 October 2026, 10:00" in the given zone (the browser's when omitted). */
export const formatWhen = (iso: string, tz?: string) =>
  new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23", ...(tz ? { timeZone: tz } : {}) }).format(new Date(iso));

/** "Mon 26 Oct, 10:00" for tables. */
export const formatShort = (iso: string, tz?: string) =>
  new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23", ...(tz ? { timeZone: tz } : {}) }).format(new Date(iso));
