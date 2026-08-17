"use client";

import { BellRing, CalendarClock, CheckCircle2, HeartPulse, Loader2, RefreshCcw } from "lucide-react";

export type PatientFollowupData = {
  followups: Array<{
    planId: string;
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
    };
  }>;
  agendaAvailableCount: number;
  scheduledCount: number;
  checkedAt?: string;
};

function dateText(value: string) {
  if (!value) return "A definir";
  const date = value.includes("T") ? new Date(value) : new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function dateTimeText(value: string) {
  if (!value) return "A definir";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
}

export function PatientFollowupsPanel({ data, loading, error, onRefresh }: { data: PatientFollowupData | null; loading: boolean; error?: string; onRefresh: () => void }) {
  return (
    <div className="space-y-4">
      <section className="rounded-[18px] border border-hpsr-border bg-white/90 p-3.5 sm:p-4">
        <div className="flex flex-col gap-3 border-b border-hpsr-border/70 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-hpsr-wine text-white"><HeartPulse size={18}/></span>
            <div><h3 className="text-base font-black text-hpsr-text">Meus acompanhamentos</h3><p className="mt-1 text-xs font-semibold leading-relaxed text-hpsr-muted">Aqui ficam os atendimentos que seu médico já acompanha. Você não precisa pedir um novo retorno pelo Portal.</p></div>
          </div>
          <button type="button" onClick={onRefresh} className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-[10px] border border-hpsr-border bg-white px-3 text-[11px] font-black text-hpsr-wine"><RefreshCcw size={13}/> Atualizar</button>
        </div>

        {data?.agendaAvailableCount ? <div className="mt-4 rounded-[17px] border-2 border-blue-300 bg-[linear-gradient(135deg,#eff7ff_0%,#dfeeff_100%)] p-4 shadow-[0_10px_24px_rgba(37,99,235,.08)]"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-blue-700 text-white"><BellRing size={18}/></span><div><p className="text-[10px] font-black uppercase tracking-[.15em] text-blue-700">Agenda disponível</p><h4 className="mt-1 text-base font-black text-blue-950">Há atualização em {data.agendaAvailableCount} acompanhamento{data.agendaAvailableCount === 1 ? "" : "s"}</h4><p className="mt-1 text-xs font-semibold leading-relaxed text-blue-900">Seu médico atualizou a agenda. Você não precisa escolher um horário aqui; aguarde a definição do médico.</p></div></div></div> : null}

        {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-hpsr-wine"/></div> : error ? <p className="mt-4 rounded-[14px] border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800">{error}</p> : data?.followups.length ? <div className="mt-4 grid gap-3">{data.followups.map((item) => {
          const next = item.nextOccurrence;
          const state = next?.scheduleState || "waiting";
          return <article key={item.planId} className="rounded-[17px] border border-hpsr-border bg-[#fffaf4] p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">{item.specialty}</p><h4 className="mt-1 text-base font-black text-hpsr-text">{item.doctorName}</h4><p className="mt-1 text-xs font-semibold text-hpsr-muted">{item.frequency || "Acompanhamento clínico"}</p></div><span className={`w-fit rounded-full border px-3 py-1 text-[10px] font-black ${state === "scheduled" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : state === "available" ? "border-blue-200 bg-blue-50 text-blue-700" : "border-hpsr-border bg-white text-hpsr-wine"}`}>{state === "scheduled" ? "Horário definido" : state === "available" ? "Agenda disponível" : "Aguardando médico"}</span></div><div className="mt-3 grid gap-2 sm:grid-cols-2"><div className="rounded-[13px] border border-hpsr-border bg-white p-3"><p className="text-[10px] font-black uppercase tracking-[.12em] text-hpsr-muted">Próximo acompanhamento</p><p className="mt-1 text-sm font-black text-hpsr-text">{next ? dateText(next.plannedDate) : "Ainda não definido"}</p></div><div className="rounded-[13px] border border-hpsr-border bg-white p-3"><p className="text-[10px] font-black uppercase tracking-[.12em] text-hpsr-muted">Situação</p>{state === "scheduled" ? <p className="mt-1 flex items-center gap-2 text-sm font-black text-emerald-700"><CheckCircle2 size={15}/>{dateTimeText(next?.scheduledAt || "")}</p> : state === "available" ? <p className="mt-1 flex items-center gap-2 text-sm font-black text-blue-700"><CalendarClock size={15}/>Agenda liberada pelo médico</p> : <p className="mt-1 text-sm font-black text-hpsr-text">Aguardando definição do médico</p>}</div></div>{state === "available" && <p className="mt-3 rounded-[12px] border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold leading-relaxed text-blue-900">A agenda foi atualizada. O médico ainda vai definir o horário e o Portal será atualizado quando isso acontecer.</p>}</article>;
        })}</div> : <p className="mt-4 rounded-[14px] border border-dashed border-hpsr-border bg-[#fffaf4] p-5 text-center text-sm font-semibold text-hpsr-muted">Nenhum acompanhamento ativo no momento.</p>}
      </section>
    </div>
  );
}
