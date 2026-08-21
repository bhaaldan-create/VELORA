import type { Metadata } from "next";
import { AdvisorChat } from "@/components/advisor/AdvisorChat";

export const metadata: Metadata = {
  title: "لارسا",
  description:
    "البحث والمستشارة لارسا في VELORA — إرشاد جمالي شخصي للمنتجات والطقوس.",
};

export default function AdvisorPage() {
  return <AdvisorChat />;
}
