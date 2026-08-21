import Link from "next/link";
import { getAllCategories } from "@/lib/catalog";
import { ui } from "@/constants/brand";

const tones: Record<string, string> = {
  skincare: "linear-gradient(145deg, #E8D5D8, #5C3A5E)",
  "body-care": "linear-gradient(145deg, #E9DFD6, #8B5E4B)",
  "hair-care": "linear-gradient(145deg, #D4B5B8, #1A121C)",
  makeup: "linear-gradient(145deg, #F2D6D8, #6B4A42)",
};

export async function CategoryStrip() {
  const categories = await getAllCategories();

  return (
    <section className="bg-[var(--ivory)] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-xl">
          <p className="t1 font-medium tracking-[0.18em] text-[var(--muted)]">
            {ui.theHouse}
          </p>
          <h2 className="font-display t7 mt-3 font-semibold text-[var(--plum)]">
            أربعة أعمدة للجمال
          </h2>
          <p className="t4 mt-4 text-[var(--ink)]/70">
            كل تركيبة مُختارة لفخامة حسية ونتائج واضحة — من أول غسلة إلى آخر لمسة لون.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat, i) => (
            <Link
              key={cat.slug}
              href={`/shop?category=${cat.slug}`}
              className="group block animate-[velora-rise_0.9s_ease-out_both]"
              style={{ animationDelay: `${0.08 * i}s` }}
            >
              <div
                className="aspect-[4/5] transition-transform duration-700 group-hover:scale-[1.02]"
                style={{ background: tones[cat.slug] }}
              />
              <h3 className="font-display t6 mt-5 font-medium text-[var(--plum)]">
                {cat.nameAr}
              </h3>
              <p className="t3 mt-2 text-[var(--muted)]">{cat.taglineAr}</p>
              <p
                className="t1 mt-1 tracking-[0.12em] text-[var(--muted)]/70 uppercase"
                dir="ltr"
              >
                {cat.name}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
