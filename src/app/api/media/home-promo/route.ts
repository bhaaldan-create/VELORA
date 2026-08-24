import { readFile } from "node:fs/promises";
import path from "node:path";
import { getHomePromoConfig } from "@/lib/home/promo-config";
import {
  MEDIA_CACHE_CONTROL,
  MEDIA_IMMUTABLE_CACHE_CONTROL,
} from "@/lib/media-cache";
import { STOREFRONT_REVALIDATE_SECONDS } from "@/lib/cache-tags";

export const runtime = "nodejs";
export const revalidate = STOREFRONT_REVALIDATE_SECONDS;

function parseDataUrl(url: string): { mime: string; buffer: Buffer } | null {
  const match = url.match(/^data:([^;,]+)?(?:;base64)?,([\s\S]+)$/);
  if (!match?.[2]) return null;
  const mime = match[1] || "image/jpeg";
  try {
    return { mime, buffer: Buffer.from(match[2], "base64") };
  } catch {
    return null;
  }
}

export async function GET() {
  const config = await getHomePromoConfig();
  const stored = config.imageUrl;

  if (!stored) {
    return new Response("Not found", { status: 404 });
  }

  if (stored.startsWith("data:")) {
    const parsed = parseDataUrl(stored);
    if (!parsed) {
      return new Response("Bad image", { status: 500 });
    }
    return new Response(new Uint8Array(parsed.buffer), {
      headers: {
        "Content-Type": parsed.mime,
        "Cache-Control": MEDIA_CACHE_CONTROL,
      },
    });
  }

  if (stored.startsWith("/uploads/")) {
    try {
      const filePath = path.join(process.cwd(), "public", stored.replace(/^\//, ""));
      const buffer = await readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const mime =
        ext === ".png"
          ? "image/png"
          : ext === ".webp"
            ? "image/webp"
            : "image/jpeg";
      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type": mime,
          "Cache-Control": MEDIA_IMMUTABLE_CACHE_CONTROL,
        },
      });
    } catch {
      return new Response("Not found", { status: 404 });
    }
  }

  if (stored.startsWith("/")) {
    try {
      const filePath = path.join(process.cwd(), "public", stored.replace(/^\//, ""));
      const buffer = await readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const mime =
        ext === ".png"
          ? "image/png"
          : ext === ".webp"
            ? "image/webp"
            : "image/jpeg";
      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type": mime,
          "Cache-Control": MEDIA_IMMUTABLE_CACHE_CONTROL,
        },
      });
    } catch {
      return new Response("Not found", { status: 404 });
    }
  }

  if (stored.startsWith("http://") || stored.startsWith("https://")) {
    return Response.redirect(stored, 302);
  }

  return new Response("Not found", { status: 404 });
}
