import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWorkWeekBounds } from "@/lib/workweek";

// GET ?employeeId=&weekStart=ISO — manager: an employee's time entries for that work week.
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "MANAGER") {
    return NextResponse.json({ error: "Manager access required" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employeeId");
  const weekStart = searchParams.get("weekStart");
  if (!employeeId || !weekStart) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const { start, end } = getWorkWeekBounds(new Date(weekStart));

  const entries = await prisma.timeEntry.findMany({
    where: { employeeId, clockIn: { gte: start, lte: end } },
    orderBy: { clockIn: "asc" },
  });
  return NextResponse.json({ entries });
}

// POST: manager manually adds a time entry (e.g. an employee forgot to clock in).
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

// PUT: manager edits an existing time entry (fix a wrong time, missed punch, etc).
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

// DELETE: manager removes a time entry.
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
