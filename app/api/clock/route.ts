import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: current open time entry for the signed-in employee.
export async function GET() {
  const session = await getServerSession(authOptions);
  const employeeId = (session?.user as any)?.employeeId;
  if (!employeeId) return NextResponse.json({ error: "Not an employee" }, { status: 403 });

  const open = await prisma.timeEntry.findFirst({
    where: { employeeId, clockOut: null },
    orderBy: { clockIn: "desc" },
  });
  return NextResponse.json({ open });
}

// POST: toggle clock in/out for the signed-in employee.
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

  const created = await prisma.timeEntry.create({
    data: { employeeId, clockIn: new Date(), jobType: body.jobType, address: body.address },
  });
  return NextResponse.json({ entry: created, clockedIn: true });
}
