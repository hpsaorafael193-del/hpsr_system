"use client";

import {
  Braces,
  Cloud,
  Code2,
  Database,
  Github,
  Layers3,
  PackageCheck,
  Rocket,
  ServerCog,
  Sparkles,
  X,
} from "lucide-react";

const technologies = [
  { name: "Next.js", icon: Layers3 },
  { name: "React", icon: Code2 },
  { name: "TypeScript", icon: Braces },
  { name: "Tailwind CSS", icon: Sparkles },
  { name: "Supabase", icon: Database },
  { name: "Lucide", icon: PackageCheck },
  { name: "Vercel", icon: Rocket },
  { name: "GitHub", icon: Github },
  { name: "Node.js", icon: ServerCog },
  { name: "pnpm", icon: Cloud },
];

export function DeveloperCreditsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#160500]/70 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-labelledby="developer-credits-title">
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Fechar informações do sistema" />

      <section className="relative max-h-[92vh] w-full max-w-[720px] overflow-y-auto rounded-[24px] border border-[#ead6c4] bg-[linear-gradient(180deg,#fffdf9_0%,#fff7ef_100%)] shadow-[0_30px_90px_rgba(38,6,0,0.38)]">
        <header className="relative overflow-hidden bg-[linear-gradient(135deg,#6f2b17_0%,#4a160c_58%,#260600_100%)] px-5 py-6 text-white sm:px-8 sm:py-7">
          <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
          <button type="button" onClick={onClose} className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20" aria-label="Fechar">
            <X size={19} />
          </button>

          <div className="pr-12">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-100/70">Sobre o sistema</p>
            <h2 id="developer-credits-title" className="mt-2 text-2xl font-black leading-tight sm:text-3xl">Hospital São Rafael</h2>
            <p className="mt-1 text-sm font-semibold text-orange-50/80">Sistema clínico e administrativo · Eldorado</p>
          </div>
        </header>

        <div className="space-y-6 p-5 sm:p-8">
          <div className="rounded-[18px] border border-[#ead6c4] bg-white px-5 py-5 text-center shadow-[0_12px_30px_rgba(91,24,9,0.07)]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#6f2b17] text-white shadow-lg">
              <Code2 size={24} />
            </div>
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.18em] text-hpsr-wineLight">Desenvolvido por</p>
            <h3 className="mt-2 text-xl font-black uppercase tracking-[0.04em] text-hpsr-text sm:text-2xl">Luidhy Conceição Dos Santos</h3>
            <p className="mt-2 text-sm font-bold text-hpsr-muted">Developer & Problem Solver</p>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#ead6c4]" />
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-hpsr-wine">Tecnologias utilizadas</p>
              <div className="h-px flex-1 bg-[#ead6c4]" />
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5">
              {technologies.map(({ name, icon: Icon }) => (
                <div key={name} className="flex min-h-[92px] flex-col items-center justify-center rounded-[16px] border border-[#ead6c4] bg-[#fffaf4] px-3 py-3 text-center transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md">
                  <Icon size={24} className="text-hpsr-wine" />
                  <span className="mt-2 text-xs font-black text-hpsr-text">{name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[16px] border border-[#ead6c4] bg-[#f5e8dc] px-4 py-4 text-center">
            <p className="text-sm font-black text-hpsr-wine">Desenvolvido para o Hospital São Rafael - Eldorado</p>
            <p className="mt-2 text-xs font-semibold text-hpsr-muted">© 2026 Luidhy Conceição Dos Santos. Todos os direitos reservados.</p>
            <p className="mt-1 text-[11px] font-semibold text-hpsr-muted">Versão do sistema: 0.4.76</p>
          </div>

          <button type="button" onClick={onClose} className="inline-flex min-h-[46px] w-full items-center justify-center rounded-[14px] bg-hpsr-wine px-5 text-sm font-black text-white transition hover:bg-hpsr-wineLight">
            Fechar
          </button>
        </div>
      </section>
    </div>
  );
}
