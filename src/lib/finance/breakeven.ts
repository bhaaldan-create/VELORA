/**
 * Break-even analysis from fixed monthly costs + average gross margin.
 */
export type BreakEvenInput = {
  monthlyFixedCostsIqd: number;
  /** 0–100 */
  averageGrossMarginPct: number | null;
  averageOrderValueIqd: number;
  averageUnitPriceIqd?: number;
};

export type BreakEvenResult = {
  hasMarginData: boolean;
  breakEvenRevenueIqd: number | null;
  breakEvenOrders: number | null;
  breakEvenUnits: number | null;
  explanationAr: string;
  explanationEn: string;
};

export function computeBreakEven(input: BreakEvenInput): BreakEvenResult {
  const fixed = Math.max(0, input.monthlyFixedCostsIqd);
  const margin =
    input.averageGrossMarginPct === null
      ? null
      : Math.max(0, Math.min(100, input.averageGrossMarginPct)) / 100;

  if (margin === null || margin <= 0) {
    return {
      hasMarginData: false,
      breakEvenRevenueIqd: null,
      breakEvenOrders: null,
      breakEvenUnits: null,
      explanationAr:
        "بيانات غير كافية — تحتاجين هامش إجمالي متوسطاً من مبيعات بتكلفة واصلة مسجّلة.",
      explanationEn:
        "Insufficient data — need an average gross margin from sales with known landed cost.",
    };
  }

  const revenue = Math.round(fixed / margin);
  const orders =
    input.averageOrderValueIqd > 0
      ? Math.ceil(revenue / input.averageOrderValueIqd)
      : null;
  const unitPrice = input.averageUnitPriceIqd || 0;
  const units = unitPrice > 0 ? Math.ceil(revenue / unitPrice) : null;

  return {
    hasMarginData: true,
    breakEvenRevenueIqd: revenue,
    breakEvenOrders: orders,
    breakEvenUnits: units,
    explanationAr: `VELORA تحتاج تقريباً ${revenue.toLocaleString("ar-IQ")} د.ع مبيعات شهرية لتغطية التكاليف الثابتة ${fixed.toLocaleString("ar-IQ")} د.ع عند هامش ${Math.round(margin * 100)}%.`,
    explanationEn: `VELORA needs ~${revenue.toLocaleString("en-US")} IQD monthly sales to cover ${fixed.toLocaleString("en-US")} IQD fixed costs at ${Math.round(margin * 100)}% margin.`,
  };
}
