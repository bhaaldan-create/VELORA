export function clubCopy(ar: boolean) {
  return {
    back: ar ? "العودة إلى حسابي" : "Back to My VELORA",
    clubTitle: "VELORA BEAUTY CLUB",
    subtitle: ar
      ? "أكثر من نقاط… إنها تجربتكِ مع VELORA."
      : "More than points. A beauty experience.",
    subtitleEnLine: "More than points. A beauty experience.",
    member: ar ? "العضوة" : "Member",
    memberId: ar ? "رقم العضوية" : "Member ID",
    journey: ar ? "رحلتكِ مع فيلورا" : "YOUR VELORA JOURNEY",
    toNext: (n: number, tier: string) =>
      ar ? `${n.toLocaleString("ar-IQ")} نقطة حتى ${tier}` : `${n.toLocaleString("en-US")} points to ${tier}`,
    nextPrivilege: ar ? "امتيازكِ القادم" : "Your next privilege",
    pointsLabel: "V•POINTS",
    pointsTagline: ar
      ? "نقاطكِ مفتاحكِ لتجارب أجمل."
      : "Your points are your key to more beautiful experiences.",
    earnedMonth: ar ? "هذا الشهر" : "earned this month",
    fromReviews: ar ? "من المراجعات" : "from reviews",
    fromReferrals: ar ? "من الدعوات" : "from referrals",
    rewards: ar ? "مكافآت فيلورا" : "VELORA REWARDS",
    rewardsSub: ar ? "اختاري شيئاً جميلاً." : "Choose something beautiful.",
    privileges: ar ? "امتيازاتكِ" : "YOUR PRIVILEGES",
    passport: ar ? "جواز الجمال" : "BEAUTY PASSPORT",
    passportSub: ar ? "استكشفي أكثر. اكتشفي أكثر." : "Explore more. Discover more.",
    explorer: ar ? "مستكشفة الجمال" : "BEAUTY EXPLORER",
    invite: ar ? "ادعِي وتألّقي" : "INVITE & GLOW",
    inviteSub: ar ? "الجمال أجمل معاً." : "Beauty is better together.",
    referralCode: ar ? "رمز الدعوة" : "Your referral code",
    copy: ar ? "نسخ الرمز" : "COPY CODE",
    share: ar ? "مشاركة" : "SHARE",
    referralsOk: ar ? "دعوات ناجحة" : "successful referrals",
    streak: ar ? "سلسلة جمالكِ" : "YOUR BEAUTY STREAK",
    months: ar ? "أشهر" : "MONTHS",
    streakNext: (n: number) =>
      ar
        ? `${n} شهر إضافي لفتح مكافأة الجمال`
        : `${n} more months to unlock your Beauty Reward`,
    mystery: ar ? "مفاجأة صغيرة من فيلورا" : "A LITTLE SURPRISE FROM VELORA",
    reveal: ar ? "اكشفي مكافأتي" : "REVEAL MY REWARD",
    birthday: ar ? "عيد ميلادكِ مع فيلورا" : "YOUR VELORA BIRTHDAY",
    birthdaySub: ar ? "شيء صغير، منا إليكِ." : "A little something, from us to you.",
    prive: ar ? "مرحباً بكِ في بريفيه" : "WELCOME TO VELORA PRIVÉ",
    priveSub: ar ? "تجربة جمال أكثر خصوصية." : "A more personal beauty experience.",
    concierge: ar ? "كونسيرج الجمال" : "VELORA BEAUTY CONCIERGE",
    conciergeSub: ar
      ? "تحتاجين مساعدة في اختيار أساسيات جمالكِ القادمة؟"
      : "Need help finding your next beauty essential?",
    talk: ar ? "تحدثي مع فيلورا" : "TALK TO VELORA",
    earn: ar ? "اجمعي V•POINTS" : "EARN V•POINTS",
    activity: ar ? "نشاط النقاط" : "POINTS ACTIVITY",
    emptyActivity: ar ? "ابدئي التسوق لبناء نشاطكِ." : "Start shopping to build your activity.",
    emptyCta: ar ? "ابدئي التسوق" : "START SHOPPING",
    emptyRewards: ar
      ? "مكافآتكِ بانتظاركِ. ابدئي بجمع النقاط وافتحي شيئاً جميلاً."
      : "Your rewards are waiting. Start earning V•POINTS and unlock something beautiful.",
    rewardUnlocked: ar ? "تم فتح المكافأة" : "REWARD UNLOCKED",
    rewardAdded: ar
      ? "أُضيفت المكافأة إلى حسابكِ."
      : "Your reward has been added to your account.",
    continueShop: ar ? "تابعي التسوق" : "CONTINUE SHOPPING",
    copied: ar ? "تم النسخ" : "Copied",
    loading: ar ? "جارٍ تحضير تجربتكِ…" : "Preparing your experience…",
    redeem: ar ? "استبدلي" : "REDEEM",
    revealCta: ar ? "اكشفي" : "REVEAL",
    unlock: ar ? "افتحي" : "UNLOCK",
  };
}
