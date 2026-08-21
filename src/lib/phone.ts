/**
 * أرقام الهاتف العراقية — صيغة صارمة للجوال فقط.
 * التخزين المعياري: 9647XXXXXXXXX (دولي بدون +)
 * العرض: 07XXXXXXXXX
 */

const IRAQ_MOBILE = /^9647\d{9}$/;
const LOCAL_MOBILE = /^07\d{9}$/;

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

/** يحوّل أي إدخال شائع إلى 9647XXXXXXXXX أو null */
export function normalizeIraqMobile(raw: string): string | null {
  let d = digitsOnly(raw);
  if (!d) return null;

  if (d.startsWith("00964")) d = d.slice(2);
  if (d.startsWith("9640")) d = `964${d.slice(4)}`;
  if (d.startsWith("964")) {
    // 964 + 7XXXXXXXXX
  } else if (d.startsWith("0") && d.length === 11) {
    d = `964${d.slice(1)}`;
  } else if (d.startsWith("7") && d.length === 10) {
    d = `964${d}`;
  } else {
    return null;
  }

  if (!IRAQ_MOBILE.test(d)) return null;
  return d;
}

export function isValidIraqMobile(raw: string) {
  return normalizeIraqMobile(raw) !== null;
}

/** للعرض في الواجهة: 07XXXXXXXXX */
export function formatIraqMobileLocal(raw: string) {
  const n = normalizeIraqMobile(raw);
  if (!n) return raw;
  return `0${n.slice(3)}`;
}

/** أثناء الكتابة: ابقِ أرقاماً فقط وبحد أقصى 11 بصيغة محلية */
export function maskIraqMobileInput(raw: string) {
  let d = digitsOnly(raw);
  if (d.startsWith("964")) {
    d = `0${d.slice(3)}`;
  } else if (d.startsWith("7") && !d.startsWith("07")) {
    d = `0${d}`;
  }
  if (!d.startsWith("0") && d.length > 0) {
    d = `0${d}`;
  }
  return d.slice(0, 11);
}

export function iraqMobileError(raw: string): string | null {
  const d = digitsOnly(raw);
  if (!d) return "أدخلي رقم الهاتف.";
  const n = normalizeIraqMobile(raw);
  if (n) return null;
  if (LOCAL_MOBILE.test(d) || (d.startsWith("07") && d.length < 11)) {
    return "رقم الجوال يجب أن يكون 11 رقماً ويبدأ بـ 07.";
  }
  return "استخدمي رقم جوال عراقي بصيغة 07XXXXXXXXX.";
}
