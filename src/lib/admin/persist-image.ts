import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  ADMIN_IMAGE_MIME,
  MAX_ADMIN_IMAGE_BYTES,
} from "@/lib/admin/image-limits";

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

/** Infer mime from filename when browser sends empty Content-Type. */
export function resolveUploadMime(
  file: { type?: string; name?: string },
): string | null {
  const raw = (file.type || "").toLowerCase().trim();
  if (raw === "image/jpg") return "image/jpeg";
  if (ADMIN_IMAGE_MIME.has(raw)) return raw === "image/jpg" ? "image/jpeg" : raw;

  const name = (file.name || "").toLowerCase();
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  return null;
}

export function isUploadBlob(value: unknown): value is Blob {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Blob).arrayBuffer === "function" &&
    typeof (value as Blob).size === "number"
  );
}

async function compressImage(
  buffer: Buffer,
  inputMime: string,
): Promise<{ buffer: Buffer; mime: string; ext: string }> {
  try {
    const sharpMod = await import("sharp");
    const sharp = sharpMod.default;
    const meta = await sharp(buffer, { failOn: "none" }).rotate().metadata();
    const width = meta.width || 0;
    const height = meta.height || 0;
    const maxEdge = 2560;
    const needsResize = width > maxEdge || height > maxEdge;

    let pipeline = sharp(buffer, { failOn: "none" }).rotate();
    if (needsResize) {
      pipeline = pipeline.resize({
        width: width >= height ? maxEdge : undefined,
        height: height > width ? maxEdge : undefined,
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    const outBuffer = await pipeline
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();

    return { buffer: outBuffer, mime: "image/jpeg", ext: "jpg" };
  } catch (error) {
    console.warn("[persistAdminImage] sharp compress skipped:", error);
    if (buffer.length > 2 * 1024 * 1024) {
      throw new Error(
        "تعذّر ضغط الصورة. جرّبي JPG بحجم أقل أو أعيدي تشغيل السيرفر.",
      );
    }
    return {
      buffer,
      mime: inputMime,
      ext: extForMime(inputMime),
    };
  }
}

/**
 * Compresses and stores an admin image as a public file path when possible.
 * Falls back to a compressed data URL (e.g. Vercel read-only FS).
 */
export async function persistAdminImage(options: {
  buffer: Buffer;
  mime: string;
  folder: "home-hero" | "home-categories" | "products";
  basename: string;
}): Promise<PersistImageResult> {
  const inputMime =
    options.mime === "image/jpg" ? "image/jpeg" : options.mime || "image/jpeg";

  const compressed = await compressImage(options.buffer, inputMime);
  let outBuffer = compressed.buffer;
  let outMime = compressed.mime;
  let outExt = compressed.ext;

  // If still huge after compress attempt, force another JPEG pass at lower quality
  if (outBuffer.length > 2.5 * 1024 * 1024) {
    try {
      const sharpMod = await import("sharp");
      const sharp = sharpMod.default;
      outBuffer = await sharp(outBuffer, { failOn: "none" })
        .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 78, mozjpeg: true })
        .toBuffer();
      outMime = "image/jpeg";
      outExt = "jpg";
    } catch {
      /* keep previous */
    }
  }

  if (outBuffer.length > MAX_ADMIN_IMAGE_BYTES) {
    throw new Error(
      "الصورة كبيرة جداً بعد المعالجة. جرّبي صورة أصغر أو صيغة JPG.",
    );
  }

  const safeBase =
    options.basename
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "image";
  const filename = `${safeBase}-${Date.now()}.${outExt}`;

  // Prefer durable public file on writable hosts (local / VPS)
  if (!process.env.VERCEL) {
    try {
      const dir = path.join(process.cwd(), "public", "uploads", options.folder);
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, filename), outBuffer);
      return {
        url: `/uploads/${options.folder}/${filename}`,
        mime: outMime,
        bytes: outBuffer.length,
      };
    } catch (error) {
      console.warn("[persistAdminImage] file write failed:", error);
    }
  }

  // Vercel / read-only FS — store compressed data URL in DB
  const url = `data:${outMime};base64,${outBuffer.toString("base64")}`;
  return { url, mime: outMime, bytes: outBuffer.length };
}
