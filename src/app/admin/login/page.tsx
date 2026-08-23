import { Suspense } from "react";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <main className="admin-login-page relative min-h-dvh overflow-hidden" dir="rtl">
      {/* Atmosphere */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[#F8F6F4]" />
        <div className="absolute -start-24 top-[-10%] size-[28rem] rounded-full bg-[radial-gradient(circle,_rgba(73,51,79,0.14),_transparent_68%)] blur-2xl" />
        <div className="absolute -end-16 bottom-[-8%] size-[24rem] rounded-full bg-[radial-gradient(circle,_rgba(212,181,184,0.35),_transparent_70%)] blur-2xl" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(52,34,57,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(52,34,57,0.03) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative z-[1] mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center px-5 py-12">
        <Suspense
          fallback={
            <div className="w-full max-w-md rounded-[22px] border border-white/60 bg-white/70 p-10 text-center text-[13px] text-[#968A93] backdrop-blur">
              جارٍ تجهيز بوابة الدخول…
            </div>
          }
        >
          <AdminLoginForm />
        </Suspense>

        <p className="mt-8 text-center text-[11px] tracking-wide text-[#968A93]">
          Protected access · VELORA Beauty
        </p>
      </div>
    </main>
  );
}
