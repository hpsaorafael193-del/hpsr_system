"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, ChevronDown, ChevronUp, Clock3, Loader2, RefreshCcw, Stethoscope, XCircle, CalendarClock } from "lucide-react";
import { specialties } from "@/data/mock";

type Appointment = {
  id: string;
  patient: string;
  status: string;
  specialty: string;
  preferredDate: string;
  preferredPeriod: string;
  physician: string;
  reason: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  proposedDate?: string;
  proposedTime?: string;
  rescheduleReason?: string;
  patientAvailability?: string;
};

const fieldClass = "min-h-[44px] w-full rounded-[14px] border border-hpsr-border bg-white px-3 text-sm font-bold text-hpsr-text outline-none focus:border-hpsr-wine";

function formatDate(value: string) {
  if (!value) return "A definir";
  const date = value.includes("T") ? new Date(value) : new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("pt-BR");
}

export function PatientAppointmentsPanel({ onSessionExpired }: { onSessionExpired?: () => void }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [availability, setAvailability] = useState<Record<string, string>>({});

  const loadAppointments = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/paciente/consultas", { cache: "no-store" });
      const data = await response.json();
      if (response.status === 401) { onSessionExpired?.(); return; }
      if (!response.ok || !data.ok) throw new Error(data.error || "Não foi possível carregar as consultas.");
      setAppointments(data.appointments || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar as consultas.");
    } finally { setLoading(false); }
  }, [onSessionExpired]);

  useEffect(() => {
    void loadAppointments();
    const timer = window.setInterval(() => void loadAppointments(), 45000);
    const onVisibility = () => { if (document.visibilityState === "visible") void loadAppointments(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [loadAppointments]);


  async function appointmentAction(id: string, action: string) {
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/paciente/consultas", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action, availability: availability[id] || "" }) });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Não foi possível atualizar a consulta.");
      setMessage("Resposta registrada com sucesso.");
      await loadAppointments();
    } catch (actionError) { setError(actionError instanceof Error ? actionError.message : "Não foi possível atualizar a consulta."); }
    finally { setSaving(false); }
  }

  async function submitAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError(""); setMessage("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const response = await fetch("/api/paciente/agendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      const data = await response.json();
      if (response.status === 401) { onSessionExpired?.(); return; }
      if (!response.ok || !data.ok) throw new Error(data.error || "Não foi possível solicitar a consulta.");
      setMessage(`Solicitação registrada. Protocolo: ${data.id}`);
      formElement.reset();
      await loadAppointments();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível solicitar a consulta.");
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[22px] border border-hpsr-border bg-white/90 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-hpsr-wine text-white"><CalendarDays size={20} /></div>
            <div><p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Portal do paciente</p><h3 className="text-lg font-black text-hpsr-text">Minhas consultas</h3></div>
          </div>
          <button type="button" onClick={() => void loadAppointments()} className="inline-flex items-center gap-2 rounded-[12px] border border-hpsr-border bg-white px-3 py-2 text-xs font-black text-hpsr-wine"><RefreshCcw size={14} /> Atualizar</button>
        </div>

        {loading ? <div className="flex justify-center py-8"><Loader2 className="animate-spin text-hpsr-wine" /></div> : appointments.length === 0 ? (
          <p className="mt-4 rounded-[14px] border border-dashed border-hpsr-border bg-[#fffaf4] p-4 text-center text-sm font-semibold text-hpsr-muted">Nenhuma consulta foi solicitada para este passaporte.</p>
        ) : (
          <div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {appointments.map((appointment) => {
              const isExpanded = expanded === appointment.id;
              return (
                <article key={appointment.id} className="rounded-[16px] border border-hpsr-border bg-[#fffaf4] p-3">
                  <button type="button" onClick={() => setExpanded(isExpanded ? null : appointment.id)} className="flex w-full items-center justify-between gap-3 text-left">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-hpsr-text">{appointment.specialty}</p>
                      <p className="mt-1 text-xs font-semibold text-hpsr-muted">{formatDate(appointment.preferredDate)} · {appointment.preferredPeriod || "Horário a definir"}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2"><span className="rounded-full bg-[#f1dfcd] px-2.5 py-1 text-[10px] font-black text-hpsr-wine">{appointment.status}</span>{isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
                  </button>
                  {isExpanded && <div className="mt-3 grid gap-2 border-t border-hpsr-border pt-3 text-xs font-semibold text-hpsr-muted sm:grid-cols-2"><p><strong className="text-hpsr-text">Protocolo:</strong> {appointment.id}</p><p><strong className="text-hpsr-text">Médico:</strong> {appointment.physician}</p><p className="sm:col-span-2"><strong className="text-hpsr-text">Motivo:</strong> {appointment.reason || "Não informado"}</p>{appointment.notes && <p className="sm:col-span-2"><strong className="text-hpsr-text">Observações:</strong> {appointment.notes}</p>}{appointment.status === "Reagendamento solicitado" && <div className="sm:col-span-2 mt-2 rounded-[14px] border border-amber-200 bg-amber-50 p-3"><p className="font-black text-amber-950"><CalendarClock className="mr-2 inline" size={16}/>O médico deseja reagendar</p><p className="mt-1 text-amber-900">Nova data: {formatDate(appointment.proposedDate || "")} · {appointment.proposedTime || "Horário a definir"}</p>{appointment.rescheduleReason && <p className="mt-1 text-amber-900">Motivo: {appointment.rescheduleReason}</p>}<div className="mt-3 flex flex-wrap gap-2"><button disabled={saving} onClick={() => void appointmentAction(appointment.id, "accept_reschedule")} className="rounded-[12px] bg-emerald-700 px-3 py-2 text-[11px] font-black text-white">Aceitar</button><button disabled={saving} onClick={() => void appointmentAction(appointment.id, "decline_reschedule")} className="rounded-[12px] border border-rose-300 bg-white px-3 py-2 text-[11px] font-black text-rose-700">Recusar</button><button disabled={saving} onClick={() => void appointmentAction(appointment.id, "withdraw")} className="rounded-[12px] border border-hpsr-border bg-white px-3 py-2 text-[11px] font-black text-hpsr-wine"><XCircle className="mr-1 inline" size={13}/>Desistir</button></div><div className="mt-3 flex flex-col gap-2 sm:flex-row"><input value={availability[appointment.id] || ""} onChange={(event) => setAvailability((current) => ({ ...current, [appointment.id]: event.target.value }))} placeholder="Informe dias e horários disponíveis" className={`${fieldClass} flex-1`}/><button disabled={saving || !(availability[appointment.id] || "").trim()} onClick={() => void appointmentAction(appointment.id, "send_availability")} className="rounded-[12px] bg-hpsr-wine px-3 py-2 text-[11px] font-black text-white">Informar disponibilidade</button></div></div>}</div>}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-[22px] border border-hpsr-border bg-white/90 p-4 sm:p-5">
        <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-hpsr-wine text-white"><Stethoscope size={20} /></div><div><p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Novo atendimento</p><h3 className="text-lg font-black text-hpsr-text">Agendar consulta</h3></div></div>
        <p className="mt-3 text-sm font-semibold leading-relaxed text-hpsr-muted">A solicitação será analisada pela equipe. O envio não confirma automaticamente a consulta.</p>
        <form onSubmit={submitAppointment} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-black text-hpsr-muted">Nome do paciente<input name="patient" required className={`${fieldClass} mt-1.5`} /></label>
          <label className="text-xs font-black text-hpsr-muted">Especialidade<select name="specialty" required defaultValue="" className={`${fieldClass} mt-1.5`}><option value="" disabled>Selecione</option>{specialties.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="text-xs font-black text-hpsr-muted">Data preferencial<input name="preferredDate" type="date" required className={`${fieldClass} mt-1.5`} /></label>
          <label className="text-xs font-black text-hpsr-muted">Período<select name="preferredPeriod" required defaultValue="" className={`${fieldClass} mt-1.5`}><option value="" disabled>Selecione</option><option>Manhã</option><option>Tarde</option><option>Noite</option><option>Indiferente</option></select></label>
          <label className="text-xs font-black text-hpsr-muted sm:col-span-2">Motivo da consulta<textarea name="reason" required rows={4} className={`${fieldClass} mt-1.5 py-3`} /></label>
          <label className="text-xs font-black text-hpsr-muted sm:col-span-2">Observações<textarea name="notes" rows={3} className={`${fieldClass} mt-1.5 py-3`} /></label>
          {message && <p className="sm:col-span-2 rounded-[12px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800"><CheckCircle2 className="mr-2 inline" size={16} />{message}</p>}
          {error && <p className="sm:col-span-2 rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-800">{error}</p>}
          <button disabled={saving} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[14px] bg-hpsr-wine px-4 text-sm font-black text-white disabled:opacity-50 sm:col-span-2">{saving ? <Loader2 className="animate-spin" size={17} /> : <Clock3 size={17} />} Enviar solicitação</button>
        </form>
      </section>
    </div>
  );
}
