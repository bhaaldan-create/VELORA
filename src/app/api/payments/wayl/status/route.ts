import { isWaylConfigured, verifyWaylApiKey, getWaylEnv, getWaylWebhookUrl, isWaylStoreVerifiedFlag } from "@/lib/wayl";

export const dynamic = "force-dynamic";

export async function GET() {
  const configured = isWaylConfigured();
  if (!configured) {
    return Response.json({
      ok: true,
      configured: false,
    });
  }

  const verified = await verifyWaylApiKey();
  return Response.json({
    ok: true,
    configured: true,
    env: getWaylEnv(),
    webhookUrl: getWaylWebhookUrl(),
    apiKeyValid: verified.ok,
    storeVerified: isWaylStoreVerifiedFlag(),
    checkoutAvailable:
      verified.ok &&
      (getWaylEnv() === "test" || isWaylStoreVerifiedFlag()),
    error: verified.ok ? undefined : verified.error,
  });
}
