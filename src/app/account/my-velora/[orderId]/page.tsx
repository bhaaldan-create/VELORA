import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { MyVeloraPreview } from "@/components/my-velora/MyVeloraPreview";
import {
  CUSTOMER_COOKIE,
  verifyCustomerSessionToken,
} from "@/lib/customer-auth";
import { prisma } from "@/lib/db";
import { getStoredOrder } from "@/lib/orders";
import {
  isMyVeloraEligibleOrder,
  orderBelongsToCustomer,
} from "@/lib/my-velora/eligibility";
import {
  ensureVeloraCardForOrder,
  parseCardPayload,
} from "@/lib/my-velora/generate";
import { getVeloraCardConfig } from "@/lib/my-velora/config";
import type { VeloraCardStyleKey } from "@/lib/my-velora/types";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ orderId: string }> };

export default async function MyVeloraOrderPage({ params }: Props) {
  const { orderId } = await params;
  const jar = await cookies();
  const session = await verifyCustomerSessionToken(
    jar.get(CUSTOMER_COOKIE)?.value,
  );
  if (!session) redirect(`/login?next=/account/my-velora/${orderId}`);

  const customer = await prisma.customer.findUnique({
    where: { id: session.customerId },
    select: { id: true, email: true },
  });
  if (!customer) redirect("/login");

  const entry = await getStoredOrder(orderId);
  if (!entry || !isMyVeloraEligibleOrder(entry)) notFound();

  const email = customer.email.trim().toLowerCase();
  if (!orderBelongsToCustomer(entry, customer.id, email)) notFound();

  const cardRef = await ensureVeloraCardForOrder({
    entry,
    customerId: customer.id,
  });
  if (!cardRef) notFound();

  const row = await prisma.veloraCard.findUnique({
    where: { id: cardRef.id },
    include: {
      reviews: { where: { customerId: customer.id }, take: 1 },
    },
  });
  if (!row) notFound();

  const payload = parseCardPayload(row.payloadJson);
  if (!payload) notFound();

  const config = await getVeloraCardConfig();

  return (
    <MyVeloraPreview
      orderId={orderId}
      cardId={row.id}
      initialPayload={payload}
      initialStyleKey={row.styleKey as VeloraCardStyleKey}
      hasReview={row.reviews.length > 0}
      reviewRewardPoints={config.reviewRewardPoints}
    />
  );
}
