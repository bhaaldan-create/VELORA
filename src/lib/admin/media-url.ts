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

export function resolveClientImageUrl(stored: string, mediaUrl: string): string {
  if (!stored) return stored;
  if (stored.startsWith("data:")) return mediaUrl;
  return stored;
}

/** لا نعيد إرسالها في PUT — السيرفر يحتفظ بالصورة في DB */
export function isEphemeralClientImageUrl(url: string): boolean {
  return url.startsWith("data:") || url.startsWith("/api/media/");
}
