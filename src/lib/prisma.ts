import { PrismaClient } from "@/generated/prisma/client";
import path from "node:path";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");
const databaseUrl = `file:${dbPath.replace(/\\/g, "/")}`;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma || new PrismaClient({ datasourceUrl: databaseUrl });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
