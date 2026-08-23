import { AdminShell } from "@/components/admin/AdminShell";
import { WhatsAppAdminPanel } from "@/components/admin/WhatsAppAdminPanel";

export default function AdminWhatsAppPage() {
  return (
    <AdminShell
      title="واتساب"
      subtitle="الاتصال، القوالب، واختبار الإرسال لعمليات VELORA."
      active="whatsapp"
    >
      <WhatsAppAdminPanel />
    </AdminShell>
  );
}
