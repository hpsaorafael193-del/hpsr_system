"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Download, Eye, FileText, Loader2 } from "lucide-react";

type ConsultationStep = { number: number; title: string; description?: string; planned_text?: string; marker?: string; week: number; date: string };
type IndividualRelease = {
  id: string;
  patient_name?: string;
  doctor_name?: string;
  step_number: number;
  planned_date: string;
  marker?: string;
  title?: string;
  planned_text?: string;
  evolution_text?: string;
  exams_performed?: string;
  exam_explanation?: string;
  patient_observations?: string;
  png_url: string | null;
  dynamic_available: boolean;
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
  dynamic_available: boolean;
  individuals: IndividualRelease[];
};

const dateText = (value: string | null | undefined) => value ? value.slice(0, 10).split("-").reverse().join("/") : "A definir";

async function renderPlanBlob(plan: Plan, passport: string, item?: IndividualRelease) {
  const { renderIntegralPlanning, renderIndividualPlanning } = await import("@/lib/obstetric-document");
  if (item) {
    return renderIndividualPlanning({
      kind: plan.plan_type,
      patient: item.patient_name || plan.patient_name,
      passport,
      doctor: item.doctor_name || plan.doctor_name,
      step: {
        number: item.step_number,
        title: item.title || "",
        marker: item.marker || "",
        date: item.planned_date,
        planned_text: item.planned_text || "",
        description: item.planned_text || "",
        week: item.step_number,
      },
      evolution: [item.evolution_text, item.patient_observations && `Observações: ${item.patient_observations}`].filter(Boolean).join("\n"),
      exams: [item.exams_performed && `Exames: ${item.exams_performed}`, item.exam_explanation && `Resultados: ${item.exam_explanation}`].filter(Boolean).join("\n"),
      observation: "",
    });
  }
  return renderIntegralPlanning({
    kind: plan.plan_type,
    patient: plan.patient_name,
    passport,
    doctor: plan.doctor_name,
    steps: (plan.consultation_schedule || []).map((step) => ({
      number: step.number,
      title: step.title || "",
      description: step.description || "",
      planned_text: step.planned_text || step.description || "",
      marker: step.marker || "",
      week: step.week || step.number,
      date: step.date,
    })),
    referenceDate: plan.end_date || "",
  });
}

export function PatientGestationalPlansPanel({ passport, onSessionExpired, planType }: { passport: string; onSessionExpired: () => void; planType?: "gestacional" | "in_vitro" }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState("");
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [previewBusy, setPreviewBusy] = useState(false);

  const previewEntries = useMemo(() => {
    const entries: Array<{ key: string; plan: Plan; item?: IndividualRelease }> = [];
    for (const plan of plans) {
      if (plan.dynamic_available) entries.push({ key: `${plan.id}:integral`, plan });
      for (const item of plan.individuals || []) if (item.dynamic_available) entries.push({ key: `${plan.id}:${item.id}`, plan, item });
    }
    return entries;
  }, [plans]);

  useEffect(() => {
    let cancelled = false;
    const generated: string[] = [];
    if (!previewEntries.length) { setPreviewUrls({}); return; }
    setPreviewUrls({});
    setPreviewBusy(true);
    void (async () => {
      const next: Record<string, string> = {};
      for (const entry of previewEntries) {
        try {
          const blob = await renderPlanBlob(entry.plan, passport, entry.item);
          if (cancelled) break;
          const url = URL.createObjectURL(blob);
          generated.push(url);
          next[entry.key] = url;
        } catch {
          // Se a prévia dinâmica falhar, o restante do acompanhamento continua disponível.
        }
      }
      if (!cancelled) setPreviewUrls(next);
      if (!cancelled) setPreviewBusy(false);
    })();
    return () => {
      cancelled = true;
      generated.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [passport, previewEntries]);

  async function downloadDynamicPng(plan: Plan, item?: IndividualRelease) {
    const key = `${plan.id}:${item?.id || "integral"}`;
    setGenerating(key);
    try {
      const url = previewUrls[key];
      if (!url) throw new Error("Aguarde a pré-visualização ficar pronta antes de baixar.");
      const link = document.createElement("a");
      link.href = url;
      link.download = `planejamento-${plan.plan_type}-${item ? `${plan.plan_type === "in_vitro" ? "etapa" : "consulta"}-${item.step_number}` : "integral"}.png`;
      document.body.append(link);
      link.click();
      link.remove();
      // The preview effect owns this URL and its cleanup.
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível gerar o PNG solicitado.");
    } finally {
      setGenerating("");
    }
  }

  useEffect(() => {
    let active = true;
    let lastFetch = 0;
    async function load(initial = false) {
      if (!initial && Date.now() - lastFetch < 10000) return;
      lastFetch = Date.now();
      if (initial) { setPlans([]); setError(""); setLoading(true); }
      try {
        const response = await fetch(`/api/paciente/planejamentos-gestacionais?passport=${encodeURIComponent(passport)}`, { cache: "no-store" });
        if (response.status === 401) { if (active) onSessionExpired(); return; }
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Erro ao carregar os planejamentos.");
        if (active) { setPlans((payload.plans || []).filter((plan: Plan) => !planType || plan.plan_type === planType)); setError(""); }
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : "Erro ao carregar os planejamentos.");
      } finally { if (active) setLoading(false); }
    }
    void load(true);
    const onFocus = () => { void load(); };
    const onVisibility = () => { if (document.visibilityState === "visible") void load(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { active = false; window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onVisibility); };
  }, [passport, onSessionExpired, planType]);

  return (
    <section className="space-y-5">
      {loading ? (
        <div className="flex min-h-[180px] items-center justify-center rounded-[18px] border border-[#ddcfc2] bg-[#fbf7f1]"><Loader2 className="animate-spin text-[#65331f]"/></div>
      ) : error ? (
        <p className="rounded-[14px] border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>
      ) : !plans.length ? (
        <div className="rounded-[18px] border border-dashed border-[#d7c8ba] bg-[#fbf7f1] px-5 py-10 text-center"><FileText className="mx-auto text-[#672614]"/><p className="mt-3 text-sm font-bold text-[#4e291c]">Nenhum planejamento liberado ainda</p><p className="mt-1 text-xs text-[#82736a]">Quando a equipe liberar seu planejamento, ele aparecerá aqui.</p></div>
      ) : plans.map((plan) => {
        const integralKey = `${plan.id}:integral`;
        const integralPreview = previewUrls[integralKey];
        const orderedIndividuals = [...(plan.individuals || [])].sort((a,b) => (a.planned_date || "").localeCompare(b.planned_date || ""));
        const today = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
        const currentItem = orderedIndividuals.find((item) => (item.planned_date || "") >= today) || orderedIndividuals[orderedIndividuals.length - 1];
        const currentKey = currentItem ? `${plan.id}:${currentItem.id}` : "";
        const currentPreview = currentKey ? previewUrls[currentKey] : "";
        return (
          <article key={plan.id} className="overflow-hidden rounded-[20px] border border-[#ddcfc2] bg-[#f8f3ec]">
            <header className="flex flex-col gap-3 border-b border-[#ddcfc2] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[.14em] text-[#927566]">{plan.plan_type === "in_vitro" ? "Fertilização in vitro" : "Gestação"}</p>
                <h3 className="mt-1 text-lg font-bold text-[#4e291c]">Seu planejamento</h3>
                <p className="mt-1 text-xs text-[#82736a]">Responsável: {plan.doctor_name}</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-[#6f625a]"><span className="inline-flex items-center gap-1.5"><CalendarDays size={14}/> {dateText(plan.start_date)}</span>{plan.end_date && <span>até {dateText(plan.end_date)}</span>}</div>
            </header>

            <div className="p-4 sm:p-5">
              {currentItem && <section className="mb-5"><div className="mb-3 flex items-end justify-between gap-3"><div><p className="text-[11px] font-black uppercase tracking-[.14em] text-[#927566]">{plan.plan_type === "in_vitro" ? "Etapa atual" : "Consulta atual"}</p><h4 className="mt-1 text-base font-bold text-[#4e291c]">{currentItem.marker || currentItem.title || `${plan.plan_type === "in_vitro" ? "Etapa" : "Consulta"} ${currentItem.step_number}`}</h4><p className="mt-1 text-xs text-[#82736a]">{dateText(currentItem.planned_date)}</p></div></div><div className="rounded-[16px] border border-[#d9c7b7] bg-white p-2 shadow-[0_12px_28px_rgba(70,43,29,.06)]">{currentItem.dynamic_available ? (currentPreview ? <img src={currentPreview} alt="Planejamento da consulta atual" className="mx-auto block h-auto max-h-[680px] w-full object-contain"/> : <div className="flex min-h-[280px] items-center justify-center text-sm font-semibold text-[#82736a]"><Loader2 size={18} className="mr-2 animate-spin"/> Preparando planejamento atual...</div>) : currentItem.png_url ? <img src={currentItem.png_url} alt="Planejamento da consulta atual" className="mx-auto block h-auto max-h-[680px] w-full object-contain"/> : <p className="py-8 text-center text-xs text-[#82736a]">Visualização indisponível.</p>}</div></section>}

              {(plan.dynamic_available || plan.png_url) && <details className="rounded-[14px] border border-[#d9c7b7] bg-[#fbf7f1]"><summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-black text-[#65331f]"><span>Ver planejamento integral</span><Eye size={16}/></summary><div className="border-t border-[#d9c7b7] p-3">{plan.dynamic_available ? (integralPreview ? <img src={integralPreview} alt={`Planejamento ${plan.plan_type === "in_vitro" ? "de fertilização in vitro" : "gestacional"}`} className="mx-auto block h-auto max-h-[680px] w-full object-contain"/> : <div className="flex min-h-[320px] items-center justify-center text-sm font-semibold text-[#82736a]"><Loader2 size={18} className="mr-2 animate-spin"/> Preparando visualização...</div>) : plan.png_url ? <img src={plan.png_url} alt="Planejamento integral" className="mx-auto block h-auto max-h-[680px] w-full object-contain"/> : null}<div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="text-xs font-semibold text-[#82736a]">O planejamento integral aparece somente quando foi liberado pela equipe médica. Nenhuma imagem nova é salva no banco.</p>{plan.dynamic_available ? <button type="button" disabled={generating !== "" || !integralPreview} onClick={() => void downloadDynamicPng(plan)} className="inline-flex min-h-[40px] items-center gap-2 rounded-[8px] border border-[#6b3a26] px-3 text-xs font-black text-[#65331f] disabled:opacity-50"><Download size={15}/>{generating === integralKey ? "Gerando..." : "Baixar PNG"}</button> : null}</div></div></details>}

              {plan.individuals?.length > 0 && (
                <div className="mt-6 border-t border-[#ddcfc2] pt-5">
                  <div className="mb-3"><p className="text-[11px] font-black uppercase tracking-[.14em] text-[#927566]">Etapas liberadas</p><p className="mt-1 text-xs text-[#82736a]">Abra somente a consulta ou etapa que você quer consultar.</p></div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {plan.individuals.map((item) => {
                      const key = `${plan.id}:${item.id}`;
                      const preview = previewUrls[key];
                      return <details key={item.id} className="group rounded-[14px] border border-[#ddcfc2] bg-[#fbf7f1] open:md:col-span-2">
                        <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#e9e1d8] text-sm font-black text-[#672614]">{item.step_number}</span><span className="min-w-0 flex-1"><strong className="block truncate text-sm text-[#4e291c]">{item.marker || item.title || `${plan.plan_type === "in_vitro" ? "Etapa" : "Consulta"} ${item.step_number}`}</strong><span className="mt-0.5 block text-xs text-[#82736a]">{dateText(item.planned_date)}</span></span><Eye size={16} className="text-[#672614]"/></summary>
                        <div className="border-t border-[#ddcfc2] p-3">
                          {item.dynamic_available ? (preview ? <img src={preview} alt={`${plan.plan_type === "in_vitro" ? "Etapa" : "Consulta"} ${item.step_number}`} className="mx-auto block h-auto max-h-[640px] w-full object-contain"/> : <div className="flex min-h-[240px] items-center justify-center text-xs text-[#82736a]"><Loader2 size={16} className="mr-2 animate-spin"/> Preparando visualização...</div>) : item.png_url ? <img src={item.png_url} alt={`${plan.plan_type === "in_vitro" ? "Etapa" : "Consulta"} ${item.step_number}`} className="mx-auto block h-auto max-h-[640px] w-full object-contain"/> : <p className="py-6 text-center text-xs text-[#82736a]">Visualização indisponível.</p>}
                          {item.dynamic_available && <div className="mt-3 text-right"><button type="button" disabled={generating !== "" || !preview} onClick={() => void downloadDynamicPng(plan, item)} className="inline-flex min-h-[38px] items-center gap-2 rounded-[8px] border border-[#6b3a26] px-3 text-xs font-black text-[#65331f] disabled:opacity-50"><Download size={14}/>{generating === key ? "Gerando..." : "Baixar PNG"}</button></div>}
                        </div>
                      </details>;
                    })}
                  </div>
                </div>
              )}
              {previewBusy && previewEntries.length > 1 && <span className="sr-only">Preparando prévias dos planejamentos.</span>}
            </div>
          </article>
        );
      })}
    </section>
  );
}
