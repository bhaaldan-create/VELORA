import {
  ADMIN_IMAGE_MIME,
  MAX_ADMIN_IMAGE_BYTES,
  MAX_ADMIN_IMAGE_ERROR,
} from "@/lib/admin/image-limits";
import {
  getHomeHeroConfig,
  saveHomeHeroConfig,
} from "@/lib/home/config";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const slideId = String(form.get("slideId") || "").trim();
    const variant = String(form.get("variant") || "desktop").trim();
    const file = form.get("file");

    if (!slideId) {
      return Response.json(
        { ok: false, error: "معرّف الشريحة مطلوب." },
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

    const config = await getHomeHeroConfig();
    const index = config.slides.findIndex((s) => s.id === slideId);
    if (index < 0) {
      return Response.json(
        { ok: false, error: "الشريحة غير موجودة." },
        { status: 404 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mime = file.type === "image/jpg" ? "image/jpeg" : file.type;
    const imageUrl = `data:${mime};base64,${buffer.toString("base64")}`;

    const slides = [...config.slides];
    const slide = { ...slides[index]! };
    if (variant === "mobile") {
      slide.imageUrlMobile = imageUrl;
    } else {
      slide.imageUrl = imageUrl;
    }
    slides[index] = slide;

    const saved = await saveHomeHeroConfig({ ...config, slides });
    return Response.json({ ok: true, config: saved, imageUrl, variant });
  } catch (error) {
    console.error("[admin/home-hero/image] POST", error);
    return Response.json(
      { ok: false, error: "تعذّر رفع صورة الهيرو." },
      { status: 500 },
    );
  }
}
