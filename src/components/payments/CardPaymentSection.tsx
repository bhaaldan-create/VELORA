"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { formatPrice } from "@/lib/utils";
import { USD_TO_IQD_RATE } from "@/lib/stripe-public";

type IntentInfo = {
  clientSecret: string;
  paymentIntentId: string;
  amountUsdCents: number;
  amountIqd: number;
};

type Props = {
  paymentMethod: "visa" | "mastercard";
  subtotalIqd: number;
  email: string;
  fullName: string;
  disabled?: boolean;
  onPaid: (paymentIntentId: string) => void;
  onError: (message: string) => void;
};

let stripePromise: Promise<Stripe | null> | null = null;

function getStripeJs(publishableKey: string) {
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}

export function CardPaymentSection(props: Props) {
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [intent, setIntent] = useState<IntentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      setLoading(true);
      setConfigError(null);
      setIntent(null);

      try {
        const cfgRes = await fetch("/api/payments/create-intent");
        const cfg = (await cfgRes.json()) as {
          ok?: boolean;
          configured?: boolean;
          publishableKey?: string | null;
          message?: string;
        };

        if (!cfg.configured || !cfg.publishableKey) {
          if (!cancelled) {
            setConfigError(
              cfg.message ||
                "الدفع بالبطاقة غير مفعّل. أضيفي مفاتيح Stripe في .env.local.",
            );
            setLoading(false);
          }
          return;
        }

        if (!cancelled) setPublishableKey(cfg.publishableKey);

        const res = await fetch("/api/payments/create-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subtotalIqd: props.subtotalIqd,
            paymentMethod: props.paymentMethod,
            email: props.email || undefined,
            fullName: props.fullName || undefined,
          }),
        });
        const data = (await res.json()) as IntentInfo & {
          ok?: boolean;
          error?: string;
        };

        if (!res.ok || !data.ok || !data.clientSecret) {
          throw new Error(data.error || "تعذّر تجهيز الدفع.");
        }

        if (!cancelled) {
          setIntent({
            clientSecret: data.clientSecret,
            paymentIntentId: data.paymentIntentId,
            amountUsdCents: data.amountUsdCents,
            amountIqd: data.amountIqd,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setConfigError(
            err instanceof Error ? err.message : "تعذّر تجهيز الدفع بالبطاقة.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [props.paymentMethod, props.subtotalIqd, props.email, props.fullName]);

  const stripeOpts = useMemo(
    () =>
      publishableKey
        ? {
            clientSecret: intent?.clientSecret,
            appearance: {
              theme: "stripe" as const,
              variables: {
                colorPrimary: "#3D2640",
                borderRadius: "0px",
                fontFamily: "IBM Plex Sans Arabic, system-ui, sans-serif",
              },
            },
          }
        : undefined,
    [publishableKey, intent?.clientSecret],
  );

  if (loading) {
    return (
      <div className="border border-[var(--plum)]/15 bg-[var(--mist)] px-4 py-6">
        <p className="t3 text-[var(--plum)]">جارٍ تجهيز بوابة الدفع الآمنة…</p>
      </div>
    );
  }

  if (configError || !publishableKey || !intent || !stripeOpts?.clientSecret) {
    return (
      <div className="space-y-3 border border-amber-200 bg-amber-50 px-4 py-4 text-amber-950">
        <p className="t3 font-medium">الدفع بالبطاقة يحتاج تفعيل Stripe</p>
        <p className="t2 opacity-90">
          {configError ||
            "أضيفي المفاتيح في .env.local ثم أعيدي تشغيل السيرفر ليصل المبلغ لحساب الشركة عبر Stripe."}
        </p>
        <ol className="t2 list-decimal space-y-1 pe-5 opacity-90">
          <li>أنشئي حساباً على stripe.com واربطي حساب البنك</li>
          <li>
            انسخي{" "}
            <span dir="ltr">STRIPE_SECRET_KEY</span> و{" "}
            <span dir="ltr">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</span>
          </li>
          <li>ضعيهما في ملف .env.local</li>
        </ol>
      </div>
    );
  }

  return (
    <div className="space-y-4 border border-[var(--plum)]/15 bg-white p-4">
      <div>
        <p className="t1 font-medium tracking-[0.12em] text-[var(--muted)]">
          بيانات البطاقة
        </p>
        <p className="t3 mt-2 text-[var(--plum)]">
          أدخلي رقم البطاقة بأمان — الدفع مشفّر عبر Stripe ولا تُحفظ بيانات
          البطاقة على موقعنا.
        </p>
        <p className="t2 mt-2 text-[var(--muted)]">
          المبلغ: {formatPrice(intent.amountIqd)} ≈ $
          {(intent.amountUsdCents / 100).toFixed(2)}{" "}
          <span dir="ltr">(1 USD = {USD_TO_IQD_RATE} IQD)</span>
        </p>
      </div>

      <Elements
        stripe={getStripeJs(publishableKey)}
        options={{
          clientSecret: intent.clientSecret,
          appearance: stripeOpts.appearance,
          locale: "ar",
        }}
      >
        <CardPayForm
          disabled={props.disabled}
          onPaid={props.onPaid}
          onError={props.onError}
        />
      </Elements>
    </div>
  );
}

function CardPayForm({
  disabled,
  onPaid,
  onError,
}: {
  disabled?: boolean;
  onPaid: (paymentIntentId: string) => void;
  onError: (message: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);

  async function handlePay() {
    if (!stripe || !elements) return;

    setBusy(true);
    onError("");

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url:
          typeof window !== "undefined"
            ? `${window.location.origin}/checkout`
            : undefined,
      },
    });

    if (error) {
      onError(error.message || "فشل الدفع. تحققي من بيانات البطاقة.");
      setBusy(false);
      return;
    }

    if (paymentIntent?.status === "succeeded" && paymentIntent.id) {
      onPaid(paymentIntent.id);
    } else {
      onError("لم يكتمل الدفع بعد. حاولي مرة أخرى.");
    }
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <PaymentElement
        options={{
          layout: "tabs",
          paymentMethodOrder: ["card"],
        }}
      />
      <button
        type="button"
        onClick={() => void handlePay()}
        disabled={!stripe || !elements || busy || disabled}
        className="t3 w-full border border-[var(--plum)] bg-[var(--plum)] px-4 py-3 text-[var(--ivory)] disabled:opacity-40"
      >
        {busy ? "جارٍ تأكيد الدفع…" : "ادفعي بالبطاقة الآن"}
      </button>
    </div>
  );
}
