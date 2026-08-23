import {
  ADMIN_IMAGE_MIME,
  MAX_ADMIN_IMAGE_BYTES,
  MAX_ADMIN_IMAGE_ERROR,
} from "@/lib/admin/image-limits";
import { persistAdminImage } from "@/lib/admin/persist-image";
import {
  getHomeCategoryConfig,
  saveHomeCategoryConfig,
} from "@/lib/home/config";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const cardId = String(form.get("cardId") || "").trim();
    const file = form.get("file");

    if (!cardId) {
      return Response.json(
        { ok: false, error: "معرّف البطاقة مطلوب." },
        { status: 400 },
      );
    }
    if (!(file instanceof File)) {
      return Response.json(
        { ok: false, error: "أرفقي ملف صورة." },
        { status: 400 },
      );
    }
    if (!ADMIN_IMAGE_MIME.has(file.type)) {
      return Response.json(
        { ok: false, error: "الصيغة المسموحة: JPG أو PNG أو WebP." },
        { status: 400 },
      );
    }
    if (file.size > MAX_ADMIN_IMAGE_BYTES) {
      return Response.json(
        { ok: false, error: MAX_ADMIN_IMAGE_ERROR },
        { status: 400 },
      );
    }

    const config = await getHomeCategoryConfig();
    const index = config.cards.findIndex((c) => c.id === cardId);
    if (index < 0) {
      return Response.json(
        { ok: false, error: "البطاقة غير موجودة." },
        { status: 404 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mime = file.type === "image/jpg" ? "image/jpeg" : file.type;
    const persisted = await persistAdminImage({
      buffer,
      mime,
      folder: "home-categories",
      basename: cardId,
    });

    const cards = [...config.cards];
    cards[index] = { ...cards[index]!, imageUrl: persisted.url };

    const saved = await saveHomeCategoryConfig({ ...config, cards });
    return Response.json({ ok: true, config: saved, imageUrl: persisted.url });
  } catch (error) {
    console.error("[admin/home-categories/image] POST", error);
    const detail =
      error instanceof Error ? error.message : "تعذّر رفع صورة الفئة.";
    return Response.json({ ok: false, error: detail }, { status: 500 });
  }
}
