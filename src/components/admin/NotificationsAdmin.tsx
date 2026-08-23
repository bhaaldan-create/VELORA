"use client";

import { useEffect, useState } from "react";
import { PageHeader, Surface } from "@/components/admin/ui/primitives";

type CampaignRow = {
  id: string;
  titleAr: string;
  bodyAr: string;
  titleEn: string | null;
  bodyEn: string | null;
  href: string | null;
  createdAt: string;
  recipientCount: number;
};

export function NotificationsAdmin() {
  const [titleAr, setTitleAr] = useState("");
  const [bodyAr, setBodyAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [bodyEn, setBodyEn] = useState("");
  const [href, setHref] = useState("");
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notifications", { cache: "no-store" });
      const data = (await res.json()) as {
        ok?: boolean;
        campaigns?: CampaignRow[];
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error || "تعذّر تحميل السجل.");
        return;
      }
      setCampaigns(data.campaigns ?? []);
      setError(null);
    } catch {
      setError("تعذّر تحميل السجل.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function sendBroadcast() {
    setSending(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titleAr,
          bodyAr,
          titleEn: titleEn || null,
          bodyEn: bodyEn || null,
          href: href || null,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        campaign?: CampaignRow;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.campaign) {
        setError(data.error || "فشل إرسال التعميم.");
        return;
      }
      setCampaigns((prev) => [data.campaign!, ...prev]);
      setTitleAr("");
      setBodyAr("");
      setTitleEn("");
      setBodyEn("");
      setHref("");
      setMessage(
        `تم إرسال التعميم إلى ${data.campaign.recipientCount} زبونة.`,
      );
    } catch {
      setError("فشل إرسال التعميم.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="تعميم الإشعارات"
        description="أرسلي إشعاراً داخل المنصة لجميع الزبائن المسجّلين — يظهر في الجرس وصندوق الإشعارات."
        actions={
          <button
            type="button"
            onClick={() => void sendBroadcast()}
            disabled={
              sending || titleAr.trim().length < 2 || bodyAr.trim().length < 2
            }
            className="rounded-full bg-[var(--admin-text)] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {sending ? "جارٍ الإرسال…" : "إرسال التعميم"}
          </button>
        }
      />

      {message ? (
        <p className="text-sm text-emerald-700">{message}</p>
      ) : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <Surface className="space-y-4 p-5">
        <h2 className="text-[14px] font-semibold text-[var(--admin-text)]">
          رسالة جديدة
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="block text-sm lg:col-span-2">
            <span className="mb-1.5 block text-[var(--admin-text-secondary)]">
              العنوان (عربي) *
            </span>
            <input
              className="w-full rounded-xl border border-[var(--admin-border)] bg-white px-3 py-2"
              value={titleAr}
              onChange={(e) => setTitleAr(e.target.value)}
              placeholder="مثال: عرض خاص هذا الأسبوع"
            />
          </label>
          <label className="block text-sm lg:col-span-2">
            <span className="mb-1.5 block text-[var(--admin-text-secondary)]">
              النص (عربي) *
            </span>
            <textarea
              className="min-h-[110px] w-full rounded-xl border border-[var(--admin-border)] bg-white px-3 py-2"
              value={bodyAr}
              onChange={(e) => setBodyAr(e.target.value)}
              placeholder="اكتبي محتوى الإشعار الذي ستراه الزبونة…"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block text-[var(--admin-text-secondary)]">
              Title (EN)
            </span>
            <input
              className="w-full rounded-xl border border-[var(--admin-border)] bg-white px-3 py-2"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block text-[var(--admin-text-secondary)]">
              رابط اختياري
            </span>
            <input
              className="w-full rounded-xl border border-[var(--admin-border)] bg-white px-3 py-2"
              dir="ltr"
              value={href}
              onChange={(e) => setHref(e.target.value)}
              placeholder="/shop أو /account/club"
            />
          </label>
          <label className="block text-sm lg:col-span-2">
            <span className="mb-1.5 block text-[var(--admin-text-secondary)]">
              Body (EN)
            </span>
            <textarea
              className="min-h-[80px] w-full rounded-xl border border-[var(--admin-border)] bg-white px-3 py-2"
              value={bodyEn}
              onChange={(e) => setBodyEn(e.target.value)}
            />
          </label>
        </div>
      </Surface>

      <Surface className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-[14px] font-semibold text-[var(--admin-text)]">
            سجل التعميمات
          </h2>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-full border border-[var(--admin-border)] bg-white px-3 py-1.5 text-[12px]"
          >
            تحديث
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-[var(--admin-text-secondary)]">
            جارٍ التحميل…
          </p>
        ) : !campaigns.length ? (
          <p className="text-sm text-[var(--admin-text-secondary)]">
            لا توجد تعميمات بعد.
          </p>
        ) : (
          <ul className="space-y-3">
            {campaigns.map((c) => (
              <li
                key={c.id}
                className="rounded-[12px] border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] px-4 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="text-[14px] font-semibold text-[var(--admin-text)]">
                    {c.titleAr}
                  </h3>
                  <span className="text-[11px] text-[var(--admin-text-muted)]">
                    {new Date(c.createdAt).toLocaleString("ar-IQ")}
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--admin-text-secondary)]">
                  {c.bodyAr}
                </p>
                <p className="mt-2 text-[12px] text-[var(--admin-text-muted)]">
                  المستلمات: {c.recipientCount}
                  {c.href ? ` · ${c.href}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Surface>
    </div>
  );
}
