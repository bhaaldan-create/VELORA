"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { PageHeader, Surface } from "@/components/admin/ui/primitives";
import {
  DEFAULT_VELORA_CARD_CONFIG,
  mergeVeloraCardConfig,
} from "@/lib/my-velora/default-config";
import type { VeloraCardConfig } from "@/lib/my-velora/types";
import type { MyVeloraAnalytics } from "@/lib/my-velora/analytics";

type TemplateRow = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  styleKey: string;
  backgroundUrl: string;
  isActive: boolean;
  isDefault: boolean;
  priority: number;
};

export default function AdminMyVeloraPage() {
  const [config, setConfig] = useState<VeloraCardConfig>(DEFAULT_VELORA_CARD_CONFIG);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [analytics, setAnalytics] = useState<MyVeloraAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/admin/my-velora")
      .then((r) => r.json())
      .then(
        (data: {
          ok?: boolean;
          config?: VeloraCardConfig;
          templates?: TemplateRow[];
          analytics?: MyVeloraAnalytics;
        }) => {
          if (data.config) setConfig(mergeVeloraCardConfig(data.config));
          if (data.templates) setTemplates(data.templates);
          if (data.analytics) setAnalytics(data.analytics);
        },
      )
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/my-velora", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setMessage(data.error || "فشل الحفظ");
        return;
      }
      setMessage("تم حفظ إعدادات MY VELORA");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell active="my-velora">
      <PageHeader
        title="MY VELORA Studio"
        description="بطاقات العملاء، الإحالات، والتحليلات — بيانات حقيقية فقط"
      />

      {loading ? (
        <p className="text-sm text-[var(--admin-muted)]">جارٍ التحميل…</p>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
          <Surface className="space-y-5 p-5">
            <h2 className="text-sm font-semibold text-[var(--admin-ink)]">
              إعدادات الإحالة والتقييم
            </h2>
            <label className="block text-xs text-[var(--admin-muted)]">
              مكافأة الإحالة (نقاط)
              <input
                type="number"
                className="admin-input mt-1 w-full"
                value={config.referralRewardPoints}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    referralRewardPoints: Number(e.target.value),
                  }))
                }
              />
            </label>
            <label className="block text-xs text-[var(--admin-muted)]">
              الحد الأدنى للطلب المؤهل (IQD)
              <input
                type="number"
                className="admin-input mt-1 w-full"
                value={config.referralMinOrderIqd}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    referralMinOrderIqd: Number(e.target.value),
                  }))
                }
              />
            </label>
            <label className="block text-xs text-[var(--admin-muted)]">
              الحد الشهري لمكافآت الإحالة
              <input
                type="number"
                className="admin-input mt-1 w-full"
                value={config.referralMaxMonthlyRewards}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    referralMaxMonthlyRewards: Number(e.target.value),
                  }))
                }
              />
            </label>
            <label className="block text-xs text-[var(--admin-muted)]">
              مكافأة التقييم (نقاط)
              <input
                type="number"
                className="admin-input mt-1 w-full"
                value={config.reviewRewardPoints}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    reviewRewardPoints: Number(e.target.value),
                  }))
                }
              />
            </label>
            <label className="flex items-center gap-2 text-xs text-[var(--admin-muted)]">
              <input
                type="checkbox"
                checked={config.showQrCode}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, showQrCode: e.target.checked }))
                }
              />
              إظهار QR على البطاقة
            </label>
            <label className="flex items-center gap-2 text-xs text-[var(--admin-muted)]">
              <input
                type="checkbox"
                checked={config.shareEarnEnabled}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, shareEarnEnabled: e.target.checked }))
                }
              />
              Share & Earn مفعّل
            </label>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="admin-btn-primary"
            >
              {saving ? "…" : "حفظ"}
            </button>
            {message ? (
              <p className="text-xs text-[var(--admin-ink)]">{message}</p>
            ) : null}
          </Surface>

          <div className="space-y-6">
            <Surface className="p-5">
              <h2 className="text-sm font-semibold text-[var(--admin-ink)]">
                MY VELORA Analytics
              </h2>
              {analytics && analytics.cardsGenerated === 0 ? (
                <p className="mt-4 text-sm text-[var(--admin-muted)]">
                  لا توجد بطاقات بعد — ستظهر البيانات الحقيقية عند أول طلب مُسلّم.
                </p>
              ) : analytics ? (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    ["Generated", analytics.cardsGenerated],
                    ["Viewed", analytics.cardsViewed],
                    ["Saved", analytics.cardsSaved],
                    ["Shared", analytics.cardsShared],
                    ["Share rate", `${analytics.shareRate}%`],
                    ["Referral clicks", analytics.referralClicks],
                    ["Referral orders", analytics.referralOrders],
                    ["Points", analytics.pointsDistributed],
                  ].map(([label, value]) => (
                    <div
                      key={String(label)}
                      className="rounded-xl border border-[var(--admin-border)] px-3 py-3"
                    >
                      <p className="text-[0.68rem] uppercase tracking-wider text-[var(--admin-muted)]">
                        {label}
                      </p>
                      <p className="mt-1 text-lg font-semibold tabular-nums">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </Surface>

            <Surface className="p-5">
              <h2 className="text-sm font-semibold text-[var(--admin-ink)]">
                القوالب
              </h2>
              <ul className="mt-4 space-y-2">
                {templates.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between rounded-xl border border-[var(--admin-border)] px-3 py-2.5 text-sm"
                  >
                    <div>
                      <p className="font-medium">{t.nameEn}</p>
                      <p className="text-xs text-[var(--admin-muted)]">
                        {t.styleKey}
                        {t.isDefault ? " · default" : ""}
                      </p>
                    </div>
                    <span
                      className={
                        t.isActive
                          ? "text-xs text-emerald-700"
                          : "text-xs text-[var(--admin-muted)]"
                      }
                    >
                      {t.isActive ? "Active" : "Inactive"}
                    </span>
                  </li>
                ))}
              </ul>
            </Surface>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
