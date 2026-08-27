const VERIFY_POINTS = [
  { ar: "هوية موثقة", en: "Verified Identity" },
  { ar: "معلومات آمنة", en: "Secure Information" },
  { ar: "عضوة نشطة", en: "Active Member" },
  { ar: "جواز رقمي", en: "Digital Passport" },
] as const;

type Props = {
  ar?: boolean;
  publicUrl: string;
  showQr?: boolean;
};

export function PassportVerificationPanel({
  ar = false,
  publicUrl,
  showQr = true,
}: Props) {
  if (!showQr) return null;

  const qrSrc = `/api/my-velora/qr?data=${encodeURIComponent(publicUrl)}`;

  return (
    <section className="vp-verify" aria-label={ar ? "تحقق الجواز" : "Passport verification"}>
      <header className="vp-verify__head">
        <h2 className="vp-verify__title">VELORA Verification</h2>
        <p className="vp-verify__title-ar">تحقق من VELORA</p>
      </header>

      <div className="vp-verify__body">
        <div className="vp-verify__qr-col">
          <div className="vp-verify__qr-frame">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrSrc} alt="" className="vp-verify__qr" />
          </div>
          <p className="vp-verify__scan-en">Scan to verify</p>
          <p className="vp-verify__scan-ar">امسحي للتحقق</p>
        </div>

        <div className="vp-verify__info">
          <p className="vp-verify__desc">
            {ar
              ? "جواز رقمي صادر رسميًا من VELORA لعضوة موثّقة، مع بيانات آمنة للتحقق."
              : "An official VELORA digital passport for a verified member — secure data for authentication."}
          </p>
          <ul className="vp-verify__points">
            {VERIFY_POINTS.map((point) => (
              <li key={point.en} className="vp-verify__point">
                <span className="vp-verify__point-icon" aria-hidden>
                  ◉
                </span>
                <span className="vp-verify__point-text">
                  <span className="vp-verify__point-ar">
                    {ar ? point.ar : point.en}
                  </span>
                  <span className="vp-verify__point-en">
                    {ar ? point.en : point.ar}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
