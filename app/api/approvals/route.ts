import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "MANAGER") {
    return NextResponse.json({ error: "Manager access required" }, { status: 403 });
  }
  const { employeeId, weekStart } = await req.json();
  if (!employeeId || !weekStart) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const approval = await prisma.weekApproval.upsert({
    where: { employeeId_weekStart: { employeeId, weekStart: new Date(weekStart) } },
    update: {},
    create: { employeeId, weekStart: new Date(weekStart) },
  });
  return NextResponse.json({ approval });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "MANAGER") {
    return NextResponse.json({ error: "Manager access required" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employeeId");
  const weekStart = searchParams.get("weekStart");
  if (!employeeId || !weekStart) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  await prisma.weekApproval.deleteMany({ where: { employeeId, weekStart: new Date(weekStart) } });
  return NextResponse.json({ ok: true });
}
