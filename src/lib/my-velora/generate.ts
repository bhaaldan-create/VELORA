import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { getClubConfig } from "@/lib/club/config";
import type { Prisma } from "@/generated/prisma/client";
import type { StoredOrder } from "@/lib/order-types";
import { getVeloraCardConfig } from "@/lib/my-velora/config";
import { ensureMyVeloraSeed } from "@/lib/my-velora/seed";
import {
  buildCardBrands,
  buildCardProducts,
  detectTheme,
  themeLabels,
  type ProductRow,
} from "@/lib/my-velora/theme";
import { computeOrderPoints } from "@/lib/my-velora/points";
import type {
  VeloraCardPayload,
  VeloraCardStyleKey,
} from "@/lib/my-velora/types";

export function createReferralToken() {
  return randomBytes(18).toString("base64url");
}

export function buildReferralUrl(token: string, siteUrl?: string) {
  const base = (siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://velora.iq").replace(
    /\/$/,
    "",
  );
  return `${base}/my-velora/${token}`;
}

export async function fetchProductRows(ids: string[]): Promise<ProductRow[]> {
  if (!ids.length) return [];
  // Never SELECT imageUrl / brandLogoUrl — they are often multi-MB data: URIs
  // and will OOM the serverless function before render starts.
  const rows = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      name: true,
      nameAr: true,
      categorySlug: true,
      brandName: true,
    },
  });
  return rows.map((r) => ({
    ...r,
    brandLogoUrl: null,
    imageUrl: null,
  }));
}

export async function buildCardPayload(input: {
  entry: StoredOrder;
  customerId: string;
  referralToken: string;
  siteUrl?: string;
}): Promise<VeloraCardPayload> {
  const { entry, referralToken, siteUrl } = input;
  const [clubConfig, cardConfig] = await Promise.all([
    getClubConfig(),
    getVeloraCardConfig(),
  ]);

  const productIds = entry.order.items.map((i) => i.id);
  const rows = await fetchProductRows(productIds);
  const products = buildCardProducts(entry.order, rows);
  const brands = buildCardBrands(products);
  const theme = detectTheme(products, brands);
  const labels = themeLabels(theme);
  const points = computeOrderPoints(entry.order, clubConfig);
  const productCount = products.reduce((n, p) => n + p.quantity, 0);
  const referralUrl = buildReferralUrl(referralToken, siteUrl);

  return {
    orderId: entry.orderId,
    orderDate: entry.savedAt,
    subtitleEn: labels.subtitleEn,
    subtitleAr: labels.subtitleAr,
    products,
    brands,
    productCount,
    brandCount: brands.length,
    pointsEarned: points,
    pointsLabelEn: `I earned ${points} points in VELORA Beauty Club.`,
    pointsLabelAr: `لقد حصلتُ على ${points} نقطة في VELORA Beauty Club`,
    footerEn: "Another beauty moment with VELORA.",
    footerAr: "لحظة جمال أخرى مع VELORA.",
    referralUrl,
    showQrCode: cardConfig.showQrCode,
  };
}

export async function ensureVeloraCardForOrder(input: {
  entry: StoredOrder;
  customerId: string;
  styleKey?: VeloraCardStyleKey;
}): Promise<{ id: string; referralToken: string } | null> {
  const { entry, customerId, styleKey = "signature" } = input;

  const existing = await prisma.veloraCard.findFirst({
    where: {
      customerId,
      orderId: entry.orderId,
      cardType: "order",
    },
    select: { id: true, referralToken: true },
  });
  if (existing) return existing;

  await ensureMyVeloraSeed();

  const template = await prisma.veloraCardTemplate.findFirst({
    where: { isDefault: true, isActive: true },
    orderBy: { priority: "desc" },
  });

  const referralToken = createReferralToken();
  const payload = await buildCardPayload({
    entry,
    customerId,
    referralToken,
  });

  const card = await prisma.veloraCard.create({
    data: {
      customerId,
      orderId: entry.orderId,
      cardType: "order",
      templateId: template?.id ?? null,
      styleKey,
      themeKey: detectTheme(payload.products, payload.brands),
      payloadJson: payload as unknown as Prisma.InputJsonValue,
      referralToken,
      pointsEarned: payload.pointsEarned,
      productCount: payload.productCount,
      brandCount: payload.brandCount,
    },
    select: { id: true, referralToken: true },
  });

  await prisma.veloraCardEvent.create({
    data: {
      cardId: card.id,
      eventType: "generated",
      metaJson: { orderId: entry.orderId },
    },
  });

  await prisma.veloraReferralLink.create({
    data: {
      token: referralToken,
      customerId,
      cardId: card.id,
    },
  });

  return card;
}

export async function updateCardStyle(
  cardId: string,
  customerId: string,
  styleKey: VeloraCardStyleKey,
) {
  const card = await prisma.veloraCard.updateMany({
    where: { id: cardId, customerId },
    data: { styleKey },
  });
  if (card.count === 0) return null;

  await prisma.veloraCardEvent.create({
    data: {
      cardId,
      eventType: "style_change",
      metaJson: { styleKey },
    },
  });

  return styleKey;
}

export async function recordCardEvent(
  cardId: string,
  eventType: string,
  meta?: Record<string, unknown>,
) {
  await prisma.veloraCardEvent.create({
    data: {
      cardId,
      eventType,
      metaJson: (meta ?? {}) as Prisma.InputJsonValue,
    },
  });

  const data: Prisma.VeloraCardUpdateInput = {};
  if (eventType === "view") data.viewedAt = new Date();
  if (eventType === "save") data.savedAt = new Date();
  if (eventType === "share" || eventType === "instagram_share") {
    data.sharedAt = new Date();
    data.status = "shared";
  }

  if (Object.keys(data).length) {
    await prisma.veloraCard.update({ where: { id: cardId }, data });
  }
}

export function parseCardPayload(json: unknown): VeloraCardPayload | null {
  if (!json || typeof json !== "object") return null;
  return json as VeloraCardPayload;
}
