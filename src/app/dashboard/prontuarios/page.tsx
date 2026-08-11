"use client";

import { brazilDate, brazilIso } from "@/lib/brazil-datetime";
import { formatPhoneNumber, formatPhoneDisplay } from "@/lib/phone";

import { StyledSelect } from "@/components/ui/StyledSelect";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Archive,
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
  Pencil,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useCurrentUserProfile } from "@/components/auth/CurrentUserProfileProvider";
import { usePatientSelection } from "@/components/patients/PatientSelectionProvider";
import { notifyPatientRegistryUpdated } from "@/lib/patient-sync";
import { hpsrAlert, hpsrConfirm } from "@/components/ui/HpsrDialogProvider";
import { createClient } from "@/lib/supabase";
import { ClinicalRecordsPortalPanel } from "@/components/dashboard/ClinicalRecordsPortalPanel";
import { specialties } from "@/data/mock";

type RecordTab = "geral" | "timeline" | "consultas" | "exames" | "vacinas" | "documentos" | "prescricoes" | "procedimentos" | "observacoes";
type PatientFilter = "all" | "mine" | "routine";
type ScheduleAssignment = { doctor_id: string; doctor_name: string; specialty: string };

type PatientRecord = {
  id: string;
  name: string;
  passport: string;
  age: string;
  bloodType: string;
  sex?: "Masculino" | "Feminino" | "";
  cityPhone: string;
  birthDate?: string;
  status: "Ativo" | "Em acompanhamento" | "Arquivado";
  followUp: string;
  portalSpecialties: string[];
  triageStatus: "Pendente" | "Classificado";
  scheduleAssignments: ScheduleAssignment[];
  lastVisit: string;
  alerts: string[];
};

type TimelineEvent = {
  id: string;
  patientPassport: string;
  type: "Consulta" | "Exame" | "Vacina" | "Documento" | "Prescrição" | "Procedimento" | "Observação";
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
  { id: "vacinas", label: "Vacinas", icon: <Syringe size={15} /> },
  { id: "documentos", label: "Documentos", icon: <Archive size={15} /> },
  { id: "prescricoes", label: "Prescrições", icon: <Pill size={15} /> },
  { id: "procedimentos", label: "Procedimentos", icon: <Syringe size={15} /> },
  { id: "observacoes", label: "Observações", icon: <NotebookPen size={15} /> },
];

const initialPatients: PatientRecord[] = [];

const initialTimelineEvents: TimelineEvent[] = [];

const PRONTUARIO_CACHE_KEY = "hpsr-prontuario-session-cache-v1";
const PRONTUARIO_CACHE_TTL_MS = 5 * 60 * 1000;

function readProntuarioCache(): { savedAt: number; patients: PatientRecord[]; timelineEvents: TimelineEvent[] } | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(PRONTUARIO_CACHE_KEY) || "null");
    if (!parsed || !Array.isArray(parsed.patients) || !Array.isArray(parsed.timelineEvents)) return null;
    return { savedAt: Number(parsed.savedAt || 0), patients: parsed.patients, timelineEvents: parsed.timelineEvents };
  } catch {
    window.sessionStorage.removeItem(PRONTUARIO_CACHE_KEY);
    return null;
  }
}

function writeProntuarioCache(patients: PatientRecord[], timelineEvents: TimelineEvent[]) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(PRONTUARIO_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), patients, timelineEvents }));
  } catch {
    // O cache é apenas uma otimização local; o Supabase permanece a fonte de verdade.
  }
}

function formatDate(value: string) {
  if (!value.includes("-")) return value;
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function todayIso() {
  return brazilDate();
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
    case "Vacina":
      return <Syringe size={17} className={classes} />;
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
  const [isEditPatientOpen, setIsEditPatientOpen] = useState(false);
  const [isGuardiansOpen, setIsGuardiansOpen] = useState(false);
  const [isPortalSpecialtiesOpen, setIsPortalSpecialtiesOpen] = useState(false);
  const [isPendingPatientsOpen, setIsPendingPatientsOpen] = useState(false);
  const [patientFilter, setPatientFilter] = useState<PatientFilter>("all");
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [isDeletingPatient, setIsDeletingPatient] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const patientsSnapshotRef = useRef<PatientRecord[]>([]);
  const timelineSnapshotRef = useRef<TimelineEvent[]>([]);
  const loadRequestRef = useRef(0);
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
          sex: patient.sex || existing?.sex || "",
          cityPhone: patient.cityPhone || existing?.cityPhone || "Não informado",
          birthDate: patient.birthDate || existing?.birthDate,
          status: existing?.status || "Ativo",
          followUp: normalizePatientFollowUp(existing?.followUp),
          portalSpecialties: existing?.portalSpecialties || [],
          triageStatus: existing?.triageStatus || "Classificado",
          scheduleAssignments: existing?.scheduleAssignments || [],
          lastVisit: existing?.lastVisit || "—",
          alerts: existing?.alerts || [],
        });
      }
      return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    });
  }, [sharedPatients]);

  useEffect(() => {
    patientsSnapshotRef.current = patients;
  }, [patients]);

  useEffect(() => {
    timelineSnapshotRef.current = timelineEvents;
  }, [timelineEvents]);

  useEffect(() => {
    if (isLoadingPatients || patients.length === 0) return;
    const timer = window.setTimeout(() => writeProntuarioCache(patients, timelineEvents), 250);
    return () => window.clearTimeout(timer);
  }, [isLoadingPatients, patients, timelineEvents]);

  useEffect(() => {
    const client = createClient();
    if (!client) return;
    const supabase = client;

    let active = true;

    async function loadPatients() {
      if (typeof document !== "undefined" && document.hidden) return;
      const requestId = ++loadRequestRef.current;
      setIsLoadingPatients(true);
      const [registryResult, recordsResult, appointmentsResult, portalResult] = await Promise.all([
        supabase.from("patient_registry").select("passport,name,age,birth_date,sex,blood_type,city_phone,email,follow_up,portal_specialties,created_at,updated_at").order("created_at", { ascending: false }),
        supabase.from("clinical_records").select("id,patient_passport,record_type,created_at,title:payload->>title,exam_name:payload->>examName,document_title:payload->>documentTitle,doctor_name:payload->doctor->>name,doctor_name_flat:payload->>doctorName,summary:payload->>summary").order("created_at", { ascending: false }),
        supabase.from("appointments").select("id,passport,patient,status,created_at,updated_at,specialty:payload->>specialty,preferred_date:payload->>preferredDate,doctor_name:payload->>doctor,reason:payload->>reason,notes:payload->>notes").order("created_at", { ascending: false }),
        supabase.from("patient_portal_access").select("id,patient_passport,email,access_enabled,triage_status,schedule_assignments,created_at").order("created_at", { ascending: false }),
      ]);

      if (!active || requestId !== loadRequestRef.current) return;

      const criticalError = registryResult.error || recordsResult.error || portalResult.error;
      if (criticalError) {
        console.warn("[HPSR][Prontuários] Sincronização incompleta; mantendo o último estado válido.", {
          registry: registryResult.error?.message,
          records: recordsResult.error?.message,
          portalAccess: portalResult.error?.message,
        });
        setIsLoadingPatients(false);
        return;
      }

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
          sex: source.sex || current?.sex || "",
          cityPhone: source.cityPhone && source.cityPhone !== "Não informado" ? source.cityPhone : current?.cityPhone || "Não informado",
          birthDate: source.birthDate || current?.birthDate || "",
          status: source.status || current?.status || "Ativo",
          followUp: normalizePatientFollowUp(source.followUp || current?.followUp),
          portalSpecialties: source.portalSpecialties || current?.portalSpecialties || [],
          triageStatus: source.triageStatus || current?.triageStatus || "Classificado",
          scheduleAssignments: source.scheduleAssignments || current?.scheduleAssignments || [],
          lastVisit: [current?.lastVisit, source.lastVisit].filter(Boolean).sort().at(-1) || "",
          alerts: Array.from(new Set([...(current?.alerts || []), ...(source.alerts || [])])),
        });
      };

      for (const row of (registryResult.data || []) as any[]) {
        upsertPatient(row.passport, {
          name: row.name || `Paciente ${row.passport}`,
          age: row.age || "—",
          bloodType: row.blood_type || "—",
          sex: row.sex === "Masculino" || row.sex === "Feminino" ? row.sex : "",
          cityPhone: formatPhoneDisplay(row.city_phone, "Não informado"),
          birthDate: row.birth_date || "",
          status: normalizePatientFollowUp(row.follow_up) === "Rotina" ? "Ativo" : "Em acompanhamento",
          followUp: normalizePatientFollowUp(row.follow_up),
          portalSpecialties: Array.isArray(row.portal_specialties) ? row.portal_specialties.map(String) : [],
          lastVisit: String(row.updated_at || row.created_at || "").slice(0, 10),
        });
      }

      for (const row of (portalResult.data || []) as any[]) {
        const passport = String(row.patient_passport || "").trim();
        const current = patientMap.get(passport);
        if (!current) continue;
        upsertPatient(passport, {
          status: row.access_enabled ? current.status : "Arquivado",
          followUp: normalizePatientFollowUp(current.followUp),
          portalSpecialties: current.portalSpecialties || [],
          triageStatus: row.triage_status === "Pendente" ? "Pendente" : "Classificado",
          scheduleAssignments: normalizeScheduleAssignments(row.schedule_assignments),
          lastVisit: String(row.created_at || current.lastVisit || "").slice(0, 10),
          alerts: row.access_enabled ? current.alerts : [...current.alerts, "Acesso ao portal desativado"],
        });
      }

      for (const row of (appointmentsResult.error ? [] : (appointmentsResult.data || [])) as any[]) {
        const passport = String(row.passport || "").trim();
        if (!passport) continue;
        const registeredPatient = patientMap.get(passport);
        if (registeredPatient) {
          upsertPatient(passport, {
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
        const recordType = String(row.record_type || "").toLowerCase();
        const recognizedRecord = ["exame", "vacina", "documento", "prescrição", "prescricao", "procedimento", "observação", "observacao", "consulta"].some((type) => recordType.includes(type));
        if (!recognizedRecord) continue;
        const passport = String(row.patient_passport || "").trim();
        if (!passport) continue;
        const registeredPatient = patientMap.get(passport);
        if (registeredPatient) {
          upsertPatient(passport, {
            lastVisit: String(row.created_at || "").slice(0, 10),
          });
        }
        const kind: TimelineEvent["type"] = recordType.includes("consulta")
          ? "Consulta"
          : recordType.includes("vacin")
            ? "Vacina"
            : recordType.includes("exame")
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

      const nextPatients = Array.from(patientMap.values()).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
      const registryWasUnexpectedlyEmpty = nextPatients.length === 0 && patientsSnapshotRef.current.length > 0;
      if (registryWasUnexpectedlyEmpty) {
        console.warn("[HPSR][Prontuários] Resposta vazia inesperada; mantendo pacientes e registros carregados.");
        setIsLoadingPatients(false);
        return;
      }

      setPatients(nextPatients);
      setTimelineEvents(events);
      setIsLoadingPatients(false);
    }

    const cached = refreshKey === 0 ? readProntuarioCache() : null;
    const cacheIsFresh = Boolean(cached && Date.now() - cached.savedAt < PRONTUARIO_CACHE_TTL_MS);
    if (cacheIsFresh && cached) {
      setPatients(cached.patients);
      setTimelineEvents(cached.timelineEvents);
      setIsLoadingPatients(false);
    } else {
      void loadPatients();
    }

    const updateLastVisit = (passport: string, dateValue: unknown) => {
      const date = String(dateValue || "").slice(0, 10);
      if (!passport || !date) return;
      setPatients((current) => current.map((patient) => patient.passport === passport
        ? { ...patient, lastVisit: [patient.lastVisit, date].filter(Boolean).sort().at(-1) || date }
        : patient));
    };

    const clinicalEventFromRow = (row: any): TimelineEvent | null => {
      const recordType = String(row?.record_type || "").toLowerCase();
      const recognized = ["exame", "vacina", "documento", "prescrição", "prescricao", "procedimento", "observação", "observacao", "consulta"].some((type) => recordType.includes(type));
      if (!recognized) return null;
      const payload = (row?.payload || {}) as Record<string, any>;
      const passport = String(row?.patient_passport || "").trim();
      if (!passport) return null;
      const kind: TimelineEvent["type"] = recordType.includes("consulta")
        ? "Consulta"
        : recordType.includes("vacin")
          ? "Vacina"
          : recordType.includes("exame")
            ? "Exame"
            : recordType.includes("document")
              ? "Documento"
              : recordType.includes("prescri")
                ? "Prescrição"
                : recordType.includes("proced")
                  ? "Procedimento"
                  : "Observação";
      return {
        id: String(row.id),
        patientPassport: passport,
        type: kind,
        title: String(payload.examName || payload.documentTitle || payload.title || row.record_type || "Registro clínico"),
        date: String(row.created_at || row.updated_at || "").slice(0, 10),
        doctor: String(payload?.doctor?.name || payload.doctorName || "Equipe médica"),
        status: "Concluído",
        summary: String(payload.summary || "Registro armazenado no prontuário."),
      };
    };

    const appointmentEventFromRow = (row: any): TimelineEvent | null => {
      const passport = String(row?.passport || "").trim();
      if (!passport) return null;
      const payload = (row?.payload || {}) as Record<string, any>;
      const specialty = String(payload.specialty || "").trim();
      return {
        id: `appointment-${row.id}`,
        patientPassport: passport,
        type: "Consulta",
        title: specialty ? `Consulta · ${specialty}` : "Consulta agendada",
        date: String(payload.preferredDate || row.created_at || row.updated_at || "").slice(0, 10),
        doctor: String(payload.doctor || "Equipe médica"),
        status: String(row.status || "Agendada"),
        summary: String(payload.reason || payload.notes || "Consulta registrada no sistema."),
      };
    };

    const applyPatientRegistryChange = (payload: any) => {
      if (payload.eventType === "DELETE") {
        const passport = String(payload.old?.passport || "").trim();
        if (passport) setPatients((current) => current.filter((patient) => patient.passport !== passport));
        return;
      }
      const row = payload.new || {};
      const passport = String(row.passport || "").trim();
      if (!passport) return;
      setPatients((current) => {
        const previousPassport = String(payload.old?.passport || "").trim();
        const existing = current.find((patient) => patient.passport === passport) || current.find((patient) => patient.passport === previousPassport);
        const next: PatientRecord = {
          id: existing?.id || `pac-${passport}`,
          name: String(row.name || existing?.name || `Paciente ${passport}`),
          passport,
          age: String(row.age || existing?.age || "—"),
          bloodType: String(row.blood_type || existing?.bloodType || "—"),
          sex: row.sex === "Masculino" || row.sex === "Feminino" ? row.sex : existing?.sex || "",
          cityPhone: formatPhoneDisplay(row.city_phone, existing?.cityPhone || "Não informado"),
          birthDate: String(row.birth_date || existing?.birthDate || ""),
          status: existing?.status === "Arquivado" ? "Arquivado" : normalizePatientFollowUp(row.follow_up) === "Rotina" ? "Ativo" : "Em acompanhamento",
          followUp: normalizePatientFollowUp(row.follow_up || existing?.followUp),
          portalSpecialties: Array.isArray(row.portal_specialties) ? row.portal_specialties.map(String) : existing?.portalSpecialties || [],
          triageStatus: existing?.triageStatus || "Classificado",
          scheduleAssignments: existing?.scheduleAssignments || [],
          lastVisit: String(row.updated_at || row.created_at || existing?.lastVisit || "").slice(0, 10),
          alerts: existing?.alerts || [],
        };
        return [...current.filter((patient) => patient.passport !== passport && (!previousPassport || patient.passport !== previousPassport)), next].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
      });
    };

    const applyClinicalRecordChange = (payload: any) => {
      const row = payload.new || payload.old || {};
      const id = String(row.id || "");
      if (payload.eventType === "DELETE") {
        if (id) setTimelineEvents((current) => current.filter((event) => event.id !== id));
        return;
      }
      const event = clinicalEventFromRow(row);
      if (!event) {
        if (id) setTimelineEvents((current) => current.filter((item) => item.id !== id));
        return;
      }
      setTimelineEvents((current) => [event, ...current.filter((item) => item.id !== event.id)]);
      updateLastVisit(event.patientPassport, row.created_at || row.updated_at);
    };

    const applyAppointmentChange = (payload: any) => {
      const row = payload.new || payload.old || {};
      const eventId = row.id ? `appointment-${row.id}` : "";
      if (payload.eventType === "DELETE") {
        if (eventId) setTimelineEvents((current) => current.filter((event) => event.id !== eventId));
        return;
      }
      const event = appointmentEventFromRow(row);
      if (!event) return;
      setTimelineEvents((current) => [event, ...current.filter((item) => item.id !== event.id)]);
      updateLastVisit(event.patientPassport, row.updated_at || row.created_at);
    };

    const applyPortalChange = (payload: any) => {
      const row = payload.new || payload.old || {};
      const passport = String(row.patient_passport || "").trim();
      if (!passport) return;
      setPatients((current) => current.map((patient) => {
        if (patient.passport !== passport) return patient;
        if (payload.eventType === "DELETE") {
          return { ...patient, status: patient.followUp === "Rotina" ? "Ativo" : "Em acompanhamento", triageStatus: "Classificado", scheduleAssignments: [], alerts: patient.alerts.filter((alert) => alert !== "Acesso ao portal desativado") };
        }
        const enabled = Boolean(row.access_enabled);
        return {
          ...patient,
          status: enabled ? (patient.followUp === "Rotina" ? "Ativo" : "Em acompanhamento") : "Arquivado",
          triageStatus: row.triage_status === "Pendente" ? "Pendente" : "Classificado",
          scheduleAssignments: normalizeScheduleAssignments(row.schedule_assignments),
          alerts: enabled ? patient.alerts.filter((alert) => alert !== "Acesso ao portal desativado") : Array.from(new Set([...patient.alerts, "Acesso ao portal desativado"])),
        };
      }));
    };

    const channel = client
      .channel("prontuarios-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "patient_registry" }, applyPatientRegistryChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "clinical_records" }, applyClinicalRecordChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, applyAppointmentChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "patient_portal_access" }, applyPortalChange)
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

  const pendingPatients = useMemo(() => patients.filter((patient) => patient.triageStatus === "Pendente"), [patients]);

  const visiblePatients = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    return patients.filter((patient) => {
      const matchesSearch = !normalized || patient.passport.toLowerCase().includes(normalized) || patient.name.toLowerCase().includes(normalized);
      if (!matchesSearch) return false;
      if (patientFilter === "mine") return patient.scheduleAssignments.some((assignment) => assignment.doctor_id === currentUserProfile.id);
      if (patientFilter === "routine") return patient.followUp === "Rotina";
      return true;
    });
  }, [patients, searchTerm, patientFilter, currentUserProfile.id]);

  const searchedPatient =
    searchTerm.trim() && visiblePatients.length === 1 ? visiblePatients[0] : null;

  const selectedPatient =
    patients.find((patient) => patient.passport === selectedPassport) ?? searchedPatient;

  const selectedPatientAge = selectedPatient
    ? Number.parseInt(String(selectedPatient.age).replace(/\D/g, ""), 10)
    : Number.NaN;
  const selectedPatientIsMinor = Number.isFinite(selectedPatientAge) && selectedPatientAge < 18;

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
    if (event.type !== "Exame" && event.type !== "Documento") return;
    const client = createClient();
    const recordLabel = event.type === "Documento" ? "documento" : "exame";
    if (!client) {
      await hpsrAlert("Não foi possível conectar ao Supabase.", `${event.type} indisponível`);
      return;
    }

    setExamViewer({ open: true, loading: true, title: event.title, reportHtml: "", previewImages: [], patientName: selectedPatient?.name || "", doctorName: event.doctor, savedAt: event.date });
    const { data, error } = await client
      .from("clinical_records")
      .select("payload,created_at")
      .eq("id", event.id)
      .eq("record_type", event.type)
      .eq("patient_passport", event.patientPassport)
      .maybeSingle();

    if (error || !data) {
      setExamViewer((current) => ({ ...current, loading: false }));
      await hpsrAlert(error?.message || `O ${recordLabel} não foi encontrado no banco.`, `Não foi possível abrir o ${recordLabel}`);
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
      title: String(payload.examName || payload.documentTitle || payload.title || event.title || event.type),
      reportHtml: String(payload.reportHtml || payload.documentHtml || payload.finalHtml || payload.html || payload.editorHtml || ""),
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
    birthDate?: string;
    sex: string;
    bloodType: string;
    cityPhone: string;
    followUp: string;
  }) {
    const normalizedPassport = data.passport.trim().toUpperCase();
    const existingPatient = patients.find((patient) => patient.passport.trim().toUpperCase() === normalizedPassport);
    const createdAt = brazilIso();

    const nextPatient: PatientRecord = {
      id: existingPatient?.id || `pac-${normalizedPassport}`,
      name: data.name.trim(),
      passport: normalizedPassport,
      age: data.age.trim() || "—",
      bloodType: data.bloodType || "—",
      sex: data.sex === "Masculino" || data.sex === "Feminino" ? data.sex : "",
      cityPhone: data.cityPhone.trim() || "Não informado",
      birthDate: data.birthDate || "",
      status: normalizePatientFollowUp(data.followUp) === "Rotina" ? "Ativo" : "Em acompanhamento",
      followUp: normalizePatientFollowUp(data.followUp),
      portalSpecialties: existingPatient?.portalSpecialties || [],
      triageStatus: existingPatient?.triageStatus || "Classificado",
      scheduleAssignments: existingPatient?.scheduleAssignments || [],
      lastVisit: existingPatient?.lastVisit || "—",
      alerts: existingPatient?.alerts || [],
    };

    const client = createClient();
    if (!client) {
      await hpsrAlert("Não foi possível conectar ao Supabase.", "Cadastro não salvo");
      return;
    }

    const { data: duplicate, error: duplicateError } = await client
      .from("patient_registry")
      .select("passport,name")
      .eq("passport", normalizedPassport)
      .maybeSingle();

    if (duplicateError) {
      await hpsrAlert(duplicateError.message, "Não foi possível verificar o passaporte");
      return;
    }

    if (duplicate) {
      const replace = await hpsrConfirm(
        `O passaporte ${normalizedPassport} já está cadastrado para ${duplicate.name}.\n\nDeseja substituir somente os dados cadastrais? O histórico clínico será preservado.`,
        "Passaporte já cadastrado"
      );
      if (!replace) return;
      const finalConfirmation = await hpsrConfirm(
        `Confirma a substituição dos dados de ${duplicate.name} pelos dados informados para ${nextPatient.name}?`,
        "Confirmar substituição"
      );
      if (!finalConfirmation) return;
      const { error } = await client.from("patient_registry").update({
        name: nextPatient.name,
        age: nextPatient.age === "—" ? null : nextPatient.age,
        birth_date: data.birthDate || null,
        sex: nextPatient.sex || null,
        blood_type: nextPatient.bloodType === "—" ? null : nextPatient.bloodType,
        city_phone: nextPatient.cityPhone === "Não informado" ? null : nextPatient.cityPhone,
        follow_up: normalizePatientFollowUp(nextPatient.followUp),
        updated_at: createdAt,
      }).eq("passport", normalizedPassport);
      if (error) {
        await hpsrAlert(error.message, "Não foi possível substituir os dados");
        return;
      }
    } else {
      const { error } = await client.from("patient_registry").insert({
        passport: normalizedPassport,
        name: nextPatient.name,
        age: nextPatient.age === "—" ? null : nextPatient.age,
        birth_date: data.birthDate || null,
        sex: nextPatient.sex || null,
        blood_type: nextPatient.bloodType === "—" ? null : nextPatient.bloodType,
        city_phone: nextPatient.cityPhone === "Não informado" ? null : nextPatient.cityPhone,
        email: null,
        follow_up: normalizePatientFollowUp(nextPatient.followUp),
        updated_at: createdAt,
      });
      if (error) {
        const message = error.code === "23505" ? "Este passaporte foi cadastrado por outro profissional. Atualize a lista e tente novamente." : error.message;
        await hpsrAlert(message, "Não foi possível cadastrar o paciente");
        return;
      }
    }

    notifyPatientRegistryUpdated();

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
      sex: nextPatient.sex,
      birthDate: nextPatient.birthDate,
      cityPhone: nextPatient.cityPhone,
    });
    setSearchTerm("");
    setActiveTab("geral");
    setIsRegisterOpen(false);
  }

  async function handleEditPatient(data: { name: string; passport: string; age: string; birthDate: string; sex: string; bloodType: string; cityPhone: string; followUp: string }) {
    if (!selectedPatient) return;
    const client = createClient();
    if (!client) return void hpsrAlert("Não foi possível conectar ao Supabase.", "Edição não salva");
    const nextPassport = data.passport.trim().toUpperCase();
    if (!nextPassport || !data.name.trim()) return void hpsrAlert("Informe nome e passaporte.", "Campos obrigatórios");
    if (nextPassport !== selectedPatient.passport) {
      const { data: duplicate, error: duplicateError } = await client.from("patient_registry").select("name").eq("passport", nextPassport).maybeSingle();
      if (duplicateError) return void hpsrAlert(duplicateError.message, "Não foi possível verificar o passaporte");
      if (duplicate) return void hpsrAlert(`O passaporte ${nextPassport} já pertence a ${duplicate.name}. A edição foi cancelada.`, "Passaporte já cadastrado");
    }
    const confirmed = await hpsrConfirm(`Salvar as alterações cadastrais de ${selectedPatient.name}? O histórico clínico não será alterado.`, "Editar dados do paciente");
    if (!confirmed) return;
    const { error } = await client.from("patient_registry").update({
      passport: nextPassport,
      name: data.name.trim(),
      age: data.age.trim() || null,
      birth_date: data.birthDate || null,
      sex: data.sex === "Masculino" || data.sex === "Feminino" ? data.sex : null,
      blood_type: data.bloodType || null,
      city_phone: data.cityPhone.trim() || null,
      follow_up: normalizePatientFollowUp(data.followUp),
      updated_at: brazilIso(),
    }).eq("passport", selectedPatient.passport);
    if (error) return void hpsrAlert(error.message, "Não foi possível editar o paciente");
    setPatients((current) => current.map((patient) => patient.passport === selectedPatient.passport ? {
      ...patient,
      name: data.name.trim(),
      passport: nextPassport,
      age: data.age.trim() || "—",
      birthDate: data.birthDate || "",
      sex: data.sex === "Masculino" || data.sex === "Feminino" ? data.sex : "",
      bloodType: data.bloodType || "—",
      cityPhone: formatPhoneDisplay(data.cityPhone, "Não informado"),
      followUp: normalizePatientFollowUp(data.followUp),
    } : patient));
    setIsEditPatientOpen(false);
    setSelectedPassport(nextPassport);
    selectSharedPatient(nextPassport);
    notifyPatientRegistryUpdated();
  }

  async function handleAddClinicalRecord(data: {
    recordType: TimelineEvent["type"];
    recordTitle: string;
    recordSummary: string;
  }) {
    if (!selectedPatient) return;

    const recordDate = todayIso();
    const createdAt = brazilIso();
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
        ? { ...patient, lastVisit: recordDate }
        : patient
    ));
    setActiveTab("timeline");
    setIsClinicalRecordOpen(false);
  }

  return (
    <div className="hpsr-page min-w-0 gap-2 [overflow-wrap:anywhere] xl:h-[calc(100dvh-2.4rem)] xl:min-h-0 xl:overflow-hidden">
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

            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
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
                onClick={() => setIsPendingPatientsOpen(true)}
                className="relative inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[14px] border border-amber-200 bg-amber-50 px-3.5 text-xs font-black text-amber-800 transition hover:bg-amber-100"
              >
                <FileClock size={16} />
                Pendentes
                {pendingPatients.length > 0 && <span className="rounded-full bg-amber-700 px-2 py-0.5 text-[9px] text-white">{pendingPatients.length}</span>}
              </button>

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

        <div className="grid min-h-0 flex-1 gap-3 overflow-hidden p-3 xl:h-full xl:grid-cols-[minmax(330px,0.38fr)_minmax(0,1fr)] xl:items-stretch">
          <div className="flex min-h-0 flex-col overflow-hidden rounded-[16px] border border-hpsr-border bg-[#fffaf5] xl:h-full xl:max-h-full">
            <div className="shrink-0 border-b border-hpsr-border bg-white/80 px-3.5 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Pacientes</p>
                  <p className="mt-0.5 text-xs font-semibold text-hpsr-muted">{visiblePatients.length} resultado{visiblePatients.length === 1 ? "" : "s"}</p>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1 rounded-[12px] border border-hpsr-border bg-[#fffaf5] p-1">
                {([
                  ["all", "Todos"],
                  ["mine", "Meus acompanhamentos"],
                  ["routine", "Rotineiros"],
                ] as Array<[PatientFilter, string]>).map(([value, label]) => (
                  <button key={value} type="button" onClick={() => setPatientFilter(value)} className={`min-h-[34px] rounded-[9px] px-2 text-[10px] font-black transition ${patientFilter === value ? "bg-hpsr-wine text-white shadow-sm" : "text-hpsr-muted hover:bg-white"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid min-h-0 flex-1 auto-rows-max content-start gap-2 overflow-y-auto overscroll-contain p-2.5 pr-2 [scrollbar-gutter:stable]">
              {visiblePatients.map((patient) => {
                const selected = selectedPatient?.passport === patient.passport;
                return (
                  <div
                    key={patient.passport}
                    className={`group relative min-h-[68px] shrink-0 overflow-hidden rounded-[13px] border transition ${
                      selected
                        ? "border-hpsr-wine bg-white shadow-[0_6px_16px_rgba(103,38,20,0.09)]"
                        : patient.followUp !== "Rotina"
                          ? "border-blue-200 bg-blue-50/55 hover:border-blue-300 hover:bg-blue-50"
                          : "border-hpsr-border bg-white/90 hover:border-[#d6b9a4] hover:bg-white"
                    }`}
                  >
                    {selected && <span className="absolute inset-y-0 left-0 w-1 bg-hpsr-wine" />}
                    <div className="flex h-full items-center gap-2 px-3 py-2.5 pl-3.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPassport(patient.passport);
                          selectSharedPatient({ name: patient.name, passport: patient.passport, age: patient.age, bloodType: patient.bloodType, cityPhone: patient.cityPhone });
                          setActiveTab("geral");
                        }}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <p className="break-words [overflow-wrap:anywhere] text-sm font-black leading-snug text-hpsr-text">{patient.name}</p>
                          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-black ${statusClasses(patient.status)}`}>
                            {patient.followUp === "Rotina" ? "Rotineiro" : "Em acompanhamento"}
                          </span>
                          {patient.triageStatus === "Pendente" && <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-black text-amber-800">Pendente</span>}
                        </div>
                        <p className="mt-1 break-words [overflow-wrap:anywhere] text-[11px] font-semibold leading-relaxed text-hpsr-muted">
                          Passaporte {patient.passport} · {patient.age} anos · {patient.bloodType}
                        </p>
                      </button>

                      <button
                        type="button"
                        aria-label={`Excluir ${patient.name}`}
                        title="Excluir paciente"
                        disabled={isDeletingPatient}
                        onClick={() => void deletePatient(patient)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-transparent text-red-500 transition hover:border-red-100 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 size={14} />
                      </button>
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
            <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[16px] border border-hpsr-border bg-white xl:h-full xl:max-h-full">
              <div className="z-20 shrink-0 border-b border-hpsr-border bg-[linear-gradient(135deg,#fffdf9_0%,#f4e7dc_100%)] px-3.5 py-3 shadow-[0_8px_18px_rgba(79,42,21,0.05)]">
                <div className="flex flex-col gap-3">
                  <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <h2 className="min-w-0 break-words text-[clamp(1.35rem,2.2vw,2rem)] font-black leading-tight text-hpsr-text [overflow-wrap:anywhere]">{selectedPatient.name}</h2>
                        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black ${statusClasses(selectedPatient.status)}`}>
                          {selectedPatient.status}
                        </span>
                      </div>

                      <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                        <div className="rounded-[12px] border border-hpsr-border bg-white/90 px-3 py-2">
                          <p className="text-[9px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">Passaporte</p>
                          <p className="mt-0.5 break-words [overflow-wrap:anywhere] text-xs font-black leading-snug text-hpsr-text">{selectedPatient.passport}</p>
                        </div>
                        <div className="rounded-[12px] border border-hpsr-border bg-white/90 px-3 py-2">
                          <p className="text-[9px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">Idade</p>
                          <p className="mt-0.5 text-xs font-black text-hpsr-text">{selectedPatient.age} anos</p>
                        </div>
                        <div className="rounded-[12px] border border-hpsr-border bg-white/90 px-3 py-2">
                          <p className="text-[9px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">Sexo</p>
                          <p className="mt-0.5 text-xs font-black text-hpsr-text">{selectedPatient.sex || "Não informado"}</p>
                        </div>
                        <div className="rounded-[12px] border border-hpsr-border bg-white/90 px-3 py-2">
                          <p className="text-[9px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">Tipo sanguíneo</p>
                          <p className="mt-0.5 text-xs font-black text-hpsr-text">{selectedPatient.bloodType}</p>
                        </div>
                        <div className="rounded-[12px] border border-hpsr-border bg-white/90 px-3 py-2">
                          <p className="text-[9px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">Telefone</p>
                          <p className="mt-0.5 break-words [overflow-wrap:anywhere] text-xs font-black leading-snug text-hpsr-text">{formatPhoneDisplay(selectedPatient.cityPhone, "Não informado")}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2 xl:max-w-[500px] xl:justify-end">
                      <button type="button" onClick={() => setIsEditPatientOpen(true)} className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-[13px] border border-hpsr-border bg-white px-3 text-xs font-black text-hpsr-wine transition hover:bg-[#fff8f0]"><Pencil size={15} />Editar dados</button>
                      {selectedPatientIsMinor && (
                        <button type="button" onClick={() => setIsGuardiansOpen(true)} className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-[13px] border border-hpsr-border bg-white px-3 text-xs font-black text-hpsr-wine transition hover:bg-[#fff8f0]"><UsersRound size={15} />Responsáveis</button>
                      )}
                      <button type="button" onClick={() => setIsPortalSpecialtiesOpen(true)} className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-[13px] border border-hpsr-border bg-white px-3 text-xs font-black text-hpsr-wine transition hover:bg-[#fff8f0]"><Stethoscope size={15} />Agenda do portal</button>
                      <button
                        type="button"
                        onClick={() => setIsClinicalRecordOpen(true)}
                        className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-[13px] bg-[linear-gradient(135deg,#672614,#74321e)] px-3 text-xs font-black text-white transition hover:-translate-y-0.5"
                      >
                        <ClipboardPlus size={16} />
                        Adicionar registro
                      </button>
                      <button
                        type="button"
                        disabled={isDeletingPatient}
                        onClick={() => void deletePatient(selectedPatient)}
                        className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-[13px] border border-red-200 bg-red-50 px-3 text-xs font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 size={16} />
                        {isDeletingPatient ? "Excluindo..." : "Excluir paciente"}
                      </button>
                    </div>
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

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3.5 [scrollbar-gutter:stable]">
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
                {activeTab === "exames" && <ExamsTab events={patientEvents} onDelete={deleteClinicalRecord} onOpen={openSavedExam} />}
                {activeTab === "vacinas" && <FilteredEventsTab events={patientEvents} type="Vacina" empty="Nenhuma vacina registrada." />}
                {activeTab === "documentos" && <FilteredEventsTab events={patientEvents} type="Documento" empty="Nenhum documento vinculado." onDelete={deleteClinicalRecord} onOpen={openSavedExam} />}
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

      {isEditPatientOpen && selectedPatient && <EditPatientModal patient={selectedPatient} onClose={() => setIsEditPatientOpen(false)} onSave={handleEditPatient} />}
      {isGuardiansOpen && selectedPatient && <GuardianManagerModal patient={selectedPatient} patients={patients} onClose={() => setIsGuardiansOpen(false)} />}
      {isPortalSpecialtiesOpen && selectedPatient && <PortalSpecialtiesModal patient={selectedPatient} onClose={() => setIsPortalSpecialtiesOpen(false)} onSaved={() => { setIsPortalSpecialtiesOpen(false); refreshRecords(); }} />}
      {isPendingPatientsOpen && (
        <PendingPatientsModal
          patients={pendingPatients}
          doctorName={currentUserProfile.systemName}
          onClose={() => setIsPendingPatientsOpen(false)}
          onClassified={() => {
            setIsPendingPatientsOpen(false);
            refreshRecords();
          }}
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


function PendingPatientsModal({
  patients,
  doctorName,
  onClose,
  onClassified,
}: {
  patients: PatientRecord[];
  doctorName: string;
  onClose: () => void;
  onClassified: () => void;
}) {
  const [selectedPassport, setSelectedPassport] = useState(patients[0]?.passport || "");
  const [classification, setClassification] = useState<"rotineiro" | "acompanhamento">("rotineiro");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const selectedPatient = patients.find((patient) => patient.passport === selectedPassport) || null;

  function toggleSpecialty(specialty: string) {
    setSelectedSpecialties((current) => current.includes(specialty) ? current.filter((item) => item !== specialty) : [...current, specialty]);
  }

  async function classify() {
    if (!selectedPatient) return;
    if (classification === "acompanhamento" && selectedSpecialties.length === 0) {
      await hpsrAlert("Selecione ao menos uma especialidade para o acompanhamento.", "Especialidade necessária");
      return;
    }
    const client = createClient();
    if (!client) return;
    setSaving(true);
    const { error } = await client.rpc("classify_patient_portal_access", {
      target_passport: selectedPatient.passport,
      target_classification: classification,
      target_specialties: classification === "acompanhamento" ? selectedSpecialties : [],
    });
    setSaving(false);
    if (error) {
      await hpsrAlert(error.message, "Não foi possível classificar o paciente");
      return;
    }
    onClassified();
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-end justify-center bg-[#2a0700]/45 p-0 sm:items-center sm:p-4">
      <div className="flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[24px] border border-white/80 bg-[#fffaf4] shadow-2xl sm:rounded-[24px]">
        <div className="flex items-start justify-between bg-[linear-gradient(135deg,#2a0700,#672614,#9d6b4f)] px-5 py-4 text-white">
          <div>
            <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.14em]"><FileClock size={14} />Pacientes pendentes</span>
            <h2 className="mt-2 text-xl font-black">Classificação inicial</h2>
            <p className="mt-1 text-sm text-white/75">Novos cadastros são rotineiros por padrão. Defina apenas os pacientes que você acompanha.</p>
          </div>
          <button onClick={onClose} className="rounded-[12px] border border-white/25 bg-white/10 p-2"><X size={18} /></button>
        </div>

        <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="min-h-0 overflow-y-auto border-b border-hpsr-border bg-white p-3 lg:border-b-0 lg:border-r">
            {patients.length === 0 ? (
              <div className="rounded-[16px] border border-dashed border-hpsr-border bg-[#fffaf4] p-5 text-center text-sm font-semibold text-hpsr-muted">Nenhum novo cadastro aguardando classificação.</div>
            ) : patients.map((patient) => (
              <button key={patient.passport} type="button" onClick={() => { setSelectedPassport(patient.passport); setClassification("rotineiro"); setSelectedSpecialties([]); }} className={`mb-2 w-full rounded-[14px] border p-3 text-left transition ${selectedPassport === patient.passport ? "border-hpsr-wine bg-[#fff3e9]" : "border-hpsr-border bg-white hover:bg-[#fffaf4]"}`}>
                <p className="break-words [overflow-wrap:anywhere] text-sm font-black leading-snug text-hpsr-text">{patient.name}</p>
                <p className="mt-1 text-xs font-semibold text-hpsr-muted">Passaporte {patient.passport}</p>
              </button>
            ))}
          </div>

          <div className="min-h-0 overflow-y-auto p-4 sm:p-5">
            {selectedPatient ? (
              <div>
                <div className="rounded-[16px] border border-hpsr-border bg-white p-4">
                  <p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Paciente selecionado</p>
                  <h3 className="mt-1 text-lg font-black text-hpsr-text">{selectedPatient.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-hpsr-muted">{selectedPatient.age} anos · {selectedPatient.bloodType} · {selectedPatient.passport}</p>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button type="button" onClick={() => { setClassification("rotineiro"); setSelectedSpecialties([]); }} className={`rounded-[16px] border p-4 text-left ${classification === "rotineiro" ? "border-hpsr-wine bg-[#fff3e9] ring-2 ring-hpsr-wine/10" : "border-hpsr-border bg-white"}`}>
                    <p className="font-black text-hpsr-text">Paciente rotineiro</p>
                    <p className="mt-1 text-xs font-semibold leading-relaxed text-hpsr-muted">Mantém o cadastro padrão, sem vínculo de agenda com este médico.</p>
                  </button>
                  <button type="button" onClick={() => setClassification("acompanhamento")} className={`rounded-[16px] border p-4 text-left ${classification === "acompanhamento" ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100" : "border-hpsr-border bg-white"}`}>
                    <p className="font-black text-hpsr-text">Em acompanhamento</p>
                    <p className="mt-1 text-xs font-semibold leading-relaxed text-hpsr-muted">Libera para este paciente a agenda publicada por {doctorName} nas especialidades escolhidas.</p>
                  </button>
                </div>

                {classification === "acompanhamento" && (
                  <div className="mt-4 rounded-[16px] border border-hpsr-border bg-white p-4">
                    <p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Especialidades do acompanhamento</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {specialties.map((specialty) => {
                        const active = selectedSpecialties.includes(specialty);
                        return <button key={specialty} type="button" onClick={() => toggleSpecialty(specialty)} className={`rounded-[12px] border px-3 py-2.5 text-left text-xs font-black transition ${active ? "border-hpsr-wine bg-hpsr-wine text-white" : "border-hpsr-border bg-[#fffaf4] text-hpsr-text hover:border-hpsr-wineLight"}`}>{specialty}</button>;
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-[16px] border border-dashed border-hpsr-border bg-white p-8 text-center text-sm font-semibold text-hpsr-muted">Selecione um paciente para classificar.</div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-hpsr-border bg-white/95 px-5 py-3.5">
          <button type="button" onClick={onClose} className="rounded-[14px] border border-hpsr-border bg-white px-4 py-3 text-sm font-black text-hpsr-text">Fechar</button>
          <button type="button" disabled={saving || !selectedPatient} onClick={() => void classify()} className="inline-flex min-w-[170px] items-center justify-center gap-2 rounded-[14px] bg-hpsr-wine px-5 py-3 text-sm font-black text-white disabled:opacity-50">{saving ? <LoaderCircle size={16} className="animate-spin" /> : <ShieldCheck size={16} />}Salvar classificação</button>
        </div>
      </div>
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
    sex: string;
    bloodType: string;
    cityPhone: string;
    followUp: string;
  }) => void | Promise<void>;
}) {
  const [form, setForm] = useState({
    name: "",
    passport: "",
    age: "",
    birthDate: "",
    sex: "",
    bloodType: "A+",
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
                <ModalField label="Data de nascimento"><input type="date" className={modalInputClass} value={form.birthDate} onChange={(event) => updateField("birthDate", event.target.value)} /></ModalField>
                <ModalField label="Sexo"><StyledSelect className={modalInputClass} value={form.sex} onChange={(event) => updateField("sex", event.target.value)}><option value="">Não informado</option><option value="Masculino">Masculino</option><option value="Feminino">Feminino</option></StyledSelect></ModalField>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <ModalField label="Tipo sanguíneo"><StyledSelect className={modalInputClass} value={form.bloodType} onChange={(event) => updateField("bloodType", event.target.value)}><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option></StyledSelect></ModalField>
                <ModalField label="Telefone na cidade"><input className={modalInputClass} value={form.cityPhone} onChange={(event) => updateField("cityPhone", formatPhoneNumber(event.target.value))} inputMode="numeric" maxLength={13} placeholder="(055) 626-323" /></ModalField>
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


function EditPatientModal({ patient, onClose, onSave }: { patient: PatientRecord; onClose: () => void; onSave: (data: { name: string; passport: string; age: string; birthDate: string; sex: string; bloodType: string; cityPhone: string; followUp: string }) => void | Promise<void> }) {
  const [form, setForm] = useState({ name: patient.name, passport: patient.passport, age: patient.age === "—" ? "" : patient.age, birthDate: patient.birthDate || "", sex: patient.sex || "", bloodType: patient.bloodType === "—" ? "" : patient.bloodType, cityPhone: patient.cityPhone === "Não informado" ? "" : patient.cityPhone, followUp: normalizePatientFollowUp(patient.followUp) });
  const [saving, setSaving] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); try { await onSave(form); } finally { setSaving(false); } }
  return <div className="fixed inset-0 z-[999] flex items-center justify-center overflow-y-auto px-4 py-3"><button type="button" aria-label="Fechar edição" onClick={onClose} className="absolute inset-0 bg-[#2a0700]/45" /><form onSubmit={submit} className="relative z-10 flex max-h-[calc(100dvh-2rem)] w-full max-w-[720px] flex-col overflow-hidden rounded-[22px] border border-white/80 bg-[#fffaf4] shadow-[0_28px_90px_rgba(42,7,0,0.28)]"><div className="bg-[linear-gradient(135deg,#2a0700_0%,#672614_52%,#9d6b4f_100%)] px-5 py-4 text-white"><div className="flex items-start justify-between gap-3"><div><span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em]"><Pencil size={14}/>Dados cadastrais</span><h2 className="mt-3 text-xl font-black">Editar paciente</h2><p className="mt-1 text-sm text-white/80">O histórico clínico será preservado.</p></div><button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-[14px] border border-white/25 bg-white/10"><X size={18}/></button></div></div><div className="min-h-0 overflow-y-auto p-4 sm:p-5"><section className="grid gap-3 rounded-[18px] border border-hpsr-border bg-white p-4"><ModalField label="Nome" required><input className={modalInputClass} value={form.name} onChange={e=>setForm(c=>({...c,name:e.target.value}))}/></ModalField><div className="grid gap-3 sm:grid-cols-2"><ModalField label="Passaporte" required><input className={modalInputClass} value={form.passport} onChange={e=>setForm(c=>({...c,passport:e.target.value.toUpperCase()}))}/></ModalField><ModalField label="Idade"><input className={modalInputClass} value={form.age} onChange={e=>setForm(c=>({...c,age:e.target.value}))}/></ModalField></div><div className="grid gap-3 sm:grid-cols-2"><ModalField label="Data de nascimento"><input type="date" className={modalInputClass} value={form.birthDate} onChange={e=>setForm(c=>({...c,birthDate:e.target.value}))}/></ModalField><ModalField label="Sexo"><StyledSelect className={modalInputClass} value={form.sex} onChange={e=>setForm(c=>({...c,sex:e.target.value}))}><option value="">Não informado</option><option value="Masculino">Masculino</option><option value="Feminino">Feminino</option></StyledSelect></ModalField></div><div className="grid gap-3 sm:grid-cols-2"><ModalField label="Tipo sanguíneo"><input className={modalInputClass} value={form.bloodType} onChange={e=>setForm(c=>({...c,bloodType:e.target.value.toUpperCase()}))}/></ModalField><ModalField label="Telefone"><input className={modalInputClass} value={form.cityPhone} onChange={e=>setForm(c=>({...c,cityPhone:formatPhoneNumber(e.target.value)}))}/></ModalField></div><ModalField label="Acompanhamento"><StyledSelect className={modalInputClass} value={form.followUp} onChange={e=>setForm(c=>({...c,followUp:e.target.value as "Rotina" | "Clínico" | "Especializado"}))}><option>Rotina</option><option>Clínico</option><option>Especializado</option></StyledSelect></ModalField></section></div><div className="flex flex-col-reverse gap-3 border-t border-hpsr-border bg-white px-5 py-3.5 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="rounded-[16px] border border-hpsr-border bg-white px-4 py-3 text-sm font-black">Cancelar</button><button disabled={saving} type="submit" className="rounded-[16px] bg-hpsr-wine px-5 py-3 text-sm font-black text-white disabled:opacity-60">{saving?"Salvando...":"Salvar alterações"}</button></div></form></div>;
}

function PortalSpecialtiesModal({ patient, onClose, onSaved }: { patient: PatientRecord; onClose: () => void; onSaved: () => void }) {
  const { profile: currentUserProfile } = useCurrentUserProfile();
  const ownSpecialties = patient.scheduleAssignments
    .filter((assignment) => assignment.doctor_id === currentUserProfile.id)
    .map((assignment) => assignment.specialty);
  const [selected, setSelected] = useState<string[]>(ownSpecialties);
  const [saving, setSaving] = useState(false);

  function toggle(specialty: string) {
    setSelected((current) => current.includes(specialty) ? current.filter((item) => item !== specialty) : [...current, specialty]);
  }

  async function save() {
    const client = createClient();
    if (!client) return void hpsrAlert("Não foi possível conectar ao Supabase.", "Agenda não salva");
    setSaving(true);
    const { error } = await client.rpc("classify_patient_portal_access", {
      target_passport: patient.passport,
      target_classification: selected.length > 0 ? "acompanhamento" : "rotineiro",
      target_specialties: selected,
    });
    setSaving(false);
    if (error) return void hpsrAlert(error.message, "Não foi possível atualizar a agenda");
    notifyPatientRegistryUpdated();
    onSaved();
  }

  return <div className="fixed inset-0 z-[999] flex items-end justify-center bg-[#2a0700]/45 p-0 sm:items-center sm:p-4"><div className="flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[24px] border border-white/80 bg-[#fffaf4] shadow-2xl sm:rounded-[24px]"><div className="flex items-start justify-between bg-[linear-gradient(135deg,#2a0700,#672614,#9d6b4f)] px-5 py-4 text-white"><div><span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.14em]"><Stethoscope size={14}/>Agenda do Portal do Paciente</span><h2 className="mt-2 text-xl font-black">{patient.name}</h2><p className="mt-1 text-sm text-white/75">Defina em quais especialidades este paciente acompanha você.</p></div><button onClick={onClose} className="rounded-[12px] border border-white/25 bg-white/10 p-2"><X size={18}/></button></div><div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5"><div className="rounded-[16px] border border-blue-200 bg-blue-50 p-3 text-sm font-semibold leading-relaxed text-blue-900">Os horários exibidos serão apenas os publicados por <strong>{currentUserProfile.systemName}</strong> nas especialidades selecionadas. Sem seleção, este médico não fica vinculado à agenda do paciente.</div><div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{specialties.map((specialty) => { const active = selected.includes(specialty); return <button key={specialty} type="button" onClick={() => toggle(specialty)} className={`flex items-center justify-between gap-3 rounded-[14px] border px-3 py-3 text-left text-sm font-black transition ${active ? "border-hpsr-wine bg-hpsr-wine text-white" : "border-hpsr-border bg-white text-hpsr-text hover:border-hpsr-wineLight"}`}><span>{specialty}</span><span className={`h-4 w-4 rounded-full border-2 ${active ? "border-white bg-white" : "border-hpsr-border bg-white"}`}/></button>; })}</div>{selected.length > 0 && <div className="mt-4 rounded-[16px] border border-hpsr-border bg-white p-4"><p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Seu acompanhamento</p><p className="mt-2 text-sm font-semibold leading-relaxed text-hpsr-muted">{selected.join(" · ")}</p></div>}</div><div className="flex justify-end gap-3 border-t border-hpsr-border bg-white/95 px-5 py-3.5"><button type="button" onClick={onClose} className="rounded-[14px] border border-hpsr-border bg-white px-4 py-3 text-sm font-black text-hpsr-text">Cancelar</button><button type="button" disabled={saving} onClick={() => void save()} className="inline-flex min-w-[150px] items-center justify-center gap-2 rounded-[14px] bg-hpsr-wine px-5 py-3 text-sm font-black text-white disabled:opacity-50">{saving ? <LoaderCircle size={16} className="animate-spin" /> : <ShieldCheck size={16}/>}Salvar vínculo</button></div></div></div>;
}

function GuardianManagerModal({ patient, patients, onClose }: { patient: PatientRecord; patients: PatientRecord[]; onClose: () => void }) {
  type Link = { id: string; guardian_passport: string; relationship: string; access_status: string; portal_access: boolean; guardian?: { name?: string } | null };
  const [links,setLinks]=useState<Link[]>([]); const [guardianPassport,setGuardianPassport]=useState(""); const [relationship,setRelationship]=useState("Responsável legal"); const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false);
  const load=useCallback(async()=>{const client=createClient(); if(!client)return; setLoading(true); const {data,error}=await client.from("patient_guardian_links").select("id,guardian_passport,relationship,access_status,portal_access").eq("child_passport",patient.passport).order("created_at"); setLoading(false); if(error){await hpsrAlert(error.message,"Não foi possível carregar os responsáveis");return;} const rows=(data||[]) as Link[]; const names=new Map(patients.map(p=>[p.passport,p.name])); setLinks(rows.map(row=>({...row,guardian:{name:names.get(row.guardian_passport)||`Paciente ${row.guardian_passport}`}})));},[patient.passport,patients]);
  useEffect(()=>{void load()},[load]);
  async function add(){if(!guardianPassport||guardianPassport===patient.passport)return void hpsrAlert("Selecione outro paciente como responsável.","Responsável inválido"); const client=createClient(); if(!client)return; setSaving(true); const {error}=await client.from("patient_guardian_links").insert({child_passport:patient.passport,guardian_passport:guardianPassport,relationship,access_status:"authorized",portal_access:true}); setSaving(false); if(error){await hpsrAlert(error.code==="23505"?"Este responsável já está vinculado ao paciente.":error.message,"Não foi possível vincular");return;} await load();}
  async function change(link:Link,status:string){const client=createClient(); if(!client)return; const {error}=await client.from("patient_guardian_links").update({access_status:status,portal_access:status==="authorized"}).eq("id",link.id); if(error)return void hpsrAlert(error.message,"Não foi possível alterar o acesso"); await load();}
  return <div className="fixed inset-0 z-[999] flex items-end justify-center bg-[#2a0700]/45 p-0 sm:items-center sm:p-4"><div className="flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[24px] border border-white/80 bg-[#fffaf4] shadow-2xl sm:rounded-[24px]"><div className="flex items-start justify-between bg-[linear-gradient(135deg,#2a0700,#672614,#9d6b4f)] px-5 py-4 text-white"><div><span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.14em]"><ShieldCheck size={14}/>Responsáveis e acessos</span><h2 className="mt-2 text-xl font-black">{patient.name}</h2></div><button onClick={onClose} className="rounded-[12px] border border-white/25 bg-white/10 p-2"><X size={18}/></button></div><div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5"><section className="rounded-[18px] border border-hpsr-border bg-white p-4"><div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"><ModalField label="Responsável cadastrado"><StyledSelect className={modalInputClass} value={guardianPassport} onChange={e=>setGuardianPassport(e.target.value)}><option value="">Selecione</option>{patients.filter(p=>p.passport!==patient.passport).map(p=><option key={p.passport} value={p.passport}>{p.name} · {p.passport}</option>)}</StyledSelect></ModalField><ModalField label="Vínculo"><StyledSelect className={modalInputClass} value={relationship} onChange={e=>setRelationship(e.target.value)}><option>Mãe</option><option>Pai</option><option>Tutor</option><option>Responsável legal</option><option>Outro</option></StyledSelect></ModalField><button disabled={saving||!guardianPassport} onClick={()=>void add()} className="mt-auto min-h-[46px] rounded-[15px] bg-hpsr-wine px-4 text-sm font-black text-white disabled:opacity-50">Vincular</button></div></section><section className="mt-4 space-y-2"><div className="rounded-[14px] border border-blue-200 bg-blue-50 p-3 text-xs font-semibold leading-relaxed text-blue-900">O sistema já compara o prontuário e organiza a solicitação. Para pedidos pendentes, basta conferir nome, passaporte e responsável e clicar em <strong>Confirmar vínculo</strong>.</div>{loading?<p className="p-4 text-center text-sm font-semibold text-hpsr-muted">Carregando...</p>:links.length===0?<p className="rounded-[16px] border border-dashed border-hpsr-border bg-white p-5 text-center text-sm font-semibold text-hpsr-muted">Nenhum responsável vinculado.</p>:links.map(link=><article key={link.id} className="flex flex-col gap-3 rounded-[16px] border border-hpsr-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-black text-hpsr-text">{link.guardian?.name}</p><p className="mt-1 text-xs font-semibold text-hpsr-muted">{link.relationship} · {link.guardian_passport}</p></div><div className="flex flex-wrap gap-2"><span className={`rounded-full px-3 py-1 text-xs font-black ${link.access_status==="pending"?"bg-amber-100 text-amber-800":link.access_status==="authorized"?"bg-emerald-100 text-emerald-800":link.access_status==="suspended"?"bg-amber-100 text-amber-800":"bg-rose-100 text-rose-800"}`}>{link.access_status==="pending"?"Aguardando validação":link.access_status==="authorized"?"Autorizado":link.access_status==="suspended"?"Suspenso":"Encerrado"}</span>{link.access_status!=="authorized"&&<button onClick={()=>void change(link,"authorized")} className="rounded-[12px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">Confirmar vínculo</button>}{link.access_status==="authorized"&&<button onClick={()=>void change(link,"suspended")} className="rounded-[12px] border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">Suspender</button>}<button onClick={()=>void change(link,"ended")} className="rounded-[12px] border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700">Encerrar</button></div></article>)}</section></div></div></div>;
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
        <div className="min-h-0 overflow-y-auto p-4 sm:p-5"><section className="rounded-[18px] border border-hpsr-border bg-white p-4"><div className="grid gap-3"><ModalField label="Tipo de registro"><StyledSelect className={modalInputClass} value={form.recordType} onChange={(event) => setForm((current) => ({ ...current, recordType: event.target.value as TimelineEvent["type"] }))}><option value="Consulta">Consulta</option><option value="Exame">Exame</option><option value="Prescrição">Prescrição</option><option value="Procedimento">Procedimento</option><option value="Observação">Observação</option></StyledSelect></ModalField><ModalField label="Título do registro" required><input required className={modalInputClass} value={form.recordTitle} onChange={(event) => setForm((current) => ({ ...current, recordTitle: event.target.value }))} placeholder="Ex.: Consulta obstétrica" /></ModalField><ModalField label="Registro / evolução médica" required><textarea required className={`${modalInputClass} min-h-[190px] resize-y leading-relaxed`} value={form.recordSummary} onChange={(event) => setForm((current) => ({ ...current, recordSummary: event.target.value }))} placeholder="Descreva queixa, achados relevantes, conduta, orientação ou retorno." /></ModalField><div className="rounded-[16px] border border-amber-200 bg-amber-50 p-3.5 text-sm leading-relaxed text-amber-800">O registro será assinado como <strong>{currentUserProfile.systemName}</strong> e entrará na linha do tempo do paciente.</div></div></section></div>
        <div className="flex justify-end gap-3 border-t border-hpsr-border bg-white/95 px-5 py-3.5"><button type="button" onClick={onClose} className="rounded-[16px] border border-hpsr-border bg-white px-4 py-3 text-sm font-black text-hpsr-text">Cancelar</button><button type="submit" className="rounded-[16px] bg-[linear-gradient(135deg,#672614,#74321e)] px-5 py-3 text-sm font-black text-white">Salvar registro</button></div>
      </form>
    </div>
  );
}


function normalizeScheduleAssignments(value: unknown): ScheduleAssignment[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const doctorId = String(row.doctor_id || "").trim();
    const doctorName = String(row.doctor_name || "").trim();
    const specialty = String(row.specialty || "").trim();
    return doctorId && specialty ? [{ doctor_id: doctorId, doctor_name: doctorName || "Médico", specialty }] : [];
  });
}

const VALID_PATIENT_FOLLOW_UP = ["Rotina", "Clínico", "Especializado"] as const;

function normalizePatientFollowUp(value: unknown): (typeof VALID_PATIENT_FOLLOW_UP)[number] {
  const normalized = String(value ?? "").trim();
  return VALID_PATIENT_FOLLOW_UP.includes(normalized as (typeof VALID_PATIENT_FOLLOW_UP)[number])
    ? (normalized as (typeof VALID_PATIENT_FOLLOW_UP)[number])
    : "Rotina";
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


function ExamsTab({
  events,
  onDelete,
  onOpen,
}: {
  events: TimelineEvent[];
  onDelete: (event: TimelineEvent) => void;
  onOpen: (event: TimelineEvent) => void;
}) {
  const exams = events.filter((event) => event.type === "Exame");

  if (exams.length === 0) return <EmptyState text="Nenhum exame vinculado." />;

  return (
    <section className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-hpsr-border bg-[#fff8f0] px-4 py-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Exames salvos</p>
          <p className="mt-1 text-sm font-semibold text-hpsr-muted">Abra o exame completo sem sair do prontuário. O conteúdo é carregado somente ao abrir.</p>
        </div>
        <span className="rounded-full border border-hpsr-border bg-white px-3 py-1.5 text-xs font-black text-hpsr-wine">{exams.length} {exams.length === 1 ? "exame" : "exames"}</span>
      </div>
      {exams.map((event) => (
        <EventCard key={event.id} event={event} onDelete={onDelete} onOpen={onOpen} />
      ))}
    </section>
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
    <article className="min-w-0 rounded-[16px] border border-hpsr-border bg-white p-3.5 transition [overflow-wrap:anywhere] hover:bg-[#fffdf9]">
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
          <h3 className="mt-3 break-words text-lg font-black leading-snug text-hpsr-text [overflow-wrap:anywhere]">{event.title}</h3>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-hpsr-muted [overflow-wrap:anywhere]">{event.summary}</p>
        </div>

        <div className="flex flex-col gap-2 lg:min-w-[210px]">
        <div className="rounded-[16px] border border-hpsr-border bg-[#fff8f0] px-3 py-2 text-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">Registro</p>
          <p className="mt-1 font-black text-hpsr-text">{formatDate(event.date)}</p>
          <p className="mt-0.5 break-words text-xs font-semibold leading-relaxed text-hpsr-muted [overflow-wrap:anywhere]">{event.doctor}</p>
        </div>
        {onOpen && (event.type === "Exame" || event.type === "Documento") && <button type="button" onClick={() => onOpen(event)} className="inline-flex items-center justify-center gap-2 rounded-[12px] border border-hpsr-wine/20 bg-[#fff3e8] px-3 py-2 text-xs font-black text-hpsr-wine transition hover:bg-[#ffead8]"><Eye size={14} /> Visualizar {event.type.toLowerCase()}</button>}
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
            <p className="text-[10px] font-black uppercase tracking-[.16em] text-hpsr-wineLight">Registro salvo no prontuário</p>
            <h3 className="break-words [overflow-wrap:anywhere] text-lg font-black leading-tight text-hpsr-text sm:text-xl">{exam.title}</h3>
            <p className="mt-0.5 text-xs font-semibold text-hpsr-muted">{exam.patientName} · {exam.doctorName}{exam.savedAt ? ` · ${new Date(exam.savedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}` : ""}</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" disabled={exam.loading} onClick={onDownload} className="inline-flex h-10 items-center gap-2 rounded-[13px] border border-hpsr-border bg-[#fff8f0] px-3 text-xs font-black text-hpsr-wine disabled:opacity-50"><Download size={15} /> Baixar</button>
            <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-[13px] border border-hpsr-border bg-white text-hpsr-wine"><X size={18} /></button>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-auto p-3 sm:p-5">
          {exam.loading ? (
            <div className="flex min-h-full items-center justify-center"><div className="text-center"><LoaderCircle className="mx-auto animate-spin text-hpsr-wine" size={30} /><p className="mt-3 text-sm font-black text-hpsr-text">Carregando registro...</p></div></div>
          ) : exam.previewImages.length ? (
            <div className="mx-auto grid max-w-[900px] gap-5">{exam.previewImages.map((src, index) => <figure key={`${src.slice(0, 40)}-${index}`} className="overflow-hidden rounded-[10px] bg-white shadow-[0_12px_40px_rgba(42,7,0,.18)]"><img src={src} alt={`Página ${index + 1} do registro`} className="block h-auto w-full" /><figcaption className="border-t border-hpsr-border px-3 py-2 text-center text-[10px] font-black uppercase tracking-[.12em] text-hpsr-muted">Página {index + 1}</figcaption></figure>)}</div>
          ) : exam.reportHtml ? (
            <div className="mx-auto min-h-[900px] max-w-[900px] overflow-hidden rounded-[10px] bg-white shadow-[0_12px_40px_rgba(42,7,0,.18)]"><iframe title={exam.title} srcDoc={exam.reportHtml} className="h-[1100px] w-full border-0 bg-white" /></div>
          ) : (
            <div className="flex min-h-full items-center justify-center"><EmptyState text="O conteúdo completo deste registro não está disponível." /></div>
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
          <p className="break-words [overflow-wrap:anywhere] text-[9px] font-black uppercase leading-snug tracking-[0.12em] text-hpsr-wineLight">{label}</p>
          <p className="mt-0.5 text-base font-black leading-none text-hpsr-text">{value}</p>
        </div>
        <span className="shrink-0 text-hpsr-wine">{icon}</span>
      </div>
    </div>
  );
}

function PatientCardInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-hpsr-border bg-white/[0.86] px-3 py-2">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">{label}</p>
      <p className="mt-1 break-words [overflow-wrap:anywhere] text-xs font-black leading-snug text-hpsr-text">{value}</p>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-hpsr-border bg-white px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">{label}</p>
      <p className="mt-1 break-words text-sm font-black leading-snug text-hpsr-text [overflow-wrap:anywhere]">{value}</p>
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
