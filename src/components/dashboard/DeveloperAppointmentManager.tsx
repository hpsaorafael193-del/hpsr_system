"use client";

import { brazilIso } from "@/lib/brazil-datetime";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
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

type Occurrence = {
  id: string;
  plan_id: string;
  doctor_id: string;
  patient_name: string;
  patient_passport: string;
  specialty: string;
  planned_date: string;
  status: string;
  slot_id: string | null;
  appointment_id: string | null;
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

export function DeveloperAppointmentManager({ doctorId, doctorName, canViewAll = false, appointments = [] }: { doctorId: string; doctorName: string; canViewAll?: boolean; appointments?: Array<{ id: string; status: string; patient: string; passport: string }> }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [viewAllDoctors, setViewAllDoctors] = useState(false);
  const [expandedOccurrenceGroup, setExpandedOccurrenceGroup] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<"plans" | "occurrences" | "availability">("availability");
  const effectiveViewAll = canViewAll && viewAllDoctors;

  const occurrenceGroups = useMemo(() => {
    const normalizedFilter = filter.trim().toLocaleLowerCase("pt-BR");
    const groups = new Map<string, {
      key: string;
      patientName: string;
      passport: string;
      specialty: string;
      doctorId: string;
      items: Array<Occurrence & { linkedSlot?: Slot }>;
    }>();

    occurrences.forEach((occurrence) => {
      const linkedSlot = occurrence.slot_id ? slots.find((slot) => slot.id === occurrence.slot_id) : undefined;
      const key = `${occurrence.patient_passport}|${occurrence.plan_id}`;
      const searchable = [
        occurrence.patient_name, occurrence.patient_passport, occurrence.specialty, occurrence.status, linkedSlot?.doctor_name || "",
      ].join(" ").toLocaleLowerCase("pt-BR");
      if (normalizedFilter && !searchable.includes(normalizedFilter)) return;

      const current = groups.get(key) || {
        key,
        patientName: occurrence.patient_name,
        passport: occurrence.patient_passport,
        specialty: occurrence.specialty,
        doctorId: occurrence.doctor_id,
        items: [],
      };
      current.items.push({ ...occurrence, linkedSlot });
      groups.set(key, current);
    });

    return Array.from(groups.values()).map((group) => ({
      ...group,
      items: group.items.sort((a, b) => a.planned_date.localeCompare(b.planned_date)),
    }));
  }, [filter, occurrences, slots]);

  async function load() {
    const client = createClient();
    if (!client) return;
    setLoading(true);
    setError("");
    const now = new Date();
    now.setDate(now.getDate() - 1);
    const from = brazilIso(now);
    let planQuery = client
      .from("clinical_followup_plans")
      .select("id,doctor_id,doctor_name,patient_name,patient_passport,specialty,frequency,start_date,end_date,total_consultations,status")
      .order("created_at", { ascending: false })
      .limit(300);
    let occurrenceQuery = client
      .from("clinical_followup_occurrences")
      .select("id,plan_id,doctor_id,patient_name,patient_passport,specialty,planned_date,status,slot_id,appointment_id")
      .gte("planned_date", new Intl.DateTimeFormat("en-CA", { timeZone: BRAZIL_TIMEZONE }).format(new Date()))
      .order("planned_date", { ascending: true })
      .limit(500);
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
      occurrenceQuery = occurrenceQuery.eq("doctor_id", doctorId);
      seriesQuery = seriesQuery.eq("doctor_id", doctorId);
      slotQuery = slotQuery.eq("doctor_id", doctorId);
    }

    const [planResult, occurrenceResult, seriesResult, slotResult] = await Promise.all([planQuery, occurrenceQuery, seriesQuery, slotQuery]);
    const firstError = planResult.error || occurrenceResult.error || seriesResult.error || slotResult.error;
    if (firstError) setError(firstError.message);
    else {
      setPlans((planResult.data || []) as Plan[]);
      setOccurrences((occurrenceResult.data || []) as Occurrence[]);
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
      const now = brazilIso();
      const { error: occurrenceError } = await client
        .from("clinical_followup_occurrences")
        .update({ status: "Aguardando abertura", slot_id: null, appointment_id: null, updated_at: now })
        .in("slot_id", slotIds);
      if (occurrenceError) throw occurrenceError;
    }
  }

  async function removePlan(plan: Plan) {
    const confirmed = await hpsrConfirm(
      `O planejamento de ${plan.patient_name}, criado por ${plan.doctor_name}, será removido. Consultas reais já vinculadas permanecerão no histórico.`,
      "Excluir planejamento clínico?",
    );
    if (!confirmed) return;
    const client = createClient();
    if (!client) return;
    setBusyId(`plan-${plan.id}`);
    setError("");
    setMessage("");
    try {
      const { data, error: removeError } = await client.rpc("delete_clinical_followup_plan", { p_plan_id: plan.id });
      if (removeError) throw removeError;
      const result = data as { deleted?: boolean; preserved_appointments?: number } | null;
      if (!result?.deleted) throw new Error("O banco não confirmou a exclusão do planejamento.");
      setPlans((current) => current.filter((item) => item.id !== plan.id));
      setMessage(`Planejamento removido. ${result.preserved_appointments || 0} consulta(s) vinculada(s) foram preservadas.`);
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
  const appointmentById = useMemo(() => new Map(appointments.map((item) => [item.id, item])), [appointments]);
  const slotState = (slot: Slot) => {
    const appointment = slot.appointment_id ? appointmentById.get(slot.appointment_id) : undefined;
    const status = appointment?.status || slot.status;
    if (["Realizada", "Concluída"].includes(status)) return "Realizado";
    if (status === "Não compareceu") return "Falta";
    if (["Cancelada", "Recusada"].includes(status)) return "Cancelado";
    if (slot.status === "Ocupado" || slot.appointment_id) return "Ocupado";
    return "Livre";
  };
  const slotCounts = slots.reduce((counts, slot) => {
    const key = slotState(slot);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  return (
    <section className="rounded-[18px] border border-hpsr-border bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-hpsr-border p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Controle da agenda</p>
          <h2 className="mt-1 text-lg font-black text-hpsr-text">Visão geral dos horários</h2>
          <p className="mt-1 text-xs font-semibold text-hpsr-muted">Veja rapidamente o que está livre, ocupado e já encerrado.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canViewAll && (
            <button type="button" onClick={() => setViewAllDoctors((current) => !current)} className={`rounded-[11px] border px-3 py-2 text-xs font-black ${effectiveViewAll ? "border-hpsr-wine bg-hpsr-wine text-white" : "border-hpsr-border bg-white text-hpsr-wine"}`}>
              {effectiveViewAll ? "Todos os médicos" : "Minha agenda"}
            </button>
          )}
          <button type="button" onClick={() => void load()} disabled={loading || Boolean(busyId)} className="inline-flex items-center gap-2 rounded-[11px] border border-hpsr-border bg-white px-3 py-2 text-xs font-black text-hpsr-wine disabled:opacity-50">
            <RefreshCcw size={14} className={loading ? "animate-spin" : ""} /> Atualizar
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ["Livre", slotCounts.Livre || 0, "Disponíveis para agendamento"],
            ["Ocupado", slotCounts.Ocupado || 0, "Com paciente vinculado"],
            ["Realizado", slotCounts.Realizado || 0, "Atendimentos concluídos"],
            ["Falta/Cancelado", (slotCounts.Falta || 0) + (slotCounts.Cancelado || 0), "Horários encerrados"],
          ].map(([label, value, description]) => (
            <div key={String(label)} className="rounded-[13px] border border-hpsr-border bg-[#fffdf9] px-3 py-2.5">
              <p className="text-[10px] font-black uppercase tracking-[.1em] text-hpsr-wineLight">{label}</p>
              <p className="mt-1 text-xl font-black text-hpsr-text">{value}</p>
              <p className="mt-0.5 text-[10px] font-semibold text-hpsr-muted">{description}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 rounded-[14px] bg-[#fff8f3] p-1.5">
          {[
            ["availability", "Horários", slots.length],
            ["occurrences", "Consultas", occurrences.length],
            ["plans", "Planejamentos", plans.length],
          ].map(([key, label, count]) => (
            <button key={String(key)} type="button" onClick={() => setActivePanel(key as "plans" | "occurrences" | "availability")} className={`rounded-[11px] px-2 py-2.5 text-xs font-black transition ${activePanel === key ? "bg-white text-hpsr-wine shadow-sm" : "text-hpsr-muted hover:text-hpsr-wine"}`}>
              {label} <span className="ml-1 opacity-70">{count}</span>
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-[12px] border border-hpsr-border bg-white px-3">
          <RefreshCcw size={14} className="text-hpsr-wineLight" />
          <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Buscar paciente, médico, especialidade ou status" className="h-10 min-w-0 flex-1 bg-transparent text-sm font-semibold text-hpsr-text outline-none" />
        </div>
        {message && <p className="mt-3 rounded-[12px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800"><CheckCircle2 className="mr-2 inline" size={16} />{message}</p>}
        {error && <p className="mt-3 rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-800">{error}</p>}

        {loading ? (
          <div className="py-10 text-center text-hpsr-muted"><Loader2 className="mx-auto animate-spin" /><p className="mt-2 text-sm font-semibold">Carregando agenda...</p></div>
        ) : activePanel === "availability" ? (
          <div className="mt-3 max-h-[252px] space-y-2 overflow-y-auto pr-1 [scrollbar-gutter:stable]">
            {visibleSlots.length ? visibleSlots.map((slot) => {
              const state = slotState(slot);
              const appointment = slot.appointment_id ? appointmentById.get(slot.appointment_id) : undefined;
              const patientName = appointment?.patient || slot.patient_name;
              const passport = appointment?.passport || slot.patient_passport;
              return (
                <div key={slot.id} className="flex flex-col gap-3 rounded-[14px] border border-hpsr-border bg-[#fffdf9] p-3 sm:flex-row sm:items-center">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[#fff1e7] text-hpsr-wine"><Clock3 size={17} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-black text-hpsr-text">{displayDate(slot.starts_at)} · {displayTime(slot.starts_at)}</p>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${state === "Livre" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : state === "Ocupado" ? "border-blue-200 bg-blue-50 text-blue-700" : state === "Realizado" ? "border-violet-200 bg-violet-50 text-violet-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>{state}</span>
                    </div>
                    <p className="mt-1 truncate text-xs font-semibold text-hpsr-muted">{slot.doctor_name} · {slot.specialty}</p>
                    <p className="mt-1 truncate text-xs font-bold text-hpsr-text">{patientName ? `${patientName}${passport ? ` · Passaporte ${passport}` : ""}` : "Nenhum paciente vinculado"}</p>
                  </div>
                  <button disabled={Boolean(busyId)} onClick={() => void removeSlot(slot)} className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border border-rose-100 text-rose-700 hover:bg-rose-50 disabled:opacity-50" aria-label="Excluir horário">{busyId === `slot-${slot.id}` ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}</button>
                </div>
              );
            }) : <p className="rounded-[14px] border border-dashed border-hpsr-border p-6 text-center text-sm text-hpsr-muted">Nenhum horário encontrado.</p>}
          </div>
        ) : activePanel === "occurrences" ? (
          <div className="mt-3 max-h-[252px] space-y-2 overflow-y-auto pr-1 [scrollbar-gutter:stable]">
            {occurrenceGroups.length ? occurrenceGroups.map((group) => {
              const confirmedCount = group.items.filter((item) => item.linkedSlot).length;
              const nextItem = group.items[0];
              const isExpanded = expandedOccurrenceGroup === group.key;
              return (
                <div key={group.key} className="rounded-[14px] border border-hpsr-border bg-[#fffdf9]">
                  <button type="button" onClick={() => setExpandedOccurrenceGroup(isExpanded ? null : group.key)} className="flex w-full items-center gap-3 p-3 text-left">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-[#fff1e7] text-hpsr-wine"><UserRound size={16} /></div>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-hpsr-text">{group.patientName}</p><p className="truncate text-xs font-semibold text-hpsr-muted">{group.specialty} · Passaporte {group.passport}</p><p className="mt-1 text-[11px] text-hpsr-muted">Próxima: {displayDate(nextItem?.planned_date)}{nextItem?.linkedSlot ? ` às ${displayTime(nextItem.linkedSlot.starts_at)}` : " · horário a definir"}</p></div>
                    <div className="shrink-0 text-right"><p className="text-[10px] font-black text-hpsr-wine">{group.items.length} consulta{group.items.length === 1 ? "" : "s"}</p><p className="text-[10px] text-hpsr-muted">{confirmedCount} confirmada{confirmedCount === 1 ? "" : "s"}</p></div>
                    {isExpanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                  </button>
                  {isExpanded && <div className="border-t border-hpsr-border p-3"><div className="grid gap-2 sm:grid-cols-2">{group.items.map((item, index) => <div key={item.id} className="rounded-[11px] border border-hpsr-border bg-white px-3 py-2"><p className="text-[10px] font-black uppercase tracking-[.1em] text-hpsr-wineLight">Consulta {index + 1}</p><p className="mt-1 text-sm font-black text-hpsr-text">{displayDate(item.planned_date)}{item.linkedSlot ? ` · ${displayTime(item.linkedSlot.starts_at)}` : ""}</p><p className="mt-1 text-[11px] font-semibold text-hpsr-muted">{item.linkedSlot ? "Confirmada" : item.status}</p></div>)}</div></div>}
                </div>
              );
            }) : <p className="rounded-[14px] border border-dashed border-hpsr-border p-6 text-center text-sm text-hpsr-muted">Nenhuma consulta planejada futura.</p>}
          </div>
        ) : (
          <div className="mt-3 max-h-[252px] space-y-2 overflow-y-auto pr-1 [scrollbar-gutter:stable]">
            {visiblePlans.length ? visiblePlans.map((plan) => <div key={plan.id} className="flex items-center gap-3 rounded-[14px] border border-hpsr-border bg-[#fffdf9] p-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-[#fff1e7] text-hpsr-wine"><CalendarRange size={16} /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-hpsr-text">{plan.patient_name}</p><p className="truncate text-xs font-semibold text-hpsr-muted">{plan.specialty} · {plan.doctor_name}</p><p className="mt-1 text-[11px] text-hpsr-muted">{displayDate(plan.start_date)} até {displayDate(plan.end_date)} · {plan.total_consultations || 0} consultas</p></div><button disabled={Boolean(busyId)} onClick={() => void removePlan(plan)} aria-label="Excluir planejamento" className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] border border-rose-100 text-rose-700 hover:bg-rose-50 disabled:opacity-50">{busyId === `plan-${plan.id}` ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}</button></div>) : <p className="rounded-[14px] border border-dashed border-hpsr-border p-6 text-center text-sm text-hpsr-muted">Nenhum planejamento encontrado.</p>}
          </div>
        )}
      </div>
    </section>
  );
}
