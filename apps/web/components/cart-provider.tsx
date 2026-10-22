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

type CartUiContextValue = {
  open: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
};

const CartUiContext = createContext<CartUiContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const openCart = useCallback(() => setOpen(true), []);
  const closeCart = useCallback(() => setOpen(false), []);
  const toggleCart = useCallback(() => setOpen((v) => !v), []);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("bl-cart-open", onOpen);
    return () => window.removeEventListener("bl-cart-open", onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const value = useMemo(
    () => ({ open, openCart, closeCart, toggleCart }),
    [open, openCart, closeCart, toggleCart],
  );

  return <CartUiContext.Provider value={value}>{children}</CartUiContext.Provider>;
}

export function useCartUi() {
  const ctx = useContext(CartUiContext);
  if (!ctx) throw new Error("useCartUi must be used within CartProvider");
  return ctx;
}

export function openCartDrawer() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("bl-cart-open"));
}
