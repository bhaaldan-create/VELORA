import {
  MAX_ADMIN_IMAGE_BYTES,
  MAX_ADMIN_IMAGE_ERROR,
} from "@/lib/admin/image-limits";
import { homePromoMediaUrl } from "@/lib/admin/media-url";
import {
  isUploadBlob,
  persistAdminImage,
  resolveUploadMime,
} from "@/lib/admin/persist-image";
import {
  getHomePromoConfig,
  saveHomePromoConfig,
} from "@/lib/home/promo-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");

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

    const buffer = Buffer.from(await file.arrayBuffer());
    const persisted = await persistAdminImage({
      buffer,
      mime,
      folder: "home-promo",
      basename: "new-arrivals",
    });

    const existing = await getHomePromoConfig();
    await saveHomePromoConfig({ ...existing, imageUrl: persisted.url });

    const imageUrl = homePromoMediaUrl(Date.now());

    return Response.json({ ok: true, imageUrl });
  } catch (error) {
    console.error("[admin/home-promo/image] POST", error);
    const detail =
      error instanceof Error ? error.message : "تعذّر رفع صورة البانر.";
    return Response.json({ ok: false, error: detail }, { status: 500 });
  }
}
