import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function generateTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "MANAGER") {
    return NextResponse.json({ error: "Manager access required" }, { status: 403 });
  }
  const employee = await prisma.employee.findUnique({ where: { id: params.id } });
  if (!employee?.userId) return NextResponse.json({ error: "This employee has no login" }, { status: 404 });

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  await prisma.user.update({ where: { id: employee.userId }, data: { passwordHash } });

  return NextResponse.json({ tempPassword });
}
