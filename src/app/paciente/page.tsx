import type { ReactNode } from "react";
import { BadgeDollarSign, CalendarClock, FileHeart, FileText, ShieldCheck, Stethoscope } from "lucide-react";
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
              Entre na sua conta para acompanhar consultas, horários e exames liberados pelo Hospital São Rafael.
            </p>
            </div>
          </header>


          <section className="mx-auto mt-6 w-full">
            <PatientAccessPanel />
          </section>

          <section className="mx-auto mt-6 max-w-7xl">
            <div className="mb-4 flex items-center gap-3 px-1">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-hpsr-wine text-white">
                <Stethoscope size={19} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Orientações do portal</p>
                <h2 className="text-lg font-black text-hpsr-text">Como funciona o atendimento</h2>
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
                    <h3 className="text-base font-black text-hpsr-text">Etapas do atendimento</h3>
                  </div>
                </div>
                <div className="mt-4 grid gap-3">
                  <Step number="1" title="Solicitação" text="Você informa a necessidade da consulta. Não é necessário escolher dia ou horário pelo Portal." />
                  <Step number="2" title="Contato médico" text="Após a análise, aguarde o contato direto do médico responsável pelo Discord/contato cadastrado. Não escolha data ou horário no Portal." />
                  <Step number="3" title="Agendamento" text="A data e o horário são definidos diretamente com o médico e passam a aparecer no acompanhamento da consulta." />
                  <Step number="4" title="Acompanhamento" text="Mesmo durante o acompanhamento, retornos e alterações de horário continuam sendo combinados diretamente com o médico." />
                </div>
              </article>

              <article className="rounded-[22px] border border-hpsr-border bg-white/88 p-5 shadow-[0_14px_36px_rgba(82,48,27,.06)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#f7ede3] text-hpsr-wine">
                    <BadgeDollarSign size={19} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-hpsr-wineLight">Valores e cobranças</p>
                    <h3 className="text-base font-black text-hpsr-text">Informações importantes</h3>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <PriceCard title="Consulta especializada" value="R$ 5.000" />
                    <PriceCard title="Psicologia e Psiquiatria" value="R$ 3.000" />
                  </div>
                  <InfoCard title="Mantenha o contato atualizado" text="O e-mail cadastrado é o principal meio de contato para o agendamento. Quando ele não estiver disponível, informe corretamente o ID do Discord na solicitação." />
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
        <p className="text-[13px] font-black text-hpsr-text">{title}</p>
        <p className="mt-1 text-[13px] font-semibold leading-relaxed text-hpsr-muted">{text}</p>
      </div>
    </div>
  );
}

function PriceCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-hpsr-border bg-[#fffaf4] px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.1em] text-hpsr-wineLight">{title}</p>
      <p className="mt-2 text-lg font-black text-hpsr-text">{value}</p>
    </div>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[16px] border border-hpsr-border bg-[#fffaf4] px-4 py-3">
      <p className="text-[13px] font-black text-hpsr-text">{title}</p>
      <p className="mt-1 text-[13px] font-semibold leading-relaxed text-hpsr-muted">{text}</p>
    </div>
  );
}

function MiniInfo({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-[18px] border border-hpsr-border bg-white/82 p-4">
      <div className="flex items-center gap-2 text-hpsr-wine">{icon}<span className="text-[13px] font-black text-hpsr-text">{title}</span></div>
      <p className="mt-2 text-xs font-semibold leading-relaxed text-hpsr-muted sm:text-sm">{text}</p>
    </div>
  );
}
