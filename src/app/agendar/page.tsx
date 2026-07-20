"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, CheckCircle2, Info } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { FormField, inputClass } from "@/components/ui/FormField";
import { specialties } from "@/data/mock";
import { createClient } from "@/lib/supabase";

const bloodTypes = ["A+", "A-", "B+", "B-"];
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
};

export default function SchedulePage() {
  const [submitted, setSubmitted] = useState<PublicAppointment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const protocolHint = useMemo(() => {
    const now = new Date();
    return `HPSR-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const now = new Date().toISOString();
    const passport = String(form.get("passport") ?? "").trim();

    const newAppointment: PublicAppointment = {
      id: `${protocolHint}-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      passport,
      patient: String(form.get("patient") ?? "").trim(),
      cityPhone: String(form.get("cityPhone") ?? "").trim(),
      bloodType: String(form.get("bloodType") ?? "").trim(),
      discord: String(form.get("discord") ?? "").trim(),
      specialty: String(form.get("specialty") ?? "").trim(),
      preferredDate: String(form.get("preferredDate") ?? "").trim(),
      preferredPeriod: String(form.get("preferredPeriod") ?? "").trim(),
      reason: String(form.get("reason") ?? "").trim(),
      notes: String(form.get("notes") ?? "").trim(),
      status: "Solicitação enviada",
      createdAt: now,
      updatedAt: now,
    };

    const client = createClient();
    if (!client) { setSubmitError("Não foi possível conectar ao Supabase. A solicitação não foi enviada."); return; }
    setSubmitting(true);
    setSubmitError("");
    const { error } = await client.from("appointments").insert({ id: newAppointment.id, passport: newAppointment.passport, patient: newAppointment.patient, status: newAppointment.status, payload: newAppointment, created_at: newAppointment.createdAt, updated_at: newAppointment.updatedAt });
    setSubmitting(false);
    if (error) { setSubmitError(`Não foi possível registrar a solicitação: ${error.message}`); return; }
    setSubmitted(newAppointment);
    event.currentTarget.reset();
  }

  return (
    <PublicShell>
      <section className="public-pattern min-h-screen px-4 py-10 lg:px-5">
        <div className="mx-auto max-w-5xl">
          <Link href="/paciente" className="inline-flex items-center gap-2 text-sm font-semibold text-hpsr-wine hover:underline">
            <ArrowLeft size={16} /> Voltar ao Portal do Paciente
          </Link>

          <div className="mt-8 hpsr-public-card p-3.5 lg:p-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,#672614,#2a0700)] text-white">
              <CalendarDays />
            </div>

            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-hpsr-wineLight">Paciente</p>
            <h1 className="mt-2 text-[clamp(1.45rem,4vw,2rem)] font-semibold text-hpsr-text lg:text-[clamp(1.7rem,5vw,2.55rem)]">Solicitar consulta</h1>
            <p className="mt-3 max-w-3xl leading-relaxed text-hpsr-muted">
              Preencha os dados abaixo. A solicitação será enviada para análise do médico responsável pela especialidade e só será confirmada após aceite.
            </p>

            {submitError && <p className="mt-4 rounded-[14px] border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{submitError}</p>}

          {submitted && (
              <div className="mt-6 rounded-[18px] border border-emerald-200 bg-emerald-50 p-3.5 text-emerald-800">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 shrink-0" size={22} />
                  <div>
                    <p className="font-black">Solicitação registrada para consulta pública.</p>
                    <p className="mt-1 text-sm leading-relaxed">
                      Consulte pelo passaporte <strong>{submitted.passport}</strong>. Status atual: <strong>{submitted.status}</strong>.
                    </p>
                    <Link href="/consultar-agendamento" className="mt-3 inline-flex rounded-[14px] bg-emerald-700 px-4 py-2 text-sm font-black text-white">
                      Consultar agora
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 rounded-[18px] border border-hpsr-border bg-[#fcf6ee] p-3.5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[14px] bg-[#f7f2ea] text-hpsr-wine">
                  <Info size={17} />
                </div>
                <p className="text-sm leading-relaxed text-hpsr-muted">
                  Use as informações corretas do paciente. O acompanhamento da solicitação será feito pelo <strong className="font-semibold text-hpsr-text">passaporte</strong>.
                </p>
              </div>
            </div>

            <form className="mt-8" onSubmit={handleSubmit}>
              <div className="grid gap-3 md:grid-cols-2">
                <FormField label="Passaporte">
                  <input name="passport" className={inputClass} placeholder="Ex: 12345" required />
                </FormField>

                <FormField label="Nome do paciente">
                  <input name="patient" className={inputClass} placeholder="Ex: João Silva" required />
                </FormField>

                <FormField label="Telefone na cidade">
                  <input name="cityPhone" className={inputClass} placeholder="Ex: (055) 123-456" required />
                </FormField>

                <FormField label="Tipo sanguíneo">
                  <select name="bloodType" className={inputClass} defaultValue="" required>
                    <option value="" disabled>Selecione</option>
                    {bloodTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </FormField>

                <div className="md:col-span-2">
                  <FormField label="Discord">
                    <input name="discord" className={inputClass} placeholder="Ex: 1717123456789" required />
                  </FormField>

                  <div className="mt-3 rounded-[14px] border border-blue-100 bg-blue-50/70 px-4 py-3 text-xs leading-relaxed text-blue-700">
                    <p className="font-semibold">Como pegar o ID correto:</p>
                    <p className="mt-1">
                      <strong className="font-semibold">PC:</strong> Clique na sua foto no canto inferior esquerdo para abrir o perfil e depois clique no botão <strong className="font-semibold">“Copiar ID do usuário”.</strong>
                    </p>
                    <p className="mt-1">
                      <strong className="font-semibold">Celular:</strong> Vá no seu Perfil &gt; Role até o fim &gt; Toque em <strong className="font-semibold">“Copiar ID”.</strong>
                    </p>
                    <p className="mt-2 font-semibold text-red-500">
                      ⚠ NÃO COLOQUE SEU APELIDO DO SERVIDOR! O ID É APENAS NÚMEROS.
                    </p>
                  </div>
                </div>

                <FormField label="Especialidade desejada">
                  <select name="specialty" className={inputClass} defaultValue="" required>
                    <option value="" disabled>Selecione a especialidade</option>
                    {specialties.map((specialty) => (
                      <option key={specialty}>{specialty}</option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Data preferencial">
                  <input name="preferredDate" className={inputClass} type="date" required />
                </FormField>

                <FormField label="Período preferencial">
                  <select name="preferredPeriod" className={inputClass} defaultValue="" required>
                    <option value="" disabled>Selecione o período</option>
                    <option>Manhã</option>
                    <option>Tarde</option>
                    <option>Noite</option>
                    <option>Indiferente</option>
                  </select>
                </FormField>

                <div className="md:col-span-2">
                  <FormField label="Motivo da consulta">
                    <textarea name="reason" className={inputClass} rows={5} placeholder="Descreva o motivo do atendimento" required />
                  </FormField>
                </div>

                <div className="md:col-span-2">
                  <FormField label="Observações">
                    <textarea name="notes" className={inputClass} rows={3} placeholder="Informações adicionais, se necessário" />
                  </FormField>
                </div>
              </div>

              <button type="submit" className="mt-6 rounded-[14px] hpsr-button-primary">
                {submitting ? "Enviando..." : "Enviar solicitação"}
              </button>

              <p className="mt-4 rounded-[14px] border border-hpsr-border bg-[#fcf6ee] p-3.5 text-sm leading-relaxed text-hpsr-muted">
                Após o envio, a solicitação ficará aguardando análise médica. A consulta só será confirmada se o médico responsável aceitar.
              </p>
            </form>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
