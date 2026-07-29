"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CalendarRange,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Stethoscope,
  Trash2,
  UserRound,
  UsersRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { hpsrConfirm } from "@/components/ui/HpsrDialogProvider";

const BRAZIL_TIMEZONE = "America/Sao_Paulo";

type Plan = {
  id: string;
  doctor_id: string;
  doctor_name: string;
  patient_name: string;
  patient_passport: string;
  specialty: string;
  frequency: string;
  start_date: string;
  end_date: string | null;
  total_consultations: number | null;
  status: string;
};

type Series = {
  id: string;
  doctor_id: string;
  doctor_name: string;
  specialty: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  status: string;
};

type Slot = {
  id: string;
  series_id: string | null;
  doctor_id: string;
  doctor_name: string;
  specialty: string;
  starts_at: string;
  ends_at: string;
  status: string;
  patient_name: string | null;
  patient_passport: string | null;
  appointment_id: string | null;
};

function displayDate(value: string | null | undefined) {
  if (!value) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value.split("-").reverse().join("/");
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: BRAZIL_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function displayTime(value: string | null | undefined) {
  if (!value) return "—";
  if (/^\d{2}:\d{2}/.test(value)) return value.slice(0, 5);
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: BRAZIL_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function DeveloperAppointmentManager({ doctorId, doctorName, canViewAll = false }: { doctorId: string; doctorName: string; canViewAll?: boolean }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [viewAllDoctors, setViewAllDoctors] = useState(false);
  const effectiveViewAll = canViewAll && viewAllDoctors;

  async function load() {
    const client = createClient();
    if (!client) return;
    setLoading(true);
    setError("");
    const now = new Date();
    now.setDate(now.getDate() - 1);
    const from = now.toISOString();
    let planQuery = client
      .from("clinical_followup_plans")
      .select("id,doctor_id,doctor_name,patient_name,patient_passport,specialty,frequency,start_date,end_date,total_consultations,status")
      .order("created_at", { ascending: false })
      .limit(300);
    let seriesQuery = client
      .from("clinical_availability_series")
      .select("id,doctor_id,doctor_name,specialty,start_date,end_date,start_time,end_time,slot_duration_minutes,status")
      .order("created_at", { ascending: false })
      .limit(300);
    let slotQuery = client
      .from("clinical_appointment_slots")
      .select("id,series_id,doctor_id,doctor_name,specialty,starts_at,ends_at,status,patient_name,patient_passport,appointment_id")
      .gte("starts_at", from)
      .order("starts_at", { ascending: true })
      .limit(500);

    if (!effectiveViewAll) {
      planQuery = planQuery.eq("doctor_id", doctorId);
      seriesQuery = seriesQuery.eq("doctor_id", doctorId);
      slotQuery = slotQuery.eq("doctor_id", doctorId);
    }

    const [planResult, seriesResult, slotResult] = await Promise.all([planQuery, seriesQuery, slotQuery]);
    const firstError = planResult.error || seriesResult.error || slotResult.error;
    if (firstError) setError(firstError.message);
    else {
      setPlans((planResult.data || []) as Plan[]);
      setSeries((seriesResult.data || []) as Series[]);
      setSlots((slotResult.data || []) as Slot[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [doctorId, effectiveViewAll]);

  async function releaseAppointmentLinks(slotIds: string[], appointmentIds: string[]) {
    const client = createClient();
    if (!client) throw new Error("Supabase não configurado.");
    if (appointmentIds.length) {
      const { error: appointmentError } = await client.from("appointments").delete().in("id", appointmentIds);
      if (appointmentError) throw appointmentError;
    }
    if (slotIds.length) {
      const now = new Date().toISOString();
      const { error: occurrenceError } = await client
        .from("clinical_followup_occurrences")
        .update({ status: "Aguardando abertura", slot_id: null, appointment_id: null, updated_at: now })
        .in("slot_id", slotIds);
      if (occurrenceError) throw occurrenceError;
    }
  }

  async function removePlan(plan: Plan) {
    const confirmed = await hpsrConfirm(
      `O planejamento de ${plan.patient_name}, criado por ${plan.doctor_name}, será removido. Consultas já vinculadas a esse planejamento também serão desfeitas.`,
      "Excluir planejamento clínico?",
    );
    if (!confirmed) return;
    const client = createClient();
    if (!client) return;
    setBusyId(`plan-${plan.id}`);
    setError("");
    setMessage("");
    try {
      const { data: occurrences, error: occurrenceReadError } = await client
        .from("clinical_followup_occurrences")
        .select("slot_id,appointment_id")
        .eq("plan_id", plan.id);
      if (occurrenceReadError) throw occurrenceReadError;
      const slotIds = [...new Set((occurrences || []).map((row: any) => row.slot_id).filter(Boolean))] as string[];
      const appointmentIds = [...new Set((occurrences || []).map((row: any) => row.appointment_id).filter(Boolean))] as string[];
      await releaseAppointmentLinks(slotIds, appointmentIds);
      if (slotIds.length) {
        const { error: releaseError } = await client
          .from("clinical_appointment_slots")
          .update({ status: "Disponível", patient_passport: null, patient_name: null, appointment_id: null, booked_at: null, updated_at: new Date().toISOString() })
          .in("id", slotIds);
        if (releaseError) throw releaseError;
      }
      const { error: occurrenceDeleteError } = await client
        .from("clinical_followup_occurrences")
        .delete()
        .eq("plan_id", plan.id);
      if (occurrenceDeleteError) throw occurrenceDeleteError;

      let removePlanQuery = client
        .from("clinical_followup_plans")
        .delete({ count: "exact" })
        .eq("id", plan.id);
      if (!effectiveViewAll) removePlanQuery = removePlanQuery.eq("doctor_id", doctorId);
      const { count: removedCount, error: removeError } = await removePlanQuery;
      if (removeError) throw removeError;
      if (!removedCount) {
        throw new Error(
          effectiveViewAll
            ? "O planejamento não foi excluído. Aplique a migração de permissões da versão 0.5.83 no Supabase e tente novamente."
            : "O planejamento não foi excluído porque não pertence ao médico logado ou já não existe."
        );
      }
      setPlans((current) => current.filter((item) => item.id !== plan.id));
      setMessage("Planejamento removido do gerenciamento de consultas.");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível excluir o planejamento.");
    } finally {
      setBusyId("");
    }
  }

  async function removeSlot(slot: Slot) {
    const occupied = slot.status === "Ocupado" || Boolean(slot.appointment_id);
    const confirmed = await hpsrConfirm(
      occupied
        ? `O horário de ${displayDate(slot.starts_at)} às ${displayTime(slot.starts_at)}, reservado para ${slot.patient_name || "um paciente"}, será cancelado e removido.`
        : `O horário de ${displayDate(slot.starts_at)} às ${displayTime(slot.starts_at)} será removido da disponibilidade de ${slot.doctor_name}.`,
      occupied ? "Excluir horário ocupado?" : "Excluir horário publicado?",
    );
    if (!confirmed) return;
    const client = createClient();
    if (!client) return;
    setBusyId(`slot-${slot.id}`);
    setError("");
    setMessage("");
    try {
      await releaseAppointmentLinks([slot.id], slot.appointment_id ? [slot.appointment_id] : []);
      let removeSlotQuery = client
        .from("clinical_appointment_slots")
        .delete({ count: "exact" })
        .eq("id", slot.id);
      if (!effectiveViewAll) removeSlotQuery = removeSlotQuery.eq("doctor_id", doctorId);
      const { count: removedCount, error: removeError } = await removeSlotQuery;
      if (removeError) throw removeError;
      if (!removedCount) {
        throw new Error(
          effectiveViewAll
            ? "O horário não foi excluído. Aplique a migração de permissões da versão 0.5.83 no Supabase e tente novamente."
            : "O horário não foi excluído porque não pertence ao médico logado ou já não existe."
        );
      }
      setSlots((current) => current.filter((item) => item.id !== slot.id));
      setMessage("Horário removido do gerenciamento de consultas.");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível excluir o horário.");
    } finally {
      setBusyId("");
    }
  }

  async function removeSeries(item: Series) {
    const confirmed = await hpsrConfirm(
      `Todos os horários da sequência de ${item.doctor_name}, entre ${displayDate(item.start_date)} e ${displayDate(item.end_date)}, serão removidos. Reservas existentes também serão canceladas.`,
      "Excluir sequência completa?",
    );
    if (!confirmed) return;
    const client = createClient();
    if (!client) return;
    setBusyId(`series-${item.id}`);
    setError("");
    setMessage("");
    try {
      const { data: rows, error: slotReadError } = await client
        .from("clinical_appointment_slots")
        .select("id,appointment_id")
        .eq("series_id", item.id);
      if (slotReadError) throw slotReadError;
      const slotIds = (rows || []).map((row: any) => row.id).filter(Boolean) as string[];
      const appointmentIds = [...new Set((rows || []).map((row: any) => row.appointment_id).filter(Boolean))] as string[];
      await releaseAppointmentLinks(slotIds, appointmentIds);
      if (slotIds.length) {
        const { error: slotDeleteError } = await client.from("clinical_appointment_slots").delete().in("id", slotIds);
        if (slotDeleteError) throw slotDeleteError;
      }
      let removeSeriesQuery = client.from("clinical_availability_series").delete().eq("id", item.id);
      if (!effectiveViewAll) removeSeriesQuery = removeSeriesQuery.eq("doctor_id", doctorId);
      const { error: seriesDeleteError } = await removeSeriesQuery;
      if (seriesDeleteError) throw seriesDeleteError;
      setMessage("Sequência completa removida do gerenciamento de consultas.");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível excluir a sequência.");
    } finally {
      setBusyId("");
    }
  }

  const normalizedFilter = filter.trim().toLocaleLowerCase("pt-BR");
  const matches = (...values: Array<string | null | undefined>) => !normalizedFilter || values.join(" ").toLocaleLowerCase("pt-BR").includes(normalizedFilter);
  const visiblePlans = useMemo(() => plans.filter((item) => matches(item.patient_name, item.patient_passport, item.doctor_name, item.specialty)), [plans, normalizedFilter]);
  const visibleSeries = useMemo(() => series.filter((item) => matches(item.doctor_name, item.specialty, item.start_date, item.end_date)), [series, normalizedFilter]);
  const visibleSlots = useMemo(() => slots.filter((item) => matches(item.patient_name, item.patient_passport, item.doctor_name, item.specialty, item.status)), [slots, normalizedFilter]);
  const occupiedCount = slots.filter((item) => item.status === "Ocupado" || item.appointment_id).length;

  return (
    <section className="overflow-hidden rounded-[22px] border-2 border-[#dec2b4] bg-white shadow-[0_16px_45px_rgba(96,45,25,0.08)]">
      <div className="border-b border-hpsr-border bg-[linear-gradient(135deg,#f7e8dc_0%,#fffaf4_55%,#ffffff_100%)] p-4 lg:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[16px] bg-hpsr-wine text-white shadow-sm"><ShieldCheck size={23} /></div>
            <div>
              <div className="flex flex-wrap items-center gap-2"><span className="text-[10px] font-black uppercase tracking-[.18em] text-hpsr-wineLight">Gerenciamento médico</span><span className="rounded-full border border-hpsr-border bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[.1em] text-hpsr-muted">{effectiveViewAll ? "Todos os médicos" : "Minha agenda"}</span></div>
              <h2 className="mt-1 text-xl font-black text-hpsr-text">Gerenciar consultas planejadas e horários</h2>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-hpsr-muted">{effectiveViewAll ? "Revise planejamentos, sequências e horários publicados por todos os profissionais." : `Revise somente os planejamentos, sequências e horários de ${doctorName}.`}</p>
            </div>
          </div>
          <button type="button" onClick={() => void load()} disabled={loading || Boolean(busyId)} className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-hpsr-border bg-white px-4 text-xs font-black text-hpsr-wine disabled:opacity-50"><RefreshCcw size={15} className={loading ? "animate-spin" : ""} />Atualizar dados</button>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <div className="rounded-[14px] border border-hpsr-border bg-white p-3"><p className="text-[9px] font-black uppercase tracking-[.13em] text-hpsr-wineLight">Planejamentos</p><p className="mt-1 text-xl font-black text-hpsr-text">{plans.length}</p></div>
          <div className="rounded-[14px] border border-hpsr-border bg-white p-3"><p className="text-[9px] font-black uppercase tracking-[.13em] text-hpsr-wineLight">Horários carregados</p><p className="mt-1 text-xl font-black text-hpsr-text">{slots.length}</p></div>
          <div className="rounded-[14px] border border-hpsr-border bg-white p-3"><p className="text-[9px] font-black uppercase tracking-[.13em] text-hpsr-wineLight">Reservados</p><p className="mt-1 text-xl font-black text-hpsr-text">{occupiedCount}</p></div>
        </div>
      </div>

      <div className="p-4 lg:p-5">
        {canViewAll && (
          <div className="mb-4 flex flex-col gap-3 rounded-[16px] border border-hpsr-border bg-[#fffaf4] p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-[12px] bg-white text-hpsr-wine"><UsersRound size={18} /></div>
              <div><p className="text-xs font-black text-hpsr-text">Escopo de visualização</p><p className="mt-0.5 text-xs text-hpsr-muted">Por padrão, somente seus próprios registros são exibidos.</p></div>
            </div>
            <button type="button" onClick={() => setViewAllDoctors((current) => !current)} className={`inline-flex min-h-10 items-center justify-center rounded-[12px] border px-4 text-xs font-black transition ${effectiveViewAll ? "border-hpsr-wine bg-hpsr-wine text-white" : "border-hpsr-border bg-white text-hpsr-wine"}`}>
              {effectiveViewAll ? "Exibindo todos os médicos" : "Acessar todos os médicos"}
            </button>
          </div>
        )}
        <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Buscar por paciente, passaporte, médico, especialidade ou status" className="h-11 w-full rounded-[14px] border border-hpsr-border bg-white px-4 text-sm font-semibold text-hpsr-text outline-none focus:border-hpsr-wine" />
        {message && <p className="mt-3 rounded-[12px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800"><CheckCircle2 className="mr-2 inline" size={16} />{message}</p>}
        {error && <p className="mt-3 rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-800">{error}</p>}

        {loading ? <div className="py-12 text-center text-hpsr-muted"><Loader2 className="mx-auto animate-spin" /><p className="mt-2 text-sm font-semibold">Carregando gerenciamento...</p></div> : (
          <div className="mt-4 grid gap-4">
            <div className="rounded-[18px] border border-hpsr-border bg-[#fffdf9] p-3.5">
              <div className="mb-3 flex items-center gap-2"><CalendarRange size={17} className="text-hpsr-wine" /><div><p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Planejamentos clínicos</p><p className="text-xs text-hpsr-muted">Consultas futuras organizadas por paciente.</p></div></div>
              <div className="grid max-h-[340px] gap-2 overflow-y-auto lg:grid-cols-2">
                {visiblePlans.length ? visiblePlans.map((plan) => <div key={plan.id} className="flex items-center gap-3 rounded-[14px] border border-hpsr-border bg-white p-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[#fff4ea] text-hpsr-wine"><UserRound size={17} /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-hpsr-text">{plan.patient_name} · {plan.patient_passport}</p><p className="mt-0.5 truncate text-xs font-semibold text-hpsr-muted">{plan.specialty} · {plan.doctor_name}</p><p className="mt-1 text-[11px] text-hpsr-muted">{displayDate(plan.start_date)} até {displayDate(plan.end_date)} · {plan.total_consultations || 0} consultas</p></div><button disabled={Boolean(busyId)} onClick={() => void removePlan(plan)} aria-label="Excluir planejamento" className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] border border-rose-100 text-rose-700 hover:bg-rose-50 disabled:opacity-50">{busyId === `plan-${plan.id}` ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}</button></div>) : <p className="col-span-full rounded-[14px] border border-dashed border-hpsr-border bg-white p-5 text-center text-sm text-hpsr-muted">Nenhum planejamento encontrado.</p>}
              </div>
            </div>

            <div className="rounded-[18px] border border-hpsr-border bg-[#fffdf9] p-3.5">
              <div className="mb-3 flex items-center gap-2"><CalendarClock size={17} className="text-hpsr-wine" /><div><p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Sequências publicadas</p><p className="text-xs text-hpsr-muted">Faixas semanais criadas pelos profissionais.</p></div></div>
              <div className="grid max-h-[300px] gap-2 overflow-y-auto lg:grid-cols-2">
                {visibleSeries.length ? visibleSeries.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-[14px] border border-hpsr-border bg-white p-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[#fff4ea] text-hpsr-wine"><Stethoscope size={17} /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-hpsr-text">{item.doctor_name} · {item.specialty}</p><p className="mt-0.5 text-xs font-semibold text-hpsr-muted">{displayDate(item.start_date)} até {displayDate(item.end_date)}</p><p className="mt-1 text-[11px] text-hpsr-muted">{displayTime(item.start_time)}–{displayTime(item.end_time)} · {item.slot_duration_minutes} min</p></div><button disabled={Boolean(busyId)} onClick={() => void removeSeries(item)} aria-label="Excluir sequência" className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] border border-rose-100 text-rose-700 hover:bg-rose-50 disabled:opacity-50">{busyId === `series-${item.id}` ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}</button></div>) : <p className="col-span-full rounded-[14px] border border-dashed border-hpsr-border bg-white p-5 text-center text-sm text-hpsr-muted">Nenhuma sequência encontrada.</p>}
              </div>
            </div>

            <div className="rounded-[18px] border border-hpsr-border bg-[#fffdf9] p-3.5">
              <div className="mb-3 flex items-center gap-2"><Clock3 size={17} className="text-hpsr-wine" /><div><p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Horários individuais</p><p className="text-xs text-hpsr-muted">Horários disponíveis e ocupados a partir de ontem.</p></div></div>
              <div className="grid max-h-[420px] gap-2 overflow-y-auto lg:grid-cols-2 xl:grid-cols-3">
                {visibleSlots.length ? visibleSlots.map((slot) => <div key={slot.id} className="rounded-[14px] border border-hpsr-border bg-white p-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-black text-hpsr-text">{displayDate(slot.starts_at)} · {displayTime(slot.starts_at)}</p><span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[.1em] ${slot.status === "Ocupado" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>{slot.status}</span></div><p className="mt-1 truncate text-xs font-semibold text-hpsr-muted">{slot.doctor_name} · {slot.specialty}</p>{slot.patient_name && <p className="mt-1 truncate text-xs font-black text-hpsr-wine">{slot.patient_name} · {slot.patient_passport}</p>}</div><button disabled={Boolean(busyId)} onClick={() => void removeSlot(slot)} aria-label="Excluir horário" className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] border border-rose-100 text-rose-700 hover:bg-rose-50 disabled:opacity-50">{busyId === `slot-${slot.id}` ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}</button></div></div>) : <p className="col-span-full rounded-[14px] border border-dashed border-hpsr-border bg-white p-5 text-center text-sm text-hpsr-muted">Nenhum horário encontrado.</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
