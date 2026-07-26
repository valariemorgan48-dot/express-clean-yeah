"use client";
import { useEffect, useState } from "react";
import BlueprintCard from "@/components/BlueprintCard";

export default function EmployeeSchedule() {
  const [shifts, setShifts] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/shifts")
      .then((r) => r.json())
      .then((d) => setShifts(d.shifts ?? []));
  }, []);

  return (
    <div style={{ marginTop: 8 }}>
      <h3>My Schedule</h3>
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {shifts.map((s) => (
          <BlueprintCard key={s.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div className="card-title">{new Date(s.date).toLocaleDateString([], { weekday: "short" })}</div>
              <div className="tag tag-accent">{s.time}</div>
            </div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>{s.jobType}</div>
            <div className="card-meta">{s.address}</div>
            {s.repeats && <div className="tag tag-outline" style={{ width: "fit-content" }}>↻ Repeats weekly</div>}
          </BlueprintCard>
        ))}
        {shifts.length === 0 && <div style={{ fontSize: 13, opacity: 0.6 }}>No shifts scheduled this work week.</div>}
      </div>
    </div>
  );
}
