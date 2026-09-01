import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { brand, ui } from "@/constants/brand";
import { getInstagramUrl } from "@/lib/social-links";

const SITE_URL = "https://velorabeautyiq.me";
const EFFECTIVE_DATE = "1 سبتمبر 2026";

export const metadata: Metadata = {
  title: "الشروط والأحكام",
  description:
    "شروط وأحكام استخدام موقع وتطبيق VELORA Beauty — الطلبات، الدفع، والخدمات.",
  alternates: { canonical: `${SITE_URL}/terms` },
  openGraph: {
    title: `الشروط والأحكام · ${brand.name}`,
    url: `${SITE_URL}/terms`,
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

export default function TermsPage() {
  const instagram = getInstagramUrl();

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
      <p className="t1 font-medium tracking-[0.18em] text-[var(--muted)]">
        {ui.clientCare}
      </p>
      <h1 className="font-brand t7 mt-3 tracking-[0.12em] text-[var(--plum)]">
        الشروط والأحكام
      </h1>
      <p className="t2 mt-2 text-[var(--muted)]">
        {brand.name} Beauty — آخر تحديث: {EFFECTIVE_DATE}
      </p>

      <p className="t4 mt-8 text-[var(--ink)]/80">
        مرحباً بكِ في <strong>{brand.name} Beauty</strong>. باستخدام موقعنا{" "}
        <a
          href={SITE_URL}
          className="text-[var(--plum)] underline-offset-2 hover:underline"
          dir="ltr"
        >
          velorabeautyiq.me
        </a>
        أو تطبيق <strong>VELORA Beauty</strong> للجوال، فإنكِ توافقين على هذه
        الشروط. إن لم توافقي، يرجى عدم استخدام الخدمة.
      </p>

      <Section title="1. المشغّل والخدمة">
        <p>
          تُشغَّل الخدمة بواسطة <strong>Mohammed AM Bahalddin A.S.</strong> («فيلورا»،
          «نحن»). نقدّم متجراً إلكترونياً لمنتجات العناية بالبشرة والجسم والشعر
          والمكياج، مع خدمات الحساب، الولاء، My VELORA، والمستشارة لارسا.
        </p>
      </Section>

      <Section title="2. الأهلية والحساب">
        <ul className="list-disc space-y-2 ps-5">
          <li>
            يجب أن تكوني بكامل الأهلية القانونية (18 عاماً أو بموافقة ولي الأمر).
          </li>
          <li>
            أنتِ مسؤولة عن صحة بيانات الحساب وسرية تسجيل الدخول.
          </li>
          <li>
            يمكن التسجيل بالبريد وكلمة المرور، أو عبر Google أو Apple وفق
            سياساتهم.
          </li>
          <li>
            نحتفظ بحق تعليق أو إغلاق الحساب عند إساءة الاستخدام أو انتهاك هذه
            الشروط.
          </li>
        </ul>
      </Section>

      <Section title="3. المنتجات والأسعار">
        <ul className="list-disc space-y-2 ps-5">
          <li>
            الأسعار بالدينار العراقي ({brand.currencyLabel}) ما لم يُذكر غير ذلك.
          </li>
          <li>
            نسعى لعرض صور ووصف دقيق؛ قد تختلف الألوان قليلاً حسب الشاشة أو الإضاءة.
          </li>
          <li>
            قد نعدّل الأسعار والعروض دون إشعار مسبق؛ يُطبَّق السعر المعروض عند
            تأكيد الطلب.
          </li>
          <li>
            توفر المنتجات يخضع للمخزون؛ قد نرفض أو نؤجل طلباً عند نفاد الصنف.
          </li>
        </ul>
      </Section>

      <Section title="4. الطلبات والدفع">
        <ul className="list-disc space-y-2 ps-5">
          <li>
            عند تأكيد الطلب، تقدّمين عرض شراء؛ القبول يتم عند تأكيدنا أو شحن
            الطلب.
          </li>
          <li>
            الدفع عبر الوسائل المتاحة في الموقع (بطاقة، رابط دفع، أو طرق محلية
            عند تفعيلها).
          </li>
          <li>
            أنتِ مسؤولة عن تقديم عنوان توصيل صحيح ورقم هاتف للتواصل.
          </li>
          <li>
            قد نتواصل معكِ عبر البريد، التطبيق، WhatsApp، أو الهاتف بخصوص الطلب.
          </li>
        </ul>
      </Section>

      <Section title="5. التوصيل">
        <p>
          أوقات التوصيل تقديرية وليست مضمونة. التأخير بسبب ظروف خارجة عن إرادتنا
          (طقس، أمن، شركة التوصيل) لا يترتب عليه مسؤولية تعويضية إلا وفق ما
          ينصّ عليه القانون.
        </p>
        <p>
          الشحن المجاني — إن وُجد — يخضع للحد الأدنى للطلب المعروض في الموقع.
        </p>
      </Section>

      <Section title="6. الإرجاع والاستبدال">
        <p>
          نظراً لطبيعة منتجات التجميل والعناية، قد تُقبل الإرجاعات فقط للمنتجات
          غير المفتوحة وفي حالتها الأصلية، وفق سياسة الإرجاع المعروضة وقت الطلب
          أو عند التواصل مع رعاية العميلة.
        </p>
        <p>
          للاستفسار عن إرجاع أو استبدال، تواصلي معنا عبر الموقع أو قنوات الدعم
          المعتمدة قبل إعادة أي منتج.
        </p>
      </Section>

      <Section title="7. برنامج الولاء والإحالة">
        <p>
          نقاط VELORA Club والإحالات تخضع لقواعد البرنامج المعروضة في التطبيق.
          يحق لنا تعديل قواعد الكسب أو الاستبدال مع إشعار معقول. النقاط ليس لها
          قيمة نقدية ولا تُباع أو تُحوَّل خارج النظام.
        </p>
      </Section>

      <Section title="8. لارسا — المستشارة الذكية">
        <p>
          توصيات لارسا للإعلام والتوجيه التجميلي العام فقط — <strong>ليست</strong>{ " "}
          استشارة طبية أو تشخيصاً لحالة جلدية. في الحالات الصحية أو الحساسية
          الشديدة، استشيري طبيباً أو صيدلانياً مختصاً قبل استخدام منتج جديد.
        </p>
        <p>
          لا نضمن أن كل توصية مناسبة لكل شخص؛ تقييمكِ الشخصي للمنتج يبقى على
          مسؤوليتكِ.
        </p>
      </Section>

      <Section title="9. الاستخدام المقبول">
        <p>يُحظر:</p>
        <ul className="list-disc space-y-2 ps-5">
          <li>انتهاك القانون أو حقوق الغير.</li>
          <li>محاولات اختراق أو إعاقة الخدمة.</li>
          <li>إنشاء حسابات وهمية أو إساءة استخدام الإحالات أو النقاط.</li>
          <li>نسخ أو إعادة بيع المحتوى أو الصور دون إذن.</li>
        </ul>
      </Section>

      <Section title="10. المحتوى والملكية الفكرية">
        <p>
          الشعار، التصميم، النصوص، والصور على الموقع والتطبيق مملوكة لفيلورا أو
          شركائها ومحمية بقوانين الملكية الفكرية. الاستخدام الشخصي فقط كما يسمح
          الخدمة.
        </p>
      </Section>

      <Section title="11. إخلاء المسؤولية">
        <p>
          الخدمة تُقدَّم «كما هي» قدر الإمكان. لا نضمن توفراً مستمراً دون انقطاع.
          إلى الحد المسموح قانونياً، لا نتحمل مسؤولية عن أضرار غير مباشرة ناتجة
          عن استخدام الخدمة أو المنتجات، باستثناء ما يفرضه القانون المحلي على
          مبيعات المستهلك.
        </p>
      </Section>

      <Section title="12. القانون الحاكم">
        <p>
          تخضع هذه الشروط للقوانين المعمول بها في <strong>جمهورية العراق</strong>.
          أي نزاع يُفضّل حله ودياً أولاً؛ إن تعذّر، تُحال للمحاكم المختصة في
          العراق.
        </p>
      </Section>

      <Section title="13. التغييرات">
        <p>
          قد نحدّث هذه الشروط. النسخة الحالية متاحة دائماً على هذه الصفحة مع
          تاريخ التحديث. الاستمرار في الاستخدام بعد التحديث يعني قبول الشروط
          المعدّلة.
        </p>
      </Section>

      <Section title="14. التواصل">
        <p>
          للأسئلة حول هذه الشروط: تواصلي عبر{" "}
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
          . راجعي أيضاً{" "}
          <Link
            href="/privacy"
            className="text-[var(--plum)] underline-offset-2 hover:underline"
          >
            سياسة الخصوصية
          </Link>
          .
        </p>
      </Section>

      <hr className="my-12 border-[var(--border)]" />

      <h2 className="font-brand t5 tracking-[0.1em] text-[var(--plum)]">
        Terms & Conditions (English Summary)
      </h2>
      <p className="t3 mt-4 text-[var(--ink)]/75 leading-relaxed" lang="en">
        By using velorabeautyiq.me or the VELORA Beauty app (beauty.velora.app),
        you agree to these terms operated by Mohammed AM Bahalddin A.S. Prices are
        in IQD. Orders are subject to stock and our confirmation. Payments are
        processed via approved providers. LARSA advisor tips are informational, not
        medical advice. Loyalty points follow program rules. Iraqi law applies.
        Effective: {EFFECTIVE_DATE}. See our{" "}
        <Link href="/privacy" className="underline underline-offset-2">
          Privacy Policy
        </Link>
        .
      </p>

      <div className="mt-12 flex flex-wrap gap-4">
        <Link
          href="/shop"
          className="t3 text-[var(--plum)] underline-offset-2 hover:underline"
        >
          العودة للتسوق
        </Link>
        <Link
          href="/privacy"
          className="t3 text-[var(--plum)] underline-offset-2 hover:underline"
        >
          سياسة الخصوصية
        </Link>
      </div>
    </div>
  );
}
