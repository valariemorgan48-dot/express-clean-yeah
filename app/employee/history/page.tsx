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
          <BlueprintCard key={i} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <div className="card-title" style={{ fontSize: 15 }}>{w.label}{i === 0 ? " (current)" : ""}</div>
            <div className="tag tag-accent">{w.hours} hrs</div>
          </BlueprintCard>
        ))}
      </div>
    </div>
  );
}
