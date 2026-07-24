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
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#160500]/70 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="developer-credits-title"
    >
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Fechar informações do sistema"
      />

      <section className="relative max-h-[92vh] w-full max-w-[720px] overflow-y-auto rounded-[24px] border border-[#ead6c4] bg-[linear-gradient(180deg,#fffdf9_0%,#fff7ef_100%)] p-5 shadow-[0_30px_90px_rgba(38,6,0,0.38)] sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-[#dec4b1] bg-white text-[#6f2b17] shadow-sm transition hover:rotate-3 hover:bg-[#fff4eb] focus:outline-none focus:ring-2 focus:ring-[#6f2b17]/25 sm:right-6 sm:top-6"
          aria-label="Fechar"
        >
          <X size={19} />
        </button>

        <div className="mb-6 pr-14 text-center sm:pr-0">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-hpsr-wineLight">Sobre o sistema</p>
          <h2 id="developer-credits-title" className="mt-2 text-2xl font-black leading-tight text-hpsr-text sm:text-3xl">
            Hospital São Rafael
          </h2>
          <p className="mt-1 text-sm font-semibold text-hpsr-muted">Sistema clínico e administrativo · Eldorado</p>
        </div>

        <div className="space-y-6">
          <div className="rounded-[18px] border border-[#ead6c4] bg-white px-5 py-5 text-center shadow-[0_12px_30px_rgba(91,24,9,0.07)]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#6f2b17] text-white shadow-lg">
              <Code2 size={24} />
            </div>
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.18em] text-hpsr-wineLight">Desenvolvido por</p>
            <h3 className="mt-2 text-xl font-black uppercase tracking-[0.04em] text-hpsr-text sm:text-2xl">
              Luidhy Conceição dos Santos
            </h3>
            <p className="mt-2 text-sm font-bold text-hpsr-muted">Developer &amp; Problem Solver</p>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#ead6c4]" />
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-hpsr-wine">Tecnologias utilizadas</p>
              <div className="h-px flex-1 bg-[#ead6c4]" />
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5">
              {technologies.map(({ name, icon: Icon }) => (
                <div
                  key={name}
                  className="group flex min-h-[92px] flex-col items-center justify-center rounded-[16px] border border-[#ead6c4] bg-[#fffaf4] px-3 py-3 text-center transition duration-200 hover:-translate-y-1 hover:bg-white hover:shadow-md"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-[11px] text-hpsr-wine transition group-hover:bg-[#6f2b17] group-hover:text-white">
                    <Icon size={23} />
                  </div>
                  <span className="mt-2 text-xs font-black text-hpsr-text">{name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[16px] border border-[#ead6c4] bg-[#f5e8dc] px-4 py-4 text-center">
            <p className="text-sm font-black text-hpsr-wine">Desenvolvido para o Hospital São Rafael - Eldorado</p>
            <p className="mt-2 text-xs font-semibold text-hpsr-muted">© 2026 Luidhy Conceição dos Santos. Todos os direitos reservados.</p>
            <p className="mt-1 text-[11px] font-semibold text-hpsr-muted">Versão do sistema: 0.5.22</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[46px] w-full items-center justify-center rounded-[14px] bg-hpsr-wine px-5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-hpsr-wineLight focus:outline-none focus:ring-2 focus:ring-hpsr-wine/25"
          >
            Fechar
          </button>
        </div>
      </section>
    </div>
  );
}
