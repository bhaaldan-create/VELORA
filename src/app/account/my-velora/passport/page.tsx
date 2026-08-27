import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PassportExperience } from "@/components/passport/PassportExperience";
import { isCustomerFeatureEnabled } from "@/lib/customer-features";

export const metadata: Metadata = {
  title: "MY VELORA Passport",
  description: "Your digital beauty identity inside VELORA.",
};

export default function MyVeloraPassportPage() {
  if (!isCustomerFeatureEnabled("passport")) {
    redirect("/account");
  }

  return <PassportExperience />;
}
