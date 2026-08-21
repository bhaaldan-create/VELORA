import { redirect } from "next/navigation";

/** لوحة الأدمن/الموظفين — الصفحة الرئيسية */
export default function AdminHomePage() {
  redirect("/admin/orders");
}
