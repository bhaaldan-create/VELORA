/**
 * فحص إعداد Apple OAuth — لا يطبع أي secrets.
 * الاستخدام: npx tsx scripts/verify-apple-oauth.ts
 */
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

config({ path: ".env.local" });
config();

async function main() {
  const pathRaw = process.env.APPLE_PRIVATE_KEY_PATH?.trim();
  const p8FromFile =
    Boolean(pathRaw) && existsSync(resolve(process.cwd(), pathRaw!));
  const p8FromEnv = Boolean(process.env.APPLE_PRIVATE_KEY?.trim());

  const checks: Record<string, boolean> = {
    APPLE_KEY_ID: Boolean(process.env.APPLE_KEY_ID?.trim()),
    APPLE_CLIENT_ID: Boolean(process.env.APPLE_CLIENT_ID?.trim()),
    APPLE_CLIENT_ID_is_services_id:
      process.env.APPLE_CLIENT_ID?.trim() === "beauty.velora.app.web",
    APPLE_TEAM_ID: Boolean(process.env.APPLE_TEAM_ID?.trim()),
    p8_available: p8FromFile || p8FromEnv,
    p8_file_on_disk: p8FromFile,
  };

  const siteOrigin =
    process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/$/, "") ||
    "http://localhost:3000";
  const callbackUrl = `${siteOrigin}/api/auth/oauth/apple/callback`;
  const expectedProduction =
    "https://velorabeautyiq.me/api/auth/oauth/apple/callback";

  console.log("=== Apple OAuth verification (no secrets) ===");
  for (const [key, ok] of Object.entries(checks)) {
    console.log(`${ok ? "OK" : "MISSING"}  ${key}`);
  }
  console.log(`INFO  callback_url=${callbackUrl}`);
  console.log(`INFO  apple_return_url_required=${expectedProduction}`);
  console.log(
    `${
      callbackUrl === expectedProduction ||
      siteOrigin === "http://localhost:3000"
        ? "OK"
        : "WARN"
    }  production_callback_alignment`,
  );

  let configured = false;
  try {
    const { isAppleOAuthConfigured } = await import("../src/lib/oauth");
    configured = isAppleOAuthConfigured();
  } catch {
    configured = false;
  }
  console.log(`${configured ? "OK" : "MISSING"}  isAppleOAuthConfigured()`);
  process.exit(configured ? 0 : 1);
}

void main();
