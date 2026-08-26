"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "@/context/LocaleContext";
import { ACHIEVEMENT_DEFS } from "@/lib/my-velora/types";
import "./my-velora.css";

type CardRow = {
  id: string;
  orderId: string | null;
  styleKey: string;
  themeKey: string;
  pointsEarned: number;
  productCount: number;
  brandCount: number;
  generatedAt: string;
  sharedAt: string | null;
};

type Journey = {
  totalOrders: number;
  totalProducts: number;
  brandsTried: number;
  totalPoints: number;
  hasEligibleOrders: boolean;
};

type AchievementRow = {
  achievementKey: string;
  unlockedAt: string;
};

export function MyVeloraHub() {
  const { locale } = useLocale();
  const ar = locale === "ar";
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<CardRow[]>([]);
  const [journey, setJourney] = useState<Journey | null>(null);
  const [achievements, setAchievements] = useState<AchievementRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/auth/my-velora");
        const data = (await res.json()) as {
          ok?: boolean;
          cards?: CardRow[];
          journey?: Journey;
          achievements?: AchievementRow[];
          error?: string;
        };
        if (!res.ok || !data.ok) throw new Error(data.error || "Failed");
        setCards(data.cards ?? []);
        setJourney(data.journey ?? null);
        setAchievements(data.achievements ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <p className="py-20 text-center text-[0.9rem] text-[#8B7A92]">
        {ar ? "جارٍ التحميل…" : "Loading…"}
      </p>
    );
  }

  if (error) {
    return (
      <p className="py-20 text-center text-red-700">{error}</p>
    );
  }

  const hasCards = cards.length > 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10" dir={ar ? "rtl" : "ltr"}>
      <Link
        href="/account/my-velora/passport"
        className="block overflow-hidden rounded-[8px] border border-[#DCD3F5] bg-gradient-to-br from-[#FAF9FC] via-[#F5F1FB] to-[#E8E0F8] px-5 py-10 text-center shadow-[0_24px_70px_rgba(90,74,122,0.14)] transition hover:-translate-y-0.5"
      >
        <p className="font-latin text-[0.58rem] tracking-[0.42em] text-[#7E68B5]">
          MY VELORA PASSPORT
        </p>
        <p className="font-display mt-3 text-[1.5rem] tracking-[0.06em] text-[#24202B]">
          {ar ? "جوازكِ الرقمي" : "Your Digital Passport"}
        </p>
        <p className="mx-auto mt-2 max-w-xs text-[0.8rem] leading-relaxed text-[#777080]">
          {ar
            ? "هويتكِ داخل عالم VELORA — المستوى، XP، الإنجازات، والتحقق."
            : "Your identity inside VELORA — level, XP, achievements, and verification."}
        </p>
        <span className="mt-6 inline-flex rounded-full bg-[#24202B] px-7 py-2.5 font-latin text-[0.62rem] tracking-[0.28em] text-white uppercase">
          {ar ? "فتح الجواز" : "Open Passport"}
        </span>
      </Link>

      <div className="mt-12 text-center">
        <p className="font-latin text-[0.58rem] tracking-[0.38em] text-[#8B7A92]">
          MY VELORA CARDS
        </p>
        <h1 className="font-display mt-2 text-[1.35rem] font-semibold text-[#3D2640]">
          {ar ? "بطاقات طلباتك" : "Your order cards"}
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-[0.82rem] text-[#8B7A92]">
          {ar
            ? "لحظات جمالكِ الجاهزة للمشاركة بعد كل طلب."
            : "Share-ready beauty moments from your orders."}
        </p>
      </div>

      {!hasCards ? (
        <div className="mv-fade-in mt-12 rounded-[28px] border border-[#E5DAEE] bg-white/80 px-8 py-16 text-center">
          <p className="text-[1.4rem] text-[#C4A8D8]">✦</p>
          <h2 className="mt-4 font-display text-[1.15rem] text-[#3D2640]">
            {ar
              ? "أول لحظة VELORA بانتظارك ✦"
              : "Your first VELORA moment is waiting ✦"}
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-[0.9rem] text-[#8B7A92]">
            {ar
              ? "عندما يصل طلبك، ستظهر بطاقتك الجاهزة للمشاركة هنا."
              : "When your order arrives, your share-ready card will appear here."}
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-flex rounded-full bg-[#3D2640] px-6 py-2.5 text-[0.85rem] text-white"
          >
            {ar ? "اكتشفي VELORA" : "Discover VELORA"}
          </Link>
        </div>
      ) : (
        <div className="mt-10 space-y-4">
          {cards.map((card) => (
            <Link
              key={card.id}
              href={`/account/my-velora/${card.orderId}`}
              className="mv-slide-up block rounded-[22px] border border-[#E5DAEE] bg-white/85 px-5 py-5 transition-colors hover:bg-[#F8F2FB]"
            >
              <p className="font-latin text-[0.78rem] text-[#8B7A92]" dir="ltr">
                #{card.orderId}
              </p>
              <p className="mt-1 text-[1rem] font-medium text-[#3D2640]">
                {ar ? "بطاقتك جاهزة ✦" : "Your VELORA Card is Ready ✦"}
              </p>
              <p className="mt-2 text-[0.85rem] text-[#7A6880]">
                {card.productCount} {ar ? "منتج" : "products"} · {card.brandCount}{" "}
                {ar ? "علامة" : "brands"} · +{card.pointsEarned}{" "}
                {ar ? "نقطة" : "pts"}
              </p>
            </Link>
          ))}
        </div>
      )}

      <section className="mt-14">
        <h2 className="font-display text-center text-[1.2rem] text-[#3D2640]">
          {ar ? "MY VELORA JOURNEY" : "MY VELORA JOURNEY"}
        </h2>
        {journey?.hasEligibleOrders ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { n: journey.totalOrders, label: ar ? "طلبات" : "Orders" },
              { n: journey.brandsTried, label: ar ? "علامات" : "Brands" },
              { n: journey.totalProducts, label: ar ? "منتجات" : "Products" },
              { n: journey.totalPoints, label: ar ? "نقاط" : "Points" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[18px] border border-[#E5DAEE] bg-white/80 px-3 py-4 text-center"
              >
                <p className="font-latin text-[1.35rem] font-semibold text-[#3D2640]">
                  {item.n.toLocaleString()}
                </p>
                <p className="mt-1 text-[0.72rem] tracking-[0.16em] text-[#8B7A92] uppercase">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-center text-[0.88rem] text-[#8B7A92]">
            {ar
              ? "رحلتك مع VELORA ستنمو مع كل طلب."
              : "Your VELORA Journey will grow with every order."}
          </p>
        )}
      </section>

      {achievements.length ? (
        <section className="mt-12">
          <h2 className="font-display text-center text-[1.1rem] text-[#3D2640]">
            {ar ? "إنجازاتك" : "Achievements"}
          </h2>
          <div className="mt-5 space-y-2">
            {achievements.map((a) => {
              const def = ACHIEVEMENT_DEFS.find((d) => d.key === a.achievementKey);
              return (
                <div
                  key={a.achievementKey}
                  className="rounded-[18px] border border-[#E5DAEE] bg-white/75 px-4 py-3"
                >
                  <p className="font-latin text-[0.82rem] font-semibold tracking-[0.12em] text-[#3D2640]">
                    {def ? (ar ? def.nameAr : def.nameEn) : a.achievementKey}
                  </p>
                  <p className="mt-1 text-[0.78rem] text-[#8B7A92]">
                    {def ? (ar ? def.descAr : def.descEn) : ""}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
