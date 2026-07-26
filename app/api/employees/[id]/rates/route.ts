import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const JOB_TYPES = ["Residential Cleaning", "Commercial Cleaning", "Local Moving", "Long-Distance Moving", "Lawn Care"];

// PUT: manager sets an employee's base hourly rate and any per-job-type
// rate overrides. jobRates maps jobType -> rate string; "" clears an override.
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "MANAGER") {
    return NextResponse.json({ error: "Manager access required" }, { status: 403 });
  }
  const { hourlyRate, jobRates } = await req.json();
  const employeeId = params.id;

  if (hourlyRate !== undefined && hourlyRate !== null && hourlyRate !== "" && !isNaN(Number(hourlyRate))) {
    await prisma.employee.update({ where: { id: employeeId }, data: { hourlyRate: Number(hourlyRate) } });
  }

  if (jobRates) {
    for (const jobType of JOB_TYPES) {
      const raw = jobRates[jobType];
      if (raw === "" || raw === null || raw === undefined) {
        await prisma.jobRate.deleteMany({ where: { employeeId, jobType } });
      } else if (!isNaN(Number(raw))) {
        await prisma.jobRate.upsert({
          where: { employeeId_jobType: { employeeId, jobType } },
          update: { rate: Number(raw) },
          create: { employeeId, jobType, rate: Number(raw) },
        });
      }
    }
  }

  const employee = await prisma.employee.findUnique({ where: { id: employeeId }, include: { jobRates: true } });
  return NextResponse.json({ employee });
}
