import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  ADMIN_IMAGE_MIME,
  MAX_ADMIN_IMAGE_BYTES,
} from "@/lib/admin/image-limits";

export type PersistImageResult = {
  url: string;
  mime: string;
  bytes: number;
  storage: "blob" | "file" | "data-url";
};

function extForMime(mime: string): string {
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("avif")) return "avif";
  return "jpg";
}

/** Detect image MIME from magic bytes (server-side; don't trust client). */
export function sniffImageMime(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  // PNG
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  // WEBP (RIFF....WEBP)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }
  // AVIF / HEIF (ftyp....avif/avis/heic)
  if (
    buffer[4] === 0x66 &&
    buffer[5] === 0x74 &&
    buffer[6] === 0x79 &&
    buffer[7] === 0x70
  ) {
    const brand = buffer.subarray(8, 12).toString("ascii");
    if (brand === "avif" || brand === "avis" || brand === "mif1") {
      return "image/avif";
    }
  }
  // GIF — not accepted for admin catalog uploads
  return null;
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
  if (name.endsWith(".avif")) return "image/avif";
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

async function tryPersistToVercelBlob(options: {
  buffer: Buffer;
  mime: string;
  folder: string;
  filename: string;
}): Promise<PersistImageResult | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) return null;

  try {
    const { put } = await import("@vercel/blob");
    const pathname = `velora/${options.folder}/${options.filename}`;
    const blob = await put(pathname, options.buffer, {
      access: "public",
      contentType: options.mime,
      token,
      addRandomSuffix: false,
    });
    return {
      url: blob.url,
      mime: options.mime,
      bytes: options.buffer.length,
      storage: "blob",
    };
  } catch (error) {
    console.warn("[persistAdminImage] Vercel Blob upload failed:", error);
    return null;
  }
}

/**
 * Compresses and stores an admin image.
 * Priority: Vercel Blob (durable) → local public/uploads → data URL (last resort).
 */
export async function persistAdminImage(options: {
  buffer: Buffer;
  mime: string;
  folder: "home-hero" | "home-categories" | "home-promo" | "products" | "brands";
  basename: string;
}): Promise<PersistImageResult> {
  const sniffed = sniffImageMime(options.buffer);
  if (!sniffed) {
    throw new Error(
      "الملف ليس صورة صالحة. الصيغ المسموحة: JPG أو PNG أو WebP أو AVIF.",
    );
  }

  const inputMime =
    sniffed ||
    (options.mime === "image/jpg" ? "image/jpeg" : options.mime || "image/jpeg");

  const compressed = await compressImage(options.buffer, inputMime);
  let outBuffer = compressed.buffer;
  let outMime = compressed.mime;
  let outExt = compressed.ext;

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
      .slice(0, 40) || "image";
  // Immutable unique name — avoids cache stale + Arabic/special filename issues
  const filename = `${safeBase}-${randomUUID().replace(/-/g, "").slice(0, 16)}.${outExt}`;

  // 1) Vercel Blob — durable public URL (preferred on production)
  const blobResult = await tryPersistToVercelBlob({
    buffer: outBuffer,
    mime: outMime,
    folder: options.folder,
    filename,
  });
  if (blobResult) return blobResult;

  // 2) Local / VPS writable FS
  if (!process.env.VERCEL) {
    try {
      const dir = path.join(process.cwd(), "public", "uploads", options.folder);
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, filename), outBuffer);
      return {
        url: `/uploads/${options.folder}/${filename}`,
        mime: outMime,
        bytes: outBuffer.length,
        storage: "file",
      };
    } catch (error) {
      console.warn("[persistAdminImage] file write failed:", error);
    }
  }

  // 3) Last resort — data URL in DB (Vercel without Blob token)
  console.warn(
    "[persistAdminImage] Falling back to data URL. Set BLOB_READ_WRITE_TOKEN for durable storage.",
  );
  const url = `data:${outMime};base64,${outBuffer.toString("base64")}`;
  return { url, mime: outMime, bytes: outBuffer.length, storage: "data-url" };
}
