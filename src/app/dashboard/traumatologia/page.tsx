"use client";

import { useMemo, useState } from "react";
import {
  CalendarClock,
  ChevronRight,
  CheckCircle2,
  Clock3,
  ClipboardList,
  FilePlus2,
  Search,
  ShieldAlert,
  TimerReset,
  UserRound,
  X,
} from "lucide-react";

type CastStatus = "recuperacao" | "reavaliacao" | "atrasada" | "retirado";

type CastRecord = {
  id: string;
  patient: string;
  passport: string;
  fractures: string[];
  placedAt: string;
  removalAt: string;
  statusOverride?: "retirado";
};

const initialCastRecords: CastRecord[] = [];

const statusMap: Record<CastStatus, { label: string; description: string; className: string; icon: typeof CheckCircle2 }> = {
  recuperacao: {
    label: "No prazo de recuperação",
    description: "Paciente ainda dentro do período previsto de uso do gesso.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: CheckCircle2,
  },
  reavaliacao: {
    label: "Reavaliação",
    description: "Hoje é a data prevista de retirada. Precisa de reavaliação clínica.",
    className: "border-amber-200 bg-amber-50 text-amber-800",
    icon: Clock3,
  },
  atrasada: {
    label: "Atrasada",
    description: "Prazo ultrapassado. Necessita contato e regularização.",
    className: "border-red-200 bg-red-50 text-red-700",
    icon: ShieldAlert,
  },
  retirado: {
    label: "Retirado",
    description: "Gesso retirado e registro finalizado.",
    className: "border-zinc-200 bg-zinc-50 text-zinc-700",
    icon: CheckCircle2,
  },
};

export default function TraumaPage() {
  const [records, setRecords] = useState<CastRecord[]>(initialCastRecords);
  const [search, setSearch] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<CastRecord | null>(null);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return records;

    return records.filter((record) =>
      [
        record.patient,
        record.passport,
        record.fractures.join(" "),
        statusMap[getCastStatus(record)].label,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [records, search]);

  const counters = useMemo(
    () => ({
      total: records.length,
      recuperacao: records.filter((record) => getCastStatus(record) === "recuperacao").length,
      reavaliacao: records.filter((record) => getCastStatus(record) === "reavaliacao").length,
      atrasada: records.filter((record) => getCastStatus(record) === "atrasada").length,
      retirado: records.filter((record) => getCastStatus(record) === "retirado").length,
    }),
    [records]
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const patient = String(form.get("patient") ?? "").trim();
    const passport = String(form.get("passport") ?? "").trim();
    const fractures = String(form.get("fractures") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const placedAt = String(form.get("placedAt") ?? "");
    const removalAt = String(form.get("removalAt") ?? "");

    if (!patient || !passport || !fractures.length || !placedAt || !removalAt) return;

    setRecords((current) => [
      {
        id: `gesso-${Date.now()}`,
        patient,
        passport,
        fractures,
        placedAt,
        removalAt,
      },
      ...current,
    ]);

    event.currentTarget.reset();
  }

  function updateRecord(updatedRecord: CastRecord) {
    setRecords((current) => current.map((record) => (record.id === updatedRecord.id ? updatedRecord : record)));
    setSelectedRecord(updatedRecord);
  }

  return (
    <div className="hpsr-page gap-3">
      <div className="hpsr-topbar" />

      <section className="shrink-0 overflow-hidden rounded-[22px] border border-hpsr-border bg-white/[0.9] shadow-[0_18px_42px_rgba(42,7,0,0.07)]">
        <div className="relative overflow-hidden border-b border-hpsr-border bg-[linear-gradient(135deg,#fffaf4_0%,#f6eadc_62%,#efe0d2_100%)] px-4 py-3">
          <div className="pointer-events-none absolute -right-12 -top-16 h-36 w-36 rounded-full bg-hpsr-wine/10 blur-2xl" />
          <div className="relative flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#672614,#2a0700)] text-white shadow-[0_10px_22px_rgba(42,7,0,0.18)]">
              <ClipboardList size={21} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-hpsr-wineLight">Traumatologia</p>
              <h1 className="mt-0.5 text-[clamp(1.2rem,1.9vw,1.6rem)] font-black text-hpsr-text">Controle de Gesso</h1>
              <p className="mt-0.5 text-sm font-semibold text-hpsr-muted">
                Registre imobilizações, acompanhe prazos e finalize a retirada pela ficha do paciente.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-2 px-3 py-2 sm:grid-cols-2 xl:grid-cols-5">
          <StatusCounter label="Total" value={counters.total} />
          <StatusCounter label="Recuperação" value={counters.recuperacao} tone="green" />
          <StatusCounter label="Reavaliação" value={counters.reavaliacao} tone="amber" />
          <StatusCounter label="Atrasada" value={counters.atrasada} tone="red" />
          <StatusCounter label="Retirado" value={counters.retirado} />
        </div>
      </section>

      <section className="grid min-h-0 flex-1 gap-3 rounded-[22px] xl:grid-cols-[minmax(340px,420px)_minmax(0,1fr)]">
        <aside className="h-full min-h-0 overflow-hidden rounded-[22px] border border-hpsr-border bg-white/[0.94] shadow-[0_16px_38px_rgba(42,7,0,0.065)]">
          <div className="relative overflow-hidden border-b border-hpsr-border bg-[linear-gradient(135deg,#fffaf4_0%,#f6eadc_58%,#ead7c5_100%)] p-3.5">
            <div className="pointer-events-none absolute -right-12 -top-14 h-32 w-32 rounded-full bg-hpsr-wine/10 blur-2xl" />
            <div className="relative flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-[15px] bg-[linear-gradient(135deg,#672614,#2a0700)] text-white shadow-[0_8px_18px_rgba(42,7,0,0.14)]">
                <FilePlus2 size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-hpsr-wineLight">Novo registro</p>
                <h2 className="text-xl font-black text-hpsr-text">Gesso colocado</h2>
                <p className="mt-0.5 text-xs font-semibold text-hpsr-muted">Preencha a ficha inicial da imobilização.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex max-h-[calc(100%-5.25rem)] min-h-0 flex-col overflow-y-auto p-3.5 pr-3">
            <div className="space-y-2.5">
              <div className="rounded-[18px] border border-hpsr-border bg-[#fffaf4] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[12px] bg-white text-hpsr-wine">
                    <UserRound size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">Paciente</p>
                    <p className="text-[11px] font-semibold text-hpsr-muted">Identificação do atendimento</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <TraumaField label="Nome do paciente">
                    <input name="patient" className={inputClass} placeholder="Nome completo do paciente" required />
                  </TraumaField>

                  <TraumaField label="Passaporte">
                    <input name="passport" className={inputClass} placeholder="Ex: 2031" required />
                  </TraumaField>
                </div>
              </div>

              <div className="rounded-[18px] border border-hpsr-border bg-[#fffaf4] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[12px] bg-white text-hpsr-wine">
                    <ClipboardList size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">Fratura</p>
                    <p className="text-[11px] font-semibold text-hpsr-muted">Separe múltiplas fraturas por vírgula</p>
                  </div>
                </div>

                <TraumaField label="Fratura(s)">
                  <textarea
                    name="fractures"
                    className={`${inputClass} min-h-[76px] resize-none py-2.5`}
                    placeholder="Ex: rádio distal, ulna"
                    required
                  />
                </TraumaField>
              </div>

              <div className="rounded-[18px] border border-hpsr-border bg-[#fffaf4] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[12px] bg-white text-hpsr-wine">
                    <CalendarClock size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">Prazos</p>
                    <p className="text-[11px] font-semibold text-hpsr-muted">Status atualizado automaticamente</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  <TraumaField label="Data de colocação">
                    <input name="placedAt" type="date" className={inputClass} required />
                  </TraumaField>

                  <TraumaField label="Data de retirada">
                    <input name="removalAt" type="date" className={inputClass} required />
                  </TraumaField>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 mt-3 bg-white/[0.94] pt-3">
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-[18px] bg-[linear-gradient(135deg,#672614,#2a0700)] px-4 py-3 text-sm font-black text-white shadow-[0_12px_24px_rgba(42,7,0,0.16)] transition hover:brightness-105"
              >
                <FilePlus2 size={17} />
                Registrar gesso
              </button>
            </div>
          </form>

        </aside>
        <div className="min-h-0 min-w-0 overflow-y-auto rounded-[22px] border border-hpsr-border bg-white/[0.92] p-3.5 pr-3 shadow-[0_14px_34px_rgba(42,7,0,0.055)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Histórico</p>
              <h2 className="text-xl font-black text-hpsr-text">Gessos colocados</h2>
              <p className="mt-1 text-sm font-semibold text-hpsr-muted">Clique em um paciente para abrir a ficha do gesso.</p>
            </div>

            <label className="flex min-h-[38px] w-full items-center gap-3 rounded-[16px] border border-hpsr-border bg-[#fffaf4] px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] lg:max-w-xs">
              <Search size={17} className="text-hpsr-wine" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full bg-transparent text-sm font-bold text-hpsr-text outline-none placeholder:text-zinc-400"
                placeholder="Buscar paciente, passaporte..."
              />
            </label>
          </div>

          <div className="mt-4 grid gap-3">
            {filteredRecords.map((record) => (
              <CastHistoryCard key={record.id} record={record} onOpen={() => setSelectedRecord(record)} />
            ))}

            {filteredRecords.length === 0 && (
              <div className="rounded-[20px] border border-dashed border-hpsr-border bg-[#fffaf4] p-3.5 text-center">
                <p className="font-black text-hpsr-text">Nenhum registro encontrado.</p>
                <p className="mt-1 text-sm font-semibold text-hpsr-muted">Tente buscar por outro paciente, passaporte ou status.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {selectedRecord && (
        <CastRecordModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onSave={updateRecord}
        />
      )}
    </div>
  );
}

const inputClass =
  "min-h-[38px] w-full rounded-[13px] border border-hpsr-border bg-[#fffaf4] px-3 text-sm font-bold text-hpsr-text outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition placeholder:text-zinc-400 focus:border-hpsr-wineLight focus:bg-white focus:ring-2 focus:ring-hpsr-wineLight/20";

function TraumaField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function CastHistoryCard({ record, onOpen }: { record: CastRecord; onOpen: () => void }) {
  const statusKey = getCastStatus(record);
  const status = statusMap[statusKey];
  const Icon = status.icon;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group overflow-hidden rounded-[22px] border border-hpsr-border bg-white text-left shadow-[0_10px_24px_rgba(42,7,0,0.045)] transition hover:-translate-y-0.5 hover:border-hpsr-wineLight hover:shadow-[0_16px_32px_rgba(42,7,0,0.075)]"
    >
      <div className="h-1.5 bg-[linear-gradient(90deg,#672614,#b57b5b,#f0dfcf)]" />

      <div className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-[15px] bg-[#f3e4d6] text-hpsr-wine">
                <UserRound size={18} />
              </div>
              <div>
                <h3 className="text-lg font-black text-hpsr-text">{record.patient}</h3>
                <p className="text-xs font-black uppercase tracking-[0.13em] text-hpsr-wineLight">
                  Passaporte {record.passport}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {record.fractures.map((fracture) => (
                <span key={fracture} className="rounded-full border border-hpsr-border bg-[#fffaf4] px-3 py-1.5 text-xs font-black text-hpsr-text">
                  {fracture}
                </span>
              ))}
            </div>
          </div>

          <span className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black ${status.className}`}>
            <Icon size={14} />
            {status.label}
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <DateBox label="Colocação" value={formatDate(record.placedAt)} />
          <DateBox label="Data prevista" value={formatDate(record.removalAt)} />
        </div>

        <div className="mt-3 flex items-center justify-between rounded-[16px] border border-hpsr-border bg-[#fffaf4] p-3">
          <div className="flex items-start gap-2">
            <CalendarClock size={16} className="mt-0.5 shrink-0 text-hpsr-wine" />
            <p className="text-sm font-semibold leading-relaxed text-hpsr-muted">
              {status.description}
            </p>
          </div>
          <ChevronRight size={18} className="ml-3 shrink-0 text-hpsr-wineLight transition group-hover:translate-x-0.5" />
        </div>
      </div>
    </button>
  );
}

function CastRecordModal({
  record,
  onClose,
  onSave,
}: {
  record: CastRecord;
  onClose: () => void;
  onSave: (record: CastRecord) => void;
}) {
  const [patient, setPatient] = useState(record.patient);
  const [passport, setPassport] = useState(record.passport);
  const [fractures, setFractures] = useState(record.fractures.join(", "));
  const [placedAt, setPlacedAt] = useState(record.placedAt);
  const [removalAt, setRemovalAt] = useState(record.removalAt);

  const previewRecord: CastRecord = {
    ...record,
    patient,
    passport,
    fractures: fractures.split(",").map((item) => item.trim()).filter(Boolean),
    placedAt,
    removalAt,
  };
  const statusKey = getCastStatus(previewRecord);
  const status = statusMap[statusKey];
  const Icon = status.icon;

  function saveChanges(markRemoved = false) {
    const updated: CastRecord = {
      ...record,
      patient: patient.trim(),
      passport: passport.trim(),
      fractures: fractures.split(",").map((item) => item.trim()).filter(Boolean),
      placedAt,
      removalAt,
      statusOverride: markRemoved ? "retirado" : record.statusOverride,
    };

    onSave(updated);
  }

  return (
    <div className="fixed inset-0 z-[99999] grid min-h-dvh place-items-center overflow-y-auto px-4 py-3">
      <button
        type="button"
        aria-label="Fechar ficha do gesso"
        onClick={onClose}
        className="fixed inset-0 bg-[#1f0805]/62 backdrop-blur-md"
      />

      <section className="relative z-10 w-full max-w-4xl overflow-hidden rounded-[22px] border border-white/45 bg-[#fcf6ee] shadow-[0_28px_90px_rgba(27,10,7,0.36)]">
        <div className="border-b border-hpsr-border bg-[linear-gradient(135deg,#fffaf4_0%,#f5e7d8_100%)] px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[16px] bg-[#efe0d2] text-hpsr-wine">
                <ClipboardList size={23} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Ficha do gesso</p>
                <h2 className="mt-1 text-lg font-black text-hpsr-text">{record.patient}</h2>
                <p className="mt-1 text-sm font-semibold text-hpsr-muted">
                  Edite os dados da imobilização ou atualize o status para retirado.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-[14px] border border-hpsr-border bg-white text-hpsr-wine transition hover:bg-[#fff8f0]"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="max-h-[72vh] overflow-y-auto p-3.5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="rounded-[22px] border border-hpsr-border bg-white p-3.5">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Dados da ficha</p>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <TraumaField label="Nome do paciente">
                  <input className={inputClass} value={patient} onChange={(event) => setPatient(event.target.value)} />
                </TraumaField>

                <TraumaField label="Passaporte">
                  <input className={inputClass} value={passport} onChange={(event) => setPassport(event.target.value)} />
                </TraumaField>

                <TraumaField label="Fratura(s)">
                  <textarea
                    className={`${inputClass} min-h-[90px] resize-none py-3`}
                    value={fractures}
                    onChange={(event) => setFractures(event.target.value)}
                  />
                </TraumaField>

                <div className="grid gap-3">
                  <TraumaField label="Data de colocação">
                    <input type="date" className={inputClass} value={placedAt} onChange={(event) => setPlacedAt(event.target.value)} />
                  </TraumaField>

                  <TraumaField label="Data de retirada">
                    <input type="date" className={inputClass} value={removalAt} onChange={(event) => setRemovalAt(event.target.value)} />
                  </TraumaField>
                </div>
              </div>
            </div>

            <aside className="rounded-[22px] border border-hpsr-border bg-[#fffaf4] p-3.5">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Status atual</p>
              <div className={`mt-3 rounded-[18px] border p-3.5 ${status.className}`}>
                <div className="flex items-center gap-2">
                  <Icon size={18} />
                  <p className="text-sm font-black">{status.label}</p>
                </div>
                <p className="mt-2 text-sm font-semibold leading-relaxed">{status.description}</p>
              </div>

              <div className="mt-4 grid gap-3">
                <DateBox label="Colocação" value={formatDate(placedAt)} />
                <DateBox label="Data prevista" value={formatDate(removalAt)} />
              </div>

              <button
                type="button"
                onClick={() => saveChanges(true)}
                disabled={statusKey === "retirado"}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-[16px] border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-800 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <TimerReset size={16} />
                Atualizar para retirado
              </button>
            </aside>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-hpsr-border bg-white/[0.92] p-3.5 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[16px] border border-hpsr-border bg-white px-4 py-3 text-sm font-black text-hpsr-text transition hover:bg-[#fff8f0]"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={() => saveChanges(false)}
            className="rounded-[16px] bg-[linear-gradient(135deg,#672614,#2a0700)] px-4 py-3 text-sm font-black text-white transition hover:brightness-105"
          >
            Salvar alterações
          </button>
        </div>
      </section>
    </div>
  );
}

function DateBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-hpsr-border bg-white px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">{label}</p>
      <p className="mt-1 text-sm font-black text-hpsr-text">{value}</p>
    </div>
  );
}

function StatusCounter({ label, value, tone = "neutral" }: { label: string; value: number; tone?: "neutral" | "green" | "amber" | "blue" | "red" }) {
  const toneClass =
    tone === "green"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : tone === "blue"
          ? "border-blue-200 bg-blue-50 text-blue-800"
          : tone === "red"
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-hpsr-border bg-white text-hpsr-text";

  return (
    <div className={`rounded-[14px] border px-3 py-2 shadow-[0_6px_14px_rgba(42,7,0,0.035)] ${toneClass}`}>
      <p className="text-[9px] font-black uppercase tracking-[0.13em] opacity-75">{label}</p>
      <p className="mt-0.5 text-lg font-black leading-none">{value}</p>
    </div>
  );
}

function getCastStatus(record: CastRecord): CastStatus {
  if (record.statusOverride === "retirado") return "retirado";

  const today = startOfDay(new Date());
  const removalDate = startOfDay(parseDate(record.removalAt));

  if (Number.isNaN(removalDate.getTime())) return "recuperacao";

  const daysUntilRemoval = Math.ceil((removalDate.getTime() - today.getTime()) / 86400000);

  if (daysUntilRemoval < 0) return "atrasada";
  if (daysUntilRemoval === 0) return "reavaliacao";
  return "recuperacao";
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function formatDate(value: string) {
  if (!value) return "Não informada";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}
