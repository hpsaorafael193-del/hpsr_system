import type { ReactNode } from "react";
import { BadgeDollarSign, CalendarClock, FileHeart, FileText, ShieldCheck, Stethoscope } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { PatientAccessPanel } from "@/components/public/PatientAccessPanel";

export default function PatientPortalPage() {
  return (
    <PublicShell>
      <main className="public-pattern min-h-[100dvh] overflow-x-hidden px-3 py-6 text-hpsr-text sm:px-4 sm:py-8 lg:px-5 lg:py-10">
        <div className="mx-auto w-full max-w-5xl min-w-0">
          <header className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-hpsr-border bg-white/85 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-hpsr-wineLight shadow-sm">
              <FileHeart size={15} /> Área do paciente
            </span>
            <h1 className="mt-4 break-words text-[clamp(1.8rem,6vw,3rem)] font-black tracking-tight text-hpsr-text">
              Portal do Paciente
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-hpsr-muted sm:text-base">
              Entre na sua conta para acompanhar consultas, confirmar horários e acessar exames e documentos liberados pelo Hospital São Rafael.
            </p>
          </header>

          <section className="mx-auto mt-6 max-w-4xl">
            <PatientAccessPanel />
          </section>

          <section className="mx-auto mt-6 max-w-5xl">
            <div className="mb-4 flex items-center gap-3 px-1">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-hpsr-wine text-white">
                <Stethoscope size={19} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Orientações do portal</p>
                <h2 className="text-xl font-black text-hpsr-text">Como funciona o atendimento</h2>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <article className="rounded-[22px] border border-hpsr-border bg-white/88 p-5 shadow-[0_14px_36px_rgba(82,48,27,.06)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#f7ede3] text-hpsr-wine">
                    <CalendarClock size={19} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-hpsr-wineLight">Agendamento e consultas</p>
                    <h3 className="text-lg font-black text-hpsr-text">Etapas do atendimento</h3>
                  </div>
                </div>
                <div className="mt-4 grid gap-3">
                  <Step number="1" title="Consulta planejada" text="A equipe médica define a data do acompanhamento e disponibiliza os horários correspondentes." />
                  <Step number="2" title="Escolha do horário" text="Durante o dia anterior à consulta, os horários liberados aparecem no portal para confirmação." />
                  <Step number="3" title="Confirmação" text="O primeiro paciente que confirma um horário disponível garante aquela vaga." />
                  <Step number="4" title="Acompanhamento" text="Consultas futuras, alterações e orientações ficam reunidas na sua área pessoal." />
                </div>
              </article>

              <article className="rounded-[22px] border border-hpsr-border bg-white/88 p-5 shadow-[0_14px_36px_rgba(82,48,27,.06)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#f7ede3] text-hpsr-wine">
                    <BadgeDollarSign size={19} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-hpsr-wineLight">Valores e cobranças</p>
                    <h3 className="text-lg font-black text-hpsr-text">Informações importantes</h3>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <PriceCard title="Consulta especializada" value="R$ 5.000" />
                    <PriceCard title="Psicologia e Psiquiatria" value="R$ 3.000" />
                  </div>
                  <InfoCard title="Falta de confirmação" text="Quando o horário não é confirmado dentro do período disponível, o atendimento daquele dia não acontece e poderá haver cobrança." />
                  <InfoCard title="Atrasos e ausências" text="A tolerância é de até 15 minutos. Atrasos não tolerados e faltas sem justificativa aceita podem gerar cobrança." />
                  <InfoCard title="Exames cobrados separadamente" text="Cada exame solicitado possui cobrança adicional própria. O valor da consulta não inclui exames, procedimentos ou outros serviços realizados pelo hospital." />
                  <div className="rounded-[16px] border border-hpsr-border bg-[#351007] px-4 py-3 text-white">
                    <p className="text-sm font-black">Valores conforme a calculadora institucional</p>
                    <p className="mt-1 text-sm font-semibold leading-relaxed text-white/78">
                      Os valores exibidos seguem a calculadora do Hospital São Rafael. Pendências anteriores, faltas ou cobranças adicionais podem ser somadas ao atendimento atual.
                    </p>
                  </div>
                </div>
              </article>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <MiniInfo icon={<ShieldCheck size={17} />} title="Acesso seguro" text="Sua conta é vinculada ao passaporte do Prontuário." />
              <MiniInfo icon={<FileHeart size={17} />} title="Exames liberados" text="Somente registros autorizados pela equipe ficam disponíveis." />
              <MiniInfo icon={<FileText size={17} />} title="Documentos" text="Visualize e baixe os documentos liberados para sua conta." />
            </div>
          </section>
        </div>
      </main>
    </PublicShell>
  );
}

function Step({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-[16px] border border-hpsr-border bg-[#fffaf4] p-3.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-hpsr-wine text-xs font-black text-white">{number}</span>
      <div>
        <p className="text-sm font-black text-hpsr-text">{title}</p>
        <p className="mt-1 text-sm font-semibold leading-relaxed text-hpsr-muted">{text}</p>
      </div>
    </div>
  );
}

function PriceCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-hpsr-border bg-[#fffaf4] px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.1em] text-hpsr-wineLight">{title}</p>
      <p className="mt-2 text-xl font-black text-hpsr-text">{value}</p>
    </div>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[16px] border border-hpsr-border bg-[#fffaf4] px-4 py-3">
      <p className="text-sm font-black text-hpsr-text">{title}</p>
      <p className="mt-1 text-sm font-semibold leading-relaxed text-hpsr-muted">{text}</p>
    </div>
  );
}

function MiniInfo({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-[18px] border border-hpsr-border bg-white/82 p-4">
      <div className="flex items-center gap-2 text-hpsr-wine">{icon}<span className="text-sm font-black text-hpsr-text">{title}</span></div>
      <p className="mt-2 text-xs font-semibold leading-relaxed text-hpsr-muted sm:text-sm">{text}</p>
    </div>
  );
}
