"use client";

import { CalendarDays, ClipboardList, FileText, FlaskConical, HeartHandshake, Stethoscope } from "lucide-react";
import { releasedReportExists, type ReleasedFollowup } from "@/lib/patient-followup-release";

export type PublicConsultation = ReleasedFollowup & {
  id: string;
  png_url: string | null;
  dynamic_png_available: boolean;
  released_at?: string;
};

function formattedDate(value?: string) {
  const date = (value || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date.split("-").reverse().join("/") : "Não informada";
}

function TextSection({ title, value, icon: Icon }: { title: string; value: string; icon: typeof FileText }) {
  if (!value.trim()) return null;
  return <section className="rounded-[14px] border border-[#e2cebd] bg-[#f8efe5] p-4">
    <h5 className="flex items-center gap-2 text-sm font-black text-[#623a2b]"><Icon size={17} aria-hidden="true" />{title}</h5>
    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-hpsr-text">{value}</p>
  </section>;
}

export function FollowupConsultationCard({ item, kind, first, generating, onDownload }: {
  item: PublicConsultation;
  kind: "gestacional" | "in_vitro";
  first: boolean;
  generating: boolean;
  onDownload: () => void;
}) {
  const hasReport = releasedReportExists(item);
  const hasExams = Boolean(item.exams_performed.trim() || item.exam_explanation.trim());
  const label = kind === "in_vitro" ? "Etapa" : "Consulta";
  return <details open={first} className="group overflow-hidden rounded-[16px] border border-[#d9c1ad] bg-[#f9f0e7] shadow-sm open:border-[#bf9b83]">
    <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 bg-[#eee0d2] p-4 marker:hidden [&::-webkit-details-marker]:hidden">
      <div className="min-w-0 flex-1">
        <p className="font-black text-hpsr-text">{label} {item.step_number || "—"}{item.marker ? ` · ${item.marker}` : item.title ? ` · ${item.title}` : ""}</p>
        <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-hpsr-muted"><CalendarDays size={14} aria-hidden="true" />{formattedDate(item.planned_date)} · Liberada pela equipe médica</p>
      </div>
      <span className={`rounded-full px-3 py-1 text-xs font-bold ${hasReport ? "bg-[#e0e9de] text-[#476b48]" : "bg-[#f5e6d1] text-[#7d583d]"}`}>{hasReport ? "Relatório disponível" : "Planejamento disponível"}</span>
      <span className="text-lg font-bold text-hpsr-wine group-open:rotate-180" aria-hidden="true">⌄</span>
    </summary>
    <div className="grid gap-4 p-4">
      {item.planned_text.trim() && <section className="rounded-[14px] border border-[#dfc9b8] bg-[#f4e7d9] p-4">
        <h5 className="flex items-center gap-2 text-sm font-black text-[#693e30]"><ClipboardList size={17} aria-hidden="true" />O que estava previsto</h5>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-hpsr-text">{item.planned_text}</p>
      </section>}
      {hasReport ? <div className="grid gap-3">
        <div className="border-b border-[#dbc5b5] pb-2"><h5 className="flex items-center gap-2 font-black text-hpsr-text"><Stethoscope size={18} aria-hidden="true" />Relatório após o atendimento</h5><p className="mt-1 text-xs text-hpsr-muted">Somente informações compartilhadas pela equipe médica.</p></div>
        <TextSection title="Resumo da consulta" value={item.evolution_text} icon={FileText} />
        {hasExams && <section className="rounded-[14px] border border-[#d8c1ad] bg-[#f2e7d9] p-4">
          <h5 className="flex items-center gap-2 text-sm font-black text-[#623a2b]"><FlaskConical size={17} aria-hidden="true" />Exames do atendimento</h5>
          {item.exams_performed.trim() && <div className="mt-3"><p className="text-xs font-black uppercase tracking-wider text-hpsr-wineLight">Exames realizados</p><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-hpsr-text">{item.exams_performed}</p></div>}
          {item.exam_explanation.trim() && <div className="mt-3 border-t border-[#d8c1ad] pt-3"><p className="text-xs font-black uppercase tracking-wider text-hpsr-wineLight">Resumo e explicação médica</p><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-hpsr-text">{item.exam_explanation}</p></div>}
        </section>}
        <TextSection title="Observações do médico para você" value={item.patient_observations} icon={HeartHandshake} />
        <TextSection title="Orientações e retorno" value={item.conduct_text} icon={ClipboardList} />
      </div> : <p className="rounded-xl border border-[#ead6c2] bg-[#f5eadc] p-3 text-sm text-hpsr-muted">O relatório pós-consulta ainda não foi compartilhado. Você pode consultar o planejamento liberado acima.</p>}
      {(item.dynamic_png_available || item.png_url) && <div className="flex flex-wrap gap-2 border-t border-[#dbc5b5] pt-3">
        {item.dynamic_png_available && <button type="button" onClick={onDownload} disabled={generating} className="rounded-[10px] border border-hpsr-wine bg-[#f4e5d7] px-3 py-2 text-sm font-black text-hpsr-wine disabled:opacity-50">{generating ? "Gerando PNG..." : "Baixar PNG"}</button>}
        {item.png_url && !item.dynamic_png_available && <a href={item.png_url + "&download=1"} className="rounded-[10px] border border-hpsr-wine bg-[#f4e5d7] px-3 py-2 text-sm font-black text-hpsr-wine">Visualizar / baixar documento antigo</a>}
      </div>}
    </div>
  </details>;
}
