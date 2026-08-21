"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

type Status = {
  configured?: boolean;
  companyPhoneLocal?: string;
  stateInstance?: string;
  deliveryReady?: boolean;
  warning?: string | null;
  form?: {
    companyPhone: string;
    greenApiInstanceId: string;
    greenApiToken: string;
    greenApiUrl: string;
  };
};

export function WhatsAppAdminPanel() {
  const [status, setStatus] = useState<Status | null>(null);
  const [companyPhone, setCompanyPhone] = useState("07830000492");
  const [greenId, setGreenId] = useState("");
  const [greenToken, setGreenToken] = useState("");
  const [greenUrl, setGreenUrl] = useState("https://api.green-api.com");
  const [testPhone, setTestPhone] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [waState, setWaState] = useState<string | null>(null);
  const [qrHint, setQrHint] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/whatsapp", { cache: "no-store" });
    const data = (await res.json()) as Status & { ok?: boolean };
    setStatus(data);
    if (data.form) {
      setCompanyPhone(data.form.companyPhone || "07830000492");
      setGreenId(data.form.greenApiInstanceId || "");
      setGreenToken(data.form.greenApiToken || "");
      setGreenUrl(data.form.greenApiUrl || "https://api.green-api.com");
    }
  }

  const loadQr = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/whatsapp/qr?t=${Date.now()}`, {
        cache: "no-store",
      });
      const data = (await res.json()) as {
        ok?: boolean;
        stateInstance?: string;
        qrBase64?: string | null;
        qrType?: string;
        message?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error || "تعذّر جلب QR.");
        return;
      }
      setError(null);
      setWaState(data.stateInstance || null);
      setQrHint(data.message || null);

      if (data.stateInstance === "authorized") {
        setMessage("الرقم مربوط وجاهز لإرسال الرموز.");
        setQrBase64(null);
        return;
      }

      if (data.qrBase64) {
        setQrBase64(data.qrBase64);
      } else {
        setQrBase64(null);
        // instance قد يكون starting — أعد المحاولة
        setQrHint(
          data.message ||
            "الـ instance ما زال يقلع… اضغطِ تحديث بعد 10 ثوانٍ.",
        );
      }
    } catch {
      setError("تعذّر جلب رمز الربط. تأكدِ أن السيرفر يعمل.");
    }
  }, []);

  useEffect(() => {
    void load().then(() => loadQr());
  }, [loadQr]);

  // لا نحدّث QR أثناء القيد الأصفر أو عند الربط الناجح
  useEffect(() => {
    if (
      waState === "authorized" ||
      waState === "yellowCard" ||
      waState === "suspended" ||
      waState === "blocked"
    ) {
      return;
    }
    const id = setInterval(() => {
      void loadQr();
    }, 20000);
    return () => clearInterval(id);
  }, [waState, loadQr]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/whatsapp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "green-api",
          companyPhone,
          greenApiInstanceId: greenId,
          greenApiToken: greenToken,
          greenApiUrl: greenUrl,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || "تعذّر الحفظ.");
      setMessage("تم حفظ المفاتيح.");
      await load();
      await loadQr();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر الحفظ.");
    } finally {
      setBusy(false);
    }
  }

  async function onTest(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: testPhone }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
        sampleCode?: string;
      };
      if (!res.ok || !data.ok) throw new Error(data.error || "فشل الاختبار.");
      setMessage(
        `${data.message || "تم الإرسال."}${
          data.sampleCode ? ` رمز الاختبار: ${data.sampleCode}` : ""
        }`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل الاختبار.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="border border-[var(--plum)]/12 bg-[var(--mist)] p-5">
        <p className="t2 text-[var(--muted)]">رقم الشركة للإرسال</p>
        <p className="font-display t5 mt-1 text-[var(--plum)]" dir="ltr">
          {status?.companyPhoneLocal || "07830000492"}
        </p>
        <p className="t3 mt-3 text-[var(--ink)]/75">
          الحالة:{" "}
          {waState === "authorized" ? (
            <span className="text-green-800">مربوط (authorized)</span>
          ) : waState === "yellowCard" || waState === "suspended" ? (
            <span className="text-amber-900">قيد مؤقت — لا يُسلَّم الإرسال</span>
          ) : (
            <span className="text-amber-800" dir="ltr">
              {waState || "…"}
            </span>
          )}
        </p>
        {status?.warning ||
        waState === "yellowCard" ||
        waState === "suspended" ? (
          <div className="t3 mt-4 border border-amber-300/60 bg-amber-50 px-4 py-3 text-amber-950">
            {status?.warning ||
              "واتساب فرض قيداً مؤقتاً (بطاقة صفراء) على رقم الشركة. الرسائل تُقبل في الـ API لكن لا تصل للمستلمة. من هاتف 07830000492: الإعدادات → المساعدة → تواصل معنا واطلبي رفع القيد."}
          </div>
        ) : null}
      </div>

      {waState === "yellowCard" || waState === "suspended" || waState === "blocked" ? (
        <div className="border border-[var(--plum)]/10 bg-[var(--surface)] p-5">
          <h2 className="font-display t5 text-[var(--plum)]">ما العمل الآن؟</h2>
          <ol className="t3 mt-3 list-decimal space-y-2 pe-5 text-[var(--ink)]/80">
            <li>افتحي واتساب على هاتف الشركة 07830000492</li>
            <li>الإعدادات → المساعدة → تواصل معنا</li>
            <li>اطلبي رفع القيود عن الحساب</li>
            <li>بعد الرد، ارجعي هنا واضغطي «تحديث الرمز»</li>
          </ol>
          <p className="t2 mt-4 text-[var(--muted)]">
            مؤقتاً: رمز التحقق يظهر في صفحة التسجيل إن تعذّر التسليم عبر واتساب.
          </p>
        </div>
      ) : null}

      {waState !== "authorized" &&
      waState !== "yellowCard" &&
      waState !== "suspended" &&
      waState !== "blocked" ? (
        <div className="border border-[var(--plum)]/10 bg-white p-5 text-center">
          <h2 className="font-display t5 text-[var(--plum)]">امسحي رمز QR</h2>
          <p className="t3 mt-2 text-[var(--muted)]">
            من هاتف الشركة <span dir="ltr">07830000492</span>:
            <br />
            واتساب → الأجهزة المرتبطة → ربط جهاز → امسحي الرمز فوراً
            <br />
            (الرمز يتجدّد تلقائياً كل 12 ثانية)
          </p>

          <div className="mx-auto mt-5 flex h-72 w-72 items-center justify-center border border-[var(--plum)]/15 bg-white p-3">
            {qrBase64 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={qrBase64.slice(0, 32)}
                src={`data:image/png;base64,${qrBase64}`}
                alt="رمز ربط واتساب"
                width={256}
                height={256}
                className="h-64 w-64 bg-white object-contain"
              />
            ) : (
              <p className="t3 px-4 text-[var(--muted)]">
                {qrHint || "جارٍ تحميل الرمز…"}
              </p>
            )}
          </div>

          {qrHint && qrBase64 ? (
            <p className="t2 mt-3 text-[var(--muted)]">{qrHint}</p>
          ) : null}

          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Button
              type="button"
              disabled={busy}
              onClick={() => void loadQr()}
            >
              تحديث QR الآن
            </Button>
            <a
              href="/admin/whatsapp-link"
              className="t3 inline-flex items-center border border-[var(--plum)]/20 px-4 py-3 text-[var(--plum)]"
            >
              فتح صفحة الرمز بحجم كبير
            </a>
          </div>
        </div>
      ) : null}

      <form
        onSubmit={onSave}
        className="space-y-5 border border-[var(--plum)]/10 bg-white p-5"
      >
        <label className="block">
          <span className="t2 text-[var(--muted)]">رقم واتساب الشركة</span>
          <input
            value={companyPhone}
            onChange={(e) => setCompanyPhone(e.target.value)}
            dir="ltr"
            className="t3 mt-2 w-full border-b border-[var(--plum)]/20 bg-transparent py-3 outline-none focus:border-[var(--plum)]"
          />
        </label>
        <label className="block">
          <span className="t2 text-[var(--muted)]">idInstance</span>
          <input
            value={greenId}
            onChange={(e) => setGreenId(e.target.value)}
            dir="ltr"
            className="t3 mt-2 w-full border-b border-[var(--plum)]/20 bg-transparent py-3 outline-none focus:border-[var(--plum)]"
          />
        </label>
        <label className="block">
          <span className="t2 text-[var(--muted)]">apiTokenInstance</span>
          <input
            value={greenToken}
            onChange={(e) => setGreenToken(e.target.value)}
            dir="ltr"
            className="t3 mt-2 w-full border-b border-[var(--plum)]/20 bg-transparent py-3 outline-none focus:border-[var(--plum)]"
          />
        </label>
        <label className="block">
          <span className="t2 text-[var(--muted)]">API URL</span>
          <input
            value={greenUrl}
            onChange={(e) => setGreenUrl(e.target.value)}
            dir="ltr"
            className="t3 mt-2 w-full border-b border-[var(--plum)]/20 bg-transparent py-3 outline-none focus:border-[var(--plum)]"
          />
        </label>
        <Button type="submit" disabled={busy}>
          حفظ المفاتيح
        </Button>
      </form>

      <form
        onSubmit={onTest}
        className="space-y-4 border border-[var(--plum)]/10 bg-white p-5"
      >
        <h2 className="font-display t5 text-[var(--plum)]">اختبار إرسال</h2>
        <input
          value={testPhone}
          onChange={(e) => setTestPhone(e.target.value)}
          required
          dir="ltr"
          placeholder="07XXXXXXXXX رقمكِ"
          className="t3 w-full border-b border-[var(--plum)]/20 bg-transparent py-3 outline-none focus:border-[var(--plum)]"
        />
        <Button type="submit" disabled={busy || waState !== "authorized"}>
          إرسال اختبار من 07830000492
        </Button>
      </form>

      {error ? (
        <div className="t3 border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="t3 border border-green-200 bg-green-50 px-4 py-3 text-green-900">
          {message}
        </div>
      ) : null}
    </div>
  );
}
