import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET ?weekStart=ISO — manager: every employee's bonus for that work week.
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "MANAGER") {
    return NextResponse.json({ error: "Manager access required" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const weekStart = searchParams.get("weekStart");
  if (!weekStart) return NextResponse.json({ error: "Missing weekStart" }, { status: 400 });

  const bonuses = await prisma.weeklyBonus.findMany({ where: { weekStart: new Date(weekStart) } });
  return NextResponse.json({ bonuses });
}

// POST: manager sets (or clears, when amount is 0/blank) an employee's
// bonus for a work week.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "MANAGER") {
    return NextResponse.json({ error: "Manager access required" }, { status: 403 });
  }
  const { employeeId, weekStart, amount, note } = await req.json();
  if (!employeeId || !weekStart) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const weekStartDate = new Date(weekStart);
  const numAmount = Number(amount);

  if (!amount || isNaN(numAmount) || numAmount === 0) {
    await prisma.weeklyBonus.deleteMany({ where: { employeeId, weekStart: weekStartDate } });
    return NextResponse.json({ ok: true, cleared: true });
  }

  const bonus = await prisma.weeklyBonus.upsert({
    where: { employeeId_weekStart: { employeeId, weekStart: weekStartDate } },
    update: { amount: numAmount, note: note || null },
    create: { employeeId, weekStart: weekStartDate, amount: numAmount, note: note || null },
  });
  return NextResponse.json({ bonus });
}
