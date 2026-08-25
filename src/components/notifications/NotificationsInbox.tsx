"use client";

import Link from "next/link";
import { NotificationList } from "@/components/notifications/NotificationPanel";
import { useLocale } from "@/context/LocaleContext";
import { useNotifications } from "@/context/NotificationContext";

export function NotificationsInbox() {
  const { locale } = useLocale();
  const ar = locale !== "en";
  const { notifications, unreadCount, ready, markRead, markAllRead, refresh } =
    useNotifications();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[0.65rem] font-medium tracking-[0.18em] text-[var(--muted)] uppercase">
            Inbox
          </p>
          <h1 className="font-display mt-1 text-[clamp(1.4rem,3vw,1.85rem)] font-semibold text-[var(--plum)]">
            {ar ? "الإشعارات" : "Notifications"}
          </h1>
          {unreadCount > 0 ? (
            <p className="mt-1 text-[0.82rem] text-[var(--muted)]">
              {ar
                ? `${unreadCount} إشعار غير مقروء`
                : `${unreadCount} unread`}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => void markAllRead()}
              className="rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-3.5 py-2 text-[0.75rem] font-medium text-[var(--plum)]"
            >
              {ar ? "تعليم الكل كمقروء" : "Mark all read"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-3.5 py-2 text-[0.75rem] font-medium text-[var(--plum)]"
          >
            {ar ? "تحديث" : "Refresh"}
          </button>
        </div>
      </div>

      {!ready ? (
        <p className="text-[0.85rem] text-[var(--muted)]">
          {ar ? "جارٍ التحميل…" : "Loading…"}
        </p>
      ) : (
        <NotificationList
          items={notifications}
          onOpenItem={(item) => {
            if (!item.read) void markRead([item.id]);
          }}
        />
      )}

      <div className="mt-8">
        <Link
          href="/account"
          className="text-[0.8rem] text-[var(--plum)] underline underline-offset-4"
        >
          {ar ? "العودة إلى حسابي" : "Back to my account"}
        </Link>
      </div>
    </div>
  );
}
