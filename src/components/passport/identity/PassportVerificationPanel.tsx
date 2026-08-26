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
    <section className="vp-verify">
      <div className="vp-verify__qr-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrSrc} alt="" className="vp-verify__qr" />
        <p className="vp-verify__scan">
          {ar ? "امسحي للتحقق" : "Scan to verify"}
        </p>
      </div>
      <div className="vp-verify__copy">
        <h3>{ar ? "تحقق VELORA" : "VELORA Verification"}</h3>
        <p>
          {ar
            ? "هذا جواز VELORA الرقمي الرسمي صادر لعضوة موثّقة. لا يحتوي على بيانات خاصة."
            : "This is an official VELORA digital beauty passport issued to a verified member. No private data is displayed."}
        </p>
        <ul className="vp-verify__badges">
          <li>{ar ? "معلومات آمنة" : "Secure information"}</li>
          <li>{ar ? "هوية موثّقة" : "Verified identity"}</li>
          <li>{ar ? "عضوة نشطة" : "Active member"}</li>
          <li>{ar ? "جواز شخصي" : "Personal passport"}</li>
        </ul>
      </div>
    </section>
  );
}
