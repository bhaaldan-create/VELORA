export function formatPassportDob(iso: string | null | undefined): string {
  if (!iso) return "—";
  const parts = iso.slice(0, 10).split("-");
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts;
  return `${d} / ${m} / ${y}`;
}

export function passportInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "V";
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "V";
}

export function labelPassportOption(
  options: readonly { id: string; en: string; ar: string }[],
  id: string,
  ar: boolean,
): string {
  if (!id) return "—";
  const hit = options.find((o) => o.id === id);
  return hit ? (ar ? hit.ar : hit.en) : "—";
}

export function labelPassportOptions(
  options: readonly { id: string; en: string; ar: string }[],
  ids: string[],
  ar: boolean,
): string {
  if (!ids.length) return "—";
  return ids
    .map((id) => labelPassportOption(options, id, ar))
    .filter((x) => x !== "—")
    .join(" · ");
}
