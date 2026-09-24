import type { LucideIcon } from "lucide-react";
import {
  Beaker,
  Check,
  Droplets,
  Flower2,
  Leaf,
  Moon,
  Shield,
  Sparkles,
  Sun,
  Waves,
  Wind,
} from "lucide-react";
import type { SkinConcern, SkinType } from "@/types";

const BENEFIT_RULES: { test: RegExp; Icon: LucideIcon }[] = [
  { test: /ترطيب|hydrate|moistur|water|aqua|dew/i, Icon: Droplets },
  { test: /إشراق|نضار|glow|radiant|bright|lumin/i, Icon: Sparkles },
  { test: /تنظيف|clean|purif|foam|wash|clarit/i, Icon: Waves },
  { test: /تهدئ|calm|sooth|sensitiv|gentle|لطيف/i, Icon: Leaf },
  { test: /حماية|protect|barrier|spf|shield|ثبات|24|long.?wear/i, Icon: Shield },
  { test: /تماسك|firm|anti.?age|wrinkle|elast|تغطية|cover/i, Icon: Flower2 },
  { test: /توازن|oil|matt|sebum|دهن|لمعان|زيوت/i, Icon: Wind },
  { test: /ليل|night|repair|renew/i, Icon: Moon },
  { test: /نهار|day|sun|uv/i, Icon: Sun },
];

const INGREDIENT_RULES: { test: RegExp; Icon: LucideIcon }[] = [
  { test: /hyaluron|هيالورون|pha|aha|bha|acid|حمض/i, Icon: Beaker },
  { test: /tea|green|matcha|شاي|botan|herb|plant/i, Icon: Leaf },
  { test: /allantoin|panthenol|centella|aloe|chamomile|تهدئ/i, Icon: Flower2 },
  { test: /niacin|vitamin|retinol|peptide|ceram/i, Icon: Sparkles },
  { test: /oil|butter|squalane|argan|jojoba/i, Icon: Droplets },
  { test: /zinc|salicylic|charcoal|clay/i, Icon: Shield },
];

const CONCERN_ICONS: Record<SkinConcern, LucideIcon> = {
  hydration: Droplets,
  glow: Sparkles,
  acne: Waves,
  "anti-aging": Flower2,
  sensitivity: Leaf,
  "oil-control": Wind,
};

const SKIN_TYPE_ICONS: Record<SkinType, LucideIcon> = {
  dry: Droplets,
  oily: Wind,
  combination: Waves,
  normal: Check,
  sensitive: Leaf,
};

const FALLBACK_ICONS = [Sparkles, Droplets, Leaf, Flower2, Beaker, Sun] as const;

export function benefitIconFor(text: string, index: number): LucideIcon {
  for (const rule of BENEFIT_RULES) {
    if (rule.test.test(text)) return rule.Icon;
  }
  return FALLBACK_ICONS[index % FALLBACK_ICONS.length];
}

export function ingredientIconFor(text: string, index: number): LucideIcon {
  for (const rule of INGREDIENT_RULES) {
    if (rule.test.test(text)) return rule.Icon;
  }
  return FALLBACK_ICONS[index % FALLBACK_ICONS.length];
}

export function concernIcon(concern: SkinConcern): LucideIcon {
  return CONCERN_ICONS[concern] ?? Sparkles;
}

export function skinTypeIcon(type: SkinType): LucideIcon {
  return SKIN_TYPE_ICONS[type] ?? Check;
}

/** Short label from a benefit string (title before colon/dash). */
export function benefitLabel(text: string): string {
  const [title] = text.split(/[:：–—-]/);
  return (title || text).trim();
}

export function benefitParts(text: string): { title: string; detail?: string } {
  const cleaned = text.trim();
  const match = cleaned.match(/^(.{2,48}?)(?:\s*[:：–—-]\s*|\s{2,})(.+)$/);
  if (match) {
    return { title: match[1].trim(), detail: match[2].trim() };
  }
  const [title, ...rest] = cleaned.split(/[:：–—-]/);
  const detail = rest.join("—").trim();
  return {
    title: (title || cleaned).trim(),
    detail: detail || undefined,
  };
}

/** Soft one-line hint when benefit has no secondary clause. */
export function benefitFallbackHint(text: string, ar: boolean): string {
  if (/spf|حماية|uv|sun/i.test(text)) {
    return ar ? "حماية يومية مع المكياج" : "Daily protection with makeup";
  }
  if (/ثبات|long|wear|24/i.test(text)) {
    return ar ? "أداء طويل الأمد" : "Long-lasting performance";
  }
  if (/oil|matt|زيوت|لمعان/i.test(text)) {
    return ar ? "لمظهر متوازن طوال اليوم" : "Balanced look all day";
  }
  if (/تغطية|cover|build/i.test(text)) {
    return ar ? "لتحكم كامل بالتغطية" : "Full control over coverage";
  }
  return ar ? "لمسة فاخرة لبشرة أكثر ثقة" : "A refined finish for confident skin";
}
