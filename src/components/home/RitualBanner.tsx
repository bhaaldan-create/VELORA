import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ui } from "@/constants/brand";

export function RitualBanner() {
  return (
    <section className="relative overflow-hidden bg-[var(--champagne)]">
      <div className="mx-auto grid max-w-7xl lg:grid-cols-2">
        <div
          className="min-h-[320px] lg:min-h-[480px] lg:order-2"
          style={{
            background:
              "linear-gradient(135deg, #3D2640 0%, #5C3A5E 40%, #D4B5B8 100%)",
          }}
        />
        <div className="flex flex-col justify-center px-5 py-16 sm:px-12 lg:order-1 lg:px-16">
          <p className="t1 font-medium tracking-[0.18em] text-[var(--muted)]">
            إرشاد شخصي
          </p>
          <h2 className="font-display t7 mt-3 font-semibold text-[var(--plum)]">
            {ui.advisor}
          </h2>
          <p className="t4 mt-5 max-w-md text-[var(--ink)]/70">
            لستِ متأكدة من أين تبدأين؟ شاركي احتياجك — جفاف، إشراقة، توازن الفروة، أو مكياج طبيعي — واحصلي على طقس VELORA مخصص خلال لحظات.
          </p>
          <div className="mt-8">
            <Link href="/advisor">
              <Button>ابدئي الاستشارة</Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
