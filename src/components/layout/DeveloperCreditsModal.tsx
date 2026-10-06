"use client";

import { useEffect, useRef, useState } from "react";
import {
  Braces,
  Check,
  ChevronDown,
  Code2,
  Copy,
  Database,
  ExternalLink,
  Github,
  Layers3,
  MessageCircle,
  PackageCheck,
  Rocket,
  ServerCog,
  ShieldCheck,
  Sparkles,
  Workflow,
  X,
} from "lucide-react";

const systemVersion = "1.1.16-test.75";
const developerDiscordLabel = "@lluidhy";

const technologyGroups = [
  {
    title: "Aplicação",
    technologies: [
      { name: "Next.js", icon: Layers3 },
      { name: "React", icon: Code2 },
      { name: "TypeScript", icon: Braces },
      { name: "Node.js", icon: ServerCog },
      { name: "pnpm", icon: PackageCheck },
    ],
  },
  {
    title: "Interface",
    technologies: [
      { name: "Tailwind CSS", icon: Sparkles },
      { name: "Lucide", icon: Workflow },
    ],
  },
  {
    title: "Dados e infraestrutura",
    technologies: [
      { name: "Supabase", icon: Database },
      { name: "Vercel", icon: Rocket },
      { name: "GitHub", icon: Github },
    ],
  },
];

export type DeveloperCreditsModalProps = {
  open: boolean;
  onClose: () => void;
};

export function DeveloperCreditsModal({ open, onClose }: DeveloperCreditsModalProps) {
  const [contactOpen, setContactOpen] = useState(false);
  const [discordCopied, setDiscordCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  async function copyDiscordUsername() {
    try {
      await navigator.clipboard.writeText(developerDiscordLabel);
      setDiscordCopied(true);
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => {
        setDiscordCopied(false);
        copiedTimerRef.current = null;
      }, 1800);
    } catch {
      setDiscordCopied(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="hpsr-modal-tone fixed inset-0 z-[100] flex items-center justify-center bg-[#180d0b]/70 p-3 backdrop-blur-[3px] sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="developer-credits-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Fechar informações do sistema"
        tabIndex={-1}
      />

      <section className="relative flex max-h-[92dvh] w-full max-w-[760px] flex-col overflow-hidden rounded-[22px] border border-[#d4bdab] bg-[#f2e8dc] text-[#34231d] shadow-[0_28px_90px_rgba(29,13,9,0.3)] sm:rounded-[26px]">
        <header className="relative shrink-0 overflow-hidden border-b border-[#decabb] bg-[linear-gradient(118deg,#eddfd1_0%,#f6eee5_66%,#e9d8ca_100%)] px-5 pb-5 pt-6 sm:px-8 sm:pb-6 sm:pt-7">
          <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full border border-[#bd9b87]/25" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-4 -top-16 h-48 w-48 rounded-full border border-[#bd9b87]/25" />
          <div className="relative flex items-start gap-3 pr-11 sm:gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#663b2f] text-[#f9efe5] shadow-[0_6px_16px_rgba(64,30,19,0.13)] sm:h-12 sm:w-12">
              <ShieldCheck size={23} aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.19em] text-[#825b4a]">Hospital São Rafael · Eldorado</p>
              <h2 id="developer-credits-title" className="mt-1 text-xl font-bold tracking-tight text-[#39251d] sm:text-[26px]">
                Sobre a plataforma
              </h2>
              <p className="mt-1 max-w-lg text-xs leading-relaxed text-[#765e51] sm:text-sm">
                Tecnologia e desenvolvimento por trás do HP São Rafael.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-[#d5bfaf] bg-[#f7efe7] text-[#684537] transition hover:bg-[#ead8c9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#78503e] sm:right-6 sm:top-6"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </header>

        <div className="min-h-0 overflow-y-auto overscroll-contain px-4 py-5 sm:px-8 sm:py-6">
          <div className="rounded-[18px] border border-[#d8c2b2] bg-[#e9dace] p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#815949]">Desenvolvimento e manutenção</p>
                <h3 className="mt-1 text-lg font-bold tracking-tight text-[#3d281f] sm:text-xl">Luidhy Conceição dos Santos</h3>
                <p className="mt-1 text-xs text-[#795f52]">Desenvolvedor responsável pelo HPSR System</p>
              </div>
              <button
                type="button"
                onClick={() => setContactOpen((value) => !value)}
                aria-expanded={contactOpen}
                aria-controls="developer-contact"
                className="inline-flex min-h-[40px] shrink-0 items-center justify-center gap-2 self-start rounded-[12px] border border-[#bf9d88] bg-[#f7eee5] px-3.5 text-xs font-bold text-[#673e30] transition hover:bg-[#fffbf5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#78503e] sm:self-auto"
              >
                <MessageCircle size={16} /> Contato <ChevronDown size={14} className={contactOpen ? "rotate-180 transition-transform" : "transition-transform"} />
              </button>
            </div>
            {contactOpen && (
              <div id="developer-contact" className="mt-4 flex flex-col gap-3 border-t border-[#d3b9a8] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#886657]">Discord do desenvolvedor</p>
                  <p className="mt-1 font-semibold text-[#50372e]">{developerDiscordLabel}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={copyDiscordUsername}
                    className="inline-flex min-h-[38px] items-center gap-2 rounded-[10px] bg-[#673e30] px-3.5 text-xs font-bold text-[#fcf4ea] transition hover:bg-[#805643] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#78503e]"
                  >
                    {discordCopied ? <Check size={15} /> : <Copy size={15} />}
                    {discordCopied ? "Copiado" : "Copiar usuário"}
                  </button>
                  <a
                    href="https://discord.com/channels/@me"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[38px] items-center gap-2 rounded-[10px] border border-[#c9af9d] bg-[#f7eee5] px-3.5 text-xs font-bold text-[#674535] transition hover:bg-[#fffbf5]"
                  >
                    <ExternalLink size={15} /> Abrir Discord
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-sm font-bold text-[#4c332a] sm:text-base">Tecnologias utilizadas</h3>
              <span className="text-[11px] font-medium text-[#8b7263]">Da interface à infraestrutura</span>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {technologyGroups.map((group, groupIndex) => (
                <div
                  key={group.title}
                  className={`rounded-[16px] border border-[#deccbd] bg-[#f7f0e8] p-3.5 sm:p-4 ${groupIndex === 0 ? "sm:row-span-2" : ""}`}
                >
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#896653]">{group.title}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.technologies.map(({ name, icon: Icon }) => (
                      <span
                        key={name}
                        className="inline-flex min-h-[36px] items-center gap-2 rounded-[10px] border border-[#e2d2c5] bg-[#eee3d8] px-3 py-1.5 text-xs font-semibold text-[#50382e]"
                      >
                        <Icon size={16} className="shrink-0 text-[#825846]" aria-hidden="true" />
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <footer className="shrink-0 border-t border-[#d6c2b3] bg-[#e9dbce] px-4 py-3.5 sm:px-8">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#51372c]">Desenvolvido para o Hospital São Rafael</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-[#80695b]">© 2026 Luidhy Conceição dos Santos. Todos os direitos reservados.</p>
            </div>
            <div className="inline-flex shrink-0 items-center gap-2 self-start rounded-[10px] border border-[#caa994] bg-[#f6eee5] px-3 py-2 sm:self-auto">
              <Code2 size={15} className="text-[#815744]" aria-hidden="true" />
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#816353]">Versão</span>
              <span className="text-sm font-bold tabular-nums text-[#573829]">{systemVersion}</span>
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
}
