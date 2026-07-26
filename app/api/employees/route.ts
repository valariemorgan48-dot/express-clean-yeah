import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWorkWeekBounds } from "@/lib/workweek";

// GET: all employees with total hours worked in the current work week
// (Fri 12:00 AM – Thu 11:59:59 PM) and whether they're currently clocked in.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "MANAGER") {
    return NextResponse.json({ error: "Manager access required" }, { status: 403 });
  }

  const { start, end } = getWorkWeekBounds();
  const employees = await prisma.employee.findMany({
    include: {
      timeEntries: { where: { clockIn: { gte: start, lte: end } } },
    },
    orderBy: { name: "asc" },
  });

  const now = Date.now();
  const result = employees.map((e) => {
    const totalMs = e.timeEntries.reduce((sum, t) => {
      const endMs = t.clockOut ? t.clockOut.getTime() : now;
      return sum + (endMs - t.clockIn.getTime());
    }, 0);
    const isClockedInNow = e.timeEntries.some((t) => !t.clockOut);
    return {
      id: e.id,
      name: e.name,
      jobType: e.jobType,
      weeklyHours: Math.round((totalMs / 3_600_000) * 100) / 100,
      isClockedInNow,
    };
  });

  return NextResponse.json({ employees: result, weekStart: start, weekEnd: end });
}
