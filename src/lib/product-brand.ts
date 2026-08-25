const KNOWN_BRANDS = [
  "L'Oréal Paris",
  "L'Oreal Paris",
  "Maybelline New York",
  "Maybelline",
  "La Roche-Posay",
  "CeraVe",
  "Neutrogena",
  "Clinique",
  "Garnier",
  "Vichy",
  "The Ordinary",
  "VELORA",
] as const;

/** Infer a display brand from product English name when no brand field exists. */
export function getProductBrand(name: string, nameAr?: string): string {
  const hay = `${name} ${nameAr ?? ""}`;
  for (const brand of KNOWN_BRANDS) {
    if (hay.toLowerCase().includes(brand.toLowerCase())) {
      return brand === "L'Oreal Paris" ? "L'Oréal Paris" : brand;
    }
  }
  // First 1–3 Title Case tokens before a dash / Arabic name
  const token = name.split(/[–—-]/)[0]?.trim() ?? name;
  const words = token.split(/\s+/).slice(0, 3).join(" ");
  return words || "VELORA";
}

/** كلمات عطر واضحة في الاسم فقط — الأوصاف غالباً تقول fragrance-free فتُخفى بالخطأ */
const FRAGRANCE_NAME_RE =
  /\bperfume\b|\bparfum\b|\beau[\s-]de\b|\bcologne\b|بارفان|كولونيا|(?:^|\s)عطر(?:\s|$)/i;

export function isFragranceProduct(product: {
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  category?: string;
}): boolean {
  if (product.category === "fragrance") return true;
  // لا نفحص الوصف: نصوص العناية تذكر العطور بالنفي («خالية من العطور»)
  return FRAGRANCE_NAME_RE.test(`${product.name} ${product.nameAr}`);
}
