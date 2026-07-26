import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPastWorkWeeks } from "@/lib/workweek";
import { resolveRate } from "@/lib/pay";

export async function GET() {
  const session = await getServerSession(authOptions);
  const employeeId = (session?.user as any)?.employeeId;
  if (!employeeId) return NextResponse.json({ error: "Not an employee" }, { status: 403 });

  const weeks = getPastWorkWeeks(8);
  const entries = await prisma.timeEntry.findMany({
    where: { employeeId, clockIn: { gte: weeks[weeks.length - 1].start, lte: weeks[0].end } },
  });
  const employee = await prisma.employee.findUnique({ where: { id: employeeId }, include: { jobRates: true } });
  const baseRate = employee?.hourlyRate ?? 0;
  const jobRates = employee?.jobRates ?? [];

  const bonuses = await prisma.weeklyBonus.findMany({
    where: { employeeId, weekStart: { in: weeks.map((w) => w.start) } },
  });

  const now = Date.now();
  const history = weeks.map((w) => {
    const weekEntries = entries.filter((e) => e.clockIn >= w.start && e.clockIn <= w.end);
    let totalMs = 0;
    let pay = 0;
    for (const e of weekEntries) {
      const endMs = e.clockOut ? e.clockOut.getTime() : now;
      const ms = endMs - e.clockIn.getTime();
      totalMs += ms;
      const rate = resolveRate(e.jobType, baseRate, jobRates);
      pay += (ms / 3_600_000) * rate;
    }
    const hours = Math.round((totalMs / 3_600_000) * 100) / 100;
    pay = Math.round(pay * 100) / 100;
    const bonus = bonuses.find((b) => b.weekStart.getTime() === w.start.getTime());
    const total = Math.round((pay + (bonus?.amount ?? 0)) * 100) / 100;
    return {
      label: w.label,
      hours,
      pay,
      bonus: bonus ? { amount: bonus.amount, note: bonus.note } : null,
      total,
    };
  });

  return NextResponse.json({ history });
}
Step 8 — Replace app/employee/history/page.tsx entirely:

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
          </BlueprintCard>
        ))}
      </div>
    </div>
  );
}
