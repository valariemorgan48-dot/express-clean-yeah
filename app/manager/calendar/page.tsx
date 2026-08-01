"use client";
import { useEffect, useState } from "react";
import BlueprintCard from "@/components/BlueprintCard";
import { getWorkWeekBounds } from "@/lib/workweek";

const DAY_COUNT = 7;

function fmtDay(d: Date) {
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
}

export default function ManagerCalendar() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [shifts, setShifts] = useState<any[]>([]);
  const [weekStart, setWeekStart] = useState<Date | null>(null);

  useEffect(() => {
    const ref = new Date();
    ref.setDate(ref.getDate() + weekOffset * 7);
    const { start } = getWorkWeekBounds(ref);
    setWeekStart(start);
    fetch(`/api/shifts?start=${start.toISOString()}`)
      .then((r) => r.json())
      .then((d) => setShifts(d.shifts ?? []));
  }, [weekOffset]);

  const days: Date[] = [];
  if (weekStart) {
    for (let i = 0; i < DAY_COUNT; i++) {
      const d = new Date(weekStart);
      d.setUTCDate(weekStart.getUTCDate() + i);
      days.push(d);
    }
  }

  function shiftsForDay(d: Date) {
    return shifts
      .filter((s) => new Date(s.date).toISOString().slice(0, 10) === d.toISOString().slice(0, 10))
      .sort((a, b) => a.time.localeCompare(b.time));
  }

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3>Schedule Calendar</h3>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
        <button className="btn" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => setWeekOffset((w) => w - 1)}>‹ Prev</button>
        <div className="card-meta" style={{ fontSize: 13 }}>
          {weekStart && `${fmtDay(days[0])} – ${fmtDay(days[6])}`}{weekOffset === 0 ? " (current)" : ""}
        </div>
        <button className="btn" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => setWeekOffset((w) => w + 1)}>Next ›</button>
      </div>

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {days.map((d) => {
          const dayShifts = shiftsForDay(d);
          return (
            <BlueprintCard key={d.toISOString()} style={{ gap: 6 }}>
              <div className="card-title" style={{ fontSize: 15 }}>{fmtDay(d)}</div>
              {dayShifts.length === 0 && <div style={{ fontSize: 13, opacity: 0.6 }}>No jobs scheduled.</div>}
              {dayShifts.map((s) => (
                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "6px 0", borderTop: "1px solid var(--color-divider)" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{s.time} — {s.employeeName}</div>
                    <div className="card-meta">{s.jobType} — {s.address}</div>
                  </div>
                  {s.repeats && <div className="tag tag-outline">↻</div>}
                </div>
              ))}
            </BlueprintCard>
          );
        })}
      </div>
    </div>
  );
}
