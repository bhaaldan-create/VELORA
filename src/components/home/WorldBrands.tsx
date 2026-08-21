import Image from "next/image";
import Link from "next/link";
import {
  featuredBrandNames,
  globalBrandProducts,
} from "@/data/globalBrands";
import { Button } from "@/components/ui/Button";

export function WorldBrands() {
  return (
    <section className="bg-[var(--mist)] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="t1 font-medium tracking-[0.2em] text-[var(--muted)]">
              براندات عالمية
            </p>
            <h2 className="font-display t7 mt-3 font-semibold text-[var(--plum)]">
              من أشهر الدور العالمية في التجميل
            </h2>
            <p className="t4 mt-4 text-[var(--ink)]/70">
              نوفر منتجات مختارة من L&apos;Oréal Paris، Maybelline New York،
              La Roche-Posay، Vichy وغيرها من الأسماء التي تثق بها العميلات حول العالم.
            </p>
          </div>
          <Link href="/shop">
            <Button variant="outline">تسوّقي الآن</Button>
          </Link>
        </div>

        <div
          className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 border-y border-[var(--plum)]/10 py-5"
          dir="ltr"
        >
          {featuredBrandNames.map((name) => (
            <span
              key={name}
              className="t2 tracking-[0.08em] text-[var(--plum)]/70 uppercase"
            >
              {name}
            </span>
          ))}
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {globalBrandProducts.map((item, i) => (
            <Link
              key={item.id}
              href={item.href}
              className="group block animate-[velora-rise_0.9s_ease-out_both]"
              style={{ animationDelay: `${0.05 * i}s` }}
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-[var(--champagne)]">
                <Image
                  src={item.image}
                  alt={`${item.brand} — ${item.nameAr}`}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(26,18,28,0.55)] via-transparent to-transparent opacity-80" />
                <span
                  className="absolute top-3 start-3 bg-[var(--ivory)]/95 px-2.5 py-1 t1 font-medium tracking-[0.06em] text-[var(--plum)]"
                  dir="ltr"
                >
                  {item.brand}
                </span>
              </div>
              <div className="mt-4">
                <p className="t1 text-[var(--muted)]">
                  {item.categoryAr} · {item.originAr}
                </p>
                <h3 className="font-display t5 mt-1 font-medium text-[var(--plum)]">
                  {item.nameAr}
                </h3>
                <p className="t2 mt-1 text-[var(--ink)]/55" dir="ltr">
                  {item.name}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
