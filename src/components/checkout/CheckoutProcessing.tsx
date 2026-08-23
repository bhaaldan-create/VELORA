import { IconPackageCheck } from "@/components/checkout/CheckoutIcons";

export function CheckoutProcessing() {
  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-[var(--ivory)] px-5 motion-safe:animate-[velora-fade_0.3s_ease-out_both]"
      role="status"
      aria-live="polite"
      aria-label="جاري تجهيز طلبك"
    >
      <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-[var(--plum)]/12 bg-[var(--surface)] text-[var(--plum)]">
        <IconPackageCheck className="motion-safe:animate-[velora-rose-float_2s_ease-in-out_infinite]" />
        <span
          className="absolute inset-0 rounded-full border border-[var(--plum)]/10 motion-safe:animate-ping"
          aria-hidden
        />
      </div>
      <p className="font-display mt-8 text-[1.35rem] font-medium text-[var(--plum)]">
        جاري تجهيز طلبك…
      </p>
      <p className="t3 mt-2 text-[var(--muted)]">
        لحظة من الرقة والعناية
      </p>
    </div>
  );
}
