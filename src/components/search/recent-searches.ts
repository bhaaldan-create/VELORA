const KEY = "velora.recent-searches";
const MAX = 8;

export function readRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(String).filter(Boolean).slice(0, MAX);
  } catch {
    return [];
  }
}

export function pushRecentSearch(q: string) {
  const value = q.trim();
  if (!value || typeof window === "undefined") return;
  const prev = readRecentSearches().filter(
    (x) => x.toLowerCase() !== value.toLowerCase(),
  );
  const next = [value, ...prev].slice(0, MAX);
  window.localStorage.setItem(KEY, JSON.stringify(next));
}

export function clearRecentSearches() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
