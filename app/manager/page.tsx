"use client";
import { useEffect, useState } from "react";
import BlueprintCard from "@/components/BlueprintCard";

export default function ManagerHome() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [weekLabel, setWeekLabel] = useState("");

  useEffect(() => {
    fetch("/api/employees")
      .then((r) => r.json())
      .then((d) => {
        setEmployees(d.employees ?? []);
        if (d.weekStart) {
          const fmt = (s: string) => new Date(s).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
          setWeekLabel(`Work week: ${fmt(d.weekStart)} – ${fmt(d.weekEnd)}`);
        }
      });
  }, []);

  const onClock = employees.filter((e) => e.isClockedInNow).length;

  return (
    <div style={{ marginTop: 8 }}>
      <h6 style={{ color: "var(--color-accent-700)" }}>{weekLabel}</h6>
      <h3 style={{ marginTop: 2 }}>Team Overview</h3>

      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <BlueprintCard style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 600 }}>{onClock}</div>
          <div className="card-meta" style={{ justifyContent: "center" }}>On the clock</div>
        </BlueprintCard>
        <BlueprintCard style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 600 }}>{employees.length}</div>
          <div className="card-meta" style={{ justifyContent: "center" }}>Total staff</div>
        </BlueprintCard>
      </div>

      <h6 style={{ margin: "20px 0 10px" }}>Hours this week</h6>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {employees.map((e) => (
          <BlueprintCard key={e.id} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: e.isClockedInNow ? "var(--color-accent)" : "var(--color-neutral-400)" }} />
              <div>
                <div className="card-title" style={{ fontSize: 15 }}>{e.name}</div>
                <div className="card-meta">{e.jobType}</div>
              </div>
            </div>
            <div className="tag tag-accent">{e.weeklyHours} hrs</div>
          </BlueprintCard>
        ))}
      </div>
    </div>
  );
}
