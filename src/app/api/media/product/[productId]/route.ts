import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import {
  MEDIA_CACHE_CONTROL,
  MEDIA_IMMUTABLE_CACHE_CONTROL,
} from "@/lib/media-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ productId: string }> },
) {
  const { productId } = await ctx.params;
  const id = decodeURIComponent(productId || "").trim();
  if (!id) {
    return new Response("Not found", { status: 404 });
  }

  const row = await prisma.product.findFirst({
    where: { id, isActive: true },
    select: { imageUrl: true },
  });
  const stored = row?.imageUrl?.trim();
  if (!stored) {
    return new Response("Not found", { status: 404 });
  }

  if (stored.startsWith("data:")) {
    const parsed = parseDataUrl(stored);
    if (!parsed) {
      return new Response("Bad image", { status: 500 });
    }
    return new Response(new Uint8Array(parsed.buffer), {
      status: 200,
      headers: {
        "Content-Type": parsed.mime,
        "Cache-Control": MEDIA_CACHE_CONTROL,
      },
    });
  }

  if (stored.startsWith("/uploads/") || stored.startsWith("/products/")) {
    try {
      const filePath = path.join(process.cwd(), "public", stored);
      const buffer = await readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const mime =
        ext === ".png"
          ? "image/png"
          : ext === ".webp"
            ? "image/webp"
            : ext === ".gif"
              ? "image/gif"
              : "image/jpeg";
      return new Response(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": mime,
          "Cache-Control": MEDIA_IMMUTABLE_CACHE_CONTROL,
        },
      });
    } catch {
      return new Response("Not found", { status: 404 });
    }
  }

  if (/^https?:\/\//i.test(stored)) {
    return Response.redirect(stored, 302);
  }

  return new Response("Not found", { status: 404 });
}
