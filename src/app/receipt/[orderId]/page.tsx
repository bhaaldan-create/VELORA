import Link from "next/link";
import { notFound } from "next/navigation";
import { VeloraReceipt } from "@/components/admin/VeloraReceipt";
import { WhatsAppReceiptActions } from "@/components/admin/WhatsAppReceiptActions";
import { getStoredOrder } from "@/lib/orders";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ orderId: string }>;
  searchParams?: Promise<{ send?: string }>;
};

export default async function PublicReceiptPage({ params, searchParams }: Props) {
  const { orderId } = await params;
  const sp = (await searchParams) || {};
  const entry = await getStoredOrder(orderId);
  if (!entry) notFound();

  const isAdminSend = sp.send === "1";

  return (
    <main className="min-h-screen bg-[#F4F0F8] px-3 py-6 sm:px-6 sm:py-10">
      {isAdminSend ? (
        <div className="mx-auto mb-5 flex w-[850px] max-w-full flex-wrap items-center justify-between gap-3 print:hidden">
          <Link
            href="/admin/orders"
            className="t3 text-[var(--plum)] underline-offset-4 hover:underline"
            dir="rtl"
          >
            ← صندوق الطلبات
          </Link>
          <WhatsAppReceiptActions order={entry} autoOpenWhatsApp />
        </div>
      ) : null}

      {/* تمرير أفقي على الشاشات الضيقة مع الإبقاء على مقاس الوصل 850px للتصدير الصحيح */}
      <div className="mx-auto w-full max-w-[850px] overflow-x-auto">
        <VeloraReceipt order={entry} />
      </div>

      {!isAdminSend ? (
        <p
          className="mx-auto mt-6 max-w-[850px] text-center text-[12px] text-[var(--muted)] print:hidden"
          dir="rtl"
        >
          وصل رسمي من VELORA — تم ملؤه تلقائياً من طلبكِ رقم {entry.orderId}
        </p>
      ) : null}
    </main>
  );
}
