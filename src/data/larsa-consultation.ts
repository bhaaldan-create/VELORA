/**
 * محرك استشارة LARSA — أسئلة ديناميكية عربية أولاً
 */

export type LarsaPathId =
  | "skincare"
  | "hair"
  | "makeup"
  | "body"
  | "full-ritual"
  | "unsure";

export type LarsaOption = {
  id: string;
  label: string;
  hint?: string;
  tags?: string[];
};

export type LarsaQuestion = {
  id: string;
  title: string;
  subtitle?: string;
  multi?: boolean;
  options: LarsaOption[];
  /** إظهار السؤال فقط إذا تحققت الشروط */
  when?: (answers: Record<string, string | string[]>) => boolean;
};

export type LarsaPathDef = {
  id: LarsaPathId;
  number: string;
  title: string;
  desc: string;
  icon: "skin" | "hair" | "makeup" | "body" | "ritual" | "mark";
  featured?: boolean;
  intro: string;
  categoryHint:
    | "skincare"
    | "hair-care"
    | "makeup"
    | "body-care"
    | "fragrance"
    | "all";
  questions: LarsaQuestion[];
};

const BUDGET_Q: LarsaQuestion = {
  id: "budget",
  title: "شنو الميزانية اللي تفضلينها؟",
  subtitle: "أرتّب النتائج حسب تفضيلكِ — بدون إخفاء الخيارات الأخرى.",
  options: [
    {
      id: "economy",
      label: "اقتصادية",
      hint: "خيارات ذكية بسعر مناسب",
      tags: ["ميزانية اقتصادية"],
    },
    {
      id: "mid",
      label: "متوسطة",
      hint: "توازن بين الجودة والسعر",
      tags: ["ميزانية متوسطة"],
    },
    {
      id: "luxe",
      label: "فاخرة",
      hint: "أختار لكِ من الخيارات الراقية",
      tags: ["ميزانية فاخرة"],
    },
    {
      id: "any",
      label: "ما عندي ميزانية محددة",
      tags: [],
    },
  ],
};

const PREFS_Q: LarsaQuestion = {
  id: "prefs",
  title: "هل عندكِ تفضيلات معينة؟",
  subtitle: "يمكنكِ اختيار أكثر من خيار.",
  multi: true,
  options: [
    { id: "fragrance-free", label: "بدون عطور", tags: ["بدون عطور"] },
    { id: "light", label: "تركيبات خفيفة", tags: ["تركيبات خفيفة"] },
    { id: "plant", label: "منتجات نباتية", tags: ["نباتي"] },
    { id: "luxe-feel", label: "منتجات فاخرة", tags: ["فاخر"] },
    { id: "none", label: "لا يهم", tags: [] },
  ],
};

export const LARSA_PATHS: LarsaPathDef[] = [
  {
    id: "skincare",
    number: "01",
    title: "العناية بالبشرة",
    desc: "لروتين يناسب احتياجات بشرتكِ",
    icon: "skin",
    intro: "تمام، خلينا نبدأ ببشرتكِ.",
    categoryHint: "skincare",
    questions: [
      {
        id: "focus",
        title: "شنو أكثر شيء تحبين نركز عليه؟",
        options: [
          { id: "dry", label: "الجفاف", tags: ["جفاف", "ترطيب"] },
          { id: "acne", label: "الحبوب", tags: ["حبوب", "تنقية"] },
          { id: "pigment", label: "التصبغات", tags: ["تصبغات", "توحيد"] },
          { id: "dull", label: "البهتان", tags: ["بهتان", "نضارة"] },
          { id: "pores", label: "المسام", tags: ["مسام"] },
          { id: "lines", label: "الخطوط الدقيقة", tags: ["خطوط دقيقة"] },
          { id: "sensitive", label: "الحساسية", tags: ["حساسية"] },
          { id: "unsure", label: "لستُ متأكدة", tags: ["استكشاف"] },
        ],
      },
      {
        id: "skinType",
        title: "وكيف تصفين بشرتكِ؟",
        options: [
          { id: "dry", label: "جافة", tags: ["بشرة جافة"] },
          { id: "oily", label: "دهنية", tags: ["بشرة دهنية"] },
          { id: "combo", label: "مختلطة", tags: ["بشرة مختلطة"] },
          { id: "normal", label: "عادية", tags: ["بشرة عادية"] },
          { id: "sensitive", label: "حساسة", tags: ["بشرة حساسة"] },
          { id: "unsure", label: "لستُ متأكدة", tags: [] },
        ],
      },
      {
        id: "dayIssue",
        title: "شنو أكثر شيء يضايقكِ خلال اليوم؟",
        options: [
          { id: "tight", label: "شدّ وجفاف", tags: ["شد"] },
          { id: "shine", label: "لمعان زائد", tags: ["لمعان"] },
          { id: "redness", label: "احمرار", tags: ["احمرار"] },
          { id: "texture", label: "مظهر غير موحّد", tags: ["ملمس"] },
          { id: "tired", label: "تعب وباهتة", tags: ["تعب"] },
          { id: "none", label: "ما عندي شيء محدد", tags: [] },
        ],
      },
      {
        id: "fragranceFree",
        title: "هل تفضلين المنتجات الخالية من العطور؟",
        when: (a) => {
          const focus = a.focus;
          const type = a.skinType;
          return (
            focus === "sensitive" ||
            type === "sensitive" ||
            (Array.isArray(focus) && focus.includes("sensitive"))
          );
        },
        options: [
          { id: "yes", label: "نعم، أفضل بدون عطور", tags: ["بدون عطور"] },
          { id: "ok", label: "ما يهمني", tags: [] },
        ],
      },
      {
        id: "oilyDetail",
        title: "هل أكثر شيء يزعجكِ هو اللمعان أم الحبوب أم المسام؟",
        when: (a) => a.skinType === "oily" || a.focus === "acne" || a.focus === "pores",
        options: [
          { id: "shine", label: "اللمعان", tags: ["لمعان"] },
          { id: "acne", label: "الحبوب", tags: ["حبوب"] },
          { id: "pores", label: "المسام", tags: ["مسام"] },
          { id: "all", label: "كلها تقريباً", tags: ["لمعان", "حبوب", "مسام"] },
        ],
      },
      BUDGET_Q,
      PREFS_Q,
    ],
  },
  {
    id: "hair",
    number: "02",
    title: "العناية بالشعر",
    desc: "للعثور على ما يحتاجه شعركِ",
    icon: "hair",
    intro: "تمام، خلينا نهتم بشعركِ.",
    categoryHint: "hair-care",
    questions: [
      {
        id: "focus",
        title: "شنو أكثر شيء تحبين نركز عليه لشعركِ؟",
        options: [
          { id: "dry", label: "الجفاف والتلف", tags: ["شعر جاف", "إصلاح"] },
          { id: "frizz", label: "الهيشان", tags: ["هيشان"] },
          { id: "oil", label: "دهنية الفروة", tags: ["فروة دهنية"] },
          { id: "fall", label: "التساقط الخفيف", tags: ["تساقط"] },
          { id: "shine", label: "اللمعان والصحة", tags: ["لمعان شعر"] },
          { id: "unsure", label: "لستُ متأكدة", tags: ["استكشاف"] },
        ],
      },
      {
        id: "hairType",
        title: "كيف تصفين شعركِ؟",
        options: [
          { id: "fine", label: "ناعم وخفيف", tags: ["شعر ناعم"] },
          { id: "thick", label: "كثيف", tags: ["شعر كثيف"] },
          { id: "curly", label: "مموج أو مجعّد", tags: ["مجعد"] },
          { id: "colored", label: "مصبوغ / معالج", tags: ["مصبوغ"] },
          { id: "unsure", label: "لستُ متأكدة", tags: [] },
        ],
      },
      {
        id: "routine",
        title: "هل تستخدمين أدوات حرارية؟",
        options: [
          { id: "often", label: "نعم، كثيراً", tags: ["حرارة"] },
          { id: "sometimes", label: "أحياناً", tags: [] },
          { id: "rarely", label: "نادراً", tags: [] },
        ],
      },
      BUDGET_Q,
      PREFS_Q,
    ],
  },
  {
    id: "makeup",
    number: "03",
    title: "المكياج",
    desc: "لإطلالة تناسبكِ",
    icon: "makeup",
    intro: "تمام، خلينا نبني إطلالة تناسبكِ.",
    categoryHint: "makeup",
    questions: [
      {
        id: "occasion",
        title: "المكياج لمناسبة معينة ولا يومي؟",
        options: [
          { id: "daily", label: "يومي وطبيعي", tags: ["يومي", "طبيعي"] },
          { id: "event", label: "مناسبة", tags: ["مناسبة"] },
          { id: "both", label: "الاثنين", tags: ["مرن"] },
        ],
      },
      {
        id: "look",
        title: "شنو نوع الإطلالة اللي تحبينها؟",
        options: [
          { id: "soft", label: "ناعمة", tags: ["ناعمة"] },
          { id: "natural", label: "طبيعية", tags: ["طبيعية"] },
          { id: "glam", label: "أكثر جاذبية", tags: ["جاذبية"] },
        ],
      },
      {
        id: "when",
        title: "متى المناسبة؟",
        when: (a) => a.occasion === "event" || a.occasion === "both",
        options: [
          { id: "soon", label: "قريبة جداً", tags: ["عاجلة"] },
          { id: "week", label: "خلال أسبوع", tags: [] },
          { id: "later", label: "لاحقاً", tags: [] },
        ],
      },
      {
        id: "base",
        title: "شنو أهم شيء عندكِ في المكياج؟",
        options: [
          { id: "base", label: "الأساس والتغطية", tags: ["فاونديشن"] },
          { id: "eyes", label: "العيون", tags: ["عيون"] },
          { id: "lips", label: "الشفاه", tags: ["شفاه"] },
          { id: "glow", label: "توهج خفيف", tags: ["توهج"] },
          { id: "full", label: "طقم متكامل", tags: ["طقم"] },
        ],
      },
      BUDGET_Q,
      PREFS_Q,
    ],
  },
  {
    id: "body",
    number: "04",
    title: "العناية بالجسم",
    desc: "لعناية تكمّل جمالكِ",
    icon: "body",
    intro: "تمام، خلينا نكمّل جمالكِ بالعناية والجسم.",
    categoryHint: "body-care",
    questions: [
      {
        id: "focus",
        title: "شنو تحبين نركز عليه؟",
        options: [
          { id: "soft", label: "نعومة وترطيب", tags: ["ترطيب جسم"] },
          { id: "scent", label: "رائحة لطيفة", tags: ["معطر خفيف"] },
          { id: "both", label: "الاثنين معاً", tags: ["ترطيب جسم", "رائحة"] },
          { id: "unsure", label: "لستُ متأكدة", tags: ["استكشاف"] },
        ],
      },
      {
        id: "moment",
        title: "متى تستخدمين العناية أكثر؟",
        options: [
          { id: "morning", label: "صباحاً", tags: ["صباح"] },
          { id: "night", label: "مساءً", tags: ["مساء"] },
          { id: "anytime", label: "حسب اليوم", tags: [] },
        ],
      },
      BUDGET_Q,
      PREFS_Q,
    ],
  },
  {
    id: "full-ritual",
    number: "05",
    title: "روتين كامل",
    desc: "دعيني أرتب لكِ كل شيء",
    icon: "ritual",
    intro: "تمام، خليني أرتب لكِ روتيناً واضحاً من البداية.",
    categoryHint: "all",
    questions: [
      {
        id: "priority",
        title: "شنو أولويتكِ اليوم؟",
        options: [
          { id: "skin", label: "البشرة", tags: ["بشرة"] },
          { id: "hair", label: "الشعر", tags: ["شعر"] },
          { id: "makeup", label: "المكياج", tags: ["مكياج"] },
          { id: "body", label: "الجسم", tags: ["جسم"] },
          { id: "balance", label: "توازن بين أكثر من شيء", tags: ["روتين كامل"] },
        ],
      },
      {
        id: "time",
        title: "قديش وقت عندكِ للروتين يومياً؟",
        options: [
          { id: "fast", label: "٣ دقائق أو أقل", tags: ["سريع"] },
          { id: "mid", label: "٥–١٠ دقائق", tags: ["متوسط"] },
          { id: "full", label: "أحب طقساً أطول", tags: ["كامل"] },
        ],
      },
      {
        id: "goal",
        title: "شنو النتيجة اللي تبينها؟",
        options: [
          { id: "glow", label: "نضارة", tags: ["نضارة"] },
          { id: "calm", label: "هدوء وراحة", tags: ["هدوء"] },
          { id: "polish", label: "مظهر مرتّب وأنيق", tags: ["أنيق"] },
          { id: "unsure", label: "لستُ متأكدة", tags: [] },
        ],
      },
      BUDGET_Q,
      PREFS_Q,
    ],
  },
  {
    id: "unsure",
    number: "06",
    title: "لستُ متأكدة",
    desc: "لارسا ستساعدكِ على اكتشاف ما تحتاجينه",
    icon: "mark",
    featured: true,
    intro: "ماكو مشكلة — خلينا نكتشف سوا شنو يناسبكِ.",
    categoryHint: "all",
    questions: [
      {
        id: "mood",
        title: "شنو أقرب وصف لمزاجكِ الجمالي اليوم؟",
        options: [
          { id: "fresh", label: "أبي نضارة", tags: ["نضارة"] },
          { id: "soft", label: "أبي نعومة وهدوء", tags: ["هدوء"] },
          { id: "polish", label: "أبي إطلالة مرتّبة", tags: ["أنيق"] },
          { id: "fix", label: "أبي أبدأ من الصفر", tags: ["استكشاف"] },
        ],
      },
      {
        id: "area",
        title: "وين تحسين إنكِ تحتاجين اهتمام أكثر؟",
        options: [
          { id: "face", label: "الوجه", tags: ["بشرة"] },
          { id: "hair", label: "الشعر", tags: ["شعر"] },
          { id: "body", label: "الجسم", tags: ["جسم"] },
          { id: "look", label: "الإطلالة عامة", tags: ["مكياج"] },
        ],
      },
      BUDGET_Q,
      PREFS_Q,
    ],
  },
];

export function getLarsaPath(id: string) {
  return LARSA_PATHS.find((p) => p.id === id) ?? null;
}

/** الأسئلة المرئية حسب الإجابات الحالية */
export function visibleQuestions(
  path: LarsaPathDef,
  answers: Record<string, string | string[]>,
) {
  return path.questions.filter((q) => (q.when ? q.when(answers) : true));
}

export function collectTags(
  path: LarsaPathDef,
  answers: Record<string, string | string[]>,
  freeText?: string,
) {
  const tags = new Set<string>();
  tags.add(path.title);
  for (const q of path.questions) {
    const val = answers[q.id];
    if (!val) continue;
    const ids = Array.isArray(val) ? val : [val];
    for (const id of ids) {
      const opt = q.options.find((o) => o.id === id);
      opt?.tags?.forEach((t) => tags.add(t));
      if (opt?.label) tags.add(opt.label);
    }
  }
  if (freeText?.trim()) {
    const t = freeText.trim();
    if (/جفاف|نشفة|dry/i.test(t)) tags.add("جفاف");
    if (/حساس|sensitive/i.test(t)) tags.add("حساسية");
    if (/نضارة|إشراقة|glow|باهت/i.test(t)) tags.add("نضارة");
    if (/حبوب|acne/i.test(t)) tags.add("حبوب");
    if (/شعر|hair/i.test(t)) tags.add("شعر");
    if (/مكياج|makeup/i.test(t)) tags.add("مكياج");
    tags.add("طلب حر");
  }
  return [...tags];
}

export function buildConsultQuery(
  path: LarsaPathDef,
  answers: Record<string, string | string[]>,
  freeText?: string,
) {
  const tags = collectTags(path, answers, freeText);
  return {
    pathId: path.id,
    categoryHint: path.categoryHint,
    budget: typeof answers.budget === "string" ? answers.budget : "any",
    tags,
    freeText: freeText?.trim() ?? "",
    summaryAr: tags.slice(0, 8).join(" · "),
  };
}
