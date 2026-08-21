"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

/** صفحة كبيرة فقط لعرض QR ومسحه بسرعة */
export default function WhatsAppLinkPage() {
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [state, setState] = useState<string>("…");
  const [hint, setHint] = useState("جارٍ تحميل الرمز…");
  const [error, setError] = useState<string | null>(null);

  const loadQr = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/whatsapp/qr?t=${Date.now()}`, {
        cache: "no-store",
      });
      const data = (await res.json()) as {
        ok?: boolean;
        stateInstance?: string;
        qrBase64?: string | null;
        message?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error || "تعذّر جلب الرمز");
        return;
      }
      setError(null);
      setState(data.stateInstance || "unknown");
      setHint(data.message || "");
      if (data.stateInstance === "authorized") {
        setQrBase64(null);
        setHint("تم الربط بنجاح ✓");
        return;
      }
      setQrBase64(data.qrBase64 || null);
    } catch {
      setError("تعذّر الاتصال بالسيرفر");
    }
  }, []);

  useEffect(() => {
    void loadQr();
    // كل 20 ثانية فقط لتجنّب حظر Green API
    const id = setInterval(() => void loadQr(), 20000);
    return () => clearInterval(id);
  }, [loadQr]);

  return (
    <main
      className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-5 py-10"
      dir="rtl"
    >
      <p className="t1 tracking-[0.18em] text-[var(--muted)]">VELORA</p>
      <h1 className="font-display t6 mt-2 font-semibold text-[var(--plum)]">
        ربط واتساب الشركة
      </h1>
      <p className="t3 mt-2 text-center text-[var(--muted)]">
        امسحي الرمز من هاتف <span dir="ltr">07830000492</span>
        <br />
        واتساب → الأجهزة المرتبطة → ربط جهاز
      </p>
      <p className="t2 mt-3 text-[var(--plum)]" dir="ltr">
        الحالة: {state}
      </p>

      <div className="mt-6 flex h-80 w-80 items-center justify-center border border-[var(--plum)]/20 bg-white p-4 shadow-sm">
        {qrBase64 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={qrBase64.slice(20, 40)}
            src={`data:image/png;base64,${qrBase64}`}
            alt="QR"
            width={288}
            height={288}
            className="h-72 w-72 object-contain"
          />
        ) : (
          <p className="t3 px-4 text-center text-[var(--muted)]">{hint}</p>
        )}
      </div>

      <p className="t2 mt-3 text-center text-[var(--muted)]">
        يتجدّد الرمز تلقائياً كل 10 ثوانٍ — امسحي فور ظهوره
      </p>

      {error ? (
        <p className="t3 mt-4 text-red-700">{error}</p>
      ) : null}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={() => void loadQr()}>
          تحديث الرمز الآن
        </Button>
        <Link
          href="/admin/whatsapp"
          className="t3 inline-flex items-center border border-[var(--plum)]/20 px-4 py-3 text-[var(--plum)]"
        >
          رجوع
        </Link>
      </div>
    </main>
  );
}
