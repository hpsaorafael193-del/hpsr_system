"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Loader2,
  Repeat2,
  Trash2,
  UserRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { specialties } from "@/data/mock";

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
}: {
  doctorId?: string;
  doctorName: string;
  defaultSpecialty?: string;
}) {
  const today = useMemo(() => dateKey(new Date()), []);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [busy, setBusy] = useState(false);
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
    const [{ data: patientRows }, { data: planRows }] = await Promise.all([
      client.from("patient_registry").select("passport,name").order("name"),
      client
        .from("clinical_followup_plans")
        .select("id,patient_name,patient_passport,specialty,frequency,start_date,end_date,total_consultations,status")
        .eq("doctor_id", doctorId)
        .order("created_at", { ascending: false }),
    ]);
    setPatients((patientRows || []) as Patient[]);
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

  async function save() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (!doctorId) throw new Error("Médico não identificado.");
      const patient = patients.find((item) => item.passport === form.passport);
      if (!patient) throw new Error("Selecione um paciente.");
      const list = dates();
      if (!list.length) throw new Error("Nenhuma data foi gerada.");
      const client = createClient();
      if (!client) throw new Error("Supabase não configurado.");
      const { data: plan, error: planError } = await client
        .from("clinical_followup_plans")
        .insert({
          doctor_id: doctorId,
          doctor_name: doctorName,
          patient_passport: patient.passport,
          patient_name: patient.name,
          specialty: form.specialty,
          frequency: form.frequency,
          interval_days: interval(),
          start_date: list[0],
          end_date: list.at(-1),
          total_consultations: list.length,
          total_weeks: form.endMode === "weeks" ? Number(form.weeks) : null,
          status: "Ativo",
        })
        .select("id")
        .single();
      if (planError) throw planError;
      const { error: occurrenceError } = await client.from("clinical_followup_occurrences").insert(
        list.map((plannedDate) => ({
          plan_id: plan.id,
          doctor_id: doctorId,
          patient_passport: patient.passport,
          patient_name: patient.name,
          specialty: form.specialty,
          planned_date: plannedDate,
          status: "Planejada",
        }))
      );
      if (occurrenceError) {
        await client.from("clinical_followup_plans").delete().eq("id", plan.id);
        throw occurrenceError;
      }
      setMessage(`${list.length} datas planejadas para ${patient.name}.`);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao criar planejamento.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    const client = createClient();
    if (!client) return;
    setBusy(true);
    setError("");
    const { error: removeError } = await client
      .from("clinical_followup_plans")
      .delete()
      .eq("id", id)
      .eq("doctor_id", doctorId);
    if (removeError) setError(removeError.message);
    else {
      setMessage("Planejamento removido.");
      await load();
    }
    setBusy(false);
  }

  const generatedDates = dates();
  const preview = generatedDates.slice(0, 8);
  const selectedPatient = patients.find((patient) => patient.passport === form.passport);

  return (
    <section className="overflow-hidden rounded-[20px] border border-hpsr-border bg-white shadow-[0_12px_35px_rgba(93,45,24,0.05)]">
      <div className="border-b border-hpsr-border bg-[linear-gradient(135deg,#fffaf4_0%,#ffffff_65%)] px-4 py-4 lg:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-hpsr-wine text-white shadow-sm">
              <CalendarRange size={22} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-hpsr-wineLight">Etapa 1</span>
                <span className="rounded-full border border-hpsr-border bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-hpsr-muted">Planejamento clínico</span>
              </div>
              <h2 className="mt-1 text-xl font-black tracking-tight text-hpsr-text">Planejar acompanhamento</h2>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-hpsr-muted">
                Defina a sequência de datas do paciente. A escolha do horário continuará disponível somente no dia anterior.
              </p>
            </div>
          </div>
          <div className="rounded-[14px] border border-hpsr-border bg-white px-3 py-2 text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-hpsr-muted">Planejamentos ativos</p>
            <p className="mt-0.5 text-xl font-black text-hpsr-wine">{plans.length}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:p-5">
        <div className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className={`${label} md:col-span-2`}>
              Paciente
              <select value={form.passport} onChange={(event) => setForm({ ...form, passport: event.target.value })} className={field}>
                <option value="">Selecione um paciente</option>
                {patients.map((patient) => (
                  <option key={patient.passport} value={patient.passport}>{patient.name} · {patient.passport}</option>
                ))}
              </select>
            </label>
            <label className={label}>
              Especialidade
              <select value={form.specialty} onChange={(event) => setForm({ ...form, specialty: event.target.value })} className={field}>
                {specialties.map((specialty) => <option key={specialty}>{specialty}</option>)}
              </select>
            </label>
            <label className={label}>
              Primeira data
              <input type="date" min={today} value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} className={field} />
            </label>
          </div>

          <div className="rounded-[16px] border border-hpsr-border bg-[#fffaf4] p-3.5">
            <div className="mb-3 flex items-center gap-2 text-hpsr-wine">
              <Repeat2 size={16} />
              <p className="text-[11px] font-black uppercase tracking-[0.12em]">Recorrência e encerramento</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <label className={label}>
                Frequência
                <select value={form.frequency} onChange={(event) => setForm({ ...form, frequency: event.target.value })} className={field}>
                  <option>Semanal</option><option>Quinzenal</option><option>Mensal</option><option>Personalizada</option>
                </select>
              </label>
              {form.frequency === "Personalizada" && (
                <label className={label}>Intervalo em dias<input type="number" min="1" value={form.customDays} onChange={(event) => setForm({ ...form, customDays: event.target.value })} className={field} /></label>
              )}
              <label className={label}>
                Encerrar por
                <select value={form.endMode} onChange={(event) => setForm({ ...form, endMode: event.target.value })} className={field}>
                  <option value="consultations">Quantidade de consultas</option>
                  <option value="weeks">Quantidade de semanas</option>
                  <option value="date">Data final</option>
                </select>
              </label>
              {form.endMode === "consultations" && <label className={label}>Consultas<input type="number" min="1" value={form.consultations} onChange={(event) => setForm({ ...form, consultations: event.target.value })} className={field} /></label>}
              {form.endMode === "weeks" && <label className={label}>Semanas<input type="number" min="1" value={form.weeks} onChange={(event) => setForm({ ...form, weeks: event.target.value })} className={field} /></label>}
              {form.endMode === "date" && <label className={label}>Data final<input type="date" min={form.startDate} value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} className={field} /></label>}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-h-[42px]">
              {message && <p className="rounded-[12px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800"><CheckCircle2 className="mr-2 inline" size={16} />{message}</p>}
              {error && <p className="rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-800">{error}</p>}
            </div>
            <button disabled={busy || !doctorId} onClick={() => void save()} className="inline-flex min-h-[46px] shrink-0 items-center justify-center gap-2 rounded-[14px] bg-hpsr-wine px-5 text-sm font-black text-white shadow-sm transition hover:brightness-105 disabled:opacity-50">
              {busy ? <Loader2 className="animate-spin" size={17} /> : <CheckCircle2 size={17} />}
              Salvar planejamento
            </button>
          </div>
        </div>

        <aside className="rounded-[18px] border border-hpsr-border bg-[#2f0d05] p-4 text-white">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/60">Prévia da sequência</p>
          <div className="mt-3 flex items-center gap-3 rounded-[14px] bg-white/10 p-3">
            <UserRound size={18} className="shrink-0 text-[#f1cdbd]" />
            <div className="min-w-0">
              <p className="truncate text-sm font-black">{selectedPatient?.name || "Paciente não selecionado"}</p>
              <p className="truncate text-xs text-white/60">{form.specialty}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-[13px] bg-white/10 p-3"><p className="text-[10px] uppercase tracking-wider text-white/55">Total</p><p className="mt-1 text-2xl font-black">{generatedDates.length}</p></div>
            <div className="rounded-[13px] bg-white/10 p-3"><p className="text-[10px] uppercase tracking-wider text-white/55">Intervalo</p><p className="mt-1 text-2xl font-black">{interval()}<span className="ml-1 text-xs">dias</span></p></div>
          </div>
          <div className="mt-3 space-y-1.5">
            {preview.map((date, index) => (
              <div key={date} className="flex items-center gap-2 rounded-[10px] bg-white/[0.07] px-3 py-2 text-xs font-bold">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-[10px]">{index + 1}</span>
                <span>{displayDate(date)}</span>
                {index < preview.length - 1 && <ChevronRight size={13} className="ml-auto text-white/35" />}
              </div>
            ))}
            {generatedDates.length > preview.length && <p className="pt-1 text-center text-xs font-bold text-white/60">+ {generatedDates.length - preview.length} datas na sequência</p>}
          </div>
        </aside>
      </div>

      {plans.length > 0 && (
        <div className="border-t border-hpsr-border bg-[#fffdf9] px-4 py-4 lg:px-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div><p className="text-[10px] font-black uppercase tracking-[0.15em] text-hpsr-wineLight">Acompanhamentos cadastrados</p><p className="mt-1 text-sm text-hpsr-muted">Sequências clínicas sob sua responsabilidade.</p></div>
          </div>
          <div className="grid gap-2 lg:grid-cols-2">
            {plans.map((plan) => (
              <div key={plan.id} className="group flex items-center gap-3 rounded-[15px] border border-hpsr-border bg-white p-3 transition hover:border-hpsr-wineLight/50">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[#fff4ea] text-hpsr-wine"><Clock3 size={18} /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-hpsr-text">{plan.patient_name}</p>
                  <p className="mt-0.5 truncate text-xs font-semibold text-hpsr-muted">{plan.specialty} · {plan.frequency} · {plan.total_consultations || 0} consultas</p>
                  <p className="mt-1 text-[11px] text-hpsr-muted">{displayDate(plan.start_date)}{plan.end_date ? ` até ${displayDate(plan.end_date)}` : ""}</p>
                </div>
                <button aria-label="Remover planejamento" disabled={busy} onClick={() => void remove(plan.id)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] border border-rose-100 text-rose-700 transition hover:bg-rose-50"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
