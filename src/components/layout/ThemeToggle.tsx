"use client";

import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}
      title={dark ? "Modo claro" : "Modo escuro (teste)"}
      className="hpsr-theme-toggle flex h-[42px] w-[42px] items-center justify-center rounded-[14px] border border-hpsr-border bg-white/[0.86] text-hpsr-wine transition hover:bg-white"
    >
      {dark ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  );
}
