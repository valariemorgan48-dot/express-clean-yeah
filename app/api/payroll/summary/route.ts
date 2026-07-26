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
  const approvals = await prisma.weekApproval.findMany({ where: { weekStart: start } });

  const now = Date.now();
  const summary = employees.map((e) => {
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
    const approved = approvals.some((a) => a.employeeId === e.id);
    return { id: e.id, name: e.name, jobType: e.jobType, hours, pay, bonus: bonusAmount, total, approved };
  });

  return NextResponse.json({ summary, weekStart: start, weekEnd: end });
}
