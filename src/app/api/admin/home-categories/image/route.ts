import {
  getHomeCategoryConfig,
  saveHomeCategoryConfig,
} from "@/lib/home/config";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/jpg"]);
const MAX_BYTES = 1.5 * 1024 * 1024;

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
    if (!ALLOWED.has(file.type)) {
      return Response.json(
        { ok: false, error: "الصيغة المسموحة: JPG أو PNG أو WebP." },
        { status: 400 },
      );
    }
    if (file.size > MAX_BYTES) {
      return Response.json(
        { ok: false, error: "حجم الصورة يجب ألا يتجاوز 1.5 ميجابايت." },
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
    const imageUrl = `data:${mime};base64,${buffer.toString("base64")}`;

    const cards = [...config.cards];
    cards[index] = { ...cards[index]!, imageUrl };

    const saved = await saveHomeCategoryConfig({ ...config, cards });
    return Response.json({ ok: true, config: saved, imageUrl });
  } catch (error) {
    console.error("[admin/home-categories/image] POST", error);
    return Response.json(
      { ok: false, error: "تعذّر رفع صورة الفئة." },
      { status: 500 },
    );
  }
}
