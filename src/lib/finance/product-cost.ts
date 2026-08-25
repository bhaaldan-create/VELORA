/**
 * Deterministic product cost helpers.
 * Never invent COGS — if purchasePrice is 0 and no extras, cost is "unknown".
 */

export type ProductCostInput = {
  costCurrency: string;
  costExchangeRate: number;
  purchasePrice: number;
  shippingCostIqd: number;
  customsCostIqd: number;
  brokerageCostIqd: number;
  handlingCostIqd: number;
  otherCostIqd: number;
  /** Selling base price IQD */
  price: number;
  discountPercent: number;
  minMarginPct?: number;
};

export type ProductCostBreakdown = {
  hasCostData: boolean;
  purchaseIqd: number;
  extrasIqd: number;
  landedCostIqd: number;
  netSellingPrice: number;
  grossProfit: number | null;
  grossMarginPct: number | null;
  belowMinMargin: boolean;
  explanationAr: string;
  explanationEn: string;
};

export function salePriceIqd(price: number, discountPercent: number): number {
  const d = Math.max(0, Math.min(100, discountPercent || 0));
  return Math.round(price * (1 - d / 100));
}

export function computeLandedCostIqd(input: ProductCostInput): number {
  const rate =
    input.costCurrency.toUpperCase() === "IQD"
      ? 1
      : Math.max(0, input.costExchangeRate || 0);
  const purchaseIqd = Math.max(0, input.purchasePrice) * rate;
  const extras =
    Math.max(0, input.shippingCostIqd) +
    Math.max(0, input.customsCostIqd) +
    Math.max(0, input.brokerageCostIqd) +
    Math.max(0, input.handlingCostIqd) +
    Math.max(0, input.otherCostIqd);
  return Math.round((purchaseIqd + extras) * 100) / 100;
}

export function analyzeProductCost(input: ProductCostInput): ProductCostBreakdown {
  const rate =
    input.costCurrency.toUpperCase() === "IQD"
      ? 1
      : Math.max(0, input.costExchangeRate || 0);
  const purchaseIqd = Math.max(0, input.purchasePrice) * rate;
  const extrasIqd =
    Math.max(0, input.shippingCostIqd) +
    Math.max(0, input.customsCostIqd) +
    Math.max(0, input.brokerageCostIqd) +
    Math.max(0, input.handlingCostIqd) +
    Math.max(0, input.otherCostIqd);
  const landedCostIqd = Math.round((purchaseIqd + extrasIqd) * 100) / 100;
  const hasCostData = input.purchasePrice > 0 || extrasIqd > 0;
  const netSellingPrice = salePriceIqd(input.price, input.discountPercent);
  const minMargin = input.minMarginPct ?? 20;

  if (!hasCostData) {
    return {
      hasCostData: false,
      purchaseIqd: 0,
      extrasIqd: 0,
      landedCostIqd: 0,
      netSellingPrice,
      grossProfit: null,
      grossMarginPct: null,
      belowMinMargin: false,
      explanationAr: "لا توجد بيانات تكلفة كافية — أدخل سعر الشراء أو تكاليف الاستيراد.",
      explanationEn: "Insufficient cost data — enter purchase price or import costs.",
    };
  }

  const grossProfit = Math.round((netSellingPrice - landedCostIqd) * 100) / 100;
  const grossMarginPct =
    netSellingPrice > 0
      ? Math.round((grossProfit / netSellingPrice) * 10000) / 100
      : null;

  return {
    hasCostData: true,
    purchaseIqd: Math.round(purchaseIqd * 100) / 100,
    extrasIqd: Math.round(extrasIqd * 100) / 100,
    landedCostIqd,
    netSellingPrice,
    grossProfit,
    grossMarginPct,
    belowMinMargin: grossMarginPct !== null && grossMarginPct < minMargin,
    explanationAr: `التكلفة الواصلة = شراء ${Math.round(purchaseIqd).toLocaleString("ar-IQ")} + إضافات ${Math.round(extrasIqd).toLocaleString("ar-IQ")} = ${Math.round(landedCostIqd).toLocaleString("ar-IQ")} د.ع. صافي البيع ${netSellingPrice.toLocaleString("ar-IQ")} → ربح إجمالي ${Math.round(grossProfit).toLocaleString("ar-IQ")} (${grossMarginPct}%).`,
    explanationEn: `Landed = purchase ${purchaseIqd.toFixed(0)} + extras ${extrasIqd.toFixed(0)} = ${landedCostIqd.toFixed(0)} IQD. Net sell ${netSellingPrice} → gross profit ${grossProfit.toFixed(0)} (${grossMarginPct}%).`,
  };
}

export function toIqd(amount: number, currency: string, exchangeRate: number): number {
  if (currency.toUpperCase() === "IQD") return Math.round(amount * 100) / 100;
  return Math.round(amount * Math.max(0, exchangeRate) * 100) / 100;
}
