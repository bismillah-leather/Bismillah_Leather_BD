"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  addToCart,
  cartCount,
  clearCart,
  getCartLines,
  removeFromCart,
  setCartQty,
  viewCart,
  type CartItemView,
  type CartLine,
} from "@/lib/cart";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("bl-cart", onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener("bl-cart", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getSnapshot(): CartLine[] {
  return getCartLines();
}

function getServerSnapshot(): CartLine[] {
  return [];
}

export function useCart() {
  const lines = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const items: CartItemView[] = hydrated ? viewCart(lines) : [];
  const count = hydrated ? cartCount(lines) : 0;

  return {
    hydrated,
    lines,
    items,
    count,
    add: addToCart,
    setQty: setCartQty,
    remove: removeFromCart,
    clear: clearCart,
  };
}
