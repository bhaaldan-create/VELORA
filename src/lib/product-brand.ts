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

const FRAGRANCE_RE =
  /\bperfume\b|\bparfum\b|\beau[\s-]de\b|\bfragrance\b|بارفان|كولونيا|(?:^|[^\u0600-\u06FF])عطر(?:[^\u0600-\u06FF]|$)/i;

export function isFragranceProduct(product: {
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  category?: string;
}): boolean {
  if (product.category === "fragrance") return true;
  const text = `${product.name} ${product.nameAr} ${product.description ?? ""} ${product.descriptionAr ?? ""}`;
  // منتجات العناية غالباً تذكر «بدون عطر / fragrance-free» — لا تُصنَّف كعطور
  const cleaned = text
    .replace(/fragrance[\s-]*free/gi, " ")
    .replace(/\bunscented\b/gi, " ")
    .replace(/خالي[ة]? من ال?عطور?/gi, " ")
    .replace(/بدون ال?عطور?/gi, " ")
    .replace(/بلا ال?عطور?/gi, " ")
    .replace(/free of (?:any )?fragrance/gi, " ");
  return FRAGRANCE_RE.test(cleaned);
}
