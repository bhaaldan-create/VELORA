"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/context/LocaleContext";
import { ClubLogo } from "@/components/club/ClubLogo";
import { clubCopy, privilegeTierBadge } from "@/components/club/copy";
import {
  ClubIcon,
  IconChat,
  IconCrown,
  IconGift,
  IconHistory,
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

function tierLabel(tier: ClubTier | undefined, ar: boolean) {
  if (!tier) return "Privé";
  return ar ? tier.nameAr : tier.nameEn;
}

function ctaLabel(cta: ClubReward["cta"], copy: ReturnType<typeof clubCopy>) {
  if (cta === "reveal") return copy.revealCta;
  if (cta === "unlock") return copy.unlock;
  return copy.redeem;
}

function firstName(full: string) {
  return full.trim().split(/\s+/)[0] || full;
}

const RING = 2 * Math.PI * 54;

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
  const [success, setSuccess] = useState<{ title: string; body: string } | null>(
    null,
  );
  const [brandFilter, setBrandFilter] = useState<string>("all");

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

  const nextReward = useMemo(() => {
    if (!config || !member) return null;
    const locked = config.rewards.find((r) => member.points < r.cost);
    if (locked) return locked;
    return config.rewards.find((r) => member.points >= r.cost) ?? config.rewards[0] ?? null;
  }, [config, member]);

  const rewardProgress = useMemo(() => {
    if (!member || !nextReward) return { ratio: 0, remaining: 0, canRedeem: false };
    const canRedeem = member.points >= nextReward.cost;
    const remaining = Math.max(0, nextReward.cost - member.points);
    const ratio = Math.min(1, member.points / Math.max(1, nextReward.cost));
    return { ratio, remaining, canRedeem };
  }, [member, nextReward]);

  const decoratedRewards = useMemo(() => {
    if (!config) return [];
    return config.rewards.map((reward, i) => {
      const brand =
        config.passportBrands[i % Math.max(1, config.passportBrands.length)];
      return { reward, brandName: brand?.name ?? "VELORA", brandId: brand?.id ?? "velora" };
    });
  }, [config]);

  const filteredRewards = useMemo(() => {
    if (brandFilter === "all") return decoratedRewards;
    const brand = config?.passportBrands.find((b) => b.id === brandFilter);
    if (!brand) return decoratedRewards;
    return config!.rewards.map((reward) => ({
      reward,
      brandName: brand.name,
      brandId: brand.id,
    }));
  }, [decoratedRewards, brandFilter, config]);

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
          <div className="mb-6 flex justify-center">
            <ClubLogo height={48} />
          </div>
          <p className="mb-4 text-center text-[0.85rem] text-[var(--vc-muted)]">
            {copy.loading}
          </p>
          <div className="club-skeleton" />
          <div className="club-skeleton mt-4 !h-24" />
        </div>
      </div>
    );
  }

  if (error || !config || !member || !currentTier) {
    return (
      <div className="club-shell">
        <div className="club-frame text-center">
          <ClubLogo height={44} className="mx-auto" />
          <p className="mt-6 text-[0.95rem] text-[var(--vc-muted)]">
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
  const name = firstName(member.fullName);
  const ringOffset = RING * (1 - rewardProgress.ratio);
  const currentTierIndex = config.tiers.findIndex((t) => t.id === member.tierId);

  return (
    <div className="club-shell" dir={ar ? "rtl" : "ltr"}>
      <div className="club-frame">
        <Link href="/account" className="club-back">
          ← {copy.back}
        </Link>

        {/* Hero */}
        <header className="club-hero">
          <div className="club-hero-logo">
            <ClubLogo height={58} priority />
          </div>
          <p className="club-hero-brand">VELORA</p>
          <p className="club-hero-sub">Beauty Club</p>
          <div className="club-hero-ornament" aria-hidden />
          <p className="club-hero-tag">{copy.heroTag}</p>
          <p className="mt-2 text-[0.8rem] text-[var(--vc-muted)]">
            {ar
              ? `مرحباً ${name} — أنتِ عضو في عالم VELORA.`
              : `Welcome ${name} — you belong to VELORA.`}
          </p>
        </header>

        {/* Membership credential */}
        <article className="club-member-card" aria-label="VELORA membership card">
          <span className="club-member-emblem" aria-hidden>
            V
          </span>
          <div className="club-member-top">
            <div>
              <div className="relative mb-2 h-7 w-[6.5rem]">
                <Image
                  src="/brand/velora-club-logo.png"
                  alt=""
                  fill
                  className="object-contain object-start opacity-95 brightness-110"
                  sizes="110px"
                />
              </div>
              <p className="club-member-kicker">VELORA BEAUTY CLUB</p>
              <p className="club-tier-badge">
                <IconCrown size={12} />
                {currentTier.nameEn.toUpperCase()}
              </p>
            </div>
            <IconSpark size={16} className="opacity-50" />
          </div>

          <p className="club-member-name">{member.fullName}</p>

          <div className="club-member-points">
            <p className="num">
              {member.points.toLocaleString(ar ? "ar-IQ" : "en-US")}
            </p>
            <p className="lbl">V•POINTS</p>
          </div>

          <div className="club-member-foot">
            <span dir="ltr">
              {copy.memberId}
              <br />
              <span className="opacity-95">{member.memberId}</span>
            </span>
            <TierIcon id={currentTier.id} size={16} className="opacity-70" />
          </div>
        </article>

        {/* V•POINTS ring */}
        <section className="club-points-panel" aria-label="V•POINTS">
          <p className="text-[0.68rem] tracking-[0.22em] text-[var(--vc-gold-deep)] uppercase">
            V•POINTS
          </p>
          <div className="club-points-ring-wrap">
            <svg viewBox="0 0 120 120" aria-hidden>
              <defs>
                <linearGradient id="vcGoldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#32162f" />
                  <stop offset="100%" stopColor="#c4a574" />
                </linearGradient>
              </defs>
              <circle className="track" cx="60" cy="60" r="54" />
              <circle
                className="fill"
                cx="60"
                cy="60"
                r="54"
                strokeDasharray={RING}
                strokeDashoffset={ringOffset}
              />
            </svg>
            <div className="club-points-ring-center">
              <p className="num">
                {member.points.toLocaleString(ar ? "ar-IQ" : "en-US")}
              </p>
              <p className="unit">{copy.pointsUnit}</p>
            </div>
          </div>
          <p className="club-points-meta">
            {rewardProgress.canRedeem
              ? copy.atReward
              : copy.untilReward(rewardProgress.remaining)}
          </p>
          <a href="#club-activity" className="club-history-btn">
            <IconHistory size={14} />
            {copy.pointHistory}
          </a>
        </section>

        {/* Membership levels */}
        <section className="club-section">
          <div className="club-section-head">
            <p className="en">{copy.levels}</p>
            <h2>
              {copy.yourLevel}:{" "}
              <span className="tracking-[0.06em]">
                {currentTier.nameEn.toUpperCase()}
              </span>
            </h2>
            <p>
              {member.nextTierId
                ? copy.toNext(
                    member.pointsToNext,
                    tierLabel(nextTier ?? undefined, ar),
                  )
                : copy.highestTier}
            </p>
          </div>
          <div className="club-surface">
            <div className="club-tier-rail">
              {config.tiers.map((tier, i) => {
                const isCurrent = tier.id === member.tierId;
                const isDone = i < currentTierIndex;
                return (
                  <div
                    key={tier.id}
                    className={`club-tier-node ${isCurrent ? "is-current" : ""} ${isDone ? "is-done" : ""}`}
                  >
                    <div className="dot">
                      {isCurrent ? (
                        <IconCrown size={13} />
                      ) : (
                        <TierIcon id={tier.id} size={13} />
                      )}
                    </div>
                    <p className="name">{tier.nameEn}</p>
                  </div>
                );
              })}
            </div>
            <div className="club-tier-progress">
              <div className="row">
                <span dir="ltr" className="tabular-nums">
                  {member.points.toLocaleString(ar ? "ar-IQ" : "en-US")}
                  {member.nextTierId
                    ? ` / ${(nextTier?.minPoints ?? 0).toLocaleString(ar ? "ar-IQ" : "en-US")}`
                    : ""}{" "}
                  V•POINTS
                </span>
                <span>
                  {member.nextTierId
                    ? `${member.pointsToNext.toLocaleString(ar ? "ar-IQ" : "en-US")} ${copy.remaining}`
                    : "—"}
                </span>
              </div>
              <div className="club-bar">
                <i
                  style={{
                    width: `${Math.round(
                      (member.nextTierId ? member.progressRatio : 1) * 100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Next reward */}
        {nextReward ? (
          <section className="club-section">
            <div className="club-next-reward">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.65rem] tracking-[0.2em] text-[var(--vc-muted)] uppercase">
                    {copy.nextReward}
                  </p>
                  <span
                    className="status mt-2"
                    style={
                      rewardProgress.canRedeem
                        ? undefined
                        : { opacity: 0.7 }
                    }
                  >
                    {rewardProgress.canRedeem ? copy.available : copy.locked}
                  </span>
                </div>
                <div className="club-gift-visual">
                  <IconGift size={20} />
                </div>
              </div>
              <h3 className="title">
                {ar ? nextReward.titleAr : nextReward.titleEn}
              </h3>
              <p className="cost">
                {nextReward.cost.toLocaleString(ar ? "ar-IQ" : "en-US")} V•POINTS
              </p>
              <p className="mt-2 text-[0.8rem] text-[var(--vc-muted)]">
                {ar ? nextReward.subtitleAr : nextReward.subtitleEn}
              </p>
              <button
                type="button"
                className="club-btn club-btn-gold mt-5 w-full sm:w-auto"
                disabled={!rewardProgress.canRedeem}
                onClick={() => openReward(nextReward)}
              >
                {copy.redeemReward}
              </button>
            </div>
          </section>
        ) : null}

        {/* Privileges */}
        <section className="club-section">
          <div className="club-section-head">
            <p className="en">PRIVILEGES</p>
            <h2>{copy.privileges}</h2>
            <p>{copy.privilegesSub}</p>
          </div>
          <div className="club-grid-2">
            {config.privileges.map((p) => (
              <div key={p.id} className="club-feature">
                <ClubIcon name={p.icon} size={17} className="club-feature-icon" />
                <h3 className="mt-2 text-[0.86rem] font-semibold text-[var(--vc-plum)]">
                  {ar ? p.titleAr : p.titleEn}
                </h3>
                <p className="mt-1 text-[0.74rem] leading-relaxed text-[var(--vc-muted)]">
                  {ar ? p.bodyAr : p.bodyEn}
                </p>
                <span className="club-mini-badge">
                  {privilegeTierBadge(p.id)}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Earn */}
        <section className="club-section">
          <div className="club-section-head">
            <p className="en">EARN</p>
            <h2>{copy.earn}</h2>
            <p>{copy.earnSub}</p>
          </div>
          <div className="club-earn-list">
            {config.earnCards.map((c) => (
              <div key={c.id} className="club-earn-row">
                <div className="club-earn-ico">
                  <ClubIcon name={c.icon} size={16} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[0.82rem] font-semibold tracking-[0.06em] text-[var(--vc-plum)]">
                    {ar ? c.titleAr : c.titleEn}
                  </h3>
                  <p className="mt-0.5 text-[0.76rem] text-[var(--vc-muted)]">
                    {ar ? c.bodyAr : c.bodyEn}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Beauty rewards */}
        <section className="club-section" id="club-rewards">
          <div className="club-section-head">
            <p className="en">REWARDS</p>
            <h2>{copy.rewards}</h2>
            <p>{copy.rewardsSub}</p>
          </div>
          <div className="club-filters" role="tablist" aria-label="Brands">
            <button
              type="button"
              className={`club-filter ${brandFilter === "all" ? "is-on" : ""}`}
              onClick={() => setBrandFilter("all")}
            >
              {copy.allBrands}
            </button>
            {config.passportBrands.map((b) => (
              <button
                type="button"
                key={b.id}
                dir="ltr"
                className={`club-filter ${brandFilter === b.id ? "is-on" : ""}`}
                onClick={() => setBrandFilter(b.id)}
              >
                {b.name}
              </button>
            ))}
          </div>
          {filteredRewards.length === 0 ? (
            <div className="club-surface text-center">
              <ClubLogo height={40} className="mx-auto opacity-90" />
              <p className="mt-4 text-[0.9rem] text-[var(--vc-muted)]">
                {copy.emptyRewards}
              </p>
              <Link href="/shop" className="club-btn club-btn-primary mt-4">
                {copy.emptyCta}
              </Link>
            </div>
          ) : (
            <div className="club-rewards">
              {filteredRewards.map(({ reward, brandName }) => {
                const can = member.points >= reward.cost;
                const need = Math.max(0, reward.cost - member.points);
                return (
                  <article key={reward.id} className="club-reward">
                    <p className="brand" dir="ltr">
                      {brandName}
                    </p>
                    <h3>{ar ? reward.titleAr : reward.titleEn}</h3>
                    <p className="cost">
                      {reward.cost.toLocaleString(ar ? "ar-IQ" : "en-US")}{" "}
                      V•POINTS
                    </p>
                    <p>{ar ? reward.subtitleAr : reward.subtitleEn}</p>
                    <button
                      type="button"
                      className="club-btn club-btn-primary mt-4 w-full"
                      disabled={!can}
                      onClick={() => openReward(reward)}
                    >
                      {can
                        ? ctaLabel(reward.cta, copy)
                        : ar
                          ? `تحتاجين ${need.toLocaleString("ar-IQ")} نقطة`
                          : `Need ${need.toLocaleString("en-US")} more`}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Journey */}
        <section className="club-section">
          <div className="club-section-head">
            <p className="en">JOURNEY</p>
            <h2>{copy.journey}</h2>
            <p>{copy.journeySub}</p>
          </div>
          <div className="club-surface">
            <div className="club-tier-rail">
              {config.tiers.map((tier, i) => {
                const isCurrent = tier.id === member.tierId;
                const isDone = i < currentTierIndex;
                return (
                  <div
                    key={`j-${tier.id}`}
                    className={`club-tier-node ${isCurrent ? "is-current" : ""} ${isDone ? "is-done" : ""}`}
                  >
                    <div className="dot">
                      {isDone || isCurrent ? (
                        <IconSpark size={12} />
                      ) : (
                        <span className="text-[0.6rem]">0{i + 1}</span>
                      )}
                    </div>
                    <p className="name">{tier.nameEn}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-2 text-[0.78rem]">
              <div>
                <p className="text-[0.65rem] tracking-[0.12em] text-[var(--vc-muted)] uppercase">
                  {copy.nextDestination}
                </p>
                <p className="mt-1 font-semibold text-[var(--vc-plum)] tracking-[0.08em]">
                  {nextTier
                    ? nextTier.nameEn.toUpperCase()
                    : currentTier.nameEn.toUpperCase()}
                </p>
              </div>
              <p className="tabular-nums text-[var(--vc-muted)]" dir="ltr">
                {member.points.toLocaleString(ar ? "ar-IQ" : "en-US")}
                {member.nextTierId
                  ? ` / ${(nextTier?.minPoints ?? 0).toLocaleString(ar ? "ar-IQ" : "en-US")}`
                  : ""}{" "}
                V•POINTS
              </p>
            </div>
          </div>
        </section>

        {/* Surprise */}
        <section className="club-section">
          <div className="club-mystery">
            <div
              className={`club-mystery-inner ${mysteryBlur ? "is-blur" : ""}`}
            >
              <div className="club-gift-visual">
                <IconGift size={22} />
              </div>
              <p className="mt-4 text-[0.65rem] tracking-[0.22em] text-[var(--vc-gold-deep)] uppercase">
                VELORA
              </p>
              <h2 className="mt-2 text-[0.95rem] font-semibold text-[var(--vc-plum)]">
                {copy.mystery}
              </h2>
              <p className="mt-2 text-[0.86rem] text-[var(--vc-muted)]">
                {mysteryResult || copy.mysterySub}
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
          <div className="club-birthday">
            <ClubLogo height={34} className="mx-auto" />
            <p className="mt-4 text-[0.65rem] tracking-[0.2em] text-[var(--vc-gold-deep)] uppercase">
              Beauty Day
            </p>
            <h2 className="mt-2 text-[1rem] font-semibold text-[var(--vc-plum)]">
              {copy.birthday}
            </h2>
            <p className="mt-1 text-[0.84rem] text-[var(--vc-muted)]">
              {copy.birthdaySub}
            </p>
            <p className="mt-4 text-[1.05rem] font-semibold text-[var(--vc-plum)]">
              +{config.birthdayBonus.toLocaleString(ar ? "ar-IQ" : "en-US")}{" "}
              V•POINTS
            </p>
            <p className="mt-1 text-[0.8rem] text-[var(--vc-muted)]">
              {ar ? currentTier.birthdayGiftAr : currentTier.birthdayGiftEn}
            </p>
            <p className="mt-3 text-[0.78rem] text-[var(--vc-graphite)]">
              {copy.birthdayGift}
            </p>
          </div>
        </section>

        {/* Referral */}
        <section className="club-section">
          <div className="club-section-head">
            <p className="en">CIRCLE</p>
            <h2>{copy.invite}</h2>
            <p>{copy.inviteSub}</p>
          </div>
          <div className="club-surface">
            <p className="text-[0.72rem] text-[var(--vc-muted)]">
              {copy.referralCode}
            </p>
            <p className="club-code mt-3">{member.referralCode}</p>
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
                className="club-btn club-btn-ghost"
                onClick={shareCode}
              >
                {copy.share}
              </button>
            </div>
            <p className="mt-4 text-[0.8rem] text-[var(--vc-muted)]">
              {member.referralCount} {copy.referralsOk} · +
              {member.fromReferrals.toLocaleString(ar ? "ar-IQ" : "en-US")}{" "}
              V•POINTS
            </p>
          </div>
        </section>

        {/* Privé */}
        {member.tierId === "prive" ? (
          <section className="club-section">
            <div className="club-section-head">
              <h2>{copy.prive}</h2>
              <p>{copy.priveSub}</p>
            </div>
            <div className="club-surface">
              <ul className="grid gap-2 sm:grid-cols-2">
                {(ar ? config.priveBenefitsAr : config.priveBenefitsEn).map(
                  (b) => (
                    <li
                      key={b}
                      className="flex items-center gap-2 text-[0.86rem]"
                    >
                      <TierIcon id="prive" size={13} />
                      {b}
                    </li>
                  ),
                )}
              </ul>
            </div>
          </section>
        ) : null}

        {/* LARSA */}
        <section className="club-section">
          <div className="club-larsa">
            <div className="club-larsa-avatar" aria-hidden>
              <IconChat size={26} />
            </div>
            <div className="club-larsa-body">
              <p className="text-[0.65rem] tracking-[0.2em] text-[var(--vc-gold-deep)] uppercase">
                LARSA
              </p>
              <h2 className="mt-1 text-[0.92rem] font-semibold tracking-[0.08em] text-[var(--vc-plum)]">
                {copy.concierge}
              </h2>
              <p className="mt-2 text-[0.84rem] text-[var(--vc-muted)]">
                {copy.conciergeSub}
              </p>
              <p className="mt-2 text-[0.88rem] text-[var(--vc-plum)]">
                {copy.conciergeHello}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                <a
                  href={`https://wa.me/${wa}`}
                  target="_blank"
                  rel="noreferrer"
                  className="club-btn club-btn-primary"
                >
                  {copy.talk}
                </a>
                <Link href="/advisor" className="club-btn club-btn-ghost">
                  {copy.discoverLarsa}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Activity */}
        <section className="club-section" id="club-activity">
          <div className="club-section-head">
            <p className="en">ACTIVITY</p>
            <h2>{copy.activity}</h2>
          </div>
          <div className="club-surface">
            {member.activity.length === 0 ? (
              <div className="text-center py-2">
                <ClubLogo height={36} className="mx-auto" />
                <p className="mt-4 text-[0.9rem] text-[var(--vc-muted)]">
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
                    <div className="club-timeline-ico">
                      <ClubIcon
                        name={item.delta < 0 ? "gift" : "spark"}
                        size={14}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.88rem] text-[var(--vc-plum)]">
                        {ar ? item.labelAr : item.labelEn}
                      </p>
                      <p className="mt-0.5 text-[0.7rem] text-[var(--vc-muted)]">
                        {new Date(item.at).toLocaleDateString(
                          ar ? "ar-IQ" : "en-GB",
                          { day: "numeric", month: "short" },
                        )}
                      </p>
                    </div>
                    <span
                      className={
                        item.delta >= 0 ? "club-delta-pos" : "club-delta-neg"
                      }
                    >
                      {item.delta >= 0 ? "+" : ""}
                      {item.delta.toLocaleString(ar ? "ar-IQ" : "en-US")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <footer className="mt-10 pb-2 text-center">
          <ClubLogo height={38} className="mx-auto opacity-90" />
          <p className="mt-3 text-[0.65rem] tracking-[0.22em] text-[var(--vc-mauve)]">
            BEAUTY REVEALED
          </p>
        </footer>
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
            <ClubLogo height={42} className="mx-auto" />
            <IconSpark size={20} className="mx-auto mt-4" />
            <h3 className="mt-3 text-[1.05rem] font-semibold tracking-[0.1em]">
              {success.title}
            </h3>
            <p className="mt-3 whitespace-pre-line text-[0.9rem] text-[var(--vc-muted)]">
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
                className="club-btn club-btn-ghost"
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
