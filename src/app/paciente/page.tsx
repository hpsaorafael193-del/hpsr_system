import { FileHeart } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { PatientAccessPanel } from "@/components/public/PatientAccessPanel";

export default function PatientPortalPage() {
  return (
    <PublicShell patientPortal>
      <main className="hpsr-patient-page public-pattern min-h-[100dvh] overflow-x-hidden px-3 py-4 text-hpsr-text sm:px-4 sm:py-5 lg:px-5 lg:py-6">
        <div className="mx-auto w-full max-w-7xl min-w-0">
          <header className="relative overflow-hidden rounded-[26px] border border-[#d7c6b5] bg-[radial-gradient(circle_at_top_left,rgba(112,77,58,.12),transparent_45%),linear-gradient(125deg,#e9ddd1,#f3eae1_56%,#eee2d6)] px-5 py-4 text-center shadow-[0_13px_34px_rgba(68,44,32,.065)] sm:px-8 sm:py-4">
            <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border-[32px] border-[#ddc8b5]/50" />
            <div className="pointer-events-none absolute -bottom-24 -left-20 h-52 w-52 rounded-full bg-[#d9c3ad]/40 blur-2xl" />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-hpsr-border bg-[#f6eee5]/90 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-hpsr-wineLight shadow-sm">
                <FileHeart size={15} /> Área do paciente
              </span>
              <h1 className="mt-2 break-words text-[clamp(1.55rem,4.4vw,2.2rem)] font-black tracking-tight text-hpsr-text">
                Portal do Paciente
              </h1>
              <p className="mx-auto mt-1.5 max-w-2xl text-[13px] font-semibold leading-relaxed text-hpsr-muted sm:text-sm">
                Consultas, exames e prontuários em um só lugar.
              </p>
            </div>
          </header>

          <section className="mx-auto mt-4 w-full">
            <PatientAccessPanel />
          </section>
        </div>
      </main>
    </PublicShell>
  );
}
