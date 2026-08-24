/** Long-lived CDN/browser cache for uploaded media served by route handlers. */
export const MEDIA_CACHE_CONTROL =
  "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400";

export const MEDIA_IMMUTABLE_CACHE_CONTROL =
  "public, max-age=31536000, immutable";
