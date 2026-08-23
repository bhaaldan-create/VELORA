"use client";

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import {
  useNotifications,
  type CustomerNotificationItem,
} from "@/context/NotificationContext";
import { cn } from "@/lib/utils";

function formatWhen(iso: string, ar: boolean) {
  try {
    return new Date(iso).toLocaleString(ar ? "ar-IQ" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function NotificationList({
  items,
  onOpenItem,
  compact,
}: {
  items: CustomerNotificationItem[];
  onOpenItem?: (item: CustomerNotificationItem) => void;
  compact?: boolean;
}) {
  const { locale } = useLocale();
  const ar = locale !== "en";

  if (!items.length) {
    return (
      <p className="px-1 py-8 text-center text-[0.85rem] text-[var(--muted)]">
        {ar ? "لا توجد إشعارات بعد." : "No notifications yet."}
      </p>
    );
  }

  return (
    <ul className={cn("space-y-2", compact && "space-y-1.5")}>
      {items.map((item) => {
        const title = ar ? item.titleAr : item.titleEn || item.titleAr;
        const body = ar ? item.bodyAr : item.bodyEn || item.bodyAr;
        const content = (
          <div
            className={cn(
              "rounded-2xl border px-3.5 py-3 transition-colors",
              item.read
                ? "border-[var(--plum)]/8 bg-white/60"
                : "border-[var(--plum)]/15 bg-[var(--mist)]/80",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <h3
                className={cn(
                  "text-[0.9rem] leading-snug text-[var(--plum)]",
                  !item.read && "font-semibold",
                )}
              >
                {title}
              </h3>
              {!item.read ? (
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-[var(--plum)]" />
              ) : null}
            </div>
            <p className="mt-1.5 text-[0.8rem] leading-relaxed text-[var(--ink)]/75">
              {body}
            </p>
            <p className="mt-2 text-[0.68rem] text-[var(--muted)]">
              {formatWhen(item.createdAt, ar)}
            </p>
          </div>
        );

        if (item.href) {
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                onClick={() => onOpenItem?.(item)}
                className="block"
              >
                {content}
              </Link>
            </li>
          );
        }

        return (
          <li key={item.id}>
            <button
              type="button"
              className="w-full text-start"
              onClick={() => onOpenItem?.(item)}
            >
              {content}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function NotificationPanel() {
  const { locale } = useLocale();
  const ar = locale !== "en";
  const {
    notifications,
    unreadCount,
    panelOpen,
    closePanel,
    markRead,
    markAllRead,
  } = useNotifications();

  if (!panelOpen) return null;

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(26,14,32,0.35)] backdrop-blur-[2px]"
        aria-label={ar ? "إغلاق" : "Close"}
        onClick={closePanel}
      />
      <aside
        className={cn(
          "absolute inset-y-0 end-0 flex w-full max-w-[22rem] flex-col bg-[var(--ivory)] shadow-[-12px_0_40px_rgba(50,22,47,0.12)] sm:max-w-[24rem]",
        )}
        dir={ar ? "rtl" : "ltr"}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--plum)]/10 px-4 py-4">
          <div>
            <h2 className="font-display text-[1.05rem] font-semibold text-[var(--plum)]">
              {ar ? "الإشعارات" : "Notifications"}
            </h2>
            {unreadCount > 0 ? (
              <p className="mt-0.5 text-[0.72rem] text-[var(--muted)]">
                {ar
                  ? `${unreadCount} غير مقروء`
                  : `${unreadCount} unread`}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="rounded-full px-2.5 py-1 text-[0.72rem] font-medium text-[var(--plum)] hover:bg-[var(--mist)]"
              >
                {ar ? "قراءة الكل" : "Mark all"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={closePanel}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--ink)]/60 hover:bg-[var(--mist)]"
              aria-label={ar ? "إغلاق" : "Close"}
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          <NotificationList
            items={notifications}
            compact
            onOpenItem={(item) => {
              if (!item.read) void markRead([item.id]);
            }}
          />
        </div>

        <div className="border-t border-[var(--plum)]/10 p-3">
          <Link
            href="/account/notifications"
            onClick={closePanel}
            className="flex h-10 items-center justify-center rounded-full bg-[var(--plum)] text-[0.82rem] font-medium text-white"
          >
            {ar ? "عرض كل الإشعارات" : "View all notifications"}
          </Link>
        </div>
      </aside>
    </div>
  );
}
