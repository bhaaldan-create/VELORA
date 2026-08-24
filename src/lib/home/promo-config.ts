import { unstable_cache } from "next/cache";
import {
  homePromoMediaUrl,
  mediaCacheBustFromStored,
  resolveClientImageUrl,
  shouldRetainStoredImageOnSave,
} from "@/lib/admin/media-url";
import { CACHE_TAGS, STOREFRONT_REVALIDATE_SECONDS } from "@/lib/cache-tags";
import { prisma } from "@/lib/db";
import { revalidateHomepage } from "@/lib/revalidate-storefront";
import { DEFAULT_HOME_PROMO } from "@/lib/home/default-config";
import type { HomePromoConfig } from "@/lib/home/types";

const CONFIG_ID = "default";

function isObject(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

function sanitizePromo(raw: unknown, fallback: HomePromoConfig): HomePromoConfig {
  if (!isObject(raw)) return fallback;
  return {
    version: typeof raw.version === "number" ? raw.version : fallback.version,
    enabled: typeof raw.enabled === "boolean" ? raw.enabled : fallback.enabled,
    headlineAr:
      typeof raw.headlineAr === "string" ? raw.headlineAr : fallback.headlineAr,
    headlineEn:
      typeof raw.headlineEn === "string" ? raw.headlineEn : fallback.headlineEn,
    bodyAr: typeof raw.bodyAr === "string" ? raw.bodyAr : fallback.bodyAr,
    bodyEn: typeof raw.bodyEn === "string" ? raw.bodyEn : fallback.bodyEn,
    ctaAr: typeof raw.ctaAr === "string" ? raw.ctaAr : fallback.ctaAr,
    ctaEn: typeof raw.ctaEn === "string" ? raw.ctaEn : fallback.ctaEn,
    href: typeof raw.href === "string" ? raw.href : fallback.href,
    imageUrl:
      typeof raw.imageUrl === "string" && raw.imageUrl
        ? raw.imageUrl
        : fallback.imageUrl,
    objectPosition:
      typeof raw.objectPosition === "string"
        ? raw.objectPosition
        : fallback.objectPosition,
  };
}

export function mergeHomePromoConfig(stored: unknown): HomePromoConfig {
  const base = structuredClone(DEFAULT_HOME_PROMO);
  if (!isObject(stored)) return base;
  return sanitizePromo(stored, base);
}

async function fetchHomePromoConfig(): Promise<HomePromoConfig> {
  try {
    const row = await prisma.homePromoConfig.findUnique({
      where: { id: CONFIG_ID },
    });
    if (!row) return structuredClone(DEFAULT_HOME_PROMO);
    return mergeHomePromoConfig(row.data);
  } catch {
    return structuredClone(DEFAULT_HOME_PROMO);
  }
}

export async function getHomePromoConfig(): Promise<HomePromoConfig> {
  return unstable_cache(fetchHomePromoConfig, ["home-promo-config"], {
    tags: [CACHE_TAGS.home],
    revalidate: STOREFRONT_REVALIDATE_SECONDS,
  })();
}

export async function saveHomePromoConfig(
  data: HomePromoConfig,
): Promise<HomePromoConfig> {
  const existing = await fetchHomePromoConfig();
  const promo = sanitizePromo(data, existing);
  const incomingImage =
    typeof data.imageUrl === "string" ? data.imageUrl.trim() : "";
  const keepImage = shouldRetainStoredImageOnSave(incomingImage);

  const merged: HomePromoConfig = {
    ...promo,
    imageUrl: keepImage ? existing.imageUrl : incomingImage,
  };

  await prisma.homePromoConfig.upsert({
    where: { id: CONFIG_ID },
    create: { id: CONFIG_ID, data: merged },
    update: { data: merged },
  });
  revalidateHomepage();
  return merged;
}

export function promoConfigForClient(config: HomePromoConfig): HomePromoConfig {
  return {
    ...config,
    imageUrl: resolveClientImageUrl(
      config.imageUrl,
      homePromoMediaUrl(mediaCacheBustFromStored(config.imageUrl)),
    ),
  };
}
