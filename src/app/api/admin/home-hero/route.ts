import {
  getHomeHeroConfig,
  saveHomeHeroConfig,
} from "@/lib/home/config";
import { DEFAULT_HOME_HERO } from "@/lib/home/default-config";
import type { HomeHeroConfig } from "@/lib/home/types";

export async function GET() {
  try {
    const config = await getHomeHeroConfig();
    return Response.json({ ok: true, config });
  } catch (error) {
    console.error("[admin/home-hero] GET", error);
    return Response.json(
      {
        ok: false,
        error: "تعذّر جلب إعدادات الهيرو.",
        config: DEFAULT_HOME_HERO,
      },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as { config?: HomeHeroConfig };
    if (!body?.config || typeof body.config !== "object") {
      return Response.json(
        { ok: false, error: "بيانات الإعداد غير صحيحة." },
        { status: 400 },
      );
    }
    const config = await saveHomeHeroConfig(body.config);
    return Response.json({ ok: true, config });
  } catch (error) {
    console.error("[admin/home-hero] PUT", error);
    return Response.json(
      { ok: false, error: "تعذّر حفظ إعدادات الهيرو." },
      { status: 500 },
    );
  }
}
