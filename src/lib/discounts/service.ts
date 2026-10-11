import { createHash, randomInt } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { OrderItemPayload, OrderPayload } from "@/lib/order-email";
import { salePriceFromBase } from "@/lib/pricing";
import { DELIVERY_FEE_IQD, getOrderTotal } from "@/lib/shipping";
import {
  commissionAmount,
  displayStatus,
  isCouponCodeShape,
  lineEligible,
  normalizeCouponCode,
  parseBaghdadDateTime,
  publicAccessMessage,
  quoteDiscount,
  type CouponRule,
  type DiscountLine,
} from "@/lib/discounts/calc";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const GENERIC = "الكود غير صالح أو غير متاح.";

export class CouponRejected extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "CouponRejected";
    this.status = status;
  }
}

export function hashKey(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 24);
}

export function customerKeyOf(input: {
  customerId?: string | null;
  phone?: string | null;
  email?: string | null;
}) {
  if (input.customerId?.trim()) return `id:${input.customerId.trim()}`;
  if (input.phone?.trim()) return `phone:${input.phone.trim()}`;
  if (input.email?.trim()) return `email:${input.email.trim().toLowerCase()}`;
  return "";
}

export function generateCouponCode(prefix = "VELORA") {
  const clean = normalizeCouponCode(prefix).replace(/[^A-Z0-9]/g, "") || "VELORA";
  let body = "";
  for (let i = 0; i < 6; i += 1) body += ALPHABET[randomInt(ALPHABET.length)];
  return `${clean}${body}`.slice(0, 24);
}

function strList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function unitCostIqd(product: {
  purchasePrice: number;
  costCurrency: string;
  costExchangeRate: number;
}) {
  if (!product.purchasePrice || product.purchasePrice <= 0) return null;
  const rate =
    product.costCurrency === "USD" ? product.costExchangeRate || 0 : 1;
  if (rate <= 0) return null;
  return Math.round(product.purchasePrice * rate);
}

type CouponRow = Prisma.CouponGetPayload<{
  include: { campaign: true; influencer: true };
}>;

function ruleOf(coupon: CouponRow): CouponRule {
  return {
    type:
      coupon.type === "FIXED" || coupon.type === "FREE_SHIPPING"
        ? coupon.type
        : "PERCENT",
    value: coupon.value,
    maxDiscountIqd: coupon.maxDiscountIqd,
    minSubtotalIqd: coupon.minSubtotalIqd,
    applyToSaleItems: coupon.applyToSaleItems,
    eligibleProductIds: strList(coupon.eligibleProductIds),
    eligibleCategories: strList(coupon.eligibleCategories),
    eligibleBrands: strList(coupon.eligibleBrands),
    excludedProductIds: strList(coupon.excludedProductIds),
    excludedCategories: strList(coupon.excludedCategories),
    excludedBrands: strList(coupon.excludedBrands),
    minMarginPercent: coupon.minMarginPercent,
  };
}

async function recordAttempt(input: {
  couponId?: string;
  code?: string;
  outcome: string;
  customerKey?: string;
  ipHash?: string;
}) {
  try {
    await prisma.couponAttempt.create({
      data: {
        couponId: input.couponId || "",
        codeHash: input.code ? hashKey(normalizeCouponCode(input.code)) : "",
        outcome: input.outcome,
        customerKey: input.customerKey || "",
        ipHash: input.ipHash || "",
      },
    });
  } catch (error) {
    console.error("[coupon] attempt log failed", error);
  }
}

export async function tooManyCouponAttempts(ipHash: string) {
  if (!ipHash) return false;
  const since = new Date(Date.now() - 60_000);
  const count = await prisma.couponAttempt.count({
    where: { ipHash, createdAt: { gte: since }, outcome: { not: "ok" } },
  });
  return count >= 20;
}

async function priorOrders(input: {
  phone?: string;
  email?: string;
  customerId?: string;
}) {
  const phone = input.phone?.trim() || "";
  const email = input.email?.trim() || "";
  const customerId = input.customerId?.trim() || "";
  if (!phone && !email && !customerId) return 0;
  const rows = await prisma.$queryRaw<{ count: number }[]>`
    SELECT COUNT(*)::int AS count
    FROM "Order"
    WHERE status NOT IN ('cancelled', 'returned', 'failed_delivery')
      AND (
        (${phone} <> '' AND "orderJson"->>'phone' = ${phone})
        OR (${email} <> '' AND lower("orderJson"->>'email') = lower(${email}))
        OR (${customerId} <> '' AND "orderJson"->>'customerId' = ${customerId})
      )
  `;
  return Number(rows[0]?.count || 0);
}

function campaignBlocks(coupon: CouponRow, now: Date) {
  const campaign = coupon.campaign;
  if (!campaign || coupon.ignoreCampaignPause) return false;
  if (campaign.status !== "ACTIVE") return true;
  if (campaign.startsAt && now < campaign.startsAt) return true;
  if (campaign.endsAt && now > campaign.endsAt) return true;
  return false;
}

async function liveUseCount(
  couponId: string,
  db: Prisma.TransactionClient | typeof prisma = prisma,
) {
  return db.couponRedemption.count({
    where: { couponId, reversed: false },
  });
}

export async function loadPricedLines(
  items: { id: string; quantity: number; size?: string }[],
) {
  const ids = [...new Set(items.map((item) => item.id))];
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      name: true,
      nameAr: true,
      price: true,
      discountPercent: true,
      categorySlug: true,
      brandName: true,
      isActive: true,
      size: true,
      purchasePrice: true,
      costCurrency: true,
      costExchangeRate: true,
    },
  });
  const byId = new Map(products.map((product) => [product.id, product]));
  const lines: DiscountLine[] = [];
  const orderItems: OrderItemPayload[] = [];
  for (const item of items) {
    const product = byId.get(item.id);
    if (!product?.isActive) {
      throw new CouponRejected("أحد المنتجات لم يعد متاحاً.");
    }
    const quantity = Math.round(item.quantity);
    if (quantity < 1) throw new CouponRejected("كمية المنتج غير صالحة.");
    const unit = salePriceFromBase(product.price, product.discountPercent ?? 0);
    lines.push({
      id: product.id,
      unitPrice: unit,
      quantity,
      basePrice: product.price,
      discountPercent: product.discountPercent ?? 0,
      categorySlug: product.categorySlug,
      brandName: product.brandName || "",
      unitCostIqd: unitCostIqd(product),
    });
    orderItems.push({
      id: product.id,
      name: product.name,
      nameAr: product.nameAr,
      price: unit,
      quantity,
      size: item.size || product.size,
    });
  }
  return { lines, orderItems };
}

type EvalInput = {
  lines: DiscountLine[];
  coupon: CouponRow;
  customerId?: string;
  phone?: string;
  email?: string;
  used?: number;
  customerUses?: number;
  prior?: number;
  now?: Date;
};

function evaluateLoaded(input: EvalInput) {
  const now = input.now ?? new Date();
  const used = input.used ?? 0;
  const shown = displayStatus({
    status: input.coupon.status,
    startsAt: input.coupon.startsAt,
    endsAt: input.coupon.endsAt,
    now,
    used,
    maxRedemptions: input.coupon.maxRedemptions,
    campaignStatus: input.coupon.campaign?.status,
    ignoreCampaignPause: input.coupon.ignoreCampaignPause,
  });
  const blocked = publicAccessMessage(shown);
  if (blocked || campaignBlocks(input.coupon, now)) {
    return {
      ok: false as const,
      code: shown === "EXHAUSTED" ? "EXHAUSTED" : "UNAVAILABLE",
      message: shown === "EXHAUSTED" ? "لم يعد هذا الكود متاحاً." : GENERIC,
    };
  }

  const restricted = strList(input.coupon.restrictedCustomerIds);
  if (restricted.length > 0 && !restricted.includes(input.customerId || "")) {
    return { ok: false as const, code: "RESTRICTED", message: GENERIC };
  }
  if (input.coupon.registeredOnly && !input.customerId) {
    return {
      ok: false as const,
      code: "REGISTERED",
      message: "هذا الكود يتطلب تسجيل الدخول.",
    };
  }
  if (
    input.coupon.maxPerCustomer != null &&
    (input.customerUses ?? 0) >= input.coupon.maxPerCustomer
  ) {
    return {
      ok: false as const,
      code: "CUSTOMER_LIMIT",
      message: "تم استخدام هذا الكود بالحد المسموح لهذا الحساب.",
    };
  }
  if (input.coupon.firstOrderOnly && (input.prior ?? 0) > 0) {
    return {
      ok: false as const,
      code: "FIRST_ORDER",
      message: "هذا الكود متاح للطلب الأول فقط.",
    };
  }

  const quote = quoteDiscount({
    lines: input.lines,
    deliveryFee: DELIVERY_FEE_IQD,
    rule: ruleOf(input.coupon),
  });
  if (!quote.ok) return quote;

  const reviewReasons: string[] = [];
  const influencer = input.coupon.influencer;
  if (influencer) {
    const phone = (input.phone || "").replace(/\D/g, "");
    const infPhone = influencer.phone.replace(/\D/g, "");
    if (phone && infPhone && phone === infPhone) {
      reviewReasons.push("phone_matches_influencer");
    }
    if (
      input.email &&
      influencer.email &&
      input.email.trim().toLowerCase() === influencer.email.trim().toLowerCase()
    ) {
      reviewReasons.push("email_matches_influencer");
    }
  }

  const basis = quote.eligibleSubtotal - quote.merchandiseDiscount;
  let commissionIqd = 0;
  let commissionStatus = "NONE";
  if (
    influencer &&
    influencer.status === "ACTIVE" &&
    influencer.commissionEnabled
  ) {
    const withinAgreement =
      (!influencer.agreementStart || now >= influencer.agreementStart) &&
      (!influencer.agreementEnd || now <= influencer.agreementEnd);
    if (withinAgreement) {
      const type =
        input.coupon.commissionOverrideType === "FIXED" ||
        (!input.coupon.commissionOverrideType &&
          influencer.commissionType === "FIXED")
          ? "FIXED"
          : "PERCENT";
      const value =
        input.coupon.commissionOverrideValue ?? influencer.commissionValue;
      commissionIqd = commissionAmount(basis, type, value);
      if (commissionIqd > 0) commissionStatus = "HELD";
    }
  }

  return {
    ok: true as const,
    quote,
    reviewReasons,
    commissionIqd,
    commissionStatus,
    commissionBasisIqd: commissionIqd > 0 ? basis : 0,
  };
}

async function findCoupon(code: string) {
  return prisma.coupon.findUnique({
    where: { code: normalizeCouponCode(code) },
    include: { campaign: true, influencer: true },
  });
}

export async function quoteCoupon(input: {
  items: { id: string; quantity: number; size?: string }[];
  couponCode?: string | null;
  customerId?: string;
  phone?: string;
  email?: string;
  ipHash?: string;
}) {
  const code = input.couponCode ? normalizeCouponCode(input.couponCode) : "";
  const { lines, orderItems } = await loadPricedLines(input.items);
  const merchandiseBefore = lines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0,
  );
  const listBefore = lines.reduce(
    (sum, line) => sum + line.basePrice * line.quantity,
    0,
  );
  const productDiscount = Math.max(0, listBefore - merchandiseBefore);

  if (!code) {
    return {
      ok: true as const,
      items: orderItems,
      lines,
      couponCode: undefined as string | undefined,
      merchandiseBefore,
      productDiscount,
      couponDiscountIqd: 0,
      shippingDiscountIqd: 0,
      deliveryFee: DELIVERY_FEE_IQD,
      merchandiseAfter: merchandiseBefore,
      payable: getOrderTotal(merchandiseBefore, DELIVERY_FEE_IQD),
      warnings: [] as string[],
      snapshot: null,
    };
  }

  if (!isCouponCodeShape(code)) {
    await recordAttempt({
      code,
      outcome: "malformed",
      customerKey: customerKeyOf(input),
      ipHash: input.ipHash,
    });
    throw new CouponRejected(GENERIC);
  }

  const coupon = await findCoupon(code);
  if (!coupon) {
    await recordAttempt({
      code,
      outcome: "unknown",
      customerKey: customerKeyOf(input),
      ipHash: input.ipHash,
    });
    throw new CouponRejected(GENERIC);
  }

  if (coupon.registeredOnly && input.customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: input.customerId },
      select: { id: true },
    });
    if (!customer) {
      throw new CouponRejected("هذا الكود يتطلب تسجيل الدخول.");
    }
  }

  const [used, customerUses, prior] = await Promise.all([
    liveUseCount(coupon.id),
    prisma.couponRedemption.count({
      where: {
        couponId: coupon.id,
        customerKey: customerKeyOf(input),
        reversed: false,
      },
    }),
    input.couponCode
      ? priorOrders(input)
      : Promise.resolve(0),
  ]);

  const evaluated = evaluateLoaded({
    lines,
    coupon,
    customerId: input.customerId,
    phone: input.phone,
    email: input.email,
    used,
    customerUses: customerKeyOf(input) ? customerUses : 0,
    prior,
  });

  if (!evaluated.ok) {
    await recordAttempt({
      couponId: coupon.id,
      code,
      outcome: evaluated.code,
      customerKey: customerKeyOf(input),
      ipHash: input.ipHash,
    });
    throw new CouponRejected(evaluated.message);
  }

  if (coupon.campaign?.budgetIqd != null) {
    const spent = await prisma.couponRedemption.aggregate({
      where: { campaignId: coupon.campaignId, reversed: false },
      _sum: { discountIqd: true, shippingDiscountIqd: true },
    });
    const exposure =
      (spent._sum.discountIqd || 0) +
      (spent._sum.shippingDiscountIqd || 0) +
      evaluated.quote.merchandiseDiscount +
      evaluated.quote.shippingDiscount;
    if (exposure > coupon.campaign.budgetIqd) {
      await recordAttempt({
        couponId: coupon.id,
        code,
        outcome: "budget",
        ipHash: input.ipHash,
      });
      throw new CouponRejected("لم يعد هذا الكود متاحاً.");
    }
  }

  await recordAttempt({
    couponId: coupon.id,
    code,
    outcome: "ok",
    customerKey: customerKeyOf(input),
    ipHash: input.ipHash,
  });

  const snapshot = {
    couponId: coupon.id,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    campaignId: coupon.campaignId,
    influencerId: coupon.influencerId,
    merchandiseBefore: evaluated.quote.merchandiseBefore,
    eligibleBaseIqd: evaluated.quote.eligibleSubtotal,
    discountIqd: evaluated.quote.merchandiseDiscount,
    shippingDiscountIqd: evaluated.quote.shippingDiscount,
    deliveryFee: evaluated.quote.deliveryFee,
    payable: evaluated.quote.payable,
    commissionIqd: evaluated.commissionIqd,
    commissionStatus: evaluated.commissionStatus,
    commissionBasisIqd: evaluated.commissionBasisIqd,
    reviewReasons: evaluated.reviewReasons,
    rule: {
      maxDiscountIqd: coupon.maxDiscountIqd,
      minSubtotalIqd: coupon.minSubtotalIqd,
      applyToSaleItems: coupon.applyToSaleItems,
    },
  };

  return {
    ok: true as const,
    items: orderItems,
    lines,
    coupon,
    couponCode: coupon.code,
    merchandiseBefore: evaluated.quote.merchandiseBefore,
    productDiscount: evaluated.quote.productDiscount,
    couponDiscountIqd: evaluated.quote.merchandiseDiscount,
    shippingDiscountIqd: evaluated.quote.shippingDiscount,
    deliveryFee: evaluated.quote.deliveryFee,
    merchandiseAfter: evaluated.quote.merchandiseAfter,
    payable: evaluated.quote.payable,
    warnings: evaluated.quote.warnings,
    commissionIqd: evaluated.commissionIqd,
    commissionStatus: evaluated.commissionStatus,
    commissionBasisIqd: evaluated.commissionBasisIqd,
    reviewReasons: evaluated.reviewReasons,
    snapshot,
  };
}

export async function pricePublicOrder(input: {
  items: { id: string; quantity: number; size?: string }[];
  couponCode?: string | null;
  customerId?: string;
  phone?: string;
  email?: string;
}) {
  return quoteCoupon(input);
}

export function applyQuoteToOrder(
  order: OrderPayload,
  quote: Awaited<ReturnType<typeof quoteCoupon>>,
) {
  order.items = quote.items;
  order.subtotal = quote.merchandiseAfter;
  order.deliveryFee = quote.deliveryFee;
  order.total = quote.payable;
  order.couponCode = quote.couponCode;
  order.couponDiscountIqd = quote.couponDiscountIqd;
  order.productDiscountIqd = quote.productDiscount;
  order.listMerchandiseIqd = quote.merchandiseBefore + quote.productDiscount;
  order.shippingDiscountIqd = quote.shippingDiscountIqd;
  order.discountSnapshot = quote.snapshot ?? undefined;
}

/** يعيد حساب الكوبون داخل قفل الصف ثم يسجّل الاسترداد مرة واحدة للطلب. */
export async function redeemOrderCoupon(order: OrderPayload, orderId: string) {
  if (!order.couponCode) return null;
  const code = normalizeCouponCode(order.couponCode);
  const key = customerKeyOf(order);
  if (!key) throw new CouponRejected("بيانات الزبون غير مكتملة لتطبيق الكود.");

  return prisma.$transaction(async (tx) => {
    const existing = await tx.couponRedemption.findUnique({
      where: { orderId },
    });
    if (existing && !existing.reversed) return existing;

    const locked = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Coupon" WHERE code = ${code} FOR UPDATE
    `;
    if (!locked[0]) throw new CouponRejected(GENERIC);

    const coupon = await tx.coupon.findUnique({
      where: { id: locked[0].id },
      include: { campaign: true, influencer: true },
    });
    if (!coupon) throw new CouponRejected(GENERIC);

    const { lines } = await loadPricedLines(order.items);
    const [used, customerUses, prior] = await Promise.all([
      liveUseCount(coupon.id, tx),
      tx.couponRedemption.count({
        where: { couponId: coupon.id, customerKey: key, reversed: false },
      }),
      priorOrders({
        phone: order.phone,
        email: order.email,
        customerId: order.customerId,
      }),
    ]);

    const evaluated = evaluateLoaded({
      lines,
      coupon,
      customerId: order.customerId,
      phone: order.phone,
      email: order.email,
      used,
      customerUses,
      prior,
    });
    if (!evaluated.ok) throw new CouponRejected(evaluated.message);

    if (
      evaluated.quote.payable !== order.total ||
      evaluated.quote.merchandiseDiscount !== (order.couponDiscountIqd || 0)
    ) {
      throw new CouponRejected(
        "تغيّر مبلغ الطلب. راجعي السلة ثم أكّدي المبلغ الجديد.",
        409,
      );
    }

    if (coupon.campaign?.budgetIqd != null && coupon.campaignId) {
      await tx.$queryRaw`SELECT id FROM "PromoCampaign" WHERE id = ${coupon.campaignId} FOR UPDATE`;
      const spent = await tx.couponRedemption.aggregate({
        where: { campaignId: coupon.campaignId, reversed: false },
        _sum: { discountIqd: true, shippingDiscountIqd: true },
      });
      const exposure =
        (spent._sum.discountIqd || 0) +
        (spent._sum.shippingDiscountIqd || 0) +
        evaluated.quote.merchandiseDiscount +
        evaluated.quote.shippingDiscount;
      if (exposure > coupon.campaign.budgetIqd) {
        throw new CouponRejected("لم يعد هذا الكود متاحاً.");
      }
    }

    const eligibleIds = lines
      .filter((line) => lineEligible(line, ruleOf(coupon)))
      .map((line) => line.id);

    try {
      return await tx.couponRedemption.create({
      data: {
        couponId: coupon.id,
        orderId,
        customerKey: key,
        customerId: order.customerId || "",
        code: coupon.code,
        merchandiseBeforeIqd: evaluated.quote.merchandiseBefore,
        discountIqd: evaluated.quote.merchandiseDiscount,
        shippingDiscountIqd: evaluated.quote.shippingDiscount,
        eligibleBaseIqd: evaluated.quote.eligibleSubtotal,
        deliveryFeeIqd: evaluated.quote.deliveryFee,
        payableIqd: evaluated.quote.payable,
        influencerId: coupon.influencerId,
        campaignId: coupon.campaignId,
        commissionIqd: evaluated.commissionIqd,
        commissionBasisIqd: evaluated.commissionBasisIqd,
        commissionStatus: evaluated.commissionStatus,
        reviewRequired: evaluated.reviewReasons.length > 0,
        reviewReasons: evaluated.reviewReasons,
        snapshotJson: {
          ...(order.discountSnapshot || {}),
          eligibleProductIds: eligibleIds,
          influencerName: coupon.influencer?.name || null,
          campaignName: coupon.campaign?.name || null,
          commissionType:
            coupon.commissionOverrideType ||
            coupon.influencer?.commissionType ||
            null,
          commissionValue:
            coupon.commissionOverrideValue ??
            coupon.influencer?.commissionValue ??
            null,
        },
      },
    });
    } catch (error) {
      const again = await tx.couponRedemption.findUnique({ where: { orderId } });
      if (again) return again;
      throw error;
    }
  });
}

export async function reverseCouponRedemption(orderId: string, reason: string) {
  const row = await prisma.couponRedemption.findUnique({ where: { orderId } });
  if (!row || row.reversed) return row;
  return prisma.couponRedemption.update({
    where: { orderId },
    data: {
      reversed: true,
      reversedReason: reason.slice(0, 200),
      commissionStatus: row.commissionIqd > 0 ? "REVERSED" : row.commissionStatus,
    },
  });
}

export async function syncCouponCommission(orderId: string, status: string) {
  const row = await prisma.couponRedemption.findUnique({ where: { orderId } });
  if (!row) return;
  if (status === "cancelled" || status === "returned" || status === "failed_delivery") {
    await reverseCouponRedemption(orderId, `order_${status}`);
    return;
  }
  if (row.reversed && row.commissionStatus === "REVERSED" && !row.paidAt) {
    await prisma.couponRedemption.update({
      where: { orderId },
      data: {
        reversed: false,
        reversedReason: "",
        commissionStatus: row.commissionIqd > 0 ? "HELD" : "NONE",
      },
    });
  }
  if (status === "delivered") {
    const fresh = await prisma.couponRedemption.findUnique({ where: { orderId } });
    if (fresh && !fresh.reversed && fresh.commissionStatus === "HELD") {
      await prisma.couponRedemption.update({
        where: { orderId },
        data: { commissionStatus: "PENDING" },
      });
    }
  }
}

export type CouponWrite = {
  code?: string;
  name?: string;
  description?: string;
  notes?: string;
  type?: string;
  value?: number;
  maxDiscountIqd?: number | null;
  minSubtotalIqd?: number;
  startsAt?: string | null;
  endsAt?: string | null;
  status?: string;
  maxRedemptions?: number | null;
  maxPerCustomer?: number | null;
  firstOrderOnly?: boolean;
  registeredOnly?: boolean;
  applyToSaleItems?: boolean;
  visibility?: string;
  ignoreCampaignPause?: boolean;
  minMarginPercent?: number | null;
  campaignId?: string | null;
  influencerId?: string | null;
  eligibleProductIds?: string[];
  eligibleCategories?: string[];
  eligibleBrands?: string[];
  excludedProductIds?: string[];
  excludedCategories?: string[];
  excludedBrands?: string[];
  restrictedCustomerIds?: string[];
  commissionOverrideType?: string | null;
  commissionOverrideValue?: number | null;
  confirmHighImpact?: boolean;
};

const HIGH_IMPACT = [
  "type",
  "value",
  "maxDiscountIqd",
  "minSubtotalIqd",
  "eligibleProductIds",
  "eligibleCategories",
  "eligibleBrands",
  "excludedProductIds",
  "excludedCategories",
  "excludedBrands",
  "applyToSaleItems",
  "maxRedemptions",
  "maxPerCustomer",
] as const;

export function validateCouponWrite(input: CouponWrite, existingCode?: string) {
  const errors: string[] = [];
  const type = input.type || "PERCENT";
  if (!["PERCENT", "FIXED", "FREE_SHIPPING"].includes(type)) {
    errors.push("نوع الخصم غير مدعوم.");
  }
  const value = Math.round(Number(input.value || 0));
  if (type === "PERCENT" && (value < 1 || value > 100)) {
    errors.push("نسبة الخصم يجب أن تكون بين 1 و 100.");
  }
  if (type === "FIXED" && value < 1) {
    errors.push("مبلغ الخصم الثابت يجب أن يكون أكبر من صفر.");
  }
  if (type === "FREE_SHIPPING" && value !== 0) {
    errors.push("كوبون الشحن المجاني لا يحمل قيمة خصم على المنتجات.");
  }
  if (type !== "PERCENT" && input.maxDiscountIqd) {
    errors.push("سقف الخصم يُستخدم مع النسبة المئوية فقط.");
  }
  if (input.maxDiscountIqd != null && input.maxDiscountIqd < 1) {
    errors.push("سقف الخصم غير صالح.");
  }
  const starts = parseBaghdadDateTime(input.startsAt);
  const ends = parseBaghdadDateTime(input.endsAt);
  if (input.startsAt && !starts) errors.push("تاريخ البداية غير صالح.");
  if (input.endsAt && !ends) errors.push("تاريخ النهاية غير صالح.");
  if (starts && ends && ends.getTime() <= starts.getTime()) {
    errors.push("تاريخ النهاية يجب أن يكون بعد البداية.");
  }
  const status = input.status || "DRAFT";
  if (!["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"].includes(status)) {
    errors.push("حالة الكوبون غير مدعومة. المجدول والمنتهي يُحسبان من التواريخ.");
  }
  if (input.maxPerCustomer != null && input.maxPerCustomer < 1) {
    errors.push("حد الاستخدام لكل زبون غير صالح.");
  }
  if (input.maxRedemptions != null && input.maxRedemptions < 1) {
    errors.push("حد الاستخدام الكلي غير صالح.");
  }
  if (input.minMarginPercent != null && (input.minMarginPercent < 0 || input.minMarginPercent > 95)) {
    errors.push("حد الهامش يجب أن يكون بين 0 و 95.");
  }
  const code = input.code ? normalizeCouponCode(input.code) : existingCode || "";
  if (input.code && !isCouponCodeShape(code)) {
    errors.push("صيغة الكود: أحرف إنجليزية وأرقام، من 4 إلى 32 خانة.");
  }
  if ((input.visibility || "PUBLIC") === "STACK") {
    errors.push("دمج أكثر من كود في الطلب نفسه غير مفعّل.");
  }
  return { errors, starts, ends, code, type, value, status };
}

function couponData(input: CouponWrite, actor: string, parsed: ReturnType<typeof validateCouponWrite>) {
  return {
    code: parsed.code,
    name: (input.name || parsed.code).trim().slice(0, 120),
    description: (input.description || "").slice(0, 500),
    notes: (input.notes || "").slice(0, 1000),
    type: parsed.type,
    value: parsed.type === "FREE_SHIPPING" ? 0 : parsed.value,
    maxDiscountIqd: parsed.type === "PERCENT" ? input.maxDiscountIqd ?? null : null,
    minSubtotalIqd: Math.max(0, Math.round(input.minSubtotalIqd || 0)),
    startsAt: parsed.starts,
    endsAt: parsed.ends,
    status: parsed.status,
    maxRedemptions: input.maxRedemptions ?? null,
    maxPerCustomer: input.maxPerCustomer ?? 1,
    firstOrderOnly: Boolean(input.firstOrderOnly),
    registeredOnly: Boolean(input.registeredOnly),
    applyToSaleItems: input.applyToSaleItems !== false,
    visibility: input.visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC",
    ignoreCampaignPause: Boolean(input.ignoreCampaignPause),
    minMarginPercent: input.minMarginPercent ?? null,
    campaignId: input.campaignId || null,
    influencerId: input.influencerId || null,
    eligibleProductIds: input.eligibleProductIds || [],
    eligibleCategories: input.eligibleCategories || [],
    eligibleBrands: input.eligibleBrands || [],
    excludedProductIds: input.excludedProductIds || [],
    excludedCategories: input.excludedCategories || [],
    excludedBrands: input.excludedBrands || [],
    restrictedCustomerIds: input.restrictedCustomerIds || [],
    commissionOverrideType: input.commissionOverrideType || null,
    commissionOverrideValue:
      input.commissionOverrideValue == null
        ? null
        : Math.round(input.commissionOverrideValue),
    updatedBy: actor,
  };
}

function changedHighImpact(before: CouponRow, input: CouponWrite) {
  return HIGH_IMPACT.some((key) => {
    if (input[key] === undefined) return false;
    return JSON.stringify(input[key]) !== JSON.stringify(before[key]);
  });
}

export async function createCoupon(input: CouponWrite, actor: string) {
  const parsed = validateCouponWrite(input);
  if (!parsed.code) parsed.errors.push("الكود مطلوب، أو استخدمي التوليد.");
  if (parsed.errors.length) {
    return { ok: false as const, error: parsed.errors.join(" ") };
  }
  const taken = await prisma.coupon.findUnique({ where: { code: parsed.code } });
  if (taken) return { ok: false as const, error: "هذا الكود مستخدم مسبقاً." };
  const row = await prisma.coupon.create({
    data: { ...couponData(input, actor, parsed), createdBy: actor },
  });
  return { ok: true as const, coupon: row };
}

export async function updateCoupon(id: string, input: CouponWrite, actor: string) {
  const existing = await prisma.coupon.findUnique({
    where: { id },
    include: { campaign: true, influencer: true },
  });
  if (!existing) return { ok: false as const, error: "الكوبون غير موجود." };
  const parsed = validateCouponWrite({ ...input, code: input.code || existing.code }, existing.code);
  if (parsed.errors.length) return { ok: false as const, error: parsed.errors.join(" ") };
  if (parsed.code !== existing.code) {
    const taken = await prisma.coupon.findUnique({ where: { code: parsed.code } });
    if (taken) return { ok: false as const, error: "هذا الكود مستخدم مسبقاً." };
  }
  const live = await liveUseCount(existing.id);
  if (live > 0 && parsed.code !== existing.code) {
    return { ok: false as const, error: "لا يمكن تغيير كود استُخدم في طلبات سابقة." };
  }
  if (
    existing.status === "ACTIVE" &&
    changedHighImpact(existing, input) &&
    !input.confirmHighImpact
  ) {
    return {
      ok: false as const,
      error: "تعديل خصم منشور يحتاج تأكيداً صريحاً.",
      requiresConfirmation: true,
    };
  }
  const row = await prisma.coupon.update({
    where: { id },
    data: couponData({ ...input, code: parsed.code }, actor, parsed),
  });
  return { ok: true as const, before: existing, coupon: row };
}

export async function setCouponStatus(id: string, status: string, actor: string) {
  if (!["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"].includes(status)) {
    return { ok: false as const, error: "الحالة غير مدعومة." };
  }
  const before = await prisma.coupon.findUnique({ where: { id } });
  if (!before) return { ok: false as const, error: "الكوبون غير موجود." };
  const coupon = await prisma.coupon.update({
    where: { id },
    data: { status, updatedBy: actor },
  });
  return { ok: true as const, before, coupon };
}

export { displayStatus, normalizeCouponCode, quoteDiscount, lineEligible };
