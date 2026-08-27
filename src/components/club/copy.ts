export function clubCopy(ar: boolean) {
  return {
    back: ar ? "العودة إلى حسابي" : "Back to My VELORA",
    clubTitle: "VELORA BEAUTY CLUB",
    heroTag: ar
      ? "رحلتكِ الجمالية… بمستوى أعلى."
      : "Your beauty journey, elevated.",
    member: ar ? "العضوة" : "Member",
    memberId: ar ? "رقم العضوية" : "Member ID",
    yourLevel: ar ? "مستواكِ" : "Your Level",
    toNext: (n: number, tier: string) =>
      ar
        ? `${n.toLocaleString("ar-IQ")} نقطة حتى ${tier}`
        : `${n.toLocaleString("en-US")} points to ${tier}`,
    untilReward: (n: number) =>
      ar
        ? `أنتِ على بُعد ${n.toLocaleString("ar-IQ")} نقطة من مكافأتكِ القادمة.`
        : `${n.toLocaleString("en-US")} V•POINTS until your next reward.`,
    atReward: ar ? "مكافأتكِ جاهزة للاستبدال." : "Your next reward is ready.",
    highestTier: ar ? "أنتِ في أعلى مستوى" : "Highest tier reached",
    pointHistory: ar ? "سجل النقاط" : "Point History",
    viewMyPoints: ar ? "عرض نقاطي" : "View my points",
    pointsLabel: "V•POINTS",
    pointsUnit: ar ? "نقطة" : "points",
    nextReward: ar ? "المكافأة القادمة" : "NEXT REWARD",
    available: ar ? "متاحة" : "AVAILABLE",
    locked: ar ? "قريباً" : "COMING SOON",
    redeemReward: ar ? "استبدال المكافأة" : "REDEEM REWARD",
    privileges: ar ? "امتيازاتكِ" : "YOUR PRIVILEGES",
    privilegesSub: ar
      ? "استمتعي بمزايا حصرية حسب مستوى عضويتكِ."
      : "Enjoy exclusive benefits by membership level.",
    earn: ar ? "اجمعي V•POINTS" : "EARN V•POINTS",
    earnSub: ar
      ? "كل تفاعل مع VELORA يقربكِ من مكافأتكِ القادمة."
      : "Every moment with VELORA brings you closer.",
    rewards: ar ? "مكافآت الجمال" : "BEAUTY REWARDS",
    rewardsSub: ar
      ? "استكشفي مكافآت من العلامات التي تحبينها."
      : "Explore rewards from the houses you love.",
    allBrands: ar ? "الكل" : "All",
    journey: ar ? "رحلتكِ مع فيلورا" : "YOUR VELORA JOURNEY",
    journeySub: ar
      ? "كل خطوة تقرّبكِ من امتياز جديد."
      : "Every step unlocks a more exclusive world.",
    nextDestination: ar ? "الوجهة التالية" : "Next destination",
    remaining: ar ? "متبقية" : "remaining",
    invite: ar ? "دائرة جمالكِ" : "INVITE YOUR BEAUTY CIRCLE",
    inviteSub: ar
      ? "شاركي تجربة فيلورا مع من تحبين."
      : "Share VELORA with those you love.",
    referralCode: ar ? "رمز الدعوة الخاص" : "Private invitation code",
    copy: ar ? "نسخ الرمز" : "COPY CODE",
    share: ar ? "مشاركة" : "SHARE",
    referralsOk: ar ? "دعوات ناجحة" : "successful invites",
    mystery: ar ? "مفاجأة صغيرة من فيلورا" : "A LITTLE SURPRISE FROM VELORA",
    mysterySub: ar
      ? "شيء جميل ينتظركِ."
      : "Something beautiful is waiting for you.",
    reveal: ar ? "اكتشفي مفاجأتكِ" : "DISCOVER YOUR SURPRISE",
    birthday: ar ? "عيد ميلادكِ مع فيلورا" : "YOUR BEAUTY DAY",
    birthdaySub: ar ? "شيء صغير… منا إليكِ." : "A little something, from us to you.",
    birthdayGift: ar ? "هدية خاصة تنتظركِ." : "A special gift awaits you.",
    prive: ar ? "مرحباً بكِ في بريفيه" : "WELCOME TO VELORA PRIVÉ",
    priveSub: ar ? "تجربة جمال أكثر خصوصية." : "A more personal beauty experience.",
    concierge: "LARSA BEAUTY CONCIERGE",
    conciergeSub: ar
      ? "مساعدتكِ الشخصية في عالم الجمال."
      : "Your private guide in the world of beauty.",
    conciergeHello: ar
      ? "مرحبًا، أنا لارسا. كيف يمكنني مساعدتكِ؟"
      : "Hello, I’m LARSA. How may I assist you?",
    talk: ar ? "تحدثي مع لارسا" : "TALK TO LARSA",
    discoverLarsa: ar ? "اكتشفي لارسا" : "DISCOVER LARSA",
    activity: ar ? "النشاط" : "ACTIVITY",
    emptyActivity: ar ? "رحلتكِ تبدأ من هنا." : "Your journey begins here.",
    emptyCta: ar ? "ابدئي التسوق" : "START SHOPPING",
    emptyRewards: ar
      ? "مكافآتكِ بانتظاركِ. ابدئي بجمع النقاط وافتحي شيئاً جميلاً."
      : "Your rewards await. Earn V•POINTS and unlock something beautiful.",
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
    levels: ar ? "مستويات العضوية" : "MEMBERSHIP LEVELS",
  };
}

/** Soft tier floor label for privilege cards (editorial, not backend gates). */
export function privilegeTierBadge(privilegeId: string): string {
  switch (privilegeId) {
    case "early":
      return "GLOW+";
    case "double":
      return "SIGNATURE+";
    case "gifts":
      return "SIGNATURE+";
    case "delivery":
      return "GLOW+";
    case "offers":
      return "PRIVÉ+";
    case "birthday":
    default:
      return "MUSE+";
  }
}
