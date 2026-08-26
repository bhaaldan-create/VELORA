import type { Metadata } from "next";
import { PublicPassportView } from "@/components/passport/PublicPassportView";

export const metadata: Metadata = {
  title: "MY VELORA Passport",
  description: "Public VELORA Beauty Passport",
};

type Ctx = { params: Promise<{ token: string }> };

export default async function PublicPassportPage({ params }: Ctx) {
  const { token } = await params;
  return <PublicPassportView token={token} />;
}
