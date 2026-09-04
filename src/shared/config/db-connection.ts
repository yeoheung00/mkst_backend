import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma } from "@generated/prisma/client";
import { Pool } from "pg";
import "dotenv/config";
import { TocItem } from "src/api/blog/blog.types";


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30 * 1000,
  connectionTimeoutMillis: 2 * 1000,
});
const adapter = new PrismaPg(pool);
const basePrisma = new PrismaClient({ adapter });
const extendedPrisma = basePrisma.$extends({
  result: {
    post: {
      toc: {
        needs: { toc: true },
        compute(post): TocItem[] {
          return (post.toc as unknown as TocItem[]) ?? [];
        },
      },
    },
  },
});

declare global {
  var prisma: PrismaClient | typeof extendedPrisma;
}

const prisma = globalThis.prisma || extendedPrisma;

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export default prisma;
