// Express Solutions work week: Friday 12:00 AM through Thursday 11:59:59 PM.

export function getWorkWeekBounds(reference: Date = new Date()) {
  const day = reference.getDay(); // 0=Sun..6=Sat
  const diffToFriday = (day - 5 + 7) % 7; // days since most recent Friday
  const start = new Date(reference);
  start.setHours(0, 0, 0, 0);
  start.setDate(reference.getDate() - diffToFriday);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export function formatWorkWeekLabel(reference: Date = new Date()) {
  const { start, end } = getWorkWeekBounds(reference);
  const fmt = (d: Date) => d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  return `Work week: ${fmt(start)} – ${fmt(end)}`;
}
// Returns the current work week plus the `count - 1` weeks before it,
// newest first, each with its own Fri–Thu bounds and a display label.
export function getPastWorkWeeks(count: number, reference: Date = new Date()) {
  const weeks = [];
  for (let i = 0; i < count; i++) {
    const ref = new Date(reference);
    ref.setDate(reference.getDate() - i * 7);
    const { start, end } = getWorkWeekBounds(ref);
    const fmt = (d: Date) => d.toLocaleDateString([], { month: "short", day: "numeric" });
    weeks.push({ start, end, label: `${fmt(start)} – ${fmt(end)}` });
  }
  return weeks;
}
