import { Suspense } from "react";
import { MyVeloraHub } from "@/components/my-velora/MyVeloraHub";
import "@/components/my-velora/my-velora.css";

export default function MyVeloraPage() {
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
