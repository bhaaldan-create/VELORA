"use client";

import { CartProvider } from "@/context/CartContext";
import { CheckoutUIProvider } from "@/context/CheckoutUIContext";
import { CustomerAuthProvider } from "@/context/CustomerAuthContext";
import { LocaleProvider } from "@/context/LocaleContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { WishlistProvider } from "@/context/WishlistContext";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <CustomerAuthProvider>
          <WishlistProvider>
            <CartProvider>
              <CheckoutUIProvider>{children}</CheckoutUIProvider>
            </CartProvider>
          </WishlistProvider>
        </CustomerAuthProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
