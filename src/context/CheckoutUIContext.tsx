"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type CheckoutUIContextValue = {
  immersive: boolean;
  setImmersive: (value: boolean) => void;
};

const CheckoutUIContext = createContext<CheckoutUIContextValue | null>(null);

export function CheckoutUIProvider({ children }: { children: ReactNode }) {
  const [immersive, setImmersive] = useState(false);
  const value = useMemo(
    () => ({ immersive, setImmersive }),
    [immersive],
  );

  return (
    <CheckoutUIContext.Provider value={value}>
      {children}
    </CheckoutUIContext.Provider>
  );
}

export function useCheckoutUI() {
  const ctx = useContext(CheckoutUIContext);
  if (!ctx) {
    throw new Error("useCheckoutUI must be used within CheckoutUIProvider");
  }
  return ctx;
}
