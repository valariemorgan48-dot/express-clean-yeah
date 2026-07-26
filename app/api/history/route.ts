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
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  const hourlyRate = employee?.hourlyRate ?? 0;

  const now = Date.now();
  const history = weeks.map((w) => {
    const weekEntries = entries.filter((e) => e.clockIn >= w.start && e.clockIn <= w.end);
    const totalMs = weekEntries.reduce((sum, e) => {
      const endMs = e.clockOut ? e.clockOut.getTime() : now;
      return sum + (endMs - e.clockIn.getTime());
    }, 0);
    const hours = Math.round((totalMs / 3_600_000) * 100) / 100;
    return { label: w.label, hours, hourlyRate, pay: Math.round(hours * hourlyRate * 100) / 100 };
  });

  return NextResponse.json({ history });
}
