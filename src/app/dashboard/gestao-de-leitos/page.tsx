"use client";

import { FormEvent, useState } from "react";
import {
  AlertTriangle,
  BedDouble,
  CalendarClock,
  CheckCircle2,
  ClipboardPenLine,
  Ellipsis,
  LogOut,
  Plus,
  Search,
  UserRound,
  X,
} from "lucide-react";

type BedStatus = "ocupado" | "vago";

type BedRecord = {
  id: string;
  label: string;
  status: BedStatus;
  patient?: string;
  admittedAt?: string;
  expectedDischarge?: string;
  doctor?: string;
  specialty?: string;
  admissionReason?: string;
  admissionCondition?: string;
  generalState?: string;
  vitals?: {
    pa: string;
    fc: string;
    fr: string;
    temp: string;
    spo2: string;
  };
  initialDiagnosis?: string;
  treatmentPlan?: string;
  instructions?: string;
};

const initialBeds: BedRecord[] = [
  { id: "leito-01", label: "Leito 01", status: "vago" },
  { id: "leito-02", label: "Leito 02", status: "vago" },
  { id: "leito-03", label: "Leito 03", status: "vago" },
  { id: "leito-04", label: "Leito 04", status: "vago" },
  { id: "leito-05", label: "Leito 05", status: "vago" },
  { id: "leito-06", label: "Leito 06", status: "vago" },
];

const doctors: string[] = [];
const specialties = ["Clínico Geral", "Obstetra", "Pediatra", "Psicóloga", "Psiquiatra", "Neurologia", "Oftalmologia", "Cardiologia", "Dermatologia", "Nutricionista", "Cirurgião", "Ginecologia"];
const patients: string[] = [];

export default function BedsPage() {
  const [beds, setBeds] = useState<BedRecord[]>(initialBeds);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [selectedVacantBed, setSelectedVacantBed] = useState<BedRecord | null>(null);
  const [selectedOccupiedBed, setSelectedOccupiedBed] = useState<BedRecord | null>(null);
  const [dischargeBed, setDischargeBed] = useState<BedRecord | null>(null);

  const occupiedCount = beds.filter((bed) => bed.status === "ocupado").length;
  const freeCount = beds.length - occupiedCount;

  function openAdmissionForm(bed: BedRecord) {
    if (bed.status !== "vago") return;
    setOpenMenu(null);
    setSelectedVacantBed(bed);
  }

  function openPatientEditForm(bed: BedRecord) {
    if (bed.status !== "ocupado") return;
    setOpenMenu(null);
    setSelectedOccupiedBed(bed);
  }

  function askDischargeConfirmation(bed: BedRecord) {
    if (bed.status !== "ocupado") return;
    setOpenMenu(null);
    setDischargeBed(bed);
  }

  function confirmDischarge() {
    if (!dischargeBed) return;

    setBeds((currentBeds) =>
      currentBeds.map((bed) =>
        bed.id === dischargeBed.id
          ? { id: bed.id, label: bed.label, status: "vago" }
          : bed
      )
    );
    setDischargeBed(null);
    setSelectedOccupiedBed(null);
  }

  return (
    <div className="hpsr-page gap-3">
      <div className="hpsr-topbar" />
      <section className="overflow-hidden rounded-[18px] border border-hpsr-border bg-white/[0.88] shadow-[0_14px_34px_rgba(42,7,0,0.06)]">
        <div className="grid gap-3 border-b border-hpsr-border bg-[linear-gradient(135deg,#fffaf4_0%,#f6eadc_100%)] px-4 py-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[16px] bg-[#efe0d2] text-hpsr-wine">
              <BedDouble size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-hpsr-wineLight">
                Gestão de Leitos
              </p>
              <h1 className="mt-1 text-[clamp(1.25rem,2vw,1.7rem)] font-black text-hpsr-text">
                Gerenciamento de Leitos
              </h1>
              <p className="mt-0.5 text-sm font-semibold text-hpsr-muted">
                Visualize o status dos leitos e gerencie as internações.
              </p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-[minmax(0,260px)_auto]">
            <label className="flex min-h-[38px] items-center gap-3 rounded-[16px] border border-hpsr-border bg-white px-3 focus-within:border-hpsr-wineLight focus-within:ring-2 focus-within:ring-hpsr-wineLight/20">
              <Search size={17} className="text-hpsr-muted" />
              <input
                className="w-full bg-transparent text-sm font-semibold text-hpsr-text outline-none placeholder:text-zinc-400"
                placeholder="Buscar leito ou paciente"
              />
            </label>

            <button
              type="button"
              onClick={() => openAdmissionForm(beds.find((bed) => bed.status === "vago") ?? beds[0])}
              className="inline-flex min-h-[38px] items-center justify-center gap-2 rounded-[16px] bg-hpsr-wine px-4 text-sm font-black text-white transition hover:bg-hpsr-wineLight"
            >
              <Plus size={16} />
              Nova internação
            </button>
          </div>
        </div>

        <div className="grid gap-3 px-4 py-3 sm:grid-cols-3">
          <BedMetric label="Total de leitos" value={String(beds.length)} tone="neutral" />
          <BedMetric label="Ocupados" value={String(occupiedCount)} tone="occupied" />
          <BedMetric label="Vagos" value={String(freeCount)} tone="free" />
        </div>
      </section>

      <section className="min-h-0 flex-1 overflow-hidden rounded-[18px] border border-hpsr-border bg-white/[0.86] p-3">
        <div className="grid h-full gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
          {beds.map((bed) => {
            const occupied = bed.status === "ocupado";
            const menuOpen = openMenu === bed.id;

            return (
              <article
                key={bed.id}
                onClick={() => openAdmissionForm(bed)}
                className={`relative flex min-h-[260px] flex-col overflow-visible rounded-[18px] border p-3.5 text-center transition ${
                  occupied
                    ? "border-rose-200 bg-[linear-gradient(180deg,#fff3f0_0%,#fffafa_100%)]"
                    : "cursor-pointer border-emerald-200 bg-[linear-gradient(180deg,#f1fff6_0%,#fbfffd_100%)] hover:border-emerald-300 hover:shadow-[0_14px_34px_rgba(24,120,70,0.10)]"
                } shadow-[0_10px_26px_rgba(42,7,0,0.045)]`}
              >
                <div className="absolute right-3 top-3 z-20" onClick={(event) => event.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => setOpenMenu(menuOpen ? null : bed.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-[12px] text-hpsr-muted transition hover:bg-white"
                    aria-label={`Abrir ações do ${bed.label}`}
                  >
                    <Ellipsis size={18} />
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 top-9 z-30 w-44 overflow-hidden rounded-[16px] border border-hpsr-border bg-white text-left shadow-[0_16px_40px_rgba(42,7,0,0.16)]">
                      <button
                        type="button"
                        onClick={() => (occupied ? openPatientEditForm(bed) : openAdmissionForm(bed))}
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-bold text-hpsr-text transition hover:bg-[#fff7ef]"
                      >
                        <ClipboardPenLine size={15} />
                        Editar ficha
                      </button>
                      {occupied ? (
                        <button
                          type="button"
                          onClick={() => askDischargeConfirmation(bed)}
                          className="flex w-full items-center gap-2 border-t border-hpsr-border px-3 py-2.5 text-sm font-bold text-hpsr-text transition hover:bg-[#fff7ef]"
                        >
                          <LogOut size={15} />
                          Dar alta hospitalar
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openAdmissionForm(bed)}
                          className="flex w-full items-center gap-2 border-t border-hpsr-border px-3 py-2.5 text-sm font-bold text-hpsr-text transition hover:bg-[#fff7ef]"
                        >
                          <Plus size={15} />
                          Internar paciente
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col items-center justify-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${occupied ? "bg-red-500" : "bg-emerald-500"}`} />
                    <h2 className="text-base font-black text-hpsr-text">{bed.label}</h2>
                  </div>

                  <div className={`mt-5 flex h-8 w-8 items-center justify-center rounded-[18px] ${
                    occupied ? "bg-rose-100 text-red-600" : "bg-emerald-100 text-emerald-700"
                  }`}>
                    <BedDouble size={30} />
                  </div>

                  {occupied ? (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-black uppercase tracking-[0.03em] text-red-700">{bed.patient}</p>
                      <div className="space-y-1 text-xs font-semibold text-hpsr-muted">
                        <p>
                          Internação: <span className="font-black text-red-600">{bed.admittedAt}</span>
                        </p>
                        <p>
                          Prev. Alta: <span className="font-black text-hpsr-text">{bed.expectedDischarge}</span>
                        </p>
                        <p className="inline-flex items-center justify-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] font-black text-hpsr-wine">
                          <UserRound size={13} />
                          {bed.doctor}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-black text-emerald-700">Vago</p>
                      <p className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-700">
                        <CheckCircle2 size={13} />
                        Clique para internar
                      </p>
                    </div>
                  )}
                </div>

                <div className={`mt-4 rounded-[14px] border px-3 py-2 text-xs font-bold ${
                  occupied
                    ? "border-rose-200 bg-white text-red-700"
                    : "border-emerald-200 bg-white text-emerald-700"
                }`}>
                  <CalendarClock size={14} className="mr-1 inline-block" />
                  {occupied ? "Acompanhar previsão de alta" : "Leito liberado"}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {selectedVacantBed && (
        <AdmissionModal
          bed={selectedVacantBed}
          mode="admit"
          onClose={() => setSelectedVacantBed(null)}
          onSave={(record) => { setBeds((current) => current.map((bed) => bed.id === record.id ? record : bed)); setSelectedVacantBed(null); }}
        />
      )}

      {selectedOccupiedBed && (
        <AdmissionModal
          bed={selectedOccupiedBed}
          mode="edit"
          onClose={() => setSelectedOccupiedBed(null)}
          onSave={(record) => { setBeds((current) => current.map((bed) => bed.id === record.id ? record : bed)); setSelectedOccupiedBed(null); }}
        />
      )}

      {dischargeBed && (
        <DischargeConfirmModal
          bed={dischargeBed}
          onCancel={() => setDischargeBed(null)}
          onConfirm={confirmDischarge}
        />
      )}
    </div>
  );
}

function AdmissionModal({ bed, mode, onClose, onSave }: { bed: BedRecord; mode: "admit" | "edit"; onClose: () => void; onSave: (record: BedRecord) => void }) {
  const editing = mode === "edit";
  const [patientOptions, setPatientOptions] = useState(patients);

  function handleAddPatient() {
    const name = window.prompt("Nome completo do novo paciente:")?.trim();
    if (!name) return;
    if (!patientOptions.some((item) => item.toLowerCase() === name.toLowerCase())) setPatientOptions((current) => [...current, name]);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const patient = String(data.get("patient") || "").trim();
    if (!patient) { window.alert("Selecione um paciente para continuar."); return; }
    const admissionDate = String(data.get("admittedAt") || "");
    const dischargeDate = String(data.get("expectedDischarge") || "");
    const record: BedRecord = {
      ...bed,
      status: "ocupado",
      patient,
      doctor: String(data.get("doctor") || ""),
      specialty: String(data.get("specialty") || ""),
      admittedAt: admissionDate ? new Date(`${admissionDate}T12:00:00`).toLocaleDateString("pt-BR") : bed.admittedAt,
      expectedDischarge: dischargeDate ? new Date(`${dischargeDate}T12:00:00`).toLocaleDateString("pt-BR") : bed.expectedDischarge,
      admissionReason: String(data.get("admissionReason") || ""),
      admissionCondition: String(data.get("admissionCondition") || ""),
      generalState: String(data.get("generalState") || ""),
      vitals: { pa: String(data.get("pa") || ""), fc: String(data.get("fc") || ""), fr: String(data.get("fr") || ""), temp: String(data.get("temp") || ""), spo2: String(data.get("spo2") || "") },
      initialDiagnosis: String(data.get("initialDiagnosis") || ""),
      treatmentPlan: String(data.get("treatmentPlan") || ""),
      instructions: String(data.get("instructions") || ""),
    };
    onSave(record);
  }
  return (
    <div className="fixed inset-0 z-[99999] grid min-h-dvh place-items-center overflow-hidden px-4 py-3">
      <button
        type="button"
        aria-label="Fechar ficha de internação"
        onClick={onClose}
        className="fixed inset-0 bg-[#1f0805]/62 backdrop-blur-md"
      />

      <form onSubmit={handleSubmit} className="relative z-10 flex w-full max-w-6xl max-h-[90vh] flex-col overflow-hidden rounded-[18px] border border-white/45 bg-[#fcf6ee] shadow-[0_28px_90px_rgba(27,10,7,0.36)]">
        <div className="border-b border-hpsr-border bg-[linear-gradient(135deg,#fffaf4_0%,#f5e7d8_100%)] px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[16px] bg-[#efe0d2] text-hpsr-wine">
                <BedDouble size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Internação</p>
                <h2 className="mt-1 text-lg font-black text-hpsr-text">{editing ? `Editar ficha do ${bed.label}` : `Internar Paciente no ${bed.label}`}</h2>
                <p className="mt-1 text-sm font-semibold text-hpsr-muted">
                  {editing ? "Atualize os dados do paciente internado." : "Preencha os dados abaixo para registrar a internação."}
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

        <div className="min-h-0 flex-1 overflow-y-auto p-3.5">
          {editing && (
            <div className="mb-5 grid gap-3 rounded-[18px] border border-hpsr-border bg-white p-3.5 sm:grid-cols-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">Leito</p>
                <p className="mt-1 text-sm font-black text-hpsr-text">{bed.label}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">Paciente</p>
                <p className="mt-1 text-sm font-black uppercase text-hpsr-text">{bed.patient}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">Entrada</p>
                <p className="mt-1 text-sm font-black text-hpsr-text">{bed.admittedAt}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">Previsão</p>
                <p className="mt-1 text-sm font-black text-hpsr-text">{bed.expectedDischarge}</p>
              </div>
            </div>
          )}

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.68fr)]">
            <section className="rounded-[24px] border border-hpsr-border bg-white p-3.5">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Dados da internação</p>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <AdmissionField label="Paciente">
                  <select name="patient" className={admissionInputClass} defaultValue={editing ? bed.patient ?? "" : ""}>
                    <option value="">Selecione um paciente...</option>
                    {patientOptions.map((patient) => (
                      <option key={patient} value={patient}>{patient}</option>
                    ))}
                  </select>
                </AdmissionField>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleAddPatient}
                    className="inline-flex min-h-[38px] w-full items-center justify-center gap-2 rounded-[16px] border border-hpsr-border bg-[#fff8f0] px-4 text-sm font-black text-hpsr-wine transition hover:bg-white"
                  >
                    <Plus size={15} />
                    Adicionar Novo Paciente
                  </button>
                </div>

                <AdmissionField label="Médico Responsável">
                  <select name="doctor" className={admissionInputClass} defaultValue={editing ? bed.doctor ?? "" : ""}>
                    <option value="">Selecione...</option>
                    {doctors.map((doctor) => (
                      <option key={doctor} value={doctor}>{doctor}</option>
                    ))}
                  </select>
                </AdmissionField>

                <AdmissionField label="Especialidade">
                  <select name="specialty" className={admissionInputClass} defaultValue={editing ? bed.specialty ?? "Clínico Geral" : "Clínico Geral"}>
                    <option value="">Selecione...</option>
                    {specialties.map((specialty) => (
                      <option key={specialty} value={specialty}>{specialty}</option>
                    ))}
                  </select>
                </AdmissionField>

                <AdmissionField label="Data de Entrada">
                  <input name="admittedAt" type="date" className={admissionInputClass} defaultValue={editing ? toDateInputValue(bed.admittedAt) : new Date().toISOString().slice(0,10)} />
                </AdmissionField>

                <AdmissionField label="Previsão de Alta">
                  <input name="expectedDischarge" type="date" className={admissionInputClass} defaultValue={editing ? toDateInputValue(bed.expectedDischarge) : new Date(Date.now()+2*86400000).toISOString().slice(0,10)} />
                </AdmissionField>

                <AdmissionField label="Motivo da Internação" className="md:col-span-2">
                  <textarea name="admissionReason" className={`${admissionInputClass} min-h-[86px] resize-none py-3`} defaultValue={editing ? bed.admissionReason ?? "" : ""} placeholder="Descreva o motivo da internação..." />
                </AdmissionField>

                <AdmissionField label="Condição na Admissão" className="md:col-span-2">
                  <textarea name="admissionCondition" className={`${admissionInputClass} min-h-[86px] resize-none py-3`} defaultValue={editing ? bed.admissionCondition ?? "" : ""} placeholder="Descreva a condição clínica na entrada..." />
                </AdmissionField>
              </div>
            </section>

            <section className="grid gap-3">
              <div className="rounded-[24px] border border-hpsr-border bg-white p-3.5">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Estado geral</p>

                <div className="mt-4 grid gap-3">
                  <AdmissionField label="Estado Geral">
                    <select name="generalState" className={admissionInputClass} defaultValue={editing ? bed.generalState ?? "Estável" : "Estável"}>
                      <option value="">Selecione...</option>
                      <option>Estável</option>
                      <option>Observação</option>
                      <option>Grave</option>
                      <option>Crítico</option>
                    </select>
                  </AdmissionField>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.1em] text-hpsr-wineLight">Sinais Vitais na Entrada</p>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <VitalInput name="pa" label="PA" value={editing ? bed.vitals?.pa ?? "120/80" : "120/80"} />
                      <VitalInput name="fc" label="FC" value={editing ? bed.vitals?.fc ?? "80 bpm" : "80 bpm"} />
                      <VitalInput name="fr" label="FR" value={editing ? bed.vitals?.fr ?? "16 rpm" : "16 rpm"} />
                      <VitalInput name="temp" label="Temp." value={editing ? bed.vitals?.temp ?? "36.5°C" : "36.5°C"} />
                      <VitalInput name="spo2" label="SpO₂" value={editing ? bed.vitals?.spo2 ?? "98%" : "98%"} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-hpsr-border bg-white p-3.5">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Plano inicial</p>

                <div className="mt-4 grid gap-3">
                  <AdmissionField label="Diagnóstico Inicial">
                    <textarea name="initialDiagnosis" className={`${admissionInputClass} min-h-[70px] resize-none py-3`} defaultValue={editing ? bed.initialDiagnosis ?? "" : ""} />
                  </AdmissionField>
                  <AdmissionField label="Conduta e Tratamento">
                    <textarea name="treatmentPlan" className={`${admissionInputClass} min-h-[70px] resize-none py-3`} defaultValue={editing ? bed.treatmentPlan ?? "" : ""} />
                  </AdmissionField>
                  <AdmissionField label="Orientações">
                    <textarea name="instructions" className={`${admissionInputClass} min-h-[70px] resize-none py-3`} defaultValue={editing ? bed.instructions ?? "" : ""} />
                  </AdmissionField>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-hpsr-border bg-white/[0.92] p-3.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold text-hpsr-muted">
            {editing ? `As alterações ficarão registradas na ficha do ${bed.label}.` : `O registro ocupará o ${bed.label} e ficará disponível para edição pela equipe.`}
          </p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[16px] border border-hpsr-border bg-white px-4 py-3 text-sm font-black text-hpsr-text transition hover:bg-[#fff8f0]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-[16px] bg-[linear-gradient(135deg,#672614,#74321e)] px-4 py-3 text-sm font-black text-white transition"
            >
              {editing ? "Salvar alterações" : "Registrar internação"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}


function DischargeConfirmModal({
  bed,
  onCancel,
  onConfirm,
}: {
  bed: BedRecord;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[99999] grid min-h-dvh place-items-center px-4 py-3">
      <button
        type="button"
        aria-label="Cancelar alta hospitalar"
        onClick={onCancel}
        className="fixed inset-0 bg-[#1f0805]/62 backdrop-blur-md"
      />

      <section className="relative z-10 w-full max-w-md overflow-hidden rounded-[22px] border border-white/45 bg-[#fcf6ee] shadow-[0_28px_90px_rgba(27,10,7,0.36)]">
        <div className="border-b border-hpsr-border bg-[linear-gradient(135deg,#fffaf4_0%,#f5e7d8_100%)] px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[16px] bg-amber-100 text-amber-700">
              <AlertTriangle size={23} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Confirmar alta</p>
              <h2 className="mt-1 text-lg font-black text-hpsr-text">Dar alta hospitalar?</h2>
              <p className="mt-1 text-sm font-semibold text-hpsr-muted">
                Esta ação atualizará a condição do paciente e liberará o {bed.label}.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 p-3.5">
          <div className="rounded-[18px] border border-hpsr-border bg-white p-3.5">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">Paciente</p>
            <p className="mt-1 text-sm font-black uppercase text-hpsr-text">{bed.patient}</p>
            <p className="mt-1 text-sm font-semibold text-hpsr-muted">{bed.label} · {bed.doctor}</p>
          </div>

          <p className="text-sm font-semibold leading-relaxed text-hpsr-muted">
            Depois da confirmação, o leito ficará como <strong className="text-emerald-700">vago</strong> e poderá receber uma nova internação.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-hpsr-border bg-white/[0.92] p-3.5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-[16px] border border-hpsr-border bg-white px-4 py-3 text-sm font-black text-hpsr-text transition hover:bg-[#fff8f0]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-[16px] bg-[linear-gradient(135deg,#8f1f16,#672614)] px-4 py-3 text-sm font-black text-white transition"
          >
            Confirmar alta
          </button>
        </div>
      </section>
    </div>
  );
}

function toDateInputValue(value?: string) {
  if (!value) return "";
  const [datePart] = value.split(" ");
  const [day, month, year] = datePart.split("/");
  if (!day || !month || !year) return "";
  return `20${year}-${month}-${day}`;
}

function BedMetric({ label, value, tone }: { label: string; value: string; tone: "neutral" | "occupied" | "free" }) {
  const toneClass =
    tone === "occupied"
      ? "border-rose-200 bg-rose-50 text-red-700"
      : tone === "free"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-hpsr-border bg-white text-hpsr-text";

  return (
    <div className={`rounded-[16px] border px-4 py-3 ${toneClass}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-75">{label}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}

const admissionInputClass =
  "min-h-[42px] w-full rounded-[16px] border border-hpsr-border bg-[#fffaf4] px-3 text-sm font-semibold text-hpsr-text outline-none transition placeholder:text-zinc-400 focus:border-hpsr-wineLight focus:bg-white focus:ring-2 focus:ring-hpsr-wineLight/20";

function AdmissionField({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-black uppercase tracking-[0.1em] text-hpsr-wineLight">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function VitalInput({ name, label, value }: { name: string; label: string; value: string }) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-[0.1em] text-hpsr-wineLight">{label}</span>
      <input name={name} className={`${admissionInputClass} mt-1`} defaultValue={value} />
    </label>
  );
}
