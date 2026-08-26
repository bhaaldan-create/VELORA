/** Reusable VELORA guilloché SVG pattern — lightweight, CSS-only opacity. */
export function PassportGuillochePattern({ id = "vp-guilloche" }: { id?: string }) {
  return (
    <svg
      className="vp-guilloche-svg"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id={id}
          width="120"
          height="120"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M0 60 Q30 20 60 60 T120 60"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.45"
          />
          <path
            d="M0 30 Q30 70 60 30 T120 30"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.35"
          />
          <circle cx="60" cy="60" r="28" fill="none" stroke="currentColor" strokeWidth="0.3" />
          <circle cx="60" cy="60" r="14" fill="none" stroke="currentColor" strokeWidth="0.25" />
        </pattern>
        <pattern
          id={`${id}-corner`}
          width="80"
          height="80"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M0 40 C20 0 60 0 80 40 S60 80 40 80"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
    </svg>
  );
}
