import { AdminShell } from "@/components/admin/AdminShell";
import { AiBusinessAgent } from "@/components/admin/AiBusinessAgent";

export default function AdminAiPage() {
  return (
    <AdminShell active="ai" title="الوكيل الذكي">
      <AiBusinessAgent />
    </AdminShell>
  );
}
