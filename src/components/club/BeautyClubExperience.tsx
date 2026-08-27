"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/context/LocaleContext";
import { ClubLogo } from "@/components/club/ClubLogo";
import { clubCopy, privilegeTierBadge } from "@/components/club/copy";
import {
  ClubIcon,
  IconChat,
  IconGift,
  IconSpark,
  TierIcon,
} from "@/components/club/icons";
import { ClubEarnAction } from "@/components/club/ui/ClubEarnAction";
import { ClubMembershipCard } from "@/components/club/ui/ClubMembershipCard";
import { ClubPointsHero } from "@/components/club/ui/ClubPointsHero";
import { ClubSectionHead } from "@/components/club/ui/ClubSectionHead";
import { ClubTierHierarchy } from "@/components/club/ui/ClubTierHierarchy";
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

function earnHint(id: string, config: ClubConfig): string | null {
  switch (id) {
    case "shop":
      return `+1 / ${config.iqdPerPoint.toLocaleString()} IQD`;
    case "review":
      return `+${config.reviewBonus}`;
    case "refer":
      return `+${config.referralBonus}`;
    case "bday":
      return `+${config.birthdayBonus}`;
    case "events":
      if (config.triplePointsActive) return "3×";
      if (config.doublePointsActive) return "2×";
      return "2–3×";
    default:
      return null;
  }
}

export function BeautyClubExperience() {
  const { locale, ready: localeReady } = useLocale();
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

  if (!localeReady || loading) {
    return (
      <div className="club-shell">
        <div className="club-frame">
          <div className="mb-6 flex justify-center">
            <ClubLogo height={48} />
          </div>
          {localeReady ? (
            <p className="club-loading-copy">{copy.loading}</p>
          ) : (
            <div className="club-skeleton !h-4 !max-w-[12rem] mx-auto mb-4" />
          )}
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
  const currentTierIndex = config.tiers.findIndex((t) => t.id === member.tierId);
  const tierProgressCaption = member.nextTierId
    ? copy.toNext(member.pointsToNext, tierLabel(nextTier ?? undefined, ar))
    : copy.highestTier;

  return (
    <div className="club-shell" dir={ar ? "rtl" : "ltr"}>
      <div className="club-frame">
        <Link href="/account" className="club-back">
          ← {copy.back}
        </Link>

        <header className="club-hero">
          <div className="club-hero-logo">
            <ClubLogo height={54} priority />
          </div>
          <p className="club-hero-brand">VELORA</p>
          <p className="club-hero-sub">Beauty Club</p>
          <div className="club-hero-ornament" aria-hidden />
          <p className="club-hero-tag">{copy.heroTag}</p>
          <p className="club-hero-greeting">
            {ar
              ? `مرحباً ${name} — أنتِ عضوة في عالم VELORA.`
              : `Welcome ${name} — you belong to VELORA.`}
          </p>
        </header>

        <ClubMembershipCard
          ar={ar}
          fullName={member.fullName}
          memberId={member.memberId}
          memberIdLabel={copy.memberId}
          points={member.points}
          tier={currentTier}
        />

        <ClubPointsHero
          ar={ar}
          points={member.points}
          meta={
            rewardProgress.canRedeem
              ? copy.atReward
              : copy.untilReward(rewardProgress.remaining)
          }
          ctaLabel={copy.viewMyPoints}
        />

        <section className="club-section">
          <ClubSectionHead
            kicker={copy.levels}
            title={`${copy.yourLevel}: ${currentTier.nameEn.toUpperCase()}`}
            subtitle={tierProgressCaption}
          />
          <ClubTierHierarchy
            tiers={config.tiers}
            currentTierId={member.tierId}
            currentTierIndex={currentTierIndex}
            points={member.points}
            nextTier={nextTier}
            pointsToNext={member.pointsToNext}
            progressRatio={member.progressRatio}
            yourLevelLabel={copy.yourLevel}
            progressCaption={tierProgressCaption}
            remainingLabel={copy.remaining}
            hideStatus
          />
        </section>

        {nextReward ? (
          <section className="club-section">
            <div className="club-next-reward">
              <div className="club-next-reward__top">
                <div>
                  <p className="club-next-reward__kicker">{copy.nextReward}</p>
                  <span
                    className="club-next-reward__status"
                    data-ready={rewardProgress.canRedeem}
                  >
                    {rewardProgress.canRedeem ? copy.available : copy.locked}
                  </span>
                </div>
                <div className="club-gift-visual">
                  <IconGift size={18} />
                </div>
              </div>
              <h3 className="club-next-reward__title">
                {ar ? nextReward.titleAr : nextReward.titleEn}
              </h3>
              <p className="club-next-reward__cost">
                {nextReward.cost.toLocaleString(ar ? "ar-IQ" : "en-US")} V·POINTS
              </p>
              <p className="club-next-reward__sub">
                {ar ? nextReward.subtitleAr : nextReward.subtitleEn}
              </p>
              <button
                type="button"
                className="club-btn club-btn-gold mt-5"
                disabled={!rewardProgress.canRedeem}
                onClick={() => openReward(nextReward)}
              >
                {copy.redeemReward}
              </button>
            </div>
          </section>
        ) : null}

        <section className="club-section">
          <ClubSectionHead
            kicker="PRIVILEGES"
            title={copy.privileges}
            subtitle={copy.privilegesSub}
          />
          <div className="club-grid-2">
            {config.privileges.map((p) => (
              <div key={p.id} className="club-feature">
                <ClubIcon name={p.icon} size={16} className="club-feature-icon" />
                <h3 className="club-feature__title">
                  {ar ? p.titleAr : p.titleEn}
                </h3>
                <p className="club-feature__body">
                  {ar ? p.bodyAr : p.bodyEn}
                </p>
                <span className="club-mini-badge">
                  {privilegeTierBadge(p.id)}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="club-section">
          <ClubSectionHead
            kicker="EARN"
            title={copy.earn}
            subtitle={copy.earnSub}
          />
          <div className="club-earn-list">
            {config.earnCards.map((c) => (
              <ClubEarnAction
                key={c.id}
                icon={c.icon}
                title={ar ? c.titleAr : c.titleEn}
                body={ar ? c.bodyAr : c.bodyEn}
                hint={earnHint(c.id, config)}
              />
            ))}
          </div>
        </section>

        <section className="club-section" id="club-rewards">
          <ClubSectionHead
            kicker="REWARDS"
            title={copy.rewards}
            subtitle={copy.rewardsSub}
          />
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
            <div className="club-empty">
              <ClubLogo height={40} className="mx-auto opacity-90" />
              <p className="club-empty__text">{copy.emptyRewards}</p>
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
                    <p className="club-reward__brand" dir="ltr">
                      {brandName}
                    </p>
                    <h3 className="club-reward__title">
                      {ar ? reward.titleAr : reward.titleEn}
                    </h3>
                    <p className="club-reward__cost">
                      {reward.cost.toLocaleString(ar ? "ar-IQ" : "en-US")}{" "}
                      V·POINTS
                    </p>
                    <p className="club-reward__sub">
                      {ar ? reward.subtitleAr : reward.subtitleEn}
                    </p>
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

        <section className="club-section">
          <ClubSectionHead
            kicker="JOURNEY"
            title={copy.journey}
            subtitle={copy.journeySub}
          />
          <div className="club-journey-panel">
            <ClubTierHierarchy
              tiers={config.tiers}
              currentTierId={member.tierId}
              currentTierIndex={currentTierIndex}
              points={member.points}
              nextTier={nextTier}
              pointsToNext={member.pointsToNext}
              progressRatio={member.progressRatio}
              yourLevelLabel={copy.nextDestination}
              progressCaption={tierProgressCaption}
              remainingLabel={copy.remaining}
              emphasisTierId={nextTier?.id}
            />
          </div>
        </section>

        <section className="club-section">
          <div className="club-mystery">
            <div
              className={`club-mystery-inner ${mysteryBlur ? "is-blur" : ""}`}
            >
              <div className="club-gift-visual">
                <IconGift size={20} />
              </div>
              <p className="club-mystery__kicker">VELORA</p>
              <h2 className="club-mystery__title">{copy.mystery}</h2>
              <p className="club-mystery__sub">
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

        <section className="club-section">
          <div className="club-birthday">
            <ClubLogo height={32} className="mx-auto" />
            <p className="club-birthday__kicker">Beauty Day</p>
            <h2 className="club-birthday__title">{copy.birthday}</h2>
            <p className="club-birthday__sub">{copy.birthdaySub}</p>
            <p className="club-birthday__points">
              +{config.birthdayBonus.toLocaleString(ar ? "ar-IQ" : "en-US")}{" "}
              V·POINTS
            </p>
            <p className="club-birthday__gift">
              {ar ? currentTier.birthdayGiftAr : currentTier.birthdayGiftEn}
            </p>
            <p className="club-birthday__note">{copy.birthdayGift}</p>
          </div>
        </section>

        <section className="club-section">
          <ClubSectionHead
            kicker="CIRCLE"
            title={copy.invite}
            subtitle={copy.inviteSub}
          />
          <div className="club-referral">
            <p className="club-referral__label">{copy.referralCode}</p>
            <p className="club-code">{member.referralCode}</p>
            <div className="club-referral__actions">
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
            <p className="club-referral__meta">
              {member.referralCount} {copy.referralsOk} · +
              {member.fromReferrals.toLocaleString(ar ? "ar-IQ" : "en-US")}{" "}
              V·POINTS
            </p>
          </div>
        </section>

        {member.tierId === "prive" ? (
          <section className="club-section">
            <ClubSectionHead title={copy.prive} subtitle={copy.priveSub} />
            <div className="club-prive-list">
              {(ar ? config.priveBenefitsAr : config.priveBenefitsEn).map(
                (b) => (
                  <div key={b} className="club-prive-item">
                    <TierIcon id="prive" size={13} />
                    <span>{b}</span>
                  </div>
                ),
              )}
            </div>
          </section>
        ) : null}

        <section className="club-section">
          <div className="club-larsa">
            <div className="club-larsa-avatar" aria-hidden>
              <IconChat size={24} />
            </div>
            <div className="club-larsa-body">
              <p className="club-larsa__kicker">LARSA</p>
              <h2 className="club-larsa__title">{copy.concierge}</h2>
              <p className="club-larsa__sub">{copy.conciergeSub}</p>
              <p className="club-larsa__hello">{copy.conciergeHello}</p>
              <div className="club-larsa__actions">
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

        <section className="club-section" id="club-activity">
          <ClubSectionHead kicker="ACTIVITY" title={copy.activity} />
          <div className="club-activity">
            {member.activity.length === 0 ? (
              <div className="club-empty">
                <ClubLogo height={36} className="mx-auto" />
                <p className="club-empty__text">{copy.emptyActivity}</p>
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
                      <p className="club-timeline__label">
                        {ar ? item.labelAr : item.labelEn}
                      </p>
                      <p className="club-timeline__date">
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

        <footer className="club-footer">
          <ClubLogo height={36} className="mx-auto opacity-90" />
          <p className="club-footer__tag">BEAUTY REVEALED</p>
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
            <h3 className="club-modal__title">{success.title}</h3>
            <p className="club-modal__body">{success.body}</p>
            <div className="club-modal__actions">
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
