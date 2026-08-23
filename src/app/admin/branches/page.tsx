import { AdminShell } from "@/components/admin/AdminShell";
import {
  EmptyState,
  PageHeader,
  Surface,
} from "@/components/admin/ui/primitives";
import { Building2 } from "@/components/admin/ui/icons";
import { listBranches } from "@/lib/admin-hr";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminBranchesPage() {
  const branches = await listBranches();

  return (
    <AdminShell active="branches" title="الفروع">
      <div className="space-y-5">
        <PageHeader
          title="الفروع"
          description="فروع VELORA المرتبطة بالموظفين والحضور."
          actions={
            <Link
              href="/admin/employees"
              className="inline-flex h-8 items-center rounded-[8px] bg-[var(--admin-plum)] px-3 text-[12px] font-medium text-white"
            >
              إدارة الموظفين
            </Link>
          }
        />

        {branches.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="لا توجد فروع"
            description="أضيفي فرعاً من قسم الموظفين لبدء تنظيم الفريق."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {branches.map((b) => (
              <Surface key={b.id}>
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-[15px] font-semibold text-[var(--admin-text)]">
                    {b.name}
                  </h2>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] ${
                      b.isActive
                        ? "bg-[var(--admin-success-bg)] text-[var(--admin-success)]"
                        : "bg-[var(--admin-surface-soft)] text-[var(--admin-text-muted)]"
                    }`}
                  >
                    {b.isActive ? "نشط" : "متوقف"}
                  </span>
                </div>
                <p className="mt-2 text-[12px] text-[var(--admin-text-secondary)]">
                  {b.city || "—"}
                  {b.address ? ` · ${b.address}` : ""}
                </p>
              </Surface>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
