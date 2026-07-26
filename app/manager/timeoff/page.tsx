"use client";
import { useEffect, useState } from "react";
import BlueprintCard from "@/components/BlueprintCard";

export default function ManagerTimeOff() {
  const [requests, setRequests] = useState<any[]>([]);

  async function refresh() {
    const r = await fetch("/api/timeoff");
    const d = await r.json();
    setRequests(d.requests ?? []);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function setStatus(id: string, status: "APPROVED" | "DENIED") {
    await fetch("/api/timeoff", { method: "PUT", body: JSON.stringify({ id, status }) });
    refresh();
  }

  const pending = requests.filter((r) => r.status === "PENDING");
  const resolved = requests.filter((r) => r.status !== "PENDING");

  return (
    <div style={{ marginTop: 8 }}>
      <h3>Time Off Requests</h3>

      <h6 style={{ margin: "16px 0 10px" }}>Pending</h6>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {pending.map((r) => (
          <BlueprintCard key={r.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div className="card-title" style={{ fontSize: 15 }}>{r.employeeName}</div>
              <div className="tag tag-outline">PENDING</div>
            </div>
            <div className="card-meta">
              {new Date(r.startDate).toLocaleDateString([], { month: "short", day: "numeric" })} – {new Date(r.endDate).toLocaleDateString([], { month: "short", day: "numeric" })}
            </div>
            {r.reason && <div className="card-meta">{r.reason}</div>}
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <button className="btn btn-primary" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => setStatus(r.id, "APPROVED")}>Approve</button>
              <button className="btn" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => setStatus(r.id, "DENIED")}>Deny</button>
            </div>
          </BlueprintCard>
        ))}
        {pending.length === 0 && <div style={{ fontSize: 13, opacity: 0.6 }}>No pending requests.</div>}
      </div>

      <h6 style={{ margin: "20px 0 10px" }}>Past requests</h6>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {resolved.map((r) => (
          <BlueprintCard key={r.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div className="card-title" style={{ fontSize: 15 }}>{r.employeeName}</div>
              <div className={`tag ${r.status === "APPROVED" ? "tag-accent" : "tag-neutral"}`}>{r.status}</div>
            </div>
          </BlueprintCard>
        ))}
      </div>
    </div>
  );
}
