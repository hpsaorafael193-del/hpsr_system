import { FileHeart } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { PatientAccessPanel } from "@/components/public/PatientAccessPanel";

export default function PatientPortalPage() {
  return (
    <PublicShell patientPortal>
      <main className="public-pattern min-h-[100dvh] overflow-x-hidden px-3 py-4 text-hpsr-text sm:px-4 sm:py-5 lg:px-5 lg:py-6">
        <div className="mx-auto w-full max-w-7xl min-w-0">
          <header className="relative overflow-hidden rounded-[32px] border border-hpsr-border bg-[radial-gradient(circle_at_top_left,rgba(103,38,20,.10),transparent_38%),linear-gradient(135deg,rgba(255,250,244,.98),rgba(255,255,255,.96))] px-5 py-4 text-center shadow-[0_22px_60px_rgba(82,48,27,.08)] sm:px-8 sm:py-5">
            <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border-[32px] border-[#f3e5d8]/70" />
            <div className="pointer-events-none absolute -bottom-24 -left-20 h-52 w-52 rounded-full bg-[#f7ede3]/70 blur-2xl" />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-hpsr-border bg-white/85 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-hpsr-wineLight shadow-sm">
                <FileHeart size={15} /> Área do paciente
              </span>
              <h1 className="mt-2 break-words text-[clamp(1.55rem,4.4vw,2.2rem)] font-black tracking-tight text-hpsr-text">
                Portal do Paciente
              </h1>
              <p className="mx-auto mt-1.5 max-w-2xl text-[13px] font-semibold leading-relaxed text-hpsr-muted sm:text-sm">
                Entre para pedir consultas e exames, ver seus agendamentos, acompanhamentos e prontuário.
              </p>
            </div>
          </header>

          <section className="mx-auto mt-5 w-full">
            <PatientAccessPanel />
          </section>
        </div>
      </main>
    </PublicShell>
  );
}
