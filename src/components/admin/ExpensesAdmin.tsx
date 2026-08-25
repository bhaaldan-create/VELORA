"use client";

import { useEffect, useState } from "react";
import { PageHeader, Surface } from "@/components/admin/ui/primitives";
import { useAdminToast } from "@/components/admin/ui/Toast";
import { formatPrice } from "@/lib/utils";

type Category = { id: string; nameAr: string; slug: string };
type Expense = {
  id: string;
  name: string;
  amountIqd: number;
  date: string;
  recurrence: string;
  category: Category | null;
};

export function ExpensesAdmin() {
  const toast = useAdminToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
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
        currency: "IQD",
        exchangeRate: 1,
        date,
        categoryId: categoryId || null,
        recurrence,
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
    void load();
  }

  return (
    <div className="space-y-5">
      <PageHeader title="التكاليف والمصروفات" description="مصروفات تشغيلية متكررة أو لمرة واحدة بالدينار." />
      <Surface className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <input className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-[13px]" placeholder="الاسم" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-[13px]" placeholder="المبلغ د.ع" value={amount} onChange={(e) => setAmount(e.target.value)} dir="ltr" />
        <input type="date" className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-[13px]" value={date} onChange={(e) => setDate(e.target.value)} dir="ltr" />
        <select className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-[13px]" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">تصنيف</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.nameAr}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <select className="flex-1 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-[13px]" value={recurrence} onChange={(e) => setRecurrence(e.target.value as "one_time" | "recurring")}>
            <option value="one_time">مرة واحدة</option>
            <option value="recurring">متكرر</option>
          </select>
          <button type="button" onClick={() => void create()} className="rounded-full bg-[var(--admin-accent)] px-4 text-[12px] text-white">إضافة</button>
        </div>
      </Surface>
      <Surface className="overflow-hidden">
        <ul className="divide-y divide-[var(--admin-border)]">
          {expenses.map((e) => (
            <li key={e.id} className="flex justify-between gap-3 px-4 py-3 text-[13px]">
              <div>
                <p className="font-medium">{e.name}</p>
                <p className="text-[11px] text-[var(--admin-text-muted)]">{e.category?.nameAr || "—"} · {e.date} · {e.recurrence === "recurring" ? "متكرر" : "مرة"}</p>
              </div>
              <span className="admin-num" dir="ltr">{formatPrice(Math.round(e.amountIqd))}</span>
            </li>
          ))}
        </ul>
      </Surface>
    </div>
  );
}
