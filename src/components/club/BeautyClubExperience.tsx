"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/context/LocaleContext";
import { clubCopy } from "@/components/club/copy";
import {
  ClubIcon,
  IconCheck,
  IconChat,
  IconSpark,
  TierIcon,
} from "@/components/club/icons";
import type {
  ClubConfig,
  ClubMemberState,
  ClubReward,
  ClubTier,
} from "@/lib/club/types";

type ClubPayload = {
  ok: boolean;
  config?: ClubConfig;
  member?: ClubMemberState;
  error?: string;
};

function tierName(tier: ClubTier | undefined, ar: boolean) {
  if (!tier) return ar ? "بريفيه" : "Privé";
  return ar ? tier.nameAr : tier.nameEn;
}

function ctaLabel(cta: ClubReward["cta"], copy: ReturnType<typeof clubCopy>) {
  if (cta === "reveal") return copy.revealCta;
  if (cta === "unlock") return copy.unlock;
  return copy.redeem;
}

export function BeautyClubExperience() {
  const { locale } = useLocale();
  const ar = locale !== "en";
  const copy = clubCopy(ar);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<ClubConfig | null>(null);
  const [member, setMember] = useState<ClubMemberState | null>(null);
  const [copied, setCopied] = useState(false);
  const [mysteryBlur, setMysteryBlur] = useState(false);
  const [mysteryResult, setMysteryResult] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    title: string;
    body: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/auth/club")
      .then(async (r) => {
        const data = (await r.json()) as ClubPayload;
        if (cancelled) return;
        if (!r.ok || !data.ok || !data.config || !data.member) {
          setError(data.error || (ar ? "تعذّر التحميل." : "Failed to load."));
          return;
        }
        setConfig(data.config);
        setMember(data.member);
      })
      .catch(() => {
        if (!cancelled) setError(ar ? "تعذّر التحميل." : "Failed to load.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ar]);

  const currentTier = useMemo(() => {
    if (!config || !member) return null;
    return config.tiers.find((t) => t.id === member.tierId) ?? config.tiers[0]!;
  }, [config, member]);

  const nextTier = useMemo(() => {
    if (!config || !member?.nextTierId) return null;
    return config.tiers.find((t) => t.id === member.nextTierId) ?? null;
  }, [config, member]);

  async function copyCode() {
    if (!member) return;
    try {
      await navigator.clipboard.writeText(member.referralCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  function shareCode() {
    if (!member) return;
    const text = `${member.referralCode} — VELORA Beauty Club`;
    if (navigator.share) {
      void navigator.share({ title: "VELORA", text });
      return;
    }
    void copyCode();
  }

  function openReward(reward: ClubReward) {
    setSuccess({
      title: copy.rewardUnlocked,
      body: `${ar ? reward.titleAr : reward.titleEn}\n${copy.rewardAdded}`,
    });
  }

  function revealMystery() {
    if (!config?.mysteryPool.length) return;
    setMysteryBlur(true);
    window.setTimeout(() => {
      const pick =
        config.mysteryPool[
          Math.floor(Math.random() * config.mysteryPool.length)
        ]!;
      setMysteryResult(ar ? pick.titleAr : pick.titleEn);
      setMysteryBlur(false);
    }, 420);
  }

  if (loading) {
    return (
      <div className="club-shell">
        <div className="club-frame">
          <p className="mb-4 text-center text-[0.88rem] text-[var(--club-muted)]">
            {copy.loading}
          </p>
          <div className="club-skeleton" />
          <div className="club-skeleton mt-4 !h-28" />
        </div>
      </div>
    );
  }

  if (error || !config || !member || !currentTier) {
    return (
      <div className="club-shell">
        <div className="club-frame text-center">
          <p className="text-[0.95rem] text-[var(--club-muted)]">
            {error || (ar ? "تعذّر التحميل." : "Failed to load.")}
          </p>
          <Link href="/account" className="club-back mt-4">
            ← {copy.back}
          </Link>
        </div>
      </div>
    );
  }

  const wa = config.conciergeWhatsApp.replace(/\D/g, "");
  const monthsLeft = Math.max(
    0,
    config.streakMonthsRequired - member.streakMonths,
  );

  return (
    <div className="club-shell" dir={ar ? "rtl" : "ltr"}>
      <div className="club-frame">
        <Link href="/account" className="club-back">
          ← {copy.back}
        </Link>

        {/* Hero */}
        <header className="club-hero">
          <p className="club-brand">VELORA</p>
          <h1 className="club-title">{copy.clubTitle}</h1>
          <p className="club-sub">{copy.subtitleEnLine}</p>
          {ar ? <p className="club-sub-ar">{copy.subtitle}</p> : null}
        </header>

        {/* Membership card */}
        <article className="club-member-card" aria-label="Membership card">
          <div className="club-member-top">
            <div className="club-member-tier">
              <TierIcon id={currentTier.id} size={16} />
              VELORA {currentTier.nameEn.toUpperCase()}
            </div>
            <IconSpark size={16} className="opacity-70" />
          </div>
          <div className="club-member-line" />
          <p className="text-[0.78rem] opacity-80">
            {copy.member}: {member.fullName}
          </p>
          <p className="club-member-points mt-3">
            {member.points.toLocaleString(ar ? "ar-IQ" : "en-US")}
            <span>V•POINTS</span>
          </p>
          <div className="club-member-meta">
            <span>
              {copy.memberId}
              <br />
              {member.memberId}
            </span>
            <span className="text-end opacity-70">✦</span>
          </div>
        </article>

        {/* Journey */}
        <section className="club-section">
          <div className="club-section-head">
            <h2>{copy.journey}</h2>
          </div>
          <div className="club-panel">
            <p className="text-[0.95rem] font-semibold tracking-[0.04em]">
              {member.points.toLocaleString(ar ? "ar-IQ" : "en-US")}
              {member.nextTierId
                ? ` / ${(nextTier?.minPoints ?? 3000).toLocaleString(ar ? "ar-IQ" : "en-US")}`
                : ""}{" "}
              <span className="text-[0.75rem] font-medium tracking-[0.14em] text-[var(--club-muted)]">
                V•POINTS
              </span>
            </p>
            <div className="club-progress-track mt-3">
              <div
                className="club-progress-fill"
                style={{
                  width: `${Math.round(
                    (member.nextTierId ? member.progressRatio : 1) * 100,
                  )}%`,
                }}
              />
            </div>
            <p className="mt-3 text-[0.82rem] text-[var(--club-muted)]">
              {member.nextTierId
                ? copy.toNext(
                    member.pointsToNext,
                    `VELORA ${tierName(nextTier ?? undefined, ar)}`,
                  )
                : ar
                  ? "أنتِ في أعلى مستوى — بريفيه"
                  : "You’re at the highest tier — Privé"}
            </p>
            <div className="mt-4 rounded-[18px] border border-[var(--club-border)] bg-[var(--club-lilac)]/55 px-4 py-3">
              <p className="text-[0.7rem] tracking-[0.12em] text-[var(--club-muted)] uppercase">
                {copy.nextPrivilege}
              </p>
              <p className="mt-1.5 flex items-center gap-2 text-[0.92rem] font-semibold">
                <TierIcon id={nextTier?.id ?? "prive"} size={15} />
                {ar ? member.nextPrivilegeAr : member.nextPrivilegeEn}
              </p>
            </div>
          </div>
        </section>

        {/* Points */}
        <section className="club-section">
          <div className="club-panel text-center">
            <p className="text-[2.4rem] font-semibold tracking-[0.04em] leading-none">
              {member.points.toLocaleString(ar ? "ar-IQ" : "en-US")}
            </p>
            <p className="mt-2 text-[0.72rem] tracking-[0.22em] text-[var(--club-muted)]">
              {copy.pointsLabel}
            </p>
            <p className="mx-auto mt-3 max-w-sm text-[0.88rem] text-[var(--club-muted)]">
              {copy.pointsTagline}
            </p>
            <div className="club-grid-3 mt-5 text-start">
              <div className="club-micro">
                <ClubIcon name="spark" size={16} />
                <p className="value">
                  +{member.earnedThisMonth.toLocaleString(ar ? "ar-IQ" : "en-US")}
                </p>
                <p className="label">{copy.earnedMonth}</p>
              </div>
              <div className="club-micro">
                <ClubIcon name="star" size={16} />
                <p className="value">
                  +{member.fromReviews.toLocaleString(ar ? "ar-IQ" : "en-US")}
                </p>
                <p className="label">{copy.fromReviews}</p>
              </div>
              <div className="club-micro">
                <ClubIcon name="link" size={16} />
                <p className="value">
                  +{member.fromReferrals.toLocaleString(ar ? "ar-IQ" : "en-US")}
                </p>
                <p className="label">{copy.fromReferrals}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Rewards */}
        <section className="club-section">
          <div className="club-section-head">
            <h2>{copy.rewards}</h2>
            <p>{copy.rewardsSub}</p>
          </div>
          {config.rewards.length === 0 ? (
            <div className="club-panel text-center">
              <p className="text-[0.9rem] text-[var(--club-muted)]">
                {copy.emptyRewards}
              </p>
              <Link href="/shop" className="club-btn club-btn-primary mt-4">
                {copy.emptyCta}
              </Link>
            </div>
          ) : (
            <div className="club-rewards">
              {config.rewards.map((reward) => {
                const can = member.points >= reward.cost;
                return (
                  <article key={reward.id} className="club-reward">
                    <p className="cost">
                      {reward.cost.toLocaleString(ar ? "ar-IQ" : "en-US")}{" "}
                      V•POINTS
                    </p>
                    <h3>{ar ? reward.titleAr : reward.titleEn}</h3>
                    <p>{ar ? reward.subtitleAr : reward.subtitleEn}</p>
                    <button
                      type="button"
                      className="club-btn club-btn-primary mt-4 w-full"
                      disabled={!can}
                      onClick={() => openReward(reward)}
                    >
                      {ctaLabel(reward.cta, copy)}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Privileges */}
        <section className="club-section">
          <div className="club-section-head">
            <h2>{copy.privileges}</h2>
          </div>
          <div className="club-grid-2">
            {config.privileges.map((p) => (
              <div key={p.id} className="club-panel !p-4">
                <ClubIcon name={p.icon} size={17} />
                <h3 className="mt-2 text-[0.9rem] font-semibold">
                  {ar ? p.titleAr : p.titleEn}
                </h3>
                <p className="mt-1 text-[0.78rem] leading-relaxed text-[var(--club-muted)]">
                  {ar ? p.bodyAr : p.bodyEn}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Passport */}
        <section className="club-section">
          <div className="club-section-head">
            <h2>{copy.passport}</h2>
            <p>{copy.passportSub}</p>
          </div>
          <div className="club-panel">
            <div className="club-stamps">
              {config.passportBrands.map((b) => {
                const on = member.passportUnlocked.includes(b.id);
                return (
                  <span
                    key={b.id}
                    className={`club-stamp ${on ? "is-on" : ""}`}
                  >
                    {b.name}
                    {on ? <IconCheck size={13} /> : null}
                  </span>
                );
              })}
            </div>
            {member.passportUnlocked.length >=
            Math.min(3, config.passportBrands.length) ? (
              <p className="mt-4 text-[0.88rem] font-semibold">
                {copy.explorer} · +{config.passportRewardPoints} V•POINTS
              </p>
            ) : null}
          </div>
        </section>

        {/* Invite */}
        <section className="club-section">
          <div className="club-section-head">
            <h2>{copy.invite}</h2>
            <p>{copy.inviteSub}</p>
          </div>
          <div className="club-panel">
            <p className="text-[0.78rem] text-[var(--club-muted)]">
              {copy.referralCode}
            </p>
            <p className="mt-2 font-semibold tracking-[0.08em]">
              {member.referralCode}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="club-btn club-btn-primary"
                onClick={() => void copyCode()}
              >
                {copied ? copy.copied : copy.copy}
              </button>
              <button
                type="button"
                className="club-btn club-btn-secondary"
                onClick={shareCode}
              >
                {copy.share}
              </button>
            </div>
            <p className="mt-4 text-[0.82rem] text-[var(--club-muted)]">
              {member.referralCount} {copy.referralsOk} · +
              {member.fromReferrals.toLocaleString(ar ? "ar-IQ" : "en-US")}{" "}
              V•POINTS
            </p>
          </div>
        </section>

        {/* Streak */}
        <section className="club-section">
          <div className="club-section-head">
            <h2>{copy.streak}</h2>
          </div>
          <div className="club-panel">
            <p className="text-center text-[1.4rem] font-semibold tracking-[0.12em]">
              {member.streakMonths} {copy.months}
            </p>
            <div className="club-streak mt-5">
              {[1, 2, 3].map((m) => (
                <div
                  key={m}
                  className={`club-checkpoint ${member.streakMonths >= m ? "is-done" : ""}`}
                >
                  <div className="dot">
                    {member.streakMonths >= m ? (
                      <IconCheck size={14} />
                    ) : (
                      m
                    )}
                  </div>
                  <p className="cap">
                    {ar ? `شهر ${m}` : `Month ${m}`}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-[0.82rem] text-[var(--club-muted)]">
              {copy.streakNext(monthsLeft)}
            </p>
          </div>
        </section>

        {/* Mystery */}
        <section className="club-section">
          <div className="club-mystery">
            <h2 className="text-[0.95rem] font-semibold tracking-[0.12em] uppercase">
              {copy.mystery}
            </h2>
            <div
              className={`club-mystery-card mt-4 ${mysteryBlur ? "is-blur" : ""}`}
            >
              <IconSpark size={22} className="mx-auto opacity-70" />
              <p className="mt-3 text-[1.05rem] font-semibold tracking-[0.04em]">
                {mysteryResult || "✦"}
              </p>
            </div>
            <button
              type="button"
              className="club-btn club-btn-primary mt-5"
              onClick={revealMystery}
              aria-busy={mysteryBlur}
            >
              {copy.reveal}
            </button>
          </div>
        </section>

        {/* Birthday */}
        <section className="club-section">
          <div className="club-section-head">
            <h2>{copy.birthday}</h2>
            <p>{copy.birthdaySub}</p>
          </div>
          <div className="club-panel flex items-center gap-4">
            <ClubIcon name="gift" size={22} />
            <div>
              <p className="text-[0.72rem] tracking-[0.14em] text-[var(--club-muted)] uppercase">
                {currentTier.nameEn}
              </p>
              <p className="mt-1 font-semibold">
                {ar
                  ? currentTier.birthdayGiftAr
                  : currentTier.birthdayGiftEn}
              </p>
            </div>
          </div>
        </section>

        {/* Privé */}
        {member.tierId === "prive" ? (
          <section className="club-section">
            <div className="club-section-head">
              <h2>{copy.prive}</h2>
              <p>{copy.priveSub}</p>
            </div>
            <div className="club-panel">
              <ul className="grid gap-2 sm:grid-cols-2">
                {(ar ? config.priveBenefitsAr : config.priveBenefitsEn).map(
                  (b) => (
                    <li
                      key={b}
                      className="flex items-center gap-2 text-[0.88rem]"
                    >
                      <TierIcon id="prive" size={14} />
                      {b}
                    </li>
                  ),
                )}
              </ul>
            </div>
          </section>
        ) : null}

        {/* Concierge */}
        <section className="club-section">
          <div className="club-panel text-center">
            <IconChat size={22} className="mx-auto" />
            <h2 className="mt-3 text-[0.95rem] font-semibold tracking-[0.12em] uppercase">
              {copy.concierge}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-[0.88rem] text-[var(--club-muted)]">
              {copy.conciergeSub}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <a
                href={`https://wa.me/${wa}`}
                target="_blank"
                rel="noreferrer"
                className="club-btn club-btn-primary"
              >
                {copy.talk}
              </a>
              <Link href="/advisor" className="club-btn club-btn-secondary">
                LARSA
              </Link>
            </div>
          </div>
        </section>

        {/* Earn */}
        <section className="club-section">
          <div className="club-section-head">
            <h2>{copy.earn}</h2>
          </div>
          <div className="club-grid-2 sm:!grid-cols-3">
            {config.earnCards.map((c) => (
              <div key={c.id} className="club-panel !p-4">
                <ClubIcon name={c.icon} size={17} />
                <h3 className="mt-2 text-[0.78rem] font-semibold tracking-[0.12em]">
                  {ar ? c.titleAr : c.titleEn}
                </h3>
                <p className="mt-1 text-[0.78rem] text-[var(--club-muted)]">
                  {ar ? c.bodyAr : c.bodyEn}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Activity */}
        <section className="club-section">
          <div className="club-section-head">
            <h2>{copy.activity}</h2>
          </div>
          <div className="club-panel">
            {member.activity.length === 0 ? (
              <div className="text-center">
                <p className="text-[0.88rem] text-[var(--club-muted)]">
                  {copy.emptyActivity}
                </p>
                <Link href="/shop" className="club-btn club-btn-primary mt-4">
                  {copy.emptyCta}
                </Link>
              </div>
            ) : (
              <div className="club-timeline">
                {member.activity.map((item) => (
                  <div key={item.id} className="club-timeline-row">
                    <div>
                      <p className="text-[0.88rem]">
                        {ar ? item.labelAr : item.labelEn}
                      </p>
                    </div>
                    <p
                      className={
                        item.delta >= 0 ? "club-delta-pos" : "club-delta-neg"
                      }
                    >
                      {item.delta >= 0 ? "+" : ""}
                      {item.delta.toLocaleString(ar ? "ar-IQ" : "en-US")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {success ? (
        <div
          className="club-modal"
          role="dialog"
          aria-modal="true"
          onClick={() => setSuccess(null)}
        >
          <div
            className="club-modal-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <IconSpark size={22} className="mx-auto" />
            <h3 className="mt-3 text-[1.05rem] font-semibold tracking-[0.1em]">
              {success.title}
            </h3>
            <p className="mt-3 whitespace-pre-line text-[0.9rem] text-[var(--club-muted)]">
              {success.body}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link
                href="/shop"
                className="club-btn club-btn-primary"
                onClick={() => setSuccess(null)}
              >
                {copy.continueShop}
              </Link>
              <button
                type="button"
                className="club-btn club-btn-secondary"
                onClick={() => setSuccess(null)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
