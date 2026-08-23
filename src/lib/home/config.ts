import { prisma } from "@/lib/db";
import { DEFAULT_HOME_HERO } from "@/lib/home/default-config";
import type { HomeHeroConfig, HomeHeroSlide } from "@/lib/home/types";

const CONFIG_ID = "default";

function isObject(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

function sanitizeSlide(raw: unknown, fallback: HomeHeroSlide): HomeHeroSlide {
  if (!isObject(raw)) return fallback;
  return {
    id: typeof raw.id === "string" ? raw.id : fallback.id,
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
    imageUrlMobile:
      typeof raw.imageUrlMobile === "string"
        ? raw.imageUrlMobile
        : fallback.imageUrlMobile,
    objectPosition:
      typeof raw.objectPosition === "string"
        ? raw.objectPosition
        : fallback.objectPosition,
    textAlign:
      raw.textAlign === "start" ||
      raw.textAlign === "end" ||
      raw.textAlign === "center"
        ? raw.textAlign
        : fallback.textAlign,
    overlay:
      raw.overlay === "soft" ||
      raw.overlay === "medium" ||
      raw.overlay === "strong" ||
      raw.overlay === "none"
        ? raw.overlay
        : fallback.overlay,
  };
}

export function mergeHomeHeroConfig(stored: unknown): HomeHeroConfig {
  const base = structuredClone(DEFAULT_HOME_HERO);
  if (!isObject(stored)) return base;

  const slidesIn = Array.isArray(stored.slides) ? stored.slides : null;
  const slides =
    slidesIn && slidesIn.length
      ? slidesIn.map((s, i) =>
          sanitizeSlide(s, base.slides[i] ?? base.slides[0]!),
        )
      : base.slides;

  return {
    version: typeof stored.version === "number" ? stored.version : base.version,
    autoplayMs:
      typeof stored.autoplayMs === "number" && stored.autoplayMs >= 3000
        ? stored.autoplayMs
        : base.autoplayMs,
    slides,
  };
}

export async function getHomeHeroConfig(): Promise<HomeHeroConfig> {
  try {
    const row = await prisma.homeHeroConfig.findUnique({
      where: { id: CONFIG_ID },
    });
    if (!row) return structuredClone(DEFAULT_HOME_HERO);
    return mergeHomeHeroConfig(row.data);
  } catch {
    return structuredClone(DEFAULT_HOME_HERO);
  }
}

export async function saveHomeHeroConfig(
  data: HomeHeroConfig,
): Promise<HomeHeroConfig> {
  const merged = mergeHomeHeroConfig(data);
  await prisma.homeHeroConfig.upsert({
    where: { id: CONFIG_ID },
    create: { id: CONFIG_ID, data: merged },
    update: { data: merged },
  });
  return merged;
}

export function activeHeroSlides(config: HomeHeroConfig): HomeHeroSlide[] {
  const enabled = config.slides.filter((s) => s.enabled && s.imageUrl);
  return enabled.length ? enabled : config.slides.slice(0, 1);
}
