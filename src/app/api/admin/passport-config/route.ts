import { assertAdminModule } from "@/lib/admin/guard";
import {
  DEFAULT_PASSPORT_CONFIG,
  type PassportConfig,
} from "@/lib/passport/types";
import {
  ensurePassportSeed,
  getPassportConfig,
  savePassportConfig,
} from "@/lib/passport/number";

export async function GET() {
  const gate = await assertAdminModule("settings");
  if (!gate.ok) return gate.response;

  try {
    await ensurePassportSeed();
    const config = await getPassportConfig();
    return Response.json({ ok: true, config });
  } catch (error) {
    console.error("[admin/passport-config] GET", error);
    return Response.json(
      { ok: false, error: "تعذّر جلب إعدادات الجواز.", config: DEFAULT_PASSPORT_CONFIG },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  const gate = await assertAdminModule("settings");
  if (!gate.ok) return gate.response;

  try {
    const body = (await req.json()) as { config?: Partial<PassportConfig> };
    if (!body?.config || typeof body.config !== "object") {
      return Response.json(
        { ok: false, error: "بيانات الإعداد غير صحيحة." },
        { status: 400 },
      );
    }
    const config = await savePassportConfig(body.config);
    return Response.json({ ok: true, config });
  } catch (error) {
    console.error("[admin/passport-config] PUT", error);
    return Response.json(
      { ok: false, error: "تعذّر حفظ إعدادات الجواز." },
      { status: 500 },
    );
  }
}
