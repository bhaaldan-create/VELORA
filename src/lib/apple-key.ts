import { readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

function normalizeApplePrivateKey(raw: string) {
  let key = raw.trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, "\n");
}

/**
 * يحمّل مفتاح Apple .p8 من مسار ملف (محلي) أو من متغير بيئة (Vercel).
 * لا تضع المفتاح في source code — فقط APPLE_PRIVATE_KEY_PATH أو APPLE_PRIVATE_KEY.
 */
export function loadApplePrivateKeyPem(): string | null {
  const pathRaw = process.env.APPLE_PRIVATE_KEY_PATH?.trim();
  if (pathRaw) {
    try {
      const filePath = isAbsolute(pathRaw)
        ? pathRaw
        : resolve(process.cwd(), pathRaw);
      const pem = readFileSync(filePath, "utf8");
      if (pem.includes("BEGIN PRIVATE KEY")) {
        return normalizeApplePrivateKey(pem);
      }
    } catch {
      return null;
    }
  }

  const inline = process.env.APPLE_PRIVATE_KEY?.trim();
  if (inline) return normalizeApplePrivateKey(inline);

  return null;
}

export function isApplePrivateKeyAvailable() {
  return loadApplePrivateKeyPem() !== null;
}
