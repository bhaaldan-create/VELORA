type Props = { className?: string; ar?: boolean };

export function PassportStamp({ className = "", ar = false }: Props) {
  return (
    <div className={`vp-stamp ${className}`.trim()} aria-hidden>
      <svg viewBox="0 0 120 120" className="vp-stamp__svg">
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="4 3"
          opacity="0.85"
        />
        <circle cx="60" cy="60" r="44" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
        <text
          x="60"
          y="48"
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          letterSpacing="3"
          fill="currentColor"
        >
          VELORA
        </text>
        <text
          x="60"
          y="62"
          textAnchor="middle"
          fontSize="6"
          letterSpacing="1.5"
          fill="currentColor"
          opacity="0.9"
        >
          {ar ? "جواز الجمال الرقمي" : "DIGITAL BEAUTY"}
        </text>
        <text
          x="60"
          y="72"
          textAnchor="middle"
          fontSize="6"
          letterSpacing="1.5"
          fill="currentColor"
          opacity="0.9"
        >
          {ar ? "عضوة موثّقة" : "PASSPORT"}
        </text>
        <text
          x="60"
          y="84"
          textAnchor="middle"
          fontSize="5.5"
          letterSpacing="2"
          fill="currentColor"
          opacity="0.75"
        >
          {ar ? "VERIFIED MEMBER" : "VERIFIED MEMBER"}
        </text>
      </svg>
    </div>
  );
}
