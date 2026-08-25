export type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  nameAr: string;
  categorySlug: string;
  /** السعر الأساسي قبل الخصم */
  price: number;
  discountPercent: number;
  /** السعر بعد الخصم */
  salePrice: number;
  stock: number;
  isActive: boolean;
  isBestseller: boolean;
  isNew: boolean;
  size: string;
  imageUrl: string | null;
  brandName: string | null;
  brandLogoUrl: string | null;
  updatedAt: string;
};

/** تفاصيل كاملة لمحرّر المنتج */
export type AdminProductDetail = AdminProduct & {
  description: string;
  descriptionAr: string;
  benefits: string[];
  benefitsAr: string[];
  ingredients: string[];
  concerns: string[];
  supplierId: string | null;
  costCurrency: string;
  costExchangeRate: number;
  purchasePrice: number;
  shippingCostIqd: number;
  customsCostIqd: number;
  brokerageCostIqd: number;
  handlingCostIqd: number;
  otherCostIqd: number;
  landedCostIqd: number;
  minMarginPct: number;
};

export type AdminProductStats = {
  all: number;
  active: number;
  hidden: number;
  lowStock: number;
  outOfStock: number;
  onSale: number;
};

export function countAdminProductStats(products: AdminProduct[]): AdminProductStats {
  return {
    all: products.length,
    active: products.filter((p) => p.isActive).length,
    hidden: products.filter((p) => !p.isActive).length,
    lowStock: products.filter((p) => p.stock > 0 && p.stock <= 10).length,
    outOfStock: products.filter((p) => p.stock <= 0).length,
    onSale: products.filter((p) => p.discountPercent > 0).length,
  };
}

export const ADMIN_CATEGORY_LABELS: Record<string, string> = {
  skincare: "العناية بالبشرة",
  "body-care": "العناية بالجسم",
  "hair-care": "العناية بالشعر",
  makeup: "المكياج",
};
