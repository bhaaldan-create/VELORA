import { AdminShell } from "@/components/admin/AdminShell";
import { PageHeader, Surface } from "@/components/admin/ui/primitives";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AdminMarketingPage() {
  return (
    <AdminShell active="marketing" title="التسويق">
      <div className="space-y-5">
        <PageHeader
          title="التسويق"
          description="قوالب واتساب والعروض — مرتبطة بمركز واتساب الحالي."
        />
        <Surface>
          <h2 className="text-[14px] font-semibold">قوالب الرسائل</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--admin-text-secondary)]">
            رسائل تأكيد الطلب، التجهيز، رقم التتبع، والتسليم تُدار من مركز واتساب
            وصفحة تفاصيل الطلب.
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {[
              "استلام الطلب",
              "تأكيد الطلب",
              "قيد التجهيز",
              "إنشاء شحنة",
              "رقم التتبع",
              "خرج للتسليم",
              "تم التسليم",
              "إلغاء",
            ].map((t) => (
              <li
                key={t}
                className="rounded-[8px] border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] px-3 py-2.5 text-[13px]"
              >
                {t}
              </li>
            ))}
          </ul>
          <Link
            href="/admin/whatsapp"
            className="mt-5 inline-flex h-9 items-center rounded-[8px] bg-[var(--admin-plum)] px-4 text-[13px] font-medium text-white"
          >
            فتح مركز واتساب
          </Link>
        </Surface>
      </div>
    </AdminShell>
  );
}
