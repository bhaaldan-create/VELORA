import { AdminShell } from "@/components/admin/AdminShell";
import { WhatsAppAdminPanel } from "@/components/admin/WhatsAppAdminPanel";

export default function AdminWhatsAppPage() {
  return (
    <AdminShell
      title="واتساب الشركة"
      subtitle="ربط رقم 07830000492 لإرسال رموز التحقق للزبائن"
      active="whatsapp"
    >
      <WhatsAppAdminPanel />
    </AdminShell>
  );
}
