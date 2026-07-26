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
