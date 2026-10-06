"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Code2, ShieldCheck } from "lucide-react";
const DeveloperCreditsModal = dynamic(
  () => import("@/components/layout/DeveloperCreditsModal").then((module) => module.DeveloperCreditsModal),
  { ssr: false },
);

export function PublicSystemFooter() {
  const [creditsOpen, setCreditsOpen] = useState(false);

  return (
    <>
      <footer className="border-t border-[#e7d8c9] bg-[linear-gradient(180deg,#fffaf4_0%,#f5e8dc_100%)] px-4 py-2.5 text-hpsr-text lg:px-5">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 rounded-[16px] border border-[#e5d1bf] bg-[#eee2d6]/85 px-4 py-2.5 shadow-[0_8px_22px_rgba(91,24,9,0.04)] sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-hpsr-wine">
              <ShieldCheck size={17} />
              <p className="text-[10px] font-black uppercase tracking-[0.16em]">Hospital São Rafael · Eldorado</p>
            </div>
            <p className="mt-0.5 text-xs font-black text-hpsr-text">HPSR System</p>
          </div>

          <button
            type="button"
            onClick={() => setCreditsOpen(true)}
            className="inline-flex min-h-[36px] shrink-0 items-center justify-center gap-2 rounded-[10px] border border-[#cdb6a5] bg-[#f6eee5] px-3 text-[11px] font-black text-hpsr-wine shadow-sm transition hover:-translate-y-0.5 hover:bg-[#fffaf4]"
          >
            <Code2 size={16} /> Sobre o sistema
          </button>
        </div>
      </footer>

      {creditsOpen && <DeveloperCreditsModal open onClose={() => setCreditsOpen(false)} />}
    </>
  );
}
