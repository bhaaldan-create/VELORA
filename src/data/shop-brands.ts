export type ShopBrand = {
  slug: string;
  name: string;
  nameAr: string;
  /** Match tokens in product name (lowercase) */
  match: string[];
  /** Circular brand logo */
  logo: string;
};

/** براندات المتجر — شاشة البحث */
export const shopBrands: ShopBrand[] = [
  {
    slug: "velora",
    name: "VELORA",
    nameAr: "فيلورا",
    match: ["velora"],
    logo: "/brands/logos/velora.svg",
  },
  {
    slug: "loreal-paris",
    name: "L'Oréal Paris",
    nameAr: "لوريال باريس",
    match: ["l'oréal", "l'oreal", "loreal"],
    logo: "/brands/logos/loreal-paris.svg",
  },
  {
    slug: "maybelline",
    name: "Maybelline",
    nameAr: "ميبيلين",
    match: ["maybelline"],
    logo: "/brands/logos/maybelline.svg",
  },
  {
    slug: "la-roche-posay",
    name: "La Roche-Posay",
    nameAr: "لاروش بوزيه",
    match: ["la roche", "laroche"],
    logo: "/brands/logos/la-roche-posay.svg",
  },
  {
    slug: "vichy",
    name: "Vichy",
    nameAr: "فيشي",
    match: ["vichy"],
    logo: "/brands/logos/vichy.svg",
  },
  {
    slug: "cerave",
    name: "CeraVe",
    nameAr: "سيرافي",
    match: ["cerave"],
    logo: "/brands/logos/cerave.svg",
  },
  {
    slug: "garnier",
    name: "Garnier",
    nameAr: "غارنييه",
    match: ["garnier"],
    logo: "/brands/logos/garnier.svg",
  },
  {
    slug: "neutrogena",
    name: "Neutrogena",
    nameAr: "نيتروجينا",
    match: ["neutrogena"],
    logo: "/brands/logos/neutrogena.svg",
  },
  {
    slug: "clinique",
    name: "Clinique",
    nameAr: "كلينيك",
    match: ["clinique"],
    logo: "/brands/logos/clinique.svg",
  },
  {
    slug: "the-ordinary",
    name: "The Ordinary",
    nameAr: "ذا أورديناري",
    match: ["ordinary"],
    logo: "/brands/logos/the-ordinary.svg",
  },
];

export function getShopBrand(slug: string | undefined | null) {
  if (!slug) return null;
  return shopBrands.find((b) => b.slug === slug) ?? null;
}

export function productMatchesBrand(
  productName: string,
  productNameAr: string,
  brand: ShopBrand,
) {
  const hay = `${productName} ${productNameAr}`.toLowerCase();
  return brand.match.some((m) => hay.includes(m.toLowerCase()));
}
