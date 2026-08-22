import { isWaylConfigured, verifyWaylApiKey, getWaylEnv, getWaylWebhookUrl } from "@/lib/wayl";

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
    error: verified.ok ? undefined : verified.error,
  });
}
