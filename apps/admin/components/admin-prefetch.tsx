"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const ROUTES = [
  "/dashboard",
  "/orders",
  "/couriers",
  "/statements",
  "/customers",
  "/products",
  "/inventory",
  "/product-videos",
  "/landings",
  "/flash-sale",
  "/coupons",
  "/reviews",
  "/content",
  "/team",
  "/security",
  "/settings",
  "/account",
];

export function AdminPrefetch() {
  const router = useRouter();
  useEffect(() => {
    let index = 0;
    let timer = 0;
    const tick = () => {
      const href = ROUTES[index];
      if (!href) return;
      index += 1;
      void router.prefetch(href);
      timer = window.setTimeout(tick, 80);
    };
    timer = window.setTimeout(tick, 120);
    return () => window.clearTimeout(timer);
  }, [router]);
  return null;
}
