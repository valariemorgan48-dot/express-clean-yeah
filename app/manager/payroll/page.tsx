"use client";
import { useState } from "react";
import BlueprintCard from "@/components/BlueprintCard";
import { getPastWorkWeeks } from "@/lib/workweek";

const weeks = getPastWorkWeeks(12);

export default function ManagerPayroll() {
  const [selected, setSelected] = useState(0);

  return (
    <div style={{ marginTop: 8 }}>
      <h3>Payroll Export</h3>
      <p style={{ fontSize: 13, opacity: 0.7, marginTop: -4 }}>Download a CSV of hours worked per employee for any work week.</p>

      <BlueprintCard style={{ marginTop: 16, gap: 8 }}>
        <div className="field">
          <label>Work week</label>
          <select className="input" value={selected} onChange={(e) => setSelected(Number(e.target.value))}>
            {weeks.map((w, i) => (
              <option key={i} value={i}>{w.label}{i === 0 ? " (current)" : ""}</option>
            ))}
          </select>
        </div>
        <a
          className="btn btn-primary btn-block"
          style={{ textDecoration: "none" }}
          href={`/api/payroll/export?start=${weeks[selected].start.toISOString()}`}
        >
          Download CSV
        </a>
      </BlueprintCard>
    </div>
  );
}
