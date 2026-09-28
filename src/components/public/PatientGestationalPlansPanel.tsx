"use client";

import { useEffect, useState } from "react";

type ConsultationStep = { number: number; title: string; description: string; week: number; date: string };
type Plan = { id: string; patient_name: string; doctor_name: string; start_date: string; end_date: string | null; planning_notes: string | null; consultation_schedule: ConsultationStep[] | null; total_consultations: number | null; plan_type: "gestacional" | "in_vitro"; png_url: string | null };
const dateText = (value: string | null) => value ? value.split("-").reverse().join("/") : "Não informada";

export function PatientGestationalPlansPanel({ passport, onSessionExpired }: { passport: string; onSessionExpired: () => void }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setPlans([]);
    setError("");
    setLoading(true);
    fetch(`/api/paciente/planejamentos-gestacionais?passport=${encodeURIComponent(passport)}`, { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) { onSessionExpired(); return null; }
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Erro ao carregar os planejamentos.");
        return payload;
      })
      .then((payload) => { if (active && payload) setPlans(payload.plans || []); })
      .catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : "Erro ao carregar os planejamentos."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [passport, onSessionExpired]);
  return <section className="rounded-[18px] border border-hpsr-border bg-white p-4">
    <h3 className="text-lg font-black text-hpsr-text">Planejamentos gestacional e in vitro</h3>
    <p className="mt-1 text-sm text-hpsr-muted">Planejamentos liberados pela médica responsável.</p>
    {loading ? <p className="mt-4 text-sm">Carregando...</p> : error ? <p className="mt-4 text-sm text-red-700">{error}</p> : !plans.length ? <p className="mt-4 text-sm text-hpsr-muted">Nenhum planejamento liberado para esta paciente.</p> :
      <div className="mt-4 grid gap-3">{plans.map((plan) => <article key={plan.id} className="rounded-[14px] border border-hpsr-border bg-[#fffaf8] p-4">
        <p className="font-black text-hpsr-text">{plan.patient_name}</p><p className="mt-1 text-xs font-black text-hpsr-wine">{plan.plan_type === "in_vitro" ? "Planejamento in vitro" : "Planejamento gestacional"}</p>
        <p className="mt-1 text-xs text-hpsr-muted">Médica responsável: {plan.doctor_name}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2"><p className="text-sm"><strong>Início:</strong> {dateText(plan.start_date)}</p><p className="text-sm"><strong>Final:</strong> {dateText(plan.end_date)}</p></div>
        {plan.png_url && <div className="mt-3 rounded-[12px] border border-[#e3cdbb] bg-[#f5e8dc] p-3"><img src={plan.png_url} alt={`Planejamento ${plan.plan_type === "in_vitro" ? "FIV" : "gestacional"} liberado`} className="w-full rounded border border-[#e3cdbb]" /><a href={`${plan.png_url}&download=1`} className="mt-2 inline-block rounded-[10px] bg-hpsr-wine px-3 py-2 text-sm font-black text-white">Visualizar / baixar PNG</a></div>}
        {plan.consultation_schedule?.length ? <div className="mt-3 grid gap-2">{plan.consultation_schedule.map((item) => <div key={item.number} className="rounded-[12px] border border-[#e3cdbb] bg-[#faf1e7] p-3"><p className="text-sm font-black text-hpsr-text">{plan.plan_type !== "in_vitro" && item.title.toLowerCase().includes("parto") ? "Parto (previsão)" : `Consulta ${item.number} · ${item.title}`}</p><p className="text-xs font-bold text-hpsr-wine">{dateText(item.date)} · Semana {item.week} do planejamento</p><p className="mt-1 text-sm text-hpsr-text">{item.description}</p></div>)}</div> : null}
        {plan.planning_notes && <div className="mt-3 rounded-[12px] bg-white p-3"><p className="text-xs font-black uppercase text-hpsr-wineLight">Observações</p><p className="mt-1 whitespace-pre-wrap text-sm text-hpsr-text">{plan.planning_notes}</p></div>}
      </article>)}</div>}
  </section>;
}
