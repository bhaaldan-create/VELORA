import type { ClubTierId } from "@/lib/club/types";

type IconProps = { className?: string; size?: number };

const stroke = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.15,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconSpark({ className, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <path d="M12 3.5l1.1 5.2L18 10l-4.9 1.3L12 16.5l-1.1-5.2L6 10l4.9-1.3L12 3.5z" />
      <path d="M18.5 15.5l.5 2.2 2.2.5-2.2.5-.5 2.2-.5-2.2-2.2-.5 2.2-.5.5-2.2z" />
    </svg>
  );
}

export function IconDiamond({ className, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <path d="M12 3.5L20 9.5 12 20.5 4 9.5 12 3.5z" />
      <path d="M4 9.5h16M8.2 9.5L12 20.5l3.8-11" />
    </svg>
  );
}

export function IconGift({ className, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <rect x="4.5" y="10" width="15" height="10" rx="1.5" />
      <path d="M12 10v10M4.5 13.5h15" />
      <path d="M12 10c-1.8-3-4.5-3.2-5.2-1.6C5.8 10 7.5 11.2 12 10z" />
      <path d="M12 10c1.8-3 4.5-3.2 5.2-1.6.8 1.6-.9 2.8-5.2 1.6z" />
    </svg>
  );
}

export function IconKey({ className, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <circle cx="8.5" cy="10" r="3.5" />
      <path d="M11.5 10H20v2.2h-2.2V15H15.5v-2.8H14" />
    </svg>
  );
}

export function IconPassport({ className, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <rect x="5" y="3.5" width="14" height="17" rx="2" />
      <circle cx="12" cy="10" r="2.4" />
      <path d="M8.5 16.5h7" />
    </svg>
  );
}

export function IconDelivery({ className, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <path d="M3.5 16.5V8.5h10v8" />
      <path d="M13.5 10.5h4.2L20 13.8v2.7h-1.2" />
      <circle cx="7.2" cy="16.8" r="1.8" />
      <circle cx="16.8" cy="16.8" r="1.8" />
    </svg>
  );
}

export function IconStar({ className, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <path d="M12 4l1.9 4.8L19 10l-3.7 3.1L16.5 19 12 16.2 7.5 19l1.2-5.9L5 10l5.1-1.2L12 4z" />
    </svg>
  );
}

export function IconLink({ className, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <path d="M9.5 14.5l5-5" />
      <path d="M11 17.5l-1.2 1.2a3.5 3.5 0 01-5-5L6 12.5" />
      <path d="M13 6.5l1.2-1.2a3.5 3.5 0 015 5L18 11.5" />
    </svg>
  );
}

export function IconChat({ className, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <path d="M5 18.5l1.8-2.2A7.5 7.5 0 1118.5 12v1.2A7.5 7.5 0 017.8 18L5 18.5z" />
    </svg>
  );
}

export function IconClock({ className, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <circle cx="12" cy="12" r="7.5" />
      <path d="M12 8.5V12l2.8 1.8" />
    </svg>
  );
}

export function IconBag({ className, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <path d="M6 8.5h12l-1 10.5H7L6 8.5z" />
      <path d="M9 8.5V7a3 3 0 016 0v1.5" />
    </svg>
  );
}

export function IconMuse({ className, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <path d="M12 5l1.2 4.2L17.5 10.5 13.2 12 12 16.5 10.8 12 6.5 10.5l4.3-1.3L12 5z" />
    </svg>
  );
}

export function IconGlow({ className, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <circle cx="12" cy="12" r="5.5" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

export function IconSignature({ className, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <path d="M12 4.5l2.1 5.1 5.4.4-4.2 3.6 1.3 5.3L12 16.2 7.4 18.9l1.3-5.3L4.5 10l5.4-.4L12 4.5z" />
    </svg>
  );
}

export function IconPrive({ className, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <path d="M12 4.5L19 12l-7 7.5L5 12l7-7.5z" />
    </svg>
  );
}

export function IconCheck({ className, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <path d="M5.5 12.5l4 4 9-10" />
    </svg>
  );
}

export function IconCrown({ className, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <path d="M4.5 16.5h15l-1.2-7.5L14 12l-2-6.5L10 12 5.7 9l-1.2 7.5z" />
      <path d="M6 18.5h12" />
    </svg>
  );
}

export function IconHistory({ className, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden {...stroke}>
      <path d="M5.5 12a6.5 6.5 0 111.2 3.8" />
      <path d="M5.5 8.5V12H9" />
      <path d="M12 8.5V12l2.5 1.5" />
    </svg>
  );
}

export function TierIcon({
  id,
  className,
  size = 18,
}: {
  id: ClubTierId | string;
  className?: string;
  size?: number;
}) {
  switch (id) {
    case "glow":
      return <IconGlow className={className} size={size} />;
    case "signature":
      return <IconSignature className={className} size={size} />;
    case "prive":
      return <IconPrive className={className} size={size} />;
    case "muse":
    default:
      return <IconMuse className={className} size={size} />;
  }
}

export function ClubIcon({
  name,
  className,
  size = 18,
}: {
  name: string;
  className?: string;
  size?: number;
}) {
  switch (name) {
    case "diamond":
      return <IconDiamond className={className} size={size} />;
    case "gift":
      return <IconGift className={className} size={size} />;
    case "key":
      return <IconKey className={className} size={size} />;
    case "passport":
      return <IconPassport className={className} size={size} />;
    case "delivery":
      return <IconDelivery className={className} size={size} />;
    case "star":
      return <IconStar className={className} size={size} />;
    case "link":
      return <IconLink className={className} size={size} />;
    case "chat":
      return <IconChat className={className} size={size} />;
    case "clock":
      return <IconClock className={className} size={size} />;
    case "bag":
      return <IconBag className={className} size={size} />;
    case "crown":
      return <IconCrown className={className} size={size} />;
    case "history":
      return <IconHistory className={className} size={size} />;
    case "spark":
    default:
      return <IconSpark className={className} size={size} />;
  }
}
