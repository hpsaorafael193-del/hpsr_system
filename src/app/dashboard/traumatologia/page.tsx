"use client";
import { formatPhoneNumber, formatPhoneDisplay } from "@/lib/phone";

import { StyledSelect } from "@/components/ui/StyledSelect";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import { hpsrAlert } from "@/components/ui/HpsrDialogProvider";

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
  UserPlus,
  UserRound,
  X,
} from "lucide-react";

type PatientRegistryItem = {
  name: string;
  passport: string;
  age: string;
  bloodType: string;
  cityPhone: string;
  email: string;
  followUp: string;
};

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
  useEffect(() => {
    const main = document.querySelector(".hpsr-dashboard-shell > main") as HTMLElement | null;
    if (!main) return;

    const previousOverflowY = main.style.overflowY;
    const previousOverscrollBehavior = main.style.overscrollBehavior;
    const desktopQuery = window.matchMedia("(min-width: 1280px)");

    const syncPageScroll = () => {
      main.style.overflowY = desktopQuery.matches ? "hidden" : previousOverflowY;
      main.style.overscrollBehavior = desktopQuery.matches ? "none" : previousOverscrollBehavior;
    };

    syncPageScroll();
    desktopQuery.addEventListener("change", syncPageScroll);

    return () => {
      desktopQuery.removeEventListener("change", syncPageScroll);
      main.style.overflowY = previousOverflowY;
      main.style.overscrollBehavior = previousOverscrollBehavior;
    };
  }, []);
  const [records, setRecords] = useState<CastRecord[]>(initialCastRecords);
  const [search, setSearch] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<CastRecord | null>(null);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [savingRecord, setSavingRecord] = useState(false);
  const [patients, setPatients] = useState<PatientRegistryItem[]>([]);
  const [selectedPatientPassport, setSelectedPatientPassport] = useState("");
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickSaving, setQuickSaving] = useState(false);
  const [quickPatient, setQuickPatient] = useState<PatientRegistryItem>({
    name: "", passport: "", age: "", bloodType: "", cityPhone: "", email: "", followUp: "Clínico",
  });

  useEffect(() => {
    let active = true;

    async function loadRecords() {
      const client = createClient();
      if (!client) {
        if (active) setLoadingRecords(false);
        await hpsrAlert("Não foi possível conectar ao Supabase.", "Controle de Gesso");
        return;
      }

      const [{ data, error }, { data: patientRows, error: patientError }] = await Promise.all([
        client
          .from("cast_records")
          .select("id, patient, passport, fractures, placed_at, removal_at, status_override")
          .order("created_at", { ascending: false }),
        client
          .from("patient_registry")
          .select("name,passport,age,blood_type,city_phone,email,follow_up")
          .order("name", { ascending: true })
          .limit(500),
      ]);

      if (!active) return;
      setLoadingRecords(false);

      if (error) {
        await hpsrAlert(`Não foi possível carregar os registros de gesso: ${error.message}`, "Controle de Gesso");
        return;
      }

      if (!patientError) {
        setPatients((patientRows || []).map((row) => ({
          name: String(row.name || ""),
          passport: String(row.passport || ""),
          age: String(row.age || ""),
          bloodType: String(row.blood_type || ""),
          cityPhone: formatPhoneDisplay(String(row.city_phone || ""), ""),
          email: String(row.email || ""),
          followUp: String(row.follow_up || "Clínico"),
        })));
      }

      setRecords(
        (data || []).map((row) => ({
          id: String(row.id),
          patient: String(row.patient || ""),
          passport: String(row.passport || ""),
          fractures: Array.isArray(row.fractures) ? row.fractures.map(String) : [],
          placedAt: String(row.placed_at || ""),
          removalAt: String(row.removal_at || ""),
          statusOverride: row.status_override === "retirado" ? "retirado" : undefined,
        }))
      );
    }

    void loadRecords();
    return () => { active = false; };
  }, []);

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


  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.passport === selectedPatientPassport) || null,
    [patients, selectedPatientPassport]
  );

  function selectPatient(passport: string) {
    setSelectedPatientPassport(passport);
  }

  async function saveQuickPatient() {
    const patient = {
      ...quickPatient,
      name: quickPatient.name.trim(),
      passport: quickPatient.passport.trim().toUpperCase(),
      age: quickPatient.age.trim(),
      bloodType: quickPatient.bloodType.trim(),
      cityPhone: quickPatient.cityPhone.trim(),
      email: quickPatient.email.trim(),
      followUp: quickPatient.followUp.trim() || "Clínico",
    };
    if (!patient.name || !patient.passport) {
      await hpsrAlert("Informe o nome completo e o passaporte do paciente.", "Cadastro rápido");
      return;
    }
    const client = createClient();
    if (!client) {
      await hpsrAlert("Não foi possível conectar ao Supabase.", "Cadastro rápido");
      return;
    }
    setQuickSaving(true);
    const { error } = await client.from("patient_registry").upsert({
      passport: patient.passport,
      name: patient.name,
      age: patient.age || null,
      blood_type: patient.bloodType || null,
      city_phone: patient.cityPhone || null,
      email: patient.email || null,
      follow_up: patient.followUp,
      updated_at: new Date().toISOString(),
    }, { onConflict: "passport" });
    setQuickSaving(false);
    if (error) {
      await hpsrAlert(`Não foi possível cadastrar o paciente: ${error.message}`, "Cadastro rápido");
      return;
    }
    setPatients((current) => [patient, ...current.filter((item) => item.passport !== patient.passport)].sort((a,b) => a.name.localeCompare(b.name)));
    setSelectedPatientPassport(patient.passport);
    setQuickOpen(false);
    setQuickPatient({ name: "", passport: "", age: "", bloodType: "", cityPhone: "", email: "", followUp: "Clínico" });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const patient = selectedPatient?.name || "";
    const passport = selectedPatient?.passport || "";
    const fractures = String(form.get("fractures") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const placedAt = String(form.get("placedAt") ?? "");
    const removalAt = String(form.get("removalAt") ?? "");

    if (!patient || !passport || !fractures.length || !placedAt || !removalAt) return;

    const client = createClient();
    if (!client) {
      await hpsrAlert("Não foi possível conectar ao Supabase.", "Controle de Gesso");
      return;
    }

    const record: CastRecord = {
      id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `gesso-${Date.now()}`,
      patient,
      passport,
      fractures,
      placedAt,
      removalAt,
    };

    setSavingRecord(true);
    const { error } = await client.from("cast_records").insert({
      id: record.id,
      patient: record.patient,
      passport: record.passport,
      fractures: record.fractures,
      placed_at: record.placedAt,
      removal_at: record.removalAt,
      status_override: null,
    });
    setSavingRecord(false);

    if (error) {
      await hpsrAlert(`O registro de gesso não foi salvo: ${error.message}`, "Controle de Gesso");
      return;
    }

    setRecords((current) => [record, ...current]);
    formElement.reset();
    setSelectedPatientPassport("");
  }

  async function updateRecord(updatedRecord: CastRecord) {
    const client = createClient();
    if (!client) {
      await hpsrAlert("Não foi possível conectar ao Supabase.", "Controle de Gesso");
      return;
    }

    const { error } = await client
      .from("cast_records")
      .update({
        patient: updatedRecord.patient,
        passport: updatedRecord.passport,
        fractures: updatedRecord.fractures,
        placed_at: updatedRecord.placedAt,
        removal_at: updatedRecord.removalAt,
        status_override: updatedRecord.statusOverride || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", updatedRecord.id);

    if (error) {
      await hpsrAlert(`Não foi possível atualizar o registro de gesso: ${error.message}`, "Controle de Gesso");
      return;
    }

    setRecords((current) => current.map((record) => (record.id === updatedRecord.id ? updatedRecord : record)));
    setSelectedRecord(updatedRecord);
  }

  return (
    <div className="hpsr-page min-h-0 gap-2 xl:h-full xl:min-h-0 xl:overflow-hidden">
      <div className="hpsr-topbar !mb-0 shrink-0" />

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

      <section className="grid min-h-0 flex-1 overflow-hidden gap-2 rounded-[22px] xl:grid-cols-[minmax(340px,420px)_minmax(0,1fr)]">
        <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-[22px] border border-hpsr-border bg-white/[0.94] shadow-[0_16px_38px_rgba(42,7,0,0.065)]">
          <div className="relative overflow-hidden border-b border-hpsr-border bg-[linear-gradient(135deg,#fffaf4_0%,#f6eadc_58%,#ead7c5_100%)] p-3">
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

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden p-3">
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
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

                <div className="flex gap-2">
                  <StyledSelect
                    className={inputClass}
                    value={selectedPatientPassport}
                    onChange={(event) => selectPatient(event.target.value)}
                    required
                  >
                    <option value="">Selecione o paciente</option>
                    {patients.map((patient) => (
                      <option key={patient.passport} value={patient.passport}>{patient.name} · {patient.passport}</option>
                    ))}
                  </StyledSelect>
                  <button
                    type="button"
                    onClick={() => setQuickOpen(true)}
                    title="Cadastro rápido de paciente"
                    aria-label="Cadastro rápido de paciente"
                    className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[13px] border border-hpsr-border bg-white text-hpsr-wine transition hover:bg-[#fff8f0]"
                  >
                    <UserPlus size={17} />
                  </button>
                </div>

                {selectedPatient && (
                  <div className="mt-2 grid grid-cols-2 gap-2 rounded-[14px] border border-hpsr-border bg-white p-2.5 text-xs">
                    <PatientInfo label="Nome" value={selectedPatient.name} />
                    <PatientInfo label="Passaporte" value={selectedPatient.passport} />
                    <PatientInfo label="Idade" value={selectedPatient.age || "Não informada"} />
                    <PatientInfo label="Tipo sanguíneo" value={selectedPatient.bloodType || "Não informado"} />
                  </div>
                )}
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

            <div className="shrink-0 border-t border-hpsr-border bg-white/[0.96] pt-2">
              <button
                type="submit"
                disabled={savingRecord}
                className="flex w-full items-center justify-center gap-2 rounded-[18px] bg-[linear-gradient(135deg,#672614,#2a0700)] px-4 py-3 text-sm font-black text-white shadow-[0_12px_24px_rgba(42,7,0,0.16)] transition hover:brightness-105"
              >
                <FilePlus2 size={17} />
                {savingRecord ? "Salvando..." : "Registrar gesso"}
              </button>
            </div>
          </form>

        </aside>
        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[22px] border border-hpsr-border bg-white/[0.92] p-3.5 shadow-[0_14px_34px_rgba(42,7,0,0.055)]">
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

          <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="grid gap-3">
            {filteredRecords.map((record) => (
              <CastHistoryCard key={record.id} record={record} onOpen={() => setSelectedRecord(record)} />
            ))}

            {loadingRecords && (
              <div className="rounded-[20px] border border-dashed border-hpsr-border bg-[#fffaf4] p-3.5 text-center">
                <p className="font-black text-hpsr-text">Carregando registros...</p>
              </div>
            )}

            {!loadingRecords && filteredRecords.length === 0 && (
              <div className="rounded-[20px] border border-dashed border-hpsr-border bg-[#fffaf4] p-3.5 text-center">
                <p className="font-black text-hpsr-text">Nenhum registro encontrado.</p>
                <p className="mt-1 text-sm font-semibold text-hpsr-muted">Tente buscar por outro paciente, passaporte ou status.</p>
              </div>
            )}
            </div>
          </div>
        </div>
      </section>

      {quickOpen && (
        <QuickPatientModal
          patient={quickPatient}
          setPatient={setQuickPatient}
          saving={quickSaving}
          onClose={() => setQuickOpen(false)}
          onSave={() => void saveQuickPatient()}
        />
      )}

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
  onSave: (record: CastRecord) => Promise<void>;
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

  async function saveChanges(markRemoved = false) {
    const updated: CastRecord = {
      ...record,
      patient: patient.trim(),
      passport: passport.trim(),
      fractures: fractures.split(",").map((item) => item.trim()).filter(Boolean),
      placedAt,
      removalAt,
      statusOverride: markRemoved ? "retirado" : record.statusOverride,
    };

    await onSave(updated);
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


function PatientInfo({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[0.12em] text-hpsr-wineLight">{label}</p><p className="truncate font-bold text-hpsr-text">{value}</p></div>;
}

function QuickPatientModal({ patient, setPatient, saving, onClose, onSave }: {
  patient: PatientRegistryItem;
  setPatient: React.Dispatch<React.SetStateAction<PatientRegistryItem>>;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  const field = (key: keyof PatientRegistryItem, value: string) => setPatient((current) => ({ ...current, [key]: value }));
  return (
    <div className="fixed inset-0 z-[100000] grid place-items-center bg-[#1f0805]/62 p-4 backdrop-blur-md">
      <section className="w-full max-w-xl overflow-hidden rounded-[22px] border border-white/40 bg-[#fffaf4] shadow-[0_28px_90px_rgba(27,10,7,0.36)]">
        <div className="flex items-start justify-between border-b border-hpsr-border bg-white px-5 py-4">
          <div className="flex gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-hpsr-border text-hpsr-wine"><UserPlus size={19}/></div><div><h3 className="font-black text-hpsr-text">Cadastro rápido de paciente</h3><p className="text-xs font-semibold text-hpsr-muted">O paciente será cadastrado no registro compartilhado e selecionado automaticamente.</p></div></div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-hpsr-wine text-white"><X size={18}/></button>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          <TraumaField label="Nome completo"><input className={inputClass} value={patient.name} onChange={(e)=>field("name",e.target.value)} /></TraumaField>
          <TraumaField label="Passaporte"><input className={inputClass} value={patient.passport} onChange={(e)=>field("passport",e.target.value)} /></TraumaField>
          <TraumaField label="Idade"><input className={inputClass} value={patient.age} onChange={(e)=>field("age",e.target.value)} /></TraumaField>
          <TraumaField label="Tipo sanguíneo"><StyledSelect className={inputClass} value={patient.bloodType} onChange={(e)=>field("bloodType",e.target.value)}><option value="">Selecione</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option></StyledSelect></TraumaField>
          <TraumaField label="Telefone"><input className={inputClass} value={patient.cityPhone} onChange={(e)=>field("cityPhone",formatPhoneNumber(e.target.value))} inputMode="numeric" maxLength={13} placeholder="(055) 626-323" /></TraumaField>
          <TraumaField label="E-mail"><input type="email" className={inputClass} value={patient.email} onChange={(e)=>field("email",e.target.value)} /></TraumaField>
          <div className="sm:col-span-2"><TraumaField label="Acompanhamento"><StyledSelect className={inputClass} value={patient.followUp} onChange={(e)=>field("followUp",e.target.value)}><option>Clínico</option><option>Especializado</option><option>Rotina</option></StyledSelect></TraumaField></div>
        </div>
        <div className="flex justify-end gap-2 border-t border-hpsr-border bg-white px-5 py-4"><button type="button" onClick={onClose} className="rounded-[14px] border border-hpsr-border bg-white px-4 py-3 text-xs font-black text-hpsr-text">Cancelar</button><button type="button" disabled={saving} onClick={onSave} className="rounded-[14px] bg-hpsr-wine px-4 py-3 text-xs font-black text-white disabled:opacity-60">{saving ? "Salvando..." : "Salvar e selecionar"}</button></div>
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
