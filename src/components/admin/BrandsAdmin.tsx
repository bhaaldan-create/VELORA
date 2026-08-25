"use client";

import { useEffect, useState } from "react";
import { PageHeader, Surface } from "@/components/admin/ui/primitives";
import { useAdminToast } from "@/components/admin/ui/Toast";

type Brand = {
  id: string;
  name: string;
  slug: string;
  countryOfOrigin: string;
  officialWebsite: string;
  sourceCountry: string;
  notes: string;
  supplier: { id: string; name: string } | null;
};

export function BrandsAdmin() {
  const toast = useAdminToast();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [country, setCountry] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [notes, setNotes] = useState("");

  async function load() {
    const res = await fetch("/api/admin/brands");
    const json = await res.json();
    if (json.ok) {
      setBrands(json.brands);
      setSuppliers(json.suppliers);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function create() {
    const res = await fetch("/api/admin/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        officialWebsite: website,
        countryOfOrigin: country,
        supplierId: supplierId || null,
        notes,
      }),
    });
    const json = await res.json();
    if (!json.ok) {
      toast.error(json.error || "فشل");
      return;
    }
    toast.success("تمت إضافة العلامة");
    setName("");
    setWebsite("");
    setCountry("");
    setNotes("");
    void load();
  }

  return (
    <div className="space-y-5">
      <PageHeader title="ذكاء العلامات" description="من أين جاءت العلامة؟ من المورد؟ وما الربحية لاحقاً." />
      <Surface className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <input className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-[13px]" placeholder="اسم العلامة" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-[13px]" placeholder="الموقع الرسمي" value={website} onChange={(e) => setWebsite(e.target.value)} dir="ltr" />
        <input className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-[13px]" placeholder="بلد المنشأ" value={country} onChange={(e) => setCountry(e.target.value)} />
        <select className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-[13px]" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
          <option value="">المورد</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <input className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-[13px] sm:col-span-2" placeholder="ملاحظات" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <button type="button" onClick={() => void create()} className="rounded-full bg-[var(--admin-accent)] px-4 py-2 text-[12px] text-white">حفظ</button>
      </Surface>
      <Surface className="overflow-hidden">
        <ul className="divide-y divide-[var(--admin-border)]">
          {brands.map((b) => (
            <li key={b.id} className="px-4 py-3">
              <p className="font-medium">{b.name}</p>
              <p className="text-[11px] text-[var(--admin-text-muted)]">
                {b.countryOfOrigin || "—"} · مورد: {b.supplier?.name || "غير محدد"}
              </p>
              {b.officialWebsite ? (
                <a href={b.officialWebsite} target="_blank" rel="noreferrer" className="text-[11px] text-[var(--admin-accent)]" dir="ltr">
                  {b.officialWebsite}
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      </Surface>
    </div>
  );
}
