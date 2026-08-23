import { getClubConfig, saveClubConfig } from "@/lib/club/config";
import { DEFAULT_CLUB_CONFIG } from "@/lib/club/default-config";
import type { ClubConfig } from "@/lib/club/types";

export async function GET() {
  try {
    const config = await getClubConfig();
    return Response.json({ ok: true, config });
  } catch (error) {
    console.error("[admin/club-config] GET", error);
    return Response.json(
      { ok: false, error: "تعذّر جلب إعدادات النادي.", config: DEFAULT_CLUB_CONFIG },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as { config?: ClubConfig };
    if (!body?.config || typeof body.config !== "object") {
      return Response.json(
        { ok: false, error: "بيانات الإعداد غير صحيحة." },
        { status: 400 },
      );
    }
    const config = await saveClubConfig(body.config);
    return Response.json({ ok: true, config });
  } catch (error) {
    console.error("[admin/club-config] PUT", error);
    return Response.json(
      { ok: false, error: "تعذّر حفظ إعدادات النادي." },
      { status: 500 },
    );
  }
}
