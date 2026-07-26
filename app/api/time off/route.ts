import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: employees see their own requests; managers see everyone's.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isManager = (session.user as any).role === "MANAGER";
  const employeeId = (session.user as any).employeeId;

  const requests = await prisma.timeOffRequest.findMany({
    where: isManager ? {} : { employeeId },
    include: { employee: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    requests: requests.map((r) => ({
      id: r.id,
      employeeName: r.employee.name,
      startDate: r.startDate,
      endDate: r.endDate,
      reason: r.reason,
      status: r.status,
      createdAt: r.createdAt,
    })),
  });
}

// POST: an employee submits a new time-off request.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const employeeId = (session?.user as any)?.employeeId;
  if (!employeeId) return NextResponse.json({ error: "Not an employee" }, { status: 403 });

  const { startDate, endDate, reason } = await req.json();
  if (!startDate || !endDate) return NextResponse.json({ error: "Missing dates" }, { status: 400 });

  const request = await prisma.timeOffRequest.create({
    data: { employeeId, startDate: new Date(startDate), endDate: new Date(endDate), reason },
  });
  return NextResponse.json({ request });
}

// PUT: manager approves or denies a request.
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "MANAGER") {
    return NextResponse.json({ error: "Manager access required" }, { status: 403 });
  }
  const { id, status } = await req.json();
  if (!id || !["APPROVED", "DENIED"].includes(status)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const request = await prisma.timeOffRequest.update({ where: { id }, data: { status } });
  return NextResponse.json({ request });
}
