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
