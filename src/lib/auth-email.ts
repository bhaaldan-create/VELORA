import { normalizeAuthEmail } from "@/lib/email-otp";

/** أخطاء شائعة في كتابة نطاق البريد */
const DOMAIN_TYPOS: Record<string, string> = {
  "gmail.con": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmail.comm": "gmail.com",
  "gmail.om": "gmail.com",
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gnail.com": "gmail.com",
  "yahoo.con": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "hotmail.con": "hotmail.com",
  "outlook.con": "outlook.com",
  "icloud.con": "icloud.com",
  "live.con": "live.com",
};

export type AuthEmailValidation =
  | { ok: true; email: string }
  | { ok: false; error: string };

export function validateAuthEmail(
  raw: string | undefined | null,
): AuthEmailValidation {
  const email = normalizeAuthEmail(raw);
  if (!email) {
    return { ok: false, error: "أدخلي بريداً إلكترونياً صالحاً." };
  }

  const at = email.lastIndexOf("@");
  if (at <= 0 || at === email.length - 1) {
    return { ok: false, error: "أدخلي بريداً إلكترونياً صالحاً." };
  }

  const local = email.slice(0, at);
  const domain = email.slice(at + 1);

  const suggestion = DOMAIN_TYPOS[domain];
  if (suggestion) {
    return {
      ok: false,
      error: `يبدو أن هناك خطأ في كتابة البريد. هل تقصدين ${local}@${suggestion}؟`,
    };
  }

  if (domain.endsWith(".con")) {
    return {
      ok: false,
      error:
        "امتداد .con غير صحيح لمعظم مزودي البريد. تأكدي من كتابة .com (مثل gmail.com).",
    };
  }

  return { ok: true, email };
}
