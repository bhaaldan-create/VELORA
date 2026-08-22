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
  /fragrance|perfume|parfum|eau de|عطر|بارفان|كولونيا|رائحة/i;

export function isFragranceProduct(product: {
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  category?: string;
}): boolean {
  if (product.category === "fragrance") return true;
  return FRAGRANCE_RE.test(
    `${product.name} ${product.nameAr} ${product.description ?? ""} ${product.descriptionAr ?? ""}`,
  );
}
