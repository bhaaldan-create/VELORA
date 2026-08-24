import { revalidatePath } from "next/cache";
import {
  categoryCardMediaUrl,
  heroSlideMediaUrl,
  mediaCacheBustFromStored,
  resolveClientImageUrl,
  shouldRetainStoredImageOnSave,
} from "@/lib/admin/media-url";
import { prisma } from "@/lib/db";
import {
  DEFAULT_HOME_CATEGORIES,
  DEFAULT_HOME_HERO,
} from "@/lib/home/default-config";
import type {
  HomeCategoryCard,
  HomeCategoryConfig,
  HomeHeroConfig,
  HomeHeroSlide,
} from "@/lib/home/types";

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
  const existing = await getHomeHeroConfig();
  const base = structuredClone(DEFAULT_HOME_HERO);

  const slidesIn = Array.isArray(data.slides) ? data.slides : existing.slides;
  const slides = slidesIn.map((raw, i) => {
    const fallback =
      existing.slides.find((s) => s.id === raw.id) ??
      existing.slides[i] ??
      base.slides[i] ??
      base.slides[0]!;
    const slide = sanitizeSlide(raw, fallback);
    const incomingImage =
      typeof raw.imageUrl === "string" ? raw.imageUrl.trim() : "";
    const incomingMobile =
      typeof raw.imageUrlMobile === "string" ? raw.imageUrlMobile.trim() : "";
    const keepDesktop = shouldRetainStoredImageOnSave(incomingImage);
    const keepMobile = shouldRetainStoredImageOnSave(incomingMobile);

    return {
      ...slide,
      // Empty / ephemeral client URL → keep whatever is already saved in DB
      imageUrl: keepDesktop ? fallback.imageUrl : incomingImage,
      imageUrlMobile: keepMobile ? fallback.imageUrlMobile : incomingMobile,
    };
  });

  const merged: HomeHeroConfig = {
    version:
      typeof data.version === "number" ? data.version : existing.version,
    autoplayMs:
      typeof data.autoplayMs === "number" && data.autoplayMs >= 3000
        ? data.autoplayMs
        : existing.autoplayMs,
    slides,
  };

  await prisma.homeHeroConfig.upsert({
    where: { id: CONFIG_ID },
    create: { id: CONFIG_ID, data: merged },
    update: { data: merged },
  });
  revalidatePath("/");
  return merged;
}

export function activeHeroSlides(config: HomeHeroConfig): HomeHeroSlide[] {
  const enabled = config.slides.filter((s) => s.enabled && s.imageUrl);
  return enabled.length ? enabled : config.slides.slice(0, 1);
}

/** يحوّل data URLs إلى روابط /api/media خفيفة للعرض في الواجهة */
export function heroConfigForClient(config: HomeHeroConfig): HomeHeroConfig {
  return {
    ...config,
    slides: config.slides.map((slide) => ({
      ...slide,
      imageUrl: resolveClientImageUrl(
        slide.imageUrl,
        heroSlideMediaUrl(
          slide.id,
          "desktop",
          mediaCacheBustFromStored(slide.imageUrl),
        ),
      ),
      imageUrlMobile: slide.imageUrlMobile
        ? resolveClientImageUrl(
            slide.imageUrlMobile,
            heroSlideMediaUrl(
              slide.id,
              "mobile",
              mediaCacheBustFromStored(slide.imageUrlMobile),
            ),
          )
        : slide.imageUrlMobile,
    })),
  };
}

export function categoryConfigForClient(
  config: HomeCategoryConfig,
): HomeCategoryConfig {
  return {
    ...config,
    cards: config.cards.map((card) => ({
      ...card,
      imageUrl: resolveClientImageUrl(
        card.imageUrl,
        categoryCardMediaUrl(
          card.id,
          mediaCacheBustFromStored(card.imageUrl),
        ),
      ),
    })),
  };
}

function sanitizeCategoryCard(
  raw: unknown,
  fallback: HomeCategoryCard,
): HomeCategoryCard {
  if (!isObject(raw)) return fallback;
  return {
    id: typeof raw.id === "string" ? raw.id : fallback.id,
    slug: typeof raw.slug === "string" ? raw.slug : fallback.slug,
    enabled: typeof raw.enabled === "boolean" ? raw.enabled : fallback.enabled,
    titleAr: typeof raw.titleAr === "string" ? raw.titleAr : fallback.titleAr,
    titleEn: typeof raw.titleEn === "string" ? raw.titleEn : fallback.titleEn,
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

export function mergeHomeCategoryConfig(stored: unknown): HomeCategoryConfig {
  const base = structuredClone(DEFAULT_HOME_CATEGORIES);
  if (!isObject(stored)) return base;

  const cardsIn = Array.isArray(stored.cards) ? stored.cards : null;
  const cards = base.cards.map((defaultCard, i) => {
    const fromStored =
      cardsIn?.find(
        (c) => isObject(c) && typeof c.id === "string" && c.id === defaultCard.id,
      ) ?? cardsIn?.[i];
    return sanitizeCategoryCard(fromStored, defaultCard);
  });

  return {
    version: typeof stored.version === "number" ? stored.version : base.version,
    cards,
  };
}

export async function getHomeCategoryConfig(): Promise<HomeCategoryConfig> {
  try {
    const row = await prisma.homeCategoryConfig.findUnique({
      where: { id: CONFIG_ID },
    });
    if (!row) return structuredClone(DEFAULT_HOME_CATEGORIES);
    return mergeHomeCategoryConfig(row.data);
  } catch {
    return structuredClone(DEFAULT_HOME_CATEGORIES);
  }
}

export async function saveHomeCategoryConfig(
  data: HomeCategoryConfig,
): Promise<HomeCategoryConfig> {
  const existing = await getHomeCategoryConfig();
  const base = structuredClone(DEFAULT_HOME_CATEGORIES);

  const cardsIn = Array.isArray(data.cards) ? data.cards : existing.cards;
  const cards = base.cards.map((defaultCard, i) => {
    const raw =
      cardsIn.find((c) => c.id === defaultCard.id) ??
      cardsIn[i] ??
      defaultCard;
    const fallback =
      existing.cards.find((c) => c.id === defaultCard.id) ??
      existing.cards[i] ??
      defaultCard;
    const card = sanitizeCategoryCard(raw, fallback);
    const incomingImage =
      typeof raw.imageUrl === "string" ? raw.imageUrl.trim() : "";
    const keepImage = shouldRetainStoredImageOnSave(incomingImage);

    return {
      ...card,
      imageUrl: keepImage ? fallback.imageUrl : incomingImage,
    };
  });

  const merged: HomeCategoryConfig = {
    version:
      typeof data.version === "number" ? data.version : existing.version,
    cards,
  };

  await prisma.homeCategoryConfig.upsert({
    where: { id: CONFIG_ID },
    create: { id: CONFIG_ID, data: merged },
    update: { data: merged },
  });
  revalidatePath("/");
  return merged;
}

export function activeCategoryCards(
  config: HomeCategoryConfig,
): HomeCategoryCard[] {
  const enabled = config.cards.filter((c) => c.enabled && c.imageUrl);
  return enabled.length ? enabled : config.cards.slice(0, 2);
}
