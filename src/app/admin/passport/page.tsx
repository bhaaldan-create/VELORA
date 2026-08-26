"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { PageHeader, Surface } from "@/components/admin/ui/primitives";
import {
  DEFAULT_PASSPORT_CONFIG,
  type PassportConfig,
} from "@/lib/passport/types";

export default function AdminPassportPage() {
  const [config, setConfig] = useState<PassportConfig>(DEFAULT_PASSPORT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/admin/passport-config")
      .then((r) => r.json())
      .then((data: { ok?: boolean; config?: PassportConfig }) => {
        if (data.config) setConfig(data.config);
      })
      .catch(() => setError("تعذّر تحميل إعدادات الجواز."))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/passport-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        config?: PassportConfig;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error || "فشل الحفظ.");
        return;
      }
      if (data.config) setConfig(data.config);
      setMessage("تم حفظ إعدادات MY VELORA PASSPORT.");
    } catch {
      setError("فشل الحفظ.");
    } finally {
      setSaving(false);
    }
  }

  function toggle(key: keyof Pick<
    PassportConfig,
    "showQrCode" | "publicShareEnabled" | "birthdayFeatureEnabled"
  >) {
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <AdminShell>
      <PageHeader
        title="MY VELORA PASSPORT"
        description="إعدادات الجواز الرقمي — QR، المشاركة العامة، وميزة عيد الميلاد."
      />

      {loading ? (
        <p className="text-sm text-[var(--admin-muted)]">جارٍ التحميل…</p>
      ) : (
        <div className="space-y-6">
          <Surface>
            <h2 className="text-base font-semibold text-[var(--admin-ink)]">
              إعدادات عامة
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block text-[var(--admin-muted)]">
                  بادئة رقم الجواز
                </span>
                <input
                  className="admin-input w-full"
                  value={config.numberPrefix}
                  maxLength={4}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      numberPrefix: e.target.value.toUpperCase().slice(0, 4),
                    }))
                  }
                />
                <span className="mt-1 block text-xs text-[var(--admin-muted)]">
                  مثال: VL-2026-008421
                </span>
              </label>
            </div>
          </Surface>

          <Surface>
            <h2 className="text-base font-semibold text-[var(--admin-ink)]">
              الميزات
            </h2>
            <div className="mt-4 space-y-3">
              {[
                {
                  key: "showQrCode" as const,
                  ar: "إظهار QR للتحقق",
                  en: "Show verification QR",
                },
                {
                  key: "publicShareEnabled" as const,
                  ar: "تفعيل المشاركة العامة",
                  en: "Enable public share link",
                },
                {
                  key: "birthdayFeatureEnabled" as const,
                  ar: "ميزة عيد الميلاد",
                  en: "Birthday feature",
                },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[var(--admin-border)] px-4 py-3"
                >
                  <span className="text-sm">
                    {item.ar}
                    <span className="mt-0.5 block text-xs text-[var(--admin-muted)]">
                      {item.en}
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={config[item.key]}
                    onChange={() => toggle(item.key)}
                  />
                </label>
              ))}
            </div>
          </Surface>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              disabled={saving}
              onClick={() => void save()}
            >
              {saving ? "جارٍ الحفظ…" : "حفظ الإعدادات"}
            </button>
            {message ? (
              <span className="text-sm text-emerald-700">{message}</span>
            ) : null}
            {error ? (
              <span className="text-sm text-red-700">{error}</span>
            ) : null}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
