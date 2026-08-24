export default function ProductLoading() {
  return (
    <div
      className="mx-auto max-w-7xl px-5 py-6 sm:px-8 sm:py-10"
      aria-busy
      aria-label="جارٍ تحميل المنتج"
    >
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
        <div className="aspect-[4/5] animate-pulse rounded-[2rem] bg-[var(--mist)]" />
        <div>
          <div className="h-8 w-3/4 animate-pulse rounded-full bg-[var(--plum)]/12" />
          <div className="mt-3 h-4 w-1/2 animate-pulse rounded-full bg-[var(--mist)]" />
          <div className="mt-8 h-10 w-40 animate-pulse rounded-full bg-[var(--plum)]/10" />
          <div className="mt-6 h-12 w-full max-w-sm animate-pulse rounded-full bg-[var(--mist)]" />
        </div>
      </div>
    </div>
  );
}
