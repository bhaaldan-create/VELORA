import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import {
  MEDIA_CACHE_CONTROL,
  MEDIA_IMMUTABLE_CACHE_CONTROL,
  MEDIA_CDN_CACHE_CONTROL,
} from "@/lib/media-cache";

export const runtime = "nodejs";
/** Allow CDN/edge caching of resized product images (was force-dynamic → every card hit serverless+DB). */
export const revalidate = 604800;

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
  if (mime.includes("svg") || mime.includes("gif")) return { buffer, mime };
  try {
    const sharpMod = await import("sharp");
    const sharp = sharpMod.default;
    const image = sharp(buffer, { failOn: "none" }).rotate();
    const meta = await image.metadata();
    if (meta.width && meta.width <= width && mime === "image/webp") {
      const out = await image.toBuffer();
      return { buffer: out, mime };
    }
    const out = await sharp(buffer, { failOn: "none" })
      .rotate()
      .resize({
        width,
        withoutEnlargement: true,
        fit: "inside",
      })
      .webp({ quality: 72, effort: 3 })
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
      "CDN-Cache-Control": MEDIA_CDN_CACHE_CONTROL,
      "Vercel-CDN-Cache-Control": MEDIA_CDN_CACHE_CONTROL,
      Vary: "Accept",
    },
  });
}

async function serveHttp(
  stored: string,
  width: number | null,
): Promise<Response> {
  // Without a width hint, a short redirect is fine (PDP full / brand logos).
  if (!width) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: stored,
        "Cache-Control": MEDIA_CACHE_CONTROL,
        "CDN-Cache-Control": MEDIA_CDN_CACHE_CONTROL,
        "Vercel-CDN-Cache-Control": MEDIA_CDN_CACHE_CONTROL,
      },
    });
  }

  try {
    const remote = await fetch(stored, {
      signal: AbortSignal.timeout(12_000),
      next: { revalidate: 86400 },
    });
    if (!remote.ok) {
      return new Response("Upstream image failed", { status: 502 });
    }
    const mime = remote.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await remote.arrayBuffer());
    return respondImage(buffer, mime, width, MEDIA_CACHE_CONTROL);
  } catch (error) {
    console.warn("[media/product] remote fetch failed, redirecting", error);
    return Response.redirect(stored, 302);
  }
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
    return serveHttp(stored, width);
  }

  return new Response("Not found", { status: 404 });
}

/**
 * Product/brand media for the storefront.
 * `?w=` resizes when sharp is available (including remote Blob URLs).
 * Source blobs are NOT put in Next data cache (data-URLs can be multi-MB);
 * the resized response is cached at the CDN via Cache-Control headers.
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
        ? row?.brandLogoUrl?.trim() || null
        : row?.imageUrl?.trim() || null;

    if (!stored) {
      return new Response("Not found", { status: 404 });
    }

    return await serveStored(stored, width);
  } catch (error) {
    console.error("[media/product] GET failed", error);
    return new Response("Media unavailable", { status: 500 });
  }
}
