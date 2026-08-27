type Props = { className?: string; ar?: boolean };

/** Official VELORA verification stamp — overlaps portrait. */
export function PassportStamp({ className = "", ar = false }: Props) {
  return (
    <div className={`vp-stamp ${className}`.trim()} aria-hidden>
      <svg viewBox="0 0 128 128" className="vp-stamp__svg">
        <circle
          cx="64"
          cy="64"
          r="58"
          fill="rgba(126, 104, 181, 0.06)"
          stroke="currentColor"
          strokeWidth="1.4"
          opacity="0.9"
        />
        <circle
          cx="64"
          cy="64"
          r="50"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.6"
          strokeDasharray="3 2.5"
          opacity="0.55"
        />
        <circle
          cx="64"
          cy="64"
          r="42"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.4"
          opacity="0.35"
        />
        <text
          x="64"
          y="46"
          textAnchor="middle"
          fontSize="9.5"
          fontWeight="700"
          letterSpacing="2.8"
          fill="currentColor"
        >
          VELORA
        </text>
        <text
          x="64"
          y="58"
          textAnchor="middle"
          fontSize="5.2"
          letterSpacing="1.2"
          fill="currentColor"
          opacity="0.92"
        >
          {ar ? "جمال يُكتشف" : "BEAUTY REVEALED"}
        </text>
        <text
          x="64"
          y="68"
          textAnchor="middle"
          fontSize="4.8"
          letterSpacing="1"
          fill="currentColor"
          opacity="0.88"
        >
          {ar ? "جواز الجمال الرقمي" : "DIGITAL BEAUTY PASSPORT"}
        </text>
        <text
          x="64"
          y="80"
          textAnchor="middle"
          fontSize="5"
          letterSpacing="2.2"
          fill="currentColor"
          opacity="0.78"
        >
          VERIFIED MEMBER
        </text>
      </svg>
    </div>
  );
}
