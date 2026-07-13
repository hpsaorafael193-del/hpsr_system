import { FileHeart, ShieldCheck, TriangleAlert } from "lucide-react";
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
              Consulte registros liberados, acompanhe suas consultas e solicite atendimentos usando um código temporário enviado por e-mail.
            </p>
          </header>

          <section className="mx-auto mt-5 max-w-4xl rounded-[18px] border border-amber-300 bg-amber-50 p-3.5 text-amber-950 sm:p-4">
            <div className="flex items-start gap-3">
              <TriangleAlert className="mt-0.5 shrink-0" size={21} />
              <div>
                <h2 className="font-black">Aviso obrigatório de Roleplay</h2>
                <p className="mt-1 text-sm font-semibold leading-relaxed">
                  Todos os exames, documentos, consultas e informações deste portal são fictícios e não possuem validade médica real.
                </p>
              </div>
            </div>
          </section>

          <section className="mx-auto mt-5 max-w-4xl">
            <PatientAccessPanel />
          </section>

          <section className="mx-auto mt-5 grid max-w-4xl gap-3 sm:grid-cols-3">
            {[
              "Acesso temporário por código",
              "Somente registros liberados",
              "Sessão restrita ao paciente",
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
