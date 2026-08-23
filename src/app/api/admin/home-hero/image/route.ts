import {
  MAX_ADMIN_IMAGE_BYTES,
  MAX_ADMIN_IMAGE_ERROR,
} from "@/lib/admin/image-limits";
import { heroSlideMediaUrl } from "@/lib/admin/media-url";
import {
  isUploadBlob,
  persistAdminImage,
  resolveUploadMime,
} from "@/lib/admin/persist-image";
import {
  getHomeHeroConfig,
  saveHomeHeroConfig,
} from "@/lib/home/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
    if (!isUploadBlob(file)) {
      return Response.json(
        { ok: false, error: "أرفقي ملف صورة." },
        { status: 400 },
      );
    }

    const mime = resolveUploadMime({
      type: file.type,
      name: "name" in file ? String((file as File).name || "") : "",
    });
    if (!mime) {
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
    const persisted = await persistAdminImage({
      buffer,
      mime,
      folder: "home-hero",
      basename: `${slideId}-${variant === "mobile" ? "mobile" : "desktop"}`,
    });

    const slides = [...config.slides];
    const slide = { ...slides[index]! };
    if (variant === "mobile") {
      slide.imageUrlMobile = persisted.url;
    } else {
      slide.imageUrl = persisted.url;
    }
    slides[index] = slide;

    await saveHomeHeroConfig({ ...config, slides });

    const clientVariant = variant === "mobile" ? "mobile" : "desktop";
    const imageUrl =
      persisted.url.startsWith("data:")
        ? heroSlideMediaUrl(slideId, clientVariant, Date.now())
        : persisted.url;

    return Response.json({
      ok: true,
      slideId,
      variant,
      imageUrl,
    });
  } catch (error) {
    console.error("[admin/home-hero/image] POST", error);
    const detail =
      error instanceof Error ? error.message : "تعذّر رفع صورة الهيرو.";
    return Response.json({ ok: false, error: detail }, { status: 500 });
  }
}
