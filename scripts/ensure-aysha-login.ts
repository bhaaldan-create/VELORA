/**
 * Ensures عائشة المشهداني admin login exists (AyshaBahaa).
 * Usage: npx tsx scripts/ensure-aysha-login.ts
 */
import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local", override: true });

async function main() {
  const { ensureDefaultStaffLogins, findEmployeeByUsername } = await import(
    "../src/lib/admin-hr"
  );
  const { prisma } = await import("../src/lib/db");

  await ensureDefaultStaffLogins();
  const e = await findEmployeeByUsername("AyshaBahaa");
  console.log(
    JSON.stringify(
      {
        ok: Boolean(e),
        id: e?.id,
        name: e?.name,
        username: e?.username,
        role: e?.role,
        active: e?.isActive,
        hasPassword: Boolean(e?.passwordHash),
      },
      null,
      2,
    ),
  );
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  process.exitCode = 1;
  try {
    const { prisma } = await import("../src/lib/db");
    await prisma.$disconnect();
  } catch {
    /* ignore */
  }
});
