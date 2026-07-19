"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarPlus2, CheckCircle2, Loader2, Repeat2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { specialties } from "@/data/mock";

const field = "min-h-[42px] w-full rounded-[12px] border border-hpsr-border bg-white px-3 text-sm font-bold text-hpsr-text outline-none focus:border-hpsr-wine";

type Props = { doctorId?: string; doctorName: string; defaultSpecialty?: string };
type Series = { id: string; specialty: string; start_date: string; end_date: string; start_time: string; end_time: string; slot_duration_minutes: number; weekday: number; status: string };

function dateKey(date: Date) {
  const y = date.getFullYear(); const m = String(date.getMonth()+1).padStart(2,"0"); const d = String(date.getDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
}

export function DoctorAvailabilityManager({ doctorId, doctorName, defaultSpecialty }: Props) {
  const today = useMemo(() => dateKey(new Date()), []);
  const [series, setSeries] = useState<Series[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ startDate: today, endDate: today, startTime: "09:00", endTime: "12:00", duration: "30", specialty: defaultSpecialty || "Clínico Geral", dailyLimit: "20" });

  async function load() {
    if (!doctorId) return;
    const client = createClient(); if (!client) return;
    const { data } = await client.from("clinical_availability_series").select("id,specialty,start_date,end_date,start_time,end_time,slot_duration_minutes,weekday,status").eq("doctor_id", doctorId).order("created_at", { ascending: false });
    setSeries((data || []) as Series[]);
  }
  useEffect(() => { void load(); }, [doctorId]);

  async function createAvailability() {
    setBusy(true); setError(""); setMessage("");
    try {
      if (!doctorId) throw new Error("Não foi possível identificar o médico logado.");
      const startDate = new Date(`${form.startDate}T12:00:00`); const endDate = new Date(`${form.endDate}T12:00:00`);
      if (endDate < startDate) throw new Error("A data final deve ser igual ou posterior à inicial.");
      const duration = Number(form.duration); const dailyLimit = Number(form.dailyLimit);
      const [sh, sm] = form.startTime.split(":").map(Number); const [eh, em] = form.endTime.split(":").map(Number);
      if ((eh*60+em) <= (sh*60+sm)) throw new Error("O horário final deve ser posterior ao inicial.");
      const client = createClient(); if (!client) throw new Error("Supabase não configurado.");
      const { data: created, error: seriesError } = await client.from("clinical_availability_series").insert({ doctor_id: doctorId, doctor_name: doctorName, specialty: form.specialty, start_date: form.startDate, end_date: form.endDate, start_time: form.startTime, end_time: form.endTime, slot_duration_minutes: duration, weekday: startDate.getDay(), daily_limit: dailyLimit, status: "Ativa" }).select("id").single();
      if (seriesError) throw seriesError;
      const slots: Array<Record<string, unknown>> = [];
      for (const cursor = new Date(startDate); cursor <= endDate; cursor.setDate(cursor.getDate()+7)) {
        let minute = sh*60+sm; const endMinute = eh*60+em; let count = 0;
        while (minute + duration <= endMinute && count < dailyLimit) {
          const start = new Date(cursor); start.setHours(Math.floor(minute/60), minute%60, 0, 0);
          const finish = new Date(start.getTime()+duration*60000);
          slots.push({ series_id: created.id, doctor_id: doctorId, doctor_name: doctorName, specialty: form.specialty, starts_at: start.toISOString(), ends_at: finish.toISOString(), status: "Disponível" });
          minute += duration; count += 1;
        }
      }
      const { error: slotError } = await client.from("clinical_appointment_slots").upsert(slots, { onConflict: "doctor_id,starts_at", ignoreDuplicates: true });
      if (slotError) { await client.from("clinical_availability_series").delete().eq("id", created.id); throw slotError; }
      setMessage(`${slots.length} horários processados na sequência semanal.`); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível publicar os horários."); }
    finally { setBusy(false); }
  }

  async function removeSeries(id: string) {
    const client = createClient(); if (!client) return;
    setBusy(true); setError("");
    const { data: occupied } = await client.from("clinical_appointment_slots").select("id").eq("series_id", id).eq("status", "Ocupado").limit(1);
    if (occupied?.length) { setError("A sequência possui consulta reservada. Os horários ocupados foram preservados; bloqueie apenas os horários livres individualmente."); setBusy(false); return; }
    const { error } = await client.from("clinical_availability_series").delete().eq("id", id).eq("doctor_id", doctorId);
    if (error) setError(error.message); else { setMessage("Sequência removida."); await load(); }
    setBusy(false);
  }

  return <section className="rounded-[16px] border border-hpsr-border bg-white p-4">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-[11px] font-black uppercase tracking-[.16em] text-hpsr-wineLight">Disponibilidade para pacientes</p><h2 className="mt-1 text-lg font-black text-hpsr-text">Publicar horários em cascata</h2><p className="mt-1 text-sm text-hpsr-muted">Defina uma terça, por exemplo, e repita semanalmente até a data final.</p></div><Repeat2 className="text-hpsr-wine" size={26}/></div>
    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-7">
      <label className="text-xs font-black text-hpsr-muted">Data inicial<input type="date" min={today} value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value,endDate:form.endDate<form.startDate?e.target.value:form.endDate})} className={`${field} mt-1`}/></label>
      <label className="text-xs font-black text-hpsr-muted">Repetir até<input type="date" min={form.startDate} value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})} className={`${field} mt-1`}/></label>
      <label className="text-xs font-black text-hpsr-muted">Início<input type="time" value={form.startTime} onChange={e=>setForm({...form,startTime:e.target.value})} className={`${field} mt-1`}/></label>
      <label className="text-xs font-black text-hpsr-muted">Fim<input type="time" value={form.endTime} onChange={e=>setForm({...form,endTime:e.target.value})} className={`${field} mt-1`}/></label>
      <label className="text-xs font-black text-hpsr-muted">Duração<select value={form.duration} onChange={e=>setForm({...form,duration:e.target.value})} className={`${field} mt-1`}><option value="20">20 min</option><option value="30">30 min</option><option value="45">45 min</option><option value="60">60 min</option></select></label>
      <label className="text-xs font-black text-hpsr-muted">Especialidade<select value={form.specialty} onChange={e=>setForm({...form,specialty:e.target.value})} className={`${field} mt-1`}>{specialties.map(s=><option key={s}>{s}</option>)}</select></label>
      <label className="text-xs font-black text-hpsr-muted">Limite/dia<input type="number" min="1" max="100" value={form.dailyLimit} onChange={e=>setForm({...form,dailyLimit:e.target.value})} className={`${field} mt-1`}/></label>
    </div>
    <button disabled={busy || !doctorId} onClick={()=>void createAvailability()} className="mt-4 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[14px] bg-hpsr-wine px-5 text-sm font-black text-white disabled:opacity-50">{busy?<Loader2 className="animate-spin" size={17}/>:<CalendarPlus2 size={17}/>} Publicar sequência</button>
    {message&&<p className="mt-3 rounded-[12px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800"><CheckCircle2 className="mr-2 inline" size={16}/>{message}</p>}{error&&<p className="mt-3 rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-800">{error}</p>}
    {!!series.length&&<div className="mt-4 grid gap-2">{series.map(item=><div key={item.id} className="flex flex-col gap-2 rounded-[13px] border border-hpsr-border bg-[#fffaf4] px-3 py-2 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-bold text-hpsr-text">{item.specialty} · {item.start_date.split('-').reverse().join('/')} até {item.end_date.split('-').reverse().join('/')} · {item.start_time.slice(0,5)}–{item.end_time.slice(0,5)} · {item.slot_duration_minutes} min</p><button disabled={busy} onClick={()=>void removeSeries(item.id)} className="inline-flex items-center gap-1 text-xs font-black text-rose-700"><Trash2 size={14}/>Remover sequência livre</button></div>)}</div>}
  </section>;
}
