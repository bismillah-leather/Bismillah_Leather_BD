"use client";

import { defaultStoreBrand, type StoreBrand } from "@bismillah/shared";
import { createContext, useContext, type ReactNode } from "react";

const BrandContext = createContext<StoreBrand>(defaultStoreBrand());

export function BrandProvider({
  brand,
  children,
}: {
  brand: StoreBrand;
  children: ReactNode;
}) {
  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}

export function useStoreBrand(): StoreBrand {
  return useContext(BrandContext);
}
