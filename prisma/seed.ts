import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const EMPLOYEES = [
  ["Marcus Reyes", "Residential Cleaning"],
  ["Dana Cho", "Commercial Cleaning"],
  ["Leo Martinez", "Local Moving"],
  ["Priya Patel", "Lawn Care"],
  ["Sam Okafor", "Long-Distance Moving"],
  ["Jordan Blake", "Residential Cleaning"],
  ["Nina Torres", "Commercial Cleaning"],
  ["Wes Hunter", "Local Moving"],
  ["Casey Lin", "Lawn Care"],
  ["Omar Siddiqui", "Residential Cleaning"],
  ["Ava Bennett", "Commercial Cleaning"],
  ["Tyrell Jackson", "Local Moving"],
  ["Grace Kim", "Lawn Care"],
  ["Diego Alvarez", "Long-Distance Moving"],
  ["Holly Sanders", "Residential Cleaning"],
];

async function main() {
  const managerPass = await bcrypt.hash("manager123", 10);
  const manager = await prisma.user.upsert({
    where: { email: "priya@expresssolutions.com" },
    update: {},
    create: {
      email: "priya@expresssolutions.com",
      passwordHash: managerPass,
      name: "Priya Patel",
      role: "MANAGER",
    },
  });

  const empPass = await bcrypt.hash("employee123", 10);
  for (const [name, jobType] of EMPLOYEES) {
    const email = name.toLowerCase().replace(/[^a-z]+/g, ".") + "@expresssolutions.com";
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, passwordHash: empPass, name, role: "EMPLOYEE" },
    });
    await prisma.employee.upsert({
      where: { userId: user.id },
      update: {},
      create: { name, jobType, userId: user.id },
    });
  }

  console.log("Seeded manager login: priya@expresssolutions.com / manager123");
  console.log("Seeded employee logins: <name>@expresssolutions.com / employee123");
}

main().finally(() => prisma.$disconnect());
