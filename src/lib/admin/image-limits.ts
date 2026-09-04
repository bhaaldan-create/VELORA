/** الحد الأقصى لحجم صور الأدمن (ميجابايت) — يسمح بصور عالية الدقة */
export const MAX_ADMIN_IMAGE_MB = 12;

export const MAX_ADMIN_IMAGE_BYTES = MAX_ADMIN_IMAGE_MB * 1024 * 1024;

export const MAX_ADMIN_IMAGE_ERROR = `حجم الصورة يجب ألا يتجاوز ${MAX_ADMIN_IMAGE_MB} ميجابايت.`;

export const ADMIN_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/jpg",
]);
