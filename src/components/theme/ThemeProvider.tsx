"use client";
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
type Theme = "light" | "dark";
const ThemeContext = createContext({ theme: "light" as Theme, toggleTheme: () => {} });
export const themeBootstrap = `(function(){var p=window.location.pathname;var internal=p==='/dashboard'||p.indexOf('/dashboard/')===0;try{document.documentElement.dataset.theme=internal&&localStorage.getItem('hpsr-ui-theme')==='dark'?'dark':'light'}catch(e){document.documentElement.dataset.theme='light'}})()`;
const useBeforePaint = typeof window === "undefined" ? useEffect : useLayoutEffect;
export function ThemeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const internal = pathname === "/dashboard" || pathname?.startsWith("/dashboard/") === true;
  const preferred = useRef<Theme>("light");
  const [theme, setTheme] = useState<Theme>("light");
  useBeforePaint(() => {
    let next = preferred.current;
    try { next = localStorage.getItem("hpsr-ui-theme") === "dark" ? "dark" : "light"; } catch { /* Keep an in-memory preference if storage is blocked. */ }
    preferred.current = next;
    const effective = internal ? next : "light";
    document.documentElement.dataset.theme = effective;
    setTheme(effective);
  }, [pathname, internal]);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== "hpsr-ui-theme" && event.key !== null) return;
      preferred.current = event.newValue === "dark" ? "dark" : "light";
      const effective = internal ? preferred.current : "light";
      document.documentElement.dataset.theme = effective;
      setTheme(effective);
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [internal]);
  const toggleTheme = () => {
    if (!internal) return;
    const next = preferred.current === "dark" ? "light" : "dark";
    preferred.current = next;
    document.documentElement.dataset.theme = next;
    setTheme(next);
    try { localStorage.setItem("hpsr-ui-theme", next); } catch { /* Preference only. */ }
  };
  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}
export const useTheme = () => useContext(ThemeContext);
