import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import {
  MEDIA_CACHE_CONTROL,
  MEDIA_IMMUTABLE_CACHE_CONTROL,
} from "@/lib/media-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_RESIZE_WIDTH = 1600;

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

function mimeFromExt(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  if (ext === ".avif") return "image/avif";
  return "image/jpeg";
}

function parseWidth(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.min(n, MAX_RESIZE_WIDTH);
}

/**
 * Optional card resize via dynamic sharp import.
 * Never import sharp at module top-level — that previously crashed this route
 * in production and returned HTTP 500 for all product images.
 */
async function maybeResize(
  buffer: Buffer,
  mime: string,
  width: number | null,
): Promise<{ buffer: Buffer; mime: string }> {
  if (!width || width <= 0) return { buffer, mime };
  try {
    const sharpMod = await import("sharp");
    const sharp = sharpMod.default;
    const out = await sharp(buffer)
      .rotate()
      .resize({
        width,
        withoutEnlargement: true,
        fit: "inside",
      })
      .webp({ quality: 78, effort: 4 })
      .toBuffer();
    return { buffer: out, mime: "image/webp" };
  } catch (error) {
    console.warn("[media/product] resize skipped, serving original", error);
    return { buffer, mime };
  }
}

async function respondImage(
  buffer: Buffer,
  mime: string,
  width: number | null,
  cacheControl: string,
): Promise<Response> {
  const resized = await maybeResize(buffer, mime, width);
  return new Response(new Uint8Array(resized.buffer), {
    status: 200,
    headers: {
      "Content-Type": resized.mime,
      "Cache-Control": cacheControl,
      Vary: "Accept",
    },
  });
}

async function serveStored(
  stored: string,
  width: number | null,
): Promise<Response> {
  if (stored.startsWith("data:")) {
    const parsed = parseDataUrl(stored);
    if (!parsed) {
      return new Response("Bad image", { status: 500 });
    }
    return respondImage(parsed.buffer, parsed.mime, width, MEDIA_CACHE_CONTROL);
  }

  if (
    stored.startsWith("/uploads/") ||
    stored.startsWith("/products/") ||
    stored.startsWith("/brands/") ||
    stored.startsWith("/brand/")
  ) {
    try {
      const filePath = path.join(process.cwd(), "public", stored);
      const buffer = await readFile(filePath);
      return respondImage(
        buffer,
        mimeFromExt(filePath),
        width,
        MEDIA_IMMUTABLE_CACHE_CONTROL,
      );
    } catch {
      return new Response("Not found", { status: 404 });
    }
  }

  if (/^https?:\/\//i.test(stored)) {
    return Response.redirect(stored, 302);
  }

  return new Response("Not found", { status: 404 });
}

/**
 * Product/brand media for the storefront.
 * `?w=` resizes when sharp is available; otherwise the original is served.
 */
export async function GET(
  req: Request,
  ctx: { params: Promise<{ productId: string }> },
) {
  try {
    const { productId } = await ctx.params;
    const id = decodeURIComponent(productId || "").trim();
    if (!id) {
      return new Response("Not found", { status: 404 });
    }

    const url = new URL(req.url);
    const kind =
      url.searchParams.get("kind") === "brandLogo" ? "brandLogo" : "product";
    const width =
      kind === "brandLogo" ? null : parseWidth(url.searchParams.get("w"));

    const row = await prisma.product.findFirst({
      where: { id },
      select: { imageUrl: true, brandLogoUrl: true },
    });

    const stored =
      kind === "brandLogo"
        ? row?.brandLogoUrl?.trim()
        : row?.imageUrl?.trim();

    if (!stored) {
      return new Response("Not found", { status: 404 });
    }

    return await serveStored(stored, width);
  } catch (error) {
    console.error("[media/product] GET failed", error);
    return new Response("Media unavailable", { status: 500 });
  }
}
