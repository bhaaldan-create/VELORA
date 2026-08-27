import { Suspense } from "react";
import { redirect } from "next/navigation";
import { MyVeloraHub } from "@/components/my-velora/MyVeloraHub";
import { isCustomerFeatureEnabled } from "@/lib/customer-features";
import "@/components/my-velora/my-velora.css";

export default function MyVeloraPage() {
  if (!isCustomerFeatureEnabled("myVelora")) {
    redirect("/account");
  }

  return (
    <div className="min-h-screen bg-[#F6F0F8]">
      <Suspense
        fallback={
          <p className="py-20 text-center text-[0.9rem] text-[#8B7A92]">
            Loading…
          </p>
        }
      >
        <MyVeloraHub />
      </Suspense>
    </div>
  );
}
