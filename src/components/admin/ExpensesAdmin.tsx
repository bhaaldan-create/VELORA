"use client";

import { useEffect, useState } from "react";
import { PageHeader, Surface } from "@/components/admin/ui/primitives";
import { useAdminToast } from "@/components/admin/ui/Toast";
import { formatPrice } from "@/lib/utils";

type Category = { id: string; nameAr: string; slug: string };
type Expense = {
  id: string;
  name: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  amountIqd: number;
  date: string;
  recurrence: string;
  vendor: string;
  category: Category | null;
};

export function ExpensesAdmin() {
  const toast = useAdminToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("IQD");
  const [rate, setRate] = useState("1");
  const [vendor, setVendor] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [categoryId, setCategoryId] = useState("");
  const [recurrence, setRecurrence] = useState<"one_time" | "recurring">("one_time");

  async function load() {
    const res = await fetch("/api/admin/expenses");
    const json = await res.json();
    if (json.ok) {
      setExpenses(json.expenses);
      setCategories(json.categories);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function create() {
    const res = await fetch("/api/admin/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        amount: Number(amount),
        currency,
        exchangeRate: currency === "IQD" ? 1 : Number(rate) || 1,
        date,
        categoryId: categoryId || null,
        recurrence,
        vendor,
      }),
    });
    const json = await res.json();
    if (!json.ok) {
      toast.push({ tone: "danger", title: json.error || "فشل" });
      return;
    }
    toast.push({ tone: "success", title: "تم تسجيل المصروف" });
    setName("");
    setAmount("");
    setVendor("");
    void load();
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="التكاليف والمصروفات"
        description="مصروفات تشغيلية بالدينار أو الدولار — يُحفظ سعر الصرف مع كل قيد."
      />
      <Surface className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <input className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-[13px]" placeholder="الاسم" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-[13px]" placeholder="المبلغ" value={amount} onChange={(e) => setAmount(e.target.value)} dir="ltr" />
        <div className="flex gap-2">
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
            <option value="IQD">IQD</option>
            <option value="USD">USD</option>
          </select>
          <input
            className="flex-1 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-[13px]"
            placeholder="سعر الصرف"
            value={rate}
            disabled={currency === "IQD"}
            onChange={(e) => setRate(e.target.value)}
            dir="ltr"
          />
        </div>
        <input type="date" className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-[13px]" value={date} onChange={(e) => setDate(e.target.value)} dir="ltr" />
        <select className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-[13px]" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">تصنيف</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.nameAr}</option>
          ))}
        </select>
        <input className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-[13px]" placeholder="المورد / الجهة" value={vendor} onChange={(e) => setVendor(e.target.value)} />
        <select className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-[13px]" value={recurrence} onChange={(e) => setRecurrence(e.target.value as "one_time" | "recurring")}>
          <option value="one_time">مرة واحدة</option>
          <option value="recurring">متكرر</option>
        </select>
        <button type="button" onClick={() => void create()} className="rounded-full bg-[var(--admin-accent)] px-4 py-2 text-[12px] text-white">
          حفظ المصروف
        </button>
      </Surface>
      <Surface className="overflow-hidden">
        {expenses.length === 0 ? (
          <p className="p-4 text-[13px] text-[var(--admin-text-muted)]">لا مصروفات بعد.</p>
        ) : (
          <ul className="divide-y divide-[var(--admin-border)]">
            {expenses.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-3 text-[13px]">
                <div>
                  <p className="font-medium">{e.name}</p>
                  <p className="text-[11px] text-[var(--admin-text-muted)]">
                    {e.date} · {e.category?.nameAr || "—"} · {e.recurrence === "recurring" ? "متكرر" : "مرة"}
                    {e.vendor ? ` · ${e.vendor}` : ""}
                    {e.currency !== "IQD" ? ` · ${e.amount} ${e.currency} × ${e.exchangeRate}` : ""}
                  </p>
                </div>
                <span className="admin-num font-semibold" dir="ltr">
                  {formatPrice(Math.round(e.amountIqd))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Surface>
    </div>
  );
}
