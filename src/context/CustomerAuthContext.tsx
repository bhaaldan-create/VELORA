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

export type CustomerPublic = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  address: string;
};

type CustomerAuthValue = {
  customer: CustomerPublic | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setCustomer: (customer: CustomerPublic | null) => void;
  logout: () => Promise<void>;
};

const CustomerAuthContext = createContext<CustomerAuthValue | null>(null);

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<CustomerPublic | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = (await res.json()) as {
        ok?: boolean;
        customer?: CustomerPublic | null;
      };
      setCustomer(data.customer ?? null);
    } catch {
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setCustomer(null);
  }, []);

  const value = useMemo(
    () => ({ customer, loading, refresh, setCustomer, logout }),
    [customer, loading, refresh, logout],
  );

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) {
    throw new Error("useCustomerAuth must be used within CustomerAuthProvider");
  }
  return ctx;
}
