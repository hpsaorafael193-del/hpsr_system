"use client";

import { addBrazilDays, brazilDate } from "@/lib/brazil-datetime";

import { StyledSelect } from "@/components/ui/StyledSelect";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { hpsrAlert, hpsrPrompt } from "@/components/ui/HpsrDialogProvider";
import { usePatientSelection } from "@/components/patients/PatientSelectionProvider";
import { createClient } from "@/lib/supabase";
import { isClinicalProfessional } from "@/lib/clinical-scheduling";
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
  UsersRound,
  History,
  X,
} from "lucide-react";

type BedStatus = "ocupado" | "vago";
type BedType = "normal" | "gestante" | "infantil";

type BedRecord = {
  id: string;
  label: string;
  status: BedStatus;
  type: BedType;
  patient?: string;
  patientPassport?: string;
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
  updatedAt?: string;
};

type BedHistoryRecord = {
  id: string;
  bed_id: string;
  event_type: string;
  patient_name?: string | null;
  patient_passport?: string | null;
  doctor_name?: string | null;
  visitor_name?: string | null;
  visitor_passport?: string | null;
  visitor_age?: string | null;
  relation?: string | null;
  notes?: string | null;
  payload?: Record<string, unknown> | null;
  created_at: string;
};

const initialBeds: BedRecord[] = [
  { id: "leito-normal-01", label: "Leito Normal 01", type: "normal", status: "vago" },
  { id: "leito-normal-02", label: "Leito Normal 02", type: "normal", status: "vago" },
  { id: "leito-gestante-01", label: "Leito Gestante", type: "gestante", status: "vago" },
  { id: "leito-infantil-01", label: "Leito Infantil 01", type: "infantil", status: "vago" },
  { id: "leito-infantil-02", label: "Leito Infantil 02", type: "infantil", status: "vago" },
];

const bedTypeLabels: Record<BedType, string> = {
  normal: "Normal",
  gestante: "Gestante",
  infantil: "Infantil",
};

const specialties = ["Clínico Geral", "Obstetra", "Pediatra", "Psicóloga", "Psiquiatra", "Neurologia", "Oftalmologia", "Cardiologia", "Dermatologia", "Nutricionista", "Cirurgião", "Ginecologia"];

type DoctorOption = {
  id: string;
  name: string;
  label: string;
};

export default function BedsPage() {
  const { patients, loading: patientsLoading, upsertPatient } = usePatientSelection();
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [beds, setBeds] = useState<BedRecord[]>(initialBeds);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [selectedVacantBed, setSelectedVacantBed] = useState<BedRecord | null>(null);
  const [selectedOccupiedBed, setSelectedOccupiedBed] = useState<BedRecord | null>(null);
  const [dischargeBed, setDischargeBed] = useState<BedRecord | null>(null);
  const [bedHistory, setBedHistory] = useState<BedHistoryRecord[]>([]);
  const [loadingBeds, setLoadingBeds] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadDoctors() {
      const client = createClient();
      if (!client) {
        if (active) setDoctorsLoading(false);
        return;
      }

      const { data, error } = await client
        .from("profiles")
        .select("id,name,role,specialty,crm")
        .eq("access_status", "Aprovado")
        .order("name");

      if (!active) return;
      setDoctorsLoading(false);

      if (error) {
        console.error("[HPSR] Falha ao carregar médicos da Gestão de Leitos:", error.message);
        void hpsrAlert(`Não foi possível carregar os médicos responsáveis: ${error.message}`, "Gestão de Leitos");
        return;
      }

      const options = (data || [])
        .filter((row) => isClinicalProfessional(row))
        .map((row) => {
          const name = String(row.name || "Médico sem nome").trim();
          return { id: String(row.id), name, label: /^dr\.?\s|^dra\.?\s/i.test(name) ? name : `Dr. ${name}` };
        });
      setDoctors(options);
    }

    void loadDoctors();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadBedData() {
      const client = createClient();
      if (!client) { if (active) setLoadingBeds(false); return; }
      const [{ data: bedRows, error: bedError }, { data: historyRows, error: historyError }] = await Promise.all([
        client.from("hospital_beds").select("id,status,payload,updated_at").order("id"),
        client.from("hospital_bed_history").select("id,bed_id,event_type,patient_name,patient_passport,doctor_name,visitor_name,visitor_passport,visitor_age,relation,notes,payload,created_at").order("created_at", { ascending: false }).limit(300),
      ]);
      if (!active) return;
      setLoadingBeds(false);
      if (bedError) { void hpsrAlert(`Não foi possível carregar os leitos: ${bedError.message}`, "Gestão de Leitos"); return; }
      if (bedRows?.length) {
        setBeds(bedRows.map((row) => ({ id: String(row.id), status: row.status === "ocupado" ? "ocupado" : "vago", ...(row.payload as Omit<BedRecord, "id" | "status">), updatedAt: row.updated_at })));
      }
      if (historyError) {
        console.error("[HPSR] Falha ao carregar histórico de leitos:", historyError.message);
      }
      setBedHistory((historyRows || []) as BedHistoryRecord[]);
    }
    void loadBedData();
    return () => { active = false; };
  }, []);

  const patientOptions = useMemo(
    () => patients.map((patient) => ({
      value: patient.passport,
      label: `${patient.name} · ${patient.passport}`,
      name: patient.name,
    })),
    [patients],
  );

  const occupiedCount = beds.filter((bed) => bed.status === "ocupado").length;
  const freeCount = beds.length - occupiedCount;
  const pendingReviewCount = beds.filter((bed) => isReviewPending(bed)).length;

  async function saveBed(record: BedRecord, eventType: "admission" | "update" | "discharge") {
    const client = createClient();
    if (!client) return false;
    const payload = { ...record };
    delete (payload as Partial<BedRecord>).id;
    delete (payload as Partial<BedRecord>).status;
    const { data, error } = await client.rpc("save_hospital_bed_staff", {
      p_bed_id: record.id,
      p_status: record.status,
      p_payload: payload,
      p_event_type: eventType,
      p_patient_name: record.patient || null,
      p_patient_passport: record.patientPassport || null,
      p_doctor_name: record.doctor || null,
    });
    if (error) { await hpsrAlert(`Não foi possível salvar o leito: ${error.message}`, "Gestão de Leitos"); return false; }
    const historyRow = data && typeof data === "object" && "history" in data
      ? (data as { history?: BedHistoryRecord }).history
      : null;
    if (historyRow) setBedHistory((current) => [historyRow, ...current].slice(0, 300));
    setBeds((current) => current.map((bed) => bed.id === record.id ? record : bed));
    return true;
  }

  async function registerVisit(bed: BedRecord) {
    if (bed.status !== "ocupado") return;
    const visitorName = (await hpsrPrompt("Nome completo do visitante:", "", "Registrar visita"))?.trim();
    if (!visitorName) return;
    const visitorPassport = (await hpsrPrompt("Passaporte/documento do visitante:", "", "Registrar visita"))?.trim() || "";
    const visitorAge = (await hpsrPrompt("Idade do visitante:", "", "Registrar visita"))?.trim() || "";
    const relation = (await hpsrPrompt("Relação com o paciente:", "", "Registrar visita"))?.trim() || "";
    const notes = (await hpsrPrompt("Observações da visita (opcional):", "", "Registrar visita"))?.trim() || "";
    const client = createClient();
    if (!client) return;
    const { data, error } = await client.rpc("register_hospital_bed_visit_staff", {
      p_bed_id: bed.id,
      p_patient_name: bed.patient || null,
      p_patient_passport: bed.patientPassport || null,
      p_visitor_name: visitorName,
      p_visitor_passport: visitorPassport || null,
      p_visitor_age: visitorAge || null,
      p_relation: relation || null,
      p_notes: notes || null,
    });
    if (error) { await hpsrAlert(`Não foi possível registrar a visita: ${error.message}`, "Gestão de Leitos"); return; }
    const historyRow = data && typeof data === "object" && "history" in data
      ? (data as { history?: BedHistoryRecord }).history
      : null;
    if (historyRow) setBedHistory((current) => [historyRow, ...current].slice(0, 300));
    await hpsrAlert("Visita registrada no histórico do leito.", "Gestão de Leitos");
  }

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

  async function confirmDischarge() {
    if (!dischargeBed) return;
    const released: BedRecord = { id: dischargeBed.id, label: dischargeBed.label, type: dischargeBed.type, status: "vago" };
    const saved = await saveBed(released, "discharge");
    if (!saved) return;
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

        <div className="grid gap-3 px-4 py-3 sm:grid-cols-2 xl:grid-cols-6">
          <BedMetric label="Total de leitos" value={String(beds.length)} tone="neutral" />
          <BedMetric label="Ocupados" value={String(occupiedCount)} tone="occupied" />
          <BedMetric label="Reavaliação pendente" value={String(pendingReviewCount)} tone="pending" />
          <BedMetric label="Normais" value="2" tone="neutral" />
          <BedMetric label="Infantis/gestante" value="3" tone="neutral" />
          <BedMetric label="Vagos" value={String(freeCount)} tone="free" />
        </div>
      </section>

      <section className="min-h-0 flex-1 overflow-hidden rounded-[18px] border border-hpsr-border bg-white/[0.86] p-3">
        <div className="grid h-full auto-rows-fr gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-6">
          {beds.map((bed, index) => {
            const occupied = bed.status === "ocupado";
            const menuOpen = openMenu === bed.id;

            return (
              <article
                key={bed.id}
                onClick={() => openAdmissionForm(bed)}
                className={`relative flex min-h-[240px] flex-col overflow-visible rounded-[18px] border p-3.5 text-center transition ${
                  bed.type === "normal" ? "xl:col-span-3" : "xl:col-span-2"
                } ${
                  index === beds.length - 1 ? "sm:col-span-2 xl:col-span-2" : "sm:col-span-1"
                } ${
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
                        <>
                        <button
                          type="button"
                          onClick={() => { setOpenMenu(null); void registerVisit(bed); }}
                          className="flex w-full items-center gap-2 border-t border-hpsr-border px-3 py-2.5 text-sm font-bold text-hpsr-text transition hover:bg-[#fff7ef]"
                        >
                          <UsersRound size={15} />
                          Registrar visita
                        </button>
                        <button
                          type="button"
                          onClick={() => askDischargeConfirmation(bed)}
                          className="flex w-full items-center gap-2 border-t border-hpsr-border px-3 py-2.5 text-sm font-bold text-hpsr-text transition hover:bg-[#fff7ef]"
                        >
                          <LogOut size={15} />
                          Dar alta hospitalar
                        </button>
                        </>
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
                  <span className="mt-2 rounded-full border border-hpsr-border bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">
                    {bedTypeLabels[bed.type]}
                  </span>

                  <div className={`mt-5 flex h-8 w-8 items-center justify-center rounded-[18px] ${
                    occupied ? "bg-rose-100 text-red-600" : "bg-emerald-100 text-emerald-700"
                  }`}>
                    <BedDouble size={30} />
                  </div>

                  {occupied ? (
                    <div className="mt-4 space-y-2">
                      {isReviewPending(bed) && <p className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-[.08em] text-amber-800"><AlertTriangle size={12} /> Reavaliação pendente</p>}
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
                  {occupied ? (isReviewPending(bed) ? "Prazo encerrado · aguarda decisão médica" : "Acompanhar previsão de alta") : "Leito liberado"}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-[18px] border border-hpsr-border bg-white/[0.88] shadow-[0_12px_30px_rgba(42,7,0,0.05)]">
        <div className="flex items-center justify-between gap-3 border-b border-hpsr-border bg-[#fffaf4] px-4 py-3">
          <div><p className="text-[10px] font-black uppercase tracking-[.16em] text-hpsr-wineLight">Histórico de leitos</p><h2 className="mt-1 text-lg font-black text-hpsr-text">Internações, altas, atualizações e visitas</h2></div>
          <History size={20} className="text-hpsr-wine" />
        </div>
        <div className="hpsr-touch-scroll max-h-[360px] overflow-y-auto p-3">
          <div className="space-y-2">
            {bedHistory.map((item) => item.event_type === "visit" ? (
              <article key={`visit-${item.id}`} className="rounded-[16px] border border-sky-200 bg-sky-50/60 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-black text-hpsr-text">Visita · {item.visitor_name}</p><span className="text-xs font-bold text-hpsr-muted">{formatDateTime(item.created_at)}</span></div>
                <p className="mt-1 text-xs font-semibold text-hpsr-muted">{item.patient_name || "Paciente não informado"} · {bedLabelById(beds, item.bed_id)}{item.relation ? ` · ${item.relation}` : ""}</p>
                {(item.visitor_passport || item.visitor_age || item.notes) && <p className="mt-1 text-xs text-hpsr-muted">{[item.visitor_passport, item.visitor_age ? `${item.visitor_age} anos` : "", item.notes].filter(Boolean).join(" · ")}</p>}
              </article>
            ) : (
              <article key={`event-${item.id}`} className="rounded-[16px] border border-hpsr-border bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-black text-hpsr-text">{eventLabel(item.event_type)} · {bedLabelById(beds, item.bed_id)}</p><span className="text-xs font-bold text-hpsr-muted">{formatDateTime(item.created_at)}</span></div>
                <p className="mt-1 text-xs font-semibold text-hpsr-muted">{item.patient_name || "Leito sem paciente"}{item.doctor_name ? ` · ${item.doctor_name}` : ""}</p>
              </article>
            ))}
            {!bedHistory.length && <p className="rounded-[16px] border border-dashed border-hpsr-border p-5 text-center text-sm font-semibold text-hpsr-muted">Nenhuma atividade registrada ainda.</p>}
          </div>
        </div>
      </section>

      {selectedVacantBed && (
        <AdmissionModal
          bed={selectedVacantBed}
          mode="admit"
          onClose={() => setSelectedVacantBed(null)}
          onSave={async (record) => { if (await saveBed(record, "admission")) setSelectedVacantBed(null); }}
          patientOptions={patientOptions}
          patientsLoading={patientsLoading}
          doctors={doctors}
          doctorsLoading={doctorsLoading}
          upsertPatient={upsertPatient}
        />
      )}

      {selectedOccupiedBed && (
        <AdmissionModal
          bed={selectedOccupiedBed}
          mode="edit"
          onClose={() => setSelectedOccupiedBed(null)}
          onSave={async (record) => { if (await saveBed(record, "update")) setSelectedOccupiedBed(null); }}
          patientOptions={patientOptions}
          patientsLoading={patientsLoading}
          doctors={doctors}
          doctorsLoading={doctorsLoading}
          upsertPatient={upsertPatient}
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

function AdmissionModal({
  bed, mode, onClose, onSave, patientOptions, patientsLoading, doctors, doctorsLoading, upsertPatient,
}: {
  bed: BedRecord;
  mode: "admit" | "edit";
  onClose: () => void;
  onSave: (record: BedRecord) => void | Promise<void>;
  patientOptions: Array<{ value: string; label: string; name: string }>;
  patientsLoading: boolean;
  doctors: DoctorOption[];
  doctorsLoading: boolean;
  upsertPatient: (patient: { name: string; passport: string; age: string; bloodType: string; cityPhone?: string; email?: string }) => Promise<boolean>;
}) {
  const editing = mode === "edit";
  const [manualPatient, setManualPatient] = useState(false);

  async function handleAddPatient() {
    const name = (await hpsrPrompt("Nome completo do novo paciente:", "", "Cadastro rápido"))?.trim();
    if (!name) return;
    const passport = (await hpsrPrompt("Documento / passaporte do paciente:", "", "Cadastro rápido"))?.trim().toUpperCase();
    if (!passport) return;
    const saved = await upsertPatient({ name, passport, age: "", bloodType: "" });
    if (!saved) {
      await hpsrAlert("Não foi possível cadastrar o paciente no Prontuário.", "Gestão de Leitos");
      return;
    }
    await hpsrAlert("Paciente cadastrado e sincronizado com o Prontuário.", "Gestão de Leitos");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const patientValue = String(data.get("patient") || "").trim();
    const selectedPatient = patientOptions.find((option) => option.value === patientValue);
    const patient = selectedPatient?.name || patientValue;
    const patientPassport = selectedPatient?.value || "";
    if (!patient) { void hpsrAlert("Selecione um paciente para continuar.", "Paciente obrigatório"); return; }
    const admissionDate = String(data.get("admittedAt") || "");
    const dischargeDate = String(data.get("expectedDischarge") || "");
    const record: BedRecord = {
      ...bed,
      status: "ocupado",
      patient,
      patientPassport,
      doctor: String(data.get("doctor") || ""),
      specialty: String(data.get("specialty") || ""),
      admittedAt: admissionDate ? new Date(`${admissionDate}T12:00:00`).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : bed.admittedAt,
      expectedDischarge: dischargeDate ? new Date(`${dischargeDate}T12:00:00`).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : bed.expectedDischarge,
      admissionReason: String(data.get("admissionReason") || ""),
      admissionCondition: String(data.get("admissionCondition") || ""),
      generalState: String(data.get("generalState") || ""),
      vitals: { pa: String(data.get("pa") || ""), fc: String(data.get("fc") || ""), fr: String(data.get("fr") || ""), temp: String(data.get("temp") || ""), spo2: String(data.get("spo2") || "") },
      initialDiagnosis: String(data.get("initialDiagnosis") || ""),
      treatmentPlan: String(data.get("treatmentPlan") || ""),
      instructions: String(data.get("instructions") || ""),
    };
    await onSave(record);
  }
  return (
    <div className="fixed inset-0 z-[99999] grid min-h-dvh place-items-center overflow-hidden px-4 py-3">
      <button
        type="button"
        aria-label="Fechar ficha de internação"
        onClick={onClose}
        className="fixed inset-0 bg-[#1f0805]/62"
      />

      <form onSubmit={handleSubmit} className="hpsr-modal-motion relative z-10 flex w-full max-w-6xl max-h-[90vh] flex-col overflow-hidden rounded-[18px] border border-white/45 bg-[#fcf6ee] shadow-[0_28px_90px_rgba(27,10,7,0.36)]">
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
                  <div className="space-y-2">
                    <button type="button" onClick={() => setManualPatient((current) => !current)} className="text-[11px] font-black text-hpsr-wine">
                      {manualPatient ? "Selecionar do Prontuário" : "Informar manualmente"}
                    </button>
                    {manualPatient ? (
                      <input name="patient" className={admissionInputClass} defaultValue={editing ? bed.patient ?? "" : ""} placeholder="Nome e documento do paciente" required />
                    ) : (
                      <StyledSelect name="patient" className={admissionInputClass} defaultValue={editing ? bed.patient ?? "" : ""} searchable disabled={patientsLoading}>
                        <option value="">{patientsLoading ? "Carregando pacientes..." : "Selecione um paciente..."}</option>
                        {patientOptions.map((patient) => (<option key={patient.value} value={patient.label}>{patient.label}</option>))}
                      </StyledSelect>
                    )}
                  </div>
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
                  <StyledSelect name="doctor" className={admissionInputClass} defaultValue={editing ? bed.doctor ?? "" : ""} searchable disabled={doctorsLoading}>
                    <option value="">{doctorsLoading ? "Carregando médicos..." : "Selecione..."}</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.label}>{doctor.label}</option>
                    ))}
                  </StyledSelect>
                </AdmissionField>

                <AdmissionField label="Especialidade">
                  <StyledSelect name="specialty" className={admissionInputClass} defaultValue={editing ? bed.specialty ?? "Clínico Geral" : "Clínico Geral"}>
                    <option value="">Selecione...</option>
                    {specialties.map((specialty) => (
                      <option key={specialty} value={specialty}>{specialty}</option>
                    ))}
                  </StyledSelect>
                </AdmissionField>

                <AdmissionField label="Data de Entrada">
                  <input name="admittedAt" type="date" className={admissionInputClass} defaultValue={editing ? toDateInputValue(bed.admittedAt) : brazilDate()} />
                </AdmissionField>

                <AdmissionField label="Previsão de Alta">
                  <input name="expectedDischarge" type="date" className={admissionInputClass} defaultValue={editing ? toDateInputValue(bed.expectedDischarge) : addBrazilDays(2)} />
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
                    <StyledSelect name="generalState" className={admissionInputClass} defaultValue={editing ? bed.generalState ?? "Estável" : "Estável"}>
                      <option value="">Selecione...</option>
                      <option>Estável</option>
                      <option>Observação</option>
                      <option>Grave</option>
                      <option>Crítico</option>
                    </StyledSelect>
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
        className="fixed inset-0 bg-[#1f0805]/62"
      />

      <section className="hpsr-modal-motion relative z-10 w-full max-w-md overflow-hidden rounded-[22px] border border-white/45 bg-[#fcf6ee] shadow-[0_28px_90px_rgba(27,10,7,0.36)]">
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

function isReviewPending(bed: BedRecord) {
  if (bed.status !== "ocupado" || !bed.expectedDischarge) return false;
  const value = toDateInputValue(bed.expectedDischarge);
  if (!value) return false;
  return new Date(`${value}T23:59:59`).getTime() < Date.now();
}

function eventLabel(type: string) {
  return ({ admission: "Internação registrada", update: "Ficha atualizada", discharge: "Alta autorizada" } as Record<string, string>)[type] || type;
}

function bedLabelById(beds: BedRecord[], id: string) { return beds.find((bed) => bed.id === id)?.label || id; }
function formatDateTime(value: string) { return new Date(value).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }); }

function toDateInputValue(value?: string) {
  if (!value) return "";
  const [datePart] = value.split(" ");
  const [day, month, year] = datePart.split("/");
  if (!day || !month || !year) return "";
  const normalizedYear = year.length === 2 ? `20${year}` : year;
  return `${normalizedYear}-${month}-${day}`;
}

function BedMetric({ label, value, tone }: { label: string; value: string; tone: "neutral" | "occupied" | "free" | "pending" }) {
  const toneClass =
    tone === "occupied"
      ? "border-rose-200 bg-rose-50 text-red-700"
      : tone === "free"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : tone === "pending"
          ? "border-amber-200 bg-amber-50 text-amber-800"
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
