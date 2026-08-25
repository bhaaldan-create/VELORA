/**
 * Backfill MY VELORA cards for already-delivered eligible orders.
 * Safe to re-run (ensure is idempotent).
 */
import { prisma } from "../src/lib/db";
import { listStoredOrders } from "../src/lib/orders";
import { isMyVeloraEligibleOrder } from "../src/lib/my-velora/eligibility";
import { ensureVeloraCardForOrder } from "../src/lib/my-velora/generate";

async function main() {
  const all = await listStoredOrders();
  const delivered = all.filter((o) => o.status === "delivered");
  console.log(`Delivered orders: ${delivered.length}`);

  let created = 0;
  let skipped = 0;
  let ineligible = 0;
  let noCustomer = 0;

  for (const entry of delivered) {
    if (!isMyVeloraEligibleOrder(entry)) {
      ineligible += 1;
      console.log(`skip ineligible ${entry.orderId}`, {
        paymentMethod: entry.order.paymentMethod,
        paymentStatus: entry.order.paymentStatus,
      });
      continue;
    }

    let customerId = entry.order.customerId;
    if (!customerId && entry.order.email) {
      const customer = await prisma.customer.findUnique({
        where: { email: entry.order.email.trim().toLowerCase() },
        select: { id: true },
      });
      customerId = customer?.id;
    }
    if (!customerId) {
      noCustomer += 1;
      console.log(`skip no customer ${entry.orderId}`);
      continue;
    }

    const before = await prisma.veloraCard.findFirst({
      where: { customerId, orderId: entry.orderId, cardType: "order" },
      select: { id: true },
    });
    const card = await ensureVeloraCardForOrder({ entry, customerId });
    if (!card) {
      console.log(`failed ${entry.orderId}`);
      continue;
    }
    if (before) skipped += 1;
    else {
      created += 1;
      console.log(`created ${entry.orderId} → ${card.id}`);
    }
  }

  console.log({ created, skipped, ineligible, noCustomer });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
