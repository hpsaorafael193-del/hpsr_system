import Link from "next/link";
import { CalendarDays, CheckCircle2, ClipboardCheck, Info, Search } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";

const patientSteps = [
  {
    title: "Solicitação",
    description: "O paciente preenche a ficha com os dados principais e o motivo da consulta.",
  },
  {
    title: "Análise médica",
    description: "A equipe avalia a especialidade solicitada e organiza o atendimento.",
  },
  {
    title: "Confirmação",
    description: "O agendamento só é confirmado após aceite do médico responsável.",
  },
];

export default function PatientPortalPage() {
  return (
    <PublicShell>
      <section className="public-pattern min-h-screen px-4 py-10 text-hpsr-text lg:px-5">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <span className="inline-flex rounded-full border border-hpsr-border bg-white/70 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-hpsr-wineLight">
              Área pública
            </span>
            <h1 className="mt-5 text-[clamp(1.45rem,4vw,2rem)] font-black tracking-tight text-hpsr-text lg:text-[clamp(1.7rem,5vw,2.55rem)]">
              Portal do Paciente
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-hpsr-muted lg:text-base">
              Solicite consultas, acompanhe o andamento pelo passaporte e organize seu atendimento com clareza.
            </p>
          </div>

          <section className="mx-auto mt-5 max-w-4xl border border-hpsr-border bg-white/65 px-4 py-3 text-center">
            <p className="mx-auto max-w-3xl text-sm font-semibold leading-relaxed text-hpsr-muted md:text-base">
              O Hospital São Rafael organiza as solicitações do paciente por especialidade, mantendo um fluxo simples: envio da ficha, análise da equipe e confirmação do atendimento quando aprovado.
            </p>
          </section>

          <section className="mx-auto mt-5 max-w-4xl rounded-[18px] border border-[#e9e2d7] bg-[#fcf6ee] p-3.5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[14px] bg-[#f6efe3] text-hpsr-wine">
                <Info size={22} />
              </div>

              <div>
                <h2 className="text-sm font-black uppercase tracking-[0.14em] text-hpsr-wine">
                  Informações importantes
                </h2>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-[#7a3a28]">
                  <li>• O envio da solicitação não confirma automaticamente a consulta.</li>
                  <li>• A consulta só será marcada após aceite do médico responsável pela especialidade.</li>
                  <li>• Use o passaporte informado para consultar o andamento do pedido.</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mx-auto mt-4 grid max-w-4xl gap-3 lg:grid-cols-2">
            <article className="rounded-[24px] border border-hpsr-border bg-white/65 p-3.5">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,#672614,#2a0700)] text-white">
                  <ClipboardCheck size={20} />
                </div>
                <h2 className="text-xl font-black text-hpsr-text">Etapas do Atendimento</h2>
              </div>

              <div className="space-y-5">
                {patientSteps.map((stage, index) => (
                  <div key={stage.title} className="flex gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-hpsr-text text-xs font-black text-white">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-relaxed text-hpsr-muted">
                      <strong className="text-hpsr-text">{stage.title}:</strong> {stage.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-[14px] border border-blue-200 bg-blue-50/70 p-3.5">
                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 shrink-0 text-blue-700" size={18} />
                  <p className="text-sm font-semibold leading-relaxed text-blue-900">
                    Para evitar atraso, confira se passaporte, telefone na cidade, Discord e motivo da consulta foram preenchidos corretamente.
                  </p>
                </div>
              </div>
            </article>

            <article className="rounded-[24px] border border-hpsr-border bg-white/65 p-3.5">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,#672614,#2a0700)] text-white">
                  <CalendarDays size={20} />
                </div>
                <h2 className="text-xl font-black text-hpsr-text">Ações do Paciente</h2>
              </div>

              <div className="grid gap-3">
                <ActionButton
                  href="/agendar"
                  icon={CalendarDays}
                  title="Agendar consulta"
                  text="Preencha a ficha e envie uma solicitação para a especialidade desejada."
                  cta="Solicitar agendamento"
                />

                <ActionButton
                  href="/consultar-agendamento"
                  icon={Search}
                  title="Consultar agendamento"
                  text="Acompanhe o status da solicitação usando o passaporte informado."
                  cta="Consultar por passaporte"
                />
              </div>
            </article>
          </section>


          <section className="mx-auto mt-4 max-w-4xl">
            <div className="grid gap-3 sm:grid-cols-3">
              {["Atendimento humanizado", "Organização por especialidade", "Acompanhamento por passaporte"].map((tag) => (
                <div key={tag} className="rounded-[20px] border border-hpsr-border bg-[#fcf6ee] px-4 py-3 text-center text-sm font-black text-hpsr-wine">
                  <CheckCircle2 className="mx-auto mb-2" size={18} />
                  {tag}
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </PublicShell>
  );
}

function ActionButton({ icon: Icon, title, text, cta, href }: any) {
  return (
    <Link
      href={href}
      className="group rounded-[22px] border border-hpsr-border bg-[#fcf6ee] p-3.5 transition hover:-translate-y-0.5 hover:bg-white"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[14px] bg-white text-hpsr-wine">
          <Icon size={20} />
        </div>
        <div>
          <h3 className="text-lg font-black text-hpsr-text">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-hpsr-muted">{text}</p>
          <span className="mt-4 inline-flex rounded-xl bg-hpsr-wine px-4 py-2.5 text-sm font-black text-white transition group-hover:bg-hpsr-wineDark">
            {cta}
          </span>
        </div>
      </div>
    </Link>
  );
}
