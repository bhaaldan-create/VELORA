import { redirect } from "next/navigation";

/** مسار واضح لقائمة الأمنيات — يعيد استخدام قسم الحساب الحالي */
export default function AccountWishlistPage() {
  redirect("/account?section=wishlist");
}
