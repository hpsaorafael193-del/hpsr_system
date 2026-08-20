"use client";

import { useState } from "react";
import { Code2, ShieldCheck } from "lucide-react";
import { DeveloperCreditsModal } from "@/components/layout/DeveloperCreditsModal";

export function PublicSystemFooter() {
  const [creditsOpen, setCreditsOpen] = useState(false);

  return (
    <>
      <footer className="border-t border-[#e7d8c9] bg-[linear-gradient(180deg,#fffaf4_0%,#f5e8dc_100%)] px-4 py-5 text-hpsr-text lg:px-5">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 rounded-[20px] border border-[#e5d1bf] bg-white/75 px-4 py-4 shadow-[0_12px_30px_rgba(91,24,9,0.05)] sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-hpsr-wine">
              <ShieldCheck size={17} />
              <p className="text-[10px] font-black uppercase tracking-[0.16em]">Hospital São Rafael · Eldorado</p>
            </div>
            <p className="mt-1 text-sm font-black text-hpsr-text">Sobre o sistema</p>
            <p className="mt-1 max-w-2xl text-xs font-semibold leading-relaxed text-hpsr-muted">
              Consulte informações sobre a plataforma, tecnologias utilizadas e desenvolvimento do sistema.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setCreditsOpen(true)}
            className="inline-flex min-h-[42px] shrink-0 items-center justify-center gap-2 rounded-[13px] border border-hpsr-border bg-white px-3.5 text-xs font-black text-hpsr-wine shadow-sm transition hover:-translate-y-0.5 hover:bg-[#fffaf4]"
          >
            <Code2 size={16} /> Sobre o sistema
          </button>
        </div>
      </footer>

      <DeveloperCreditsModal open={creditsOpen} onClose={() => setCreditsOpen(false)} />
    </>
  );
}
