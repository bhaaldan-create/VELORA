import { AdminShell } from "@/components/admin/AdminShell";
import { PageHeader, Surface } from "@/components/admin/ui/primitives";

export const dynamic = "force-dynamic";

const RULES = [
  {
    when: "الحالة = جاهز للشحن",
    then: ["إنشاء شحنة", "توليد رقم تتبع", "إرسال واتساب", "تحديث المسار"],
  },
  {
    when: "الحالة = قيد التجهيز",
    then: ["فتح الوصل", "رسالة واتساب للعميلة"],
  },
  {
    when: "Webhook من شركة التوصيل = تم التسليم",
    then: ["تحديث الطلب إلى تم التسليم", "إشعار واتساب"],
  },
];

export default function AdminAutomationHint() {
  return (
    <AdminShell active="settings" title="الأتمتة">
      <div className="space-y-5">
        <PageHeader
          title="أتمتة الطلبات"
          description="قواعد مرئية — التنفيذ الكامل يُفعَّل مع ربط شركات التوصيل."
        />
        <div className="space-y-3">
          {RULES.map((rule) => (
            <Surface key={rule.when}>
              <p className="text-[11px] font-medium tracking-wide text-[var(--admin-text-muted)]">
                WHEN
              </p>
              <p className="mt-1 text-[14px] font-semibold text-[var(--admin-text)]">
                {rule.when}
              </p>
              <p className="mt-3 text-[11px] font-medium tracking-wide text-[var(--admin-text-muted)]">
                THEN
              </p>
              <ul className="mt-1.5 space-y-1">
                {rule.then.map((step) => (
                  <li
                    key={step}
                    className="flex items-center gap-2 text-[13px] text-[var(--admin-text-secondary)]"
                  >
                    <span className="size-1.5 rounded-full bg-[var(--admin-plum-soft)]" />
                    {step}
                  </li>
                ))}
              </ul>
            </Surface>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
