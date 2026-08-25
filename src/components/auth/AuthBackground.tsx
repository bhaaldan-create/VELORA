export function AuthBackground() {
  return (
    <>
      <svg
        className="auth-bg-floral text-[var(--plum)]"
        viewBox="0 0 280 360"
        fill="none"
        aria-hidden
      >
        <path
          d="M220 40c-20 30-55 45-90 38 35 25 45 70 25 105-30-15-65-5-85 20 15-45 5-95-35-125 40-5 75-25 95-58 20 15 55 20 90 20z"
          stroke="currentColor"
          strokeWidth="1.2"
          fill="none"
        />
        <path
          d="M180 120c-8 18-28 28-48 24 20 12 28 38 18 58-22-8-46 2-58 22 10-25 4-52-16-68 18-2 34-12 42-28 8 6 22 8 38 8 6-6 14-10 24-16z"
          stroke="var(--muted)"
          strokeWidth="0.9"
          fill="none"
        />
        <path
          d="M40 280c30-20 70-15 95 10M60 320c25-12 55-8 72 12"
          stroke="currentColor"
          strokeWidth="0.8"
          opacity="0.6"
        />
      </svg>
      <svg
        className="auth-bg-cosmetic text-[var(--plum)]"
        viewBox="0 0 72 72"
        fill="none"
        aria-hidden
      >
        <rect
          x="18"
          y="12"
          width="36"
          height="48"
          rx="6"
          stroke="currentColor"
          strokeWidth="1"
        />
        <rect x="24" y="8" width="24" height="8" rx="2" fill="var(--mist)" />
        <line
          x1="28"
          y1="28"
          x2="44"
          y2="28"
          stroke="var(--muted)"
          strokeWidth="0.8"
        />
        <line
          x1="28"
          y1="36"
          x2="40"
          y2="36"
          stroke="var(--muted)"
          strokeWidth="0.8"
        />
      </svg>
      <svg
        className="auth-satin-curve"
        viewBox="0 0 600 300"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M0 200 Q200 80 400 160 T600 120 L600 300 L0 300 Z"
          fill="var(--champagne)"
        />
      </svg>
    </>
  );
}
