"use client";

import { StyledSelect } from "@/components/ui/StyledSelect";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { CalendarDays, CheckCircle2, ChevronDown, ChevronUp, Clock3, Loader2, RefreshCcw, Stethoscope, XCircle, CalendarClock } from "lucide-react";
import { specialties } from "@/data/mock";
import { PatientBookingPanel } from "@/components/public/PatientBookingPanel";

type Appointment = {
  id: string;
  patient: string;
  status: string;
  specialty: string;
  preferredDate: string;
  preferredPeriod: string;
  preferredTime?: string;
  physician: string;
  reason: string;
  notes: string;
  flowType?: string;
  flowDetails?: string;
  createdAt: string;
  updatedAt: string;
  proposedDate?: string;
  proposedTime?: string;
  rescheduleReason?: string;
  patientAvailability?: string;
  patientAlternativeDate?: string;
  patientAlternativeTime?: string;
  patientResponse?: string;
  answer?: string;
};

const fieldClass = "min-h-[44px] w-full rounded-[14px] border border-hpsr-border bg-white px-3 text-sm font-bold text-hpsr-text outline-none focus:border-hpsr-wine";

function formatDate(value: string) {
  if (!value) return "A definir";
  const date = value.includes("T") ? new Date(value) : new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("pt-BR");
}

type PatientAppointmentsView = "scheduled" | "request" | "pending";

export function PatientAppointmentsPanel({ onSessionExpired, view = "scheduled", passport }: { onSessionExpired?: () => void; view?: PatientAppointmentsView; passport?: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [requestFlowType, setRequestFlowType] = useState("Consulta comum");
  const [availability, setAvailability] = useState<Record<string, string>>({});
  const [alternativeDates, setAlternativeDates] = useState<Record<string, string>>({});
  const [alternativeTimes, setAlternativeTimes] = useState<Record<string, string>>({});
  const requestInFlightRef = useRef<Promise<void> | null>(null);
  const lastLoadedAtRef = useRef(0);
  const onSessionExpiredRef = useRef(onSessionExpired);

  const pendingStatuses = ["aguard", "solicit", "pend", "reagendamento", "justific", "atras", "recus", "negad", "não aprovado", "nao aprovado"];
  const visibleAppointments = appointments.filter((appointment) => {
    const normalized = appointment.status.toLowerCase();
    const isPending = pendingStatuses.some((status) => normalized.includes(status));
    return view === "pending" ? isPending : !isPending;
  });

  useEffect(() => {
    onSessionExpiredRef.current = onSessionExpired;
  }, [onSessionExpired]);

  const loadAppointments = useCallback(async ({ silent = false, force = false }: { silent?: boolean; force?: boolean } = {}) => {
    const now = Date.now();
    if (!force && now - lastLoadedAtRef.current < 15000) return;
    if (requestInFlightRef.current) return requestInFlightRef.current;

    const request = (async () => {
      if (!silent) setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/paciente/consultas${passport ? `?passport=${encodeURIComponent(passport)}` : ""}`, { cache: "no-store" });
        const data = await response.json();
        if (response.status === 401) {
          onSessionExpiredRef.current?.();
          return;
        }
        if (!response.ok || !data.ok) throw new Error(data.error || "Não foi possível carregar as consultas.");
        setAppointments(data.appointments || []);
        lastLoadedAtRef.current = Date.now();
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar as consultas.");
      } finally {
        if (!silent) setLoading(false);
      }
    })();

    requestInFlightRef.current = request;
    try {
      await request;
    } finally {
      requestInFlightRef.current = null;
    }
  }, [passport]);

  const handleBooked = useCallback(() => {
    void loadAppointments({ silent: true, force: true });
  }, [loadAppointments]);

  useEffect(() => {
    if (view === "request") {
      setLoading(false);
      return;
    }
    void loadAppointments({ force: true });
    const onVisibility = () => {
      if (document.visibilityState === "visible") void loadAppointments({ silent: true });
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [loadAppointments, view]);


  async function appointmentAction(id: string, action: string) {
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/paciente/consultas${passport ? `?passport=${encodeURIComponent(passport)}` : ""}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        id,
        action,
        availability: availability[id] || "",
        alternativeDate: alternativeDates[id] || "",
        alternativeTime: alternativeTimes[id] || "",
      }) });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Não foi possível atualizar a consulta.");
      setMessage("Resposta registrada com sucesso.");
      await loadAppointments({ silent: true, force: true });
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
      setRequestFlowType("Consulta comum");
      await loadAppointments({ silent: true, force: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível solicitar a consulta.");
    } finally { setSaving(false); }
  }

  const pendingReschedules = appointments.filter((appointment) => appointment.status === "Reagendamento solicitado");

  return (
    <div className="space-y-4">
      {view !== "request" && pendingReschedules.length > 0 && (
        <section className="rounded-[22px] border border-amber-300 bg-[linear-gradient(135deg,#fff9df_0%,#fff4cc_100%)] p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[15px] bg-amber-600 text-white"><CalendarClock size={21} /></div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.16em] text-amber-800">Resposta necessária</p>
                <h3 className="mt-1 text-lg font-black text-amber-950">O médico solicitou um reagendamento</h3>
                <p className="mt-1 text-sm font-semibold leading-relaxed text-amber-900">Você possui {pendingReschedules.length} consulta{pendingReschedules.length === 1 ? "" : "s"} aguardando sua confirmação. Abra a pendência para aceitar, sugerir outra data e hora ou desistir do acompanhamento.</p>
              </div>
            </div>
            <button type="button" onClick={() => setExpanded(pendingReschedules[0].id)} className="inline-flex min-h-[42px] items-center justify-center rounded-[13px] bg-amber-800 px-4 text-sm font-black text-white">Responder agora</button>
          </div>
        </section>
      )}
      {view === "scheduled" && <PatientBookingPanel onSessionExpired={onSessionExpired} onBooked={handleBooked} />}
      {view !== "request" && <section className="rounded-[22px] border border-hpsr-border bg-white/90 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-hpsr-wine text-white"><CalendarDays size={20} /></div>
            <div><p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Portal do paciente</p><h3 className="text-lg font-black text-hpsr-text">{view === "pending" ? "Pendências" : "Consultas marcadas"}</h3></div>
          </div>
          <button type="button" onClick={() => void loadAppointments({ force: true })} className="inline-flex items-center gap-2 rounded-[12px] border border-hpsr-border bg-white px-3 py-2 text-xs font-black text-hpsr-wine"><RefreshCcw size={14} /> Atualizar</button>
        </div>

        {loading ? <div className="flex justify-center py-8"><Loader2 className="animate-spin text-hpsr-wine" /></div> : visibleAppointments.length === 0 ? (
          <p className="mt-4 rounded-[14px] border border-dashed border-hpsr-border bg-[#fffaf4] p-4 text-center text-sm font-semibold text-hpsr-muted">{view === "pending" ? "Nenhuma pendência relacionada às suas consultas." : "Nenhuma consulta marcada no momento."}</p>
        ) : (
          <div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {visibleAppointments.map((appointment) => {
              const isExpanded = expanded === appointment.id;
              return (
                <article key={appointment.id} className="rounded-[16px] border border-hpsr-border bg-[#fffaf4] p-3">
                  <button type="button" onClick={() => setExpanded(isExpanded ? null : appointment.id)} className="flex w-full items-center justify-between gap-3 text-left">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-hpsr-text">{appointment.specialty}</p>
                      <p className="mt-1 text-xs font-semibold text-hpsr-muted">{formatDate(appointment.preferredDate)} · {appointment.preferredTime ? `às ${appointment.preferredTime}` : (appointment.preferredPeriod || "Horário a definir")}</p>
                      <p className="mt-1 text-[11px] font-black uppercase tracking-[0.1em] text-hpsr-wineLight">{appointment.flowType || "Consulta comum"}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2"><span className="rounded-full bg-[#f1dfcd] px-2.5 py-1 text-[10px] font-black text-hpsr-wine">{appointment.status}</span>{isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
                  </button>
                  {isExpanded && <div className="mt-3 grid gap-2 border-t border-hpsr-border pt-3 text-xs font-semibold text-hpsr-muted sm:grid-cols-2"><p><strong className="text-hpsr-text">Protocolo:</strong> {appointment.id}</p><p><strong className="text-hpsr-text">Médico:</strong> {appointment.physician}</p><p className="sm:col-span-2"><strong className="text-hpsr-text">Motivo:</strong> {appointment.reason || "Não informado"}</p>{appointment.flowType === "Outros" && appointment.flowDetails && <p className="sm:col-span-2"><strong className="text-hpsr-text">Objetivo informado:</strong> {appointment.flowDetails}</p>}{appointment.notes && <p className="sm:col-span-2"><strong className="text-hpsr-text">Observações:</strong> {appointment.notes}</p>}{appointment.answer && <div className={`sm:col-span-2 rounded-[14px] border p-3 ${appointment.status.toLowerCase().includes("recus") ? "border-rose-200 bg-rose-50 text-rose-900" : "border-amber-200 bg-amber-50 text-amber-950"}`}><p className="font-black">Resposta da equipe</p><p className="mt-1 leading-relaxed">{appointment.answer}</p></div>}{appointment.status === "Reagendamento solicitado" && (
                    <div className="sm:col-span-2 mt-2 rounded-[18px] border border-amber-300 bg-amber-50 p-4">
                      <p className="font-black text-amber-950"><CalendarClock className="mr-2 inline" size={16}/>Reagendamento solicitado pelo médico</p>
                      <div className="mt-3 grid gap-2 rounded-[14px] border border-amber-200 bg-white p-3 sm:grid-cols-2">
                        <p className="text-amber-900"><strong>Data sugerida:</strong> {formatDate(appointment.proposedDate || "")}</p>
                        <p className="text-amber-900"><strong>Horário sugerido:</strong> {appointment.proposedTime || "A definir"}</p>
                        <p className="sm:col-span-2 text-amber-900"><strong>Médico:</strong> {appointment.physician}</p>
                        {appointment.rescheduleReason && <p className="sm:col-span-2 text-amber-900"><strong>Motivo:</strong> {appointment.rescheduleReason}</p>}
                      </div>

                      <div className="mt-4 grid gap-2 sm:grid-cols-3">
                        <button disabled={saving} onClick={() => void appointmentAction(appointment.id, "accept_reschedule")} className="rounded-[12px] bg-emerald-700 px-3 py-2.5 text-[11px] font-black text-white">Aceitar data e hora</button>
                        <button disabled={saving} onClick={() => void appointmentAction(appointment.id, "decline_reschedule")} className="rounded-[12px] border border-amber-400 bg-white px-3 py-2.5 text-[11px] font-black text-amber-900">Não posso nesse horário</button>
                        <button disabled={saving} onClick={() => void appointmentAction(appointment.id, "withdraw")} className="rounded-[12px] border border-rose-300 bg-white px-3 py-2.5 text-[11px] font-black text-rose-700"><XCircle className="mr-1 inline" size={13}/>Desistir do acompanhamento</button>
                      </div>

                      <div className="mt-4 rounded-[14px] border border-hpsr-border bg-white p-3">
                        <p className="font-black text-hpsr-text">Prefiro outra data e horário</p>
                        <p className="mt-1 text-[11px] text-hpsr-muted">Envie uma nova preferência para análise da equipe médica.</p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          <input type="date" value={alternativeDates[appointment.id] || ""} onChange={(event) => setAlternativeDates((current) => ({ ...current, [appointment.id]: event.target.value }))} className={fieldClass}/>
                          <input type="time" value={alternativeTimes[appointment.id] || ""} onChange={(event) => setAlternativeTimes((current) => ({ ...current, [appointment.id]: event.target.value }))} className={fieldClass}/>
                          <input value={availability[appointment.id] || ""} onChange={(event) => setAvailability((current) => ({ ...current, [appointment.id]: event.target.value }))} placeholder="Observação opcional sobre sua disponibilidade" className={`${fieldClass} sm:col-span-2`}/>
                          <button disabled={saving || !alternativeDates[appointment.id] || !alternativeTimes[appointment.id]} onClick={() => void appointmentAction(appointment.id, "propose_alternative")} className="rounded-[12px] bg-hpsr-wine px-3 py-2.5 text-[11px] font-black text-white disabled:opacity-50 sm:col-span-2">Enviar nova preferência</button>
                        </div>
                      </div>
                    </div>
                  )}</div>}
                </article>
              );
            })}
          </div>
        )}
      </section>}

      {view === "request" && <section className="rounded-[22px] border border-hpsr-border bg-white/90 p-4 sm:p-5">
        <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-hpsr-wine text-white"><Stethoscope size={20} /></div><div><p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Novo atendimento</p><h3 className="text-lg font-black text-hpsr-text">Agendar consulta</h3></div></div>
        <p className="mt-3 text-sm font-semibold leading-relaxed text-hpsr-muted">A solicitação será analisada pela equipe. O envio não confirma automaticamente a consulta.</p>
        <form onSubmit={submitAppointment} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-black text-hpsr-muted">Nome do paciente<input name="patient" required className={`${fieldClass} mt-1.5`} /></label>
          <label className="text-xs font-black text-hpsr-muted">Especialidade<StyledSelect name="specialty" required defaultValue="" className={`${fieldClass} mt-1.5`}><option value="" disabled>Selecione</option>{specialties.map((item) => <option key={item}>{item}</option>)}</StyledSelect></label>
          <label className="text-xs font-black text-hpsr-muted sm:col-span-2">Tipo de fluxo
            <StyledSelect name="flowType" required value={requestFlowType} onChange={(event) => setRequestFlowType(event.target.value)} className={`${fieldClass} mt-1.5`}>
              <option>Consulta comum</option>
              <option>Acompanhamento prolongado</option>
              <option>Exames</option>
              <option>Outros</option>
            </StyledSelect>
            <span className="mt-1.5 block text-[11px] font-semibold leading-relaxed text-hpsr-muted">Escolha a finalidade principal para direcionar a solicitação à equipe adequada.</span>
          </label>
          {requestFlowType === "Outros" && (
            <label className="text-xs font-black text-hpsr-muted sm:col-span-2">Descreva o objetivo da solicitação
              <textarea name="flowDetails" required rows={3} placeholder="Explique exatamente o atendimento, procedimento ou orientação que você procura." className={`${fieldClass} mt-1.5 py-3`} />
            </label>
          )}
          <label className="text-xs font-black text-hpsr-muted">Data preferencial<input name="preferredDate" type="date" required className={`${fieldClass} mt-1.5`} /></label>
          <label className="text-xs font-black text-hpsr-muted">Período<StyledSelect name="preferredPeriod" required defaultValue="" className={`${fieldClass} mt-1.5`}><option value="" disabled>Selecione</option><option>Manhã</option><option>Tarde</option><option>Noite</option><option>Indiferente</option></StyledSelect></label>
          <label className="text-xs font-black text-hpsr-muted sm:col-span-2">Horário preferencial <span className="font-semibold text-hpsr-muted/75">(opcional)</span><input name="preferredTime" type="time" className={`${fieldClass} mt-1.5`} /><span className="mt-1.5 block text-[11px] font-semibold leading-relaxed text-hpsr-muted">Preencha somente quando desejar sugerir uma hora específica. A equipe ainda confirmará a disponibilidade.</span></label>
          <label className="text-xs font-black text-hpsr-muted sm:col-span-2">Motivo da solicitação<textarea name="reason" required rows={4} placeholder="Descreva brevemente o motivo clínico ou a necessidade do atendimento." className={`${fieldClass} mt-1.5 py-3`} /></label>
          <label className="text-xs font-black text-hpsr-muted sm:col-span-2">Observações<textarea name="notes" rows={3} className={`${fieldClass} mt-1.5 py-3`} /></label>
          {message && <p className="sm:col-span-2 rounded-[12px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800"><CheckCircle2 className="mr-2 inline" size={16} />{message}</p>}
          {error && <p className="sm:col-span-2 rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-800">{error}</p>}
          <button disabled={saving} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[14px] bg-hpsr-wine px-4 text-sm font-black text-white disabled:opacity-50 sm:col-span-2">{saving ? <Loader2 className="animate-spin" size={17} /> : <Clock3 size={17} />} Enviar solicitação</button>
        </form>
      </section>}
    </div>
  );
}
