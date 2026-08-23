import { readFile } from "node:fs/promises";
import path from "node:path";
import { getHomeCategoryConfig } from "@/lib/home/config";

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

export async function GET(req: Request) {
  const url = new URL(req.url);
  const cardId = url.searchParams.get("cardId")?.trim();

  if (!cardId) {
    return new Response("Not found", { status: 404 });
  }

  const config = await getHomeCategoryConfig();
  const card = config.cards.find((c) => c.id === cardId);
  if (!card?.imageUrl) {
    return new Response("Not found", { status: 404 });
  }

  const stored = card.imageUrl;

  if (stored.startsWith("data:")) {
    const parsed = parseDataUrl(stored);
    if (!parsed) {
      return new Response("Bad image", { status: 500 });
    }
    return new Response(new Uint8Array(parsed.buffer), {
      headers: {
        "Content-Type": parsed.mime,
        "Cache-Control": "public, max-age=86400",
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
          "Cache-Control": "public, max-age=86400, immutable",
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
