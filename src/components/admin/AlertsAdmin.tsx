"use client";

import { useEffect, useState } from "react";
import { PageHeader, Surface } from "@/components/admin/ui/primitives";
import { useAdminToast } from "@/components/admin/ui/Toast";

type Insight = {
  id: string;
  kind: string;
  severity: string;
  titleAr: string;
  bodyAr: string;
  whyAr: string;
};

export function AlertsAdmin() {
  const toast = useAdminToast();
  const [items, setItems] = useState<Insight[]>([]);

  async function load() {
    const res = await fetch("/api/admin/insights");
    const json = await res.json();
    if (json.ok) setItems(json.insights);
  }

  useEffect(() => {
    void load();
  }, []);

  async function generate() {
    const res = await fetch("/api/admin/insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate" }),
    });
    const json = await res.json();
    if (json.ok) {
      setItems(json.insights);
      toast.success(`تم توليد ${json.generated} تنبيهاً`);
    }
  }

  async function dismiss(id: string) {
    await fetch("/api/admin/insights", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "dismiss" }),
    });
    void load();
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="مركز التنبيهات"
        description="تنبيهات مبنية على قواعد من المخزون والهوامش — مع سبب واضح لكل تنبيه."
        actions={
          <button type="button" onClick={() => void generate()} className="rounded-full bg-[var(--admin-accent)] px-4 py-2 text-[12px] text-white">
            تحديث التنبيهات
          </button>
        }
      />
      <Surface className="overflow-hidden">
        {items.length === 0 ? (
          <p className="p-4 text-[13px] text-[var(--admin-text-muted)]">لا تنبيهات نشطة. اضغطي «تحديث التنبيهات».</p>
        ) : (
          <ul className="divide-y divide-[var(--admin-border)]">
            {items.map((i) => (
              <li key={i.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-[var(--admin-text-muted)]">
                    {i.severity} · {i.kind}
                  </p>
                  <p className="mt-0.5 text-[14px] font-medium">{i.titleAr}</p>
                  <p className="mt-1 text-[12px] text-[var(--admin-text-muted)]">{i.bodyAr}</p>
                  {i.whyAr ? (
                    <p className="mt-1 text-[11px] text-[var(--admin-text-muted)]">السبب: {i.whyAr}</p>
                  ) : null}
                </div>
                <button type="button" onClick={() => void dismiss(i.id)} className="rounded-full border border-[var(--admin-border)] px-3 py-1 text-[11px]">
                  تجاهل
                </button>
              </li>
            ))}
          </ul>
        )}
      </Surface>
    </div>
  );
}
