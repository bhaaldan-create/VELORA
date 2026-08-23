"use client";

import { CartProvider } from "@/context/CartContext";
import { CheckoutUIProvider } from "@/context/CheckoutUIContext";
import { CustomerAuthProvider } from "@/context/CustomerAuthContext";
import { LocaleProvider } from "@/context/LocaleContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { WishlistProvider } from "@/context/WishlistContext";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <CustomerAuthProvider>
          <NotificationProvider>
            <WishlistProvider>
              <CartProvider>
                <CheckoutUIProvider>{children}</CheckoutUIProvider>
              </CartProvider>
            </WishlistProvider>
          </NotificationProvider>
        </CustomerAuthProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
