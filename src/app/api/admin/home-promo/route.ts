import {
  getHomePromoConfig,
  promoConfigForClient,
  saveHomePromoConfig,
} from "@/lib/home/promo-config";
import { DEFAULT_HOME_PROMO } from "@/lib/home/default-config";
import type { HomePromoConfig } from "@/lib/home/types";

export async function GET() {
  try {
    const config = await getHomePromoConfig();
    return Response.json({ ok: true, config: promoConfigForClient(config) });
  } catch (error) {
    console.error("[admin/home-promo] GET", error);
    return Response.json(
      {
        ok: false,
        error: "تعذّر جلب إعدادات بانر وصل حديثاً.",
        config: DEFAULT_HOME_PROMO,
      },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as { config?: HomePromoConfig };
    if (!body?.config || typeof body.config !== "object") {
      return Response.json(
        { ok: false, error: "بيانات الإعداد غير صحيحة." },
        { status: 400 },
      );
    }
    const config = await saveHomePromoConfig(body.config);
    return Response.json({ ok: true, config: promoConfigForClient(config) });
  } catch (error) {
    console.error("[admin/home-promo] PUT", error);
    const detail =
      error instanceof Error
        ? error.message
        : "تعذّر حفظ إعدادات بانر وصل حديثاً.";
    return Response.json({ ok: false, error: detail }, { status: 500 });
  }
}
