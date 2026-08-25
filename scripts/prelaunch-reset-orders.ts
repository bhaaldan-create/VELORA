/**
 * Phase 0 — Pre-launch order wipe
 * Deletes ALL Order rows only. Does not touch products, customers, employees, CMS.
 *
 * Usage: npx tsx scripts/prelaunch-reset-orders.ts
 */
import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local", override: true });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const url = process.env.DATABASE_URL;
if (!url || url.startsWith("file:")) {
  throw new Error("DATABASE_URL must be PostgreSQL before running this script.");
}

const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

async function main() {
  const before = await prisma.order.count();
  console.log(`[prelaunch] Orders before wipe: ${before}`);

  if (before === 0) {
    console.log("[prelaunch] Nothing to delete. Already clean.");
    return;
  }

  const result = await prisma.order.deleteMany({});
  const after = await prisma.order.count();

  console.log(`[prelaunch] Deleted: ${result.count}`);
  console.log(`[prelaunch] Orders after wipe: ${after}`);
  console.log("[prelaunch] Products / customers / employees / CMS untouched.");
}

main()
  .catch((err) => {
    console.error("[prelaunch] FAILED", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
