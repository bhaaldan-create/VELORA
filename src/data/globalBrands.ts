export type GlobalBrandProduct = {
  id: string;
  brand: string;
  name: string;
  nameAr: string;
  categoryAr: string;
  originAr: string;
  image: string;
  href: string;
};

/** مختارات عالمية معروضة في الصفحة الرئيسية */
export const globalBrandProducts: GlobalBrandProduct[] = [
  {
    id: "gb1",
    brand: "L'Oréal Paris",
    name: "Revitalift Serum",
    nameAr: "سيروم ريفيتاليفت",
    categoryAr: "العناية بالبشرة",
    originAr: "فرنسا",
    image: "/brands/products/loreal.jpg",
    href: "/shop?category=skincare",
  },
  {
    id: "gb2",
    brand: "Maybelline New York",
    name: "Fit Me Foundation",
    nameAr: "فاونديشن فيت مي",
    categoryAr: "المكياج",
    originAr: "أمريكا",
    image: "/brands/products/maybelline.jpg",
    href: "/shop?category=makeup",
  },
  {
    id: "gb3",
    brand: "La Roche-Posay",
    name: "Toleriane Care",
    nameAr: "عناية توليريان",
    categoryAr: "العناية بالبشرة",
    originAr: "فرنسا",
    image: "/brands/products/laroche.jpg",
    href: "/shop?category=skincare",
  },
  {
    id: "gb4",
    brand: "Vichy",
    name: "Minéral 89",
    nameAr: "مينيرال 89",
    categoryAr: "العناية بالبشرة",
    originAr: "فرنسا",
    image: "/brands/products/vichy.jpg",
    href: "/shop?category=skincare",
  },
  {
    id: "gb5",
    brand: "CeraVe",
    name: "Hydrating Cleanser",
    nameAr: "غسول مرطّب",
    categoryAr: "العناية بالبشرة",
    originAr: "أمريكا",
    image: "/brands/products/cerave.jpg",
    href: "/shop?category=skincare",
  },
  {
    id: "gb6",
    brand: "Garnier",
    name: "Micellar Water",
    nameAr: "ماء ميسيلار",
    categoryAr: "تنظيف البشرة",
    originAr: "فرنسا",
    image: "/brands/products/garnier.jpg",
    href: "/shop?category=skincare",
  },
  {
    id: "gb7",
    brand: "Neutrogena",
    name: "Hydro Boost",
    nameAr: "هايدرو بوست",
    categoryAr: "ترطيب",
    originAr: "أمريكا",
    image: "/brands/products/neutrogena.jpg",
    href: "/shop?category=skincare",
  },
  {
    id: "gb8",
    brand: "Clinique",
    name: "Moisture Surge",
    nameAr: "مواسشر سيرج",
    categoryAr: "ترطيب فاخر",
    originAr: "أمريكا",
    image: "/brands/products/clinique.jpg",
    href: "/shop?category=skincare",
  },
];

export const featuredBrandNames = [
  "L'Oréal Paris",
  "Maybelline New York",
  "La Roche-Posay",
  "Vichy",
  "CeraVe",
  "Garnier",
  "Neutrogena",
  "Clinique",
] as const;
