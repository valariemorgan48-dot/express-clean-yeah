import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPastWorkWeeks } from "@/lib/workweek";

// GET: the signed-in employee's hours for the last 8 work weeks (current + 7 prior).
export async function GET() {
  const session = await getServerSession(authOptions);
  const employeeId = (session?.user as any)?.employeeId;
  if (!employeeId) return NextResponse.json({ error: "Not an employee" }, { status: 403 });

  const weeks = getPastWorkWeeks(8);
  const entries = await prisma.timeEntry.findMany({
    where: { employeeId, clockIn: { gte: weeks[weeks.length - 1].start, lte: weeks[0].end } },
  });

  const now = Date.now();
  const history = weeks.map((w) => {
    const weekEntries = entries.filter((e) => e.clockIn >= w.start && e.clockIn <= w.end);
    const totalMs = weekEntries.reduce((sum, e) => {
      const endMs = e.clockOut ? e.clockOut.getTime() : now;
      return sum + (endMs - e.clockIn.getTime());
    }, 0);
    return { label: w.label, hours: Math.round((totalMs / 3_600_000) * 100) / 100 };
  });

  return NextResponse.json({ history });
}
app/employee/timeoff/page.tsx:

"use client";
import { useEffect, useState } from "react";
import BlueprintCard from "@/components/BlueprintCard";

const STATUS_TAG: Record<string, string> = { PENDING: "tag-outline", APPROVED: "tag-accent", DENIED: "tag-neutral" };

export default function EmployeeTimeOff() {
  const [requests, setRequests] = useState<any[]>([]);
  const [form, setForm] = useState({ startDate: "", endDate: "", reason: "" });
  const [error, setError] = useState("");

  async function refresh() {
    const r = await fetch("/api/timeoff");
    const d = await r.json();
    setRequests(d.requests ?? []);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function submit() {
    setError("");
    if (!form.startDate || !form.endDate) {
      setError("Start and end date are required.");
      return;
    }
    const res = await fetch("/api/timeoff", { method: "POST", body: JSON.stringify(form) });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "Could not submit request");
      return;
    }
    setForm({ startDate: "", endDate: "", reason: "" });
    refresh();
  }

  return (
    <div style={{ marginTop: 8 }}>
      <h3>Time Off</h3>

      <BlueprintCard style={{ marginTop: 16, gap: 8 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Start date</label>
            <input className="input" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>End date</label>
            <input className="input" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
        </div>
        <div className="field">
          <label>Reason (optional)</label>
          <input className="input" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Family trip" />
        </div>
        {error && <div style={{ color: "#ff6b6b", fontSize: 13 }}>{error}</div>}
        <button className="btn btn-primary btn-block" onClick={submit}>Submit Request</button>
      </BlueprintCard>

      <h6 style={{ margin: "20px 0 10px" }}>My requests</h6>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {requests.map((r) => (
          <BlueprintCard key={r.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div className="card-title" style={{ fontSize: 15 }}>
                {new Date(r.startDate).toLocaleDateString([], { month: "short", day: "numeric" })} – {new Date(r.endDate).toLocaleDateString([], { month: "short", day: "numeric" })}
              </div>
              <div className={`tag ${STATUS_TAG[r.status]}`}>{r.status}</div>
            </div>
            {r.reason && <div className="card-meta">{r.reason}</div>}
          </BlueprintCard>
        ))}
        {requests.length === 0 && <div style={{ fontSize: 13, opacity: 0.6 }}>No requests yet.</div>}
      </div>
    </div>
  );
}
app/employee/history/page.tsx:

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
app/manager/timeoff/page.tsx:

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
