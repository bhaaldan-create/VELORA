import { prisma } from "../src/lib/db";

async function main() {
  const orders = await prisma.order.findMany({
    orderBy: { savedAt: "desc" },
    take: 12,
  });
  for (const o of orders) {
    const j = o.orderJson as Record<string, unknown>;
    console.log(
      JSON.stringify({
        id: o.id,
        status: o.status,
        email: j.email,
        customerId: j.customerId,
        paymentMethod: j.paymentMethod,
        paymentStatus: j.paymentStatus,
        items: Array.isArray(j.items) ? j.items.length : 0,
        total: j.total ?? j.subtotal,
        fullName: j.fullName,
      }),
    );
  }
  console.log("cards", await prisma.veloraCard.count());
  console.log("templates", await prisma.veloraCardTemplate.count());
  console.log("config", await prisma.veloraCardConfig.count());
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
