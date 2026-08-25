import { AdminShell } from "@/components/admin/AdminShell";
import { PageHeader, Surface } from "@/components/admin/ui/primitives";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <AdminShell active="settings" title="سجل التدقيق">
      <div className="space-y-5">
        <PageHeader
          title="سجل التدقيق"
          description="تغييرات التكلفة والاستيراد والمصروفات والمخزون."
        />
        <Surface className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-start text-[12px]">
            <thead className="border-b border-[var(--admin-border)] text-[var(--admin-text-muted)]">
              <tr>
                <th className="px-3 py-2 font-medium">الوقت</th>
                <th className="px-3 py-2 font-medium">الفاعل</th>
                <th className="px-3 py-2 font-medium">الإجراء</th>
                <th className="px-3 py-2 font-medium">الكيان</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-10 text-center text-[var(--admin-text-muted)]"
                  >
                    لا سجلات بعد
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-[var(--admin-border)]/60"
                  >
                    <td className="px-3 py-2 admin-num" dir="ltr">
                      {log.createdAt.toISOString().slice(0, 19).replace("T", " ")}
                    </td>
                    <td className="px-3 py-2">{log.actorLabel || log.actorId}</td>
                    <td className="px-3 py-2 font-medium">{log.action}</td>
                    <td className="px-3 py-2">
                      {log.entityType}
                      {log.entityId ? (
                        <span className="ms-1 admin-num text-[var(--admin-text-muted)]">
                          {log.entityId.slice(0, 8)}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Surface>
      </div>
    </AdminShell>
  );
}
