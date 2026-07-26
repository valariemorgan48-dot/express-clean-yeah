import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWorkWeekBounds } from "@/lib/workweek";

// GET: CSV of hours per employee for the given work week (?start=ISO date
// inside that week; defaults to the current work week).
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "MANAGER") {
    return NextResponse.json({ error: "Manager access required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const startParam = searchParams.get("start");
  const { start, end } = getWorkWeekBounds(startParam ? new Date(startParam) : new Date());

  const employees = await prisma.employee.findMany({
    include: { timeEntries: { where: { clockIn: { gte: start, lte: end } } } },
    orderBy: { name: "asc" },
  });

  const now = Date.now();
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
  const weekLabel = `${fmt(start)} - ${fmt(end)}`;

  const rows = employees.map((e) => {
    const totalMs = e.timeEntries.reduce((sum, t) => {
      const endMs = t.clockOut ? t.clockOut.getTime() : now;
      return sum + (endMs - t.clockIn.getTime());
    }, 0);
    const hours = Math.round((totalMs / 3_600_000) * 100) / 100;
    return [e.name, e.jobType, weekLabel, hours.toFixed(2)];
  });

  const csvEscape = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const lines = [
    ["Employee", "Job Type", "Work Week", "Hours"].map(csvEscape).join(","),
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
