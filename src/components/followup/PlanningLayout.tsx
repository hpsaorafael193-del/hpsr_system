import type { ReactNode } from "react";

export const planningInputClass = "hpsr-planning-input h-11 w-full rounded-[14px] border border-hpsr-border bg-white px-3.5 text-sm font-semibold text-hpsr-text outline-none transition focus:border-hpsr-wine";
export const planningTextAreaClass = `${planningInputClass} min-h-[112px] resize-y py-3 leading-relaxed`;
export const planningButtonClass = "hpsr-followup-button inline-flex min-h-10 items-center justify-center gap-2 rounded-[12px] border border-[#c8a992] bg-[#fff8f3] px-3.5 text-xs font-black text-hpsr-wine transition hover:bg-[#f6e5da] disabled:opacity-50";
export const planningPrimaryButtonClass = "hpsr-followup-button-primary inline-flex min-h-10 items-center justify-center gap-2 rounded-[12px] border border-hpsr-wine bg-hpsr-wine px-3.5 text-xs font-black text-white transition hover:opacity-90 disabled:opacity-50";
export const planningMainActionClass = "hpsr-obstetric-primary-action inline-flex min-h-[52px] w-full max-w-[390px] items-center justify-center gap-2 rounded-[17px] bg-hpsr-wine px-5 text-sm font-black text-white transition hover:opacity-90 disabled:opacity-50";

export function PlanningField({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="hpsr-planning-field grid min-w-0 gap-1.5"><span className="hpsr-planning-field-label text-[10px] font-black uppercase tracking-[.15em] text-hpsr-wineLight">{label}</span>{children}{hint && <span className="text-[11px] leading-relaxed text-hpsr-muted">{hint}</span>}</label>;
}

export function PlanningOverview({ icon, title, description, navigation }: { icon: ReactNode; title: string; description: string; navigation: ReactNode }) {
  return <section className="hpsr-obstetric-overview rounded-[22px] border border-[#e1c9b8] bg-[linear-gradient(120deg,#f8ecdf_0%,#f4e3d7_100%)] p-5 shadow-sm">
    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="hpsr-obstetric-icon hpsr-obstetric-icon-hero grid h-12 w-12 shrink-0 place-items-center rounded-[16px] bg-[linear-gradient(135deg,#672614,#2a0700)] text-white">{icon}</div>
        <div>
          <p className="hpsr-obstetric-accent-label text-[10px] font-black uppercase tracking-[.16em] text-hpsr-wineLight">Planejamento médico</p>
          <h2 className="mt-1 text-2xl font-black leading-tight text-hpsr-text">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-hpsr-muted">{description}</p>
        </div>
      </div>
      {navigation}
    </div>
  </section>;
}

export function PlanningSectionHeading({ icon, eyebrow, title, description, actions }: { icon: ReactNode; eyebrow: string; title: string; description: string; actions?: ReactNode }) {
  return <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
    <div className="flex items-center gap-3">
      <div className="hpsr-obstetric-icon grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-[linear-gradient(135deg,#672614,#2a0700)] text-white">{icon}</div>
      <div><p className="text-[10px] font-black uppercase tracking-[.16em] text-hpsr-wineLight">{eyebrow}</p><h3 className="text-lg font-black text-hpsr-text">{title}</h3><p className="text-sm text-hpsr-muted">{description}</p></div>
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>;
}

export function PlanningDefinition({ id, heading, summary, footer, children }: { id: string; heading: ReactNode; summary: ReactNode; footer: ReactNode; children: ReactNode }) {
  return <section id={id} className="hpsr-planning-panel hpsr-gestational-form min-w-0 rounded-[24px] border border-[#ad7665] p-4 shadow-[0_14px_34px_rgba(125,35,29,0.08)] sm:p-5">
    {heading}
    <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1040px)_minmax(240px,320px)] xl:items-stretch xl:justify-between">
      <div className="grid min-w-0 gap-5">{children}</div>
      {summary}
    </div>
    <div className="hpsr-followup-divider mt-6 flex flex-col items-center border-t border-[#d9c1b4] pt-5">{footer}</div>
  </section>;
}

export function PlanningSummary({ title, milestone, facts }: { title: string; milestone: ReactNode; facts: ReactNode }) {
  return <aside className="flex h-full min-h-[360px] w-full max-w-[320px] justify-self-end flex-col bg-transparent px-5 py-5 xl:min-h-0" aria-label="Resumo do acompanhamento">
    <div>
      <p className="hpsr-followup-summary-label text-[10px] font-black uppercase tracking-[.16em] text-[#9e5a72]">Resumo do acompanhamento</p>
      <h4 className="mt-1 text-lg font-black text-hpsr-text">{title}</h4>
      <p className="mt-1 text-sm leading-relaxed text-hpsr-muted">Visão rápida dos principais marcos deste acompanhamento.</p>
    </div>
    <div className="hpsr-followup-divider mt-5 flex flex-1 flex-col justify-between border-t border-[#dfc4cd] pt-5">
      <div>{milestone}</div>
      <dl className="hpsr-followup-divider mt-6 grid gap-4 border-t border-[#dfc4cd] py-5 text-sm sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">{facts}</dl>
    </div>
  </aside>;
}
