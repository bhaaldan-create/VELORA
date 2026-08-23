import {
  categoryConfigForClient,
  getHomeCategoryConfig,
  saveHomeCategoryConfig,
} from "@/lib/home/config";
import { DEFAULT_HOME_CATEGORIES } from "@/lib/home/default-config";
import type { HomeCategoryConfig } from "@/lib/home/types";

export async function GET() {
  try {
    const config = await getHomeCategoryConfig();
    return Response.json({ ok: true, config: categoryConfigForClient(config) });
  } catch (error) {
    console.error("[admin/home-categories] GET", error);
    return Response.json(
      {
        ok: false,
        error: "تعذّر جلب إعدادات الفئات.",
        config: DEFAULT_HOME_CATEGORIES,
      },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as { config?: HomeCategoryConfig };
    if (!body?.config || typeof body.config !== "object") {
      return Response.json(
        { ok: false, error: "بيانات الإعداد غير صحيحة." },
        { status: 400 },
      );
    }
    const config = await saveHomeCategoryConfig(body.config);
    return Response.json({ ok: true, config: categoryConfigForClient(config) });
  } catch (error) {
    console.error("[admin/home-categories] PUT", error);
    return Response.json(
      { ok: false, error: "تعذّر حفظ إعدادات الفئات." },
      { status: 500 },
    );
  }
}
