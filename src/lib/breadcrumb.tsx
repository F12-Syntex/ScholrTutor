"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type BreadcrumbContextValue = {
  subtitle: string | null;
  setSubtitle: (s: string | null) => void;
};

const BreadcrumbContext = createContext<BreadcrumbContextValue>({
  subtitle: null,
  setSubtitle: () => {},
});

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [subtitle, setSubtitle] = useState<string | null>(null);
  return (
    <BreadcrumbContext.Provider value={{ subtitle, setSubtitle }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  return useContext(BreadcrumbContext);
}
