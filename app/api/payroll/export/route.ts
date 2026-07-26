import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWorkWeekBounds } from "@/lib/workweek";
import { resolveRate } from "@/lib/pay";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "MANAGER") {
    return NextResponse.json({ error: "Manager access required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const startParam = searchParams.get("start");
  const { start, end } = getWorkWeekBounds(startParam ? new Date(startParam) : new Date());

  const employees = await prisma.employee.findMany({
    include: {
      timeEntries: { where: { clockIn: { gte: start, lte: end } } },
      jobRates: true,
    },
    orderBy: { name: "asc" },
  });
  const bonuses = await prisma.weeklyBonus.findMany({ where: { weekStart: start } });

  const now = Date.now();
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
  const weekLabel = `${fmt(start)} - ${fmt(end)}`;

  const rows = employees.map((e) => {
    let totalMs = 0;
    let pay = 0;
    for (const t of e.timeEntries) {
      const endMs = t.clockOut ? t.clockOut.getTime() : now;
      const ms = endMs - t.clockIn.getTime();
      totalMs += ms;
      const rate = resolveRate(t.jobType, e.hourlyRate, e.jobRates);
      pay += (ms / 3_600_000) * rate;
    }
    const hours = Math.round((totalMs / 3_600_000) * 100) / 100;
    pay = Math.round(pay * 100) / 100;
    const bonus = bonuses.find((b) => b.employeeId === e.id);
    const bonusAmount = bonus?.amount ?? 0;
    const total = Math.round((pay + bonusAmount) * 100) / 100;
    return [e.name, e.jobType, weekLabel, hours.toFixed(2), pay.toFixed(2), bonusAmount.toFixed(2), total.toFixed(2)];
  });

  const csvEscape = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const lines = [
    ["Employee", "Job Type", "Work Week", "Hours", "Pay", "Bonus", "Total"].map(csvEscape).join(","),
    ...rows.map((r) => r.map((v) => csvEscape(String(v))).join(",")),
  ];
  const csv = lines.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="payroll-${fmt(start).replace(/\//g, "-")}.csv"`,
    },
  });
}
