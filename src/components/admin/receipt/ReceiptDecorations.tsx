/** Decorative SVG assets for the VELORA receipt template */

const PLUM = "#3D2640";
const LAVENDER = "#C4B5D4";
const GOLD = "#B8956B";

export function ReceiptFeather({
  className,
  flip,
}: {
  className?: string;
  flip?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 120 200"
      fill="none"
      className={className}
      aria-hidden
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      <path
        d="M60 8 C30 40 18 90 22 140 C24 165 38 185 60 192 C82 185 96 165 98 140 C102 90 90 40 60 8Z"
        fill={LAVENDER}
        opacity="0.45"
      />
      <path
        d="M60 20 C42 48 34 88 38 128 C40 148 50 168 60 172"
        stroke={PLUM}
        strokeWidth="1.2"
        opacity="0.25"
      />
    </svg>
  );
}

export function ReceiptSwanMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 72" fill="none" className={className} aria-hidden>
      <path
        d="M40 8 C28 8 18 18 16 30 C14 42 20 52 32 56 C28 62 22 68 14 70 C26 68 34 62 40 54 C46 62 54 68 66 70 C58 68 52 62 48 56 C60 52 66 42 64 30 C62 18 52 8 40 8Z"
        fill={PLUM}
        opacity="0.92"
      />
      <path
        d="M40 14 C30 14 22 22 21 30 C20 38 24 46 32 49 C28 54 24 58 18 59 C26 58 32 54 36 50 C40 54 46 58 52 59 C46 58 42 54 40 49 C48 46 52 38 51 30 C50 22 48 14 40 14Z"
        fill={PLUM}
        opacity="0.35"
      />
      <ellipse cx="34" cy="28" rx="2" ry="2.5" fill={PLUM} opacity="0.5" />
    </svg>
  );
}

export function ReceiptSwanLarge({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 120" fill="none" className={className} aria-hidden>
      <path
        d="M70 10 C48 10 32 26 28 46 C24 66 34 82 52 88 C46 96 38 106 26 112 C42 108 52 100 60 90 C68 100 78 108 94 112 C82 106 74 96 68 88 C86 82 96 66 92 46 C88 26 72 10 70 10Z"
        fill={LAVENDER}
        opacity="0.55"
      />
      <path
        d="M70 18 C54 18 40 30 37 46 C34 60 42 74 54 78 C48 86 42 94 32 98 C44 95 52 88 58 80 C64 88 72 95 84 98 C74 94 68 86 62 78 C74 74 82 60 79 46 C76 30 72 18 70 18Z"
        stroke={PLUM}
        strokeWidth="1.5"
        opacity="0.35"
      />
    </svg>
  );
}

export function ReceiptGoldStar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill={GOLD} className={className} aria-hidden>
      <path d="M8 0l1.8 5.2L16 8l-6.2 1.8L8 16l-1.8-6.2L0 8l6.2-1.8L8 0z" />
    </svg>
  );
}

export function ReceiptFlourish({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 32" fill="none" className={className} aria-hidden>
      <path
        d="M12 2 C8 10 4 16 4 22 C4 26 7 29 12 30 C17 29 20 26 20 22 C20 16 16 10 12 2Z"
        stroke={PLUM}
        strokeWidth="1.2"
        opacity="0.4"
      />
      <circle cx="12" cy="18" r="2" fill={PLUM} opacity="0.25" />
    </svg>
  );
}

export function ReceiptIconInstagram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ReceiptIconWhatsApp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 14.9L2 22l5.2-1.4A10 10 0 1 0 12 2Zm5.3 14.3c-.2.6-1 1-1.6 1.1-.4.1-.9.1-1.4-.1-.3-.1-.7-.3-1.3-.5-2.3-1-3.8-3.3-3.9-3.5-.1-.2-.9-1.2-.9-2.3s.6-1.7.8-1.9c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .5.4.2.4.6 1.5.7 1.6.1.1.1.3 0 .4-.1.2-.2.3-.3.5-.1.1-.2.2-.1.4.1.2.4.7 1 1.1.7.6 1.3.8 1.5.9.2.1.3 0 .4-.1l.6-.7c.2-.2.3-.2.6-.1.3.1 1.2.6 1.4.7.2.1.4.2.4.3 0 .2 0 .6-.2 1Z" />
    </svg>
  );
}

export function ReceiptIconGlobe({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.8 4 6.2 4 9s-1.5 6.2-4 9c-2.5-2.8-4-6.2-4-9s1.5-6.2 4-9Z" />
    </svg>
  );
}
