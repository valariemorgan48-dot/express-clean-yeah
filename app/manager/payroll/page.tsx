"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import BlueprintCard from "@/components/BlueprintCard";
import { getPastWorkWeeks } from "@/lib/workweek";

const weeks = getPastWorkWeeks(12);

export default function ManagerPayroll() {
  const [selected, setSelected] = useState(0);
  const [employees, setEmployees] = useState<any[]>([]);
  const [bonuses, setBonuses] = useState<Record<string, { amount: number; note: string | null }>>({});
  const [drafts, setDrafts] = useState<Record<string, { amount: string; note: string }>>({});
  const [unapproved, setUnapproved] = useState<string[]>([]);

  const weekStartISO = weeks[selected].start.toISOString();

  async function refresh() {
    const [empRes, bonusRes, summaryRes] = await Promise.all([
      fetch("/api/employees"),
      fetch(`/api/bonuses?weekStart=${weekStartISO}`),
      fetch(`/api/payroll/summary?start=${weekStartISO}`),
    ]);
    const empData = await empRes.json();
    const bonusData = await bonusRes.json();
    const summaryData = await summaryRes.json();
    setEmployees(empData.employees ?? []);
    const map: Record<string, { amount: number; note: string | null }> = {};
    for (const b of bonusData.bonuses ?? []) map[b.employeeId] = { amount: b.amount, note: b.note };
    setBonuses(map);
    setDrafts({});
    setUnapproved((summaryData.summary ?? []).filter((s: any) => !s.approved).map((s: any) => s.name));
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  function draftFor(id: string) {
    return drafts[id] ?? { amount: bonuses[id]?.amount?.toString() ?? "", note: bonuses[id]?.note ?? "" };
  }

  async function saveBonus(employeeId: string) {
    const d = draftFor(employeeId);
    await fetch("/api/bonuses", {
      method: "POST",
      body: JSON.stringify({ employeeId, weekStart: weekStartISO, amount: d.amount, note: d.note }),
    });
    refresh();
  }

  return (
    <div style={{ marginTop: 8 }}>
      <h3>Payroll Export</h3>
      <p style={{ fontSize: 13, opacity: 0.7, marginTop: -4 }}>Download hours, pay, and bonuses for any work week — or add a one-time bonus below first.</p>

      <BlueprintCard style={{ marginTop: 16, gap: 8 }}>
        <div className="field">
          <label>Work week</label>
          <select className="input" value={selected} onChange={(e) => setSelected(Number(e.target.value))}>
            {weeks.map((w, i) => (
              <option key={i} value={i}>{w.label}{i === 0 ? " (current)" : ""}</option>
            ))}
          </select>
        </div>
        {unapproved.length > 0 && (
          <div style={{ fontSize: 13, color: "#ff6b6b", border: "1px solid #ff6b6b", borderRadius: 4, padding: 10 }}>
            {unapproved.length} employee{unapproved.length > 1 ? "s" : ""} not yet approved for this week: {unapproved.join(", ")}.
            {" "}<Link href="/manager/approvals" style={{ color: "#ff6b6b", textDecoration: "underline" }}>Go approve hours</Link> before exporting.
          </div>
        )}
        <a className="btn btn-primary btn-block" style={{ textDecoration: "none" }} href={`/api/payroll/export?start=${weekStartISO}`}>
          Download CSV
        </a>
      </BlueprintCard>

      <h6 style={{ margin: "20px 0 10px" }}>Bonuses for this week</h6>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {employees.map((e) => {
          const d = draftFor(e.id);
          return (
            <BlueprintCard key={e.id} style={{ gap: 8 }}>
              <div className="card-title" style={{ fontSize: 15 }}>{e.name}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Bonus amount"
                  value={d.amount}
                  onChange={(ev) => setDrafts({ ...drafts, [e.id]: { ...d, amount: ev.target.value } })}
                  style={{ flex: 1 }}
                />
                <input
                  className="input"
                  placeholder="Note (optional)"
                  value={d.note}
                  onChange={(ev) => setDrafts({ ...drafts, [e.id]: { ...d, note: ev.target.value } })}
                  style={{ flex: 2 }}
                />
                <button className="btn" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => saveBonus(e.id)}>Save</button>
              </div>
            </BlueprintCard>
          );
        })}
      </div>
    </div>
  );
}
