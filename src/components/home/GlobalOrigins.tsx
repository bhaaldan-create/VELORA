import Image from "next/image";

const origins = [
  {
    src: "/brand/origins/france.png",
    name: "France",
    nameAr: "فرنسا",
    note: "عناية فاخرة",
  },
  {
    src: "/brand/origins/italy.png",
    name: "Italy",
    nameAr: "إيطاليا",
    note: "أناقة وتركيبات راقية",
  },
  {
    src: "/brand/origins/germany.png",
    name: "Germany",
    nameAr: "ألمانيا",
    note: "دقة وجودة مختبرية",
  },
  {
    src: "/brand/origins/usa.png",
    name: "USA",
    nameAr: "أمريكا",
    note: "ابتكار وبراندات عالمية",
  },
  {
    src: "/brand/origins/korea.png",
    name: "Korea",
    nameAr: "كوريا",
    note: "روتينات نضارة حديثة",
  },
] as const;

export function GlobalOrigins() {
  return (
    <section className="bg-[var(--ivory)] py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="t1 font-medium tracking-[0.2em] text-[var(--muted)]">
            الصفحة الرئيسية · اختيار عالمي
          </p>
          <h2 className="font-display t7 mt-3 font-semibold text-[var(--plum)]">
            منتجات من أفضل البراندات حول العالم
          </h2>
          <p className="t4 mt-4 text-[var(--ink)]/70">
            في VELORA نختار لكِ بعناية من فرنسا، إيطاليا، ألمانيا، أمريكا، وكوريا —
            لتجربة تجميل عالمية بمعايير فاخرة.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-2 items-end gap-6 sm:gap-8 md:grid-cols-3 lg:grid-cols-5">
          {origins.map((origin, i) => (
            <figure
              key={origin.name}
              className="group flex flex-col items-center text-center motion-safe:animate-[velora-rise_0.9s_ease-out_forwards]"
              style={{ animationDelay: `${0.06 * i}s` }}
            >
              <div className="relative flex h-36 w-full items-end justify-center sm:h-44">
                <Image
                  src={origin.src}
                  alt={`Made in ${origin.name}`}
                  width={220}
                  height={280}
                  className="h-full w-auto max-w-[140px] object-contain transition-transform duration-500 group-hover:scale-[1.04] sm:max-w-[160px]"
                />
              </div>
              <figcaption className="mt-4">
                <p className="t3 font-medium text-[var(--plum)]">{origin.nameAr}</p>
                <p className="t1 mt-1 tracking-[0.14em] text-[var(--muted)] uppercase" dir="ltr">
                  {origin.name}
                </p>
                <p className="t2 mt-2 text-[var(--ink)]/55">{origin.note}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
