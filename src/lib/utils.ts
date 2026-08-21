/** تنسيق الدينار العراقي — بدون كسور */
export function formatPrice(amount: number) {
  const formatted = new Intl.NumberFormat("ar-IQ", {
    maximumFractionDigits: 0,
  }).format(amount);
  return `${formatted} د.ع`;
}

/** أرقام لاتينية للوصل الرسمي (IQD 164,000) */
export function formatIqdLatin(amount: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    amount,
  );
}

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
