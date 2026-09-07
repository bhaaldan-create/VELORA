"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { storefrontProductCardImageUrl } from "@/lib/catalog-mapper";
import type { CartItem, Product } from "@/types";

function withCartImage(product: Product): Product {
  const imageUrl =
    product.imageUrl?.trim() || storefrontProductCardImageUrl(product.id);
  return imageUrl === product.imageUrl ? product : { ...product, imageUrl };
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "velora-cart-iqd-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        const loaded = parsed.map((item) => ({
          ...item,
          product: withCartImage(item.product),
        }));
        // Merge if the shopper added items before hydration finished
        setItems((current) => {
          if (current.length === 0) return loaded;
          const byId = new Map(
            loaded.map((item) => [item.product.id, item] as const),
          );
          for (const item of current) {
            const existing = byId.get(item.product.id);
            if (existing) {
              byId.set(item.product.id, {
                product: withCartImage({
                  ...existing.product,
                  ...item.product,
                  imageUrl:
                    item.product.imageUrl || existing.product.imageUrl,
                }),
                quantity: existing.quantity + item.quantity,
              });
            } else {
              byId.set(item.product.id, {
                ...item,
                product: withCartImage(item.product),
              });
            }
          }
          return Array.from(byId.values());
        });
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const addItem = (product: Product, quantity = 1) => {
      const snapshot = withCartImage(product);
      setItems((prev) => {
        const existing = prev.find((i) => i.product.id === snapshot.id);
        if (existing) {
          return prev.map((i) =>
            i.product.id === snapshot.id
              ? {
                  ...i,
                  product: withCartImage({
                    ...snapshot,
                    ...i.product,
                    imageUrl: i.product.imageUrl || snapshot.imageUrl,
                  }),
                  quantity: i.quantity + quantity,
                }
              : i,
          );
        }
        return [...prev, { product: snapshot, quantity }];
      });
    };

    const removeItem = (productId: string) => {
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
    };

    const updateQuantity = (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(productId);
        return;
      }
      setItems((prev) =>
        prev.map((i) =>
          i.product.id === productId ? { ...i, quantity } : i,
        ),
      );
    };

    const clearCart = () => setItems([]);

    return {
      items,
      itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: items.reduce(
        (sum, i) => sum + i.product.price * i.quantity,
        0,
      ),
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
