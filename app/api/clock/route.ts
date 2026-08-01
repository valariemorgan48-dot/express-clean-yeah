import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const employeeId = (session?.user as any)?.employeeId;
  if (!employeeId) return NextResponse.json({ error: "Not an employee" }, { status: 403 });

  const [open, employee] = await Promise.all([
    prisma.timeEntry.findFirst({ where: { employeeId, clockOut: null }, orderBy: { clockIn: "desc" } }),
    prisma.employee.findUnique({ where: { id: employeeId } }),
  ]);
  return NextResponse.json({ open, defaultJobType: employee?.jobType });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const employeeId = (session?.user as any)?.employeeId;
  if (!employeeId) return NextResponse.json({ error: "Not an employee" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const open = await prisma.timeEntry.findFirst({ where: { employeeId, clockOut: null } });

  if (open) {
    const updated = await prisma.timeEntry.update({ where: { id: open.id }, data: { clockOut: new Date() } });
    return NextResponse.json({ entry: updated, clockedIn: false });
  }

  const now = new Date();
  let overrideRate: number | null = null;
  if (body.jobType) {
    const dayStart = new Date(now); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(now); dayEnd.setHours(23, 59, 59, 999);
    const matchingShift = await prisma.shift.findFirst({
      where: { employeeId, date: { gte: dayStart, lte: dayEnd }, jobType: body.jobType, rate: { not: null } },
    });
    overrideRate = matchingShift?.rate ?? null;
  }

  const created = await prisma.timeEntry.create({
    data: { employeeId, clockIn: now, jobType: body.jobType, address: body.address, rate: overrideRate },
  });
  return NextResponse.json({ entry: created, clockedIn: true });
}
