export type GovernorateOption = {
  id: string;
  en: string;
  ar: string;
};

/** Structured Iraqi governorates — Passport identity field. */
export const IRAQ_GOVERNORATES: GovernorateOption[] = [
  { id: "baghdad", en: "Baghdad", ar: "بغداد" },
  { id: "basra", en: "Basra", ar: "البصرة" },
  { id: "nineveh", en: "Nineveh", ar: "نينوى" },
  { id: "erbil", en: "Erbil", ar: "أربيل" },
  { id: "sulaymaniyah", en: "Sulaymaniyah", ar: "السليمانية" },
  { id: "duhok", en: "Duhok", ar: "دهوك" },
  { id: "kirkuk", en: "Kirkuk", ar: "كركوك" },
  { id: "najaf", en: "Najaf", ar: "النجف" },
  { id: "karbala", en: "Karbala", ar: "كربلاء" },
  { id: "babylon", en: "Babylon", ar: "بابل" },
  { id: "wasit", en: "Wasit", ar: "واسط" },
  { id: "diyala", en: "Diyala", ar: "ديالى" },
  { id: "anbar", en: "Anbar", ar: "الأنبار" },
  { id: "salahuddin", en: "Salahuddin", ar: "صلاح الدين" },
  { id: "maysan", en: "Maysan", ar: "ميسان" },
  { id: "dhi-qar", en: "Dhi Qar", ar: "ذي قار" },
  { id: "muthanna", en: "Muthanna", ar: "المثنى" },
  { id: "qadisiyyah", en: "Al-Qadisiyyah", ar: "القادسية" },
];

export function getGovernorateLabel(
  id: string | null | undefined,
  locale: "ar" | "en",
): string | null {
  if (!id) return null;
  const g = IRAQ_GOVERNORATES.find((x) => x.id === id);
  if (!g) return null;
  return locale === "ar" ? g.ar : g.en;
}
