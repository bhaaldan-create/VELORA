"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader, Surface } from "@/components/admin/ui/primitives";

type Tab = "coupons" | "influencers" | "campaigns" | "report";

type CouponRow = {
  id: string;
  code: string;
  name: string;
  type: string;
  value: number;
  status: string;
  displayStatus: string;
  used: number;
  remaining: number | null;
  maxRedemptions: number | null;
  endsAt: string | null;
  influencer?: { name: string } | null;
  campaign?: { name: string } | null;
};

const inputClass =
  "h-10 w-full rounded-[8px] border border-[var(--admin-border)] bg-white px-3 text-[13px]";

async function readJson(res: Response) {
  const json = (await res.json()) as { ok?: boolean; error?: string; requiresConfirmation?: boolean };
  if (!res.ok || json.ok === false) {
    throw new Error(json.error || "تعذّر تنفيذ الطلب.");
  }
  return json;
}

export function PromotionsAdmin({
  canEdit,
  canFinance,
}: {
  canEdit: boolean;
  canFinance: boolean;
}) {
  const [tab, setTab] = useState<Tab>("coupons");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [influencers, setInfluencers] = useState<Array<Record<string, unknown>>>([]);
  const [campaigns, setCampaigns] = useState<Array<Record<string, unknown>>>([]);
  const [report, setReport] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const [couponRes, influencerRes, campaignRes, reportRes] = await Promise.all([
      fetch("/api/admin/promotions/coupons"),
      fetch("/api/admin/promotions/influencers"),
      fetch("/api/admin/promotions/campaigns"),
      fetch("/api/admin/promotions/report"),
    ]);
    const couponJson = (await couponRes.json()) as { ok?: boolean; coupons?: CouponRow[]; error?: string };
    const influencerJson = (await influencerRes.json()) as { ok?: boolean; influencers?: Array<Record<string, unknown>> };
    const campaignJson = (await campaignRes.json()) as { ok?: boolean; campaigns?: Array<Record<string, unknown>> };
    const reportJson = (await reportRes.json()) as { ok?: boolean; error?: string };
    if (!couponRes.ok || !couponJson.ok) throw new Error(couponJson.error || "تعذّر تحميل الأكواد.");
    setCoupons(couponJson.coupons || []);
    setInfluencers(influencerJson.influencers || []);
    setCampaigns(campaignJson.campaigns || []);
    setReport(reportJson.ok ? (reportJson as Record<string, unknown>) : null);
  }, []);

  useEffect(() => {
    void load().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "تعذّر التحميل.");
    });
  }, [load]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="التحكم بالعروض"
        description="كوبون واحد لكل طلب. الخصم يُحسب على سعر البيع بعد خصم المنتج، والشحن خارج الأساس إلا في الشحن المجاني. المنطقة الزمنية: بغداد."
      />
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["coupons", "الأكواد"],
            ["influencers", "المؤثرون"],
            ["campaigns", "الحملات"],
            ["report", "التقارير"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`h-9 rounded-[8px] px-3 text-[13px] ${tab === id ? "bg-[var(--admin-plum)] text-white" : "border border-[var(--admin-border)]"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {error ? <p className="text-[13px] text-red-700">{error}</p> : null}
      {notice ? <p className="text-[13px] text-[var(--admin-plum)]">{notice}</p> : null}
      {tab === "coupons" ? (
        <CouponPanel
          canEdit={canEdit}
          coupons={coupons}
          influencers={influencers}
          campaigns={campaigns}
          onDone={async (message) => {
            setNotice(message);
            await load();
          }}
          onError={setError}
        />
      ) : null}
      {tab === "influencers" ? (
        <InfluencerPanel
          canEdit={canEdit}
          influencers={influencers}
          onDone={async (message) => {
            setNotice(message);
            await load();
          }}
          onError={setError}
        />
      ) : null}
      {tab === "campaigns" ? (
        <CampaignPanel
          canEdit={canEdit}
          campaigns={campaigns}
          onDone={async (message) => {
            setNotice(message);
            await load();
          }}
          onError={setError}
        />
      ) : null}
      {tab === "report" ? <ReportPanel report={report} canFinance={canFinance} onDone={load} onError={setError} /> : null}
    </div>
  );
}

function CouponPanel({
  canEdit,
  coupons,
  influencers,
  campaigns,
  onDone,
  onError,
}: {
  canEdit: boolean;
  coupons: CouponRow[];
  influencers: Array<Record<string, unknown>>;
  campaigns: Array<Record<string, unknown>>;
  onDone: (message: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  const [form, setForm] = useState({
    code: "",
    name: "",
    description: "",
    notes: "",
    type: "PERCENT",
    value: "10",
    maxDiscountIqd: "",
    minSubtotalIqd: "0",
    startsAt: "",
    endsAt: "",
    status: "DRAFT",
    maxRedemptions: "",
    maxPerCustomer: "1",
    firstOrderOnly: false,
    registeredOnly: false,
    applyToSaleItems: true,
    visibility: "PUBLIC",
    campaignId: "",
    influencerId: "",
    eligibleProductIds: "",
    eligibleCategories: "",
    eligibleBrands: "",
    excludedProductIds: "",
    minMarginPercent: "",
    commissionOverrideValue: "",
    csv: "",
    prefix: "VELORA",
    count: "5",
    confirm: false,
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function payload(extra: Record<string, unknown> = {}) {
    const list = (value: string) =>
      value.split(",").map((item) => item.trim()).filter(Boolean);
    return {
      ...extra,
      code: form.code || undefined,
      name: form.name || form.code,
      description: form.description,
      notes: form.notes,
      type: form.type,
      value: Number(form.value || 0),
      maxDiscountIqd: form.maxDiscountIqd ? Number(form.maxDiscountIqd) : null,
      minSubtotalIqd: Number(form.minSubtotalIqd || 0),
      startsAt: form.startsAt || null,
      endsAt: form.endsAt || null,
      status: form.status,
      maxRedemptions: form.maxRedemptions ? Number(form.maxRedemptions) : null,
      maxPerCustomer: form.maxPerCustomer ? Number(form.maxPerCustomer) : null,
      firstOrderOnly: form.firstOrderOnly,
      registeredOnly: form.registeredOnly,
      applyToSaleItems: form.applyToSaleItems,
      visibility: form.visibility,
      campaignId: form.campaignId || null,
      influencerId: form.influencerId || null,
      eligibleProductIds: list(form.eligibleProductIds),
      eligibleCategories: list(form.eligibleCategories),
      eligibleBrands: list(form.eligibleBrands),
      excludedProductIds: list(form.excludedProductIds),
      minMarginPercent: form.minMarginPercent ? Number(form.minMarginPercent) : null,
      commissionOverrideValue: form.commissionOverrideValue
        ? Number(form.commissionOverrideValue)
        : null,
      prefix: form.prefix,
      confirmHighImpact: form.confirm,
      id: editingId || undefined,
    };
  }

  async function submit(extra: Record<string, unknown>) {
    onError("");
    try {
      const res = await fetch("/api/admin/promotions/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload(extra)),
      });
      const json = await readJson(res);
      const created = (json as { created?: string[]; coupon?: { code?: string } }).created;
      await onDone(
        created
          ? `تم إنشاء ${created.length} كود.`
          : `تم حفظ الكود ${(json as { coupon?: { code?: string } }).coupon?.code || ""}.`,
      );
    } catch (err) {
      onError(err instanceof Error ? err.message : "تعذّر الحفظ.");
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
      {canEdit ? (
        <Surface>
          <h2 className="text-[14px] font-semibold">كوبون جديد</h2>
          <div className="mt-3 grid gap-2">
            <input className={inputClass} placeholder="الكود" value={form.code} onChange={(e) => set("code", e.target.value)} />
            <div className="flex gap-2">
              <button type="button" className="h-10 rounded-[8px] border px-3 text-[12px]" onClick={() => void fetch("/api/admin/promotions/coupons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "generate", prefix: form.prefix || "VELORA" }) }).then(async (res) => { const json = await res.json(); if (json.code) set("code", json.code); })}>
                توليد آمن
              </button>
              <button type="button" className="h-10 rounded-[8px] border px-3 text-[12px]" onClick={() => void fetch("/api/admin/promotions/coupons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "preview", ...payload(), items: form.eligibleProductIds.split(",").filter(Boolean).map((id) => ({ id: id.trim(), quantity: 1 })) }) }).then(async (res) => {
                const json = await res.json();
                onError(json.result?.ok === false ? json.result.message : json.configErrors?.join(" ") || "المعاينة جاهزة في الاستجابة.");
                if (json.result?.ok) {
                  await onDone(`مثال الخصم: ${json.result.merchandiseDiscount || json.result.shippingDiscount} د.ع. ${ (json.result.warnings || []).join(" ") }`);
                }
              })}>
                معاينة
              </button>
            </div>
            <input className={inputClass} placeholder="الاسم الداخلي" value={form.name} onChange={(e) => set("name", e.target.value)} />
            <textarea className={`${inputClass} h-16 py-2`} placeholder="وصف للزبون" value={form.description} onChange={(e) => set("description", e.target.value)} />
            <textarea className={`${inputClass} h-16 py-2`} placeholder="ملاحظات داخلية" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            <select className={inputClass} value={form.type} onChange={(e) => set("type", e.target.value)}>
              <option value="PERCENT">نسبة مئوية</option>
              <option value="FIXED">مبلغ ثابت</option>
              <option value="FREE_SHIPPING">شحن مجاني</option>
            </select>
            <input className={inputClass} placeholder="القيمة" value={form.value} onChange={(e) => set("value", e.target.value)} />
            <input className={inputClass} placeholder="سقف الخصم للنسبة" value={form.maxDiscountIqd} onChange={(e) => set("maxDiscountIqd", e.target.value)} />
            <input className={inputClass} placeholder="الحد الأدنى للبضاعة المؤهلة" value={form.minSubtotalIqd} onChange={(e) => set("minSubtotalIqd", e.target.value)} />
            <input className={inputClass} type="datetime-local" value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} />
            <input className={inputClass} type="datetime-local" value={form.endsAt} onChange={(e) => set("endsAt", e.target.value)} />
            <select className={inputClass} value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option value="DRAFT">مسودة</option>
              <option value="ACTIVE">نشط</option>
              <option value="PAUSED">موقوف</option>
              <option value="ARCHIVED">مؤرشف</option>
            </select>
            <input className={inputClass} placeholder="حد الاستخدام الكلي" value={form.maxRedemptions} onChange={(e) => set("maxRedemptions", e.target.value)} />
            <input className={inputClass} placeholder="حد لكل زبون" value={form.maxPerCustomer} onChange={(e) => set("maxPerCustomer", e.target.value)} />
            <label className="text-[12px]"><input type="checkbox" checked={form.firstOrderOnly} onChange={(e) => set("firstOrderOnly", e.target.checked)} /> الطلب الأول فقط</label>
            <label className="text-[12px]"><input type="checkbox" checked={form.registeredOnly} onChange={(e) => set("registeredOnly", e.target.checked)} /> حساب مسجّل فقط</label>
            <label className="text-[12px]"><input type="checkbox" checked={form.applyToSaleItems} onChange={(e) => set("applyToSaleItems", e.target.checked)} /> يشمل المنتجات المخفّضة أصلاً</label>
            <select className={inputClass} value={form.visibility} onChange={(e) => set("visibility", e.target.value)}>
              <option value="PUBLIC">عام</option>
              <option value="PRIVATE">خاص</option>
            </select>
            <select className={inputClass} value={form.influencerId} onChange={(e) => set("influencerId", e.target.value)}>
              <option value="">بدون مؤثر</option>
              {influencers.map((row) => (
                <option key={String(row.id)} value={String(row.id)}>{String(row.name)}</option>
              ))}
            </select>
            <select className={inputClass} value={form.campaignId} onChange={(e) => set("campaignId", e.target.value)}>
              <option value="">بدون حملة</option>
              {campaigns.map((row) => (
                <option key={String(row.id)} value={String(row.id)}>{String(row.name)}</option>
              ))}
            </select>
            <input className={inputClass} placeholder="منتجات مؤهلة، مفصولة بفاصلة" value={form.eligibleProductIds} onChange={(e) => set("eligibleProductIds", e.target.value)} />
            <input className={inputClass} placeholder="تصنيفات مؤهلة" value={form.eligibleCategories} onChange={(e) => set("eligibleCategories", e.target.value)} />
            <input className={inputClass} placeholder="علامات مؤهلة" value={form.eligibleBrands} onChange={(e) => set("eligibleBrands", e.target.value)} />
            <input className={inputClass} placeholder="منتجات مستبعدة" value={form.excludedProductIds} onChange={(e) => set("excludedProductIds", e.target.value)} />
            <input className={inputClass} placeholder="حد هامش إجباري % (اختياري)" value={form.minMarginPercent} onChange={(e) => set("minMarginPercent", e.target.value)} />
            <input className={inputClass} placeholder="عمولة خاصة بهذا الكود" value={form.commissionOverrideValue} onChange={(e) => set("commissionOverrideValue", e.target.value)} />
            <label className="text-[12px]"><input type="checkbox" checked={form.confirm} onChange={(e) => set("confirm", e.target.checked)} /> أؤكد تعديل خصم منشور</label>
            <button type="button" className="h-10 rounded-[8px] bg-[var(--admin-plum)] text-[13px] text-white" onClick={() => void submit({})}>
              {editingId ? "حفظ التعديل" : "حفظ"}
            </button>
            {editingId ? (
              <button type="button" className="h-10 rounded-[8px] border text-[13px]" onClick={() => setEditingId(null)}>
                كوبون جديد بدل التعديل
              </button>
            ) : null}
            <textarea className={`${inputClass} h-20 py-2`} placeholder="استيراد: كود في كل سطر" value={form.csv} onChange={(e) => set("csv", e.target.value)} />
            <button type="button" className="h-10 rounded-[8px] border text-[13px]" onClick={() => void submit({ action: "import", csv: form.csv, confirmHighImpact: true })}>
              استيراد بعد التأكيد
            </button>
            <button type="button" className="h-10 rounded-[8px] border text-[13px]" onClick={() => void submit({ action: "bulk", count: Number(form.count || 1), confirmHighImpact: true })}>
              توليد {form.count} أكواد
            </button>
          </div>
        </Surface>
      ) : (
        <Surface>
          <p className="text-[13px]">صلاحيتك للعرض فقط. إنشاء الأكواد للمدير.</p>
        </Surface>
      )}
      <Surface>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-[14px] font-semibold">الأكواد</h2>
          <button
            type="button"
            className="text-[12px] underline"
            onClick={() => {
              const csv = ["code,status,used,remaining", ...coupons.map((row) => `${row.code},${row.displayStatus},${row.used},${row.remaining ?? ""}`)].join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = "velora-coupons.csv";
              link.click();
              URL.revokeObjectURL(url);
            }}
          >
            تصدير
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-[12px]">
            <thead>
              <tr className="text-[var(--admin-text-secondary)]">
                <th className="py-2">الكود</th>
                <th>النوع</th>
                <th>الحالة</th>
                <th>الاستخدام</th>
                <th>المؤثر</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((row) => (
                <tr key={row.id} className="border-t border-[var(--admin-border)]">
                  <td className="py-2 font-medium">{row.code}</td>
                  <td>{row.type === "PERCENT" ? `${row.value}%` : row.type === "FIXED" ? `${row.value} د.ع` : "شحن"}</td>
                  <td>{row.displayStatus}</td>
                  <td>{row.used}{row.remaining == null ? "" : ` / متبقٍ ${row.remaining}`}</td>
                  <td>{row.influencer?.name || "—"}</td>
                  <td>
                    {canEdit ? (
                      <span className="flex gap-2">
                        <button type="button" className="underline" onClick={() => void fetch(`/api/admin/promotions/coupons?id=${row.id}`).then(async (res) => {
                          const json = await res.json();
                          const coupon = json.coupon;
                          if (!coupon) return;
                          setEditingId(coupon.id);
                          setForm((current) => ({
                            ...current,
                            code: coupon.code || "",
                            name: coupon.name || "",
                            description: coupon.description || "",
                            notes: coupon.notes || "",
                            type: coupon.type || "PERCENT",
                            value: String(coupon.value ?? ""),
                            maxDiscountIqd: coupon.maxDiscountIqd ?? "",
                            minSubtotalIqd: String(coupon.minSubtotalIqd ?? 0),
                            status: coupon.status || "DRAFT",
                            maxRedemptions: coupon.maxRedemptions ?? "",
                            maxPerCustomer: coupon.maxPerCustomer ?? "",
                            firstOrderOnly: Boolean(coupon.firstOrderOnly),
                            registeredOnly: Boolean(coupon.registeredOnly),
                            applyToSaleItems: coupon.applyToSaleItems !== false,
                            visibility: coupon.visibility || "PUBLIC",
                            campaignId: coupon.campaignId || "",
                            influencerId: coupon.influencerId || "",
                            eligibleProductIds: Array.isArray(coupon.eligibleProductIds) ? coupon.eligibleProductIds.join(", ") : "",
                            eligibleCategories: Array.isArray(coupon.eligibleCategories) ? coupon.eligibleCategories.join(", ") : "",
                            eligibleBrands: Array.isArray(coupon.eligibleBrands) ? coupon.eligibleBrands.join(", ") : "",
                            excludedProductIds: Array.isArray(coupon.excludedProductIds) ? coupon.excludedProductIds.join(", ") : "",
                            minMarginPercent: coupon.minMarginPercent ?? "",
                            commissionOverrideValue: coupon.commissionOverrideValue ?? "",
                          }));
                        })}>
                          تعديل
                        </button>
                        <button type="button" className="underline" onClick={() => void fetch("/api/admin/promotions/coupons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "status", id: row.id, status: row.status === "ACTIVE" ? "PAUSED" : "ACTIVE" }) }).then(() => onDone("تم تحديث الحالة."))}>
                          {row.status === "ACTIVE" ? "إيقاف" : "تفعيل"}
                        </button>
                        <button type="button" className="underline" onClick={() => void fetch("/api/admin/promotions/coupons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "duplicate", id: row.id }) }).then(() => onDone("تم النسخ كمسودة."))}>
                          نسخ
                        </button>
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {coupons.length === 0 ? <p className="py-6 text-[13px] text-[var(--admin-text-secondary)]">لا توجد أكواد بعد.</p> : null}
        </div>
      </Surface>
    </div>
  );
}

function InfluencerPanel({
  canEdit,
  influencers,
  onDone,
  onError,
}: {
  canEdit: boolean;
  influencers: Array<Record<string, unknown>>;
  onDone: (message: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [username, setUsername] = useState("");
  const [commissionEnabled, setCommissionEnabled] = useState(false);
  const [commissionValue, setCommissionValue] = useState("5");
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState("15");

  return (
    <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
      {canEdit ? (
        <Surface>
          <h2 className="text-[14px] font-semibold">مؤثر</h2>
          <div className="mt-3 grid gap-2">
            <input className={inputClass} placeholder="الاسم" value={name} onChange={(e) => setName(e.target.value)} />
            <input className={inputClass} placeholder="البريد" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className={inputClass} placeholder="الهاتف" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <input className={inputClass} placeholder="المنصة" value={platform} onChange={(e) => setPlatform(e.target.value)} />
            <input className={inputClass} placeholder="اسم المستخدم" value={username} onChange={(e) => setUsername(e.target.value)} />
            <label className="text-[12px]"><input type="checkbox" checked={commissionEnabled} onChange={(e) => setCommissionEnabled(e.target.checked)} /> تفعيل العمولة</label>
            <input className={inputClass} placeholder="نسبة العمولة" value={commissionValue} onChange={(e) => setCommissionValue(e.target.value)} />
            <input className={inputClass} placeholder="كود اختياري مع الإنشاء" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
            <input className={inputClass} placeholder="خصم الزبون %" value={discount} onChange={(e) => setDiscount(e.target.value)} />
            <button
              type="button"
              className="h-10 rounded-[8px] bg-[var(--admin-plum)] text-[13px] text-white"
              onClick={() => {
                void fetch("/api/admin/promotions/influencers", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name,
                    email,
                    phone,
                    platform,
                    username,
                    status: "ACTIVE",
                    commissionEnabled,
                    commissionType: "PERCENT",
                    commissionValue: Number(commissionValue || 0),
                    coupon: couponCode
                      ? { code: couponCode, type: "PERCENT", value: Number(discount || 0), status: "ACTIVE", name }
                      : undefined,
                  }),
                })
                  .then(readJson)
                  .then(() => onDone("تم حفظ المؤثر."))
                  .catch((err: unknown) => onError(err instanceof Error ? err.message : "تعذّر الحفظ."));
              }}
            >
              حفظ
            </button>
          </div>
        </Surface>
      ) : null}
      <Surface>
        <div className="space-y-3">
          {influencers.map((row) => {
            const stats = (row.stats || {}) as Record<string, number>;
            return (
              <article key={String(row.id)} className="rounded-[8px] border border-[var(--admin-border)] p-3 text-[13px]">
                <p className="font-semibold">{String(row.name)} · {String(row.status)}</p>
                <p className="text-[var(--admin-text-secondary)]">{String(row.platform || "")} {String(row.username || "")}</p>
                <p>طلبات صالحة {stats.validOrders || 0} · ملغاة {stats.reversedOrders || 0}</p>
                <p>مبيعات صافية {stats.netIqd || 0} د.ع · خصومات {stats.discountIqd || 0}</p>
                <p>عمولة معلّقة {stats.commissionPending || 0} · مدفوعة {stats.commissionPaid || 0} · معكوسة {stats.commissionReversed || 0}</p>
              </article>
            );
          })}
          {influencers.length === 0 ? <p className="text-[13px] text-[var(--admin-text-secondary)]">لا يوجد مؤثرون.</p> : null}
        </div>
      </Surface>
    </div>
  );
}

function CampaignPanel({
  canEdit,
  campaigns,
  onDone,
  onError,
}: {
  canEdit: boolean;
  campaigns: Array<Record<string, unknown>>;
  onDone: (message: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  return (
    <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
      {canEdit ? (
        <Surface>
          <h2 className="text-[14px] font-semibold">حملة</h2>
          <div className="mt-3 grid gap-2">
            <input className={inputClass} placeholder="اسم الحملة" value={name} onChange={(e) => setName(e.target.value)} />
            <input className={inputClass} placeholder="سقف الخصم بالدينار" value={budget} onChange={(e) => setBudget(e.target.value)} />
            <button type="button" className="h-10 rounded-[8px] bg-[var(--admin-plum)] text-[13px] text-white" onClick={() => void fetch("/api/admin/promotions/campaigns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, status: "ACTIVE", budgetIqd: budget ? Number(budget) : null }) }).then(readJson).then(() => onDone("تم حفظ الحملة.")).catch((err: unknown) => onError(err instanceof Error ? err.message : "تعذّر الحفظ."))}>
              حفظ
            </button>
          </div>
        </Surface>
      ) : null}
      <Surface>
        {campaigns.map((row) => (
          <article key={String(row.id)} className="mb-3 rounded-[8px] border border-[var(--admin-border)] p-3 text-[13px]">
            <p className="font-semibold">{String(row.name)} · {String(row.status)}</p>
            <p>استخدام {String(row.redemptions || 0)} · خصم {String(row.discountIqd || 0)} · متبقٍ من السقف {row.budgetRemainingIqd == null ? "بدون سقف" : String(row.budgetRemainingIqd)}</p>
            {canEdit && row.status !== "PAUSED" ? (
              <button type="button" className="mt-2 underline" onClick={() => void fetch("/api/admin/promotions/campaigns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: row.id, pause: true }) }).then(readJson).then(() => onDone("تم إيقاف الحملة وأكوادها الجديدة."))}>
                إيقاف الحملة
              </button>
            ) : null}
          </article>
        ))}
      </Surface>
    </div>
  );
}

function ReportPanel({
  report,
  canFinance,
  onDone,
  onError,
}: {
  report: Record<string, unknown> | null;
  canFinance: boolean;
  onDone: () => Promise<void>;
  onError: (message: string) => void;
}) {
  const totals = (report?.totals || {}) as Record<string, number>;
  const recent = (report?.recent || []) as Array<Record<string, unknown>>;
  if (!report) return <Surface><p className="text-[13px]">لا توجد بيانات بعد.</p></Surface>;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["استخدامات صالحة", totals.redemptions],
          ["قيمة الخصم", totals.discountIqd],
          ["صافي البضاعة", totals.netIqd],
          ["عمولة بانتظار الاعتماد", totals.commissionPending],
          ["عمولة مدفوعة", totals.commissionPaid],
          ["عمولة معكوسة", totals.commissionReversed],
          ["محاولات فاشلة", totals.failedAttempts],
          ["بانتظار مراجعة", totals.reviewQueue],
        ].map(([label, value]) => (
          <Surface key={String(label)}>
            <p className="text-[12px] text-[var(--admin-text-secondary)]">{label}</p>
            <p className="mt-1 text-[20px] font-semibold">{Number(value || 0).toLocaleString("ar-IQ")}</p>
          </Surface>
        ))}
      </div>
      <Surface>
        <a className="text-[13px] underline" href="/api/admin/promotions/report?format=csv">تصدير CSV</a>
        <div className="mt-3 space-y-2">
          {recent.map((row) => (
            <div key={String(row.id)} className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--admin-border)] py-2 text-[12px]">
              <span>{String(row.code)} · طلب {String(row.orderId)} · {String(row.commissionStatus)} · {row.reversed ? "معكوس" : "ساري"}</span>
              {canFinance && row.commissionStatus === "PENDING" ? (
                <button type="button" className="underline" onClick={() => void fetch("/api/admin/promotions/commissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ redemptionId: row.id, action: "approve", confirmHighImpact: true }) }).then(readJson).then(() => onDone()).catch((err: unknown) => onError(err instanceof Error ? err.message : "تعذّر الاعتماد."))}>
                  اعتماد
                </button>
              ) : null}
              {canFinance && row.commissionStatus === "APPROVED" ? (
                <button type="button" className="underline" onClick={() => {
                  const reference = window.prompt("مرجع الدفع");
                  if (!reference?.trim()) return;
                  void fetch("/api/admin/promotions/commissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ redemptionId: row.id, action: "pay", reference }) }).then(readJson).then(() => onDone()).catch((err: unknown) => onError(err instanceof Error ? err.message : "تعذّر تسجيل الدفع."));
                }}>
                  تسجيل الدفع
                </button>
              ) : null}
            </div>
          ))}
          {recent.length === 0 ? <p className="text-[13px] text-[var(--admin-text-secondary)]">لا استخدامات بعد. الأرقام أعلاه من السجلات الفعلية.</p> : null}
        </div>
      </Surface>
    </div>
  );
}
