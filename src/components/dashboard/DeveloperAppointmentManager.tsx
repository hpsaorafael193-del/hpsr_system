"use client";

import { brazilIso } from "@/lib/brazil-datetime";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCcw,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { hpsrConfirm } from "@/components/ui/HpsrDialogProvider";
import { cn } from "@/lib/utils";

const BRAZIL_TIMEZONE = "America/Sao_Paulo";

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

type AppointmentSummary = {
  id: string;
  status: string;
  patient: string;
  passport: string;
};

type Panel = "upcoming" | "recent" | "publications";

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

function toBrazilDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BRAZIL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function DeveloperAppointmentManager({
  doctorId,
  doctorName,
  canViewAll = false,
  appointments = [],
}: {
  doctorId: string;
  doctorName: string;
  canViewAll?: boolean;
  appointments?: AppointmentSummary[];
}) {
  const [series, setSeries] = useState<Series[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [viewAllDoctors, setViewAllDoctors] = useState(false);
  const [panel, setPanel] = useState<Panel>("upcoming");
  const effectiveViewAll = canViewAll && viewAllDoctors;

  async function load() {
    const client = createClient();
    if (!client) return;
    setLoading(true);
    setError("");

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 14);
    const from = brazilIso(fromDate);

    let seriesQuery = client
      .from("clinical_availability_series")
      .select("id,doctor_id,doctor_name,specialty,start_date,end_date,start_time,end_time,slot_duration_minutes,status")
      .order("created_at", { ascending: false })
      .limit(250);

    let slotQuery = client
      .from("clinical_appointment_slots")
      .select("id,series_id,doctor_id,doctor_name,specialty,starts_at,ends_at,status,patient_name,patient_passport,appointment_id")
      .gte("starts_at", from)
      .order("starts_at", { ascending: true })
      .limit(700);

    if (!effectiveViewAll) {
      seriesQuery = seriesQuery.eq("doctor_id", doctorId);
      slotQuery = slotQuery.eq("doctor_id", doctorId);
    }

    const [seriesResult, slotResult] = await Promise.all([seriesQuery, slotQuery]);
    const firstError = seriesResult.error || slotResult.error;
    if (firstError) setError(firstError.message);
    else {
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
      let removeSlotQuery = client.from("clinical_appointment_slots").delete({ count: "exact" }).eq("id", slot.id);
      if (!effectiveViewAll) removeSlotQuery = removeSlotQuery.eq("doctor_id", doctorId);
      const { count, error: removeError } = await removeSlotQuery;
      if (removeError) throw removeError;
      if (!count) throw new Error("O horário não foi excluído ou já não existe.");
      setMessage("Horário removido da agenda.");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível excluir o horário.");
    } finally {
      setBusyId("");
    }
  }

  async function removeSeries(item: Series) {
    const confirmed = await hpsrConfirm(
      `Todos os horários da publicação de ${item.doctor_name}, entre ${displayDate(item.start_date)} e ${displayDate(item.end_date)}, serão removidos. Reservas futuras existentes também serão canceladas.`,
      "Excluir publicação de horários?",
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

      const slotIds = (rows || []).map((row) => row.id).filter(Boolean) as string[];
      const appointmentIds = [...new Set((rows || []).map((row) => row.appointment_id).filter(Boolean))] as string[];
      await releaseAppointmentLinks(slotIds, appointmentIds);
      if (slotIds.length) {
        const { error: slotDeleteError } = await client.from("clinical_appointment_slots").delete().in("id", slotIds);
        if (slotDeleteError) throw slotDeleteError;
      }

      let removeSeriesQuery = client.from("clinical_availability_series").delete().eq("id", item.id);
      if (!effectiveViewAll) removeSeriesQuery = removeSeriesQuery.eq("doctor_id", doctorId);
      const { error: seriesDeleteError } = await removeSeriesQuery;
      if (seriesDeleteError) throw seriesDeleteError;

      setMessage("Publicação removida da agenda.");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível excluir a publicação.");
    } finally {
      setBusyId("");
    }
  }

  const appointmentById = useMemo(() => new Map(appointments.map((item) => [item.id, item])), [appointments]);
  const now = Date.now();
  const todayKey = toBrazilDateKey();
  const normalizedFilter = filter.trim().toLocaleLowerCase("pt-BR");
  const matches = (...values: Array<string | null | undefined>) =>
    !normalizedFilter || values.join(" ").toLocaleLowerCase("pt-BR").includes(normalizedFilter);

  function slotState(slot: Slot) {
    const appointment = slot.appointment_id ? appointmentById.get(slot.appointment_id) : undefined;
    const status = appointment?.status || slot.status;
    if (["Realizada", "Concluída"].includes(status)) return "Realizado";
    if (status === "Não compareceu") return "Falta";
    if (["Cancelada", "Recusada"].includes(status)) return "Cancelado";
    if (slot.status === "Ocupado" || slot.appointment_id) return "Ocupado";
    return "Livre";
  }

  const visibleSlots = useMemo(() => {
    return slots.filter((slot) => {
      const appointment = slot.appointment_id ? appointmentById.get(slot.appointment_id) : undefined;
      const patientName = appointment?.patient || slot.patient_name;
      const passport = appointment?.passport || slot.patient_passport;
      if (!matches(patientName, passport, slot.doctor_name, slot.specialty, slot.status, slotState(slot))) return false;
      const startsAt = new Date(slot.starts_at).getTime();
      return panel === "recent" ? startsAt < now : startsAt >= now;
    });
  }, [slots, appointmentById, normalizedFilter, panel, now]);

  const visibleSeries = useMemo(
    () => series.filter((item) => matches(item.doctor_name, item.specialty, item.start_date, item.end_date, item.status)),
    [series, normalizedFilter],
  );

  const upcomingSlots = slots.filter((slot) => new Date(slot.starts_at).getTime() >= now);
  const occupiedUpcoming = upcomingSlots.filter((slot) => slotState(slot) === "Ocupado").length;
  const freeUpcoming = upcomingSlots.filter((slot) => slotState(slot) === "Livre").length;
  const recentCount = slots.filter((slot) => new Date(slot.starts_at).getTime() < now).length;

  return (
    <section className="overflow-hidden rounded-[22px] border border-hpsr-border bg-white shadow-[0_12px_34px_rgba(74,38,24,0.06)]">
      <div className="border-b border-hpsr-border bg-[linear-gradient(180deg,#fffdfb_0%,#fff9f5_100%)] px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-hpsr-wine">
              <CalendarClock size={17} />
              <p className="text-[10px] font-black uppercase tracking-[0.16em]">Histórico e disponibilidade</p>
            </div>
            <h2 className="mt-1 text-lg font-black text-hpsr-text">Horários da agenda</h2>
            <p className="mt-1 max-w-2xl text-xs font-semibold leading-relaxed text-hpsr-muted">
              Acompanhe vagas publicadas, pacientes que confirmaram e os registros recentes da agenda sem misturar outras rotinas clínicas.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {canViewAll && (
              <button
                type="button"
                onClick={() => setViewAllDoctors((current) => !current)}
                className={cn(
                  "rounded-[12px] border px-3 py-2 text-xs font-black transition",
                  effectiveViewAll
                    ? "border-hpsr-wine bg-hpsr-wine text-white shadow-sm"
                    : "border-hpsr-border bg-white text-hpsr-wine hover:border-hpsr-wineLight hover:bg-[#fff9f5]",
                )}
              >
                {effectiveViewAll ? "Todos os médicos" : "Minha agenda"}
              </button>
            )}
            <button
              type="button"
              onClick={() => void load()}
              aria-label={`Atualizar agenda de ${doctorName}`}
              disabled={loading || Boolean(busyId)}
              className="inline-flex items-center gap-2 rounded-[12px] border border-hpsr-border bg-white px-3 py-2 text-xs font-black text-hpsr-wine transition hover:border-hpsr-wineLight hover:bg-[#fff9f5] disabled:opacity-50"
            >
              <RefreshCcw size={14} className={loading ? "animate-spin" : ""} /> Atualizar
            </button>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4">
        <div className="grid gap-2 sm:grid-cols-3">
          <button type="button" onClick={() => setPanel("upcoming")} className={cn("flex items-center gap-3 rounded-[15px] border p-3 text-left transition", panel === "upcoming" ? "border-hpsr-wine/25 bg-[#fff6f1] shadow-sm" : "border-hpsr-border bg-white hover:bg-[#fffaf7]") }>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-[#f5e8e1] text-hpsr-wine"><Clock3 size={16} /></span>
            <span className="min-w-0"><span className="block text-xs font-black text-hpsr-text">Próximos horários</span><span className="mt-0.5 block text-[11px] font-semibold text-hpsr-muted">{freeUpcoming} livres · {occupiedUpcoming} ocupados</span></span>
          </button>
          <button type="button" onClick={() => setPanel("recent")} className={cn("flex items-center gap-3 rounded-[15px] border p-3 text-left transition", panel === "recent" ? "border-hpsr-wine/25 bg-[#fff6f1] shadow-sm" : "border-hpsr-border bg-white hover:bg-[#fffaf7]") }>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-[#f5e8e1] text-hpsr-wine"><CalendarDays size={16} /></span>
            <span className="min-w-0"><span className="block text-xs font-black text-hpsr-text">Registros recentes</span><span className="mt-0.5 block text-[11px] font-semibold text-hpsr-muted">Últimos 14 dias · {recentCount} registro{recentCount === 1 ? "" : "s"}</span></span>
          </button>
          <button type="button" onClick={() => setPanel("publications")} className={cn("flex items-center gap-3 rounded-[15px] border p-3 text-left transition", panel === "publications" ? "border-hpsr-wine/25 bg-[#fff6f1] shadow-sm" : "border-hpsr-border bg-white hover:bg-[#fffaf7]") }>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-[#f5e8e1] text-hpsr-wine"><CalendarClock size={16} /></span>
            <span className="min-w-0"><span className="block text-xs font-black text-hpsr-text">Publicações</span><span className="mt-0.5 block text-[11px] font-semibold text-hpsr-muted">{series.length} sequência{series.length === 1 ? "" : "s"} cadastrada{series.length === 1 ? "" : "s"}</span></span>
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-[13px] border border-hpsr-border bg-[#fffaf7] px-3">
          <Search size={15} className="shrink-0 text-hpsr-wineLight" />
          <input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Buscar paciente, passaporte, médico, especialidade ou status"
            className="h-11 min-w-0 flex-1 bg-transparent text-sm font-semibold text-hpsr-text outline-none placeholder:text-hpsr-muted/70"
          />
        </div>

        {message && <p className="mt-3 rounded-[12px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800"><CheckCircle2 className="mr-2 inline" size={16} />{message}</p>}
        {error && <p className="mt-3 rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-800">{error}</p>}

        {loading ? (
          <div className="py-10 text-center text-hpsr-muted"><Loader2 className="mx-auto animate-spin" /><p className="mt-2 text-sm font-semibold">Carregando agenda...</p></div>
        ) : panel === "publications" ? (
          <div className="mt-3 max-h-[360px] space-y-2 overflow-y-auto pr-1 [scrollbar-gutter:stable]">
            {visibleSeries.length ? visibleSeries.map((item) => {
              const isCurrent = item.end_date >= todayKey;
              return (
                <article key={item.id} className="flex flex-col gap-3 rounded-[15px] border border-hpsr-border bg-white p-3.5 sm:flex-row sm:items-center">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[#fff2ea] text-hpsr-wine"><CalendarClock size={17} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-black text-hpsr-text">{item.specialty}</p><span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-black", isCurrent ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-hpsr-border bg-[#f7f4f2] text-hpsr-muted")}>{isCurrent ? "Ativa" : "Encerrada"}</span></div>
                    <p className="mt-1 text-xs font-semibold text-hpsr-muted">{displayDate(item.start_date)}{item.end_date !== item.start_date ? ` até ${displayDate(item.end_date)}` : ""} · {item.start_time.slice(0, 5)}–{item.end_time.slice(0, 5)} · {item.slot_duration_minutes} min</p>
                    {effectiveViewAll && <p className="mt-1 truncate text-[11px] font-semibold text-hpsr-muted">{item.doctor_name}</p>}
                  </div>
                  {isCurrent && <button disabled={Boolean(busyId)} onClick={() => void removeSeries(item)} className="inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-[10px] border border-rose-100 bg-white px-3 text-xs font-black text-rose-700 transition hover:bg-rose-50 disabled:opacity-50">{busyId === `series-${item.id}` ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Remover</button>}
                </article>
              );
            }) : <p className="rounded-[14px] border border-dashed border-hpsr-border p-6 text-center text-sm text-hpsr-muted">Nenhuma publicação encontrada.</p>}
          </div>
        ) : (
          <div className="mt-3 max-h-[360px] space-y-2 overflow-y-auto pr-1 [scrollbar-gutter:stable]">
            {visibleSlots.length ? visibleSlots.map((slot) => {
              const state = slotState(slot);
              const appointment = slot.appointment_id ? appointmentById.get(slot.appointment_id) : undefined;
              const patientName = appointment?.patient || slot.patient_name;
              const passport = appointment?.passport || slot.patient_passport;
              const isFuture = new Date(slot.starts_at).getTime() >= now;
              return (
                <article key={slot.id} className="flex flex-col gap-3 rounded-[15px] border border-hpsr-border bg-white p-3.5 transition hover:border-hpsr-wineLight/50 sm:flex-row sm:items-center">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[#fff2ea] text-hpsr-wine">{patientName ? <UserRound size={17} /> : <Clock3 size={17} />}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-black text-hpsr-text">{displayDate(slot.starts_at)} · {displayTime(slot.starts_at)}</p>
                      <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-black", state === "Livre" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : state === "Ocupado" ? "border-blue-200 bg-blue-50 text-blue-700" : state === "Realizado" ? "border-violet-200 bg-violet-50 text-violet-700" : "border-amber-200 bg-amber-50 text-amber-700")}>{state}</span>
                    </div>
                    <p className="mt-1 truncate text-xs font-semibold text-hpsr-muted">{slot.specialty}{effectiveViewAll ? ` · ${slot.doctor_name}` : ""}</p>
                    <p className="mt-1 truncate text-xs font-bold text-hpsr-text">{patientName ? `${patientName}${passport ? ` · Passaporte ${passport}` : ""}` : "Nenhum paciente confirmou este horário"}</p>
                  </div>
                  {isFuture && <button disabled={Boolean(busyId)} onClick={() => void removeSlot(slot)} className="inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-[10px] border border-rose-100 bg-white px-3 text-xs font-black text-rose-700 transition hover:bg-rose-50 disabled:opacity-50">{busyId === `slot-${slot.id}` ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Remover</button>}
                </article>
              );
            }) : <p className="rounded-[14px] border border-dashed border-hpsr-border p-6 text-center text-sm text-hpsr-muted">{panel === "recent" ? "Nenhum registro recente encontrado." : "Nenhum horário futuro encontrado."}</p>}
          </div>
        )}
      </div>
    </section>
  );
}
