/** Multi-layer guilloché + security pattern defs for passport paper. */
export function PassportGuillochePattern({ id = "vp-guilloche" }: { id?: string }) {
  return (
    <svg className="vp-guilloche-svg" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id={id} width="160" height="160" patternUnits="userSpaceOnUse">
          <path
            d="M0 80 Q40 20 80 80 T160 80"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.35"
          />
          <path
            d="M0 40 Q40 100 80 40 T160 40"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.28"
          />
          <path
            d="M0 120 Q40 60 80 120 T160 120"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.28"
          />
          <circle cx="80" cy="80" r="36" fill="none" stroke="currentColor" strokeWidth="0.22" />
          <circle cx="80" cy="80" r="22" fill="none" stroke="currentColor" strokeWidth="0.18" />
          <circle cx="80" cy="80" r="8" fill="none" stroke="currentColor" strokeWidth="0.15" />
        </pattern>
        <pattern id={`${id}-fine`} width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M0 24 L48 24" fill="none" stroke="currentColor" strokeWidth="0.2" />
          <path d="M24 0 L24 48" fill="none" stroke="currentColor" strokeWidth="0.2" />
          <circle cx="24" cy="24" r="10" fill="none" stroke="currentColor" strokeWidth="0.18" />
        </pattern>
        <pattern id={`${id}-micro`} width="200" height="12" patternUnits="userSpaceOnUse">
          <text
            x="0"
            y="8"
            fontFamily="ui-monospace, monospace"
            fontSize="5"
            letterSpacing="2"
            fill="currentColor"
          >
            VELORA · DIGITAL BEAUTY PASSPORT · VERIFIED ·
          </text>
        </pattern>
        <pattern id={`${id}-corner`} width="100" height="100" patternUnits="userSpaceOnUse">
          <path
            d="M0 50 C25 0 75 0 100 50 S75 100 50 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.4"
          />
          <path
            d="M10 50 C30 15 70 15 90 50"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.25"
          />
        </pattern>
        <radialGradient id={`${id}-foil`} cx="30%" cy="20%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}
