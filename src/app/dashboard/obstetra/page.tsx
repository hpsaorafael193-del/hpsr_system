"use client";

import { Baby, CalendarDays, CheckCircle2, Clock3, Gauge, HeartPulse, History, Loader2, Sparkles, Stethoscope } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { usePatientSelection } from "@/components/patients/PatientSelectionProvider";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { useCurrentUserProfile } from "@/components/auth/CurrentUserProfileProvider";
import { createClient } from "@/lib/supabase";

const inputClass = "h-11 w-full rounded-[14px] border border-hpsr-border bg-white px-3.5 text-sm font-semibold text-hpsr-text outline-none transition focus:border-hpsr-wine";
const TOTAL_GESTATION_WEEKS = 40;
const DEFAULT_REAL_DURATION_DAYS = 60;

type GestationalPlan = {
  id: string;
  patient_name: string;
  patient_passport: string;
  start_date: string;
  end_date: string | null;
  total_consultations: number | null;
  status: string;
  created_at: string;
};

const gestationalMilestones = [
  { week: 12, title: "Avaliação inicial" },
  { week: 20, title: "Avaliação anatômica" },
  { week: 28, title: "Acompanhamento materno-fetal" },
  { week: 32, title: "Bem-estar fetal" },
  { week: 36, title: "Planejamento do parto" },
  { week: 38, title: "Preparação para internação" },
  { week: 40, title: "Conclusão gestacional" },
];

function addDays(dateValue: string, days: number) {
  if (!dateValue) return "";
  const date = new Date(`${dateValue}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDate(dateValue: string) {
  if (!dateValue) return "—";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(new Date(`${dateValue}T12:00:00`));
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[10px] font-black uppercase tracking-[.15em] text-hpsr-wineLight">{label}</span>
      {children}
      {hint && <span className="text-[11px] leading-relaxed text-hpsr-muted">{hint}</span>}
    </label>
  );
}

export default function ObstetricianPage() {
  const { patients, selectedPassport, selectedPatient, selectPatient, loading } = usePatientSelection();
  const { profile: currentUserProfile } = useCurrentUserProfile();
  const [currentWeek, setCurrentWeek] = useState(1);
  const [referenceDate, setReferenceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [realDurationDays, setRealDurationDays] = useState(DEFAULT_REAL_DURATION_DAYS);
  const [plans, setPlans] = useState<GestationalPlan[]>([]);
  const [planning, setPlanning] = useState(false);
  const [planningMessage, setPlanningMessage] = useState("");
  const [planningError, setPlanningError] = useState("");

  const calculation = useMemo(() => {
    const safeWeek = Math.max(1, Math.min(TOTAL_GESTATION_WEEKS, Number(currentWeek) || 1));
    const safeDuration = Math.max(1, Math.min(180, Number(realDurationDays) || DEFAULT_REAL_DURATION_DAYS));
    const progressRatio = safeWeek / TOTAL_GESTATION_WEEKS;
    const elapsedRealDays = Math.round(safeDuration * progressRatio);
    const remainingRealDays = Math.max(0, safeDuration - elapsedRealDays);

    return {
      safeWeek,
      safeDuration,
      progress: Math.round(progressRatio * 100),
      elapsedRealDays,
      remainingRealDays,
      estimatedEndDate: addDays(referenceDate, remainingRealDays),
      realDaysPerWeek: safeDuration / TOTAL_GESTATION_WEEKS,
    };
  }, [currentWeek, realDurationDays, referenceDate]);

  const currentPhase = calculation.safeWeek <= 12
    ? "Início do pré-natal"
    : calculation.safeWeek <= 32
      ? "Acompanhamento materno-fetal"
      : "Preparação para o parto";

  async function loadHistory() {
    if (!currentUserProfile.id) return;
    const client = createClient();
    if (!client) return;
    let query = client
      .from("clinical_followup_plans")
      .select("id,patient_name,patient_passport,start_date,end_date,total_consultations,status,created_at")
      .eq("doctor_id", currentUserProfile.id)
      .eq("specialty", "Obstetra")
      .order("created_at", { ascending: false })
      .limit(12);
    if (selectedPassport) query = query.eq("patient_passport", selectedPassport);
    const { data } = await query;
    setPlans((data || []) as GestationalPlan[]);
  }

  useEffect(() => {
    void loadHistory();
  }, [currentUserProfile.id, selectedPassport]);

  async function createGestationalPlan() {
    setPlanning(true);
    setPlanningMessage("");
    setPlanningError("");
    try {
      if (!currentUserProfile.id) throw new Error("Profissional não identificado.");
      if (!selectedPatient) throw new Error("Selecione uma paciente antes de montar o planejamento.");
      const remainingMilestones = gestationalMilestones.filter((item) => item.week >= calculation.safeWeek);
      if (!remainingMilestones.length) throw new Error("Não há etapas futuras para a semana gestacional informada.");
      const occurrences = remainingMilestones.map((item) => ({
        ...item,
        date: addDays(referenceDate, Math.max(0, Math.round((item.week - calculation.safeWeek) * calculation.realDaysPerWeek))),
      }));
      const client = createClient();
      if (!client) throw new Error("Supabase não configurado.");
      const { data: plan, error: planError } = await client
        .from("clinical_followup_plans")
        .insert({
          doctor_id: currentUserProfile.id,
          doctor_name: currentUserProfile.systemName,
          patient_passport: selectedPatient.passport,
          patient_name: selectedPatient.name,
          specialty: "Obstetra",
          frequency: "Personalizada",
          interval_days: Math.max(1, Math.round(calculation.realDaysPerWeek * 4)),
          start_date: occurrences[0].date,
          end_date: occurrences.at(-1)?.date || occurrences[0].date,
          total_consultations: occurrences.length,
          total_weeks: Math.max(0, TOTAL_GESTATION_WEEKS - calculation.safeWeek),
          status: "Ativo",
        })
        .select("id")
        .single();
      if (planError) throw planError;
      const { error: occurrenceError } = await client.from("clinical_followup_occurrences").insert(
        occurrences.map((item) => ({
          plan_id: plan.id,
          doctor_id: currentUserProfile.id,
          patient_passport: selectedPatient.passport,
          patient_name: selectedPatient.name,
          specialty: "Obstetra",
          planned_date: item.date,
          status: "Planejada",
        }))
      );
      if (occurrenceError) {
        await client.from("clinical_followup_plans").delete().eq("id", plan.id);
        throw occurrenceError;
      }
      setPlanningMessage(`${occurrences.length} etapas adicionadas ao planejamento gestacional de ${selectedPatient.name}.`);
      await loadHistory();
    } catch (caught) {
      setPlanningError(caught instanceof Error ? caught.message : "Não foi possível montar o planejamento gestacional.");
    } finally {
      setPlanning(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Especialidade médica"
        title="Obstetra"
        description="Contador gestacional para acompanhar a evolução da gestação e estimar o período correspondente em dias reais."
        compact
      />

      <section className="rounded-[22px] border border-[#ead9da] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[16px] bg-hpsr-wine text-white shadow-sm">
              <HeartPulse size={22} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.16em] text-hpsr-wineLight">Ferramenta principal</p>
              <h2 className="mt-1 text-2xl font-black leading-tight text-hpsr-text">Contador gestacional</h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-hpsr-muted">
                Selecione a paciente, informe a semana gestacional e veja imediatamente a contagem, o tempo restante e a previsão final.
              </p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[420px]">
            <div className="rounded-[16px] bg-[#fff8f6] px-4 py-3 shadow-sm ring-1 ring-[#eddcdd]">
              <p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Semana atual</p>
              <p className="mt-1 text-lg font-black text-hpsr-text">{calculation.safeWeek}ª semana</p>
            </div>
            <div className="rounded-[16px] bg-[#fff8f6] px-4 py-3 shadow-sm ring-1 ring-[#eddcdd]">
              <p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Progresso</p>
              <p className="mt-1 text-lg font-black text-hpsr-text">{calculation.progress}%</p>
            </div>
            <div className="rounded-[16px] bg-[#fff8f6] px-4 py-3 shadow-sm ring-1 ring-[#eddcdd]">
              <p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Restante</p>
              <p className="mt-1 text-lg font-black text-hpsr-text">{calculation.remainingRealDays} dias</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        <section className="rounded-[24px] border-2 border-[#7d231d] bg-[linear-gradient(180deg,#fff8f6_0%,#fff1eb_100%)] p-5 shadow-[0_14px_34px_rgba(125,35,29,0.10)]">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-hpsr-wine text-white shadow-sm">
              <Baby size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.16em] text-hpsr-wineLight">Contador</p>
              <h3 className="text-lg font-black text-hpsr-text">Dados do acompanhamento</h3>
              <p className="text-sm text-hpsr-muted">A principal área interativa da aba. Preencha os campos para atualizar o contador.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Paciente" hint="Selecione a paciente que será acompanhada.">
              <StyledSelect value={selectedPassport} onChange={(event) => selectPatient(event.target.value)} searchable disabled={loading}>
                <option value="">{loading ? "Carregando pacientes..." : "Selecionar paciente"}</option>
                {patients.map((patient) => (
                  <option key={patient.passport} value={patient.passport}>{patient.name} · {patient.passport}</option>
                ))}
              </StyledSelect>
            </Field>

            <Field label="Semana gestacional" hint="Informe um valor entre 1 e 40 semanas.">
              <input className={inputClass} type="number" min={1} max={40} value={currentWeek} onChange={(event) => setCurrentWeek(Number(event.target.value))} />
            </Field>

            <Field label="Data de referência" hint="Data base usada para projetar o período restante.">
              <input className={inputClass} type="date" value={referenceDate} onChange={(event) => setReferenceDate(event.target.value)} />
            </Field>

            <Field label="Duração total" hint="Defina a duração total da gestação em dias reais.">
              <div className="relative">
                <input className={`${inputClass} pr-14`} type="number" min={1} max={180} value={realDurationDays} onChange={(event) => setRealDurationDays(Number(event.target.value))} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-hpsr-muted">dias</span>
              </div>
            </Field>
          </div>

          <div className="mt-5 rounded-[20px] border border-[#cf9f96] bg-white p-4 shadow-sm ring-1 ring-[#eed6d1]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Linha de progresso</p>
                <p className="mt-1 text-sm font-semibold text-hpsr-muted">Acompanhe visualmente a evolução da gestação.</p>
              </div>
              <div className="rounded-[14px] bg-hpsr-wine px-3 py-1.5 text-lg font-black text-white shadow-sm">{calculation.progress}%</div>
            </div>
            <div className="mt-4 h-5 overflow-hidden rounded-full border border-[#d9b5ad] bg-[#ecd7d1] p-1">
              <div className="h-full rounded-full bg-[linear-gradient(90deg,#7d231d,#b85f57,#d9a28f)] shadow-sm" style={{ width: `${calculation.progress}%` }} />
            </div>
          </div>

          <button
            type="button"
            disabled={planning || !selectedPatient}
            onClick={() => void createGestationalPlan()}
            className="mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[17px] bg-hpsr-wine px-5 text-sm font-black text-white shadow-[0_10px_24px_rgba(125,35,29,0.18)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {planning ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            {planning ? "Montando planejamento..." : "Montar planejamento gestacional"}
          </button>
          <p className="mt-2 text-center text-xs leading-relaxed text-hpsr-muted">As etapas serão distribuídas conforme a semana atual e o tempo restante indicado pelo contador.</p>
          {planningMessage && <p className="mt-3 rounded-[14px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800"><CheckCircle2 className="mr-2 inline" size={16} />{planningMessage}</p>}
          {planningError && <p className="mt-3 rounded-[14px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-800">{planningError}</p>}
        </section>

        <section className="rounded-[24px] border border-[#e7d6d7] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.16em] text-hpsr-wineLight">Leitura rápida</p>
              <h3 className="text-lg font-black text-hpsr-text">Resumo do acompanhamento</h3>
              <p className="text-sm text-hpsr-muted">Informações principais geradas pelo contador.</p>
            </div>
            <div className="rounded-[14px] bg-[#f7e8e4] p-2.5 text-hpsr-wine shadow-sm"><Stethoscope size={18} /></div>
          </div>

          <div className="mt-4 rounded-[18px] border border-[#eddcdd] bg-[linear-gradient(180deg,#fff8f6_0%,#ffffff_100%)] p-4">
            <p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Paciente selecionada</p>
            <p className="mt-1 text-base font-black text-hpsr-text">{selectedPatient ? selectedPatient.name : "Nenhuma paciente selecionada"}</p>
            <p className="mt-1 text-sm font-semibold text-hpsr-muted">{selectedPatient ? `Passaporte ${selectedPatient.passport}` : "Escolha uma paciente no contador para começar."}</p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[16px] border border-hpsr-border bg-[#fffaf8] p-4">
              <div className="flex items-center gap-2 text-hpsr-wine"><Gauge size={16} /><span className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Idade gestacional</span></div>
              <p className="mt-2 text-xl font-black text-hpsr-text">{calculation.safeWeek} semanas</p>
            </div>
            <div className="rounded-[16px] border border-hpsr-border bg-[#fffaf8] p-4">
              <div className="flex items-center gap-2 text-hpsr-wine"><CalendarDays size={16} /><span className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Conclusão estimada</span></div>
              <p className="mt-2 text-xl font-black text-hpsr-text">{formatDate(calculation.estimatedEndDate)}</p>
            </div>
            <div className="rounded-[16px] border border-hpsr-border bg-[#fffaf8] p-4">
              <div className="flex items-center gap-2 text-hpsr-wine"><Clock3 size={16} /><span className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Período decorrido</span></div>
              <p className="mt-2 text-xl font-black text-hpsr-text">{calculation.elapsedRealDays} dias</p>
            </div>
            <div className="rounded-[16px] border border-hpsr-border bg-[#fffaf8] p-4">
              <div className="flex items-center gap-2 text-hpsr-wine"><HeartPulse size={16} /><span className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Fase atual</span></div>
              <p className="mt-2 text-base font-black leading-snug text-hpsr-text">{currentPhase}</p>
            </div>
          </div>

          <div className="mt-4 rounded-[18px] border border-[#eddcdd] bg-[#fffdfb] p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div><p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Conversão por semana</p><p className="mt-1 text-lg font-black text-hpsr-text">{calculation.realDaysPerWeek.toFixed(1)} dias</p></div>
              <div><p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Duração configurada</p><p className="mt-1 text-lg font-black text-hpsr-text">{calculation.safeDuration} dias</p></div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-hpsr-muted">O contador usa 40 semanas como base e converte proporcionalmente a evolução para a duração total informada.</p>
          </div>
        </section>
      </div>

      <section className="rounded-[24px] border border-hpsr-border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#f7e8e4] text-hpsr-wine"><History size={20} /></div>
            <div>
              <h3 className="text-lg font-black text-hpsr-text">Histórico de planejamentos</h3>
              <p className="text-sm text-hpsr-muted">Planejamentos gestacionais criados por você{selectedPatient ? ` para ${selectedPatient.name}` : ""}.</p>
            </div>
          </div>
          <span className="rounded-full border border-hpsr-border bg-[#fffaf8] px-3 py-1.5 text-xs font-black text-hpsr-wine">{plans.length} registro{plans.length === 1 ? "" : "s"}</span>
        </div>

        <div className="mt-4 max-h-[280px] overflow-y-auto pr-1 [scrollbar-gutter:stable]">
          {plans.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-hpsr-border bg-[#fffdfb] px-4 py-8 text-center">
              <p className="font-black text-hpsr-text">Nenhum planejamento registrado</p>
              <p className="mt-1 text-sm text-hpsr-muted">Use o botão do contador para criar o primeiro planejamento gestacional.</p>
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {plans.map((plan) => (
                <article key={plan.id} className="rounded-[18px] border border-hpsr-border bg-[#fffaf8] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-black text-hpsr-text">{plan.patient_name}</p>
                      <p className="mt-0.5 text-xs font-semibold text-hpsr-muted">Passaporte {plan.patient_passport}</p>
                    </div>
                    <span className="rounded-full bg-[#f3dfda] px-2.5 py-1 text-[10px] font-black uppercase tracking-[.12em] text-hpsr-wine">{plan.status}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                    <div><p className="text-[9px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">Início</p><p className="mt-1 font-bold text-hpsr-text">{formatDate(plan.start_date)}</p></div>
                    <div><p className="text-[9px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">Conclusão</p><p className="mt-1 font-bold text-hpsr-text">{plan.end_date ? formatDate(plan.end_date) : "—"}</p></div>
                    <div><p className="text-[9px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">Etapas</p><p className="mt-1 font-bold text-hpsr-text">{plan.total_consultations || 0}</p></div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
