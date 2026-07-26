import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
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

// Manager adds a real employee: creates their login (email + temp password)
// and Employee record together.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "MANAGER") {
    return NextResponse.json({ error: "Manager access required" }, { status: 403 });
  }
  const { name, jobType, email, password } = await req.json();
  if (!name || !jobType || !email || !password) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "That email is already in use" }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, name, role: "EMPLOYEE", employee: { create: { name, jobType } } },
    include: { employee: true },
  });
  return NextResponse.json({ employee: user.employee });
}

// Manager removes an employee (and their login).
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "MANAGER") {
    return NextResponse.json({ error: "Manager access required" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const employee = await prisma.employee.findUnique({ where: { id } });
  if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.timeEntry.deleteMany({ where: { employeeId: id } });
  await prisma.shift.deleteMany({ where: { employeeId: id } });
  await prisma.recurringTemplate.deleteMany({ where: { employeeId: id } });
  await prisma.employee.delete({ where: { id } });
  if (employee.userId) await prisma.user.delete({ where: { id: employee.userId } });

  return NextResponse.json({ ok: true });
}
