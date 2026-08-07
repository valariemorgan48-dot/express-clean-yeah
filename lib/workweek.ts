// Express Solutions work week: Friday 12:00 AM through Thursday 11:59:59 PM, Central time.

const TZ = "America/Chicago";

function centralParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    weekday: "short",
  }).formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    year: Number(map.year), month: Number(map.month), day: Number(map.day),
    hour: Number(map.hour === "24" ? "0" : map.hour), minute: Number(map.minute), second: Number(map.second),
    weekday: weekdayMap[map.weekday],
  };
}

// Builds a UTC Date for a given Central-time wall clock instant, accounting
// for whichever UTC offset is in effect (CST/CDT) at that date.
function centralWallClockToUTC(year: number, month: number, day: number, hour: number, minute: number, second: number, ms: number) {
  const guessUTC = Date.UTC(year, month - 1, day, hour, minute, second, ms);
  const asIfUTC = new Date(guessUTC);
  const shown = centralParts(asIfUTC);
  const shownUTC = Date.UTC(shown.year, shown.month - 1, shown.day, shown.hour, shown.minute, shown.second, ms);
  const offsetMs = guessUTC - shownUTC;
  return new Date(guessUTC + offsetMs);
}

export function getWorkWeekBounds(reference: Date = new Date()) {
  const p = centralParts(reference);
  const diffToFriday = (p.weekday - 5 + 7) % 7; // days since most recent Friday, in Central time

  const startDay = new Date(Date.UTC(p.year, p.month - 1, p.day));
  startDay.setUTCDate(startDay.getUTCDate() - diffToFriday);
  const sy = startDay.getUTCFullYear(), sm = startDay.getUTCMonth() + 1, sd = startDay.getUTCDate();

  const start = centralWallClockToUTC(sy, sm, sd, 0, 0, 0, 0);

  const endDay = new Date(Date.UTC(sy, sm - 1, sd));
  endDay.setUTCDate(endDay.getUTCDate() + 6);
  const end = centralWallClockToUTC(endDay.getUTCFullYear(), endDay.getUTCMonth() + 1, endDay.getUTCDate(), 23, 59, 59, 999);

  return { start, end };
}

export function formatWorkWeekLabel(reference: Date = new Date()) {
  const { start, end } = getWorkWeekBounds(reference);
  const fmt = (d: Date) => d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", timeZone: TZ });
  return `Work week: ${fmt(start)} – ${fmt(end)}`;
}

// Returns the current work week plus the `count - 1` weeks before it,
// newest first, each with its own Fri–Thu bounds (Central time) and a display label.
export function getPastWorkWeeks(count: number, reference: Date = new Date()) {
  const weeks = [];
  for (let i = 0; i < count; i++) {
    const ref = new Date(reference.getTime() - i * 7 * 86400000);
    const { start, end } = getWorkWeekBounds(ref);
    const fmt = (d: Date) => d.toLocaleDateString([], { month: "short", day: "numeric", timeZone: TZ });
    weeks.push({ start, end, label: `${fmt(start)} – ${fmt(end)}` });
  }
  return weeks;
}
