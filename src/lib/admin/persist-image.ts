import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export type PersistImageResult = {
  url: string;
  mime: string;
  bytes: number;
};

function extForMime(mime: string): string {
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  return "jpg";
}

/**
 * Compresses and stores an admin image.
 * Prefers a public file path; falls back to a compressed data URL (Vercel / read-only FS).
 */
export async function persistAdminImage(options: {
  buffer: Buffer;
  mime: string;
  folder: "home-hero" | "home-categories" | "products";
  basename: string;
}): Promise<PersistImageResult> {
  const inputMime =
    options.mime === "image/jpg" ? "image/jpeg" : options.mime || "image/jpeg";

  let outBuffer = options.buffer;
  let outMime = inputMime;
  let outExt = extForMime(inputMime);

  try {
    const sharpMod = await import("sharp");
    const sharp = sharpMod.default;
    const pipeline = sharp(options.buffer, { failOn: "none" }).rotate();
    const meta = await pipeline.metadata();
    const width = meta.width || 0;
    const height = meta.height || 0;
    const maxEdge = 2560;
    const needsResize = width > maxEdge || height > maxEdge;

    // Prefer JPEG for photos — smaller than PNG while staying sharp enough for hero use
    outBuffer = await pipeline
      .resize(
        needsResize
          ? {
              width: width >= height ? maxEdge : undefined,
              height: height > width ? maxEdge : undefined,
              fit: "inside",
              withoutEnlargement: true,
            }
          : undefined,
      )
      .jpeg({ quality: 88, mozjpeg: true })
      .toBuffer();
    outMime = "image/jpeg";
    outExt = "jpg";
  } catch {
    // sharp unavailable — keep original bytes
  }

  const safeBase = options.basename
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  const filename = `${safeBase}-${Date.now()}.${outExt}`;

  // On Vercel the filesystem is ephemeral — store compressed data URL instead
  if (process.env.VERCEL) {
    const url = `data:${outMime};base64,${outBuffer.toString("base64")}`;
    return { url, mime: outMime, bytes: outBuffer.length };
  }

  try {
    const dir = path.join(process.cwd(), "public", "uploads", options.folder);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), outBuffer);
    return {
      url: `/uploads/${options.folder}/${filename}`,
      mime: outMime,
      bytes: outBuffer.length,
    };
  } catch {
    const url = `data:${outMime};base64,${outBuffer.toString("base64")}`;
    return { url, mime: outMime, bytes: outBuffer.length };
  }
}

/** Strip huge data-URL images from a payload before JSON save (images already persisted on upload). */
export function stripDataUrlImages<T extends { imageUrl?: string; imageUrlMobile?: string }>(
  item: T,
): T {
  return {
    ...item,
    imageUrl: item.imageUrl?.startsWith("data:") ? "" : item.imageUrl,
    imageUrlMobile: item.imageUrlMobile?.startsWith("data:")
      ? ""
      : item.imageUrlMobile,
  };
}
