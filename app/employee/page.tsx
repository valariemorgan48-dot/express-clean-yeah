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

const BIBLE_VERSES = [
  { text: "Whatever you do, work heartily, as for the Lord and not for men.", ref: "Colossians 3:23" },
  { text: "I can do all things through him who strengthens me.", ref: "Philippians 4:13" },
  { text: "Commit your work to the Lord, and your plans will be established.", ref: "Proverbs 16:3" },
  { text: "Let all that you do be done in love.", ref: "1 Corinthians 16:14" },
  { text: "The Lord is my shepherd; I shall not want.", ref: "Psalm 23:1" },
  { text: "Trust in the Lord with all your heart, and do not lean on your own understanding.", ref: "Proverbs 3:5" },
  { text: "Have I not commanded you? Be strong and courageous. Do not be frightened, and do not be dismayed, for the Lord your God is with you wherever you go.", ref: "Joshua 1:9" },
  { text: "And we know that for those who love God all things work together for good, for those who are called according to his purpose.", ref: "Romans 8:28" },
  { text: "She dresses herself with strength and makes her arms strong.", ref: "Proverbs 31:17" },
  { text: "One who is faithful in a very little is also faithful in much.", ref: "Luke 16:10" },
  { text: "The Lord will fight for you, and you have only to be silent.", ref: "Exodus 14:14" },
  { text: "This is the day that the Lord has made; let us rejoice and be glad in it.", ref: "Psalm 118:24" },
  { text: "But they who wait for the Lord shall renew their strength.", ref: "Isaiah 40:31" },
  { text: "Give thanks in all circumstances; for this is the will of God in Christ Jesus for you.", ref: "1 Thessalonians 5:18" },
  { text: "Do your best to present yourself to God as one approved, a worker who has no need to be ashamed.", ref: "2 Timothy 2:15" },
  { text: "Not by might, nor by power, but by my Spirit, says the Lord of hosts.", ref: "Zechariah 4:6" },
  { text: "In all your ways acknowledge him, and he will make straight your paths.", ref: "Proverbs 3:6" },
  { text: "The Lord is good, a stronghold in the day of trouble; he knows those who take refuge in him.", ref: "Nahum 1:7" },
  { text: "Casting all your anxieties on him, because he cares for you.", ref: "1 Peter 5:7" },
  { text: "Every good gift and every perfect gift is from above.", ref: "James 1:17" },
];

function getDailyVerse() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
  return BIBLE_VERSES[dayOfYear % BIBLE_VERSES.length];
}

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
  const verse = getDailyVerse();

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

      <BlueprintCard style={{ marginTop: 12, padding: 16 }}>
        <div style={{ fontSize: 14, fontStyle: "italic", lineHeight: 1.5 }}>&ldquo;{verse.text}&rdquo;</div>
        <div className="card-meta" style={{ marginTop: 6 }}>{verse.ref} (ESV)</div>
        <div className="card-meta" style={{ fontSize: 10, opacity: 0.6, marginTop: 4 }}>Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.</div>
      </BlueprintCard>

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
