import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PublicPassportView } from "@/components/passport/PublicPassportView";
import { isCustomerFeatureEnabled } from "@/lib/customer-features";

export const metadata: Metadata = {
  title: "MY VELORA Passport",
  description: "Public VELORA Beauty Passport",
};

type Ctx = { params: Promise<{ token: string }> };

export default async function PublicPassportPage({ params }: Ctx) {
  if (!isCustomerFeatureEnabled("myVelora")) {
    redirect("/");
  }

  const { token } = await params;
  return <PublicPassportView token={token} />;
}
