import type { Metadata } from "next";
import { LarsaExperience } from "@/components/advisor/LarsaExperience";

export const metadata: Metadata = {
  title: "LARSA · لارسا — مستشارتكِ الشخصية للجمال",
  description:
    "لارسا — المساعد الذكي للجمال داخل VELORA BEAUTY. استشارة شخصية وروتيناً من منتجاتنا فقط.",
};

export const revalidate = 3600;

export default function AdvisorPage() {
  return <LarsaExperience />;
}
