export function safeNext(raw: string | null) {
  if (!raw) return "/account";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/account";
  if (raw.startsWith("/admin")) return "/account";
  return raw;
}

export const AUTH_FETCH: RequestInit = { credentials: "include" };

export function isAuthRoute(pathname: string) {
  return pathname === "/login" || pathname === "/register";
}

export function passwordStrength(password: string): 0 | 1 | 2 | 3 {
  if (password.length < 8) return 0;
  let score = 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;
  if (password.length >= 12) score = Math.min(3, score + 1) as 2 | 3;
  return Math.min(3, score) as 0 | 1 | 2 | 3;
}
