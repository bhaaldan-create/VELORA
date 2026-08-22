import { cn } from "@/lib/utils";

/** رمز LARSA — حرف L + orbit رفيع */
export function LarsaMark({
  className,
  size = 40,
  spinning = false,
}: {
  className?: string;
  size?: number;
  spinning?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
      className={cn("text-[var(--larsa-plum)]", className)}
    >
      <g
        className={cn(
          spinning &&
            "origin-[32px_32px] motion-safe:animate-[larsa-orbit_4.5s_linear_infinite]",
        )}
        style={spinning ? { transformBox: "fill-box", transformOrigin: "center" } : undefined}
      >
        <ellipse
          cx="32"
          cy="32"
          rx="26"
          ry="14"
          stroke="var(--larsa-orbit, #B9A3BC)"
          strokeWidth="1.1"
          transform="rotate(-28 32 32)"
          opacity="0.9"
        />
      </g>
      <path
        d="M22 16.5V47.5H42"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LarsaPathIcon({
  name,
  className,
}: {
  name: "skin" | "hair" | "makeup" | "body" | "ritual" | "mark";
  className?: string;
}) {
  const common = cn("text-current", className);

  if (name === "mark") {
    return <LarsaMark size={28} className={common} />;
  }

  if (name === "skin") {
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden className={common}>
        <path
          d="M14 5c0 6.5-3.2 10.5-3.2 14.2a3.2 3.2 0 0 0 6.4 0C17.2 15.5 14 11.5 14 5Z"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "hair") {
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden className={common}>
        <path
          d="M8 7.5c2.2 0 3.8 1.6 4.5 4.2.4 1.6.4 3.4.2 5.3-.3 2.2-1 4.2-1.7 5.5"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
        <path
          d="M12.5 8.2c1.8-.4 3.6.4 4.6 2.4 1.2 2.4 1.1 5.6.3 8.2-.5 1.6-1.3 3-2.1 3.9"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
        <path d="M7 21.5h10" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "makeup") {
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden className={common}>
        <path
          d="M9.5 22.5 18.2 6.8a1.2 1.2 0 0 1 2.1 1.15L11.6 22.5"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M8.2 22.5h8.8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "body") {
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden className={common}>
        <path
          d="M12.2 6.5h3.6c.7 0 1.3.5 1.4 1.2l.8 5.3h-8l.8-5.3c.1-.7.7-1.2 1.4-1.2Z"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinejoin="round"
        />
        <path
          d="M10 13h8v8.2a2.3 2.3 0 0 1-2.3 2.3h-3.4A2.3 2.3 0 0 1 10 21.2V13Z"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden className={common}>
      <circle cx="14" cy="14" r="8.5" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="14" cy="14" r="3.2" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}
