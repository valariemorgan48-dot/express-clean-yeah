"use client";
import { useEffect, useState } from "react";
import BlueprintCard from "@/components/BlueprintCard";
import { getPastWorkWeeks } from "@/lib/workweek";

const weeks = getPastWorkWeeks(12);
const CONFETTI_COLORS = ["#3ea55c", "#7ed69a", "#a9e8bd", "#edf1ed", "#35934f"];

function ConfettiPiece({ i }: { i: number }) {
  const left = Math.random() * 100;
  const delay = Math.random() * 0.4;
  const duration = 1.8 + Math.random() * 1.2;
  const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
  return (
    <div
      className="confetti-piece"
      style={{ left: `${left}%`, background: color, animationDelay: `${delay}s`, animationDuration: `${duration}s` }}
    />
  );
}

export default function ManagerApprovals() {
  const [weekIdx, setWeekIdx] = useState(0);
  const [summary, setSummary] = useState<any[]>([]);
  const [celebrating, setCelebrating] = useState(false);

  const weekStartISO = weeks[weekIdx].start.toISOString();

  async function refresh() {
    const r = await fetch(`/api/payroll/summary?start=${weekStartISO}`);
    const d = await r.json();
    setSummary(d.summary ?? []);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekIdx]);

  async function approve(employeeId: string) {
    await fetch("/api/approvals", { method: "POST", body: JSON.stringify({ employeeId, weekStart: weekStartISO }) });
    setCelebrating(true);
    setTimeout(() => setCelebrating(false), 2400);
    refresh();
  }

  async function unapprove(employeeId: string) {
    if (!confirm("Remove approval for this employee's hours this week?")) return;
    await fetch(`/api/approvals?employeeId=${employeeId}&weekStart=${weekStartISO}`, { method: "DELETE" });
    refresh();
  }

  return (
    <div style={{ marginTop: 8 }}>
      {celebrating && (
        <div className="celebrate-overlay">
          {Array.from({ length: 40 }).map((_, i) => <ConfettiPiece key={i} i={i} />)}
          <div className="celebrate-text">Approved! 🎉</div>
        </div>
      )}

      <h3>Approve Hours</h3>
      <p style={{ fontSize: 13, opacity: 0.7, marginTop: -4 }}>Review and sign off on each employee's hours for a work week.</p>

      <BlueprintCard style={{ marginTop: 16, gap: 8 }}>
        <div className="field">
          <label>Work week</label>
          <select className="input" value={weekIdx} onChange={(e) => setWeekIdx(Number(e.target.value))}>
            {weeks.map((w, i) => (
              <option key={i} value={i}>{w.label}{i === 0 ? " (current)" : ""}</option>
            ))}
          </select>
        </div>
      </BlueprintCard>

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
        {summary.map((e) => (
          <BlueprintCard key={e.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div className="card-title" style={{ fontSize: 15 }}>{e.name}</div>
              <div className="tag tag-accent">${e.total.toFixed(2)}</div>
            </div>
            <div className="card-meta">{e.hours} hrs — ${e.pay.toFixed(2)} pay{e.bonus > 0 ? ` + $${e.bonus.toFixed(2)} bonus` : ""}</div>
            <div style={{ marginTop: 6 }}>
              {e.approved ? (
                <button className="btn" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => unapprove(e.id)}>✓ Approved — undo</button>
              ) : (
                <button className="btn btn-primary" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => approve(e.id)}>Approve Hours</button>
              )}
            </div>
          </BlueprintCard>
        ))}
        {summary.length === 0 && <div style={{ fontSize: 13, opacity: 0.6 }}>No employees found.</div>}
      </div>
    </div>
  );
}
