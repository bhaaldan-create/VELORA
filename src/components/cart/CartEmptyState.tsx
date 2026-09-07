import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { IconShoppingBag } from "@/components/cart/CartIcons";
import "./cart-bag.css";

export function CartEmptyState() {
  return (
    <div className="velora-bag">
      <div className="mx-auto flex min-h-[55vh] max-w-md animate-[velora-fade_0.5s_ease-out_both] flex-col items-center justify-center px-5 py-16 text-center sm:py-20">
        <div className="flex h-24 w-24 items-center justify-center rounded-full border border-[var(--plum)]/12 bg-[var(--surface)] text-[var(--plum)]/55 shadow-[0_14px_40px_-22px_rgba(61,38,64,0.2)]">
          <IconShoppingBag />
        </div>
        <h1 className="font-display mt-8 text-[1.75rem] font-medium text-[var(--plum)]">
          حقيبتك فارغة
        </h1>
        <p className="mt-3 text-[1rem] leading-relaxed text-[var(--muted)]">
          اكتشفي مختارات VELORA وأضيفي ما يستحق أن يكون جزءًا من روتينك.
        </p>
        <Link href="/shop" className="mt-8">
          <Button className="rounded-full px-8">ابدئي التسوق</Button>
        </Link>
      </div>
    </div>
  );
}
