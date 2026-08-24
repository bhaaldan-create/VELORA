export default function Loading() {
  return (
    <div
      className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 sm:py-14"
      aria-busy
      aria-label="جارٍ التحميل"
    >
      <div className="h-3 w-24 animate-pulse rounded-full bg-[var(--plum)]/10" />
      <div className="mt-4 h-8 w-48 animate-pulse rounded-full bg-[var(--plum)]/12" />
      <div className="mt-3 h-4 w-full max-w-md animate-pulse rounded-full bg-[var(--mist)]" />

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
