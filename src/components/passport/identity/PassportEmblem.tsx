type Props = { size?: number; className?: string };

/** VELORA Passport Seal — ornamental fine-line emblem. */
export function PassportEmblem({ size = 52, className = "" }: Props) {
  const gid = "vp-seal";
  return (
    <svg
      className={`vp-emblem ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 80 80"
      aria-hidden
    >
      <defs>
        <linearGradient id={`${gid}-gold`} x1="0" y1="0" x2="80" y2="80">
          <stop offset="0%" stopColor="var(--vp-gold-light)" />
          <stop offset="50%" stopColor="var(--vp-gold)" />
          <stop offset="100%" stopColor="var(--vp-lavender-300)" />
        </linearGradient>
      </defs>

      {/* Outer seal rings */}
      <circle cx="40" cy="40" r="38" fill="none" stroke={`url(#${gid}-gold)`} strokeWidth="1" />
      <circle
        cx="40"
        cy="40"
        r="34.5"
        fill="none"
        stroke="var(--vp-lavender-400)"
        strokeWidth="0.4"
        opacity="0.55"
        strokeDasharray="1.6 1.4"
      />
      <circle
        cx="40"
        cy="40"
        r="31"
        fill="none"
        stroke="var(--vp-lavender-500)"
        strokeWidth="0.55"
        opacity="0.45"
      />

      {/* Fine ornamental ticks */}
      {Array.from({ length: 32 }).map((_, i) => {
        const a = (i * Math.PI * 2) / 32;
        const inner = i % 2 === 0 ? 26.5 : 27.5;
        const outer = i % 2 === 0 ? 30 : 29.2;
        return (
          <line
            key={i}
            x1={40 + Math.cos(a) * inner}
            y1={40 + Math.sin(a) * inner}
            x2={40 + Math.cos(a) * outer}
            y2={40 + Math.sin(a) * outer}
            stroke="var(--vp-lavender-400)"
            strokeWidth="0.35"
            opacity="0.5"
          />
        );
      })}

      {/* Inner disc */}
      <circle cx="40" cy="40" r="18" fill="rgba(255,255,255,0.55)" />
      <circle
        cx="40"
        cy="40"
        r="17"
        fill="none"
        stroke="var(--vp-gold)"
        strokeWidth="0.45"
        opacity="0.55"
      />

      {/* Geometric diamond */}
      <path
        d="M40 26 L48 40 L40 54 L32 40 Z"
        fill="none"
        stroke="var(--vp-lavender-500)"
        strokeWidth="0.55"
        opacity="0.4"
      />

      <text
        x="40"
        y="45"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="18"
        fontWeight="600"
        fill="var(--vp-lavender-700)"
      >
        V
      </text>
    </svg>
  );
}
