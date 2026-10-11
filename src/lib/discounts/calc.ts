/**
 * محرك الخصم — حساب صحيح بالأعداد الصحيحة (دينار عراقي بدون كسور).
 *
 * السياسة الافتراضية (ما لم تُغيّرها الإدارة في سجل الكوبون):
 * - كوبون واحد لكل طلب. لا يُدمج كوبونان.
 * - أساس الكوبون = سعر البيع بعد discountPercent للمنتجات المؤهلة.
 *   الشحن والضريبة (لا توجد ضريبة منفصلة حالياً) خارج الأساس.
 * - خصم المنتج الحالي يبقى كما هو. الكوبون يُحسب بعده.
 * - applyToSaleItems=false يستبعد الأسطر المخفّضة أصلاً من أساس الكوبون فقط.
 * - الشحن المجاني يصفّر أجور التوصيل ولا يخصم من البضاعة.
 * - التقريب: Math.round (نصف للأعلى للأرقام الموجبة).
 * - الخصم لا يتجاوز أساسه ولا يُنزل بضاعة الطلب تحت الصفر.
 * - العمولة، إن فُعّلت، تُحسب على البضاعة المؤهلة بعد الخصم وبدون الشحن.
 *   تبقى HELD حتى التسليم، ثم PENDING بانتظار اعتماد مالي. لا تُعلَّم مدفوعة تلقائياً.
 * - المنطقة الزمنية لمواعيد الإدخال بدون منطقة: Asia/Baghdad (UTC+3، بلا توقيت صيفي).
 * - حد الهامش يُفرض فقط إذا وُجدت تكلفة لكل الأسطر المؤهلة. غير ذلك التحذير إرشادي.
 */

export type CouponType = "PERCENT" | "FIXED" | "FREE_SHIPPING";

export type DiscountLine = {
  id: string;
  unitPrice: number;
  quantity: number;
  basePrice: number;
  discountPercent: number;
  categorySlug: string;
  brandName: string;
  unitCostIqd?: number | null;
};

export type CouponRule = {
  type: CouponType;
  value: number;
  maxDiscountIqd: number | null;
  minSubtotalIqd: number;
  applyToSaleItems: boolean;
  eligibleProductIds: string[];
  eligibleCategories: string[];
  eligibleBrands: string[];
  excludedProductIds: string[];
  excludedCategories: string[];
  excludedBrands: string[];
  minMarginPercent: number | null;
};

export type QuoteSuccess = {
  ok: true;
  merchandiseBefore: number;
  productDiscount: number;
  eligibleSubtotal: number;
  merchandiseDiscount: number;
  shippingDiscount: number;
  deliveryFee: number;
  merchandiseAfter: number;
  payable: number;
  eligibleCost: number | null;
  warnings: string[];
};

export type QuoteFailure = {
  ok: false;
  code: string;
  message: string;
};

export type QuoteResult = QuoteSuccess | QuoteFailure;

const CODE_RE = /^[A-Z0-9][A-Z0-9-]{2,30}[A-Z0-9]$/;

export function normalizeCouponCode(raw: string) {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function isCouponCodeShape(code: string) {
  return CODE_RE.test(code);
}

function norm(value: string) {
  return value.trim().toLowerCase();
}

export function lineEligible(line: DiscountLine, rule: CouponRule) {
  if (!rule.applyToSaleItems && line.discountPercent > 0) return false;
  const cat = norm(line.categorySlug);
  const brand = norm(line.brandName);
  const excluded =
    rule.excludedProductIds.includes(line.id) ||
    rule.excludedCategories.some((c) => norm(c) === cat) ||
    rule.excludedBrands.some((b) => norm(b) === brand);
  if (excluded) return false;
  const restricted =
    rule.eligibleProductIds.length > 0 ||
    rule.eligibleCategories.length > 0 ||
    rule.eligibleBrands.length > 0;
  if (!restricted) return true;
  return (
    rule.eligibleProductIds.includes(line.id) ||
    rule.eligibleCategories.some((c) => norm(c) === cat) ||
    rule.eligibleBrands.some((b) => norm(b) === brand)
  );
}

function iqd(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

export function quoteDiscount(input: {
  lines: DiscountLine[];
  deliveryFee: number;
  rule: CouponRule;
}): QuoteResult {
  const deliveryFee = iqd(input.deliveryFee);
  const merchandiseBefore = input.lines.reduce(
    (sum, line) => sum + iqd(line.unitPrice) * iqd(line.quantity),
    0,
  );
  const listBefore = input.lines.reduce(
    (sum, line) => sum + iqd(line.basePrice) * iqd(line.quantity),
    0,
  );
  const productDiscount = Math.max(0, listBefore - merchandiseBefore);
  const eligible = input.lines.filter((line) => lineEligible(line, input.rule));
  const eligibleSubtotal = eligible.reduce(
    (sum, line) => sum + iqd(line.unitPrice) * iqd(line.quantity),
    0,
  );

  if (eligibleSubtotal < iqd(input.rule.minSubtotalIqd)) {
    return {
      ok: false,
      code: "MIN_SUBTOTAL",
      message: `الحد الأدنى للمنتجات المؤهلة هو ${iqd(input.rule.minSubtotalIqd).toLocaleString("ar-IQ")} د.ع.`,
    };
  }

  if (input.rule.type !== "FREE_SHIPPING" && eligibleSubtotal <= 0) {
    return {
      ok: false,
      code: "INELIGIBLE",
      message: "هذا الكود لا يشمل منتجات السلة.",
    };
  }

  if (input.rule.type === "FREE_SHIPPING" && eligible.length === 0) {
    return {
      ok: false,
      code: "INELIGIBLE",
      message: "هذا الكود لا يشمل منتجات السلة.",
    };
  }

  let merchandiseDiscount = 0;
  let shippingDiscount = 0;
  let nextDelivery = deliveryFee;

  if (input.rule.type === "PERCENT") {
    const pct = Math.max(0, Math.min(100, Math.round(input.rule.value)));
    const raw = Math.round((eligibleSubtotal * pct) / 100);
    const capped =
      input.rule.maxDiscountIqd == null
        ? raw
        : Math.min(raw, iqd(input.rule.maxDiscountIqd));
    merchandiseDiscount = Math.min(eligibleSubtotal, capped);
  } else if (input.rule.type === "FIXED") {
    merchandiseDiscount = Math.min(eligibleSubtotal, iqd(input.rule.value));
  } else {
    shippingDiscount = deliveryFee;
    nextDelivery = 0;
  }

  const merchandiseAfter = merchandiseBefore - merchandiseDiscount;
  const payable = merchandiseAfter + nextDelivery;
  const warnings: string[] = [];

  const costed = eligible.filter(
    (line) => typeof line.unitCostIqd === "number" && line.unitCostIqd > 0,
  );
  const eligibleCost =
    costed.length === eligible.length && eligible.length > 0
      ? costed.reduce(
          (sum, line) => sum + iqd(line.unitCostIqd || 0) * iqd(line.quantity),
          0,
        )
      : null;
  const netEligible = eligibleSubtotal - merchandiseDiscount;

  if (eligibleCost != null && netEligible < eligibleCost) {
    warnings.push(
      "قد يبيع هذا الخصم المنتجات المؤهلة بأقل من تكلفتها. التحذير إرشادي ما لم يُضبط حد هامش.",
    );
  }

  if (
    input.rule.minMarginPercent != null &&
    eligible.length > 0 &&
    eligibleCost == null
  ) {
    warnings.push(
      "حُدّد حد هامش، لكن تكلفة بعض المنتجات المؤهلة غير معروفة، لذلك لا يُفرض الحد.",
    );
  }

  if (
    input.rule.minMarginPercent != null &&
    eligibleCost != null &&
    netEligible > 0
  ) {
    const margin = ((netEligible - eligibleCost) / netEligible) * 100;
    if (margin + 1e-9 < input.rule.minMarginPercent) {
      return {
        ok: false,
        code: "MARGIN",
        message: "لا يمكن تطبيق هذا الكود على هذه السلة.",
      };
    }
  }

  return {
    ok: true,
    merchandiseBefore,
    productDiscount,
    eligibleSubtotal,
    merchandiseDiscount,
    shippingDiscount,
    deliveryFee: nextDelivery,
    merchandiseAfter,
    payable,
    eligibleCost,
    warnings,
  };
}

export function commissionAmount(
  basis: number,
  type: "PERCENT" | "FIXED",
  value: number,
) {
  const base = iqd(basis);
  const amount = iqd(value);
  if (base <= 0 || amount <= 0) return 0;
  if (type === "FIXED") return Math.min(base, amount);
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return Math.min(base, Math.round((base * pct) / 100));
}

export type StoredCouponStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";

/** حالة العرض. السجل نفسه يبقى DRAFT | ACTIVE | PAUSED | ARCHIVED. */
export function displayStatus(input: {
  status: string;
  startsAt: Date | null;
  endsAt: Date | null;
  now: Date;
  used: number;
  maxRedemptions: number | null;
  campaignStatus?: string | null;
  ignoreCampaignPause?: boolean;
}) {
  if (input.status === "ARCHIVED") return "ARCHIVED";
  if (input.status === "PAUSED") return "PAUSED";
  if (input.status === "DRAFT") return "DRAFT";
  if (
    input.campaignStatus === "PAUSED" &&
    !input.ignoreCampaignPause
  ) {
    return "PAUSED";
  }
  if (input.endsAt && input.now.getTime() > input.endsAt.getTime()) {
    return "EXPIRED";
  }
  if (input.startsAt && input.now.getTime() < input.startsAt.getTime()) {
    return "SCHEDULED";
  }
  if (
    input.maxRedemptions != null &&
    input.used >= input.maxRedemptions
  ) {
    return "EXHAUSTED";
  }
  return "ACTIVE";
}

export function publicAccessMessage(status: string) {
  if (status === "EXHAUSTED") return "لم يعد هذا الكود متاحاً.";
  if (status === "ACTIVE") return null;
  return "الكود غير صالح أو غير متاح.";
}

/** تفسير datetime-local بلا منطقة زمنية على أنه Asia/Baghdad. */
export function parseBaghdadDateTime(raw: string | null | undefined) {
  if (!raw?.trim()) return null;
  const value = raw.trim();
  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(value)) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const normalized = value.length === 16 ? `${value}:00+03:00` : `${value}+03:00`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}
