import type { Metadata } from "next";
import { LarsaExperience } from "@/components/advisor/LarsaExperience";
import { STOREFRONT_REVALIDATE_SECONDS } from "@/lib/cache-tags";

export const metadata: Metadata = {
  title: "LARSA · لارسا — مستشارتكِ الشخصية للجمال",
  description:
    "لارسا — المساعد الذكي للجمال داخل VELORA BEAUTY. استشارة شخصية وروتيناً من منتجاتنا فقط.",
};

export const revalidate = STOREFRONT_REVALIDATE_SECONDS;

export default function AdvisorPage() {
  return <LarsaExperience />;
}
