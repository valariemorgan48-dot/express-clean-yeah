"use client";
import { useEffect, useState } from "react";
import BlueprintCard from "@/components/BlueprintCard";

const JOB_TYPES = ["Residential Cleaning", "Commercial Cleaning", "Local Moving", "Long-Distance Moving", "Lawn Care"];
const CLOCK_IN_MESSAGES = [
  "You're clocked in! Now go be great!",
  "Let's do this — have a great shift!",
  "Clocked in and ready to roll!",
  "You've got this. Make it a great one!",
  "Time to shine — clocked in!",
];
const CONFETTI_COLORS = ["#3ea55c", "#7ed69a", "#a9e8bd", "#edf1ed", "#35934f"];

function ConfettiPiece({ i }: { i: number }) {
  const left = Math.random() * 100;
  const delay = Math.random() * 0.4;
  const duration = 1.8 + Math.random() * 1.2;
  const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
  return (
    <div
      className="confetti-piece"
      style={{
        left: `${left}%`,
        background: color,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      }}
    />
  );
}

export default function EmployeeHome() {
  const [open, setOpen] = useState<any>(null);
  const [elapsed, setElapsed] = useState("00:00:00");
  const [loading, setLoading] = useState(false);
  const [jobType, setJobType] = useState(JOB_TYPES[0]);
  const [toast, setToast] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState(false);

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

    if (data.clockedIn) {
      setToast(CLOCK_IN_MESSAGES[Math.floor(Math.random() * CLOCK_IN_MESSAGES.length)]);
      setTimeout(() => setToast(null), 3200);
    } else {
      setCelebrating(true);
      setTimeout(() => setCelebrating(false), 2800);
    }
  }

  const today = new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });

  return (
    <div style={{ marginTop: 8 }}>
      {toast && <div className="encourage-toast">{toast}</div>}
      {celebrating && (
        <div className="celebrate-overlay">
          {Array.from({ length: 40 }).map((_, i) => <ConfettiPiece key={i} i={i} />)}
          <div className="celebrate-text">Great work! 🎉</div>
        </div>
      )}

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
