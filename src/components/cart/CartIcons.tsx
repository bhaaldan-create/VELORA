import { cn } from "@/lib/utils";

type IconProps = { className?: string };

/** Soft luxury strokes — round caps/joins, no sharp corners */
const stroke = 1.5;

export function IconShoppingBag({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-12 w-12", className)}
      aria-hidden
    >
      <path d="M7.2 8.2h9.6c.9 0 1.6.8 1.5 1.7l-.9 9.1c-.1 1.1-1 1.9-2.1 1.9H8.7c-1.1 0-2-.8-2.1-1.9l-.9-9.1c-.1-.9.6-1.7 1.5-1.7Z" />
      <path d="M9.2 8.2V7a2.8 2.8 0 0 1 5.6 0v1.2" />
    </svg>
  );
}

export function IconTrash({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4", className)}
      aria-hidden
    >
      <path d="M4.5 7.2h15" />
      <path d="M9.2 7.2V5.8c0-.8.6-1.4 1.4-1.4h2.8c.8 0 1.4.6 1.4 1.4v1.4" />
      <path d="M9.8 11.2v5" />
      <path d="M14.2 11.2v5" />
      <path d="M7 7.2l.7 11.4c.1 1 .9 1.7 1.9 1.7h4.8c1 0 1.8-.7 1.9-1.7L17 7.2" />
    </svg>
  );
}

export function IconMinus({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4", className)}
      aria-hidden
    >
      <path d="M6 12h12" />
    </svg>
  );
}

export function IconPlus({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4", className)}
      aria-hidden
    >
      <path d="M12 6v12" />
      <path d="M6 12h12" />
    </svg>
  );
}

export function IconArrowStart({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4", className)}
      aria-hidden
    >
      <path d="M18.5 12H5.5" />
      <path d="m11.2 6.5-5.7 5.5 5.7 5.5" />
    </svg>
  );
}

export function IconTruck({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4", className)}
      aria-hidden
    >
      <path d="M13.5 17.5V7.2c0-.9-.7-1.6-1.6-1.6H5.1c-.9 0-1.6.7-1.6 1.6v9.3c0 .5.4.9.9.9h1.6" />
      <path d="M14.2 17.5H9.4" />
      <path d="M17.8 17.5h1.8c.5 0 .9-.4.9-.9v-3.2c0-.2-.1-.5-.3-.6l-2.4-2.2c-.2-.2-.4-.3-.7-.3h-3.4" />
      <circle cx="7.2" cy="17.5" r="1.7" />
      <circle cx="16.2" cy="17.5" r="1.7" />
    </svg>
  );
}

/** Soft COD / hand-package mark — payment picker only */
export function IconSoftParcel({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-5 w-5", className)}
      aria-hidden
    >
      <rect x="4.5" y="7" width="15" height="12.5" rx="3.2" />
      <path d="M4.5 11.2h15" />
      <path d="M12 7v12.5" />
      <path d="M9.2 7c0-1.4 1.3-2.5 2.8-2.5s2.8 1.1 2.8 2.5" />
    </svg>
  );
}
