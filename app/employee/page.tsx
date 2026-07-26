"use client";
import { useEffect, useState } from "react";
import BlueprintCard from "@/components/BlueprintCard";

const JOB_TYPES = ["Residential Cleaning", "Commercial Cleaning", "Local Moving", "Long-Distance Moving", "Lawn Care"];

export default function EmployeeHome() {
  const [open, setOpen] = useState<any>(null);
  const [elapsed, setElapsed] = useState("00:00:00");
  const [loading, setLoading] = useState(false);
  const [jobType, setJobType] = useState(JOB_TYPES[0]);

  async function refresh() {
    const res = await fetch("/api/clock");
    const data = await res.json();
    setOpen(data.open ?? null);
    if (data.defaultJobType) setJobType(data.defaultJobType);
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!open) {
      setElapsed("00:00:00");
      return;
    }
    const id = setInterval(() => {
      const secs = Math.floor((Date.now() - new Date(open.clockIn).getTime()) / 1000);
      const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
      setElapsed([h, m, s].map((v) => String(v).padStart(2, "0")).join(":"));
    }, 1000);
    return () => clearInterval(id);
  }, [open]);

  async function toggleClock() {
    setLoading(true);
    const res = await fetch("/api/clock", { method: "POST", body: JSON.stringify({ jobType }) });
    const data = await res.json();
    setOpen(data.clockedIn ? data.entry : null);
    setLoading(false);
  }

  const today = new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });

  return (
    <div style={{ marginTop: 8 }}>
      <h6 style={{ color: "var(--color-accent-700)" }}>{today}</h6>
      <h3>Time Tracking</h3>

      <BlueprintCard dark style={{ marginTop: 20, padding: 22 }}>
        <h6 style={{ opacity: 0.85, color: "var(--color-bg)" }}>{open ? "Currently clocked in" : "Not clocked in"}</h6>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 44, fontWeight: 600, marginTop: 8, fontVariantNumeric: "tabular-nums" }}>{elapsed}</div>
        <div style={{ fontSize: 13, marginTop: 4, opacity: 0.9 }}>
          {open ? `On the clock — ${open.jobType || jobType}` : "Select a job and tap below when you arrive on site"}
        </div>
        {!open && (
          <select
            className="input"
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
            style={{ marginTop: 12, background: "var(--color-bg)", color: "var(--color-text)" }}
          >
            {JOB_TYPES.map((j) => <option key={j} value={j}>{j}</option>)}
          </select>
        )}
        <button
          onClick={toggleClock}
          disabled={loading}
          className="btn btn-primary btn-block blueprint"
          style={{ marginTop: 20, fontSize: 15, padding: 14, background: open ? "var(--color-bg)" : "var(--color-accent)", color: open ? "var(--color-accent-900)" : "var(--color-bg)", borderColor: open ? "var(--color-bg)" : "var(--color-accent)" }}
        >
          <i className="corner tl"></i><i className="corner tr"></i><i className="corner bl"></i><i className="corner br"></i>
          {open ? "Clock Out" : "Clock In"}
        </button>
      </BlueprintCard>
    </div>
  );
}
