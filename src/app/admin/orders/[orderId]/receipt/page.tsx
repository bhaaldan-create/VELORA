import Link from "next/link";
import { notFound } from "next/navigation";
import { VeloraReceipt } from "@/components/admin/VeloraReceipt";
import { WhatsAppReceiptActions } from "@/components/admin/WhatsAppReceiptActions";
import { getStoredOrder } from "@/lib/orders";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ orderId: string }> };

export default async function OrderReceiptPage({ params }: Props) {
  const { orderId } = await params;
  const entry = await getStoredOrder(orderId);
  if (!entry) notFound();

  return (
    <main className="min-h-screen bg-[#F1EAE6] px-3 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto mb-5 flex w-[850px] max-w-full flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/admin/orders"
          className="t3 text-[var(--plum)] underline-offset-4 hover:underline"
          dir="rtl"
        >
          ← صندوق الطلبات
        </Link>
        <WhatsAppReceiptActions order={entry} />
      </div>

      <div className="mx-auto w-full max-w-[850px] overflow-x-auto">
        <VeloraReceipt order={entry} />
      </div>
    </main>
  );
}
