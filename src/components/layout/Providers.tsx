"use client";

import { CartProvider } from "@/context/CartContext";
import { CustomerAuthProvider } from "@/context/CustomerAuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <CustomerAuthProvider>
        <CartProvider>{children}</CartProvider>
      </CustomerAuthProvider>
    </ThemeProvider>
  );
}
