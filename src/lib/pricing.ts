/** نسب الخصم المتاحة بضغطة زر من لوحة الإدارة */
export const DISCOUNT_OPTIONS = [0, 10, 20, 30, 40, 50] as const;
export type DiscountPercent = (typeof DISCOUNT_OPTIONS)[number];

export function isDiscountPercent(value: number): value is DiscountPercent {
  return (DISCOUNT_OPTIONS as readonly number[]).includes(value);
}

/** السعر النهائي بعد الخصم من السعر الأساسي */
export function salePriceFromBase(basePrice: number, discountPercent: number) {
  const d = Math.max(0, Math.min(100, Math.round(discountPercent || 0)));
  if (d <= 0) return Math.round(basePrice);
  return Math.round((basePrice * (100 - d)) / 100);
}
