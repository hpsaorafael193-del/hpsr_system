import { FileHeart, ShieldCheck } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { PatientAccessPanel } from "@/components/public/PatientAccessPanel";

export default function PatientPortalPage() {
  return (
    <PublicShell>
      <main className="public-pattern min-h-[100dvh] overflow-x-hidden px-3 py-6 text-hpsr-text sm:px-4 sm:py-8 lg:px-5 lg:py-10">
        <div className="mx-auto w-full max-w-5xl min-w-0">
          <header className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-hpsr-border bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-hpsr-wineLight">
              <FileHeart size={15} /> Área do paciente
            </span>
            <h1 className="mt-4 break-words text-[clamp(1.55rem,6vw,2.7rem)] font-black tracking-tight text-hpsr-text">
              Portal do Paciente
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-hpsr-muted sm:text-base">
              Entre com sua conta para acompanhar consultas, escolher horários e acessar exames e documentos liberados.
            </p>
          </header>

          <section className="mx-auto mt-5 max-w-4xl">
            <PatientAccessPanel />
          </section>

          <section className="mx-auto mt-5 grid max-w-4xl gap-3 sm:grid-cols-3">
            {[
              "Conta vinculada ao Prontuário",
              "Somente registros liberados",
              "Acesso protegido por senha",
            ].map((label) => (
              <div key={label} className="flex min-h-[76px] items-center justify-center gap-2 rounded-[16px] border border-hpsr-border bg-white/75 px-3 text-center text-xs font-black text-hpsr-wine sm:text-sm">
                <ShieldCheck size={17} className="shrink-0" /> {label}
              </div>
            ))}
          </section>
        </div>
      </main>
    </PublicShell>
  );
}
