import type { Metadata } from "next";
import { PassportExperience } from "@/components/passport/PassportExperience";

export const metadata: Metadata = {
  title: "MY VELORA Passport",
  description: "Your digital beauty identity inside VELORA.",
};

export default function MyVeloraPassportPage() {
  return <PassportExperience />;
}
