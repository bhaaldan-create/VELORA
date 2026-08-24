import {
  getWaylEnv,
  getWaylWebhookUrl,
  isWaylConfigured,
  isWaylStoreVerifiedFlag,
  verifyWaylApiKey,
} from "@/lib/wayl";
import { Surface } from "@/components/admin/ui/primitives";

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={
        ok
          ? "inline-block h-2 w-2 rounded-full bg-emerald-500"
          : "inline-block h-2 w-2 rounded-full bg-amber-500"
      }
      aria-hidden
    />
  );
}

export async function WaylStatusCard() {
  const configured = isWaylConfigured();
  const env = getWaylEnv();
  const storeFlag = isWaylStoreVerifiedFlag();
  const verified = configured ? await verifyWaylApiKey() : { ok: false as const };
  const checkoutAvailable =
    configured && verified.ok && (env === "test" || storeFlag);

  const rows: { label: string; ok: boolean; detail: string }[] = [
    {
      label: "مفتاح API",
      ok: configured && verified.ok,
      detail: !configured
        ? "غير مضبوط على الخادم"
        : verified.ok
          ? "صالح"
          : "غير صالح — راجعي WAYL_API_KEY",
    },
    {
      label: "البيئة",
      ok: true,
      detail: env === "live" ? "live (إنتاج)" : "test (تجريبي)",
    },
    {
      label: "توثيق المتجر",
      ok: env === "test" || storeFlag,
      detail:
        env === "test"
          ? "غير مطلوب في وضع test"
          : storeFlag
            ? "مفعّل (WAYL_STORE_VERIFIED)"
            : "مطلوب من Wayl قبل التفعيل",
    },
    {
      label: "الظهور في الدفع",
      ok: checkoutAvailable,
      detail: checkoutAvailable
        ? "Wayl متاح للزبائن"
        : "يظهر الدفع عند الاستلام فقط حالياً",
    },
  ];

  return (
    <Surface>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[13px] font-semibold">حالة بوابة Wayl</h2>
          <p className="mt-1 text-[12px] text-[var(--admin-text-muted)]">
            الدفع الإلكتروني يظهر للزبائن فقط عندما يكون المفتاح صالحاً والمتجر
            موثّقاً في وضع live.
          </p>
        </div>
        <span
          className={
            checkoutAvailable
              ? "rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-700"
              : "rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-800"
          }
        >
          {checkoutAvailable ? "مفعّلة" : "بانتظار التفعيل"}
        </span>
      </div>

      <ul className="space-y-2.5">
        {rows.map((row) => (
          <li
            key={row.label}
            className="flex items-start justify-between gap-3 border-b border-[var(--admin-border)] py-2 text-[13px] last:border-0"
          >
            <span className="inline-flex items-center gap-2 font-medium">
              <StatusDot ok={row.ok} />
              {row.label}
            </span>
            <span className="max-w-[60%] text-end text-[12px] text-[var(--admin-text-secondary)]">
              {row.detail}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4 rounded-[12px] bg-[var(--admin-surface-soft)] px-3 py-3 text-[12px] text-[var(--admin-text-secondary)]">
        <p className="font-medium text-[var(--admin-text)]">Webhook</p>
        <p className="mt-1 break-all font-mono text-[11px]" dir="ltr">
          {getWaylWebhookUrl()}
        </p>
        {!checkoutAvailable && env === "live" ? (
          <p className="mt-3 leading-relaxed">
            للتفعيل: أكملي توثيق المتجر في{" "}
            <a
              href="https://dashboard.thewayl.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[var(--admin-plum)] underline-offset-2 hover:underline"
            >
              لوحة Wayl
            </a>
            ، ثم تواصلي مع الدعم (
            <a
              href="https://wa.me/9647752277781"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[var(--admin-plum)] underline-offset-2 hover:underline"
            >
              واتساب
            </a>
            {" / "}
            <a
              href="mailto:support@wayl.io"
              className="font-medium text-[var(--admin-plum)] underline-offset-2 hover:underline"
            >
              support@wayl.io
            </a>
            ). بعد الموافقة أضيفي على Vercel:{" "}
            <code className="rounded bg-white/70 px-1" dir="ltr">
              WAYL_STORE_VERIFIED=true
            </code>{" "}
            وأعيدي النشر.
          </p>
        ) : null}
      </div>
    </Surface>
  );
}
