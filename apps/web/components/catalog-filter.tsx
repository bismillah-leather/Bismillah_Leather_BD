"use client";

import { INITIAL_CATEGORIES } from "@bismillah/shared";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CategoryPillsBar, categoryPillClass } from "./category-pills";

const FILTERS = [
  { id: "all", label: "All" },
  ...INITIAL_CATEGORIES.map((category) => ({
    id: category.slug,
    label: category.name,
  })),
  { id: "sale", label: "Sale" },
] as const;

export type CatalogFilterId = (typeof FILTERS)[number]["id"];

type CatalogFilterContextValue = {
  filter: CatalogFilterId;
  setFilter: (id: CatalogFilterId) => void;
};

const CatalogFilterContext = createContext<CatalogFilterContextValue | null>(null);

export function useCatalogFilter() {
  const value = useContext(CatalogFilterContext);
  if (!value) {
    throw new Error("useCatalogFilter must be used within CatalogFilterProvider");
  }
  return value;
}

/** Sticky pills stay under the header across every section below the marquee. */
export function CatalogFilterProvider({ children }: { children: ReactNode }) {
  const [filter, setFilter] = useState<CatalogFilterId>("all");
  const value = useMemo(() => ({ filter, setFilter }), [filter]);

  return (
    <CatalogFilterContext.Provider value={value}>
      <div className="relative">
        <CategoryPillsBar>
          <div role="tablist" aria-label="Product categories" className="contents">
            {FILTERS.map((item) => {
              const selected = item.id === filter;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => {
                    setFilter(item.id);
                    document.getElementById("all-products")?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }}
                  className={categoryPillClass(selected)}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </CategoryPillsBar>
        {children}
      </div>
    </CatalogFilterContext.Provider>
  );
}
