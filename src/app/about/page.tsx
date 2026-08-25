import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { brand, ui } from "@/constants/brand";

export const metadata: Metadata = {
  title: "عنّا",
  description: brand.descriptionAr,
};

export const revalidate = 3600;

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
      <p className="t1 font-medium tracking-[0.18em] text-[var(--muted)]">
        {ui.theHouse}
      </p>
      <h1 className="font-brand t8 mt-3 tracking-[0.2em] text-[var(--plum)] uppercase">
        {brand.name}
      </h1>
      <p className="t1 mt-2 tracking-[0.35em] text-[var(--blush)] uppercase">
        {brand.tagline}
      </p>
      <p className="t5 mt-10 text-[var(--ink)]/75">{brand.descriptionAr}</p>
      <p className="t4 mt-6 text-[var(--ink)]/70">
        نصنع العناية بالبشرة والجسم والشعر والمكياج كطقس واحد متصل —
        حسي ودقيق وراقي عالمياً. كل تركيبة مُختارة لتُظهر جمالاً شخصياً لا مصطنعاً.
      </p>
      <p className="t3 mt-6 text-[var(--muted)]" dir="ltr">
        {brand.description}
      </p>
      <Link href="/shop" className="mt-12 inline-block">
        <Button>استكشفي المجموعة</Button>
      </Link>
    </div>
  );
}
