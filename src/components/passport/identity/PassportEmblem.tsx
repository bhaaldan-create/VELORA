type Props = { size?: number; className?: string };

export function PassportEmblem({ size = 48, className = "" }: Props) {
  return (
    <svg
      className={`vp-emblem ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden
    >
      <circle cx="32" cy="32" r="30" fill="none" stroke="url(#vp-emblem-gold)" strokeWidth="1.2" />
      <circle cx="32" cy="32" r="24" fill="none" stroke="var(--vp-lavender-500)" strokeWidth="0.6" opacity="0.7" />
      <path
        d="M32 14 L38 28 L52 28 L41 37 L45 51 L32 42 L19 51 L23 37 L12 28 L26 28 Z"
        fill="none"
        stroke="var(--vp-lavender-500)"
        strokeWidth="0.8"
        opacity="0.5"
      />
      <text
        x="32"
        y="38"
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontSize="22"
        fontWeight="600"
        fill="var(--vp-lavender-700)"
      >
        V
      </text>
      <defs>
        <linearGradient id="vp-emblem-gold" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0%" stopColor="var(--vp-gold)" />
          <stop offset="100%" stopColor="var(--vp-lavender-300)" />
        </linearGradient>
      </defs>
    </svg>
  );
}
