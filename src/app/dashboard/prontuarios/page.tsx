"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Archive,
  ChevronDown,
  ClipboardPlus,
  FileClock,
  FileText,
  Eye,
  Download,
  LoaderCircle,
  HeartPulse,
  IdCard,
  NotebookPen,
  Pill,
  Plus,
  Search,
  RefreshCw,
  Stethoscope,
  Syringe,
  UserRound,
  UsersRound,
  Trash2,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useCurrentUserProfile } from "@/components/auth/CurrentUserProfileProvider";
import { usePatientSelection } from "@/components/patients/PatientSelectionProvider";
import { hpsrAlert, hpsrConfirm } from "@/components/ui/HpsrDialogProvider";
import { createClient } from "@/lib/supabase";
import { ClinicalRecordsPortalPanel } from "@/components/dashboard/ClinicalRecordsPortalPanel";

type RecordTab = "geral" | "timeline" | "consultas" | "exames" | "documentos" | "prescricoes" | "procedimentos" | "observacoes";

type PatientRecord = {
  id: string;
  name: string;
  passport: string;
  age: string;
  bloodType: string;
  cityPhone: string;
  status: "Ativo" | "Em acompanhamento" | "Arquivado";
  followUp: string;
  lastVisit: string;
  alerts: string[];
};

type TimelineEvent = {
  id: string;
  patientPassport: string;
  type: "Consulta" | "Exame" | "Documento" | "Prescrição" | "Procedimento" | "Observação";
  title: string;
  date: string;
  doctor: string;
  status: string;
  summary: string;
};

const tabs: Array<{ id: RecordTab; label: string; icon: ReactNode }> = [
  { id: "geral", label: "Visão Geral", icon: <IdCard size={15} /> },
  { id: "timeline", label: "Linha do Tempo", icon: <FileClock size={15} /> },
  { id: "consultas", label: "Consultas", icon: <Stethoscope size={15} /> },
  { id: "exames", label: "Exames", icon: <FileText size={15} /> },
  { id: "documentos", label: "Documentos", icon: <Archive size={15} /> },
  { id: "prescricoes", label: "Prescrições", icon: <Pill size={15} /> },
  { id: "procedimentos", label: "Procedimentos", icon: <Syringe size={15} /> },
  { id: "observacoes", label: "Observações", icon: <NotebookPen size={15} /> },
];

const initialPatients: PatientRecord[] = [];

const initialTimelineEvents: TimelineEvent[] = [];

function formatDate(value: string) {
  if (!value.includes("-")) return value;
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function statusClasses(status: PatientRecord["status"]) {
  switch (status) {
    case "Em acompanhamento":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Arquivado":
      return "border-zinc-200 bg-zinc-100 text-zinc-700";
    default:
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
}

function eventIcon(type: TimelineEvent["type"]) {
  const classes = "text-hpsr-wine";
  switch (type) {
    case "Consulta":
      return <Stethoscope size={17} className={classes} />;
    case "Exame":
      return <FileText size={17} className={classes} />;
    case "Documento":
      return <Archive size={17} className={classes} />;
    case "Prescrição":
      return <Pill size={17} className={classes} />;
    case "Procedimento":
      return <Syringe size={17} className={classes} />;
    default:
      return <NotebookPen size={17} className={classes} />;
  }
}

export default function RecordsPage() {
  const { profile: currentUserProfile } = useCurrentUserProfile();
  const { patients: sharedPatients, loading: sharedPatientsLoading, selectedPassport: sharedSelectedPassport, selectPatient: selectSharedPatient } = usePatientSelection();
  const [patients, setPatients] = useState<PatientRecord[]>(initialPatients);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(initialTimelineEvents);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPassport, setSelectedPassport] = useState("");
  const [activeTab, setActiveTab] = useState<RecordTab>("geral");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isClinicalRecordOpen, setIsClinicalRecordOpen] = useState(false);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [isDeletingPatient, setIsDeletingPatient] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [examViewer, setExamViewer] = useState<{
    open: boolean;
    loading: boolean;
    title: string;
    reportHtml: string;
    previewImages: string[];
    patientName: string;
    doctorName: string;
    savedAt: string;
  }>({ open: false, loading: false, title: "", reportHtml: "", previewImages: [], patientName: "", doctorName: "", savedAt: "" });

  useEffect(() => {
    if (sharedSelectedPassport) setSelectedPassport(sharedSelectedPassport);
  }, [sharedSelectedPassport]);

  useEffect(() => {
    if (!sharedPatients.length) return;
    setPatients((current) => {
      const map = new Map(current.map((patient) => [patient.passport, patient]));
      for (const patient of sharedPatients) {
        const existing = map.get(patient.passport);
        map.set(patient.passport, {
          id: existing?.id || `pac-${patient.passport}`,
          name: patient.name || existing?.name || `Paciente ${patient.passport}`,
          passport: patient.passport,
          age: patient.age || existing?.age || "—",
          bloodType: patient.bloodType || existing?.bloodType || "—",
          cityPhone: patient.cityPhone || existing?.cityPhone || "Não informado",
          status: existing?.status || "Ativo",
          followUp: existing?.followUp || "Prontuário clínico",
          lastVisit: existing?.lastVisit || "—",
          alerts: existing?.alerts || [],
        });
      }
      return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    });
  }, [sharedPatients]);

  useEffect(() => {
    const client = createClient();
    if (!client) return;
    const supabase = client;

    let active = true;

    async function loadPatients() {
      setIsLoadingPatients(true);
      const [registryResult, recordsResult, appointmentsResult, portalResult] = await Promise.all([
        supabase.from("patient_registry").select("passport,name,age,blood_type,city_phone,email,follow_up,created_at,updated_at").order("created_at", { ascending: false }),
        supabase.from("clinical_records").select("id,patient_passport,record_type,created_at,title:payload->>title,exam_name:payload->>examName,document_title:payload->>documentTitle,doctor_name:payload->doctor->>name,doctor_name_flat:payload->>doctorName,summary:payload->>summary").order("created_at", { ascending: false }),
        supabase.from("appointments").select("id,passport,patient,status,created_at,updated_at,specialty:payload->>specialty,preferred_date:payload->>preferredDate,doctor_name:payload->>doctor,reason:payload->>reason,notes:payload->>notes").order("created_at", { ascending: false }),
        supabase.from("patient_portal_access").select("id,patient_passport,email,access_enabled,created_at").order("created_at", { ascending: false }),
      ]);

      if (!active) return;

      const patientMap = new Map<string, PatientRecord>();
      const events: TimelineEvent[] = [];

      const upsertPatient = (passportValue: unknown, source: Partial<PatientRecord>) => {
        const passport = String(passportValue || "").trim();
        if (!passport) return;
        const current = patientMap.get(passport);
        patientMap.set(passport, {
          id: current?.id || `pac-${passport}`,
          name: source.name && !source.name.startsWith("Paciente ") ? source.name : current?.name || source.name || `Paciente ${passport}`,
          passport,
          age: source.age && source.age !== "—" ? source.age : current?.age || "—",
          bloodType: source.bloodType && source.bloodType !== "—" ? source.bloodType : current?.bloodType || "—",
          cityPhone: source.cityPhone && source.cityPhone !== "Não informado" ? source.cityPhone : current?.cityPhone || "Não informado",
          status: source.status || current?.status || "Ativo",
          followUp: source.followUp || current?.followUp || "Prontuário clínico",
          lastVisit: [current?.lastVisit, source.lastVisit].filter(Boolean).sort().at(-1) || "",
          alerts: Array.from(new Set([...(current?.alerts || []), ...(source.alerts || [])])),
        });
      };

      for (const row of (registryResult.data || []) as any[]) {
        upsertPatient(row.passport, {
          name: row.name || `Paciente ${row.passport}`,
          age: row.age || "—",
          bloodType: row.blood_type || "—",
          cityPhone: row.city_phone || "Não informado",
          status: "Ativo",
          followUp: row.follow_up || "Rotina",
          lastVisit: String(row.updated_at || row.created_at || "").slice(0, 10),
        });
      }

      for (const row of (portalResult.data || []) as any[]) {
        const passport = String(row.patient_passport || "").trim();
        const current = patientMap.get(passport);
        if (!current) continue;
        upsertPatient(passport, {
          status: row.access_enabled ? current.status : "Arquivado",
          followUp: current.followUp,
          lastVisit: String(row.created_at || current.lastVisit || "").slice(0, 10),
          alerts: row.access_enabled ? current.alerts : [...current.alerts, "Acesso ao portal desativado"],
        });
      }

      for (const row of (appointmentsResult.data || []) as any[]) {
        const passport = String(row.passport || "").trim();
        if (!passport) continue;
        const registeredPatient = patientMap.get(passport);
        if (registeredPatient) {
          upsertPatient(passport, {
            status: "Em acompanhamento",
            followUp: "Consultas e agendamentos",
            lastVisit: String(row.updated_at || row.created_at || "").slice(0, 10),
          });
        }
        events.push({
          id: `appointment-${row.id}`,
          patientPassport: passport,
          type: "Consulta",
          title: row.specialty ? `Consulta · ${row.specialty}` : "Consulta agendada",
          date: String(row.preferred_date || row.created_at || "").slice(0, 10),
          doctor: row.doctor_name || "Equipe médica",
          status: row.status || "Agendada",
          summary: row.reason || row.notes || "Consulta registrada no sistema.",
        });
      }

      for (const row of (recordsResult.data || []) as any[]) {
        const passport = String(row.patient_passport || "").trim();
        if (!passport) continue;
        const registeredPatient = patientMap.get(passport);
        if (registeredPatient) {
          upsertPatient(passport, {
            status: "Em acompanhamento",
            followUp: "Prontuário clínico",
            lastVisit: String(row.created_at || "").slice(0, 10),
          });
        }
        const recordType = String(row.record_type || "").toLowerCase();
        const kind: TimelineEvent["type"] = recordType.includes("exame")
          ? "Exame"
          : recordType.includes("document")
            ? "Documento"
          : recordType.includes("prescri")
            ? "Prescrição"
            : recordType.includes("proced")
              ? "Procedimento"
              : "Observação";
        events.push({
          id: row.id,
          patientPassport: passport,
          type: kind,
          title: row.exam_name || row.document_title || row.title || row.record_type,
          date: String(row.created_at || "").slice(0, 10),
          doctor: row.doctor_name || row.doctor_name_flat || "Equipe médica",
          status: "Concluído",
          summary: row.summary || "Registro armazenado no prontuário.",
        });
      }

      setPatients(Array.from(patientMap.values()).sort((a, b) => a.name.localeCompare(b.name, "pt-BR")));
      setTimelineEvents(events);
      setIsLoadingPatients(false);
    }

    void loadPatients();

    const channel = client
      .channel("prontuarios-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "patient_registry" }, loadPatients)
      .on("postgres_changes", { event: "*", schema: "public", table: "clinical_records" }, loadPatients)
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, loadPatients)
      .on("postgres_changes", { event: "*", schema: "public", table: "patient_portal_access" }, loadPatients)
      .subscribe();

    return () => {
      active = false;
      void client.removeChannel(channel);
    };
  }, [refreshKey]);

  function refreshRecords() {
    if (isLoadingPatients || sharedPatientsLoading) return;
    setIsLoadingPatients(true);
    setRefreshKey((current) => current + 1);
  }

  const visiblePatients = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return patients;

    return patients.filter(
      (patient) =>
        patient.passport.includes(normalized) ||
        patient.name.toLowerCase().includes(normalized)
    );
  }, [patients, searchTerm]);

  const searchedPatient =
    searchTerm.trim() && visiblePatients.length === 1 ? visiblePatients[0] : null;

  const selectedPatient =
    patients.find((patient) => patient.passport === selectedPassport) ?? searchedPatient;

  const patientEvents = selectedPatient
    ? timelineEvents
        .filter((event) => event.patientPassport === selectedPatient.passport)
        .sort((a, b) => b.date.localeCompare(a.date))
    : [];

  const consultationCount = patientEvents.filter((event) => event.type === "Consulta").length;
  const examCount = patientEvents.filter((event) => event.type === "Exame").length;
  const prescriptionCount = patientEvents.filter((event) => event.type === "Prescrição").length;
  const procedureCount = patientEvents.filter((event) => event.type === "Procedimento").length;

  async function deletePatient(patient: PatientRecord) {
    const firstConfirmation = await hpsrConfirm(
      `Deseja excluir permanentemente ${patient.name} do Prontuário?\n\nEssa ação removerá o cadastro institucional, registros clínicos, consultas e o acesso ao Portal do Paciente vinculados ao passaporte ${patient.passport}.`,
      "Excluir paciente"
    );
    if (!firstConfirmation) return;

    const finalConfirmation = await hpsrConfirm(
      `Esta ação não pode ser desfeita. Confirma a exclusão definitiva do passaporte ${patient.passport}?`,
      "Confirmar exclusão definitiva"
    );
    if (!finalConfirmation) return;

    const client = createClient();
    if (!client) {
      await hpsrAlert("Não foi possível conectar ao Supabase.", "Paciente não excluído");
      return;
    }

    setIsDeletingPatient(true);
    const { data, error } = await client.rpc("delete_patient_registry_cascade", {
      target_passport: patient.passport,
    });
    setIsDeletingPatient(false);

    if (error) {
      await hpsrAlert(error.message, "Não foi possível excluir o paciente");
      return;
    }

    setPatients((current) => current.filter((item) => item.passport !== patient.passport));
    setTimelineEvents((current) => current.filter((item) => item.patientPassport !== patient.passport));
    setSelectedPassport("");
    selectSharedPatient(null);
    setActiveTab("geral");

    const result = Array.isArray(data) ? data[0] : data;
    const removedRecords = Number(result?.deleted_clinical_records || 0);
    const removedAppointments = Number(result?.deleted_appointments || 0);
    await hpsrAlert(
      `Paciente excluído. Foram removidos ${removedRecords} registro(s) clínico(s) e ${removedAppointments} consulta(s) vinculada(s).`,
      "Paciente excluído"
    );
  }

  async function openSavedExam(event: TimelineEvent) {
    if (event.type !== "Exame") return;
    const client = createClient();
    if (!client) {
      await hpsrAlert("Não foi possível conectar ao Supabase.", "Exame indisponível");
      return;
    }

    setExamViewer({ open: true, loading: true, title: event.title, reportHtml: "", previewImages: [], patientName: selectedPatient?.name || "", doctorName: event.doctor, savedAt: event.date });
    const { data, error } = await client
      .from("clinical_records")
      .select("payload,created_at")
      .eq("id", event.id)
      .eq("record_type", "Exame")
      .maybeSingle();

    if (error || !data) {
      setExamViewer((current) => ({ ...current, loading: false }));
      await hpsrAlert(error?.message || "O exame não foi encontrado no banco.", "Não foi possível abrir o exame");
      return;
    }

    const payload = (data.payload || {}) as Record<string, any>;
    const previewImages = Array.isArray(payload.previewImages)
      ? payload.previewImages.filter((item: unknown): item is string => typeof item === "string" && item.startsWith("data:image/"))
      : typeof payload.previewImage === "string" && payload.previewImage.startsWith("data:image/")
        ? [payload.previewImage]
        : [];

    setExamViewer({
      open: true,
      loading: false,
      title: String(payload.examName || payload.title || event.title || "Exame"),
      reportHtml: String(payload.reportHtml || ""),
      previewImages,
      patientName: String(payload.patient?.name || selectedPatient?.name || "Paciente"),
      doctorName: String(payload.doctor?.name || event.doctor || "Equipe médica"),
      savedAt: String(payload.savedAt || data.created_at || event.date || ""),
    });
  }

  function downloadSavedExam() {
    if (!examViewer.open || examViewer.loading) return;
    const safeTitle = examViewer.title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, "") || "exame";
    const pages = examViewer.previewImages.length
      ? examViewer.previewImages.map((src, index) => `<section class="page"><img src="${src}" alt="Página ${index + 1}" /></section>`).join("")
      : `<section class="page report">${examViewer.reportHtml || "<p>Conteúdo do exame indisponível.</p>"}</section>`;
    const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${examViewer.title}</title><style>body{margin:0;background:#eee;font-family:Arial,sans-serif}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-sizing:border-box;page-break-after:always}.page img{display:block;width:100%;height:auto}.report{padding:18mm}@media print{body{background:#fff}.page{margin:0;box-shadow:none}}</style></head><body>${pages}</body></html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeTitle}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function deleteClinicalRecord(event: TimelineEvent) {
    if (event.type !== "Exame" && event.type !== "Documento") return;
    const confirmed = await hpsrConfirm(`Deseja excluir definitivamente “${event.title}”?`, "Excluir registro clínico");
    if (!confirmed) return;
    const client = createClient();
    if (!client) return;
    const { error } = await client.from("clinical_records").delete().eq("id", event.id);
    if (error) { await hpsrAlert(error.message, "Não foi possível excluir"); return; }
    setTimelineEvents((current) => current.filter((item) => item.id !== event.id));
  }

  async function handleCreatePatient(data: {
    name: string;
    passport: string;
    age: string;
    bloodType: string;
    cityPhone: string;
    followUp: string;
  }) {
    const normalizedPassport = data.passport.trim().toUpperCase();
    const existingPatient = patients.find((patient) => patient.passport.trim().toUpperCase() === normalizedPassport);
    const createdAt = new Date().toISOString();

    const nextPatient: PatientRecord = {
      id: existingPatient?.id || `pac-${normalizedPassport}`,
      name: data.name.trim(),
      passport: normalizedPassport,
      age: data.age.trim() || "—",
      bloodType: data.bloodType || "—",
      cityPhone: data.cityPhone.trim() || "Não informado",
      status: existingPatient?.status || "Ativo",
      followUp: data.followUp,
      lastVisit: existingPatient?.lastVisit || "—",
      alerts: existingPatient?.alerts || [],
    };

    const client = createClient();
    if (!client) {
      await hpsrAlert("Não foi possível conectar ao Supabase.", "Cadastro não salvo");
      return;
    }

    const { error } = await client.from("patient_registry").upsert({
      passport: normalizedPassport,
      name: nextPatient.name,
      age: nextPatient.age === "—" ? null : nextPatient.age,
      blood_type: nextPatient.bloodType === "—" ? null : nextPatient.bloodType,
      city_phone: nextPatient.cityPhone === "Não informado" ? null : nextPatient.cityPhone,
      follow_up: nextPatient.followUp,
      updated_at: createdAt,
    }, { onConflict: "passport" });

    if (error) {
      await hpsrAlert(error.message, "Não foi possível cadastrar o paciente");
      return;
    }

    setPatients((currentPatients) => {
      const withoutCurrent = currentPatients.filter((patient) => patient.passport.trim().toUpperCase() !== normalizedPassport);
      return [nextPatient, ...withoutCurrent].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    });
    setSelectedPassport(normalizedPassport);
    selectSharedPatient({
      name: nextPatient.name,
      passport: nextPatient.passport,
      age: nextPatient.age,
      bloodType: nextPatient.bloodType,
      cityPhone: nextPatient.cityPhone,
    });
    setSearchTerm("");
    setActiveTab("geral");
    setIsRegisterOpen(false);
  }

  async function handleAddClinicalRecord(data: {
    recordType: TimelineEvent["type"];
    recordTitle: string;
    recordSummary: string;
  }) {
    if (!selectedPatient) return;

    const recordDate = todayIso();
    const createdAt = new Date().toISOString();
    const newEvent: TimelineEvent = {
      id: `evt-${Date.now()}`,
      patientPassport: selectedPatient.passport,
      type: data.recordType,
      title: data.recordTitle.trim(),
      date: recordDate,
      doctor: currentUserProfile.systemName,
      status: "Concluído",
      summary: data.recordSummary.trim(),
    };

    const client = createClient();
    if (!client) {
      await hpsrAlert("Não foi possível conectar ao Supabase.", "Registro não salvo");
      return;
    }

    const payload = {
      patient: {
        name: selectedPatient.name,
        passport: selectedPatient.passport,
        age: selectedPatient.age,
        bloodType: selectedPatient.bloodType,
        cityPhone: selectedPatient.cityPhone,
      },
      patientName: selectedPatient.name,
      patientPassport: selectedPatient.passport,
      followUp: selectedPatient.followUp,
      title: newEvent.title,
      summary: newEvent.summary,
      doctor: newEvent.doctor,
      status: newEvent.status,
      date: newEvent.date,
    };

    const { error } = await client.from("clinical_records").insert({
      id: newEvent.id,
      patient_passport: selectedPatient.passport,
      record_type: data.recordType.toLowerCase(),
      payload,
      created_at: createdAt,
      updated_at: createdAt,
    });

    if (error) {
      await hpsrAlert(error.message, "Não foi possível salvar o registro clínico");
      return;
    }

    setTimelineEvents((currentEvents) => [newEvent, ...currentEvents]);
    setPatients((currentPatients) => currentPatients.map((patient) =>
      patient.passport === selectedPatient.passport
        ? { ...patient, status: "Em acompanhamento", lastVisit: recordDate }
        : patient
    ));
    setActiveTab("timeline");
    setIsClinicalRecordOpen(false);
  }

  return (
    <div className="hpsr-page gap-2 xl:h-[calc(100dvh-2.4rem)] xl:min-h-0 xl:overflow-hidden">
      <PageHeader
        eyebrow="Prontuários"
        title="Prontuários"
        description="Histórico clínico por paciente."
      />

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[18px] border border-hpsr-border bg-white shadow-[0_14px_34px_rgba(79,42,21,0.06)]">
        <div className="shrink-0 border-b border-hpsr-border bg-[linear-gradient(135deg,#fffdf9_0%,#f6eadf_100%)] px-4 py-3">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(430px,0.62fr)] xl:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-hpsr-border bg-white px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-hpsr-wine">
                <UsersRound size={14} />
                Painel geral dos pacientes
              </span>
              <h2 className="mt-1.5 text-[clamp(1.2rem,1.6vw,1.55rem)] font-black leading-tight text-hpsr-text">
                Prontuário clínico dos pacientes
              </h2>
              <p className="mt-1 max-w-3xl text-xs leading-relaxed text-hpsr-muted">
                Localize o paciente, consulte o histórico e registre novas informações sem perder o contexto.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
              <label className="flex min-h-[44px] items-center gap-2.5 rounded-[14px] border border-hpsr-border bg-white px-3 shadow-sm focus-within:border-hpsr-wineLight focus-within:ring-2 focus-within:ring-hpsr-wineLight/20">
                <Search size={18} className="shrink-0 text-hpsr-muted" />
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-hpsr-text outline-none placeholder:text-zinc-400"
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setSelectedPassport("");
                    selectSharedPatient(null);
                    setActiveTab("geral");
                  }}
                  placeholder="Buscar por nome ou passaporte"
                />
                {searchTerm && (
                  <button
                    type="button"
                    aria-label="Limpar busca"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedPassport("");
                      selectSharedPatient(null);
                    }}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-hpsr-muted transition hover:bg-[#fff3e8] hover:text-hpsr-wine"
                  >
                    <X size={15} />
                  </button>
                )}
              </label>

              <button
                type="button"
                onClick={refreshRecords}
                disabled={isLoadingPatients || sharedPatientsLoading}
                className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[14px] border border-hpsr-border bg-white px-3.5 text-xs font-black text-hpsr-wine transition hover:border-hpsr-wineLight hover:bg-[#fff8f0] disabled:cursor-not-allowed disabled:opacity-60"
                title="Atualizar prontuário"
              >
                <RefreshCw size={16} className={isLoadingPatients || sharedPatientsLoading ? "animate-spin" : ""} />
                Atualizar
              </button>

              <button
                type="button"
                onClick={() => setIsRegisterOpen(true)}
                className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[14px] bg-[linear-gradient(135deg,#672614,#74321e)] px-3.5 text-xs font-black text-white transition"
              >
                <Plus size={16} />
                Novo paciente
              </button>
            </div>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <GeneralMetric label="Pacientes" value={String(patients.length)} icon={<UserRound size={17} />} />
            <GeneralMetric label="Em acompanhamento" value={String(patients.filter((patient) => patient.status === "Em acompanhamento").length)} icon={<HeartPulse size={17} />} />
            <GeneralMetric label="Eventos clínicos" value={String(timelineEvents.length)} icon={<FileClock size={17} />} />
            <GeneralMetric label="Alertas ativos" value={String(patients.reduce((total, patient) => total + patient.alerts.length, 0))} icon={<AlertTriangle size={17} />} />
          </div>
        </div>

        <div className="grid min-h-0 flex-1 gap-3 overflow-hidden p-3 xl:grid-cols-[minmax(330px,0.38fr)_minmax(0,1fr)] xl:items-stretch">
          <div className="flex min-h-0 flex-col overflow-hidden rounded-[16px] border border-hpsr-border bg-[#fffaf5] xl:h-full">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-hpsr-border bg-white/80 px-3.5 py-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Pacientes</p>
                <p className="mt-0.5 text-xs font-semibold text-hpsr-muted">{visiblePatients.length} resultado{visiblePatients.length === 1 ? "" : "s"}</p>
              </div>
              <span className="rounded-full border border-hpsr-border bg-[#fff8f0] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-hpsr-wine">
                {visiblePatients.length}/{patients.length}
              </span>
            </div>

            <div className="grid min-h-0 flex-1 content-start gap-2 overflow-y-auto p-2.5">
              {visiblePatients.map((patient) => {
                const selected = selectedPatient?.passport === patient.passport;
                const events = timelineEvents.filter((event) => event.patientPassport === patient.passport);

                return (
                  <div
                    key={patient.passport}
                    className={`group relative overflow-hidden rounded-[15px] border transition ${
                      selected
                        ? "border-hpsr-wine bg-white shadow-[0_8px_22px_rgba(103,38,20,0.10)]"
                        : "border-hpsr-border bg-white/90 hover:border-[#d6b9a4] hover:bg-white"
                    }`}
                  >
                    {selected && <span className="absolute inset-y-0 left-0 w-1 bg-hpsr-wine" />}
                    <div className="flex items-start gap-2 p-3 pl-3.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPassport(patient.passport);
                          selectSharedPatient({ name: patient.name, passport: patient.passport, age: patient.age, bloodType: patient.bloodType, cityPhone: patient.cityPhone });
                          setActiveTab("geral");
                        }}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-black text-hpsr-text">{patient.name}</p>
                          <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black ${statusClasses(patient.status)}`}>
                            {patient.status}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-[11px] font-semibold text-hpsr-muted">
                          Passaporte {patient.passport} · {patient.age} anos · {patient.bloodType}
                        </p>
                        <p className="mt-1 truncate text-[11px] text-hpsr-muted">{patient.followUp}</p>

                        <div className="mt-2.5 grid grid-cols-3 gap-1.5 border-t border-hpsr-border pt-2.5">
                          <MiniPatientStat label="Registros" value={String(events.length)} />
                          <MiniPatientStat label="Alertas" value={String(patient.alerts.length)} />
                          <MiniPatientStat label="Último" value={formatDate(patient.lastVisit)} />
                        </div>
                      </button>

                      <div className="flex shrink-0 flex-col items-center gap-1.5">
                        <button
                          type="button"
                          aria-label={`Excluir ${patient.name}`}
                          title="Excluir paciente"
                          disabled={isDeletingPatient}
                          onClick={() => void deletePatient(patient)}
                          className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-red-100 bg-red-50 text-red-600 transition hover:border-red-200 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2 size={14} />
                        </button>
                        <ChevronDown
                          size={17}
                          className={`text-hpsr-wine transition ${selected ? "rotate-[-90deg]" : ""}`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {visiblePatients.length === 0 && (
                <div className="rounded-[16px] border border-dashed border-hpsr-border bg-white p-3.5 text-center">
                  {isLoadingPatients || sharedPatientsLoading ? (
                    <>
                      <p className="font-black text-hpsr-text">Carregando pacientes...</p>
                      <p className="mt-1 text-sm text-hpsr-muted">Sincronizando os dados do Supabase.</p>
                    </>
                  ) : (
                    <>
                      <p className="font-black text-hpsr-text">Nenhum paciente encontrado.</p>
                      <p className="mt-1 text-sm text-hpsr-muted">Tente buscar por outro nome ou passaporte.</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {selectedPatient ? (
            <div className="min-w-0 overflow-hidden rounded-[16px] border border-hpsr-border bg-white xl:h-full xl:min-h-0 xl:overflow-y-auto">
              <div className="sticky top-0 z-20 border-b border-hpsr-border bg-[linear-gradient(135deg,#fffdf9_0%,#f4e7dc_100%)] p-3.5 shadow-[0_8px_18px_rgba(79,42,21,0.05)]">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-black text-hpsr-text">{selectedPatient.name}</h2>
                      <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusClasses(selectedPatient.status)}`}>
                        {selectedPatient.status}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full border border-hpsr-border bg-white px-3 py-1 text-[11px] font-bold text-hpsr-muted">Passaporte {selectedPatient.passport}</span>
                      <span className="rounded-full border border-hpsr-border bg-white px-3 py-1 text-[11px] font-bold text-hpsr-muted">{selectedPatient.age} anos</span>
                      <span className="rounded-full border border-hpsr-border bg-white px-3 py-1 text-[11px] font-bold text-hpsr-muted">Tipo {selectedPatient.bloodType}</span>
                      <span className="rounded-full border border-hpsr-border bg-white px-3 py-1 text-[11px] font-bold text-hpsr-muted">{selectedPatient.cityPhone}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <div className="hidden rounded-[14px] border border-hpsr-border bg-white px-3 py-2.5 2xl:block">
                      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">Histórico protegido</p>
                      <p className="mt-0.5 text-[11px] font-semibold text-hpsr-muted">Correções entram como nova observação.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsClinicalRecordOpen(true)}
                      className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[14px] bg-[linear-gradient(135deg,#672614,#74321e)] px-3.5 text-xs font-black text-white transition hover:-translate-y-0.5"
                    >
                      <ClipboardPlus size={16} />
                      Adicionar registro
                    </button>
                    <button
                      type="button"
                      disabled={isDeletingPatient}
                      onClick={() => void deletePatient(selectedPatient)}
                      className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[14px] border border-red-200 bg-red-50 px-3.5 text-xs font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 size={16} />
                      {isDeletingPatient ? "Excluindo..." : "Excluir paciente"}
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`inline-flex items-center gap-2 rounded-[13px] border px-3 py-2 text-[11px] font-black transition ${
                        activeTab === tab.id
                          ? "border-hpsr-wine bg-[linear-gradient(135deg,#672614,#74321e)] text-white"
                          : "border-hpsr-border bg-white text-hpsr-wine hover:bg-[#fffdf9]"
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5">
                {activeTab === "geral" && (
                  <OverviewTab
                    patient={selectedPatient}
                    events={patientEvents}
                    consultationCount={consultationCount}
                    examCount={examCount}
                    prescriptionCount={prescriptionCount}
                    procedureCount={procedureCount}
                  />
                )}
                {activeTab === "timeline" && <TimelineTab events={patientEvents} />}
                {activeTab === "consultas" && <FilteredEventsTab events={patientEvents} type="Consulta" empty="Nenhuma consulta registrada." />}
                {activeTab === "exames" && <FilteredEventsTab events={patientEvents} type="Exame" empty="Nenhum exame vinculado." onDelete={deleteClinicalRecord} onOpen={openSavedExam} />}
                {activeTab === "documentos" && <FilteredEventsTab events={patientEvents} type="Documento" empty="Nenhum documento vinculado." onDelete={deleteClinicalRecord} />}
                {activeTab === "prescricoes" && <FilteredEventsTab events={patientEvents} type="Prescrição" empty="Nenhuma prescrição registrada." />}
                {activeTab === "procedimentos" && <FilteredEventsTab events={patientEvents} type="Procedimento" empty="Nenhum procedimento registrado." />}
                {activeTab === "observacoes" && <FilteredEventsTab events={patientEvents} type="Observação" empty="Nenhuma observação interna." />}
                <ClinicalRecordsPortalPanel passport={selectedPatient.passport} />
              </div>
            </div>
          ) : (
            <div className="flex min-h-[420px] items-center justify-center rounded-[16px] border border-dashed border-hpsr-border bg-[#fff8f0] p-3.5 text-center">
              <div className="max-w-md">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-hpsr-border bg-white text-hpsr-wine shadow-sm">
                  <Search size={25} />
                </div>
                <h3 className="mt-4 text-lg font-black text-hpsr-text">Selecione um paciente</h3>
                <p className="mt-1 text-sm leading-relaxed text-hpsr-muted">
                  Use a busca ou escolha um nome na lista para abrir o prontuário completo.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {isRegisterOpen && (
        <CreatePatientModal
          onClose={() => setIsRegisterOpen(false)}
          onSave={handleCreatePatient}
        />
      )}

      {isClinicalRecordOpen && selectedPatient && (
        <AddClinicalRecordModal
          patient={selectedPatient}
          onClose={() => setIsClinicalRecordOpen(false)}
          onSave={handleAddClinicalRecord}
        />
      )}
      {examViewer.open && (
        <SavedExamViewer
          exam={examViewer}
          onClose={() => setExamViewer((current) => ({ ...current, open: false }))}
          onDownload={downloadSavedExam}
        />
      )}
    </div>
  );
}


function CreatePatientModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (data: {
    name: string;
    passport: string;
    age: string;
    bloodType: string;
    cityPhone: string;
    followUp: string;
  }) => void | Promise<void>;
}) {
  const [form, setForm] = useState({
    name: "",
    passport: "",
    age: "",
    bloodType: "+A",
    cityPhone: "",
    followUp: "Rotina",
  });

  function updateField(field: keyof typeof form, value: string) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim() || !form.passport.trim()) {
      await hpsrAlert("Informe o nome e o passaporte do paciente.", "Campos obrigatórios");
      return;
    }
    await onSave(form);
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center overflow-y-auto px-4 py-3">
      <button type="button" aria-label="Fechar cadastro" onClick={onClose} className="absolute inset-0 bg-[#2a0700]/45" />
      <form onSubmit={handleSubmit} className="relative z-10 flex max-h-[calc(100dvh-2rem)] w-full max-w-[720px] flex-col overflow-hidden rounded-[22px] border border-white/80 bg-[#fffaf4] shadow-[0_28px_90px_rgba(42,7,0,0.28)]">
        <div className="relative overflow-hidden bg-[linear-gradient(135deg,#2a0700_0%,#672614_52%,#9d6b4f_100%)] px-5 py-4 text-white">
          <div className="pointer-events-none absolute -right-14 -top-20 h-52 w-52 rounded-full bg-white/10" />
          <div className="relative z-10 flex items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em]"><UserRound size={14} />Novo paciente</span>
              <h2 className="mt-3 text-xl font-black tracking-tight">Cadastrar paciente</h2>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-white/84">Cadastre os dados essenciais. O prontuário clínico poderá ser preenchido depois, na área do paciente.</p>
            </div>
            <button type="button" onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[14px] border border-white/25 bg-white/10 text-white transition hover:bg-white/20"><X size={18} /></button>
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto p-4 sm:p-5">
          <section className="rounded-[18px] border border-hpsr-border bg-white p-4 shadow-[0_10px_28px_rgba(79,42,21,0.05)]">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-hpsr-wineLight">Dados do paciente</p>
            <div className="mt-4 grid gap-3">
              <ModalField label="Nome do paciente" required><input required autoFocus className={modalInputClass} value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Nome completo do paciente" /></ModalField>
              <div className="grid gap-3 sm:grid-cols-2">
                <ModalField label="Passaporte" required><input required className={modalInputClass} value={form.passport} onChange={(event) => updateField("passport", event.target.value)} placeholder="Ex.: 876" /></ModalField>
                <ModalField label="Idade"><input className={modalInputClass} value={form.age} onChange={(event) => updateField("age", event.target.value)} placeholder="Ex.: 22" /></ModalField>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <ModalField label="Tipo sanguíneo"><select className={modalInputClass} value={form.bloodType} onChange={(event) => updateField("bloodType", event.target.value)}><option value="+A">+A</option><option value="-A">-A</option><option value="+B">+B</option><option value="-B">-B</option></select></ModalField>
                <ModalField label="Telefone na cidade"><input className={modalInputClass} value={form.cityPhone} onChange={(event) => updateField("cityPhone", event.target.value)} placeholder="Ex.: (055) 193-000" /></ModalField>
              </div>
              <ModalField label="Acompanhamento">
                <div className="grid gap-2">
                  {[
                    { value: "Especializado", title: "Especializado", description: "Acompanhamento por um médico especialista." },
                    { value: "Clínico", title: "Clínico", description: "Acompanhamento clínico geral." },
                    { value: "Rotina", title: "Rotina", description: "Tratamentos simples e rotineiros, sem necessidade de especialista." },
                  ].map((option) => {
                    const selected = form.followUp === option.value;
                    return <button key={option.value} type="button" onClick={() => updateField("followUp", option.value)} className={`flex w-full items-start gap-3 rounded-[15px] border px-3.5 py-3 text-left transition ${selected ? "border-hpsr-wine bg-[#fff3e9] ring-2 ring-hpsr-wine/10" : "border-hpsr-border bg-[#fffaf5] hover:border-hpsr-wineLight/55 hover:bg-white"}`} aria-pressed={selected}><span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${selected ? "border-hpsr-wine" : "border-zinc-300"}`}>{selected && <span className="h-2 w-2 rounded-full bg-hpsr-wine" />}</span><span className="min-w-0"><span className="block text-sm font-black text-hpsr-text">{option.title}</span><span className="mt-0.5 block text-[11px] font-semibold leading-relaxed text-hpsr-muted">{option.description}</span></span></button>;
                  })}
                </div>
              </ModalField>
            </div>
          </section>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-hpsr-border bg-white/95 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-xs font-semibold text-hpsr-muted"><span className="font-black text-hpsr-wine">*</span> Nome e passaporte são obrigatórios.</p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row"><button type="button" onClick={onClose} className="rounded-[16px] border border-hpsr-border bg-white px-4 py-3 text-sm font-black text-hpsr-text transition hover:bg-[#fff8f0]">Cancelar</button><button type="submit" className="rounded-[16px] bg-[linear-gradient(135deg,#672614,#74321e)] px-5 py-3 text-sm font-black text-white shadow-[0_10px_22px_rgba(103,38,20,0.18)] transition hover:-translate-y-0.5">Cadastrar paciente</button></div>
        </div>
      </form>
    </div>
  );
}

function AddClinicalRecordModal({
  patient,
  onClose,
  onSave,
}: {
  patient: PatientRecord;
  onClose: () => void;
  onSave: (data: { recordType: TimelineEvent["type"]; recordTitle: string; recordSummary: string }) => void | Promise<void>;
}) {
  const { profile: currentUserProfile } = useCurrentUserProfile();
  const [form, setForm] = useState({ recordType: "Consulta" as TimelineEvent["type"], recordTitle: "", recordSummary: "" });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.recordTitle.trim() || !form.recordSummary.trim()) {
      await hpsrAlert("Informe o título e a evolução médica.", "Registro incompleto");
      return;
    }
    await onSave(form);
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center overflow-y-auto px-4 py-3">
      <button type="button" aria-label="Fechar registro" onClick={onClose} className="absolute inset-0 bg-[#2a0700]/45" />
      <form onSubmit={handleSubmit} className="relative z-10 flex max-h-[calc(100dvh-2rem)] w-full max-w-[760px] flex-col overflow-hidden rounded-[22px] border border-white/80 bg-[#fffaf4] shadow-[0_28px_90px_rgba(42,7,0,0.28)]">
        <div className="bg-[linear-gradient(135deg,#2a0700_0%,#672614_52%,#9d6b4f_100%)] px-5 py-4 text-white">
          <div className="flex items-start justify-between gap-3"><div><span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em]"><ClipboardPlus size={14} />Novo registro clínico</span><h2 className="mt-3 text-xl font-black">{patient.name}</h2><p className="mt-1 text-sm text-white/80">Passaporte {patient.passport}</p></div><button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-[14px] border border-white/25 bg-white/10"><X size={18} /></button></div>
        </div>
        <div className="min-h-0 overflow-y-auto p-4 sm:p-5"><section className="rounded-[18px] border border-hpsr-border bg-white p-4"><div className="grid gap-3"><ModalField label="Tipo de registro"><select className={modalInputClass} value={form.recordType} onChange={(event) => setForm((current) => ({ ...current, recordType: event.target.value as TimelineEvent["type"] }))}><option value="Consulta">Consulta</option><option value="Exame">Exame</option><option value="Prescrição">Prescrição</option><option value="Procedimento">Procedimento</option><option value="Observação">Observação</option></select></ModalField><ModalField label="Título do registro" required><input required className={modalInputClass} value={form.recordTitle} onChange={(event) => setForm((current) => ({ ...current, recordTitle: event.target.value }))} placeholder="Ex.: Consulta obstétrica" /></ModalField><ModalField label="Registro / evolução médica" required><textarea required className={`${modalInputClass} min-h-[190px] resize-y leading-relaxed`} value={form.recordSummary} onChange={(event) => setForm((current) => ({ ...current, recordSummary: event.target.value }))} placeholder="Descreva queixa, achados relevantes, conduta, orientação ou retorno." /></ModalField><div className="rounded-[16px] border border-amber-200 bg-amber-50 p-3.5 text-sm leading-relaxed text-amber-800">O registro será assinado como <strong>{currentUserProfile.systemName}</strong> e entrará na linha do tempo do paciente.</div></div></section></div>
        <div className="flex justify-end gap-3 border-t border-hpsr-border bg-white/95 px-5 py-3.5"><button type="button" onClick={onClose} className="rounded-[16px] border border-hpsr-border bg-white px-4 py-3 text-sm font-black text-hpsr-text">Cancelar</button><button type="submit" className="rounded-[16px] bg-[linear-gradient(135deg,#672614,#74321e)] px-5 py-3 text-sm font-black text-white">Salvar registro</button></div>
      </form>
    </div>
  );
}

const modalInputClass =
  "min-w-0 w-full rounded-[16px] border border-hpsr-border bg-[#fff8f0] px-4 py-3 text-sm font-semibold text-hpsr-text outline-none transition placeholder:text-zinc-400 focus:border-hpsr-wineLight focus:bg-white focus:ring-2 focus:ring-hpsr-wineLight/20";

function ModalField({ label, required = false, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div className="block min-w-0">
      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">
        {label}{required && <span className="ml-1 text-red-600">*</span>}
      </span>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function OverviewTab({
  patient,
  events,
  consultationCount,
  examCount,
  prescriptionCount,
  procedureCount,
}: {
  patient: PatientRecord;
  events: TimelineEvent[];
  consultationCount: number;
  examCount: number;
  prescriptionCount: number;
  procedureCount: number;
}) {
  return (
    <div className="grid gap-3">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Consultas" value={String(consultationCount)} icon={<Stethoscope size={18} />} />
        <SummaryCard label="Exames" value={String(examCount)} icon={<FileText size={18} />} />
        <SummaryCard label="Prescrições" value={String(prescriptionCount)} icon={<Pill size={18} />} />
        <SummaryCard label="Procedimentos" value={String(procedureCount)} icon={<Syringe size={18} />} />
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="rounded-[16px] border border-hpsr-border bg-[#fff8f0] p-3.5">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-hpsr-wineLight">
            Resumo do paciente
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <InfoPill label="Acompanhamento" value={patient.followUp} />
            <InfoPill label="Último atendimento" value={formatDate(patient.lastVisit)} />
            <InfoPill label="Tipo sanguíneo" value={patient.bloodType} />
            <InfoPill label="Contato na cidade" value={patient.cityPhone} />
          </div>
        </div>

        <div className="rounded-[16px] border border-hpsr-border bg-[#fff8f0] p-3.5">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-hpsr-wineLight">
            Alertas importantes
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {patient.alerts.map((alert) => (
              <span key={alert} className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-800">
                <AlertTriangle size={13} />
                {alert}
              </span>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}

function TimelineTab({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <EmptyState text="Nenhum evento registrado neste prontuário." />;
  }

  return (
    <div className="relative grid gap-3">
      {events.map((event, index) => (
        <div key={event.id} className="grid gap-3 md:grid-cols-[44px_minmax(0,1fr)]">
          <div className="hidden md:flex flex-col items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-hpsr-border bg-[#fff8f0]">
              {eventIcon(event.type)}
            </div>
            {index < events.length - 1 && <div className="mt-2 h-full min-h-[36px] w-px bg-hpsr-border" />}
          </div>
          <EventCard event={event} />
        </div>
      ))}
    </div>
  );
}

function FilteredEventsTab({
  events,
  type,
  empty,
  onDelete,
  onOpen,
}: {
  events: TimelineEvent[];
  type: TimelineEvent["type"];
  empty: string;
  onDelete?: (event: TimelineEvent) => void;
  onOpen?: (event: TimelineEvent) => void;
}) {
  const filtered = events.filter((event) => event.type === type);

  if (filtered.length === 0) return <EmptyState text={empty} />;

  return (
    <div className="grid gap-3">
      {filtered.map((event) => (
        <EventCard key={event.id} event={event} onDelete={onDelete} onOpen={onOpen} />
      ))}
    </div>
  );
}

function EventCard({ event, onDelete, onOpen }: { event: TimelineEvent; onDelete?: (event: TimelineEvent) => void; onOpen?: (event: TimelineEvent) => void }) {
  return (
    <article className="rounded-[16px] border border-hpsr-border bg-white p-3.5 transition hover:bg-[#fffdf9]">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-hpsr-border bg-[#fff8f0] px-3 py-1 text-xs font-black text-hpsr-wine">
              {eventIcon(event.type)}
              {event.type}
            </span>
            <span className="rounded-full border border-hpsr-border bg-white px-3 py-1 text-xs font-black text-hpsr-muted">
              {event.status}
            </span>
          </div>
          <h3 className="mt-3 text-lg font-black text-hpsr-text">{event.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-hpsr-muted">{event.summary}</p>
        </div>

        <div className="flex flex-col gap-2 lg:min-w-[210px]">
        <div className="rounded-[16px] border border-hpsr-border bg-[#fff8f0] px-3 py-2 text-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">Registro</p>
          <p className="mt-1 font-black text-hpsr-text">{formatDate(event.date)}</p>
          <p className="mt-0.5 text-xs font-semibold text-hpsr-muted">{event.doctor}</p>
        </div>
        {onOpen && event.type === "Exame" && <button type="button" onClick={() => onOpen(event)} className="inline-flex items-center justify-center gap-2 rounded-[12px] border border-hpsr-wine/20 bg-[#fff3e8] px-3 py-2 text-xs font-black text-hpsr-wine transition hover:bg-[#ffead8]"><Eye size={14} /> Visualizar exame</button>}
        {onDelete && (event.type === "Exame" || event.type === "Documento") && <button type="button" onClick={() => onDelete(event)} className="rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700">Excluir {event.type.toLowerCase()}</button>}
        </div>
      </div>
    </article>
  );
}

function SavedExamViewer({
  exam,
  onClose,
  onDownload,
}: {
  exam: { open: boolean; loading: boolean; title: string; reportHtml: string; previewImages: string[]; patientName: string; doctorName: string; savedAt: string };
  onClose: () => void;
  onDownload: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-[#210700]/70 p-3 sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="flex h-[94vh] w-full max-w-[1180px] flex-col overflow-hidden rounded-[24px] border border-white/70 bg-[#f5eee7] shadow-[0_30px_100px_rgba(24,5,0,.45)]">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-hpsr-border bg-white px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[.16em] text-hpsr-wineLight">Exame salvo no prontuário</p>
            <h3 className="truncate text-lg font-black text-hpsr-text sm:text-xl">{exam.title}</h3>
            <p className="mt-0.5 text-xs font-semibold text-hpsr-muted">{exam.patientName} · {exam.doctorName}{exam.savedAt ? ` · ${new Date(exam.savedAt).toLocaleString("pt-BR")}` : ""}</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" disabled={exam.loading} onClick={onDownload} className="inline-flex h-10 items-center gap-2 rounded-[13px] border border-hpsr-border bg-[#fff8f0] px-3 text-xs font-black text-hpsr-wine disabled:opacity-50"><Download size={15} /> Baixar</button>
            <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-[13px] border border-hpsr-border bg-white text-hpsr-wine"><X size={18} /></button>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-auto p-3 sm:p-5">
          {exam.loading ? (
            <div className="flex min-h-full items-center justify-center"><div className="text-center"><LoaderCircle className="mx-auto animate-spin text-hpsr-wine" size={30} /><p className="mt-3 text-sm font-black text-hpsr-text">Carregando exame...</p></div></div>
          ) : exam.previewImages.length ? (
            <div className="mx-auto grid max-w-[900px] gap-5">{exam.previewImages.map((src, index) => <figure key={`${src.slice(0, 40)}-${index}`} className="overflow-hidden rounded-[10px] bg-white shadow-[0_12px_40px_rgba(42,7,0,.18)]"><img src={src} alt={`Página ${index + 1} do exame`} className="block h-auto w-full" /><figcaption className="border-t border-hpsr-border px-3 py-2 text-center text-[10px] font-black uppercase tracking-[.12em] text-hpsr-muted">Página {index + 1}</figcaption></figure>)}</div>
          ) : exam.reportHtml ? (
            <div className="mx-auto min-h-[900px] max-w-[900px] overflow-hidden rounded-[10px] bg-white shadow-[0_12px_40px_rgba(42,7,0,.18)]"><iframe title={exam.title} srcDoc={exam.reportHtml} className="h-[1100px] w-full border-0 bg-white" /></div>
          ) : (
            <div className="flex min-h-full items-center justify-center"><EmptyState text="O conteúdo completo deste exame não está disponível." /></div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-[16px] border border-hpsr-border bg-white p-3.5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-hpsr-wineLight">{label}</p>
        <span className="text-hpsr-wine">{icon}</span>
      </div>
      <p className="mt-2 text-lg font-black text-hpsr-text">{value}</p>
    </div>
  );
}

function GeneralMetric({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-[14px] border border-hpsr-border bg-white px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[9px] font-black uppercase tracking-[0.12em] text-hpsr-wineLight">{label}</p>
          <p className="mt-0.5 text-base font-black leading-none text-hpsr-text">{value}</p>
        </div>
        <span className="shrink-0 text-hpsr-wine">{icon}</span>
      </div>
    </div>
  );
}

function MiniPatientStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-hpsr-wineLight">{label}</p>
      <p className="mt-0.5 truncate text-xs font-black text-hpsr-text">{value}</p>
    </div>
  );
}

function PatientCardInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-hpsr-border bg-white/[0.86] px-3 py-2">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">{label}</p>
      <p className="mt-1 truncate text-xs font-black text-hpsr-text">{value}</p>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-hpsr-border bg-white px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">{label}</p>
      <p className="mt-1 text-sm font-black text-hpsr-text">{value}</p>
    </div>
  );
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-hpsr-wineLight">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-hpsr-muted">{description}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-[16px] border border-dashed border-hpsr-border bg-[#fff8f0] p-3.5 text-center">
      <div>
        <Archive className="mx-auto text-hpsr-wine" size={28} />
        <p className="mt-3 text-sm font-black text-hpsr-text">{text}</p>
      </div>
    </div>
  );
}
