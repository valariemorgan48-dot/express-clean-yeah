import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWorkWeekBounds } from "@/lib/workweek";

async function ensureShiftsForCurrentWeek() {
  const { start } = getWorkWeekBounds();
  const templates = await prisma.recurringTemplate.findMany({ where: { active: true } });

  for (const t of templates) {
    const shiftDate = new Date(start);
    const daysFromFriday = (t.dayOfWeek - 5 + 7) % 7;
    shiftDate.setDate(start.getDate() + daysFromFriday);

    const existing = await prisma.shift.findFirst({
      where: { templateId: t.id, date: shiftDate },
    });
    if (!existing) {
      await prisma.shift.create({
        data: {
          employeeId: t.employeeId,
          date: shiftDate,
          time: t.time,
          jobType: t.jobType,
          address: t.address,
          templateId: t.id,
        },
      });
    }
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureShiftsForCurrentWeek();

  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employeeId");
  const { start, end } = getWorkWeekBounds();

  const shifts = await prisma.shift.findMany({
    where: {
      date: { gte: start, lte: end },
      ...(employeeId ? { employeeId } : {}),
    },
    include: { employee: true, template: true },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  return NextResponse.json({
    shifts: shifts.map((s) => ({
      id: s.id,
      date: s.date,
      time: s.time,
      employeeId: s.employeeId,
      employeeName: s.employee.name,
      jobType: s.jobType,
      address: s.address,
      rate: s.rate,
      repeats: !!s.templateId,
    })),
  });
}

function parseRate(rate: unknown) {
  return rate !== undefined && rate !== null && rate !== "" && !isNaN(Number(rate)) ? Number(rate) : null;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "MANAGER") {
    return NextResponse.json({ error: "Manager access required" }, { status: 403 });
  }

  const body = await req.json();
  const { employeeId, date, time, jobType, address, repeats, rate } = body;
  if (!employeeId || !date || !time || !jobType || !address) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  let templateId: string | undefined;
  if (repeats) {
    const template = await prisma.recurringTemplate.create({
      data: { employeeId, dayOfWeek: new Date(date).getDay(), time, jobType, address },
    });
    templateId = template.id;
  }

  const shift = await prisma.shift.create({
    data: { employeeId, date: new Date(date), time, jobType, address, templateId, rate: repeats ? null : parseRate(rate) },
  });

  return NextResponse.json({ shift });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "MANAGER") {
    return NextResponse.json({ error: "Manager access required" }, { status: 403 });
  }
  const body = await req.json();
  const { id, employeeId, date, time, jobType, address, rate } = body;
  if (!id || !employeeId || !date || !time || !jobType || !address) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const existing = await prisma.shift.findUnique({ where: { id } });
  const shift = await prisma.shift.update({
    where: { id },
    data: {
      employeeId,
      date: new Date(date),
      time,
      jobType,
      address,
      ...(existing?.templateId ? {} : { rate: parseRate(rate) }),
    },
  });
  return NextResponse.json({ shift });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "MANAGER") {
    return NextResponse.json({ error: "Manager access required" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const series = searchParams.get("series") === "true";
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const shift = await prisma.shift.findUnique({ where: { id } });
  if (!shift) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (series && shift.templateId) {
    await prisma.shift.deleteMany({ where: { templateId: shift.templateId } });
    await prisma.recurringTemplate.update({ where: { id: shift.templateId }, data: { active: false } });
  } else {
    await prisma.shift.delete({ where: { id } });
  }
  return NextResponse.json({ ok: true });
}
