export default function SearchLoading() {
  return (
    <div
      className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16"
      aria-busy
      aria-label="جارٍ تحميل البحث"
    >
      <div className="h-8 w-36 animate-pulse rounded-full bg-[var(--plum)]/12" />
      <div className="mt-6 h-12 w-full max-w-xl animate-pulse rounded-2xl bg-[var(--mist)]" />
      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-[1.25rem]">
            <div className="aspect-[3/4] animate-pulse bg-[var(--mist)]" />
            <div className="mt-2.5 h-3 w-2/3 animate-pulse rounded-full bg-[var(--plum)]/10" />
            <div className="mt-2 h-3 w-1/3 animate-pulse rounded-full bg-[var(--mist)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
