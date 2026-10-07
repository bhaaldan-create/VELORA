/**
 * Permanently remove أحمد مازن (Ahmedmazin) admin login.
 * Usage: npx tsx scripts/remove-ahmed-mazin.ts
 */
import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local", override: true });

async function main() {
  const { prisma } = await import("../src/lib/db");

  const matches = await prisma.employee.findMany({
    where: {
      OR: [
        { username: { equals: "Ahmedmazin", mode: "insensitive" } },
        { username: { equals: "ahmedmazin", mode: "insensitive" } },
        { name: { contains: "أحمد مازن" } },
        { name: { contains: "احمد مازن" } },
      ],
    },
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      isActive: true,
    },
  });

  console.log("[remove-ahmed] found:", matches);

  if (!matches.length) {
    console.log("[remove-ahmed] nothing to delete.");
    await prisma.$disconnect();
    return;
  }

  for (const emp of matches) {
    await prisma.employee.delete({ where: { id: emp.id } });
    console.log("[remove-ahmed] deleted:", emp.username || emp.name, emp.id);
  }

  await prisma.$disconnect();
  console.log("[remove-ahmed] done.");
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
