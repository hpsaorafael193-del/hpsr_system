"use client";

import { useEffect, useState } from "react";

type ConsultationStep = { number: number; title: string; description?: string; planned_text?: string; marker?: string; week: number; date: string };
type IndividualRelease = {
  id: string;
  step_number: number;
  planned_date: string;
  marker?: string;
  title?: string;
  planned_text?: string;
  evolution_text?: string;
  conduct_text?: string;
  png_url: string | null;
  released_at?: string;
};
type Plan = {
  id: string;
  patient_name: string;
  doctor_name: string;
  start_date: string | null;
  end_date: string | null;
  planning_notes: string | null;
  consultation_schedule: ConsultationStep[] | null;
  total_consultations: number | null;
  plan_type: "gestacional" | "in_vitro";
  png_url: string | null;
  individuals: IndividualRelease[];
};

const dateText = (value: string | null | undefined) => value ? value.slice(0, 10).split("-").reverse().join("/") : "Não informada";

export function PatientGestationalPlansPanel({ passport, onSessionExpired, planType }: { passport: string; onSessionExpired: () => void; planType?: "gestacional" | "in_vitro" }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setPlans([]); setError(""); setLoading(true);
    fetch(`/api/paciente/planejamentos-gestacionais?passport=${encodeURIComponent(passport)}`, { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) { onSessionExpired(); return null; }
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Erro ao carregar os planejamentos.");
        return payload;
      })
      .then((payload) => { if (active && payload) setPlans((payload.plans || []).filter((plan: Plan) => !planType || plan.plan_type === planType)); })
      .catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : "Erro ao carregar os planejamentos."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [passport, onSessionExpired, planType]);

  return <section className="rounded-[18px] border border-hpsr-border bg-[#f5ece3] p-4">
    <h3 className="text-lg font-black text-hpsr-text">{planType === "in_vitro" ? "Planejamentos de fertilização in vitro" : "Planejamento gestacional"}</h3>
    <p className="mt-1 text-sm text-hpsr-muted">Somente os planejamentos e consultas liberados pela médica responsável aparecem aqui.</p>
    {loading ? <p className="mt-4 text-sm">Carregando...</p> : error ? <p className="mt-4 text-sm text-red-700">{error}</p> : !plans.length ? <p className="mt-4 text-sm text-hpsr-muted">Nenhum planejamento liberado para esta paciente.</p> :
      <div className="mt-4 grid gap-4">{plans.map((plan) => <article key={plan.id} className="rounded-[16px] border border-hpsr-border bg-[#eee3d8] p-4">
        <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-black text-hpsr-text">{plan.patient_name}</p><p className="mt-1 text-xs font-black text-hpsr-wine">{plan.plan_type === "in_vitro" ? "Fertilização in vitro" : "Planejamento gestacional"}</p><p className="mt-1 text-xs text-hpsr-muted">Médica responsável: {plan.doctor_name}</p></div></div>

        {plan.png_url && <div className="mt-4 rounded-[14px] border border-[#e3cdbb] bg-[#f5e8dc] p-3"><p className="mb-2 text-xs font-black uppercase tracking-[.12em] text-hpsr-wineLight">Planejamento integral liberado</p><img src={plan.png_url} alt={`Planejamento ${plan.plan_type === "in_vitro" ? "FIV" : "gestacional"} integral liberado`} className="w-full rounded border border-[#e3cdbb]" /><a href={`${plan.png_url}&download=1`} className="mt-2 inline-block rounded-[10px] bg-hpsr-wine px-3 py-2 text-sm font-black text-white">Visualizar / baixar integral</a>{plan.start_date && plan.end_date && <div className="mt-3 grid gap-2 sm:grid-cols-2"><p className="text-sm"><strong>Início:</strong> {dateText(plan.start_date)}</p><p className="text-sm"><strong>Final de referência:</strong> {dateText(plan.end_date)}</p></div>}{plan.planning_notes && <div className="mt-3 rounded-[12px] bg-white p-3"><p className="text-xs font-black uppercase text-hpsr-wineLight">Observações gerais</p><p className="mt-1 whitespace-pre-wrap text-sm text-hpsr-text">{plan.planning_notes}</p></div>}</div>}

        {plan.individuals?.length > 0 && <div className="mt-4"><p className="text-xs font-black uppercase tracking-[.12em] text-hpsr-wineLight">Consultas/etapas liberadas individualmente</p><div className="mt-2 grid gap-3">{plan.individuals.map((item) => <div key={item.id} className="rounded-[14px] border border-[#e3cdbb] bg-[#faf1e7] p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-sm font-black text-hpsr-text">Consulta {item.step_number}{item.marker ? ` · ${item.marker}` : ""}</p><p className="mt-0.5 text-xs font-bold text-hpsr-wine">{dateText(item.planned_date)}{item.title ? ` · ${item.title}` : ""}</p></div></div>{item.planned_text && <div className="mt-3"><p className="text-[10px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">Planejamento previsto</p><p className="mt-1 whitespace-pre-wrap text-sm text-hpsr-text">{item.planned_text}</p></div>}{item.evolution_text && <div className="mt-3"><p className="text-[10px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">Evolução / Observações médicas</p><p className="mt-1 whitespace-pre-wrap text-sm text-hpsr-text">{item.evolution_text}</p></div>}{item.conduct_text && <div className="mt-3"><p className="text-[10px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">Conduta / Retorno</p><p className="mt-1 whitespace-pre-wrap text-sm text-hpsr-text">{item.conduct_text}</p></div>}{item.png_url && <div className="mt-3"><img src={item.png_url} alt={`Consulta ${item.step_number} liberada`} className="w-full rounded border border-[#e3cdbb] bg-white" /><a href={`${item.png_url}&download=1`} className="mt-2 inline-block rounded-[10px] border border-hpsr-wine px-3 py-2 text-sm font-black text-hpsr-wine">Visualizar / baixar consulta</a></div>}</div>)}</div></div>}
      </article>)}</div>}
  </section>;
}
