import { assertAdminModule } from "@/lib/admin/guard";
import { prisma } from "@/lib/db";
import {
  getVeloraCardConfig,
  saveVeloraCardConfig,
  mergeVeloraCardConfig,
} from "@/lib/my-velora/config";
import { getMyVeloraAnalytics } from "@/lib/my-velora/analytics";
import { ensureMyVeloraSeed } from "@/lib/my-velora/seed";
import type { VeloraCardConfig } from "@/lib/my-velora/types";

export async function GET() {
  const gate = await assertAdminModule("settings");
  if (!gate.ok) return gate.response;

  try {
    await ensureMyVeloraSeed();
    const [config, templates, analytics] = await Promise.all([
      getVeloraCardConfig(),
      prisma.veloraCardTemplate.findMany({
        orderBy: [{ priority: "desc" }, { nameEn: "asc" }],
      }),
      getMyVeloraAnalytics(),
    ]);

    return Response.json({
      ok: true,
      config,
      templates,
      analytics,
    });
  } catch (error) {
    console.error("[admin/my-velora GET]", error);
    return Response.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const gate = await assertAdminModule("settings");
  if (!gate.ok) return gate.response;

  try {
    const body = (await req.json()) as { config?: VeloraCardConfig };
    if (!body.config) {
      return Response.json({ ok: false, error: "Bad request" }, { status: 400 });
    }
    const saved = await saveVeloraCardConfig(mergeVeloraCardConfig(body.config));
    return Response.json({ ok: true, config: saved });
  } catch (error) {
    console.error("[admin/my-velora PUT]", error);
    return Response.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
