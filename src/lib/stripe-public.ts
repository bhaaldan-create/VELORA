/** ثوابت عامة يمكن استيرادها من مكوّنات العميل دون مفاتيح سرية */
export const USD_TO_IQD_RATE = 1310;

export function isCardPaymentMethod(method: string) {
  return method === "visa" || method === "mastercard";
}
