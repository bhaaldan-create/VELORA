/** روابط عرض صور مخزّنة كـ data URL في DB — تبقي ردود JSON خفيفة. */

export function productMediaUrl(
  productId: string,
  kind: "product" | "brandLogo" = "product",
  cacheBust?: number | string,
): string {
  const q = new URLSearchParams();
  if (kind === "brandLogo") q.set("kind", "brandLogo");
  if (cacheBust !== undefined && cacheBust !== "") q.set("v", String(cacheBust));
  const query = q.toString();
  const base = `/api/media/product/${encodeURIComponent(productId)}`;
  return query ? `${base}?${query}` : base;
}

/**
 * Display URL for admin/storefront — never ship raw data: URLs in JSON.
 * Keeps https (Blob/CDN) as-is; rewrites data:/local paths through media proxy.
 */
export function resolveStoredImageForClient(
  stored: string | null | undefined,
  productId: string,
  kind: "product" | "brandLogo" = "product",
  cacheBust?: number | string,
): string | null {
  if (!stored?.trim()) return null;
  const url = stored.trim();
  if (url.startsWith("https://") || url.startsWith("http://")) return url;
  return productMediaUrl(productId, kind, cacheBust);
}

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

/** مفتاح كاش خفيف يتغيّر عند تغيير الصورة المخزّنة — بدون مسح الـ base64 كاملاً */
export function mediaCacheBustFromStored(stored: string): number | undefined {
  if (!stored) return undefined;
  const len = stored.length;
  // عيّنة صغيرة من البداية/الوسط/النهاية — كافية لكشف التغيير دون تكلفة 10MB
  const a = stored.charCodeAt(0) || 0;
  const b = stored.charCodeAt(Math.min(64, len - 1)) || 0;
  const c = stored.charCodeAt(Math.floor(len / 2)) || 0;
  const d = stored.charCodeAt(Math.max(0, len - 32)) || 0;
  return ((len * 1315423911) ^ (a << 24) ^ (b << 16) ^ (c << 8) ^ d) >>> 0;
}

/** روابط API والـ data URLs لا تعمل مع محسّن next/image */
export function shouldUseNativeImageElement(src: string): boolean {
  return src.startsWith("data:") || src.startsWith("/api/media/");
}
