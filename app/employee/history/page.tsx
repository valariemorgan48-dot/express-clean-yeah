"use client";
import { useEffect, useState } from "react";
import BlueprintCard from "@/components/BlueprintCard";

export default function EmployeeHistory() {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/history")
      .then((r) => r.json())
      .then((d) => setHistory(d.history ?? []));
  }, []);

  return (
    <div style={{ marginTop: 8 }}>
      <h3>Pay & Hours History</h3>
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
        {history.map((w, i) => (
          <BlueprintCard key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div className="card-title" style={{ fontSize: 15 }}>{w.label}{i === 0 ? " (current)" : ""}</div>
              <div className="tag tag-accent">${w.total.toFixed(2)}</div>
            </div>
            <div className="card-meta">{w.hours} hrs — ${w.pay.toFixed(2)} pay</div>
            {w.bonus && (
              <div className="card-meta">+ ${w.bonus.amount.toFixed(2)} bonus{w.bonus.note ? ` (${w.bonus.note})` : ""}</div>
            )}
            {w.approved && <div className="card-meta" style={{ color: "var(--color-accent-700)" }}>✓ Approved</div>}
          </BlueprintCard>
        ))}
      </div>
    </div>
  );
}
