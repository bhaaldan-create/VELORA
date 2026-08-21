/** حساب الشركة لاستلام التحويلات عبر سوبر كي */
export const SUPER_QI_ACCOUNT = {
  number: "910152619128",
  nameAr: "حساب شركة VELORA",
  providerAr: "سوبر كي",
  providerEn: "Super Qi",
} as const;

/** طرق الدفع التي تُحوَّل عبر سوبر كي */
export function isSuperQiPaymentMethod(method: string) {
  return (
    method === "visa" ||
    method === "mastercard" ||
    method === "qi-card"
  );
}
