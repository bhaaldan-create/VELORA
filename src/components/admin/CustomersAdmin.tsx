"use client";

import Link from "next/link";
import {
  EmptyState,
  PageHeader,
  Surface,
} from "@/components/admin/ui/primitives";
import { Users } from "@/components/admin/ui/icons";
import type { AdminCustomerRow } from "@/lib/admin/customers";
import { formatPrice } from "@/lib/utils";
import { useDeferredValue, useMemo, useState } from "react";

export function CustomersAdmin({
  initialCustomers,
}: {
  initialCustomers: AdminCustomerRow[];
}) {
  const [q, setQ] = useState("");
  const deferred = useDeferredValue(q);

  const visible = useMemo(() => {
    const needle = deferred.trim().toLowerCase();
    if (!needle) return initialCustomers;
    return initialCustomers.filter((c) =>
      `${c.fullName} ${c.email} ${c.phone} ${c.address}`
        .toLowerCase()
        .includes(needle),
    );
  }, [initialCustomers, deferred]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="العملاء"
        description="ملف CRM خفيف مرتبط بطلبات المتجر الحقيقية."
      />

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="بحث بالاسم، الهاتف، أو البريد…"
        className="h-11 w-full rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3.5 text-[14px] outline-none focus:border-[var(--admin-plum-soft)]"
      />

      {visible.length === 0 ? (
        <EmptyState
          icon={Users}
          title="لا يوجد عملاء مسجّلون"
          description="عندما تنشئ عميلة حساباً على المتجر ستظهر هنا مع سجل طلباتها."
        />
      ) : (
        <ul className="space-y-2.5">
          {visible.map((c) => (
            <li key={c.id}>
              <Surface>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-[15px] font-semibold text-[var(--admin-text)]">
                      {c.fullName}
                    </h2>
                    <p className="mt-1 text-[12px] text-[var(--admin-text-secondary)]">
                      <span dir="ltr">{c.phone}</span>
                      {" · "}
                      <span dir="ltr">{c.email}</span>
                    </p>
                    {c.address ? (
                      <p className="mt-1 text-[12px] text-[var(--admin-text-muted)]">
                        {c.address}
                      </p>
                    ) : null}
                  </div>
                  <div className="text-left text-[12px]">
                    <p className="admin-num text-[15px] font-semibold">
                      {formatPrice(c.totalSpent)}
                    </p>
                    <p className="mt-1 text-[var(--admin-text-muted)]">
                      {c.ordersCount} طلبات
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 border-t border-[var(--admin-border)] pt-3 text-[11px] text-[var(--admin-text-muted)]">
                  <span>
                    انضمّت{" "}
                    {new Date(c.createdAt).toLocaleDateString("ar-IQ")}
                  </span>
                  {c.lastOrderAt ? (
                    <span>
                      آخر طلب{" "}
                      {new Date(c.lastOrderAt).toLocaleDateString("ar-IQ")}
                    </span>
                  ) : (
                    <span>لا طلبات مرتبطة بعد</span>
                  )}
                  <Link
                    href={`/admin/orders?q=${encodeURIComponent(c.phone)}`}
                    className="text-[var(--admin-plum-soft)] hover:underline"
                  >
                    عرض الطلبات
                  </Link>
                </div>
              </Surface>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
