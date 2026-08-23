import { AdminShell } from "@/components/admin/AdminShell";
import { PageHeader, Surface } from "@/components/admin/ui/primitives";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AdminSettingsPage() {
  return (
    <AdminShell active="settings" title="الإعدادات">
      <div className="space-y-5">
        <PageHeader
          title="الإعدادات"
          description="إعدادات التشغيل الأساسية لنظام VELORA Admin."
        />

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              title: "أتمتة الطلبات",
              desc: "قواعد WHEN / THEN للشحن وواتساب",
              href: "/admin/settings/automation",
            },
            {
              title: "واتساب",
              desc: "الاتصال، رمز QR، واختبار الإرسال",
              href: "/admin/whatsapp",
            },
            {
              title: "شركات التوصيل",
              desc: "ربط API والـ webhooks",
              href: "/admin/shipping",
            },
            {
              title: "الموظفون والصلاحيات",
              desc: "الفريق، الحضور، والرواتب",
              href: "/admin/employees",
            },
            {
              title: "المتجر",
              desc: "عرض الواجهة العامة للعملاء",
              href: "/",
            },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <Surface className="h-full transition hover:border-[var(--admin-border-strong)]">
                <h2 className="text-[14px] font-semibold text-[var(--admin-text)]">
                  {item.title}
                </h2>
                <p className="mt-1.5 text-[12px] text-[var(--admin-text-secondary)]">
                  {item.desc}
                </p>
              </Surface>
            </Link>
          ))}
        </div>

        <Surface>
          <h2 className="text-[13px] font-semibold">معلومات النظام</h2>
          <dl className="mt-3 space-y-2 text-[13px] text-[var(--admin-text-secondary)]">
            <div className="flex justify-between gap-3">
              <dt>المنصة</dt>
              <dd>VELORA Admin OS</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>الاتجاه</dt>
              <dd>RTL · العربية أولاً</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>الوضع الداكن</dt>
              <dd>جاهز عبر التوكنات الدلالية</dd>
            </div>
          </dl>
        </Surface>
      </div>
    </AdminShell>
  );
}
