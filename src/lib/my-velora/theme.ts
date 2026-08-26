import type {
  VeloraCardBrand,
  VeloraCardProduct,
  VeloraThemeKey,
} from "@/lib/my-velora/types";
import { getProductBrand } from "@/lib/product-brand";
import type { OrderPayload } from "@/lib/order-email";

const K_BEAUTY_BRANDS = [
  "anua",
  "axis-y",
  "axis y",
  "k-secret",
  "ksecret",
  "beauty of joseon",
  "cosrx",
  "innisfree",
  "laneige",
  "rom&nd",
  "peripera",
  "skin1004",
  "torriden",
  "isntree",
  "mixsoon",
  "medicube",
];

function normalizeBrand(name: string) {
  return name.trim().toLowerCase();
}

/**
 * Keep payload JSON small — never embed data: URLs.
 * The server renderer loads real image bytes from the Product table.
 */
function productImageUrl(productId: string, imageUrl: string | null | undefined) {
  if (imageUrl?.startsWith("http") || imageUrl?.startsWith("/uploads/") || imageUrl?.startsWith("/products/")) {
    return imageUrl;
  }
  return `/api/media/product/${encodeURIComponent(productId)}`;
}

function compactLogoUrl(logoUrl: string | null | undefined): string | null {
  if (!logoUrl) return null;
  if (logoUrl.startsWith("data:")) return null; // loaded from DB at render time
  if (logoUrl.startsWith("http") || logoUrl.startsWith("/")) return logoUrl;
  return null;
}

export type ProductRow = {
  id: string;
  name: string;
  nameAr: string;
  categorySlug: string;
  brandName: string | null;
  brandLogoUrl: string | null;
  imageUrl: string | null;
};

export function buildCardProducts(
  order: OrderPayload,
  rows: ProductRow[],
): VeloraCardProduct[] {
  const byId = new Map(rows.map((r) => [r.id, r]));

  return order.items.map((item) => {
    const row = byId.get(item.id);
    const brandName =
      row?.brandName?.trim() ||
      getProductBrand(item.name, item.nameAr);
    return {
      id: item.id,
      name: item.name,
      nameAr: item.nameAr,
      quantity: item.quantity,
      imageUrl: productImageUrl(item.id, row?.imageUrl),
      brandName,
      brandLogoUrl: compactLogoUrl(row?.brandLogoUrl),
      categorySlug: row?.categorySlug ?? "skincare",
    };
  });
}

export function buildCardBrands(products: VeloraCardProduct[]): VeloraCardBrand[] {
  const map = new Map<string, VeloraCardBrand>();
  for (const p of products) {
    const key = normalizeBrand(p.brandName);
    if (!key || map.has(key)) continue;
    map.set(key, { name: p.brandName, logoUrl: p.brandLogoUrl });
  }
  return [...map.values()];
}

export function detectTheme(
  products: VeloraCardProduct[],
  brands: VeloraCardBrand[],
): VeloraThemeKey {
  const categories = products.map((p) => p.categorySlug);
  const brandNames = brands.map((b) => normalizeBrand(b.name));

  const skincareCount = categories.filter((c) => c === "skincare").length;
  const makeupCount = categories.filter((c) => c === "makeup").length;
  const hairCount = categories.filter((c) => c === "haircare").length;

  const kBeautyHits = brandNames.filter((b) =>
    K_BEAUTY_BRANDS.some((k) => b.includes(k)),
  ).length;

  if (kBeautyHits >= Math.max(2, Math.ceil(brands.length * 0.5))) {
    return "k-beauty-haul";
  }

  const brandCounts = new Map<string, number>();
  for (const p of products) {
    const k = normalizeBrand(p.brandName);
    brandCounts.set(k, (brandCounts.get(k) ?? 0) + p.quantity);
  }
  const dominant = [...brandCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (dominant && dominant[1] >= Math.max(2, Math.ceil(products.length * 0.6))) {
    return "brand-moment";
  }

  if (skincareCount > makeupCount && skincareCount > hairCount) {
    return "skincare-haul";
  }
  if (makeupCount > skincareCount && makeupCount > hairCount) {
    return "makeup-haul";
  }
  if (hairCount > skincareCount && hairCount > makeupCount) {
    return "haircare-haul";
  }

  return "beauty-haul";
}

export function themeLabels(theme: VeloraThemeKey): {
  subtitleEn: string;
  subtitleAr: string;
} {
  switch (theme) {
    case "skincare-haul":
      return {
        subtitleEn: "MY SKINCARE HAUL",
        subtitleAr: "مشتريات العناية بالبشرة",
      };
    case "makeup-haul":
      return {
        subtitleEn: "MY MAKEUP HAUL",
        subtitleAr: "مشتريات المكياج",
      };
    case "haircare-haul":
      return {
        subtitleEn: "MY HAIRCARE HAUL",
        subtitleAr: "مشتريات العناية بالشعر",
      };
    case "k-beauty-haul":
      return {
        subtitleEn: "MY K-BEAUTY HAUL",
        subtitleAr: "مشتريات K-Beauty",
      };
    case "brand-moment":
      return {
        subtitleEn: "MY BEAUTY MOMENT",
        subtitleAr: "لحظة جمالي",
      };
    case "beauty-haul":
      return {
        subtitleEn: "MY BEAUTY HAUL",
        subtitleAr: "مشتريات الجمال",
      };
    default:
      return {
        subtitleEn: "MY BEAUTY MOMENT",
        subtitleAr: "لحظة جمالي",
      };
  }
}

export function brandMomentLabel(brandName: string, ar: boolean) {
  if (ar) return `لحظة ${brandName}`;
  return `MY ${brandName.toUpperCase()} MOMENT`;
}
