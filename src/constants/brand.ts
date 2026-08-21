export const brand = {
  name: "VELORA",
  tagline: "BEAUTY REVEALED",
  taglineAr: "الجمال يُكشف",
  description:
    "A global beauty house for skincare, body care, hair care, and makeup — crafted to reveal your most luminous self.",
  descriptionAr:
    "دار تجميل عالمية للعناية بالبشرة والجسم والشعر والمكياج — صُممت لتُظهر أبهى إشراقة لكِ.",
  currency: "IQD" as const,
  currencyLabel: "د.ع",
  freeShippingFrom: 100000,
  colors: {
    plum: "#3D2640",
    plumSoft: "#5C3A5E",
    ink: "#1A121C",
    ivory: "#F8F4F1",
    champagne: "#E9DFD6",
    blush: "#D4B5B8",
    mist: "#F1EAE6",
    muted: "#8B7A84",
  },
} as const;

/** واجهة عربية — الهوية الإنجليزية تبقى للبراند فقط */
export const ui = {
  home: "الرئيسية",
  shop: "التسوق",
  bag: "الحقيبة",
  account: "حسابي",
  login: "دخول",
  register: "إنشاء حساب",
  advisor: "لارسا",
  advisorNav: "لارسا",
  advisorFull: "المستشارة لارسا",
  about: "عنّا",
  all: "الكل",
  search: "ابحثي عن منتج أو احتياج…",
  addToBag: "أضيفي للحقيبة",
  added: "تمت الإضافة",
  viewAll: "عرض الكل",
  checkout: "إتمام الطلب",
  placeOrder: "تأكيد الطلب",
  clear: "تفريغ",
  remove: "إزالة",
  subtotal: "المجموع الفرعي",
  total: "الإجمالي",
  emptyBag: "حقيبتك فارغة",
  continueShopping: "متابعة التسوق",
  freeShipping: "شحن مجاني للطلبات فوق",
  deliveryFeeAdded: "تم إضافة أجور التوصيل",
  deliveryVia: "التوصيل عبر",
  bestsellers: "الأكثر مبيعاً",
  newArrivals: "وصل حديثاً",
  theEdit: "مجموعة مختارة",
  theHouse: "دار فيلورا",
  explore: "استكشفي",
  clientCare: "رعاية العميلة",
  keyIngredients: "المكونات الأساسية",
  reviews: "تقييم",
  quantity: "الكمية",
  orderSummary: "ملخص الطلب",
  shippingDetails: "بيانات الشحن",
  thankYou: "شكراً لكِ",
  orderConfirmed: "تم تأكيد طلبكِ",
  demoCheckout: "طلب تجريبي — يمكن ربط بوابة الدفع لاحقاً",
  productsCount: (n: number) =>
    n === 1 ? "منتج واحد" : n === 2 ? "منتجان" : `${n} منتجات`,
  needHelp: "تحتاجين مساعدة؟",
  askAdvisor: "اسألي المستشارة لارسا",
  recommended: "مقترح لكِ",
  send: "إرسال",
  nothingCheckout: "لا يوجد شيء للدفع",
  returnShop: "العودة للتسوق",
  globalOrigins: "من أفضل البراندات حول العالم",
} as const;

/** العلامات الأربع الرئيسية */
export const primaryNavLinks = [
  { href: "/", labelAr: "الرئيسية", id: "home" as const },
  { href: "/shop", labelAr: "التسوق", id: "shop" as const },
  { href: "/advisor", labelAr: "لارسا", id: "advisor" as const },
  { href: "/account", labelAr: "حسابي", id: "account" as const },
] as const;

export const navLinks = [
  { href: "/", labelAr: "الرئيسية" },
  { href: "/shop", labelAr: "التسوق" },
  { href: "/shop?category=skincare", labelAr: "البشرة" },
  { href: "/shop?category=body-care", labelAr: "الجسم" },
  { href: "/shop?category=hair-care", labelAr: "الشعر" },
  { href: "/shop?category=makeup", labelAr: "المكياج" },
  { href: "/advisor", labelAr: "لارسا" },
] as const;

export const categoryLabels: Record<string, string> = {
  skincare: "العناية بالبشرة",
  "body-care": "العناية بالجسم",
  "hair-care": "العناية بالشعر",
  makeup: "المكياج",
};
