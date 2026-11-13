"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { CLOSURE_CHANGED } from "@/lib/hospital-closure";

const ClosureContext = createContext<boolean | null>(null);
export function useHospitalClosure() { return useContext(ClosureContext); }

export function ClosureState({children}: {children: React.ReactNode}) {
  const [closed, setClosed] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    let sequence = 0;
    async function refresh() {
      const request = ++sequence;
      try {
        const response = await fetch("/api/encerramento", {cache:"no-store"});
        const result = response.ok ? await response.json() : null;
        if (active && request === sequence && typeof result?.active === "boolean") setClosed(result.active);
      } catch { /* The database remains authoritative. */ }
    }
    const changed = (event: Event) => {
      const next = (event as CustomEvent).detail;
      if (typeof next === "boolean") { ++sequence; setClosed(next); }
      else void refresh();
    };
    void refresh();
    const interval = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    window.addEventListener(CLOSURE_CHANGED, changed);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      window.removeEventListener(CLOSURE_CHANGED, changed);
    };
  }, []);
  return <ClosureContext.Provider value={closed}>{children}</ClosureContext.Provider>;
}
