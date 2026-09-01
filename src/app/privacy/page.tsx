import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { brand, ui } from "@/constants/brand";
import { getInstagramUrl } from "@/lib/social-links";

const SITE_URL = "https://velorabeautyiq.me";
const EFFECTIVE_DATE = "1 سبتمبر 2026";

export const metadata: Metadata = {
  title: "سياسة الخصوصية",
  description:
    "سياسة الخصوصية لتطبيق وموقع VELORA Beauty — كيف نجمع ونستخدم وحماية بياناتكِ.",
  alternates: { canonical: `${SITE_URL}/privacy` },
  openGraph: {
    title: `سياسة الخصوصية · ${brand.name}`,
    url: `${SITE_URL}/privacy`,
    locale: "ar_IQ",
  },
};

export const revalidate = 86400;

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="t4 font-semibold text-[var(--plum)]">{title}</h2>
      <div className="t3 mt-3 space-y-3 text-[var(--ink)]/75 leading-relaxed">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  const instagram = getInstagramUrl();

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
      <p className="t1 font-medium tracking-[0.18em] text-[var(--muted)]">
        {ui.clientCare}
      </p>
      <h1 className="font-brand t7 mt-3 tracking-[0.12em] text-[var(--plum)]">
        سياسة الخصوصية
      </h1>
      <p className="t2 mt-2 text-[var(--muted)]">
        {brand.name} Beauty — آخر تحديث: {EFFECTIVE_DATE}
      </p>

      <p className="t4 mt-8 text-[var(--ink)]/80">
        نحن في <strong>{brand.name} Beauty</strong> («فيلورا»، «نحن») نحترم خصوصيتكِ
        ونلتزم بحماية البيانات الشخصية التي تقدّمينها عند استخدام موقعنا{" "}
        <a
          href={SITE_URL}
          className="text-[var(--plum)] underline-offset-2 hover:underline"
          dir="ltr"
        >
          velorabeautyiq.me
        </a>
        وتطبيقنا للجوال (iOS و Android). توضّح هذه السياسة ما نجمعه، لماذا، وكيف
        نتعامل معه.
      </p>

      <Section title="1. من نحن">
        <p>
          المشغّل: <strong>Mohammed AM Bahalddin A.S.</strong> — دار تجميل عراقية
          تقدّم منتجات العناية بالبشرة والجسم والشعر والمكياج عبر المتجر الإلكتروني
          والتطبيق.
        </p>
        <p>
          للاستفسارات المتعلقة بالخصوصية: تواصلي عبر{" "}
          <a
            href={SITE_URL}
            className="text-[var(--plum)] underline-offset-2 hover:underline"
          >
            الموقع
          </a>
          {instagram ? (
            <>
              {" "}
              أو{" "}
              <a
                href={instagram}
                className="text-[var(--plum)] underline-offset-2 hover:underline"
                rel="noopener noreferrer"
                target="_blank"
              >
                Instagram
              </a>
            </>
          ) : null}
          .
        </p>
      </Section>

      <Section title="2. البيانات التي نجمعها">
        <p>قد نجمع الأنواع التالية حسب ما تستخدمينه:</p>
        <ul className="list-disc space-y-2 ps-5">
          <li>
            <strong>الحساب:</strong> الاسم، البريد الإلكتروني، رقم الهاتف (عند
            التسجيل أو التحقق)، العنوان، المحافظة، وتاريخ الميلاد (اختياري).
          </li>
          <li>
            <strong>تسجيل الدخول الاجتماعي:</strong> عند اختيار Google أو Apple،
            نستلم معرّف الحساب والبريد (أو بريد Apple الخاص «Hide My Email») والاسم
            عند أول تسجيل — وفق ما تسمحي به Apple أو Google.
          </li>
          <li>
            <strong>الطلبات:</strong> المنتجات، المبالغ، عنوان التوصيل، طريقة
            الدفع، وحالة الطلب.
          </li>
          <li>
            <strong>الولاء والإحالة:</strong> نقاط VELORA Club، كود الإحالة، وسجل
            المكافآت.
          </li>
          <li>
            <strong>My VELORA:</strong> بطاقات الطلبات، التقييمات، ومحتوى الجمال
            المرتبط بحسابكِ.
          </li>
          <li>
            <strong>لارسا (المستشارة):</strong> أسئلة التجميل والتفضيلات التي
            تدخلينها للحصول على توصيات — لتحسين الاقتراحات وليس للإعلانات الخارجية.
          </li>
          <li>
            <strong>التقنية:</strong> نوع الجهاز، نظام التشغيل، وملفات تعريف
            الارتباط (cookies) للجلسة والتفضيلات (مثل اللغة والثيم).
          </li>
        </ul>
      </Section>

      <Section title="3. كيف نستخدم البيانات">
        <ul className="list-disc space-y-2 ps-5">
          <li>إنشاء وإدارة حسابكِ وتسجيل الدخول.</li>
          <li>معالجة الطلبات، التوصيل، والدعم.</li>
          <li>إرسال إشعارات متعلقة بالطلب أو الحساب (عند الموافقة).</li>
          <li>تشغيل برنامج الولاء والإحالات.</li>
          <li>تقديم توصيات لارسا داخل التطبيق.</li>
          <li>تحسين الخدمة، الأمان، ومنع الاحتيال.</li>
          <li>الامتثال للقوانين المعمول بها.</li>
        </ul>
        <p>لا نبيع بياناتكِ الشخصية لأطراف ثالثة لأغراض إعلانية.</p>
      </Section>

      <Section title="4. تسجيل الدخول بـ Apple و Google">
        <p>
          عند استخدام <strong>Sign in with Apple</strong> أو <strong>Google</strong>،
          تتم المصادقة عبر خوادم Apple أو Google. نستلم فقط المعلومات اللازمة لربط
          أو إنشاء حساب VELORA. Apple قد تقدّم بريد relay — نتعامل معه كبريد حسابكِ
          الرسمي. راجعي أيضاً سياسات Apple وGoogle:
        </p>
        <ul className="list-disc space-y-2 ps-5">
          <li>
            <a
              href="https://www.apple.com/legal/privacy/"
              className="text-[var(--plum)] underline-offset-2 hover:underline"
              rel="noopener noreferrer"
              target="_blank"
            >
              Apple Privacy Policy
            </a>
          </li>
          <li>
            <a
              href="https://policies.google.com/privacy"
              className="text-[var(--plum)] underline-offset-2 hover:underline"
              rel="noopener noreferrer"
              target="_blank"
            >
              Google Privacy Policy
            </a>
          </li>
        </ul>
      </Section>

      <Section title="5. الدفع والرسائل">
        <p>
          الدفع يتم عبر بوابات دفع معتمدة (مثل Stripe أو Wayl أو طرق محلية عند
          تفعيلها). لا نخزّن أرقام البطاقات الكاملة على خوادمنا — تُعالج لدى مزوّد
          الدفع.
        </p>
        <p>
          قد نستخدم WhatsApp Cloud API لإرسال رسائل التحقق أو الإيصالات عند
          تفعيلها — وفق رقم الهاتف الذي تقدّمينه.
        </p>
      </Section>

      <Section title="6. تطبيق الجوال (Capacitor)">
        <p>
          تطبيق <strong>VELORA Beauty</strong> (Bundle ID:{" "}
          <code className="rounded bg-[var(--mist)] px-1.5 py-0.5 text-[0.85em]">
            beauty.velora.app
          </code>
          ) يعرض نفس تجربة الموقع المنشور. المحتوى والحساب والطلبات تُدار عبر
          خوادمنا الآمنة — التطبيق ليس نسخة منفصلة مخزّنة بالكامل على الجهاز.
        </p>
        <p>
          قد يطلب التطبيق أذونات نظام (مثل الشبكة) لفتح الموقع والإشعارات عند
          تفعيلها لاحقاً.
        </p>
      </Section>

      <Section title="7. مشاركة البيانات مع أطراف ثالثة">
        <p>نشارك البيانات فقط عند الحاجة مع:</p>
        <ul className="list-disc space-y-2 ps-5">
          <li>مزوّدي الاستضافة والبنية (مثل Vercel، Neon).</li>
          <li>مزوّدي الدفع والتوصيل.</li>
          <li>Apple وGoogle — للمصادقة فقط.</li>
          <li>مزوّدي الذكاء الاصطناعي — لمعالجة استفسارات لارسا (بدون بيع البيانات).</li>
          <li>السلطات — إذا طُلب قانونياً.</li>
        </ul>
      </Section>

      <Section title="8. التخزين والأمان">
        <p>
          تُخزَّن البيانات على خوادم سحابية آمنة مع تشفير النقل (HTTPS). نطبّق
          جلسات موقّعة وصلاحيات وصول محدودة. لا يوجد نظام آمن 100% — نعمل باستمرار
          على تحسين الحماية.
        </p>
      </Section>

      <Section title="9. مدة الاحتفاظ">
        <p>
          نحتفظ بالبيانات طوال مدة الحساب النشط ولما يلزم لإتمام الطلبات، الولاء،
          والمتطلبات القانونية. يمكن طلب حذف الحساب وفق القسم التالي.
        </p>
      </Section>

      <Section title="10. حقوقكِ">
        <p>يمكنكِ — حسب القانون المعمول به:</p>
        <ul className="list-disc space-y-2 ps-5">
          <li>الوصول إلى بياناتكِ وتحديثها من صفحة الحساب.</li>
          <li>طلب تصحيح أو حذف الحساب عبر التواصل معنا.</li>
          <li>إلغاء الاشتراك في الرسائل التسويقية (إن وُجدت).</li>
        </ul>
      </Section>

      <Section title="11. الأطفال">
        <p>
          الخدمة موجّهة لمن بلغ 18 عاماً أو بموافقة ولي الأمر. لا نجمع عن قصد
          بيانات أطفال دون السن المناسب.
        </p>
      </Section>

      <Section title="12. التغييرات">
        <p>
          قد نحدّث هذه السياسة. سننشر النسخة الجديدة على هذه الصفحة مع تاريخ
          التحديث. الاستمرار في استخدام الخدمة بعد التحديث يعني قبول التغييرات
          المعقولة.
        </p>
      </Section>

      <hr className="my-12 border-[var(--border)]" />

      <h2 className="font-brand t5 tracking-[0.1em] text-[var(--plum)]">
        Privacy Policy (English Summary)
      </h2>
      <p className="t3 mt-4 text-[var(--ink)]/75 leading-relaxed" lang="en">
        VELORA Beauty operates velorabeautyiq.me and the VELORA Beauty mobile app
        (beauty.velora.app). We collect account, order, loyalty, and advisor (LARSA)
        data to provide shopping, delivery, and personalized beauty guidance. Sign in
        with Apple/Google is optional; payment data is processed by payment providers.
        We do not sell personal data. Contact us via the website or Instagram for
        privacy requests. Effective: {EFFECTIVE_DATE}.
      </p>

      <div className="mt-12 flex flex-wrap gap-4">
        <Link
          href="/shop"
          className="t3 text-[var(--plum)] underline-offset-2 hover:underline"
        >
          العودة للتسوق
        </Link>
        <Link
          href="/account"
          className="t3 text-[var(--plum)] underline-offset-2 hover:underline"
        >
          حسابي
        </Link>
      </div>
    </div>
  );
}
