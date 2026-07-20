"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarPlus2,
  CheckCircle2,
  Clock3,
  Gauge,
  Loader2,
  Repeat2,
  Stethoscope,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { specialties } from "@/data/mock";

const field = "mt-1.5 min-h-[46px] w-full rounded-[14px] border border-hpsr-border bg-white px-3.5 text-sm font-bold text-hpsr-text outline-none transition focus:border-hpsr-wine focus:ring-2 focus:ring-hpsr-wineLight/20";
const label = "text-[11px] font-black uppercase tracking-[0.11em] text-hpsr-muted";

type Props = { doctorId?: string; doctorName: string; defaultSpecialty?: string };
type Series = { id: string; specialty: string; start_date: string; end_date: string; start_time: string; end_time: string; slot_duration_minutes: number; weekday: number; status: string };

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function displayDate(value: string) {
  return value.split("-").reverse().join("/");
}

export function DoctorAvailabilityManager({ doctorId, doctorName, defaultSpecialty }: Props) {
  const today = useMemo(() => dateKey(new Date()), []);
  const [series, setSeries] = useState<Series[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ startDate: today, endDate: today, startTime: "09:00", endTime: "12:00", duration: "60", specialty: defaultSpecialty || "Clínico Geral", dailyLimit: "" });

  async function load() {
    if (!doctorId) return;
    const client = createClient();
    if (!client) return;
    const { data } = await client
      .from("clinical_availability_series")
      .select("id,specialty,start_date,end_date,start_time,end_time,slot_duration_minutes,weekday,status")
      .eq("doctor_id", doctorId)
      .order("created_at", { ascending: false });
    setSeries((data || []) as Series[]);
  }

  useEffect(() => {
    void load();
  }, [doctorId]);

  const estimatedSlots = useMemo(() => {
    const [startHour, startMinute] = form.startTime.split(":").map(Number);
    const [endHour, endMinute] = form.endTime.split(":").map(Number);
    const duration = Math.max(1, Number(form.duration) || 60);
    const available = Math.max(0, endHour * 60 + endMinute - (startHour * 60 + startMinute));
    const natural = Math.floor(available / duration);
    return form.dailyLimit.trim() ? Math.min(natural, Math.max(1, Number(form.dailyLimit) || 1)) : natural;
  }, [form.startTime, form.endTime, form.duration, form.dailyLimit]);

  async function createAvailability() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (!doctorId) throw new Error("Não foi possível identificar o médico logado.");
      const startDate = new Date(`${form.startDate}T12:00:00`);
      const endDate = new Date(`${form.endDate}T12:00:00`);
      if (endDate < startDate) throw new Error("A data final deve ser igual ou posterior à inicial.");
      const duration = Number(form.duration);
      const dailyLimit = form.dailyLimit.trim() ? Number(form.dailyLimit) : null;
      const [startHour, startMinute] = form.startTime.split(":").map(Number);
      const [endHour, endMinute] = form.endTime.split(":").map(Number);
      if (endHour * 60 + endMinute <= startHour * 60 + startMinute) throw new Error("O horário final deve ser posterior ao inicial.");
      const client = createClient();
      if (!client) throw new Error("Supabase não configurado.");
      const { data: created, error: seriesError } = await client
        .from("clinical_availability_series")
        .insert({ doctor_id: doctorId, doctor_name: doctorName, specialty: form.specialty, start_date: form.startDate, end_date: form.endDate, start_time: form.startTime, end_time: form.endTime, slot_duration_minutes: duration, weekday: startDate.getDay(), daily_limit: dailyLimit, status: "Ativa" })
        .select("id")
        .single();
      if (seriesError) throw seriesError;
      const slots: Array<Record<string, unknown>> = [];
      for (const cursor = new Date(startDate); cursor <= endDate; cursor.setDate(cursor.getDate() + 7)) {
        let minute = startHour * 60 + startMinute;
        const finalMinute = endHour * 60 + endMinute;
        let count = 0;
        while (minute + duration <= finalMinute && (dailyLimit === null || count < dailyLimit)) {
          const start = new Date(cursor);
          start.setHours(Math.floor(minute / 60), minute % 60, 0, 0);
          const finish = new Date(start.getTime() + duration * 60000);
          slots.push({ series_id: created.id, doctor_id: doctorId, doctor_name: doctorName, specialty: form.specialty, starts_at: start.toISOString(), ends_at: finish.toISOString(), status: "Disponível" });
          minute += duration;
          count += 1;
        }
      }
      const { error: slotError } = await client.from("clinical_appointment_slots").upsert(slots, { onConflict: "doctor_id,starts_at", ignoreDuplicates: true });
      if (slotError) {
        await client.from("clinical_availability_series").delete().eq("id", created.id);
        throw slotError;
      }
      setMessage(`${slots.length} horários processados na sequência semanal.`);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível publicar os horários.");
    } finally {
      setBusy(false);
    }
  }

  async function removeSeries(id: string) {
    const client = createClient();
    if (!client) return;
    setBusy(true);
    setError("");
    const { data: occupied } = await client.from("clinical_appointment_slots").select("id").eq("series_id", id).eq("status", "Ocupado").limit(1);
    if (occupied?.length) {
      setError("A sequência possui consulta reservada. Os horários ocupados foram preservados; bloqueie apenas os horários livres individualmente.");
      setBusy(false);
      return;
    }
    const { error: removeError } = await client.from("clinical_availability_series").delete().eq("id", id).eq("doctor_id", doctorId);
    if (removeError) setError(removeError.message);
    else {
      setMessage("Sequência removida.");
      await load();
    }
    setBusy(false);
  }

  return (
    <section className="overflow-hidden rounded-[20px] border border-hpsr-border bg-white shadow-[0_12px_35px_rgba(93,45,24,0.05)]">
      <div className="border-b border-hpsr-border bg-[linear-gradient(135deg,#fffaf4_0%,#ffffff_65%)] px-4 py-4 lg:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-[#7f3a22] text-white shadow-sm"><CalendarPlus2 size={22} /></div>
            <div>
              <div className="flex flex-wrap items-center gap-2"><span className="text-[10px] font-black uppercase tracking-[0.18em] text-hpsr-wineLight">Etapa 2</span><span className="rounded-full border border-hpsr-border bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-hpsr-muted">Disponibilidade médica</span></div>
              <h2 className="mt-1 text-xl font-black tracking-tight text-hpsr-text">Publicar horários de atendimento</h2>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-hpsr-muted">Organize uma sequência semanal. Os pacientes visualizarão as vagas somente durante o dia anterior à consulta.</p>
            </div>
          </div>
          <div className="rounded-[14px] border border-hpsr-border bg-white px-3 py-2 text-right"><p className="text-[10px] font-black uppercase tracking-[0.12em] text-hpsr-muted">Sequências ativas</p><p className="mt-0.5 text-xl font-black text-hpsr-wine">{series.length}</p></div>
        </div>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:p-5">
        <div className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className={label}>Data inicial<input type="date" min={today} value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value, endDate: form.endDate < event.target.value ? event.target.value : form.endDate })} className={field} /></label>
            <label className={label}>Repetir até<input type="date" min={form.startDate} value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} className={field} /></label>
            <label className={`${label} md:col-span-2`}>Especialidade<select value={form.specialty} onChange={(event) => setForm({ ...form, specialty: event.target.value })} className={field}>{specialties.map((specialty) => <option key={specialty}>{specialty}</option>)}</select></label>
          </div>

          <div className="rounded-[16px] border border-hpsr-border bg-[#fffaf4] p-3.5">
            <div className="mb-3 flex items-center gap-2 text-hpsr-wine"><Clock3 size={16} /><p className="text-[11px] font-black uppercase tracking-[0.12em]">Jornada do atendimento</p></div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <label className={label}>Início<input type="time" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} className={field} /></label>
              <label className={label}>Término<input type="time" value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} className={field} /></label>
              <label className={label}>Duração<select value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })} className={field}><option value="30">30 min</option><option value="45">45 min</option><option value="60">1 hora</option><option value="90">1h30</option><option value="120">2 horas</option></select></label>
              <label className={`${label} sm:col-span-2 xl:col-span-2`}>Limite diário opcional<input type="number" min="1" max="100" placeholder="Sem limite institucional" value={form.dailyLimit} onChange={(event) => setForm({ ...form, dailyLimit: event.target.value })} className={field} /></label>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-h-[42px]">{message && <p className="rounded-[12px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800"><CheckCircle2 className="mr-2 inline" size={16} />{message}</p>}{error && <p className="rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-800">{error}</p>}</div>
            <button disabled={busy || !doctorId} onClick={() => void createAvailability()} className="inline-flex min-h-[46px] shrink-0 items-center justify-center gap-2 rounded-[14px] bg-hpsr-wine px-5 text-sm font-black text-white shadow-sm transition hover:brightness-105 disabled:opacity-50">{busy ? <Loader2 className="animate-spin" size={17} /> : <CalendarPlus2 size={17} />}Publicar sequência</button>
          </div>
        </div>

        <aside className="rounded-[18px] border border-hpsr-border bg-[#fff8f0] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Resumo da publicação</p>
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-3 rounded-[13px] border border-hpsr-border bg-white p-3"><Stethoscope size={18} className="text-hpsr-wine" /><div className="min-w-0"><p className="text-[10px] uppercase tracking-wider text-hpsr-muted">Especialidade</p><p className="truncate text-sm font-black text-hpsr-text">{form.specialty}</p></div></div>
            <div className="flex items-center gap-3 rounded-[13px] border border-hpsr-border bg-white p-3"><Clock3 size={18} className="text-hpsr-wine" /><div><p className="text-[10px] uppercase tracking-wider text-hpsr-muted">Faixa diária</p><p className="text-sm font-black text-hpsr-text">{form.startTime} — {form.endTime}</p></div></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-[13px] border border-hpsr-border bg-white p-3"><Gauge size={16} className="text-hpsr-wine" /><p className="mt-2 text-[10px] uppercase tracking-wider text-hpsr-muted">Vagas/dia</p><p className="mt-0.5 text-xl font-black text-hpsr-text">{estimatedSlots}</p></div>
              <div className="rounded-[13px] border border-hpsr-border bg-white p-3"><Repeat2 size={16} className="text-hpsr-wine" /><p className="mt-2 text-[10px] uppercase tracking-wider text-hpsr-muted">Duração</p><p className="mt-0.5 text-xl font-black text-hpsr-text">{form.duration}<span className="ml-1 text-xs">min</span></p></div>
            </div>
          </div>
          <p className="mt-3 rounded-[12px] border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold leading-relaxed text-amber-900">A publicação não torna as vagas visíveis antecipadamente. A abertura continua automática no dia anterior.</p>
        </aside>
      </div>

      {series.length > 0 && (
        <div className="border-t border-hpsr-border bg-[#fffdf9] px-4 py-4 lg:px-5">
          <div className="mb-3"><p className="text-[10px] font-black uppercase tracking-[0.15em] text-hpsr-wineLight">Disponibilidades cadastradas</p><p className="mt-1 text-sm text-hpsr-muted">Sequências semanais publicadas para escolha dos pacientes.</p></div>
          <div className="grid gap-2 lg:grid-cols-2">
            {series.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-[15px] border border-hpsr-border bg-white p-3 transition hover:border-hpsr-wineLight/50">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[#fff4ea] text-hpsr-wine"><CalendarPlus2 size={18} /></div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-hpsr-text">{item.specialty}</p><p className="mt-0.5 text-xs font-semibold text-hpsr-muted">{displayDate(item.start_date)} até {displayDate(item.end_date)}</p><p className="mt-1 text-[11px] text-hpsr-muted">{item.start_time.slice(0, 5)}–{item.end_time.slice(0, 5)} · {item.slot_duration_minutes} min</p></div>
                <button aria-label="Remover sequência livre" disabled={busy} onClick={() => void removeSeries(item.id)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] border border-rose-100 text-rose-700 transition hover:bg-rose-50"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
