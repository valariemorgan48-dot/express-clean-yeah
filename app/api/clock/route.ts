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
app/api/timeentries/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "MANAGER") {
    return NextResponse.json({ error: "Manager access required" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employeeId");
  const weekStart = searchParams.get("weekStart");
  if (!employeeId || !weekStart) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  const entries = await prisma.timeEntry.findMany({
    where: { employeeId, clockIn: { gte: start, lte: end } },
    orderBy: { clockIn: "asc" },
  });
  return NextResponse.json({ entries });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "MANAGER") {
    return NextResponse.json({ error: "Manager access required" }, { status: 403 });
  }
  const { employeeId, clockIn, clockOut, jobType, address, rate } = await req.json();
  if (!employeeId || !clockIn) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  const entry = await prisma.timeEntry.create({
    data: {
      employeeId,
      clockIn: new Date(clockIn),
      clockOut: clockOut ? new Date(clockOut) : null,
      jobType: jobType || null,
      address: address || null,
      rate: rate !== undefined && rate !== "" && !isNaN(Number(rate)) ? Number(rate) : null,
    },
  });
  return NextResponse.json({ entry });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "MANAGER") {
    return NextResponse.json({ error: "Manager access required" }, { status: 403 });
  }
  const { id, clockIn, clockOut, jobType, address, rate } = await req.json();
  if (!id || !clockIn) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  const entry = await prisma.timeEntry.update({
    where: { id },
    data: {
      clockIn: new Date(clockIn),
      clockOut: clockOut ? new Date(clockOut) : null,
      jobType: jobType || null,
      address: address || null,
      rate: rate !== undefined && rate !== "" && !isNaN(Number(rate)) ? Number(rate) : null,
    },
  });
  return NextResponse.json({ entry });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "MANAGER") {
    return NextResponse.json({ error: "Manager access required" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.timeEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
