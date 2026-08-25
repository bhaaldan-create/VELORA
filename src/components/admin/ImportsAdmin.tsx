"use client";

import { useEffect, useState } from "react";
import { PageHeader, Surface } from "@/components/admin/ui/primitives";
import { useAdminToast } from "@/components/admin/ui/Toast";
import { formatPrice } from "@/lib/utils";

type Shipment = {
  id: string;
  code: string;
  status: string;
  currency: string;
  exchangeRate: number;
  purchaseTotal: number;
  totalLandedIqd: number;
  supplier: { id: string; name: string } | null;
  items: {
    id: string;
    quantity: number;
    unitCost: number;
    product: { id: string; nameAr: string };
  }[];
};

export function ImportsAdmin() {
  const toast = useAdminToast();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [products, setProducts] = useState<{ id: string; nameAr: string }[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string; currency: string }[]>([]);
  const [code, setCode] = useState(`IMP-${new Date().getFullYear()}-`);
  const [supplierId, setSupplierId] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [rate, setRate] = useState("1500");
  const [shipping, setShipping] = useState("0");
  const [customs, setCustoms] = useState("0");
  const [selectedShipment, setSelectedShipment] = useState("");
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("1");
  const [unitCost, setUnitCost] = useState("0");

  async function load() {
    const res = await fetch("/api/admin/imports");
    const json = await res.json();
    if (json.ok) {
      setShipments(json.shipments);
      setProducts(json.products);
      setSuppliers(json.suppliers);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createShipment() {
    const res = await fetch("/api/admin/imports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        code,
        supplierId: supplierId || null,
        currency,
        exchangeRate: Number(rate) || 1,
        shippingCost: Number(shipping) || 0,
        customsCost: Number(customs) || 0,
      }),
    });
    const json = await res.json();
    if (!json.ok) {
      toast.push({ tone: "danger", title: json.error || "فشل" });
      return;
    }
    toast.push({ tone: "success", title: "تم إنشاء الشحنة" });
    setSelectedShipment(json.shipment.id);
    void load();
  }

  async function addItem() {
    if (!selectedShipment || !productId) return;
    const res = await fetch("/api/admin/imports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "addItem",
        shipmentId: selectedShipment,
        productId,
        quantity: Number(qty) || 1,
        unitCost: Number(unitCost) || 0,
      }),
    });
    const json = await res.json();
    if (!json.ok) {
      toast.push({ tone: "danger", title: json.error || "فشل" });
      return;
    }
    toast.push({ tone: "success", title: "تمت إضافة الصنف" });
    void load();
  }

  async function receive(id: string) {
    const res = await fetch("/api/admin/imports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "receive", shipmentId: id }),
    });
    const json = await res.json();
    if (!json.ok) {
      toast.push({ tone: "danger", title: json.error || "فشل الاستلام" });
      return;
    }
    toast.push({
      tone: "success",
      title: `تم الاستلام — تكلفة واصلة ${formatPrice(Math.round(json.totalLandedIqd || 0))}`,
    });
    void load();
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="إدارة الاستيراد"
        description="شحنات، تكاليف واصلة، واستلام يحدّث المخزون تلقائياً."
      />

      <Surface className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-[11px] text-[var(--admin-text-muted)]">
          رمز الشحنة
          <input className="mt-1 w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-[13px]" value={code} onChange={(e) => setCode(e.target.value)} dir="ltr" />
        </label>
        <label className="text-[11px] text-[var(--admin-text-muted)]">
          المورد
          <select className="mt-1 w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-[13px]" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
            <option value="">—</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
        <label className="text-[11px] text-[var(--admin-text-muted)]">
          العملة / سعر الصرف → د.ع
          <div className="mt-1 flex gap-2">
            <select
              className="w-24 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-[13px]"
              value={currency}
              onChange={(e) => {
                const next = e.target.value;
                setCurrency(next);
                if (next === "IQD") setRate("1");
                else if (rate === "1") setRate("1500");
              }}
            >
              <option value="USD">USD</option>
              <option value="IQD">IQD</option>
            </select>
            <input className="flex-1 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-[13px]" value={rate} onChange={(e) => setRate(e.target.value)} dir="ltr" />
          </div>
        </label>
        <label className="text-[11px] text-[var(--admin-text-muted)]">
          شحن
          <input className="mt-1 w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-[13px]" value={shipping} onChange={(e) => setShipping(e.target.value)} dir="ltr" />
        </label>
        <label className="text-[11px] text-[var(--admin-text-muted)]">
          جمارك
          <input className="mt-1 w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-[13px]" value={customs} onChange={(e) => setCustoms(e.target.value)} dir="ltr" />
        </label>
        <div className="flex items-end">
          <button type="button" onClick={() => void createShipment()} className="rounded-full bg-[var(--admin-accent)] px-4 py-2 text-[12px] text-white">
            إنشاء شحنة
          </button>
        </div>
      </Surface>

      <Surface className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-[11px] text-[var(--admin-text-muted)]">
          الشحنة
          <select className="mt-1 w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-[13px]" value={selectedShipment} onChange={(e) => setSelectedShipment(e.target.value)}>
            <option value="">—</option>
            {shipments.filter((s) => s.status !== "Received" && s.status !== "Completed").map((s) => (
              <option key={s.id} value={s.id}>{s.code}</option>
            ))}
          </select>
        </label>
        <label className="text-[11px] text-[var(--admin-text-muted)]">
          المنتج
          <select className="mt-1 w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-[13px]" value={productId} onChange={(e) => setProductId(e.target.value)}>
            <option value="">—</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.nameAr}</option>
            ))}
          </select>
        </label>
        <label className="text-[11px] text-[var(--admin-text-muted)]">
          الكمية / تكلفة الوحدة
          <div className="mt-1 flex gap-2">
            <input className="w-20 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-[13px]" value={qty} onChange={(e) => setQty(e.target.value)} dir="ltr" />
            <input className="flex-1 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-[13px]" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} dir="ltr" />
          </div>
        </label>
        <div className="flex items-end">
          <button type="button" onClick={() => void addItem()} className="rounded-full border border-[var(--admin-border)] px-4 py-2 text-[12px]">
            إضافة صنف
          </button>
        </div>
      </Surface>

      <Surface className="overflow-hidden">
        <ul className="divide-y divide-[var(--admin-border)]">
          {shipments.map((s) => (
            <li key={s.id} className="px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{s.code} · {s.status}</p>
                  <p className="text-[11px] text-[var(--admin-text-muted)]">
                    {s.supplier?.name || "بدون مورد"} · {s.currency}×{s.exchangeRate} · واصلة {formatPrice(Math.round(s.totalLandedIqd))}
                  </p>
                </div>
                {s.status !== "Received" && s.status !== "Completed" ? (
                  <button type="button" onClick={() => void receive(s.id)} className="rounded-full bg-[var(--admin-accent)] px-3 py-1.5 text-[11px] text-white">
                    استلام الشحنة
                  </button>
                ) : null}
              </div>
              {s.items.length ? (
                <ul className="mt-2 space-y-1 text-[12px] text-[var(--admin-text-muted)]">
                  {s.items.map((i) => (
                    <li key={i.id}>
                      {i.product.nameAr} × {i.quantity} @ {i.unitCost}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      </Surface>
    </div>
  );
}
