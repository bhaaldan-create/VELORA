"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, ShieldCheck, User } from "lucide-react";

type Step = "credentials" | "access";

export function AdminLoginForm() {
  const search = useSearchParams();
  const [step, setStep] = useState<Step>("credentials");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  const nextPath = useMemo(() => {
    const n = search.get("next");
    if (n && n.startsWith("/admin")) return n;
    return "/admin";
  }, [search]);

  const configError = search.get("error") === "config";

  useEffect(() => {
    if (step === "access") {
      window.setTimeout(() => codeRefs.current[0]?.focus(), 80);
    }
  }, [step]);

  const codeCells = useMemo(() => {
    const cells = accessCode.toUpperCase().split("").slice(0, 6);
    while (cells.length < 6) cells.push("");
    return cells;
  }, [accessCode]);

  function goToAccess(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError("أدخلي اسم المستخدم وكلمة المرور.");
      return;
    }
    setStep("access");
  }

  async function completeLogin(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const code = accessCode.trim().toUpperCase();
      if (code.length < 6) {
        throw new Error("أدخلي الشفرة السرية كاملة.");
      }
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
          accessCode: code,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "تعذّر تسجيل الدخول.");
      }
      window.location.assign(nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر تسجيل الدخول.");
    } finally {
      setSubmitting(false);
    }
  }

  function setCodeAt(index: number, value: string) {
    const char = value.replace(/[^a-zA-Z0-9]/g, "").slice(-1).toUpperCase();
    const next = [...codeCells];
    next[index] = char;
    setAccessCode(next.join(""));
    if (char && index < 5) {
      codeRefs.current[index + 1]?.focus();
    }
  }

  function onCodeKeyDown(index: number, key: string) {
    if (key === "Backspace" && !codeCells[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  }

  function onCodePaste(text: string) {
    const cleaned = text
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .slice(0, 6);
    setAccessCode(cleaned);
    const focusIdx = Math.min(cleaned.length, 5);
    window.setTimeout(() => codeRefs.current[focusIdx]?.focus(), 20);
  }

  return (
    <div className="admin-login-panel relative w-full overflow-hidden rounded-[22px] border border-white/50 bg-white/80 shadow-[0_24px_80px_rgba(52,34,57,0.18)] backdrop-blur-xl">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(ellipse_at_top,_rgba(73,51,79,0.12),_transparent_70%)]"
        aria-hidden
      />

      <div className="relative px-6 pb-7 pt-8 sm:px-9 sm:pb-9 sm:pt-10">
        <div className="mb-8 text-center">
          <p className="font-[family-name:var(--font-brand)] text-[11px] font-medium tracking-[0.35em] text-[#968A93]">
            VELORA
          </p>
          <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-[#342239] sm:text-[2rem]">
            Admin OS
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-[#6E626C]">
            {step === "credentials"
              ? "ادخلي بياناتك للمتابعة إلى مساحة التشغيل."
              : "طبقة حماية إضافية — أدخلي الشفرة السرية."}
          </p>
        </div>

        <div className="mb-7 flex items-center justify-center gap-2">
          <StepDot
            active={step === "credentials"}
            done={step === "access"}
            label="1"
          />
          <span className="h-px w-8 bg-[#E8E2E0]" />
          <StepDot active={step === "access"} done={false} label="2" />
        </div>

        {configError ? (
          <div className="mb-5 rounded-[12px] border border-amber-200/80 bg-amber-50 px-4 py-3 text-[13px] text-amber-950">
            أضيفي <span dir="ltr">ADMIN_USERNAME</span> و{" "}
            <span dir="ltr">ADMIN_PASSWORD</span> في البيئة ثم أعيدي تشغيل
            السيرفر.
          </div>
        ) : null}

        {step === "credentials" ? (
          <form onSubmit={goToAccess} className="space-y-4 admin-animate-in">
            <Field
              label="اسم المستخدم"
              icon={<User className="size-4" strokeWidth={1.6} />}
            >
              <input
                id="admin-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="admin-login-input"
                dir="ltr"
                placeholder="Username"
                required
              />
            </Field>

            <Field
              label="كلمة المرور"
              icon={<Lock className="size-4" strokeWidth={1.6} />}
            >
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="admin-login-input pe-11"
                  dir="ltr"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-[#968A93] hover:text-[#342239]"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "إخفاء" : "إظهار"}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" strokeWidth={1.6} />
                  ) : (
                    <Eye className="size-4" strokeWidth={1.6} />
                  )}
                </button>
              </div>
            </Field>

            {error ? <ErrorBox message={error} /> : null}

            <button
              type="submit"
              className="admin-login-submit"
              disabled={configError}
            >
              متابعة
            </button>
          </form>
        ) : (
          <form onSubmit={completeLogin} className="space-y-5 admin-animate-in">
            <div className="rounded-[14px] border border-[#EEE9E7] bg-[#FBFAF9] px-4 py-3">
              <p className="text-[11px] text-[#968A93]">الحساب</p>
              <p
                className="mt-0.5 text-[14px] font-medium text-[#342239]"
                dir="ltr"
              >
                {username}
              </p>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <label className="flex items-center gap-1.5 text-[12px] font-medium text-[#6E626C]">
                  <ShieldCheck className="size-3.5" strokeWidth={1.7} />
                  الشفرة السرية
                </label>
                <button
                  type="button"
                  className="text-[12px] text-[#968A93] hover:text-[#342239]"
                  onClick={() => {
                    setStep("credentials");
                    setAccessCode("");
                    setError(null);
                  }}
                >
                  رجوع
                </button>
              </div>

              <div
                className="flex justify-center gap-2"
                dir="ltr"
                onPaste={(e) => {
                  e.preventDefault();
                  onCodePaste(e.clipboardData.getData("text"));
                }}
              >
                {codeCells.map((cell, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      codeRefs.current[i] = el;
                    }}
                    value={cell}
                    onChange={(e) => setCodeAt(i, e.target.value)}
                    onKeyDown={(e) => onCodeKeyDown(i, e.key)}
                    maxLength={1}
                    inputMode="text"
                    autoComplete="one-time-code"
                    aria-label={`رمز ${i + 1}`}
                    className="size-11 rounded-[12px] border border-[#E8E2E0] bg-white text-center text-[1.1rem] font-semibold tracking-wider text-[#342239] outline-none transition focus:border-[#49334F] focus:shadow-[0_0_0_3px_rgba(73,51,79,0.12)] sm:size-12"
                  />
                ))}
              </div>
              <p className="mt-3 text-center text-[11px] text-[#968A93]">
                ٦ خانات · أحرف وأرقام
              </p>
            </div>

            {error ? <ErrorBox message={error} /> : null}

            <button
              type="submit"
              className="admin-login-submit"
              disabled={submitting || accessCode.length < 6}
            >
              {submitting ? "جارٍ التحقق…" : "دخول لوحة الإدارة"}
            </button>
          </form>
        )}

        <Link
          href="/"
          className="mt-6 block text-center text-[12px] text-[#968A93] transition hover:text-[#342239]"
        >
          العودة للمتجر
        </Link>
      </div>
    </div>
  );
}

function StepDot({
  active,
  done,
  label,
}: {
  active: boolean;
  done: boolean;
  label: string;
}) {
  return (
    <span
      className={`flex size-7 items-center justify-center rounded-full text-[11px] font-semibold transition ${
        active || done
          ? "bg-[#342239] text-white"
          : "bg-[#F2EEEC] text-[#968A93]"
      }`}
    >
      {label}
    </span>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-[#6E626C]">
        <span className="text-[#968A93]">{icon}</span>
        {label}
      </span>
      {children}
    </label>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-[12px] border border-[#8f3d45]/20 bg-[#f6e8ea] px-4 py-3 text-[13px] text-[#8f3d45]">
      {message}
    </div>
  );
}
