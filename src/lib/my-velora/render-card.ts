import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";
import type { VeloraCardPayload } from "@/lib/my-velora/types";

export const CARD_W = 1080;
export const CARD_H = 1920;

/** Fixed zones matching the official VELORA master template (1080×1920). */
const ZONES = {
  /** Covers the template subtitle line under MY VELORA */
  subtitle: { cx: 540, y: 292 },
  /** Large frosted product showcase */
  products: { left: 110, top: 370, width: 860, height: 500 },
  /** Number inside Beauty Club Points card (above the label) */
  points: { cx: 800, y: 1005 },
  /** Left / right numbers inside PRODUCTS | BRANDS card */
  productCount: { cx: 700, y: 1210 },
  brandCount: { cx: 905, y: 1210 },
  /** Inside the dashed "Brands in my order" box */
  brands: { left: 640, top: 1365, width: 360, height: 130 },
  /** Near Discover VELORA */
  qr: { left: 910, top: 1585, size: 90 },
} as const;

function parseDataUrl(url: string): Buffer | null {
  const match = url.match(/^data:[^;,]+(?:;base64)?,([\s\S]+)$/);
  if (!match?.[1]) return null;
  try {
    return Buffer.from(match[1], "base64");
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

  if (trimmed.startsWith("/")) {
    try {
      return await readFile(
        path.join(process.cwd(), "public", trimmed.replace(/^\//, "")),
      );
    } catch {
      /* fall through to fetch */
    }
  }

  try {
    const absolute = trimmed.startsWith("http")
      ? trimmed
      : new URL(
          trimmed,
          process.env.NEXT_PUBLIC_SITE_URL ||
            (process.env.VERCEL_URL
              ? `https://${process.env.VERCEL_URL}`
              : "http://localhost:3000"),
        ).toString();
    const res = await fetch(absolute, { cache: "force-cache" });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
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
  return sharp(buf)
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
    const meta = await sharp(input).metadata();
    const iw = meta.width || maxW;
    const ih = meta.height || maxH;
    const scale = Math.min(maxW / iw, maxH / ih, 1);
    const w = Math.max(1, Math.round(iw * scale));
    const h = Math.max(1, Math.round(ih * scale));
    const buf = await sharp(input)
      .resize(w, h, { fit: "inside", withoutEnlargement: false })
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
  if (imageUrl) {
    const fromUrl = await loadLocalOrRemote(imageUrl);
    if (fromUrl) return fromUrl;
  }
  try {
    const row = await prisma.product.findUnique({
      where: { id: productId },
      select: { imageUrl: true },
    });
    if (row?.imageUrl) {
      return loadLocalOrRemote(row.imageUrl);
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
    const raw = await loadProductImage(p.id, p.imageUrl);
    if (!raw) continue;
    const n = list.length;
    const cellW =
      n === 1 ? zone.width * 0.48 : n === 2 ? zone.width * 0.38 : zone.width * 0.28;
    const cellH =
      n === 1 ? zone.height * 0.78 : n <= 3 ? zone.height * 0.62 : zone.height * 0.4;
    const fitted = await fitContain(raw, Math.round(cellW), Math.round(cellH));
    if (fitted) loaded.push(fitted);
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

  // 4–6 grid
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

async function composeBrands(
  brands: VeloraCardPayload["brands"],
): Promise<Composite[]> {
  const zone = ZONES.brands;
  const list = brands.slice(0, 6);
  if (!list.length) return [];

  const logos: { buf: Buffer; w: number; h: number; name: string }[] = [];
  for (const b of list) {
    let placed = false;
    if (b.logoUrl) {
      const raw = await loadLocalOrRemote(b.logoUrl);
      if (raw) {
        const fitted = await fitContain(raw, 100, 44);
        if (fitted) {
          // White plate so logos stay legible inside the dashed brands box
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
          logos.push({ buf: stacked, w: plateW, h: plateH, name: b.name });
          placed = true;
        }
      }
    }
    if (!placed) {
      const label = escapeXml((b.name || "VELORA").slice(0, 16).toUpperCase());
      const svg = Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="130" height="40">
          <rect width="130" height="40" rx="10" fill="rgba(255,255,255,0.85)"/>
          <text x="65" y="26" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
            font-size="12" font-weight="700" fill="#4A384F" letter-spacing="1">${label}</text>
        </svg>`,
      );
      logos.push({ buf: svg, w: 130, h: 40, name: b.name });
    }
  }

  const gap = 12;
  const totalW = logos.reduce((s, l) => s + l.w, 0) + gap * Math.max(0, logos.length - 1);
  // Wrap into 2 rows if needed
  const out: Composite[] = [];
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
    const rowW = row.reduce((s, l) => s + l.w, 0) + gap * Math.max(0, row.length - 1);
    let x = Math.round(zone.left + (zone.width - rowW) / 2);
    const y = Math.round(zone.top + 20 + ri * 70);
    for (const l of row) {
      out.push({ input: l.buf, left: x, top: y });
      x += l.w + gap;
    }
  });
  return out;
}

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildTextOverlay(payload: VeloraCardPayload, locale: "ar" | "en") {
  const subtitle =
    locale === "ar" ? payload.subtitleAr : payload.subtitleEn;
  // Prefer English for Story to match master template typography.
  const subtitleSafe = escapeXml(
    (payload.subtitleEn || subtitle || "MY BEAUTY MOMENT").toUpperCase(),
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
 * MASTER TEMPLATE (visual) + ORDER PAYLOAD (data) → 1080×1920 PNG.
 */
export async function renderMyVeloraCardPng(input: {
  payload: VeloraCardPayload;
  locale?: "ar" | "en";
}): Promise<Buffer> {
  const { payload, locale = "en" } = input;
  const master = await loadMasterTemplate();

  const composites: Composite[] = [];

  const [productLayers, brandLayers] = await Promise.all([
    composeProducts(payload.products),
    composeBrands(payload.brands),
  ]);
  composites.push(...productLayers, ...brandLayers);

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
    } catch {
      /* optional */
    }
  }

  composites.push({
    input: buildTextOverlay(payload, locale),
    left: 0,
    top: 0,
  });

  return sharp(master)
    .composite(composites)
    .png({ quality: 100, compressionLevel: 8 })
    .toBuffer();
}
