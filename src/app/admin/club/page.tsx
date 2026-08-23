"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { PageHeader, Surface } from "@/components/admin/ui/primitives";
import { DEFAULT_CLUB_CONFIG } from "@/lib/club/default-config";
import type { ClubConfig, ClubReward } from "@/lib/club/types";

export default function AdminClubPage() {
  const [config, setConfig] = useState<ClubConfig>(DEFAULT_CLUB_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/admin/club-config")
      .then((r) => r.json())
      .then((data: { ok?: boolean; config?: ClubConfig }) => {
        if (data.config) setConfig(data.config);
      })
      .catch(() => setError("تعذّر تحميل الإعدادات."))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/club-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        config?: ClubConfig;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error || "فشل الحفظ.");
        return;
      }
      if (data.config) setConfig(data.config);
      setMessage("تم حفظ إعدادات نادي الجمال.");
    } catch {
      setError("فشل الحفظ.");
    } finally {
      setSaving(false);
    }
  }

  function updateReward(index: number, patch: Partial<ClubReward>) {
    setConfig((prev) => {
      const rewards = [...prev.rewards];
      rewards[index] = { ...rewards[index]!, ...patch };
      return { ...prev, rewards };
    });
  }

  function addReward() {
    setConfig((prev) => ({
      ...prev,
      rewards: [
        ...prev.rewards,
        {
          id: `r${Date.now()}`,
          cost: 100,
          titleEn: "New reward",
          titleAr: "مكافأة جديدة",
          subtitleEn: "Description",
          subtitleAr: "الوصف",
          cta: "redeem",
        },
      ],
    }));
  }

  function removeReward(index: number) {
    setConfig((prev) => ({
      ...prev,
      rewards: prev.rewards.filter((_, i) => i !== index),
    }));
  }

  return (
    <AdminShell active="club" title="نادي الجمال">
      <div className="space-y-5">
        <PageHeader
          title="VELORA Beauty Club"
          description="تحكّمي بالمستويات، المكافآت، ومعدلات اكتساب النقاط. الواجهة تعتمد هذه الإعدادات مباشرة."
        />

        {loading ? (
          <Surface>
            <p className="text-[13px] text-[var(--admin-text-secondary)]">
              جارٍ التحميل…
            </p>
          </Surface>
        ) : (
          <>
            <Surface>
              <h2 className="text-[14px] font-semibold">معدلات الاكتساب</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field
                  label="دينار لكل نقطة"
                  type="number"
                  value={config.iqdPerPoint}
                  onChange={(v) =>
                    setConfig((c) => ({ ...c, iqdPerPoint: Number(v) || 1 }))
                  }
                />
                <Field
                  label="مكافأة المراجعة"
                  type="number"
                  value={config.reviewBonus}
                  onChange={(v) =>
                    setConfig((c) => ({ ...c, reviewBonus: Number(v) || 0 }))
                  }
                />
                <Field
                  label="مكافأة الدعوة"
                  type="number"
                  value={config.referralBonus}
                  onChange={(v) =>
                    setConfig((c) => ({ ...c, referralBonus: Number(v) || 0 }))
                  }
                />
                <Field
                  label="مكافأة عيد الميلاد"
                  type="number"
                  value={config.birthdayBonus}
                  onChange={(v) =>
                    setConfig((c) => ({ ...c, birthdayBonus: Number(v) || 0 }))
                  }
                />
                <Field
                  label="نقاط جواز الجمال"
                  type="number"
                  value={config.passportRewardPoints}
                  onChange={(v) =>
                    setConfig((c) => ({
                      ...c,
                      passportRewardPoints: Number(v) || 0,
                    }))
                  }
                />
                <Field
                  label="أشهر السلسلة المطلوبة"
                  type="number"
                  value={config.streakMonthsRequired}
                  onChange={(v) =>
                    setConfig((c) => ({
                      ...c,
                      streakMonthsRequired: Number(v) || 1,
                    }))
                  }
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-[13px]">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.doublePointsActive}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        doublePointsActive: e.target.checked,
                        triplePointsActive: e.target.checked
                          ? false
                          : c.triplePointsActive,
                      }))
                    }
                  />
                  حملة نقاط مضاعفة (2×)
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.triplePointsActive}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        triplePointsActive: e.target.checked,
                        doublePointsActive: e.target.checked
                          ? false
                          : c.doublePointsActive,
                      }))
                    }
                  />
                  حملة نقاط ثلاثية (3×)
                </label>
              </div>
            </Surface>

            <Surface>
              <h2 className="text-[14px] font-semibold">مستويات العضوية</h2>
              <div className="mt-4 space-y-3">
                {config.tiers.map((tier, index) => (
                  <div
                    key={tier.id}
                    className="grid gap-2 rounded-[8px] border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] p-3 sm:grid-cols-4"
                  >
                    <div className="text-[13px] font-medium">
                      {tier.nameEn} / {tier.nameAr}
                    </div>
                    <Field
                      label="الحد الأدنى"
                      type="number"
                      value={tier.minPoints}
                      onChange={(v) =>
                        setConfig((c) => {
                          const tiers = [...c.tiers];
                          tiers[index] = {
                            ...tiers[index]!,
                            minPoints: Number(v) || 0,
                          };
                          return { ...c, tiers };
                        })
                      }
                    />
                    <Field
                      label="الحد الأقصى (فارغ = ∞)"
                      type="number"
                      value={tier.maxPoints ?? ""}
                      onChange={(v) =>
                        setConfig((c) => {
                          const tiers = [...c.tiers];
                          tiers[index] = {
                            ...tiers[index]!,
                            maxPoints: v === "" ? null : Number(v),
                          };
                          return { ...c, tiers };
                        })
                      }
                    />
                    <Field
                      label="هدية عيد الميلاد (EN)"
                      value={tier.birthdayGiftEn}
                      onChange={(v) =>
                        setConfig((c) => {
                          const tiers = [...c.tiers];
                          tiers[index] = {
                            ...tiers[index]!,
                            birthdayGiftEn: v,
                          };
                          return { ...c, tiers };
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </Surface>

            <Surface>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[14px] font-semibold">المكافآت</h2>
                <button
                  type="button"
                  onClick={addReward}
                  className="inline-flex h-8 items-center rounded-[8px] border border-[var(--admin-border)] px-3 text-[12px]"
                >
                  إضافة مكافأة
                </button>
              </div>
              <div className="mt-4 space-y-3">
                {config.rewards.map((reward, index) => (
                  <div
                    key={reward.id}
                    className="rounded-[8px] border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] p-3"
                  >
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      <Field
                        label="التكلفة (نقاط)"
                        type="number"
                        value={reward.cost}
                        onChange={(v) =>
                          updateReward(index, { cost: Number(v) || 0 })
                        }
                      />
                      <Field
                        label="العنوان EN"
                        value={reward.titleEn}
                        onChange={(v) => updateReward(index, { titleEn: v })}
                      />
                      <Field
                        label="العنوان AR"
                        value={reward.titleAr}
                        onChange={(v) => updateReward(index, { titleAr: v })}
                      />
                      <Field
                        label="الوصف EN"
                        value={reward.subtitleEn}
                        onChange={(v) =>
                          updateReward(index, { subtitleEn: v })
                        }
                      />
                      <Field
                        label="الوصف AR"
                        value={reward.subtitleAr}
                        onChange={(v) =>
                          updateReward(index, { subtitleAr: v })
                        }
                      />
                      <label className="block text-[12px] text-[var(--admin-text-secondary)]">
                        زر الإجراء
                        <select
                          className="mt-1 h-9 w-full rounded-[8px] border border-[var(--admin-border)] bg-white px-2 text-[13px] text-[var(--admin-text)]"
                          value={reward.cta}
                          onChange={(e) =>
                            updateReward(index, {
                              cta: e.target.value as ClubReward["cta"],
                            })
                          }
                        >
                          <option value="redeem">REDEEM</option>
                          <option value="reveal">REVEAL</option>
                          <option value="unlock">UNLOCK</option>
                        </select>
                      </label>
                    </div>
                    <button
                      type="button"
                      className="mt-3 text-[12px] text-[var(--admin-danger)]"
                      onClick={() => removeReward(index)}
                    >
                      حذف
                    </button>
                  </div>
                ))}
              </div>
            </Surface>

            <Surface>
              <h2 className="text-[14px] font-semibold">جواز الجمال + المفاجآت</h2>
              <Field
                label="العلامات (مفصولة بفاصلة)"
                value={config.passportBrands.map((b) => b.name).join(", ")}
                onChange={(v) =>
                  setConfig((c) => ({
                    ...c,
                    passportBrands: v
                      .split(",")
                      .map((name) => name.trim())
                      .filter(Boolean)
                      .map((name, i) => ({
                        id: `brand-${i}`,
                        name,
                      })),
                  }))
                }
              />
              <div className="mt-3">
                <Field
                  label="مجمع المفاجآت EN (سطر لكل مكافأة)"
                  value={config.mysteryPool.map((m) => m.titleEn).join("\n")}
                  textarea
                  onChange={(v) =>
                    setConfig((c) => {
                      const lines = v.split("\n").filter((l) => l.trim());
                      return {
                        ...c,
                        mysteryPool: lines.map((titleEn, i) => ({
                          id: `m${i + 1}`,
                          titleEn: titleEn.trim(),
                          titleAr:
                            c.mysteryPool[i]?.titleAr || titleEn.trim(),
                        })),
                      };
                    })
                  }
                />
              </div>
              <div className="mt-3">
                <Field
                  label="واتساب الكونسيرج"
                  value={config.conciergeWhatsApp}
                  onChange={(v) =>
                    setConfig((c) => ({ ...c, conciergeWhatsApp: v }))
                  }
                />
              </div>
            </Surface>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => void save()}
                className="inline-flex h-10 items-center rounded-[8px] bg-[var(--admin-plum)] px-5 text-[13px] font-medium text-white disabled:opacity-60"
              >
                {saving ? "جارٍ الحفظ…" : "حفظ الإعدادات"}
              </button>
              {message ? (
                <p className="text-[13px] text-[var(--admin-success)]">
                  {message}
                </p>
              ) : null}
              {error ? (
                <p className="text-[13px] text-[var(--admin-danger)]">{error}</p>
              ) : null}
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  textarea,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  textarea?: boolean;
}) {
  return (
    <label className="block text-[12px] text-[var(--admin-text-secondary)]">
      {label}
      {textarea ? (
        <textarea
          className="mt-1 min-h-[96px] w-full rounded-[8px] border border-[var(--admin-border)] bg-white px-2 py-2 text-[13px] text-[var(--admin-text)]"
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          type={type}
          className="mt-1 h-9 w-full rounded-[8px] border border-[var(--admin-border)] bg-white px-2 text-[13px] text-[var(--admin-text)]"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}
