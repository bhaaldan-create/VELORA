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
  updatedAt: string;
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
