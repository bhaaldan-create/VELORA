"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { PageHeader, Surface } from "@/components/admin/ui/primitives";
import { LOYALTY_CONFIG } from "@/lib/loyalty/config";

type CustomerRow = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  referralCode: string | null;
  loyaltyBalance: {
    available: number;
    lifetimeEarned: number;
    lifetimeRedeemed: number;
  } | null;
};

type Campaign = {
  id: string;
  campaignKey: string;
  secureToken: string;
  titleAr: string;
  points: number;
  active: boolean;
  startsAt: string;
  endsAt: string;
  _count?: { claims: number };
};

export default function AdminLoyaltyPage() {
  const [q, setQ] = useState("");
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{
    customer: CustomerRow;
    balance: {
      available: number;
      lifetimeEarned: number;
      lifetimeRedeemed: number;
    };
    activity: {
      id: string;
      eventType: string;
      points: number;
      direction: string;
      descriptionAr: string;
      createdAt: string;
    }[];
  } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adjustPoints, setAdjustPoints] = useState("5");
  const [adjustReason, setAdjustReason] = useState("");
  const [qrKey, setQrKey] = useState("VELORA-WELCOME-QR");
  const [qrPoints, setQrPoints] = useState("2");
  const [backfillBusy, setBackfillBusy] = useState(false);

  const loadList = useCallback(async (query = "") => {
    setError(null);
    const url = query
      ? `/api/admin/loyalty?q=${encodeURIComponent(query)}`
      : "/api/admin/loyalty";
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setError(data.error || "تعذّر التحميل");
      return;
    }
    setCustomers(data.customers || []);
    setCampaigns(data.campaigns || []);
  }, []);

  const loadDetail = useCallback(async (customerId: string) => {
    setSelectedId(customerId);
    const res = await fetch(
      `/api/admin/loyalty?customerId=${encodeURIComponent(customerId)}`,
      { cache: "no-store" },
    );
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setError(data.error || "تعذّر تحميل الزبون");
      return;
    }
    setDetail({
      customer: data.customer,
      balance: data.balance,
      activity: data.activity || [],
    });
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  async function onSearch(e: FormEvent) {
    e.preventDefault();
    await loadList(q.trim());
  }

  async function onAdjust(e: FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setMessage(null);
    setError(null);
    const res = await fetch("/api/admin/loyalty", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "adjust",
        customerId: selectedId,
        points: Number(adjustPoints),
        reason: adjustReason,
        adminId: "admin",
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setError(data.error || "فشل التعديل");
      return;
    }
    setMessage("تم تعديل النقاط.");
    setAdjustReason("");
    await loadDetail(selectedId);
    await loadList(q);
  }

  async function onCreateQr(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const now = new Date();
    const end = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 90);
    const res = await fetch("/api/admin/loyalty", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_qr",
        campaignKey: qrKey.trim(),
        titleAr: qrKey.trim(),
        points: Number(qrPoints),
        startsAt: now.toISOString(),
        endsAt: end.toISOString(),
        active: true,
        maxClaimsPerCustomer: 1,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setError(data.error || "فشل إنشاء الحملة");
      return;
    }
    setMessage(
      `تم إنشاء الحملة. التوكن: ${data.campaign?.secureToken || ""}`,
    );
    await loadList(q);
  }

  async function onBackfill(dryRun: boolean) {
    setBackfillBusy(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/loyalty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "backfill", dryRun }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "فشل الترحيل");
        return;
      }
      setMessage(
        `ترحيل: scanned=${data.result.scanned} eligible=${data.result.eligible} awarded=${data.result.awarded} skipped=${data.result.skipped}`,
      );
    } finally {
      setBackfillBusy(false);
    }
  }

  return (
    <AdminShell active="loyalty">
      <PageHeader
        title="المكافآت والنقاط"
        description={`كل ${LOYALTY_CONFIG.purchase.iqdPerPoint.toLocaleString("ar-IQ")} د.ع = نقطة · دفتر نقاط آمن`}
      />

      {message ? (
        <p className="mb-3 text-sm text-emerald-700">{message}</p>
      ) : null}
      {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Surface>
          <h2 className="mb-3 text-base font-semibold">الزبائن</h2>
          <form onSubmit={onSearch} className="mb-3 flex gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="بحث بالاسم / البريد / الهاتف / كود الإحالة"
              className="flex-1 rounded-lg border px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-lg bg-[var(--admin-ink,#222)] px-3 py-2 text-sm text-white"
            >
              بحث
            </button>
          </form>
          <ul className="max-h-[420px] space-y-2 overflow-auto text-sm">
            {customers.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => void loadDetail(c.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-start ${
                    selectedId === c.id ? "border-violet-400 bg-violet-50" : ""
                  }`}
                >
                  <div className="font-medium">{c.fullName}</div>
                  <div className="text-xs opacity-70">{c.email}</div>
                  <div className="mt-1 text-xs">
                    رصيد: {c.loyaltyBalance?.available ?? 0} · مكتسب:{" "}
                    {c.loyaltyBalance?.lifetimeEarned ?? 0}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </Surface>

        <Surface>
          <h2 className="mb-3 text-base font-semibold">تفاصيل الزبون</h2>
          {!detail ? (
            <p className="text-sm opacity-70">اختاري زبوناً من القائمة.</p>
          ) : (
            <div className="space-y-3 text-sm">
              <p>
                <strong>{detail.customer.fullName}</strong>
                <br />
                {detail.customer.email}
                <br />
                كود إحالة: {detail.customer.referralCode || "—"}
              </p>
              <p>
                المتاح: <strong>{detail.balance.available}</strong> · المكتسب:{" "}
                <strong>{detail.balance.lifetimeEarned}</strong> · المستبدل:{" "}
                <strong>{detail.balance.lifetimeRedeemed}</strong>
              </p>
              <form onSubmit={onAdjust} className="space-y-2 rounded-lg border p-3">
                <p className="font-medium">تعديل يدوي</p>
                <input
                  type="number"
                  value={adjustPoints}
                  onChange={(e) => setAdjustPoints(e.target.value)}
                  className="w-full rounded border px-2 py-1.5"
                  placeholder="نقاط (+/-)"
                />
                <input
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full rounded border px-2 py-1.5"
                  placeholder="السبب (مطلوب)"
                  required
                />
                <button
                  type="submit"
                  className="rounded bg-[var(--admin-ink,#222)] px-3 py-1.5 text-white"
                >
                  حفظ التعديل
                </button>
              </form>
              <div className="max-h-64 overflow-auto">
                <p className="mb-1 font-medium">السجل</p>
                <ul className="space-y-1 text-xs">
                  {detail.activity.map((a) => (
                    <li key={a.id} className="flex justify-between gap-2 border-b py-1">
                      <span>
                        {a.descriptionAr || a.eventType} · {a.direction}
                      </span>
                      <span dir="ltr">{a.points}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </Surface>

        <Surface>
          <h2 className="mb-3 text-base font-semibold">حملات QR</h2>
          <form onSubmit={onCreateQr} className="mb-4 space-y-2">
            <input
              value={qrKey}
              onChange={(e) => setQrKey(e.target.value)}
              className="w-full rounded border px-2 py-1.5 text-sm"
              placeholder="campaign key"
            />
            <input
              type="number"
              value={qrPoints}
              onChange={(e) => setQrPoints(e.target.value)}
              className="w-full rounded border px-2 py-1.5 text-sm"
              placeholder="points"
              min={1}
              max={50}
            />
            <button
              type="submit"
              className="rounded bg-[var(--admin-ink,#222)] px-3 py-1.5 text-sm text-white"
            >
              إنشاء حملة QR
            </button>
          </form>
          <ul className="max-h-72 space-y-2 overflow-auto text-xs">
            {campaigns.map((c) => (
              <li key={c.id} className="rounded border p-2">
                <div className="font-medium">
                  {c.campaignKey} · {c.points} نقطة ·{" "}
                  {c.active ? "نشطة" : "متوقفة"}
                </div>
                <div className="opacity-70" dir="ltr">
                  token: {c.secureToken}
                </div>
                <div>
                  مطالبات: {c._count?.claims ?? 0} · ينتهي{" "}
                  {new Date(c.endsAt).toLocaleDateString("ar-IQ")}
                </div>
              </li>
            ))}
          </ul>
        </Surface>

        <Surface>
          <h2 className="mb-3 text-base font-semibold">ترحيل نقاط الشراء</h2>
          <p className="mb-3 text-sm opacity-70">
            يرحّل نقاط الشراء فقط من الطلبات المسلَّمة المؤهّلة (آمن للتكرار).
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={backfillBusy}
              onClick={() => void onBackfill(true)}
              className="rounded border px-3 py-1.5 text-sm"
            >
              تجربة جافة
            </button>
            <button
              type="button"
              disabled={backfillBusy}
              onClick={() => void onBackfill(false)}
              className="rounded bg-[var(--admin-ink,#222)] px-3 py-1.5 text-sm text-white"
            >
              تشغيل الترحيل
            </button>
          </div>
          <div className="mt-4 text-xs opacity-70">
            <p>إعدادات افتراضية:</p>
            <pre className="mt-1 overflow-auto rounded bg-black/5 p-2">
              {JSON.stringify(LOYALTY_CONFIG, null, 2)}
            </pre>
          </div>
        </Surface>
      </div>
    </AdminShell>
  );
}
