"use client";

import { useEffect, useState } from "react";
import { PageHeader, Surface } from "@/components/admin/ui/primitives";
import { useAdminToast } from "@/components/admin/ui/Toast";

type Supplier = {
  id: string;
  name: string;
  country: string;
  website: string;
  catalogUrl: string;
  whatsappUrl: string;
  instagramUrl: string;
  alibabaUrl: string;
  currency: string;
  paymentTerms: string;
  reliabilityRating: number;
  notes: string;
  isActive: boolean;
};

const empty = {
  name: "",
  country: "",
  website: "",
  catalogUrl: "",
  whatsappUrl: "",
  instagramUrl: "",
  alibabaUrl: "",
  currency: "USD",
  paymentTerms: "",
  reliabilityRating: 3,
  notes: "",
};

export function SuppliersAdmin() {
  const toast = useAdminToast();
  const [items, setItems] = useState<Supplier[]>([]);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/suppliers");
    const json = await res.json();
    if (json.ok) setItems(json.suppliers);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function create() {
    if (!form.name.trim()) {
      toast.push({ tone: "danger", title: "اسم المورد مطلوب" });
      return;
    }
    const res = await fetch("/api/admin/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (!json.ok) {
      toast.push({ tone: "danger", title: json.error || "فشل الحفظ" });
      return;
    }
    toast.push({ tone: "success", title: "تم إضافة المورد" });
    setForm(empty);
    void load();
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="الموردون والمستوردون"
        description="احفظي روابط الموردين ومصادر العلامات ومعلومات التواصل."
      />

      <Surface className="space-y-3 p-4">
        <p className="text-[13px] font-medium">مورد جديد</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              ["name", "الاسم"],
              ["country", "الدولة"],
              ["website", "الموقع"],
              ["catalogUrl", "كتالوج"],
              ["whatsappUrl", "WhatsApp"],
              ["instagramUrl", "Instagram"],
              ["alibabaUrl", "Alibaba"],
              ["currency", "العملة"],
              ["paymentTerms", "شروط الدفع"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="text-[11px] text-[var(--admin-text-muted)]">
              {label}
              <input
                className="mt-1 w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-[13px] text-[var(--admin-text)]"
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                dir={key.includes("Url") || key === "currency" ? "ltr" : undefined}
              />
            </label>
          ))}
        </div>
        <textarea
          className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-[13px]"
          placeholder="ملاحظات"
          rows={2}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        />
        <button
          type="button"
          onClick={() => void create()}
          className="rounded-full bg-[var(--admin-accent)] px-4 py-2 text-[12px] text-white"
        >
          حفظ المورد
        </button>
      </Surface>

      <Surface className="overflow-hidden">
        {loading ? (
          <p className="p-4 text-[13px] text-[var(--admin-text-muted)]">جاري التحميل…</p>
        ) : items.length === 0 ? (
          <p className="p-4 text-[13px] text-[var(--admin-text-muted)]">لا يوجد موردون بعد.</p>
        ) : (
          <ul className="divide-y divide-[var(--admin-border)]">
            {items.map((s) => (
              <li key={s.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-[14px] font-medium">{s.name}</p>
                  <p className="text-[11px] text-[var(--admin-text-muted)]">
                    {s.country || "—"} · {s.currency} · تقييم {s.reliabilityRating}/5
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                    {s.website ? (
                      <a href={s.website} target="_blank" rel="noreferrer" className="text-[var(--admin-accent)]">
                        موقع
                      </a>
                    ) : null}
                    {s.catalogUrl ? (
                      <a href={s.catalogUrl} target="_blank" rel="noreferrer" className="text-[var(--admin-accent)]">
                        كتالوج
                      </a>
                    ) : null}
                    {s.whatsappUrl ? (
                      <a href={s.whatsappUrl} target="_blank" rel="noreferrer" className="text-[var(--admin-accent)]">
                        WhatsApp
                      </a>
                    ) : null}
                    {s.instagramUrl ? (
                      <a href={s.instagramUrl} target="_blank" rel="noreferrer" className="text-[var(--admin-accent)]">
                        Instagram
                      </a>
                    ) : null}
                    {s.alibabaUrl ? (
                      <a href={s.alibabaUrl} target="_blank" rel="noreferrer" className="text-[var(--admin-accent)]">
                        Alibaba
                      </a>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Surface>
    </div>
  );
}
