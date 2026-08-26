import { prisma } from "../src/lib/db";
import { listStoredOrders } from "../src/lib/orders";
import { isMyVeloraEligibleOrder } from "../src/lib/my-velora/eligibility";
import {
  ensureVeloraCardForOrder,
  buildCardPayload,
} from "../src/lib/my-velora/generate";
import { renderMyVeloraCardPng } from "../src/lib/my-velora/render-card";
import { writeFile } from "node:fs/promises";

async function main() {
  const orders = await listStoredOrders();
  const entry = orders.find((o) => isMyVeloraEligibleOrder(o));
  if (!entry) {
    console.log("No eligible order");
    return;
  }
  console.log("order", entry.orderId, "items", entry.order.items.length);

  let customerId = entry.order.customerId;
  if (!customerId) {
    const c = await prisma.customer.findUnique({
      where: { email: entry.order.email.trim().toLowerCase() },
      select: { id: true },
    });
    customerId = c?.id;
  }
  if (!customerId) throw new Error("no customer");

  const card = await ensureVeloraCardForOrder({ entry, customerId });
  if (!card) throw new Error("no card");

  const payload = await buildCardPayload({
    entry,
    customerId,
    referralToken: card.referralToken,
  });
  console.log({
    products: payload.products.map((p) => ({
      id: p.id,
      imageUrl: p.imageUrl?.slice(0, 40),
      brand: p.brandName,
    })),
    brands: payload.brands,
    points: payload.pointsEarned,
  });

  const png = await renderMyVeloraCardPng({ payload, locale: "en" });
  await writeFile("tmp-my-velora-card.png", png);
  console.log("wrote tmp-my-velora-card.png", png.length, "bytes");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
