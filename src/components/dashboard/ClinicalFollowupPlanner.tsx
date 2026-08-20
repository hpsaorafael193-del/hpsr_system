"use client";

import { StyledSelect } from "@/components/ui/StyledSelect";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarRange,
  CheckCircle2,
  Clock3,
  Loader2,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { specialties } from "@/data/mock";
import { normalizeClinicalPassport } from "@/lib/clinical-scheduling";
import { hpsrConfirm } from "@/components/ui/HpsrDialogProvider";
import { usePatientSelection } from "@/components/patients/PatientSelectionProvider";

type Patient = { passport: string; name: string };
type Plan = {
  id: string;
  patient_name: string;
  patient_passport: string;
  specialty: string;
  frequency: string;
  start_date: string;
  end_date: string | null;
  total_consultations: number | null;
  status: string;
};

const field =
  "mt-1.5 min-h-[46px] w-full rounded-[14px] border border-hpsr-border bg-white px-3.5 text-sm font-bold text-hpsr-text outline-none transition focus:border-hpsr-wine focus:ring-2 focus:ring-hpsr-wineLight/20";
const label = "text-[11px] font-black uppercase tracking-[0.11em] text-hpsr-muted";
const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const displayDate = (value: string) => value.split("-").reverse().join("/");

export function ClinicalFollowupPlanner({
  doctorId,
  doctorName,
  defaultSpecialty,
  embedded = false,
}: {
  doctorId?: string;
  doctorName: string;
  defaultSpecialty?: string;
  embedded?: boolean;
}) {
  const today = useMemo(() => dateKey(new Date()), []);
  const { patients: sharedPatients } = usePatientSelection();
  const patients = useMemo<Patient[]>(() => sharedPatients.map((patient) => ({ passport: patient.passport, name: patient.name })), [sharedPatients]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [busy, setBusy] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [manualPatient, setManualPatient] = useState(false);
  const [manualPatientData, setManualPatientData] = useState({ name: "", passport: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    passport: "",
    specialty: defaultSpecialty || "Clínico Geral",
    startDate: today,
    frequency: "Semanal",
    customDays: "7",
    endMode: "consultations",
    consultations: "9",
    weeks: "8",
    endDate: today,
  });

  async function load() {
    const client = createClient();
    if (!client || !doctorId) return;
    const { data: planRows } = await client
      .from("clinical_followup_plans")
      .select("id,patient_name,patient_passport,specialty,frequency,start_date,end_date,total_consultations,status")
      .eq("doctor_id", doctorId)
      .neq("status", "Arquivado")
      .order("created_at", { ascending: false });
    setPlans((planRows || []) as Plan[]);
  }

  useEffect(() => {
    void load();
  }, [doctorId]);

  function interval() {
    return form.frequency === "Semanal"
      ? 7
      : form.frequency === "Quinzenal"
        ? 14
        : form.frequency === "Mensal"
          ? 30
          : Math.max(1, Number(form.customDays) || 1);
  }

  function dates() {
    const output: string[] = [];
    const start = new Date(`${form.startDate}T12:00:00`);
    const step = interval();
    const limit = Number(form.consultations) || 1;
    let end: Date | null = null;
    if (form.endMode === "weeks") end = new Date(start.getTime() + Math.max(1, Number(form.weeks)) * 7 * 86400000);
    if (form.endMode === "date") end = new Date(`${form.endDate}T12:00:00`);
    for (let index = 0; index < 500; index += 1) {
      const date = new Date(start.getTime() + index * step * 86400000);
      if (end && date > end) break;
      output.push(dateKey(date));
      if (!end && output.length >= limit) break;
    }
    return output;
  }

  async function quickLink(enabled: boolean) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (!doctorId) throw new Error("Médico não identificado.");
      const patient = patients.find((item) => normalizeClinicalPassport(item.passport) === normalizeClinicalPassport(form.passport));
      if (!patient) throw new Error("Selecione um paciente.");
      const client = createClient();
      if (!client) throw new Error("Supabase não configurado.");
      const { error: linkError } = await client.rpc("set_patient_schedule_link", {
        target_passport: normalizeClinicalPassport(patient.passport),
        target_doctor_id: doctorId,
        target_doctor_name: doctorName,
        target_specialty: form.specialty,
        target_enabled: enabled,
      });
      if (linkError) throw linkError;
      setMessage(enabled
        ? `${patient.name} foi vinculado a você em ${form.specialty}. Seus horários publicados nessa especialidade já podem aparecer no Portal do Paciente.`
        : `Vínculo de ${patient.name} em ${form.specialty} removido.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível atualizar o vínculo.");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (!doctorId) throw new Error("Médico não identificado.");
      const patient = manualPatient
        ? { name: manualPatientData.name.trim(), passport: normalizeClinicalPassport(manualPatientData.passport) }
        : patients.find((item) => normalizeClinicalPassport(item.passport) === normalizeClinicalPassport(form.passport));
      if (!patient?.name || !patient.passport) throw new Error("Selecione um paciente ou informe nome e documento manualmente.");
      const list = dates();
      if (!list.length) throw new Error("Nenhuma data foi gerada.");
      const client = createClient();
      if (!client) throw new Error("Supabase não configurado.");
      const { data, error: saveError } = await client.rpc("save_clinical_followup_plan", {
        p_plan_id: editingPlanId,
        p_doctor_name: doctorName,
        p_patient_passport: normalizeClinicalPassport(patient.passport),
        p_patient_name: patient.name,
        p_specialty: form.specialty,
        p_frequency: form.frequency,
        p_interval_days: interval(),
        p_start_date: list[0],
        p_end_date: list.at(-1),
        p_total_consultations: list.length,
        p_total_weeks: form.endMode === "weeks" ? Number(form.weeks) : null,
        p_planned_dates: list,
      });
      if (saveError) throw saveError;
      const { error: linkError } = await client.rpc("set_patient_schedule_link", {
        target_passport: normalizeClinicalPassport(patient.passport),
        target_doctor_id: doctorId,
        target_doctor_name: doctorName,
        target_specialty: form.specialty,
        target_enabled: true,
      });
      if (linkError) console.error("[HPSR][Acompanhamento] Planejamento salvo, mas o vínculo leve não pôde ser sincronizado:", linkError);
      const saved = data as { preserved_confirmed?: number } | null;
      setMessage(editingPlanId
        ? `Planejamento atualizado.${saved?.preserved_confirmed ? ` ${saved.preserved_confirmed} consulta(s) já confirmada(s) foram preservadas.` : ""}`
        : `${list.length} referências de acompanhamento criadas para ${patient.name}. Elas ajudam na organização, mas não prendem o atendimento a dias exatos.`);
      setEditingPlanId(null);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao criar planejamento.");
    } finally {
      setBusy(false);
    }
  }

  function startEditing(plan: Plan) {
    setEditingPlanId(plan.id);
    setForm((current) => ({
      ...current,
      passport: plan.patient_passport,
      specialty: plan.specialty,
      startDate: plan.start_date,
      frequency: plan.frequency,
      customDays: plan.frequency === "Personalizada" ? current.customDays : current.customDays,
      endMode: "consultations",
      consultations: String(plan.total_consultations || 1),
      endDate: plan.end_date || plan.start_date,
    }));
    const patientExists = patients.some((item) => normalizeClinicalPassport(item.passport) === normalizeClinicalPassport(plan.patient_passport));
    setManualPatient(!patientExists);
    setManualPatientData({ name: plan.patient_name, passport: plan.patient_passport });
    setMessage("Editando planejamento. As consultas já confirmadas serão preservadas.");
    setError("");
  }

  function cancelEditing() {
    setEditingPlanId(null);
    setMessage("");
  }

  async function remove(plan: Plan) {
    const confirmed = await hpsrConfirm(
      `Excluir o planejamento de ${plan.patient_name}? Referências futuras serão removidas, consultas ainda ativas desse planejamento serão canceladas para não bloquear novos pedidos e atendimentos finalizados permanecerão no histórico.`,
      "Excluir planejamento?"
    );
    if (!confirmed) return;
    const client = createClient();
    if (!client) return;
    setBusy(true);
    setError("");
    try {
      const { data, error: removeError } = await client.rpc("delete_clinical_followup_plan", { p_plan_id: plan.id });
      if (removeError) throw removeError;
      const result = data as { deleted?: boolean; preserved_appointments?: number; deleted_occurrences?: number; cancelled_appointments?: number; released_slots?: number } | null;
      if (!result?.deleted) throw new Error("O banco não confirmou a exclusão do planejamento.");
      setPlans((current) => current.filter((item) => item.id !== plan.id));
      if (editingPlanId === plan.id) setEditingPlanId(null);
      setMessage(`Planejamento removido. ${result.cancelled_appointments || 0} consulta(s) ativa(s) ligada(s) ao planejamento foram canceladas para não bloquear novos pedidos; ${result.preserved_appointments || 0} registro(s) histórico(s) foram preservados e ${result.released_slots || 0} vaga(s) futura(s) foram liberadas.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível remover o planejamento.");
    } finally {
      setBusy(false);
    }
  }

  const generatedDates = dates();
  const preview = generatedDates.slice(0, 8);
  const selectedPatient = patients.find((patient) => patient.passport === form.passport);
  const plannedPassports = new Set(plans.filter((plan) => plan.status !== "Encerrado").map((plan) => normalizeClinicalPassport(plan.patient_passport)));
  const patientsWithoutFollowup = patients.filter((patient) => !plannedPassports.has(normalizeClinicalPassport(patient.passport)));

  return (
    <section className={embedded ? "space-y-4" : "overflow-hidden rounded-[20px] border border-hpsr-border bg-white shadow-[0_12px_35px_rgba(93,45,24,0.05)]"}>
      {embedded ? (
        <div className="flex flex-col gap-3 rounded-[18px] border border-hpsr-border bg-[linear-gradient(180deg,#ffffff_0%,#fffaf4_100%)] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Configuração da sequência</p>
            <p className="mt-1 text-sm text-hpsr-muted">Defina paciente e frequência como referência de rotina. As datas ajudam na organização e podem ser ajustadas sem prender o atendimento a um dia exato.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-hpsr-border bg-white px-3 py-1.5 text-xs font-black text-hpsr-wine">
            <CalendarRange size={14} /> {plans.length} ativo{plans.length === 1 ? "" : "s"}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 border-b border-hpsr-border bg-[#fffaf4] px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-hpsr-wine text-white">
              <CalendarRange size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Planejamento clínico</p>
              <h2 className="mt-0.5 text-lg font-black tracking-tight text-hpsr-text">Planejar acompanhamento</h2>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-hpsr-border bg-white px-3 py-1.5 text-xs font-black text-hpsr-wine">
            <CalendarRange size={14} /> {plans.length} ativo{plans.length === 1 ? "" : "s"}
          </div>
        </div>
      )}

      <div className={embedded ? "rounded-[20px] border border-hpsr-border bg-white p-4 shadow-[0_10px_28px_rgba(93,45,24,0.05)] lg:p-5" : "p-4 lg:p-5"}>
        <div className="mb-4 rounded-[18px] border-2 border-blue-200 bg-[linear-gradient(135deg,#f3f8ff_0%,#edf5ff_100%)] p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-700">Vínculo rápido</p>
              <p className="mt-1 text-sm font-black text-blue-950">Paciente + especialidade. Só isso.</p>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-blue-900">Selecione abaixo o paciente e a especialidade e clique em Vincular. Não é necessário criar uma sequência de datas só para que o paciente veja seus horários.</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button type="button" disabled={busy || !doctorId || !form.passport} onClick={() => void quickLink(true)} className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[12px] bg-blue-700 px-4 text-xs font-black text-white disabled:opacity-50"><CheckCircle2 size={15}/>Vincular paciente</button>
              <button type="button" disabled={busy || !doctorId || !form.passport} onClick={() => void quickLink(false)} className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[12px] border border-blue-200 bg-white px-4 text-xs font-black text-blue-800 disabled:opacity-50"><X size={15}/>Desvincular</button>
            </div>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-12">
          <div className={`${label} lg:col-span-5`}>
            <div className="flex items-center justify-between gap-2">
              <span>Paciente</span>
              <button type="button" onClick={() => setManualPatient((current) => !current)} className="text-[10px] font-black normal-case tracking-normal text-hpsr-wine">
                {manualPatient ? "Usar Prontuário" : "Informar manualmente"}
              </button>
            </div>
            {manualPatient ? (
              <div className="mt-1.5 grid gap-2 sm:grid-cols-[1fr_150px]">
                <input className={field} value={manualPatientData.name} onChange={(event) => setManualPatientData((current) => ({ ...current, name: event.target.value }))} placeholder="Nome do paciente" />
                <input className={field} value={manualPatientData.passport} onChange={(event) => setManualPatientData((current) => ({ ...current, passport: event.target.value }))} placeholder="Documento" />
              </div>
            ) : (
              <StyledSelect value={form.passport} onChange={(event) => setForm({ ...form, passport: event.target.value })} className={field}>
                <option value="">Selecione um paciente</option>
                {patients.map((patient) => (
                  <option key={patient.passport} value={patient.passport}>{patient.name} · {patient.passport}</option>
                ))}
              </StyledSelect>
            )}
          </div>
          <label className={`${label} lg:col-span-4`}>
            Especialidade
            <StyledSelect value={form.specialty} onChange={(event) => setForm({ ...form, specialty: event.target.value })} className={field}>
              {specialties.map((specialty) => <option key={specialty}>{specialty}</option>)}
            </StyledSelect>
          </label>
          <label className={`${label} lg:col-span-3`}>
            Primeira referência
            <input type="date" min={today} value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} className={field} />
          </label>
        </div>

        <div className="mt-4 grid gap-3 rounded-[16px] border border-hpsr-border bg-[#fffaf4] p-3.5 md:grid-cols-2 xl:grid-cols-4">
          <label className={label}>
            Frequência
            <StyledSelect value={form.frequency} onChange={(event) => setForm({ ...form, frequency: event.target.value })} className={field}>
              <option>Semanal</option><option>Quinzenal</option><option>Mensal</option><option>Personalizada</option>
            </StyledSelect>
          </label>
          {form.frequency === "Personalizada" && (
            <label className={label}>Intervalo em dias<input type="number" min="1" value={form.customDays} onChange={(event) => setForm({ ...form, customDays: event.target.value })} className={field} /></label>
          )}
          <label className={label}>
            Encerrar por
            <StyledSelect value={form.endMode} onChange={(event) => setForm({ ...form, endMode: event.target.value })} className={field}>
              <option value="consultations">Quantidade de consultas</option>
              <option value="weeks">Quantidade de semanas</option>
              <option value="date">Data final</option>
            </StyledSelect>
          </label>
          {form.endMode === "consultations" && <label className={label}>Consultas<input type="number" min="1" value={form.consultations} onChange={(event) => setForm({ ...form, consultations: event.target.value })} className={field} /></label>}
          {form.endMode === "weeks" && <label className={label}>Semanas<input type="number" min="1" value={form.weeks} onChange={(event) => setForm({ ...form, weeks: event.target.value })} className={field} /></label>}
          {form.endMode === "date" && <label className={label}>Data final<input type="date" min={form.startDate} value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} className={field} /></label>}
        </div>

        <div className="mt-4 rounded-[16px] border border-hpsr-border bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">Prévia da sequência</p>
              <p className="mt-1 truncate text-sm font-black text-hpsr-text">{selectedPatient?.name || "Selecione um paciente"}</p>
              <p className="mt-0.5 text-xs font-semibold text-hpsr-muted">{generatedDates.length} referência{generatedDates.length === 1 ? "" : "s"} · intervalo de {interval()} dias · serve para organização, não como data obrigatória</p>
            </div>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              {preview.slice(0, 6).map((date, index) => (
                <span key={date} className="inline-flex items-center gap-1.5 rounded-full border border-hpsr-border bg-[#fffaf4] px-3 py-1.5 text-xs font-black text-hpsr-text">
                  <span className="text-hpsr-wineLight">{index + 1}</span>{displayDate(date)}
                </span>
              ))}
              {generatedDates.length > 6 && <span className="inline-flex items-center rounded-full border border-hpsr-border bg-white px-3 py-1.5 text-xs font-black text-hpsr-muted">+{generatedDates.length - 6}</span>}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-[42px]">
            {message && <p className="rounded-[12px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800"><CheckCircle2 className="mr-2 inline" size={16} />{message}</p>}
            {error && <p className="rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-800">{error}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            {editingPlanId && <button type="button" disabled={busy} onClick={cancelEditing} className="inline-flex min-h-[46px] items-center gap-2 rounded-[14px] border border-hpsr-border bg-white px-4 text-sm font-black text-hpsr-wine"><X size={16}/>Cancelar edição</button>}
            <button disabled={busy || !doctorId} onClick={() => void save()} className="inline-flex min-h-[46px] shrink-0 items-center justify-center gap-2 rounded-[14px] bg-hpsr-wine px-5 text-sm font-black text-white transition hover:brightness-105 disabled:opacity-50">
              {busy ? <Loader2 className="animate-spin" size={17} /> : editingPlanId ? <Pencil size={17}/> : <CheckCircle2 size={17} />}
              {editingPlanId ? "Salvar alterações" : "Salvar planejamento"}
            </button>
          </div>
        </div>
      </div>

      <div className={embedded ? "grid gap-3 lg:grid-cols-2" : "grid border-t border-hpsr-border bg-[#fffdf9] p-4 lg:grid-cols-2 lg:p-5"}>
        <details open className="overflow-hidden rounded-[18px] border border-hpsr-border bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5">
            <div><p className="text-[10px] font-black uppercase tracking-[0.15em] text-hpsr-wineLight">Acompanhamentos ativos</p><p className="mt-1 text-sm font-semibold text-hpsr-muted">{plans.length} planejamento{plans.length === 1 ? "" : "s"}</p></div>
            <span className="rounded-full bg-[#fff4ea] px-3 py-1 text-xs font-black text-hpsr-wine">Ver lista</span>
          </summary>
          <div className="max-h-[252px] space-y-2 overflow-y-auto border-t border-hpsr-border p-3" style={{ scrollbarGutter: "stable" }}>
            {plans.length ? plans.map((plan) => (
              <div key={plan.id} className="flex items-center gap-3 rounded-[14px] border border-hpsr-border bg-[#fffdf9] p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#fff4ea] text-hpsr-wine"><Clock3 size={17} /></div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-hpsr-text">{plan.patient_name}</p><p className="mt-0.5 truncate text-xs font-semibold text-hpsr-muted">{plan.specialty} · {plan.total_consultations || 0} referências planejadas</p><p className="mt-1 text-[11px] text-hpsr-muted">{displayDate(plan.start_date)}{plan.end_date ? ` até ${displayDate(plan.end_date)}` : ""}</p></div>
                <div className="flex shrink-0 gap-1.5">
                  <button type="button" aria-label="Editar planejamento" disabled={busy} onClick={() => startEditing(plan)} className="flex h-9 w-9 items-center justify-center rounded-[11px] border border-hpsr-border text-hpsr-wine transition hover:bg-[#fff4ea]"><Pencil size={15}/></button>
                  <button type="button" aria-label="Excluir planejamento" disabled={busy} onClick={() => void remove(plan)} className="flex h-9 w-9 items-center justify-center rounded-[11px] border border-rose-100 text-rose-700 transition hover:bg-rose-50"><Trash2 size={15} /></button>
                </div>
              </div>
            )) : <p className="rounded-[14px] border border-dashed border-hpsr-border p-4 text-center text-sm text-hpsr-muted">Nenhum acompanhamento cadastrado.</p>}
          </div>
        </details>

        <details className="overflow-hidden rounded-[18px] border border-hpsr-border bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5">
            <div><p className="text-[10px] font-black uppercase tracking-[0.15em] text-hpsr-wineLight">Pacientes sem acompanhamento</p><p className="mt-1 text-sm font-semibold text-hpsr-muted">{patientsWithoutFollowup.length} paciente{patientsWithoutFollowup.length === 1 ? "" : "s"}</p></div>
            <span className="rounded-full bg-[#fff4ea] px-3 py-1 text-xs font-black text-hpsr-wine">Expandir</span>
          </summary>
          <div className="max-h-[252px] space-y-2 overflow-y-auto border-t border-hpsr-border p-3" style={{ scrollbarGutter: "stable" }}>
            {patientsWithoutFollowup.length ? patientsWithoutFollowup.map((patient) => (
              <button key={patient.passport} type="button" onClick={() => setForm((current) => ({ ...current, passport: patient.passport }))} className="flex w-full items-center justify-between gap-3 rounded-[14px] border border-hpsr-border bg-[#fffdf9] px-3 py-2.5 text-left transition hover:border-hpsr-wineLight">
                <span className="min-w-0"><span className="block truncate text-sm font-black text-hpsr-text">{patient.name}</span><span className="mt-0.5 block text-xs font-semibold text-hpsr-muted">{patient.passport}</span></span>
                <span className="shrink-0 text-xs font-black text-hpsr-wine">Selecionar</span>
              </button>
            )) : <p className="rounded-[14px] border border-dashed border-hpsr-border p-4 text-center text-sm text-hpsr-muted">Todos os pacientes possuem acompanhamento ativo.</p>}
          </div>
        </details>
      </div>
    </section>
  );
}
