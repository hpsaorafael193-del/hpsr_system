"use client";

import { useMemo, useState } from "react";
import { ArrowRight, BellRing, CalendarClock, CheckCircle2, Clock3, HeartPulse, Loader2, RefreshCcw } from "lucide-react";

export type PatientFollowupSlot = {
  id: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  startsAt: string;
  endsAt: string;
};

export type PatientFollowupData = {
  followups: Array<{
    planId: string;
    linkType: "plan" | "assignment";
    doctorId: string;
    doctorName: string;
    specialty: string;
    frequency: string;
    status: string;
    startDate: string;
    endDate: string;
    totalConsultations: number;
    nextOccurrence: null | {
      id: string;
      plannedDate: string;
      status: string;
      scheduleState: "waiting" | "available" | "scheduled";
      scheduledAt: string;
      availableCount: number;
      availableSlots: PatientFollowupSlot[];
    };
  }>;
  agendaAvailableCount: number;
  scheduledCount: number;
  checkedAt?: string;
};


function dateTimeText(value: string) {
  if (!value) return "A definir";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
}

function slotDay(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "short", day: "2-digit", month: "2-digit" });
}

function slotTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
}


export function PatientFollowupSummaryPanel({
  data,
  loading,
  error,
  onOpenHours,
}: {
  data: PatientFollowupData | null;
  loading: boolean;
  error?: string;
  onOpenHours: () => void;
}) {
  return (
    <section className="rounded-[18px] border border-hpsr-border bg-white/90 p-3.5 sm:p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-hpsr-wine text-white"><HeartPulse size={18}/></span>
        <div className="min-w-0">
          <h3 className="text-base font-black text-hpsr-text">Seus médicos</h3>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-hpsr-muted">Aqui aparecem os médicos vinculados ao seu atendimento. Quando um deles publicar horários da sua especialidade, eles ficam em <strong className="text-hpsr-text">Horários do médico</strong>.</p>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="animate-spin text-hpsr-wine"/></div>
      ) : error ? (
        <p className="mt-3 rounded-[13px] border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-800">{error}</p>
      ) : data?.followups.length ? (
        <>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {data.followups.map((item) => {
              const scheduled = item.nextOccurrence?.scheduleState === "scheduled";
              return (
                <div key={item.planId} className="rounded-[14px] border border-hpsr-border bg-[#fffaf4] px-3.5 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">{item.specialty}</p>
                  <p className="mt-1 text-sm font-black text-hpsr-text">{item.doctorName}</p>
                  <p className="mt-1 text-[11px] font-semibold text-hpsr-muted">{item.frequency || "Acompanhamento ativo"}</p>
                  {scheduled && <p className="mt-2 flex items-center gap-1.5 text-[11px] font-black text-emerald-700"><CheckCircle2 size={13}/>{dateTimeText(item.nextOccurrence?.scheduledAt || "")}</p>}
                </div>
              );
            })}
          </div>
          {Boolean(data.agendaAvailableCount) && (
            <button type="button" onClick={onOpenHours} className="mt-3 inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-[12px] border border-blue-200 bg-blue-50 px-4 text-xs font-black text-blue-800 transition hover:bg-blue-100">Há novos horários publicados <ArrowRight size={14}/></button>
          )}
        </>
      ) : (
        <p className="mt-3 rounded-[13px] border border-dashed border-hpsr-border bg-[#fffaf4] p-4 text-center text-sm font-semibold text-hpsr-muted">Nenhum médico está vinculado a este paciente no momento.</p>
      )}
    </section>
  );
}

export function PatientFollowupsPanel({
  data,
  loading,
  error,
  passport,
  onRefresh,
}: {
  data: PatientFollowupData | null;
  loading: boolean;
  error?: string;
  passport: string;
  onRefresh: () => void;
}) {
  const [selectedByPlan, setSelectedByPlan] = useState<Record<string, string>>({});
  const [bookingPlanId, setBookingPlanId] = useState("");
  const [feedback, setFeedback] = useState<Record<string, { type: "error" | "success"; text: string }>>({});

  const slotById = useMemo(() => {
    const map = new Map<string, PatientFollowupSlot>();
    for (const followup of data?.followups || []) {
      for (const slot of followup.nextOccurrence?.availableSlots || []) map.set(slot.id, slot);
    }
    return map;
  }, [data]);

  async function book(planId: string, linkType: "plan" | "assignment", doctorId: string, specialty: string) {
    const slotId = selectedByPlan[planId];
    if (!slotId || !passport) return;
    setBookingPlanId(planId);
    setFeedback((current) => ({ ...current, [planId]: { type: "success", text: "" } }));
    try {
      const response = await fetch(`/api/paciente/reservar-horario?passport=${encodeURIComponent(passport)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, slotId, linkType, doctorId, specialty }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Não foi possível confirmar o horário.");
      const slot = slotById.get(slotId);
      setFeedback((current) => ({
        ...current,
        [planId]: {
          type: "success",
          text: slot ? `Horário confirmado para ${dateTimeText(slot.startsAt)}.` : "Horário confirmado.",
        },
      }));
      setSelectedByPlan((current) => ({ ...current, [planId]: "" }));
      onRefresh();
    } catch (caught) {
      setFeedback((current) => ({
        ...current,
        [planId]: { type: "error", text: caught instanceof Error ? caught.message : "Não foi possível confirmar o horário." },
      }));
      onRefresh();
    } finally {
      setBookingPlanId("");
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[18px] border border-hpsr-border bg-white/90 p-3.5 sm:p-4">
        <div className="flex flex-col gap-3 border-b border-hpsr-border/70 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-hpsr-wine text-white"><HeartPulse size={18}/></span>
            <div>
              <h3 className="text-base font-black text-hpsr-text">Horários do médico</h3>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-hpsr-muted"><strong className="text-hpsr-text">É aqui que os horários publicados pelo seu médico aparecem.</strong> Quando ele liberar uma nova agenda, escolha um horário e confirme por aqui.</p>
            </div>
          </div>
          <button type="button" onClick={onRefresh} className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-[10px] border border-hpsr-border bg-white px-3 text-[11px] font-black text-hpsr-wine"><RefreshCcw size={13}/> Atualizar</button>
        </div>

        {data?.agendaAvailableCount ? (
          <div className="mt-4 rounded-[17px] border-2 border-blue-300 bg-[linear-gradient(135deg,#eff7ff_0%,#dfeeff_100%)] p-4 shadow-[0_10px_24px_rgba(37,99,235,.08)]">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-blue-700 text-white"><BellRing size={18}/></span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.15em] text-blue-700">Horários disponíveis</p>
                <h4 className="mt-1 text-base font-black text-blue-950">Seu médico publicou novos horários</h4>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-blue-900">Escolha e confirme antes do dia do atendimento. Quando o dia chegar, os horários daquele dia deixam de aparecer para novas confirmações.</p>
              </div>
            </div>
          </div>
        ) : null}

        {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-hpsr-wine"/></div> : error ? <p className="mt-4 rounded-[14px] border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800">{error}</p> : data?.followups.length ? <div className="mt-4 grid gap-3">{data.followups.map((item) => {
          const next = item.nextOccurrence;
          const state = next?.scheduleState || "waiting";
          const availableSlots = next?.availableSlots || [];
          const selectedSlotId = selectedByPlan[item.planId] || "";
          const selectedSlot = availableSlots.find((slot) => slot.id === selectedSlotId) || null;
          const itemFeedback = feedback[item.planId];
          return (
            <article key={item.planId} className="rounded-[17px] border border-hpsr-border bg-[#fffaf4] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">{item.specialty}</p><h4 className="mt-1 text-base font-black text-hpsr-text">{item.doctorName}</h4></div>
                <span className={`w-fit rounded-full border px-3 py-1 text-[10px] font-black ${state === "scheduled" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : state === "available" ? "border-blue-200 bg-blue-50 text-blue-700" : "border-hpsr-border bg-white text-hpsr-wine"}`}>{state === "scheduled" ? "Horário confirmado" : state === "available" ? "Horários disponíveis" : "Aguardando nova agenda"}</span>
              </div>

              {state === "scheduled" && <div className="mt-3 rounded-[13px] border border-emerald-200 bg-emerald-50 p-3"><p className="text-xs font-black text-emerald-800">Horário já confirmado</p><p className="mt-1 text-[11px] font-semibold text-emerald-700">Veja este atendimento em <strong>Meus agendamentos</strong>.</p></div>}

              {state === "available" && (
                <div className="mt-3 rounded-[14px] border border-blue-200 bg-blue-50 p-3">
                  <p className="text-xs font-black text-blue-950">Escolha um horário</p>
                  <p className="mt-1 text-[11px] font-semibold leading-relaxed text-blue-900">Só aparecem dias futuros. No próprio dia do atendimento, aquele horário já não pode mais ser escolhido pelo Portal.</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {availableSlots.map((slot) => {
                      const active = selectedSlotId === slot.id;
                      return <button key={slot.id} type="button" onClick={() => setSelectedByPlan((current) => ({ ...current, [item.planId]: slot.id }))} className={`rounded-[12px] border px-3 py-2.5 text-left transition ${active ? "border-blue-700 bg-blue-700 text-white shadow-sm" : "border-blue-200 bg-white text-blue-950 hover:border-blue-400"}`}><span className="block text-[10px] font-black uppercase tracking-[.08em] opacity-75">{slotDay(slot.startsAt)}</span><span className="mt-1 flex items-center gap-1.5 text-sm font-black"><Clock3 size={14}/>{slotTime(slot.startsAt)}</span></button>;
                    })}
                  </div>
                  <button type="button" disabled={!selectedSlot || bookingPlanId === item.planId} onClick={() => void book(item.planId, item.linkType, item.doctorId, item.specialty)} className="mt-3 inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-[12px] bg-hpsr-wine px-4 text-sm font-black text-white disabled:opacity-50">{bookingPlanId === item.planId ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle2 size={16}/>}Confirmar horário</button>
                </div>
              )}

              {state === "waiting" && <p className="mt-3 rounded-[12px] border border-hpsr-border bg-white px-3 py-2 text-xs font-semibold leading-relaxed text-hpsr-muted">Nenhum horário disponível agora. Quando este médico publicar uma nova agenda para você, os horários vão aparecer aqui.</p>}
              {itemFeedback?.text && <p className={`mt-3 rounded-[12px] border px-3 py-2 text-xs font-bold ${itemFeedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>{itemFeedback.text}</p>}
            </article>
          );
        })}</div> : <p className="mt-4 rounded-[14px] border border-dashed border-hpsr-border bg-[#fffaf4] p-5 text-center text-sm font-semibold text-hpsr-muted">Nenhum médico está vinculado a este paciente no momento.</p>}
      </section>
    </div>
  );
}
