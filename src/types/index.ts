export type CategorySlug =
  | "skincare"
  | "body-care"
  | "hair-care"
  | "makeup";

export type SkinConcern =
  | "hydration"
  | "glow"
  | "acne"
  | "anti-aging"
  | "sensitivity"
  | "oil-control";

export type Currency = "IQD";

export interface Category {
  slug: CategorySlug;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  tagline: string;
  taglineAr: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  nameAr: string;
  category: CategorySlug;
  /** السعر النهائي للبيع (بعد الخصم إن وُجد) */
  price: number;
  /** السعر الأساسي قبل الخصم */
  originalPrice?: number;
  /** نسبة الخصم 0–50 */
  discountPercent?: number;
  currency: Currency;
  description: string;
  descriptionAr: string;
  benefits: string[];
  benefitsAr: string[];
  ingredients: string[];
  concerns: SkinConcern[];
  size: string;
  isBestseller?: boolean;
  isNew?: boolean;
  rating: number;
  reviews: number;
  imageTone: string;
  /** مسار صورة المنتج من لوحة الإدارة مثل /products/p1.webp */
  imageUrl?: string | null;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface AdvisorMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
}
