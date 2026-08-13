"use client";

import { StyledSelect } from "@/components/ui/StyledSelect";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, Clock3, Loader2, RefreshCcw, Stethoscope, XCircle, CalendarClock, MessageCircleWarning } from "lucide-react";
import { specialties } from "@/data/mock";

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
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

type PatientAppointmentsView = "scheduled" | "request" | "pending";

function DiscordSchedulingNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`overflow-hidden rounded-[18px] border-2 border-blue-300 bg-[linear-gradient(135deg,#eff7ff_0%,#dfeeff_100%)] shadow-[0_12px_28px_rgba(37,99,235,.10)] ${compact ? "p-3.5" : "p-4 sm:p-5"}`}>
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-blue-700 text-white shadow-sm"><MessageCircleWarning size={21} /></span>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[.16em] text-blue-700">Atenção ao agendamento</p>
          <h3 className="mt-1 text-base font-black text-blue-950 sm:text-lg">Você não escolhe dia ou horário pelo Portal</h3>
          <p className="mt-1.5 text-xs font-semibold leading-relaxed text-blue-900 sm:text-sm">Envie apenas a solicitação. Depois da análise, o médico responsável entra em contato diretamente para combinar a data e o horário. Essa regra também vale para pacientes que já estão em acompanhamento, retornos e reagendamentos.</p>
          {!compact && <div className="mt-3 rounded-[14px] border border-blue-200 bg-white/80 px-3.5 py-3 text-xs leading-relaxed text-blue-800">
            <p className="font-black">Contato pelo Discord — use o ID correto</p>
            <p className="mt-1"><strong>PC:</strong> abra seu perfil no Discord e use <strong>“Copiar ID do usuário”</strong>.</p>
            <p className="mt-1"><strong>Celular:</strong> Perfil &gt; role até o final &gt; toque em <strong>“Copiar ID”</strong>.</p>
            <p className="mt-2 font-black text-rose-600">⚠ NÃO INFORME APELIDO OU NOME DE USUÁRIO. O ID DO DISCORD É APENAS NÚMEROS.</p>
          </div>}
        </div>
      </div>
    </div>
  );
}

export function PatientAppointmentsPanel({ onSessionExpired, view = "scheduled", passport, hasEmail }: { onSessionExpired?: () => void; view?: PatientAppointmentsView; passport?: string; hasEmail?: boolean }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [requestFlowType, setRequestFlowType] = useState("Consulta comum");
  const [requestSpecialty, setRequestSpecialty] = useState("");
  const [specialistDoctors, setSpecialistDoctors] = useState<Array<{ id: string; name: string; specialty: string }>>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [doctorLoadError, setDoctorLoadError] = useState("");
  const [discordId, setDiscordId] = useState("");
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

  useEffect(() => {
    if (requestFlowType !== "Acompanhamento com especialista" || !requestSpecialty) {
      setSpecialistDoctors([]);
      setSelectedDoctorId("");
      setDoctorLoadError("");
      return;
    }
    let active = true;
    const timer = window.setTimeout(async () => {
      setLoadingDoctors(true);
      setDoctorLoadError("");
      try {
        const response = await fetch(`/api/paciente/medicos?specialty=${encodeURIComponent(requestSpecialty)}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.error || "Não foi possível carregar os médicos.");
        if (active) setSpecialistDoctors(data.doctors || []);
      } catch (loadDoctorError) {
        if (active) {
          setSpecialistDoctors([]);
          setDoctorLoadError(loadDoctorError instanceof Error ? loadDoctorError.message : "Não foi possível carregar os médicos.");
        }
      } finally {
        if (active) setLoadingDoctors(false);
      }
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [requestFlowType, requestSpecialty]);

  async function appointmentAction(id: string, action: string) {
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/paciente/consultas${passport ? `?passport=${encodeURIComponent(passport)}` : ""}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        id,
        action,
        availability: "",
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
      const response = await fetch(`/api/paciente/agendar${passport ? `?passport=${encodeURIComponent(passport)}` : ""}`, {
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
      setRequestSpecialty("");
      setSelectedDoctorId("");
      setDiscordId("");
      await loadAppointments({ silent: true, force: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível solicitar a consulta.");
    } finally { setSaving(false); }
  }

  const pendingReschedules = appointments.filter((appointment) => appointment.status === "Reagendamento solicitado");

  return (
    <div className="space-y-4">
      <DiscordSchedulingNotice compact={view !== "request"} />
      {view !== "request" && pendingReschedules.length > 0 && (
        <section className="rounded-[22px] border border-amber-300 bg-[linear-gradient(135deg,#fff9df_0%,#fff4cc_100%)] p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[15px] bg-amber-600 text-white"><CalendarClock size={21} /></div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.16em] text-amber-800">Resposta necessária</p>
                <h3 className="mt-1 text-lg font-black text-amber-950">O médico solicitou um reagendamento</h3>
                <p className="mt-1 text-sm font-semibold leading-relaxed text-amber-900">Você possui {pendingReschedules.length} consulta{pendingReschedules.length === 1 ? "" : "s"} com ajuste em andamento. Abra a pendência para ver a orientação. O novo dia e horário serão combinados diretamente com o médico, sem escolha pelo Portal.</p>
              </div>
            </div>
            <button type="button" onClick={() => setExpanded(pendingReschedules[0].id)} className="inline-flex min-h-[42px] items-center justify-center rounded-[13px] bg-amber-800 px-4 text-sm font-black text-white">Responder agora</button>
          </div>
        </section>
      )}
      {view !== "request" && <section className="rounded-[18px] border border-hpsr-border bg-white/90 p-3.5 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hpsr-border/70 pb-3">
          <div>
            <h3 className="text-base font-black text-hpsr-text">{view === "pending" ? "Pendências" : "Meus agendamentos"}</h3>
            <p className="mt-0.5 text-xs font-semibold text-hpsr-muted">{view === "pending" ? "Itens que precisam da sua atenção." : "Acompanhe horários e respostas da equipe."}</p>
          </div>
          <button type="button" onClick={() => void loadAppointments({ force: true })} className="inline-flex items-center gap-1.5 rounded-[10px] border border-hpsr-border bg-white px-2.5 py-2 text-[11px] font-black text-hpsr-wine"><RefreshCcw size={13} /> Atualizar</button>
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
                      <p className="mt-1 text-xs font-semibold text-hpsr-muted">{formatDate(appointment.proposedDate || appointment.preferredDate)} · {(appointment.proposedTime || appointment.preferredTime) ? `às ${appointment.proposedTime || appointment.preferredTime}` : (appointment.preferredPeriod || "Horário a definir")}</p>
                      <p className="mt-1 text-[11px] font-semibold text-hpsr-muted">{appointment.physician || "Médico a definir"}</p>
                      <p className="mt-1 text-[11px] font-black uppercase tracking-[0.1em] text-hpsr-wineLight">{appointment.flowType || "Consulta comum"}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2"><span className="rounded-full bg-[#f1dfcd] px-2.5 py-1 text-[10px] font-black text-hpsr-wine">{appointment.status}</span>{isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
                  </button>
                  {isExpanded && <div className="mt-3 grid gap-2 border-t border-hpsr-border pt-3 text-xs font-semibold text-hpsr-muted sm:grid-cols-2"><p><strong className="text-hpsr-text">Protocolo:</strong> {appointment.id}</p><p><strong className="text-hpsr-text">Médico:</strong> {appointment.physician}</p><p className="sm:col-span-2"><strong className="text-hpsr-text">Motivo:</strong> {appointment.reason || "Não informado"}</p>{appointment.flowType === "Outros" && appointment.flowDetails && <p className="sm:col-span-2"><strong className="text-hpsr-text">Objetivo informado:</strong> {appointment.flowDetails}</p>}{appointment.notes && <p className="sm:col-span-2"><strong className="text-hpsr-text">Observações:</strong> {appointment.notes}</p>}{appointment.answer && <div className={`sm:col-span-2 rounded-[14px] border p-3 ${appointment.status.toLowerCase().includes("recus") ? "border-rose-200 bg-rose-50 text-rose-900" : "border-amber-200 bg-amber-50 text-amber-950"}`}><p className="font-black">Resposta da equipe</p><p className="mt-1 leading-relaxed">{appointment.answer}</p></div>}{appointment.status === "Reagendamento solicitado" && (
                    <div className="sm:col-span-2 mt-2 rounded-[18px] border border-amber-300 bg-amber-50 p-4">
                      <p className="font-black text-amber-950"><CalendarClock className="mr-2 inline" size={16}/>Ajuste de agendamento em andamento</p>
                      <p className="mt-2 text-xs font-semibold leading-relaxed text-amber-900">O paciente não precisa escolher uma nova data ou horário pelo Portal. O médico responsável fará o contato pelo e-mail cadastrado ou pelo ID do Discord informado para combinar o ajuste.</p>
                      {appointment.rescheduleReason && <p className="mt-3 rounded-[12px] border border-amber-200 bg-white px-3 py-2 text-xs font-semibold text-amber-900"><strong>Orientação:</strong> {appointment.rescheduleReason}</p>}
                      <button disabled={saving} onClick={() => void appointmentAction(appointment.id, "withdraw")} className="mt-3 rounded-[12px] border border-rose-300 bg-white px-3 py-2.5 text-[11px] font-black text-rose-700"><XCircle className="mr-1 inline" size={13}/>Desistir do acompanhamento</button>
                    </div>
                  )}</div>}
                </article>
              );
            })}
          </div>
        )}
      </section>}

      {view === "request" && <section className="rounded-[18px] border border-hpsr-border bg-white/90 p-3.5 sm:p-4">
        <div className="border-b border-hpsr-border/70 pb-3">
          <h3 className="text-base font-black text-hpsr-text">Solicitar consulta</h3>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-hpsr-muted">Você envia apenas a solicitação. Nenhum paciente — inclusive quem já está em acompanhamento — define dia ou horário pelo Portal. O médico responsável fará o contato para combinar o atendimento.</p>
        </div>
        <button type="button" onClick={() => setRequestFlowType("Acompanhamento com especialista")} className={`mt-4 flex w-full items-start gap-3 rounded-[18px] border p-4 text-left transition ${requestFlowType === "Acompanhamento com especialista" ? "border-hpsr-wine bg-[#fff4ee] shadow-sm" : "border-hpsr-border bg-[#fffaf4] hover:border-hpsr-wineLight"}`}>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-hpsr-wine text-white"><Stethoscope size={19} /></span>
          <span><strong className="block text-sm font-black text-hpsr-text">Já faço acompanhamento com um especialista</strong><span className="mt-1 block text-xs font-semibold leading-relaxed text-hpsr-muted">Selecione o médico que já acompanha você e envie o pré-registro para confirmação do profissional.</span></span>
        </button>
        <form onSubmit={submitAppointment} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-black text-hpsr-muted">Nome do paciente<input name="patient" required className={`${fieldClass} mt-1.5`} /></label>
          <label className="text-xs font-black text-hpsr-muted">Especialidade<StyledSelect name="specialty" required value={requestSpecialty} onChange={(event) => setRequestSpecialty(event.target.value)} className={`${fieldClass} mt-1.5`}><option value="" disabled>Selecione</option>{specialties.map((item) => <option key={item}>{item}</option>)}</StyledSelect></label>
          <label className="text-xs font-black text-hpsr-muted sm:col-span-2">Tipo de fluxo
            <StyledSelect name="flowType" required value={requestFlowType} onChange={(event) => setRequestFlowType(event.target.value)} className={`${fieldClass} mt-1.5`}>
              <option>Consulta comum</option>
              <option>Acompanhamento com especialista</option>
              <option>Exames</option>
              <option>Outros</option>
            </StyledSelect>
            <span className="mt-1.5 block text-[11px] font-semibold leading-relaxed text-hpsr-muted">Escolha a finalidade principal para direcionar a solicitação à equipe adequada.</span>
          </label>
          {requestFlowType === "Acompanhamento com especialista" && (
            <div className="sm:col-span-2 rounded-[18px] border border-hpsr-border bg-[#fffaf4] p-4">
              <p className="text-xs font-black text-hpsr-text">Médico que já realiza seu acompanhamento</p>
              <p className="mt-1 text-[11px] font-semibold leading-relaxed text-hpsr-muted">Selecione o profissional responsável. Ele receberá o pré-registro e, após confirmar o vínculo, entrará em contato para combinar os próximos atendimentos.</p>
              <StyledSelect name="requestedDoctorId" required value={selectedDoctorId} onChange={(event) => setSelectedDoctorId(event.target.value)} disabled={!requestSpecialty || loadingDoctors} className={`${fieldClass} mt-3`}>
                <option value="" disabled>{loadingDoctors ? "Carregando médicos..." : !requestSpecialty ? "Selecione primeiro a especialidade" : specialistDoctors.length ? "Selecione o médico" : "Nenhum médico disponível nesta especialidade"}</option>
                {specialistDoctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name}</option>)}
              </StyledSelect>
              {doctorLoadError && <p className="mt-2 rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">{doctorLoadError}</p>}
              <input type="hidden" name="requestedDoctorName" value={specialistDoctors.find((doctor) => doctor.id === selectedDoctorId)?.name || ""} />
            </div>
          )}
          {requestFlowType === "Outros" && (
            <label className="text-xs font-black text-hpsr-muted sm:col-span-2">Descreva o objetivo da solicitação
              <textarea name="flowDetails" required rows={3} placeholder="Explique exatamente o atendimento, procedimento ou orientação que você procura." className={`${fieldClass} mt-1.5 py-3`} />
            </label>
          )}
          <div className="sm:col-span-2 rounded-[16px] border border-amber-200 bg-amber-50 px-3.5 py-3">
            <p className="text-xs font-black text-amber-950">O envio abaixo é somente uma solicitação</p>
            <p className="mt-1 text-[11px] font-semibold leading-relaxed text-amber-900">Não existe escolha de data ou horário nesta etapa. Depois do aceite, aguarde o contato do médico responsável.</p>
          </div>
          <div className={`sm:col-span-2 rounded-[16px] border px-3.5 py-3 ${hasEmail ? "border-emerald-200 bg-emerald-50" : "border-blue-200 bg-blue-50"}`}>
            <p className={`text-xs font-black ${hasEmail ? "text-emerald-800" : "text-blue-900"}`}>{hasEmail ? "Contato por e-mail confirmado" : "ID do Discord necessário"}</p>
            <p className={`mt-1 text-[11px] font-semibold leading-relaxed ${hasEmail ? "text-emerald-700" : "text-blue-800"}`}>{hasEmail ? "O prontuário possui contato cadastrado. Mantenha-o atualizado e acompanhe o Discord: o médico fará o contato para combinar o dia e o horário." : "Este paciente não possui e-mail disponível no cadastro. Informe o ID numérico do Discord para que o médico consiga entrar em contato e combinar o atendimento."}</p>
          </div>
          {!hasEmail && (
            <label className="text-xs font-black text-hpsr-muted sm:col-span-2">ID do Discord para contato
              <input name="discordId" inputMode="numeric" pattern="[0-9]+" required value={discordId} onChange={(event) => setDiscordId(event.target.value.replace(/\D/g, ""))} placeholder="Somente números" className={`${fieldClass} mt-1.5`} />
              <span className="mt-1.5 block text-[11px] font-semibold leading-relaxed text-hpsr-muted">Use o ID da conta do Discord, não o nome de usuário ou apelido do servidor.</span>
            </label>
          )}
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
