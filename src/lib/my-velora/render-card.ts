import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";
import type { VeloraCardPayload } from "@/lib/my-velora/types";

export const CARD_W = 1080;
export const CARD_H = 1920;

/** Max decoded input image before we refuse / downscale (Vercel memory safety). */
const MAX_INPUT_BYTES = 2_500_000;

const ZONES = {
  subtitle: { cx: 540, y: 292 },
  products: { left: 110, top: 370, width: 860, height: 500 },
  points: { cx: 800, y: 1005 },
  productCount: { cx: 700, y: 1210 },
  brandCount: { cx: 905, y: 1210 },
  brands: { left: 640, top: 1365, width: 360, height: 130 },
  qr: { left: 910, top: 1585, size: 90 },
} as const;

function parseDataUrl(url: string): Buffer | null {
  const match = url.match(/^data:[^;,]+(?:;base64)?,([\s\S]+)$/);
  if (!match?.[1]) return null;
  try {
    const buf = Buffer.from(match[1], "base64");
    if (buf.length > MAX_INPUT_BYTES) {
      // Still return — sharp will downscale; avoid OOM on absurd payloads
      return buf.subarray(0, buf.length); // keep full but we'll resize immediately
    }
    return buf;
  } catch {
    return null;
  }
}

async function loadLocalOrRemote(src: string): Promise<Buffer | null> {
  const trimmed = src.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("data:")) {
    return parseDataUrl(trimmed);
  }

  if (trimmed.startsWith("/uploads/") || trimmed.startsWith("/products/") || trimmed.startsWith("/my-velora/")) {
    try {
      return await readFile(
        path.join(process.cwd(), "public", trimmed.replace(/^\//, "")),
      );
    } catch {
      return null;
    }
  }

  // Never fetch /api/* from the server to itself (cold-start / cookie loops).
  if (trimmed.startsWith("/api/")) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const res = await fetch(trimmed, { cache: "force-cache" });
      if (!res.ok) return null;
      const buf = Buffer.from(await res.arrayBuffer());
      return buf.length > 8_000_000 ? null : buf;
    } catch {
      return null;
    }
  }

  return null;
}

async function downscale(input: Buffer, maxEdge = 1200): Promise<Buffer> {
  try {
    const meta = await sharp(input, { failOn: "none" }).metadata();
    const w = meta.width || maxEdge;
    const h = meta.height || maxEdge;
    if (w <= maxEdge && h <= maxEdge && input.length < MAX_INPUT_BYTES) {
      return input;
    }
    return await sharp(input, { failOn: "none" })
      .rotate()
      .resize({
        width: maxEdge,
        height: maxEdge,
        fit: "inside",
        withoutEnlargement: true,
      })
      .png()
      .toBuffer();
  } catch {
    return input;
  }
}

async function loadMasterTemplate(): Promise<Buffer> {
  const file = path.join(
    process.cwd(),
    "public",
    "my-velora",
    "templates",
    "velora-signature-master.png",
  );
  const buf = await readFile(file);
  return sharp(buf, { failOn: "none" })
    .resize(CARD_W, CARD_H, { fit: "fill" })
    .png()
    .toBuffer();
}

async function fitContain(
  input: Buffer,
  maxW: number,
  maxH: number,
): Promise<{ buf: Buffer; w: number; h: number } | null> {
  try {
    const scaled = await downscale(input, Math.max(maxW, maxH) * 2);
    const meta = await sharp(scaled, { failOn: "none" }).metadata();
    const iw = meta.width || maxW;
    const ih = meta.height || maxH;
    const scale = Math.min(maxW / iw, maxH / ih, 1);
    const w = Math.max(1, Math.round(iw * scale));
    const h = Math.max(1, Math.round(ih * scale));
    const buf = await sharp(scaled, { failOn: "none" })
      .resize(w, h, { fit: "inside" })
      .png()
      .toBuffer();
    return { buf, w, h };
  } catch {
    return null;
  }
}

type Composite = {
  input: Buffer;
  left: number;
  top: number;
};

async function loadProductImage(
  productId: string,
  imageUrl: string | null,
): Promise<Buffer | null> {
  // Prefer DB bytes — never rely on self-HTTP to /api/media
  try {
    const row = await prisma.product.findUnique({
      where: { id: productId },
      select: { imageUrl: true },
    });
    if (row?.imageUrl) {
      const fromDb = await loadLocalOrRemote(row.imageUrl);
      if (fromDb) return downscale(fromDb, 1000);
    }
  } catch {
    /* ignore */
  }

  if (imageUrl && !imageUrl.startsWith("/api/")) {
    const fromUrl = await loadLocalOrRemote(imageUrl);
    if (fromUrl) return downscale(fromUrl, 1000);
  }
  return null;
}

async function loadBrandLogo(
  brandName: string,
  logoUrl: string | null,
  productIds: string[],
): Promise<Buffer | null> {
  if (logoUrl && !logoUrl.startsWith("/api/")) {
    const direct = await loadLocalOrRemote(logoUrl);
    if (direct) return downscale(direct, 400);
  }

  if (!productIds.length) return null;
  try {
    const rows = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { brandName: true, brandLogoUrl: true },
    });
    const match = rows.find(
      (r) =>
        (r.brandName || "").trim().toLowerCase() === brandName.trim().toLowerCase() &&
        r.brandLogoUrl,
    );
    if (match?.brandLogoUrl) {
      const buf = await loadLocalOrRemote(match.brandLogoUrl);
      if (buf) return downscale(buf, 400);
    }
    // Any logo from these products
    for (const r of rows) {
      if (!r.brandLogoUrl) continue;
      const buf = await loadLocalOrRemote(r.brandLogoUrl);
      if (buf) return downscale(buf, 400);
    }
  } catch {
    /* ignore */
  }
  return null;
}

async function composeProducts(
  products: VeloraCardPayload["products"],
): Promise<Composite[]> {
  const zone = ZONES.products;
  const list = products.slice(0, 6);
  if (!list.length) return [];

  const loaded: { buf: Buffer; w: number; h: number }[] = [];
  for (const p of list) {
    try {
      const raw = await loadProductImage(p.id, p.imageUrl);
      if (!raw) continue;
      const n = list.length;
      const cellW =
        n === 1 ? zone.width * 0.48 : n === 2 ? zone.width * 0.38 : zone.width * 0.28;
      const cellH =
        n === 1 ? zone.height * 0.78 : n <= 3 ? zone.height * 0.62 : zone.height * 0.4;
      const fitted = await fitContain(raw, Math.round(cellW), Math.round(cellH));
      if (fitted) loaded.push(fitted);
    } catch (err) {
      console.error("[render-card] product layer failed", p.id, err);
    }
  }

  if (!loaded.length) return [];

  const out: Composite[] = [];
  const n = loaded.length;

  if (n === 1) {
    const a = loaded[0]!;
    out.push({
      input: a.buf,
      left: Math.round(zone.left + (zone.width - a.w) / 2),
      top: Math.round(zone.top + (zone.height - a.h) / 2),
    });
    return out;
  }

  if (n === 2) {
    const gap = 40;
    const totalW = loaded[0]!.w + loaded[1]!.w + gap;
    let x = Math.round(zone.left + (zone.width - totalW) / 2);
    for (const a of loaded) {
      out.push({
        input: a.buf,
        left: x,
        top: Math.round(zone.top + (zone.height - a.h) / 2),
      });
      x += a.w + gap;
    }
    return out;
  }

  if (n === 3) {
    const [a, b, c] = loaded;
    out.push({
      input: a!.buf,
      left: Math.round(zone.left + zone.width * 0.08),
      top: Math.round(zone.top + zone.height * 0.12),
    });
    out.push({
      input: b!.buf,
      left: Math.round(zone.left + (zone.width - b!.w) / 2),
      top: Math.round(zone.top + zone.height * 0.18),
    });
    out.push({
      input: c!.buf,
      left: Math.round(zone.left + zone.width * 0.62),
      top: Math.round(zone.top + zone.height * 0.12),
    });
    return out;
  }

  const cols = n <= 4 ? 2 : 3;
  const cellW = Math.floor(zone.width / cols) - 16;
  const rows = Math.ceil(n / cols);
  const cellH = Math.floor(zone.height / rows) - 12;
  for (let i = 0; i < loaded.length; i++) {
    const item = loaded[i]!;
    const fitted = await fitContain(item.buf, cellW, cellH);
    if (!fitted) continue;
    const col = i % cols;
    const row = Math.floor(i / cols);
    out.push({
      input: fitted.buf,
      left: Math.round(
        zone.left + col * (zone.width / cols) + (zone.width / cols - fitted.w) / 2,
      ),
      top: Math.round(
        zone.top + row * (zone.height / rows) + (zone.height / rows - fitted.h) / 2,
      ),
    });
  }
  return out;
}

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function brandTextBadge(name: string): Buffer {
  const label = escapeXml((name || "VELORA").slice(0, 16).toUpperCase());
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="130" height="40">
      <rect width="130" height="40" rx="10" fill="rgba(255,255,255,0.85)"/>
      <text x="65" y="26" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
        font-size="12" font-weight="700" fill="#4A384F" letter-spacing="1">${label}</text>
    </svg>`,
  );
}

async function composeBrands(
  brands: VeloraCardPayload["brands"],
  productIds: string[],
): Promise<Composite[]> {
  const zone = ZONES.brands;
  const list = brands.slice(0, 6);
  if (!list.length) return [];

  const logos: { buf: Buffer; w: number; h: number }[] = [];
  for (const b of list) {
    try {
      const raw = await loadBrandLogo(b.name, b.logoUrl, productIds);
      if (raw) {
        const fitted = await fitContain(raw, 100, 44);
        if (fitted) {
          const plateW = fitted.w + 20;
          const plateH = fitted.h + 14;
          const plate = await sharp({
            create: {
              width: plateW,
              height: plateH,
              channels: 4,
              background: { r: 255, g: 255, b: 255, alpha: 0.82 },
            },
          })
            .png()
            .toBuffer();
          const stacked = await sharp(plate)
            .composite([
              {
                input: fitted.buf,
                left: Math.round((plateW - fitted.w) / 2),
                top: Math.round((plateH - fitted.h) / 2),
              },
            ])
            .png()
            .toBuffer();
          logos.push({ buf: stacked, w: plateW, h: plateH });
          continue;
        }
      }
    } catch (err) {
      console.error("[render-card] brand layer failed", b.name, err);
    }
    logos.push({ buf: brandTextBadge(b.name), w: 130, h: 40 });
  }

  const gap = 12;
  const out: Composite[] = [];
  const totalW =
    logos.reduce((s, l) => s + l.w, 0) + gap * Math.max(0, logos.length - 1);

  if (totalW <= zone.width) {
    let x = Math.round(zone.left + (zone.width - totalW) / 2);
    const y = Math.round(zone.top + (zone.height - 48) / 2);
    for (const l of logos) {
      out.push({ input: l.buf, left: x, top: y });
      x += l.w + gap;
    }
    return out;
  }

  const mid = Math.ceil(logos.length / 2);
  const rows = [logos.slice(0, mid), logos.slice(mid)];
  rows.forEach((row, ri) => {
    const rowW =
      row.reduce((s, l) => s + l.w, 0) + gap * Math.max(0, row.length - 1);
    let x = Math.round(zone.left + (zone.width - rowW) / 2);
    const y = Math.round(zone.top + 16 + ri * 58);
    for (const l of row) {
      out.push({ input: l.buf, left: x, top: y });
      x += l.w + gap;
    }
  });
  return out;
}

function buildTextOverlay(payload: VeloraCardPayload) {
  const subtitleSafe = escapeXml(
    (payload.subtitleEn || "MY BEAUTY MOMENT").toUpperCase(),
  );
  const points = String(payload.pointsEarned);
  const products = String(payload.productCount);
  const brands = String(payload.brandCount);

  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${CARD_H}">
      <style>
        .sub { font-family: Arial, Helvetica, sans-serif; font-size: 20px; font-weight: 600; fill: #5E4A66; letter-spacing: 5px; }
        .pts { font-family: Georgia, 'Times New Roman', serif; font-size: 82px; font-weight: 400; fill: #3D2640; }
        .num { font-family: Arial, Helvetica, sans-serif; font-size: 32px; font-weight: 700; fill: #3D2640; }
      </style>
      <text x="${ZONES.subtitle.cx}" y="${ZONES.subtitle.y}" text-anchor="middle" class="sub">✦ ${subtitleSafe} ✦</text>
      <text x="${ZONES.points.cx}" y="${ZONES.points.y}" text-anchor="middle" class="pts">+${escapeXml(points)}</text>
      <text x="${ZONES.productCount.cx}" y="${ZONES.productCount.y}" text-anchor="middle" class="num">${escapeXml(products)}</text>
      <text x="${ZONES.brandCount.cx}" y="${ZONES.brandCount.y}" text-anchor="middle" class="num">${escapeXml(brands)}</text>
    </svg>`,
  );
}

/**
 * Server-side Story card renderer.
 * MASTER TEMPLATE + ORDER PAYLOAD → 1080×1920 PNG.
 */
export async function renderMyVeloraCardPng(input: {
  payload: VeloraCardPayload;
  locale?: "ar" | "en";
}): Promise<Buffer> {
  const { payload } = input;
  const master = await loadMasterTemplate();
  const composites: Composite[] = [];
  const productIds = payload.products.map((p) => p.id);

  try {
    composites.push(...(await composeProducts(payload.products)));
  } catch (err) {
    console.error("[render-card] products failed", err);
  }

  try {
    composites.push(...(await composeBrands(payload.brands, productIds)));
  } catch (err) {
    console.error("[render-card] brands failed", err);
  }

  if (payload.showQrCode && payload.referralUrl) {
    try {
      const qrPng = await QRCode.toBuffer(payload.referralUrl, {
        type: "png",
        width: ZONES.qr.size * 2,
        margin: 1,
        color: { dark: "#3D2640", light: "#FFFFFF" },
      });
      const qrSized = await sharp(qrPng)
        .resize(ZONES.qr.size, ZONES.qr.size)
        .png()
        .toBuffer();
      composites.push({
        input: qrSized,
        left: ZONES.qr.left,
        top: ZONES.qr.top,
      });
    } catch (err) {
      console.error("[render-card] qr failed", err);
    }
  }

  composites.push({
    input: buildTextOverlay(payload),
    left: 0,
    top: 0,
  });

  return sharp(master, { failOn: "none" })
    .composite(composites)
    .png({ compressionLevel: 8 })
    .toBuffer();
}
