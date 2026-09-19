import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30 * 1000,
  connectionTimeoutMillis: 2 * 1000,
});
const adapter = new PrismaPg(pool);
const Prisma = new PrismaClient({ adapter });

declare global {
  var prisma: PrismaClient | typeof Prisma;
}

const prisma = globalThis.prisma || Prisma;

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export default prisma;
