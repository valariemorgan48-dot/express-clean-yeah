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
