import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  animate?: boolean;
};

/** Elegant minimal rose — luxury signature visual */
export function VeloraRose({ className, animate = true }: Props) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center",
        animate && "motion-safe:animate-[velora-rose-float_4s_ease-in-out_infinite]",
        className,
      )}
      aria-hidden
    >
      <svg
        viewBox="0 0 120 140"
        fill="none"
        className={cn(
          "h-[7.5rem] w-[6.5rem] sm:h-[8.5rem] sm:w-[7.5rem]",
          animate &&
            "motion-safe:animate-[velora-rise_0.9s_ease-out_both]",
        )}
        role="img"
        aria-label=""
      >
        <defs>
          <linearGradient id="velora-rose-petal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A61D4A" />
            <stop offset="45%" stopColor="#8B1538" />
            <stop offset="100%" stopColor="#6B0F2B" />
          </linearGradient>
          <linearGradient id="velora-rose-petal-deep" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6B0F2B" />
            <stop offset="100%" stopColor="#4A0A1E" />
          </linearGradient>
        </defs>

        {/* Stem */}
        <path
          d="M60 78 C58 95 56 108 54 118"
          stroke="#3D5A3A"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.55"
        />
        <path
          d="M54 100 C48 98 42 94 38 88"
          stroke="#4A6B45"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.45"
        />

        {/* Outer petals */}
        <path
          d="M60 28 C48 32 38 44 36 58 C34 72 42 82 60 86 C78 82 86 72 84 58 C82 44 72 32 60 28Z"
          fill="url(#velora-rose-petal)"
          opacity="0.92"
        />
        <path
          d="M60 32 C50 36 42 46 40 58 C38 68 44 76 60 80 C76 76 82 68 80 58 C78 46 70 36 60 32Z"
          fill="url(#velora-rose-petal-deep)"
          opacity="0.88"
        />
        <path
          d="M60 38 C52 42 46 50 45 58 C44 66 50 72 60 74 C70 72 76 66 75 58 C74 50 68 42 60 38Z"
          fill="url(#velora-rose-petal)"
        />
        <path
          d="M60 44 C54 47 50 52 49 58 C48 64 52 68 60 69 C68 68 72 64 71 58 C70 52 66 47 60 44Z"
          fill="#7A1230"
          opacity="0.9"
        />

        {/* Inner curl */}
        <path
          d="M60 50 C57 52 55 55 55 58 C55 61 57 63 60 63 C63 63 65 61 65 58 C65 55 63 52 60 50Z"
          fill="#4A0A1E"
          opacity="0.75"
        />

        {/* Soft light */}
        <ellipse
          cx="52"
          cy="52"
          rx="8"
          ry="6"
          fill="white"
          opacity="0.12"
        />
      </svg>
    </div>
  );
}
