"use client";

import { brazilIso } from "@/lib/brazil-datetime";

import { StyledSelect } from "@/components/ui/StyledSelect";
import { useEffect, useMemo, useState } from "react";
import { CalendarPlus2, CheckCircle2, Clock3, Gauge, Loader2, Repeat2, Stethoscope, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { specialties } from "@/data/mock";
import { hpsrConfirm } from "@/components/ui/HpsrDialogProvider";

const field = "mt-1.5 min-h-[46px] w-full rounded-[14px] border border-hpsr-border bg-white px-3.5 text-sm font-bold text-hpsr-text outline-none transition focus:border-hpsr-wine focus:ring-2 focus:ring-hpsr-wineLight/20";
const label = "text-[11px] font-black uppercase tracking-[0.11em] text-hpsr-muted";
const MAX_DAILY_SLOTS = 5;

type Props = { doctorId?: string; doctorName: string; defaultSpecialty?: string; embedded?: boolean };
type Series = { id: string; specialty: string; start_date: string; end_date: string; start_time: string; end_time: string; slot_duration_minutes: number; weekday: number; status: string };

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function displayDate(value: string) { return value.split("-").reverse().join("/"); }

export function DoctorAvailabilityManager({ doctorId, doctorName, defaultSpecialty, embedded = false }: Props) {
  const today = useMemo(() => dateKey(new Date()), []);
  const [series, setSeries] = useState<Series[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    startDate: today,
    endDate: today,
    startTime: "09:00",
    endTime: "12:00",
    duration: "60",
    specialty: defaultSpecialty || "Clínico Geral",
    dailyLimit: "5",
  });

  async function load() {
    if (!doctorId) return;
    const client = createClient();
    if (!client) return;
    const { data } = await client
      .from("clinical_availability_series")
      .select("id,specialty,start_date,end_date,start_time,end_time,slot_duration_minutes,weekday,status")
      .eq("doctor_id", doctorId)
      .order("created_at", { ascending: false })
      .limit(100);
    setSeries((data || []) as Series[]);
  }

  useEffect(() => { void load(); }, [doctorId]);

  async function createAvailability() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (!doctorId) throw new Error("Não foi possível identificar o médico logado.");
      if (!form.startDate || !form.endDate) throw new Error("Informe a data inicial e a data final.");
      if (form.endDate < form.startDate) throw new Error("A data final não pode ser anterior à data inicial.");

      const duration = Number(form.duration);
      const requestedDailyLimit = form.dailyLimit.trim() ? Number(form.dailyLimit) : MAX_DAILY_SLOTS;
      const dailyLimit = Math.min(MAX_DAILY_SLOTS, Math.max(1, requestedDailyLimit || MAX_DAILY_SLOTS));
      const [startHour, startMinute] = form.startTime.split(":").map(Number);
      const [endHour, endMinute] = form.endTime.split(":").map(Number);
      if (endHour * 60 + endMinute <= startHour * 60 + startMinute) throw new Error("O horário final deve ser posterior ao inicial.");

      const client = createClient();
      if (!client) throw new Error("Supabase não configurado.");
      const firstDate = new Date(`${form.startDate}T12:00:00`);
      const { data: created, error: seriesError } = await client
        .from("clinical_availability_series")
        .insert({
          doctor_id: doctorId,
          doctor_name: doctorName,
          specialty: form.specialty,
          start_date: form.startDate,
          end_date: form.endDate,
          start_time: form.startTime,
          end_time: form.endTime,
          slot_duration_minutes: duration,
          weekday: firstDate.getDay(),
          daily_limit: dailyLimit,
          status: "Ativa",
        })
        .select("id")
        .single();
      if (seriesError) throw seriesError;

      const slots: Array<Record<string, unknown>> = [];
      const cursor = new Date(`${form.startDate}T12:00:00`);
      const lastDate = new Date(`${form.endDate}T12:00:00`);
      while (cursor <= lastDate) {
        let minute = startHour * 60 + startMinute;
        const finalMinute = endHour * 60 + endMinute;
        let count = 0;
        while (minute + duration <= finalMinute && count < dailyLimit) {
          const start = new Date(cursor);
          start.setHours(Math.floor(minute / 60), minute % 60, 0, 0);
          const finish = new Date(start.getTime() + duration * 60000);
          slots.push({
            series_id: created.id,
            doctor_id: doctorId,
            doctor_name: doctorName,
            specialty: form.specialty,
            starts_at: brazilIso(start),
            ends_at: brazilIso(finish),
            status: "Disponível",
          });
          minute += duration;
          count += 1;
        }
        cursor.setDate(cursor.getDate() + 1);
      }

      const { data: publishedSlots, error: slotError } = await client
        .from("clinical_appointment_slots")
        .upsert(slots, { onConflict: "doctor_id,starts_at", ignoreDuplicates: true })
        .select("id,starts_at");
      if (slotError) {
        await client.from("clinical_availability_series").delete().eq("id", created.id);
        throw slotError;
      }

      const confirmedCount = publishedSlots?.length || 0;
      if (!confirmedCount) {
        await client.from("clinical_availability_series").delete().eq("id", created.id);
        throw new Error("Nenhum horário novo foi criado. As vagas desse médico nesse período já existem no sistema.");
      }
      setMessage(`${confirmedCount} horário${confirmedCount === 1 ? "" : "s"} publicado${confirmedCount === 1 ? "" : "s"}. Acompanhamentos compatíveis em ${form.specialty} passarão a sinalizar agenda disponível no Portal.`);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível publicar os horários.");
    } finally {
      setBusy(false);
    }
  }

  async function removeSeries(id: string) {
    const confirmed = await hpsrConfirm(
      "Excluir esta agenda publicada? Horários livres serão removidos. Consultas já reservadas ou realizadas serão preservadas no histórico.",
      "Excluir agenda publicada"
    );
    if (!confirmed) return;

    const client = createClient();
    if (!client) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const { data, error: rpcError } = await client.rpc("delete_clinical_availability_series", { p_series_id: id });
      if (rpcError) throw rpcError;
      const result = (data || {}) as { deleted?: boolean; deleted_free_slots?: number; preserved_occupied_slots?: number };
      if (!result.deleted) throw new Error("O banco não confirmou a exclusão da agenda publicada.");
      const preserved = Number(result.preserved_occupied_slots || 0);
      const removed = Number(result.deleted_free_slots || 0);
      setMessage(`Agenda removida. ${removed} horário${removed === 1 ? "" : "s"} livre${removed === 1 ? "" : "s"} removido${removed === 1 ? "" : "s"}${preserved ? ` e ${preserved} consulta${preserved === 1 ? "" : "s"} preservada${preserved === 1 ? "" : "s"}.` : "."}`);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível remover a agenda publicada.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={embedded ? "space-y-4" : "overflow-hidden rounded-[24px] border border-hpsr-border bg-white shadow-[0_18px_42px_rgba(82,48,27,.07)]"}>
      {!embedded && (
        <div className="border-b border-hpsr-border bg-[linear-gradient(135deg,#fffaf4,#fff)] px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3"><div className="grid h-11 w-11 place-items-center rounded-[15px] bg-hpsr-wine text-white"><CalendarPlus2 size={20} /></div><div><p className="text-[10px] font-black uppercase tracking-[0.15em] text-hpsr-wineLight">Agenda médica</p><h2 className="mt-1 text-xl font-black text-hpsr-text">Publicar horários</h2><p className="mt-1 text-sm font-semibold text-hpsr-muted">Publique a disponibilidade por especialidade. Nos acompanhamentos compatíveis, o Portal avisará o paciente de que a agenda está disponível, sem permitir que ele escolha o horário.</p></div></div>
            <div className="rounded-[14px] border border-hpsr-border bg-white px-3 py-2 text-right"><p className="text-[10px] font-black uppercase tracking-[0.12em] text-hpsr-muted">Sequências ativas</p><p className="mt-0.5 text-xl font-black text-hpsr-wine">{series.length}</p></div>
          </div>
        </div>
      )}

      <div className={embedded ? "grid gap-4 rounded-[20px] border border-hpsr-border bg-white p-4 shadow-[0_10px_28px_rgba(93,45,24,0.05)] lg:grid-cols-[minmax(0,1fr)_280px] lg:p-5" : "grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:p-5"}>
        <div className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-3">
            <label className={`${label} md:col-span-3`}>Especialidade<StyledSelect value={form.specialty} onChange={(event) => setForm({ ...form, specialty: event.target.value })} className={field}>{specialties.map((specialty) => <option key={specialty}>{specialty}</option>)}</StyledSelect></label>
            <label className={label}>Data inicial<input type="date" min={today} value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value, endDate: form.endDate < event.target.value ? event.target.value : form.endDate })} className={field} /></label>
            <label className={label}>Data final<input type="date" min={form.startDate || today} value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} className={field} /></label>
            <div className="rounded-[14px] border border-hpsr-border bg-[#fffaf4] px-3 py-3"><p className="text-[10px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">Acesso dos pacientes</p><p className="mt-1 text-xs font-semibold leading-relaxed text-hpsr-muted">A disponibilidade alimenta o acompanhamento compatível. O paciente recebe o aviso, enquanto a definição do horário continua sob responsabilidade médica.</p></div>
          </div>

          <div className="rounded-[16px] border border-hpsr-border bg-[#fffaf4] p-3.5">
            <div className="mb-3 flex items-center gap-2 text-hpsr-wine"><Clock3 size={16} /><p className="text-[11px] font-black uppercase tracking-[0.12em]">Jornada do atendimento</p></div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <label className={label}>Início<input type="time" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} className={field} /></label>
              <label className={label}>Término<input type="time" value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} className={field} /></label>
              <label className={label}>Duração<StyledSelect value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })} className={field}><option value="30">30 min</option><option value="45">45 min</option><option value="60">1 hora</option><option value="90">1h30</option><option value="120">2 horas</option></StyledSelect></label>
              <label className={`${label} sm:col-span-2 xl:col-span-2`}>Limite diário (máx. 5)<input type="number" min="1" max="5" value={form.dailyLimit} onChange={(event) => setForm({ ...form, dailyLimit: event.target.value })} className={field} /></label>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-h-[42px]">{message && <p className="rounded-[12px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800"><CheckCircle2 className="mr-2 inline" size={16} />{message}</p>}{error && <p className="rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-800">{error}</p>}</div>
            <button disabled={busy || !doctorId} onClick={() => void createAvailability()} className="inline-flex min-h-[46px] shrink-0 items-center justify-center gap-2 rounded-[14px] bg-hpsr-wine px-5 text-sm font-black text-white shadow-sm transition hover:brightness-105 disabled:opacity-50">{busy ? <Loader2 className="animate-spin" size={17} /> : <CalendarPlus2 size={17} />}Publicar horários</button>
          </div>
        </div>

        <aside className="rounded-[18px] border border-hpsr-border bg-[#fff8f0] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Resumo da publicação</p>
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-3 rounded-[13px] border border-hpsr-border bg-white p-3"><Stethoscope size={18} className="text-hpsr-wine" /><div className="min-w-0"><p className="text-[10px] uppercase tracking-wider text-hpsr-muted">Médico</p><p className="truncate text-sm font-black text-hpsr-text">{doctorName}</p></div></div>
            <div className="flex items-center gap-3 rounded-[13px] border border-hpsr-border bg-white p-3"><Stethoscope size={18} className="text-hpsr-wine" /><div className="min-w-0"><p className="text-[10px] uppercase tracking-wider text-hpsr-muted">Especialidade</p><p className="truncate text-sm font-black text-hpsr-text">{form.specialty}</p></div></div>
            <div className="flex items-center gap-3 rounded-[13px] border border-hpsr-border bg-white p-3"><Clock3 size={18} className="text-hpsr-wine" /><div><p className="text-[10px] uppercase tracking-wider text-hpsr-muted">Faixa diária</p><p className="text-sm font-black text-hpsr-text">{form.startTime} — {form.endTime}</p></div></div>
            <div className="grid grid-cols-2 gap-2"><div className="rounded-[13px] border border-hpsr-border bg-white p-3"><Gauge size={16} className="text-hpsr-wine" /><p className="mt-2 text-[10px] uppercase tracking-wider text-hpsr-muted">Vagas/dia</p><p className="mt-0.5 text-xl font-black text-hpsr-text">{Math.min(MAX_DAILY_SLOTS, Math.max(1, Number(form.dailyLimit) || MAX_DAILY_SLOTS))}</p></div><div className="rounded-[13px] border border-hpsr-border bg-white p-3"><Repeat2 size={16} className="text-hpsr-wine" /><p className="mt-2 text-[10px] uppercase tracking-wider text-hpsr-muted">Duração</p><p className="mt-0.5 text-xl font-black text-hpsr-text">{form.duration}<span className="ml-1 text-xs">min</span></p></div></div>
          </div>
          <p className="mt-3 rounded-[12px] border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold leading-relaxed text-amber-900">A publicação não cria consulta nem acompanhamento automaticamente. Ela apenas disponibiliza a agenda; vínculos clínicos existentes recebem a atualização e o horário continua sendo definido pela equipe médica.</p>
        </aside>
      </div>

      <details open className={embedded ? "overflow-hidden rounded-[20px] border border-hpsr-border bg-[#fffdf9] shadow-[0_10px_28px_rgba(93,45,24,0.04)]" : "overflow-hidden border-t border-hpsr-border bg-[#fffdf9]"}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 lg:px-5">
          <div><p className="text-[10px] font-black uppercase tracking-[0.15em] text-hpsr-wineLight">Horários publicados</p><p className="mt-1 text-sm text-hpsr-muted">{series.length} sequência{series.length === 1 ? "" : "s"} ativa{series.length === 1 ? "" : "s"}</p></div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-hpsr-wine">Ver lista</span>
        </summary>
        <div className="grid max-h-[252px] gap-2 overflow-y-auto border-t border-hpsr-border p-3" style={{ scrollbarGutter: "stable" }}>
          {series.length ? series.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-[15px] border border-hpsr-border bg-white p-3 transition hover:border-hpsr-wineLight/50"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[#fff4ea] text-hpsr-wine"><CalendarPlus2 size={18} /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-hpsr-text">{item.specialty}</p><p className="mt-0.5 text-xs font-semibold text-hpsr-muted">{displayDate(item.start_date)} até {displayDate(item.end_date)}</p><p className="mt-1 text-[11px] text-hpsr-muted">{item.start_time.slice(0, 5)}–{item.end_time.slice(0, 5)} · {item.slot_duration_minutes} min</p></div><button aria-label="Remover sequência livre" disabled={busy} onClick={() => void removeSeries(item.id)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] border border-rose-100 text-rose-700 transition hover:bg-rose-50"><Trash2 size={15} /></button></div>) : <p className="col-span-full rounded-[14px] border border-dashed border-hpsr-border bg-white p-5 text-center text-sm text-hpsr-muted">Nenhum horário publicado.</p>}
        </div>
      </details>
    </section>
  );
}
