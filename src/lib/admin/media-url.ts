/** روابط عرض صور مخزّنة كـ data URL في DB — تبقي ردود JSON خفيفة. */

export function heroSlideMediaUrl(
  slideId: string,
  variant: "desktop" | "mobile",
  cacheBust?: number,
): string {
  const q = new URLSearchParams({ slideId, variant });
  if (cacheBust) q.set("v", String(cacheBust));
  return `/api/media/home-hero?${q}`;
}

export function categoryCardMediaUrl(cardId: string, cacheBust?: number): string {
  const q = new URLSearchParams({ cardId });
  if (cacheBust) q.set("v", String(cacheBust));
  return `/api/media/home-categories?${q}`;
}

export function homePromoMediaUrl(cacheBust?: number): string {
  const q = new URLSearchParams();
  if (cacheBust) q.set("v", String(cacheBust));
  const query = q.toString();
  return query ? `/api/media/home-promo?${query}` : "/api/media/home-promo";
}

export function resolveClientImageUrl(stored: string, mediaUrl: string): string {
  if (!stored) return stored;
  if (stored.startsWith("http://") || stored.startsWith("https://")) return stored;
  // كل المسارات المحلية والـ data URLs تُعرض عبر /api/media لضمان العمل على Vercel
  return mediaUrl;
}

/** لا نعيد إرسالها في PUT — السيرفر يحتفظ بالصورة في DB */
export function isEphemeralClientImageUrl(url: string): boolean {
  return url.startsWith("data:") || url.startsWith("/api/media/");
}

/** عند الحفظ: فارغ أو رابط عرض مؤقت فقط — لا نستبدل ما في DB */
export function shouldRetainStoredImageOnSave(incoming: string): boolean {
  const trimmed = incoming.trim();
  return !trimmed || trimmed.startsWith("/api/media/");
}

/** مفتاح كاش خفيف يتغيّر عند تغيير الصورة المخزّنة */
export function mediaCacheBustFromStored(stored: string): number | undefined {
  if (!stored) return undefined;
  let h = 0;
  const step = Math.max(1, Math.floor(stored.length / 48));
  for (let i = 0; i < stored.length; i += step) {
    h = (h * 31 + stored.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

/** روابط API والـ data URLs لا تعمل مع محسّن next/image */
export function shouldUseNativeImageElement(src: string): boolean {
  return src.startsWith("data:") || src.startsWith("/api/media/");
}
