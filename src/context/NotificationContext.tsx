"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useCustomerAuth } from "@/context/CustomerAuthContext";

export type CustomerNotificationItem = {
  id: string;
  titleAr: string;
  bodyAr: string;
  titleEn: string | null;
  bodyEn: string | null;
  href: string | null;
  read: boolean;
  readAt: string | null;
  createdAt: string;
};

type NotificationContextValue = {
  notifications: CustomerNotificationItem[];
  unreadCount: number;
  ready: boolean;
  refresh: () => Promise<void>;
  markRead: (ids: string[]) => Promise<void>;
  markAllRead: () => Promise<void>;
  panelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { customer, loading: authLoading } = useCustomerAuth();
  const customerId = customer?.id ?? null;
  const [notifications, setNotifications] = useState<
    CustomerNotificationItem[]
  >([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [ready, setReady] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  const refresh = useCallback(async () => {
    if (!customerId) {
      setNotifications([]);
      setUnreadCount(0);
      setReady(true);
      return;
    }
    try {
      const res = await fetch("/api/auth/notifications", { cache: "no-store" });
      const data = (await res.json()) as {
        ok?: boolean;
        notifications?: CustomerNotificationItem[];
        unreadCount?: number;
      };
      if (res.ok && data.ok) {
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch {
      /* keep previous */
    } finally {
      setReady(true);
    }
  }, [customerId]);

  useEffect(() => {
    if (authLoading) return;
    if (!customerId) {
      setNotifications([]);
      setUnreadCount(0);
      setReady(true);
      setPanelOpen(false);
      return;
    }
    setReady(false);
    void refresh();
  }, [authLoading, customerId, refresh]);

  const markRead = useCallback(
    async (ids: string[]) => {
      if (!customerId || !ids.length) return;
      try {
        const res = await fetch("/api/auth/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          notifications?: CustomerNotificationItem[];
          unreadCount?: number;
        };
        if (res.ok && data.ok) {
          setNotifications(data.notifications ?? []);
          setUnreadCount(data.unreadCount ?? 0);
        }
      } catch {
        /* ignore */
      }
    },
    [customerId],
  );

  const markAllRead = useCallback(async () => {
    if (!customerId) return;
    try {
      const res = await fetch("/api/auth/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        notifications?: CustomerNotificationItem[];
        unreadCount?: number;
      };
      if (res.ok && data.ok) {
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch {
      /* ignore */
    }
  }, [customerId]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      ready,
      refresh,
      markRead,
      markAllRead,
      panelOpen,
      openPanel: () => setPanelOpen(true),
      closePanel: () => setPanelOpen(false),
    }),
    [
      notifications,
      unreadCount,
      ready,
      refresh,
      markRead,
      markAllRead,
      panelOpen,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return ctx;
}
