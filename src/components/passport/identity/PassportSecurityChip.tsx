export function PassportSecurityChip({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`vp-chip ${className}`.trim()}
      viewBox="0 0 48 36"
      aria-hidden
    >
      <rect x="1" y="1" width="46" height="34" rx="4" fill="url(#vp-chip-gold)" stroke="#B8A070" strokeWidth="0.6" />
      <rect x="8" y="8" width="32" height="20" rx="2" fill="#C9B896" opacity="0.4" />
      <path d="M8 14 H40 M8 20 H40 M8 26 H32" stroke="#A89060" strokeWidth="0.5" opacity="0.6" />
      <defs>
        <linearGradient id="vp-chip-gold" x1="0" y1="0" x2="48" y2="36">
          <stop offset="0%" stopColor="#E8DCC4" />
          <stop offset="50%" stopColor="#C9B896" />
          <stop offset="100%" stopColor="#A89060" />
        </linearGradient>
      </defs>
    </svg>
  );
}
