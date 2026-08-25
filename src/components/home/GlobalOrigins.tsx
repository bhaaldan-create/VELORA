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
  {
    src: "/brand/origins/britain.png",
    name: "Britain",
    nameAr: "بريطانيا",
    note: "تراث وجودة أصيلة",
  },
] as const;

export function GlobalOrigins() {
  return (
    <section className="bg-[var(--background)] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="t1 font-medium tracking-[0.2em] text-[var(--muted)]">
            الصفحة الرئيسية · اختيار عالمي
          </p>
          <h2 className="font-display mt-2 text-[clamp(1.55rem,3.6vw,2.1rem)] font-bold leading-snug text-[var(--plum)]">
            منتجات من أفضل البراندات حول العالم
          </h2>
          <p className="t3 mt-3 text-[var(--ink)]/70">
            في VELORA نختار لكِ بعناية من فرنسا، إيطاليا، ألمانيا، أمريكا، كوريا،
            وبريطانيا — لتجربة تجميل عالمية بمعايير فاخرة.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-3 items-end gap-4 sm:mt-12 sm:gap-6 md:gap-8">
          {origins.map((origin, i) => (
            <figure
              key={origin.name}
              className="group flex flex-col items-center text-center motion-safe:animate-[velora-rise_0.9s_ease-out_forwards]"
              style={{ animationDelay: `${0.06 * i}s` }}
            >
              <div className="relative flex h-28 w-full items-end justify-center sm:h-36 md:h-40">
                <Image
                  src={origin.src}
                  alt={`Made in ${origin.name}`}
                  width={220}
                  height={280}
                  className="h-full w-auto max-w-[100px] object-contain transition-transform duration-500 group-hover:scale-[1.04] sm:max-w-[130px] md:max-w-[150px]"
                />
              </div>
              <figcaption className="mt-3 sm:mt-4">
                <p className="t3 font-medium text-[var(--plum)]">
                  {origin.nameAr}
                </p>
                <p
                  className="t1 mt-1 tracking-[0.14em] text-[var(--muted)] uppercase"
                  dir="ltr"
                >
                  {origin.name}
                </p>
                <p className="t2 mt-1.5 hidden text-[var(--ink)]/55 sm:block">
                  {origin.note}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
