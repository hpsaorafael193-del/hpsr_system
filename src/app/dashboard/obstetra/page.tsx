"use client";



import { Baby, CalendarDays, CheckCircle2, Clock3, HeartPulse, History, Loader2, Sparkles, Stethoscope, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { usePatientSelection } from "@/components/patients/PatientSelectionProvider";
import { useCurrentUserProfile } from "@/components/auth/CurrentUserProfileProvider";
import { createClient } from "@/lib/supabase";
import { StyledSelect } from "@/components/ui/StyledSelect";

const inputClass = "h-11 w-full rounded-[14px] border border-hpsr-border bg-white px-3.5 text-sm font-semibold text-hpsr-text outline-none transition focus:border-hpsr-wine";

type GestationalPlan = {
  id: string;
  patient_name: string;
  patient_passport: string;
  start_date: string;
  end_date: string | null;
  planning_notes: string | null;
  consultation_schedule: ConsultationStep[] | null;
  portal_released_at: string | null;
  total_consultations: number | null;
  status: string;
  created_at: string;
};

type ConsultationStep = { number: number; title: string; description: string; week: number; date: string };

// Descrições baseadas nos modelos obstétricos já existentes no Assistente Clínico.
const consultationStages = [
  { title: "Avaliação inicial", description: "Confirmação da gestação, avaliação inicial, exames básicos e planejamento do acompanhamento." },
  { title: "Avaliação anatômica", description: "Ultrassonografia morfológica, avaliação uterina e ausculta fetal." },
  { title: "Acompanhamento materno-fetal", description: "Revisão dos resultados, movimentação fetal e avaliação do desenvolvimento." },
  { title: "Bem-estar fetal", description: "Avaliação do líquido amniótico, crescimento e ultrassonografia obstétrica." },
  { title: "Planejamento do parto", description: "Planejamento da via de parto e orientação sobre sinais de alerta." },
  { title: "Preparação para internação", description: "Revisão dos exames finais e organização da internação." },
  { title: "Parto", description: "Avaliação final, admissão e condução obstétrica conforme indicação clínica." },
] as const;

function dateAtNoon(dateValue: string) {
  return new Date(`${dateValue}T12:00:00`);
}

function addDays(dateValue: string, days: number) {
  const date = dateAtNoon(dateValue);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  return `${year}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function planConsultations(startDate: string, endDate: string): ConsultationStep[] {
  if (!startDate || !endDate || endDate < startDate) return [];
  const totalDays = Math.round((dateAtNoon(endDate).getTime() - dateAtNoon(startDate).getTime()) / 86400000);
  // O banco exige uma data distinta para cada etapa do mesmo planejamento.
  if (totalDays < consultationStages.length) return [];
  return consultationStages.map((stage, index) => {
    const offset = Math.round(totalDays * index / (consultationStages.length - 1));
    return { ...stage, number: index + 1, date: addDays(startDate, offset), week: Math.floor(offset / 7) + 1 };
  });
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
  const [manualStartDate, setManualStartDate] = useState("");
  const [manualEndDate, setManualEndDate] = useState("");
  const [planningNotes, setPlanningNotes] = useState("");
  const [releasingPlanId, setReleasingPlanId] = useState<string | null>(null);
  const [plans, setPlans] = useState<GestationalPlan[]>([]);
  const [planning, setPlanning] = useState(false);
  const [planningMessage, setPlanningMessage] = useState("");
  const [planningError, setPlanningError] = useState("");
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [manualPatient, setManualPatient] = useState(false);
  const [manualPatientData, setManualPatientData] = useState({ name: "", passport: "" });

  const consultationPreview = useMemo(() => planConsultations(manualStartDate, manualEndDate), [manualStartDate, manualEndDate]);

  async function loadHistory() {
    if (!currentUserProfile.id) return;
    const client = createClient();
    if (!client) return;
    const { data } = await client
      .from("clinical_followup_plans")
      .select("id,patient_name,patient_passport,start_date,end_date,planning_notes,consultation_schedule,portal_released_at,total_consultations,status,created_at")
      .eq("doctor_id", currentUserProfile.id)
      .eq("specialty", "Obstetra")
      .order("created_at", { ascending: false })
      .limit(50);
    setPlans((data || []) as GestationalPlan[]);
  }

  useEffect(() => {
    void loadHistory();
  }, [currentUserProfile.id]);

  async function releaseGestationalPlan() {
    const plan = plans.find((item) => item.id === selectedPlanId);
    if (!plan) return setPlanningError("Selecione um planejamento para liberar.");
    if (plan.portal_released_at || releasingPlanId) return;
    if (!window.confirm(`Liberar o planejamento gestacional de ${plan.patient_name} para visualização no Portal do Paciente?`)) return;
    const client = createClient();
    if (!client) return setPlanningError("Supabase não configurado.");
    setReleasingPlanId(plan.id);
    setPlanningError("");
    setPlanningMessage("");
    try {
      const { data, error } = await client.from("clinical_followup_plans")
        .update({ portal_released_at: new Date().toISOString() })
        .eq("id", plan.id).eq("doctor_id", currentUserProfile.id)
        .eq("specialty", "Obstetra").is("portal_released_at", null)
        .select("id").maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Planejamento não encontrado ou já liberado.");
      await loadHistory();
      setPlanningMessage(`Planejamento de ${plan.patient_name} liberado no Portal do Paciente.`);
    } catch (caught) {
      setPlanningError(caught instanceof Error ? caught.message : "Não foi possível liberar o planejamento.");
    } finally {
      setReleasingPlanId(null);
    }
  }

  async function deleteGestationalPlan() {
    const plan = plans.find((item) => item.id === selectedPlanId);
    if (!plan) {
      setPlanningError("Selecione um planejamento para excluir.");
      return;
    }
    if (deletingPlanId) return;
    const confirmed = window.confirm(`Excluir o planejamento gestacional de ${plan.patient_name}? Esta ação removerá também todas as etapas vinculadas.`);
    if (!confirmed) return;
    const client = createClient();
    if (!client) {
      setPlanningError("Supabase não configurado.");
      return;
    }
    setDeletingPlanId(plan.id);
    setPlanningError("");
    setPlanningMessage("");
    try {
      const { error: occurrenceError } = await client
        .from("clinical_followup_occurrences")
        .delete()
        .eq("plan_id", plan.id);
      if (occurrenceError) throw occurrenceError;
      const { error: planError } = await client
        .from("clinical_followup_plans")
        .delete()
        .eq("id", plan.id)
        .eq("doctor_id", currentUserProfile.id);
      if (planError) throw planError;
      setPlans((current) => current.filter((item) => item.id !== plan.id));
      setSelectedPlanId("");
      setPlanningMessage(`Planejamento gestacional de ${plan.patient_name} excluído.`);
    } catch (caught) {
      setPlanningError(caught instanceof Error ? caught.message : "Não foi possível excluir o planejamento gestacional.");
      await loadHistory();
    } finally {
      setDeletingPlanId(null);
    }
  }

  async function createGestationalPlan() {
    setPlanning(true);
    setPlanningMessage("");
    setPlanningError("");
    try {
      if (!currentUserProfile.id) throw new Error("Profissional não identificado.");
      const planningPatient = manualPatient ? { name: manualPatientData.name.trim(), passport: manualPatientData.passport.trim().toUpperCase() } : selectedPatient;
      if (!planningPatient?.name || !planningPatient.passport) throw new Error("Selecione uma paciente ou informe nome e documento manualmente.");
      const firstDate = manualStartDate;
      const lastDate = manualEndDate;
      if (!firstDate || !lastDate || lastDate < firstDate) throw new Error("Informe datas inicial e final válidas. A data final não pode anteceder a inicial.");
      const occurrences = planConsultations(firstDate, lastDate);
      if (!occurrences.length) throw new Error("O período informado deve ter ao menos 7 dias para distribuir as sete etapas em datas distintas.");
      const client = createClient();
      if (!client) throw new Error("Supabase não configurado.");
      const { data: plan, error: planError } = await client
        .from("clinical_followup_plans")
        .insert({
          doctor_id: currentUserProfile.id,
          doctor_name: currentUserProfile.systemName,
          patient_passport: planningPatient.passport,
          patient_name: planningPatient.name,
          specialty: "Obstetra",
          frequency: "Personalizada",
          interval_days: Math.max(1, Math.round((dateAtNoon(lastDate).getTime() - dateAtNoon(firstDate).getTime()) / 86400000 / 6)),
          start_date: firstDate,
          end_date: lastDate,
          planning_notes: planningNotes.trim() || null,
          consultation_schedule: occurrences,
          total_consultations: occurrences.length,
          total_weeks: Math.floor((dateAtNoon(lastDate).getTime() - dateAtNoon(firstDate).getTime()) / 86400000 / 7),
          status: "Ativo",
        })
        .select("id")
        .single();
      if (planError) throw planError;
      const { error: occurrenceError } = await client.from("clinical_followup_occurrences").insert(
        occurrences.map((item) => ({
          plan_id: plan.id,
          doctor_id: currentUserProfile.id,
          patient_passport: planningPatient.passport,
          patient_name: planningPatient.name,
          specialty: "Obstetra",
          planned_date: item.date,
          status: "Planejada",
        }))
      );
      if (occurrenceError) {
        await client.from("clinical_followup_plans").delete().eq("id", plan.id);
        throw occurrenceError;
      }
      setPlanningMessage(`${occurrences.length} etapas planejadas para ${planningPatient.name}, com parto previsto na data final informada.`);
      await loadHistory();
    } catch (caught) {
      setPlanningError(caught instanceof Error ? caught.message : "Não foi possível montar o planejamento gestacional.");
    } finally {
      setPlanning(false);
    }
  }

  return (
    <div className="hpsr-obstetra-page space-y-4">
      <PageHeader
        eyebrow="Especialidade médica"
        title="Obstetra"
        description="Planejamento das consultas obstétricas entre as datas inicial e final informadas pela médica."
      />

      <section className="rounded-[22px] border border-[#e1c9b8] bg-[linear-gradient(120deg,#f8ecdf_0%,#f4e3d7_100%)] p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[16px] bg-[linear-gradient(135deg,#672614,#2a0700)] text-white"><HeartPulse size={22} /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.16em] text-hpsr-wineLight">Ferramenta principal</p>
              <h2 className="mt-1 text-2xl font-black leading-tight text-hpsr-text">Contador gestacional</h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-hpsr-muted">Informe as datas inicial e final para montar o planejamento das consultas, encerrando com o parto.</p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[420px]">
            <div className="rounded-[16px] bg-[#f5e5d9] px-4 py-3 shadow-sm ring-1 ring-[#ddc1b1]"><p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Início</p><p className="mt-1 text-lg font-black text-hpsr-text">{formatDate(manualStartDate)}</p></div>
            <div className="rounded-[16px] bg-[#f5e5d9] px-4 py-3 shadow-sm ring-1 ring-[#ddc1b1]"><p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Consultas</p><p className="mt-1 text-lg font-black text-hpsr-text">{consultationPreview.length || "—"}</p></div>
            <div className="rounded-[16px] bg-[#f5e5d9] px-4 py-3 shadow-sm ring-1 ring-[#ddc1b1]"><p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Parto previsto</p><p className="mt-1 text-lg font-black text-hpsr-text">{formatDate(manualEndDate)}</p></div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        <section className="hpsr-gestational-form rounded-[24px] border border-[#ad7665] p-5 shadow-[0_14px_34px_rgba(125,35,29,0.08)]">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-[linear-gradient(135deg,#672614,#2a0700)] text-white"><Baby size={20} /></div>
            <div><p className="text-[10px] font-black uppercase tracking-[.16em] text-hpsr-wineLight">Contador</p><h3 className="text-lg font-black text-hpsr-text">Dados do acompanhamento</h3><p className="text-sm text-hpsr-muted">Preencha as datas do planejamento e as observações da médica.</p></div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Paciente" hint="Selecione no Prontuário ou informe os dados manualmente.">
              <div className="space-y-2">
                <button type="button" onClick={() => setManualPatient((current) => !current)} className="text-xs font-black text-hpsr-wine">{manualPatient ? "Usar paciente do Prontuário" : "Informar paciente manualmente"}</button>
                {manualPatient ? (
                  <div className="grid gap-2 sm:grid-cols-[1fr_150px]"><input className={inputClass} value={manualPatientData.name} onChange={(event) => setManualPatientData((current) => ({ ...current, name: event.target.value }))} placeholder="Nome da paciente" /><input className={inputClass} value={manualPatientData.passport} onChange={(event) => setManualPatientData((current) => ({ ...current, passport: event.target.value }))} placeholder="Documento" /></div>
                ) : (
                  <StyledSelect value={selectedPassport} onChange={(event) => selectPatient(event.target.value)} searchable disabled={loading}><option value="">{loading ? "Carregando pacientes..." : "Selecionar paciente"}</option>{patients.map((patient) => <option key={patient.passport} value={patient.passport}>{patient.name} · {patient.passport}</option>)}</StyledSelect>
                )}
              </div>
            </Field>
            <Field label="Data inicial" hint="Primeiro dia do planejamento."><input className={inputClass} type="date" value={manualStartDate} onChange={(event) => setManualStartDate(event.target.value)} /></Field>
            <Field label="Data final" hint="Data prevista para o parto."><input className={inputClass} type="date" value={manualEndDate} min={manualStartDate || undefined} onChange={(event) => setManualEndDate(event.target.value)} /></Field>
            <div className="md:col-span-2"><Field label="Observações da médica" hint="Exibidas à paciente somente após a liberação."><textarea className={`${inputClass} min-h-[110px] resize-y py-3`} maxLength={4000} value={planningNotes} onChange={(event) => setPlanningNotes(event.target.value)} placeholder="Orientações e observações do planejamento gestacional" /></Field></div>
          </div>
          <button type="button" disabled={planning || consultationPreview.length !== 7 || (manualPatient ? !manualPatientData.name.trim() || !manualPatientData.passport.trim() : !selectedPatient)} onClick={() => void createGestationalPlan()} className="mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[17px] bg-hpsr-wine px-5 text-sm font-black text-white shadow-[0_10px_24px_rgba(125,35,29,0.18)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50">
            {planning ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}{planning ? "Montando planejamento..." : "Montar planejamento gestacional"}
          </button>
          <p className="mt-2 text-center text-xs leading-relaxed text-hpsr-muted">O planejamento organiza sete etapas entre as datas informadas. Os horários são reservados separadamente no Agendamento.</p>
          {manualStartDate && manualEndDate && consultationPreview.length === 0 && <p className="mt-3 text-sm font-semibold text-red-700">Informe um período válido de pelo menos 7 dias para distribuir as sete etapas.</p>}
          {planningMessage && <p className="mt-3 rounded-[14px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800"><CheckCircle2 className="mr-2 inline" size={16} />{planningMessage}</p>}
          {planningError && <p className="mt-3 rounded-[14px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-800">{planningError}</p>}
        </section>

        <section className="hpsr-gestational-summary rounded-[24px] border p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-[10px] font-black uppercase tracking-[.16em] text-hpsr-wineLight">Leitura rápida</p><h3 className="text-lg font-black text-hpsr-text">Resumo do acompanhamento</h3><p className="text-sm text-hpsr-muted">Informações principais do planejamento.</p></div>
            <div className="rounded-[14px] bg-[linear-gradient(135deg,#672614,#2a0700)] p-2.5 text-white"><Stethoscope size={18} /></div>
          </div>
          <div className="mt-4 rounded-[18px] border border-[#eddcdd] bg-[linear-gradient(135deg,#f2dfd1_0%,#f9efe5_100%)] p-4">
            <p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Paciente selecionada</p>
            <p className="mt-1 text-base font-black text-hpsr-text">{manualPatient ? manualPatientData.name || "Nenhuma paciente informada" : selectedPatient?.name || "Nenhuma paciente selecionada"}</p>
            <p className="mt-1 text-sm font-semibold text-hpsr-muted">{manualPatient ? (manualPatientData.passport ? `Passaporte ${manualPatientData.passport}` : "Informe o documento da paciente.") : selectedPatient ? `Passaporte ${selectedPatient.passport}` : "Escolha uma paciente no contador para começar."}</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[16px] border border-[#e3cdbb] bg-[#faf1e7] p-4"><div className="flex items-center gap-2 text-hpsr-wine"><CalendarDays size={16} /><span className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Data inicial</span></div><p className="mt-2 text-xl font-black text-hpsr-text">{formatDate(manualStartDate)}</p></div>
            <div className="rounded-[16px] border border-[#e3cdbb] bg-[#faf1e7] p-4"><div className="flex items-center gap-2 text-hpsr-wine"><HeartPulse size={16} /><span className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Parto previsto</span></div><p className="mt-2 text-xl font-black text-hpsr-text">{formatDate(manualEndDate)}</p></div>
            <div className="rounded-[16px] border border-[#e3cdbb] bg-[#faf1e7] p-4"><div className="flex items-center gap-2 text-hpsr-wine"><Clock3 size={16} /><span className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Consultas previstas</span></div><p className="mt-2 text-xl font-black text-hpsr-text">{consultationPreview.length || "—"}</p></div>
            <div className="rounded-[16px] border border-[#e3cdbb] bg-[#faf1e7] p-4"><div className="flex items-center gap-2 text-hpsr-wine"><Baby size={16} /><span className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Etapa final</span></div><p className="mt-2 text-base font-black leading-snug text-hpsr-text">Parto</p></div>
          </div>
          <p className="mt-4 rounded-[18px] border border-[#dcc6b5] bg-[#f4e8da] p-4 text-sm leading-relaxed text-hpsr-muted">Ao montar o planejamento, as sete consultas e suas orientações ficam registradas no histórico e podem ser liberadas para a paciente.</p>
        </section>
      </div>

      <section className="hpsr-gestational-history rounded-[24px] border p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-[linear-gradient(135deg,#672614,#2a0700)] text-white"><History size={20} /></div>
            <div>
              <h3 className="text-lg font-black text-hpsr-text">Histórico de planejamentos</h3>
              <p className="text-sm text-hpsr-muted">Todos os planejamentos gestacionais criados pelo médico logado.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button type="button" onClick={() => void releaseGestationalPlan()}
              disabled={!selectedPlanId || Boolean(releasingPlanId) || Boolean(plans.find((item) => item.id === selectedPlanId)?.portal_released_at)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[14px] bg-hpsr-wine px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">
              {releasingPlanId ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {releasingPlanId ? "Liberando..." : plans.find((item) => item.id === selectedPlanId)?.portal_released_at ? "Liberado à paciente" : "Liberar para paciente"}
            </button>
            <span className="shrink-0 rounded-full border border-hpsr-border bg-[#fffaf8] px-3 py-1.5 text-center text-xs font-black text-hpsr-wine">{plans.length} registro{plans.length === 1 ? "" : "s"}</span>
            <button
              type="button"
              onClick={() => void deleteGestationalPlan()}
              disabled={!selectedPlanId || Boolean(deletingPlanId)}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-[14px] border border-red-200 bg-white px-4 text-sm font-black text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deletingPlanId ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              {deletingPlanId ? "Excluindo..." : selectedPlanId ? "Excluir selecionado" : "Selecione um planejamento"}
            </button>
          </div>
        </div>

        <p className="mt-3 text-xs font-semibold text-hpsr-muted">Clique em um planejamento para selecioná-lo. Depois, libere-o para a paciente ou use o botão de exclusão.</p>
        <div className="mt-3 max-h-[360px] overflow-y-auto pr-1 [scrollbar-gutter:stable]">
          {plans.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-hpsr-border bg-[#f5e8db] px-4 py-8 text-center">
              <p className="font-black text-hpsr-text">Nenhum planejamento registrado</p>
              <p className="mt-1 text-sm text-hpsr-muted">Use o botão do contador para criar o primeiro planejamento gestacional.</p>
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {plans.map((plan) => (
                <article
                  key={plan.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selectedPlanId === plan.id}
                  onClick={() => setSelectedPlanId((current) => current === plan.id ? "" : plan.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedPlanId((current) => current === plan.id ? "" : plan.id);
                    }
                  }}
                  className={`cursor-pointer rounded-[18px] border p-4 transition ${selectedPlanId === plan.id ? "border-hpsr-wine bg-[#fff1ec] ring-2 ring-hpsr-wine/15" : "border-hpsr-border bg-[#f6e9dd] hover:border-[#cfa9a3] hover:bg-[#f2dfd2]"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-black text-hpsr-text">{plan.patient_name}</p>
                      <p className="mt-0.5 text-xs font-semibold text-hpsr-muted">Passaporte {plan.patient_passport}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {selectedPlanId === plan.id && <span className="rounded-full bg-hpsr-wine px-2.5 py-1 text-[10px] font-black uppercase tracking-[.12em] text-white">Selecionado</span>}
                      {plan.portal_released_at && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black text-emerald-800">Liberado</span>}
                      <span className="rounded-full bg-[#f3dfda]  px-2.5 py-1 text-[10px] font-black uppercase tracking-[.12em] text-hpsr-wine">{plan.status}</span>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                    <div><p className="text-[9px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">Início</p><p className="mt-1 font-bold text-hpsr-text">{formatDate(plan.start_date)}</p></div>
                    <div><p className="text-[9px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">Conclusão</p><p className="mt-1 font-bold text-hpsr-text">{plan.end_date ? formatDate(plan.end_date) : "—"}</p></div>
                    <div><p className="text-[9px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">Etapas</p><p className="mt-1 font-bold text-hpsr-text">{plan.total_consultations || 0}</p></div>
                  </div>
                  {plan.consultation_schedule?.length ? <div className="mt-3 grid gap-1.5">{plan.consultation_schedule.map((item) => <p key={item.number} className="rounded-[10px] bg-[#fff9f1] p-2 text-xs text-hpsr-text"><strong>{item.number === 7 ? "Etapa 7 · Parto" : `Consulta ${item.number} · ${item.title}`} · {formatDate(item.date)}</strong><span className="block">{item.description}</span></p>)}</div> : null}
                  {plan.planning_notes && <p className="mt-3 whitespace-pre-wrap rounded-[12px] bg-[#fff9f1] p-3 text-xs text-hpsr-text">{plan.planning_notes}</p>}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
