/** Custom VELORA luxury signature — path-drawn, not a script font. */
type Props = {
  className?: string;
};

export function PassportVeloraSignatureMark({ className = "" }: Props) {
  return (
    <svg
      viewBox="0 0 180 50"
      className={`vp-velora-sig ${className}`.trim()}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="vp-sig-ink" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5A4A7A" stopOpacity="0.96" />
          <stop offset="50%" stopColor="#6B5890" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#5A4A7A" stopOpacity="0.82" />
        </linearGradient>
        <linearGradient id="vp-sig-gold" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#C4B08A" stopOpacity="0" />
          <stop offset="40%" stopColor="#C4B08A" stopOpacity="0.48" />
          <stop offset="100%" stopColor="#C4B08A" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Entry flourish */}
      <path
        d="M7 34 C12 22, 16 12, 20 9 C22 7, 24.5 9.5, 23 13"
        fill="none"
        stroke="url(#vp-sig-ink)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* V */}
      <path
        d="M20 11 C25 24, 30 37, 34 43 C37 36, 42 18, 48 10"
        fill="none"
        stroke="url(#vp-sig-ink)"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* e */}
      <path
        d="M46 27 C51 19, 64 18, 67 26 C69 33, 60 37, 52 33 C56 27, 65 26, 71 30"
        fill="none"
        stroke="url(#vp-sig-ink)"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* l */}
      <path
        d="M72 31 C73.5 17, 74.5 7, 76 6 C77.5 10, 78.5 22, 80.5 34"
        fill="none"
        stroke="url(#vp-sig-ink)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* o */}
      <path
        d="M83 28 C85 20, 98 19, 101 28 C103 35, 91 38, 85 32 C88 26, 97 26, 104 30"
        fill="none"
        stroke="url(#vp-sig-ink)"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* r */}
      <path
        d="M105 31 C106.5 21, 107.5 15, 109 14 C114 13.5, 120 18, 122 23"
        fill="none"
        stroke="url(#vp-sig-ink)"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* a + long finishing stroke */}
      <path
        d="M123 25 C129 18, 141 18, 144 27 C146 34, 137 37, 130 33 C135 28, 145 28, 154 31 C162 34, 170 30, 176 24"
        fill="none"
        stroke="url(#vp-sig-ink)"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M32 45 C62 47.5, 105 46.5, 138 43 C148 41.5, 158 39, 168 36"
        fill="none"
        stroke="url(#vp-sig-gold)"
        strokeWidth="0.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
