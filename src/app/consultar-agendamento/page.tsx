"use client";

import Link from "next/link";
import { FormEvent, useState, type ReactNode } from "react";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, Search, Stethoscope, UserRound, XCircle } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { FormField, inputClass } from "@/components/ui/FormField";
import { createClient } from "@/lib/supabase";

type PublicAppointment = {
  id: string;
  passport: string;
  patient: string;
  cityPhone: string;
  bloodType: string;
  discord: string;
  specialty: string;
  preferredDate: string;
  preferredPeriod: string;
  reason: string;
  notes: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  doctor?: string;
  answer?: string;
};

function formatDate(value: string) {
  if (!value || !value.includes("-")) return value || "A definir";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function statusClass(status: string) {
  switch (status) {
    case "Aceita":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "Recusada":
      return "border-rose-200 bg-rose-50 text-rose-800";
    case "Aguardando ajuste":
      return "border-amber-200 bg-amber-50 text-amber-800";
    default:
      return "border-blue-200 bg-blue-50 text-blue-800";
  }
}

function statusIcon(status: string) {
  if (status === "Aceita") return <CheckCircle2 size={18} />;
  if (status === "Recusada") return <XCircle size={18} />;
  return <Clock3 size={18} />;
}

export default function ConsultSchedulePage() {
  const [passport, setPassport] = useState("");
  const [searched, setSearched] = useState(false);
  const [result, setResult] = useState<PublicAppointment | null>(null);


  async function handleSearch(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const client = createClient();
    if (!client) {
      setResult(null);
      setSearched(true);
      return;
    }

    const { data } = await client.rpc("consult_appointment", { p_passport: passport.trim() });
    setResult(data ? (data as PublicAppointment) : null);
    setSearched(true);
  }

  return (
    <PublicShell>
      <section className="public-pattern min-h-screen px-4 py-10 lg:px-5">
        <div className="mx-auto max-w-4xl">
          <Link href="/paciente" className="inline-flex items-center gap-2 text-sm font-semibold text-hpsr-wine hover:underline">
            <ArrowLeft size={16} /> Voltar ao Portal do Paciente
          </Link>

          <div className="mt-8 overflow-hidden rounded-[36px] border border-white/70 bg-[#fffaf4]/95 p-3.5 lg:p-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,#672614,#2a0700)] text-white">
              <Search />
            </div>

            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-hpsr-wineLight">Passaporte</p>
            <h1 className="mt-2 text-[clamp(1.75rem,5vw,2.35rem)] font-black text-hpsr-text">Consultar agendamento</h1>
            <p className="mt-3 leading-relaxed text-hpsr-muted">
              Informe o passaporte usado na solicitação para acompanhar o andamento do pedido.
            </p>

            <form className="mt-8" onSubmit={handleSearch}>
              <div className="rounded-[28px] border border-hpsr-border bg-white p-3.5">
                <FormField label="Passaporte">
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <input
                      className={inputClass}
                      placeholder="Digite o passaporte da solicitação"
                      value={passport}
                      onChange={(event) => {
                        setPassport(event.target.value);
                        if (searched) {
                          setSearched(false);
                          setResult(null);
                        }
                      }}
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 rounded-[18px] bg-[linear-gradient(135deg,#672614,#2a0700)] px-4 py-3 text-sm font-black text-white transition"
                    >
                      <Search size={16} />
                      Consultar
                    </button>
                  </div>
                </FormField>
              </div>
            </form>

            {searched && result && (
              <section className="mt-6 overflow-hidden rounded-[32px] border border-hpsr-border bg-white">
                <div className="border-b border-hpsr-border bg-[linear-gradient(135deg,#fffaf4_0%,#f1dfcd_100%)] p-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-hpsr-wineLight">Resultado encontrado</p>
                      <h2 className="mt-1 text-lg font-black text-hpsr-text">{result.patient}</h2>
                      <p className="mt-1 text-sm text-hpsr-muted">Passaporte {result.passport} · {result.bloodType}</p>
                    </div>
                    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black ${statusClass(result.status)}`}>
                      {statusIcon(result.status)}
                      {result.status}
                    </span>
                  </div>
                </div>

                <div className="grid gap-3 p-3.5 sm:grid-cols-2">
                  <InfoBox icon={<Stethoscope size={16} />} label="Especialidade" value={result.specialty} />
                  <InfoBox icon={<CalendarDays size={16} />} label="Data preferencial" value={formatDate(result.preferredDate)} />
                  <InfoBox icon={<Clock3 size={16} />} label="Período" value={result.preferredPeriod} />
                  <InfoBox icon={<UserRound size={16} />} label="Médico responsável" value={result.doctor ?? "Aguardando definição"} />

                  <div className="rounded-[22px] border border-hpsr-border bg-[#fff8f0] p-3.5 sm:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-hpsr-wineLight">Motivo</p>
                    <p className="mt-2 text-sm leading-relaxed text-hpsr-muted">{result.reason}</p>
                  </div>

                  <div className="rounded-[22px] border border-hpsr-border bg-[#fff8f0] p-3.5 sm:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-hpsr-wineLight">Retorno do hospital</p>
                    <p className="mt-2 text-sm leading-relaxed text-hpsr-muted">
                      {result.answer ?? "Solicitação enviada. Aguarde análise da equipe médica."}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {searched && !result && (
              <div className="mt-6 rounded-[18px] border border-amber-200 bg-amber-50 p-3.5 text-amber-800">
                <p className="font-black">Nenhum agendamento encontrado.</p>
                <p className="mt-1 text-sm leading-relaxed">
                  Verifique o passaporte informado ou faça uma nova solicitação de consulta.
                </p>
                <Link href="/agendar" className="mt-3 inline-flex rounded-[14px] bg-amber-700 px-4 py-2 text-sm font-black text-white">
                  Solicitar consulta
                </Link>
              </div>
            )}

            {!searched && (
              <div className="mt-6 rounded-[22px] border border-hpsr-border bg-[#fff8f0] p-3.5">
                <p className="text-sm font-black text-hpsr-text">Digite o passaporte para iniciar a consulta.</p>
                <p className="mt-1 text-sm leading-relaxed text-hpsr-muted">
                  O resultado só aparece depois de clicar em Consultar.
                </p>
              </div>
            )}

            <div className="mt-6 rounded-[18px] border border-hpsr-border bg-[#fff8f0] p-3.5 text-sm leading-relaxed text-hpsr-muted">
              Status possíveis: solicitação enviada, em análise pelo médico, aceita, recusada ou aguardando ajuste.
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}

function InfoBox({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-hpsr-border bg-[#fff8f0] p-3.5">
      <div className="flex items-center gap-2 text-hpsr-wine">
        {icon}
        <p className="text-xs font-semibold uppercase tracking-[0.14em]">{label}</p>
      </div>
      <p className="mt-2 text-sm font-black text-hpsr-text">{value}</p>
    </div>
  );
}
