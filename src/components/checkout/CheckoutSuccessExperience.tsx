"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { IconWhatsApp } from "@/components/contact/SocialIcons";
import { VeloraRose } from "@/components/checkout/VeloraRose";
import {
  IconArrowStart,
  IconCheck,
  IconCopy,
} from "@/components/checkout/CheckoutIcons";
import { brand } from "@/constants/brand";
import { ui } from "@/constants/brand";
import { getDefaultWhatsAppUrl } from "@/lib/social-links";
import { cn } from "@/lib/utils";

type Props = {
  orderId: string | null;
  notice?: string | null;
  paid?: boolean;
};

export function CheckoutSuccessExperience({
  orderId,
  notice,
  paid,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [stage, setStage] = useState(0);
  const waUrl = getDefaultWhatsAppUrl("ar");

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setStage(1), 120),
      window.setTimeout(() => setStage(2), 380),
      window.setTimeout(() => setStage(3), 620),
      window.setTimeout(() => setStage(4), 880),
      window.setTimeout(() => setStage(5), 1100),
    ];
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  async function copyOrderId() {
    if (!orderId) return;
    try {
      await navigator.clipboard.writeText(orderId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-lg flex-col items-center justify-center px-5 py-12 text-center sm:py-16 motion-safe:animate-[velora-fade_0.4s_ease-out_both]"
    >
      <div
        className={cn(
          "transition-all duration-500 ease-out",
          stage >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
        )}
      >
        <VeloraRose />
      </div>

      <div
        className={cn(
          "mt-6 transition-all duration-500 ease-out",
          stage >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
        )}
      >
        <h1 className="font-display text-[clamp(1.65rem,4vw,2rem)] font-medium text-[var(--plum)]">
          شكرًا لاختياركِ VELORA
        </h1>
        <p className="t4 mt-3 text-[var(--ink)]/80">
          {paid ? "تم تأكيد دفعكِ بنجاح." : "تم تأكيد طلبكِ بنجاح."}
        </p>
        <p className="t3 mt-4 leading-relaxed text-[var(--muted)]">
          سيبدأ فريق VELORA الآن بتجهيز طلبكِ{" "}
          <span className="font-medium text-[var(--plum)]">بعناية</span>،
          وسنرسل لكِ رقم التتبع والوصل عبر واتساب فور تجهيز الطلب.
        </p>
      </div>

      {notice ? (
        <p
          className={cn(
            "t3 mt-5 rounded-[14px] border border-[var(--plum)]/12 bg-[var(--surface)] px-4 py-3 text-[var(--plum)] transition-all duration-500",
            stage >= 3 ? "opacity-100" : "opacity-0",
          )}
        >
          {notice}
        </p>
      ) : null}

      <div
        className={cn(
          "mt-8 w-full space-y-4 transition-all duration-500 ease-out",
          stage >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        )}
      >
        {orderId ? (
          <div className="rounded-[16px] border border-[var(--plum)]/10 bg-[var(--surface)] px-5 py-4">
            <p className="t2 text-[var(--muted)]">رقم الطلب</p>
            <div className="mt-1 flex items-center justify-center gap-2">
              <span
                className="font-display text-[1.25rem] font-semibold text-[var(--plum)]"
                dir="ltr"
              >
                {orderId}
              </span>
              <button
                type="button"
                onClick={copyOrderId}
                className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--mist)] hover:text-[var(--plum)]"
                aria-label="نسخ رقم الطلب"
              >
                <IconCopy />
              </button>
            </div>
            {copied ? (
              <p className="t2 mt-1 text-[var(--plum)]/75">تم النسخ</p>
            ) : null}
          </div>
        ) : null}

        <StatusCard
          title="حالة الطلب"
          status="تم استلام الطلب"
          detail="سيبدأ فريق VELORA بتجهيزه الآن."
        />

        <WhatsAppInfoBlock />

        <p className="t3 rounded-[14px] border border-[var(--plum)]/8 bg-[var(--mist)]/40 px-4 py-3 text-[var(--muted)]">
          سيتم إرسال رقم التتبع عبر واتساب بعد تجهيز الطلب.
        </p>
      </div>

      <div
        className={cn(
          "mt-10 flex w-full flex-col gap-3 sm:flex-row sm:justify-center transition-all duration-500",
          stage >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        )}
      >
        {waUrl ? (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="t3 inline-flex items-center justify-center gap-2 rounded-[14px] border border-[var(--plum)]/15 bg-[var(--surface)] px-6 py-3 font-medium text-[var(--plum)] transition-colors hover:bg-[var(--mist)]/60"
          >
            <IconWhatsApp size={18} className="text-[#3d8b6e]" />
            <span>التواصل عبر واتساب</span>
          </a>
        ) : null}
        <Link
          href="/shop"
          className="t3 inline-flex items-center justify-center gap-2 rounded-[14px] border border-[var(--plum)]/12 px-6 py-3 font-medium text-[var(--plum)] transition-colors hover:bg-[var(--mist)]/50"
        >
          <span>{ui.continueShopping}</span>
          <IconArrowStart />
        </Link>
      </div>

      <p
        className={cn(
          "t1 mt-10 font-latin tracking-[0.28em] text-[var(--muted)]/70 uppercase transition-opacity duration-500",
          stage >= 5 ? "opacity-100" : "opacity-0",
        )}
      >
        {brand.tagline}
      </p>
    </div>
  );
}

function StatusCard({
  title,
  status,
  detail,
}: {
  title: string;
  status: string;
  detail: string;
}) {
  return (
    <div className="rounded-[16px] border border-[var(--plum)]/10 bg-[var(--surface)] px-5 py-4 text-start">
      <p className="t2 text-[var(--muted)]">{title}</p>
      <div className="mt-2 flex items-start gap-2.5">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--plum)]/10 text-[var(--plum)]">
          <IconCheck className="h-3 w-3" />
        </span>
        <div>
          <p className="t4 font-medium text-[var(--plum)]">{status}</p>
          <p className="t3 mt-0.5 text-[var(--muted)]">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function WhatsAppInfoBlock() {
  const items = [
    "رقم التتبع",
    "وصل الطلب",
    "تحديثات حالة الشحن",
  ];

  return (
    <div className="rounded-[16px] border border-[var(--plum)]/8 bg-[var(--ivory)] px-5 py-4 text-start">
      <p className="t3 font-medium text-[var(--plum)]">سيصلكِ عبر واتساب:</p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2 t3 text-[var(--muted)]">
            <IconCheck className="h-3.5 w-3.5 shrink-0 text-[var(--plum)]/60" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CheckoutErrorState({
  onRetry,
  message,
}: {
  onRetry: () => void;
  message?: string | null;
}) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-5 py-16 text-center">
      <h1 className="font-display text-[1.5rem] font-medium text-[var(--plum)]">
        تعذر تأكيد الطلب
      </h1>
      <p className="t4 mt-4 leading-relaxed text-[var(--muted)]">
        {message?.trim() ||
          "حدث خطأ أثناء إرسال طلبك. يرجى المحاولة مرة أخرى."}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="t3 mt-8 rounded-[14px] bg-[var(--plum)] px-8 py-3 font-medium text-[var(--ivory)] transition-all active:scale-[0.99]"
      >
        المحاولة مرة أخرى
      </button>
    </div>
  );
}

export function CheckoutImmersiveShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-[var(--ivory)] min-h-[calc(100vh-4rem)]">
      {children}
    </div>
  );
}
