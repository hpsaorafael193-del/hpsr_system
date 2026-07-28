"use client";

import { Activity, Baby, CalendarDays, Clock3, Gauge, HeartPulse, ShieldCheck, Sparkles, Stethoscope } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { usePatientSelection } from "@/components/patients/PatientSelectionProvider";
import { StyledSelect } from "@/components/ui/StyledSelect";

const inputClass = "h-11 w-full rounded-[14px] border border-hpsr-border bg-white px-3.5 text-sm font-semibold text-hpsr-text outline-none transition focus:border-hpsr-wine";
const cardClass = "rounded-[18px] border border-hpsr-border bg-white";
const TOTAL_RP_WEEKS = 40;
const DEFAULT_REAL_DURATION_DAYS = 60;

function addDays(dateValue: string, days: number) {
  if (!dateValue) return "";
  const date = new Date(`${dateValue}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDate(dateValue: string) {
  if (!dateValue) return "—";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(new Date(`${dateValue}T12:00:00`));
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[10px] font-black uppercase tracking-[.15em] text-hpsr-wineLight">{label}</span>
      {children}
      {hint && <span className="text-[11px] leading-relaxed text-hpsr-muted">{hint}</span>}
    </label>
  );
}

function MetricCard({ icon, label, value, tone = "default" }: { icon: React.ReactNode; label: string; value: string; tone?: "default" | "highlight" }) {
  return (
    <div className={`rounded-[18px] border border-hpsr-border p-4 ${tone === "highlight" ? "bg-[#fff7ef]" : "bg-white"}`}>
      <div className="flex items-center justify-between gap-3">
        <div className={`grid h-10 w-10 place-items-center rounded-[12px] ${tone === "highlight" ? "bg-hpsr-wine text-white" : "bg-[#f7e9dc] text-hpsr-wine"}`}>
          {icon}
        </div>
        <span className="rounded-full border border-hpsr-border bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">Indicador</span>
      </div>
      <p className="mt-4 text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">{label}</p>
      <p className="mt-1 text-lg font-black text-hpsr-text md:text-[1.35rem]">{value}</p>
    </div>
  );
}

export default function ObstetricianPage() {
  const { patients, selectedPassport, selectedPatient, selectPatient, loading } = usePatientSelection();
  const [currentWeek, setCurrentWeek] = useState(1);
  const [referenceDate, setReferenceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [realDurationDays, setRealDurationDays] = useState(DEFAULT_REAL_DURATION_DAYS);

  const calculation = useMemo(() => {
    const safeWeek = Math.max(1, Math.min(TOTAL_RP_WEEKS, Number(currentWeek) || 1));
    const safeDuration = Math.max(1, Math.min(180, Number(realDurationDays) || DEFAULT_REAL_DURATION_DAYS));
    const progressRatio = safeWeek / TOTAL_RP_WEEKS;
    const elapsedRealDays = Math.round(safeDuration * progressRatio);
    const remainingRealDays = Math.max(0, safeDuration - elapsedRealDays);
    const estimatedEndDate = addDays(referenceDate, remainingRealDays);
    const realDaysPerRpWeek = safeDuration / TOTAL_RP_WEEKS;

    return {
      safeWeek,
      safeDuration,
      progress: Math.round(progressRatio * 100),
      elapsedRealDays,
      remainingRealDays,
      estimatedEndDate,
      realDaysPerRpWeek,
    };
  }, [currentWeek, realDurationDays, referenceDate]);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Especialidade médica"
        title="Obstetra"
        description="Calculadora gestacional para converter a evolução da gestação no RP para o período correspondente em dias reais."
        compact
      />

      <section className="relative overflow-hidden rounded-[22px] border border-[#ead4d5] bg-[linear-gradient(135deg,#fff9f7_0%,#f9eeee_48%,#f5e4df_100%)] shadow-sm">
        <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full border-[26px] border-white/40" />
        <div className="pointer-events-none absolute right-12 top-7 h-16 w-16 rounded-full border border-[#d9aeb0]/40 bg-white/20" />

        <div className="relative grid gap-4 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e5c5c6] bg-white/75 px-2.5 py-1 text-[9px] font-black uppercase tracking-[.16em] text-hpsr-wineLight">
                <Baby size={12} /> Cuidado materno-fetal
              </span>
              <span className="rounded-full border border-[#e5c5c6] bg-white/65 px-2.5 py-1 text-[9px] font-black uppercase tracking-[.16em] text-hpsr-wineLight">
                Pré-natal · 40 semanas RP
              </span>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-hpsr-wine text-white shadow-sm ring-4 ring-white/55">
                <HeartPulse size={22} />
                <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border-2 border-[#f7e9e5] bg-white text-hpsr-wine">
                  <Baby size={11} />
                </span>
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-black leading-tight text-hpsr-text md:text-[1.65rem]">Acompanhamento gestacional</h2>
                <p className="mt-1 max-w-3xl text-sm leading-relaxed text-hpsr-muted">
                  Conversão da idade gestacional, evolução por trimestre e estimativa do período restante para o planejamento obstétrico.
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                ["1º trimestre", "1–12 sem."],
                ["2º trimestre", "13–27 sem."],
                ["3º trimestre", "28–40 sem."],
              ].map(([label, range], index) => {
                const active = calculation.safeWeek <= 12 ? index === 0 : calculation.safeWeek <= 27 ? index === 1 : index === 2;
                return (
                  <div key={label} className={`rounded-[13px] border px-3 py-2 ${active ? "border-hpsr-wine/35 bg-white shadow-sm" : "border-white/55 bg-white/35"}`}>
                    <p className={`text-[9px] font-black uppercase tracking-[.12em] ${active ? "text-hpsr-wine" : "text-hpsr-muted"}`}>{label}</p>
                    <p className="mt-0.5 text-xs font-bold text-hpsr-text">{range}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[18px] border border-[#e5c5c6] bg-white/88 p-3.5 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[.15em] text-hpsr-wineLight">Paciente em acompanhamento</p>
                <p className="mt-1 truncate text-sm font-black text-hpsr-text">{selectedPatient ? selectedPatient.name : "Nenhum paciente selecionado"}</p>
                <p className="mt-0.5 text-xs font-semibold text-hpsr-muted">{selectedPatient ? `Passaporte ${selectedPatient.passport}` : "Selecione um paciente abaixo."}</p>
              </div>
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[12px] bg-[#f7e9e5] text-hpsr-wine">
                <ShieldCheck size={17} />
              </div>
            </div>

            <div className="mt-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Evolução atual</p>
                <p className="mt-0.5 text-2xl font-black text-hpsr-text">{calculation.safeWeek}ª <span className="text-sm">semana</span></p>
              </div>
              <p className="text-lg font-black text-hpsr-wine">{calculation.progress}%</p>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#efd9d5]">
              <div className="h-full rounded-full bg-[linear-gradient(90deg,#7d231d,#b85e58)] transition-all" style={{ width: `${calculation.progress}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-hpsr-muted">
              <span className="inline-flex items-center gap-1"><Activity size={11} /> Progresso materno-fetal</span>
              <span>{calculation.remainingRealDays} dias restantes</span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[390px_minmax(0,1fr)]">
        <section className={`${cardClass} overflow-hidden`}>
          <div className="border-b border-hpsr-border bg-[#fffaf4] p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-[#f7e9dc] text-hpsr-wine">
                <Baby size={21} />
              </div>
              <div>
                <h2 className="font-black text-hpsr-text">Calculadora gestacional RP</h2>
                <p className="mt-1 text-sm leading-relaxed text-hpsr-muted">
                  Configure os dados de referência para realizar a conversão obstétrica.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 p-4">
            <Field label="Paciente">
              <StyledSelect value={selectedPassport} onChange={(event) => selectPatient(event.target.value)} searchable disabled={loading}>
                <option value="">{loading ? "Carregando pacientes..." : "Selecionar paciente"}</option>
                {patients.map((patient) => (
                  <option key={patient.passport} value={patient.passport}>{patient.name} · {patient.passport}</option>
                ))}
              </StyledSelect>
            </Field>

            <Field label="Semana gestacional no RP" hint="Informe somente semanas, de 1 a 40.">
              <input
                className={inputClass}
                type="number"
                min={1}
                max={40}
                value={currentWeek}
                onChange={(event) => setCurrentWeek(Number(event.target.value))}
              />
            </Field>

            <Field label="Data de referência do RP" hint="Data real usada como ponto inicial para calcular o período restante.">
              <input className={inputClass} type="date" value={referenceDate} onChange={(event) => setReferenceDate(event.target.value)} />
            </Field>

            <Field label="Duração real da gestação" hint="O padrão definido anteriormente é de aproximadamente 60 dias reais.">
              <div className="relative">
                <input
                  className={`${inputClass} pr-14`}
                  type="number"
                  min={1}
                  max={180}
                  value={realDurationDays}
                  onChange={(event) => setRealDurationDays(Number(event.target.value))}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-hpsr-muted">dias</span>
              </div>
            </Field>
          </div>
        </section>

        <section className={`${cardClass} min-w-0 overflow-hidden`}>
          <div className="border-b border-hpsr-border bg-[#fffaf4] p-4">
            <p className="text-[10px] font-black uppercase tracking-[.15em] text-hpsr-wineLight">Resultado da conversão</p>
            <p className="mt-1 font-black text-hpsr-text">
              {selectedPatient ? `${selectedPatient.name} · ${selectedPatient.passport}` : "Nenhum paciente selecionado"}
            </p>
            <p className="mt-1 text-sm text-hpsr-muted">Ajuste os parâmetros ao lado para acompanhar a evolução proporcional da gestação no RP.</p>
          </div>

          <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={<Gauge size={18} />} label="Idade gestacional" value={`${calculation.safeWeek} semanas`} tone="highlight" />
            <MetricCard icon={<Clock3 size={18} />} label="Progresso" value={`${calculation.progress}%`} />
            <MetricCard icon={<CalendarDays size={18} />} label="Dias reais restantes" value={`${calculation.remainingRealDays} dias`} />
            <MetricCard icon={<Stethoscope size={18} />} label="Conclusão estimada" value={formatDate(calculation.estimatedEndDate)} />
          </div>

          <div className="grid gap-3 px-4 pb-4 md:grid-cols-3">
            <div className="rounded-[16px] border border-hpsr-border bg-[#fffaf4] p-4">
              <p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Período real decorrido</p>
              <p className="mt-2 text-xl font-black text-hpsr-text">{calculation.elapsedRealDays} dias</p>
              <p className="mt-1 text-xs text-hpsr-muted">Tempo real já convertido a partir da semana informada.</p>
            </div>
            <div className="rounded-[16px] border border-hpsr-border bg-[#fffaf4] p-4">
              <p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Conversão por semana</p>
              <p className="mt-2 text-xl font-black text-hpsr-text">{calculation.realDaysPerRpWeek.toFixed(1)} dias</p>
              <p className="mt-1 text-xs text-hpsr-muted">Média real correspondente a cada semana do RP.</p>
            </div>
            <div className="rounded-[16px] border border-hpsr-border bg-[#fffaf4] p-4">
              <p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Duração total configurada</p>
              <p className="mt-2 text-xl font-black text-hpsr-text">{calculation.safeDuration} dias</p>
              <p className="mt-1 text-xs text-hpsr-muted">Parâmetro total usado na projeção atual.</p>
            </div>
          </div>

          <div className="border-t border-hpsr-border bg-[#fffdf9] px-4 py-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[16px] border border-hpsr-border bg-white p-4">
                <p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Referência</p>
                <p className="mt-2 text-sm font-black text-hpsr-text">{formatDate(referenceDate)}</p>
              </div>
              <div className="rounded-[16px] border border-hpsr-border bg-white p-4">
                <p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Fase atual</p>
                <p className="mt-2 text-sm font-black text-hpsr-text">{calculation.safeWeek <= 12 ? 'Início do pré-natal' : calculation.safeWeek <= 32 ? 'Acompanhamento materno-fetal' : 'Preparação para o parto'}</p>
              </div>
              <div className="rounded-[16px] border border-hpsr-border bg-white p-4">
                <p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Observação</p>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-hpsr-muted">O cálculo é proporcional: 40 semanas do RP correspondem à duração real configurada. Use o resultado como apoio ao planejamento da gestação dentro do RP.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
