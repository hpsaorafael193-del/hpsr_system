"use client";

import { Baby, CalendarDays, CheckCircle2, ClipboardList, Eye, FileImage, HeartPulse, History, Loader2, Plus, RefreshCcw, Search, Sparkles, Syringe, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useCurrentUserProfile } from "@/components/auth/CurrentUserProfileProvider";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { usePatientSelection } from "@/components/patients/PatientSelectionProvider";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { canAccessObstetra, canManageReproductivePlan } from "@/lib/obstetra-access";
import { canManageGestationalVaccination } from "@/lib/gestational-vaccination-access";
import { VaccinationWorkspace } from "@/components/vaccination/VaccinationWorkspace";
import { FollowupIntakeFormManager } from "@/components/dashboard/FollowupIntakeFormManager";
import { renderIndividualPlanningCanvas, renderIntegralPlanningCanvas } from "@/lib/obstetric-document";
import {
  createPlanningSuggestion,
  normalizePlanningSteps,
  planningKey,
  validatePlanningSteps,
  planningAdvisories,
  renumberPlanningSteps,
  newPlanningStep,
  type PlanningKind,
  type PlanningStep,
  type PlanningSuggestion,
} from "@/lib/obstetric-planning";
import { obstetricDraftKey, parseObstetricDraft, type ObstetricPlanningDraft } from "@/lib/obstetric-planning-draft";
import { normalizeStaffSpecialtyName } from "@/lib/staff-specialties";
import { createClient } from "@/lib/supabase";
import { hpsrConfirm } from "@/components/ui/HpsrDialogProvider";

const inputClass = "hpsr-planning-input h-11 w-full rounded-[14px] border border-hpsr-border bg-white px-3.5 text-sm font-semibold text-hpsr-text outline-none transition focus:border-hpsr-wine";
const textAreaClass = `${inputClass} min-h-[112px] resize-y py-3 leading-relaxed`;

type PlanningDocumentVersion = {
  path?: string;
  at: string;
  released_snapshot?: Record<string, unknown>;
  start_date?: string;
  end_date?: string | null;
  consultation_schedule?: PlanningStep[];
  planning_notes?: string | null;
};

type ObstetricPlan = {
  id: string;
  patient_name: string;
  patient_passport: string;
  doctor_id: string;
  doctor_name: string;
  specialty: string;
  start_date: string;
  end_date: string | null;
  planning_notes: string | null;
  consultation_schedule: PlanningStep[] | null;
  portal_released_at: string | null;
  plan_type: PlanningKind;
  total_consultations: number | null;
  status: string;
  created_at: string;
  schedule_confirmed_at: string | null;
  planning_document_path: string | null;
  planning_released_document_path: string | null;
  planning_document_versions: PlanningDocumentVersion[] | null;
  planning_released_snapshot?: Record<string, unknown> | null;
};

type FollowupOccurrence = {
  id: string;
  plan_id: string;
  doctor_id: string;
  patient_name: string;
  patient_passport: string;
  specialty: string;
  planned_date: string;
  status: string;
  appointment_id: string | null;
  slot_id: string | null;
  step_number: number | null;
  rp_marker: string | null;
  step_title: string | null;
  planned_text: string | null;
  evolution_text: string | null;
  medical_observation_text: string | null;
  followup_report: FollowupReport | null;
  conduct_text: string | null;
  individual_document_path: string | null;
  individual_released_document_path: string | null;
  individual_document_versions: Array<{ path?: string; at: string; released_snapshot?: Record<string, unknown> }> | null;
  individual_released_snapshot?: Record<string, unknown> | null;
  individual_released_at: string | null;
};

type FollowupReport = {
  exams_performed?: string;
  exam_explanation?: string;
  patient_observations?: string;
  private_draft?: string;
};

type PreviewState = { canvas: HTMLCanvasElement; signature: string };
type HistoryTimelineEvent = { at: string; title: string; detail?: string };
type PendingIndividualAction = { type: "switch"; occurrenceId: string } | { type: "close" } | null;
type AccompanimentWorkspaceView = "planning" | "vaccination";

type FieldProps = { label: string; children: React.ReactNode; hint?: string };
function Field({ label, children, hint }: FieldProps) {
  return <label className="hpsr-planning-field grid min-w-0 gap-1.5"><span className="hpsr-planning-field-label text-[10px] font-black uppercase tracking-[.15em] text-hpsr-wineLight">{label}</span>{children}{hint && <span className="text-[11px] leading-relaxed text-hpsr-muted">{hint}</span>}</label>;
}

function CanvasPreviewSurface({ source, label }: { source: HTMLCanvasElement; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    canvas.width = source.width;
    canvas.height = source.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(source, 0, 0);
  }, [source]);
  return <canvas ref={ref} aria-label={label} className="mx-auto block h-auto w-full max-w-[1040px] rounded-[10px] border border-[#dec5b2] bg-white shadow-sm" />;
}

async function downloadCanvasPng(canvas: HTMLCanvasElement, filename: string) {
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Não foi possível gerar o PNG solicitado.")), "image/png"));
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return value.split("-").reverse().join("/");
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function planTypeLabel(kind: PlanningKind) {
  return kind === "in_vitro" ? "Fertilização in vitro" : "Gestacional";
}

function specialtyForPlan(kind: PlanningKind) {
  return kind === "in_vitro" ? "Ginecologia" : "Obstetra";
}

function linkMatchesPlan(kind: PlanningKind, specialty: string) {
  const value = normalizeStaffSpecialtyName(specialty);
  const combined = ["ginecologia e obstetricia", "obstetricia e ginecologia", "ginecologista e obstetra"];
  if (combined.includes(value)) return true;
  if (kind === "in_vitro") return ["ginecologia", "ginecologista"].includes(value);
  return ["obstetra", "obstetricia", "obstetrica"].includes(value);
}

export default function ObstetricianPage() {
  const { profile, loading } = useCurrentUserProfile();
  if (loading) return <div className="hpsr-page p-5 text-sm text-hpsr-muted">Verificando acesso à especialidade...</div>;
  if (!canAccessObstetra(profile.role, profile.specialty)) {
    return <div className="hpsr-page gap-3"><PageHeader eyebrow="Acompanhamento clínico" title="Acompanhamento" description="Acesso aos acompanhamentos especializados do Hospital São Rafael." /><section className="rounded-[18px] border border-[#dcb6bd] bg-[#fff8f4] p-5"><p className="font-bold text-hpsr-text">Acesso restrito à especialidade.</p><p className="mt-2 text-sm text-hpsr-muted">Diretora e Vice Diretor / Dev possuem acesso administrativo total. Demais profissionais precisam ter Obstetrícia ou Ginecologia atribuída ao perfil.</p><Link href="/dashboard" className="mt-4 inline-flex rounded-[12px] bg-hpsr-wine px-4 py-2 text-sm font-bold text-white">Voltar ao painel</Link></section></div>;
  }
  return <ObstetricianWorkspace />;
}

function ObstetricianWorkspace() {
  const { patients, selectedPassport, selectedPatient, selectPatient, loading } = usePatientSelection();
  const { profile } = useCurrentUserProfile();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const passport = params.get("patient");
    const specialty = normalizeStaffSpecialtyName(params.get("specialty") || "");
    if (passport && passport !== selectedPassport) selectPatient(passport);
    if (["ginecologia", "ginecologista"].includes(specialty) && canManageReproductivePlan(profile.role, profile.specialty, "in_vitro")) setPlanType("in_vitro");
    if (["obstetra", "obstetricia", "obstetrica"].includes(specialty) && canManageReproductivePlan(profile.role, profile.specialty, "gestacional")) setPlanType("gestacional");
  }, [selectPatient, selectedPassport, profile.role, profile.specialty]);
  const [planType, setPlanType] = useState<PlanningKind>(() => canManageReproductivePlan(profile.role, profile.specialty, "gestacional") ? "gestacional" : "in_vitro");
  const [workspaceView, setWorkspaceView] = useState<AccompanimentWorkspaceView>("planning");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [planningNotes, setPlanningNotes] = useState("");
  const [suggestion, setSuggestion] = useState<PlanningSuggestion | null>(null);
  const [confirmedKey, setConfirmedKey] = useState("");
  const [confirmedSteps, setConfirmedSteps] = useState<PlanningStep[]>([]);
  const [editingPlanId, setEditingPlanId] = useState("");
  const [plans, setPlans] = useState<ObstetricPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [occurrences, setOccurrences] = useState<FollowupOccurrence[]>([]);
  const [selectedOccurrenceId, setSelectedOccurrenceId] = useState("");
  const [individualPlanned, setIndividualPlanned] = useState("");
  const [individualEvolution, setIndividualEvolution] = useState("");
  const [individualObservation, setIndividualObservation] = useState("");
  const [reportExams, setReportExams] = useState("");
  const [reportExplanation, setReportExplanation] = useState("");
  const [patientObservations, setPatientObservations] = useState("");
  const [privateDraft, setPrivateDraft] = useState("");
  const [integralPreview, setIntegralPreview] = useState<PreviewState | null>(null);
  const [individualPreview, setIndividualPreview] = useState<PreviewState | null>(null);
  const [integralModalOpen, setIntegralModalOpen] = useState(false);
  const [individualModalOpen, setIndividualModalOpen] = useState(false);
  const [individualEditorOpen, setIndividualEditorOpen] = useState(false);
  const [individualBaseline, setIndividualBaseline] = useState("");
  const [pendingIndividualAction, setPendingIndividualAction] = useState<PendingIndividualAction>(null);
  const [releaseIntegralOnSave, setReleaseIntegralOnSave] = useState(false);
  const [releaseIndividualOnSave, setReleaseIndividualOnSave] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [scheduleAvailabilityNote, setScheduleAvailabilityNote] = useState("");
  const [historyShortcutActive, setHistoryShortcutActive] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historyTypeFilter, setHistoryTypeFilter] = useState<"all" | PlanningKind>("all");
  const [expandedHistoryPlanId, setExpandedHistoryPlanId] = useState("");
  const [historyTimeline, setHistoryTimeline] = useState<Record<string, HistoryTimelineEvent[]>>({});
  const [historyTimelineLoading, setHistoryTimelineLoading] = useState("");
  const [draftReadyFor, setDraftReadyFor] = useState("");
  const [newPlanModalOpen, setNewPlanModalOpen] = useState(false);
  const [newPlanPassport, setNewPlanPassport] = useState("");
  const [formManagerModalOpen, setFormManagerModalOpen] = useState(false);
  const [formManagerPassport, setFormManagerPassport] = useState("");
  const restoredDraftFor = useRef("");
  const lastDraftSnapshot = useRef("");

  const doctorName = profile.systemName || profile.characterName || "";
  const scheduleKey = planningKey(planType, startDate, endDate);
  const scheduleConfirmed = Boolean(confirmedKey && confirmedKey === scheduleKey && confirmedSteps.length);
  const manageablePlans = useMemo(() => plans.filter((plan) => canManageReproductivePlan(profile.role, profile.specialty, plan.plan_type)), [plans, profile.role, profile.specialty]);
  const contextPlans = useMemo(() => manageablePlans.filter((plan) => plan.plan_type === planType), [manageablePlans, planType]);
  const filteredHistoryPlans = useMemo(() => {
    const query = historySearch.trim().toLocaleLowerCase("pt-BR");
    return manageablePlans.filter((plan) => {
      if (historyTypeFilter !== "all" && plan.plan_type !== historyTypeFilter) return false;
      if (!query) return true;
      return [plan.patient_name, plan.patient_passport, plan.start_date, plan.end_date || "", planTypeLabel(plan.plan_type)]
        .some((value) => String(value || "").toLocaleLowerCase("pt-BR").includes(query));
    });
  }, [manageablePlans, historySearch, historyTypeFilter]);
  const editingPlan = manageablePlans.find((plan) => plan.id === editingPlanId) || null;
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) || null;
  const selectedOccurrence = occurrences.find((occurrence) => occurrence.id === selectedOccurrenceId) || null;
  const selectedOccurrenceIndex = selectedOccurrence ? occurrences.findIndex((occurrence) => occurrence.id === selectedOccurrence.id) : -1;
  const previousOccurrence = selectedOccurrenceIndex > 0 ? occurrences[selectedOccurrenceIndex - 1] : null;
  const nextOccurrence = selectedOccurrenceIndex >= 0 && selectedOccurrenceIndex < occurrences.length - 1 ? occurrences[selectedOccurrenceIndex + 1] : null;
  const confirmedAdvisories = useMemo(() => scheduleConfirmed ? planningAdvisories(planType, confirmedSteps, startDate, endDate) : [], [scheduleConfirmed, planType, confirmedSteps, startDate, endDate]);
  const summaryNextStep = useMemo(() => {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
    const get = (type: string) => parts.find((part) => part.type === type)?.value || "";
    const today = `${get("year")}-${get("month")}-${get("day")}`;
    return [...confirmedSteps].filter((step) => Boolean(step.date)).sort((a, b) => a.date.localeCompare(b.date)).find((step) => step.date >= today) || null;
  }, [confirmedSteps]);
  const summaryFinalReference = useMemo(() => {
    if (planType === "in_vitro") {
      return confirmedSteps.find((step) => step.number === 5)?.date || confirmedSteps[confirmedSteps.length - 1]?.date || endDate;
    }
    return endDate;
  }, [planType, confirmedSteps, endDate]);
  const currentIntegralSignature = useMemo(() => JSON.stringify({ planType, startDate, endDate, patient: selectedPatient?.passport || "", doctorName, planningNotes, confirmedSteps, editingPlanId }), [planType, startDate, endDate, selectedPatient?.passport, doctorName, planningNotes, confirmedSteps, editingPlanId]);
  const readyIntegralPreview = integralPreview?.signature === currentIntegralSignature ? integralPreview : null;

  const individualStep = useMemo(() => {
    if (!selectedPlan || !selectedOccurrence) return null;
    const stepNumber = selectedOccurrence.step_number || 0;
    const fromPlan = normalizePlanningSteps(selectedPlan.plan_type, selectedPlan.consultation_schedule || []).find((step) => step.number === stepNumber);
    if (!fromPlan) return null;
    return {
      ...fromPlan,
      date: selectedOccurrence.planned_date || fromPlan.date,
      marker: selectedOccurrence.rp_marker || fromPlan.marker,
      title: selectedOccurrence.step_title || fromPlan.title,
      planned_text: individualPlanned,
      description: individualPlanned,
    } as PlanningStep;
  }, [selectedPlan, selectedOccurrence, individualPlanned]);

  const individualSignature = useMemo(() => JSON.stringify({ plan: selectedPlanId, occurrence: selectedOccurrenceId, individualStep, individualEvolution, individualObservation, reportExams, reportExplanation, patientObservations, doctorName }), [selectedPlanId, selectedOccurrenceId, individualStep, individualEvolution, individualObservation, reportExams, reportExplanation, patientObservations, doctorName]);
  const readyIndividualPreview = individualPreview?.signature === individualSignature ? individualPreview : null;
  const individualFormSnapshot = useMemo(() => JSON.stringify({
    planned: individualPlanned,
    evolution: individualEvolution,
    observation: individualObservation,
    exams: reportExams,
    explanation: reportExplanation,
    patientObservations,
    privateDraft,
  }), [individualPlanned, individualEvolution, individualObservation, reportExams, reportExplanation, patientObservations, privateDraft]);
  const individualDirty = Boolean(selectedOccurrence && individualBaseline && individualFormSnapshot !== individualBaseline);

  const draft = useMemo<ObstetricPlanningDraft>(() => ({
    version: 2,
    selectedPassport,
    planType,
    startDate,
    endDate,
    planningNotes,
    editingPlanId,
    confirmedKey: scheduleConfirmed ? confirmedKey : "",
    confirmedSteps: scheduleConfirmed ? confirmedSteps : [],
  }), [selectedPassport, planType, startDate, endDate, planningNotes, editingPlanId, confirmedKey, confirmedSteps, scheduleConfirmed]);
  const draftSnapshot = useMemo(() => JSON.stringify(draft), [draft]);

  useEffect(() => {
    const doctorId = profile.id;
    if (!doctorId || loading || restoredDraftFor.current === doctorId) return;
    restoredDraftFor.current = doctorId;
    try {
      const saved = parseObstetricDraft(sessionStorage.getItem(obstetricDraftKey(doctorId)));
      if (saved) {
        setPlanType(canManageReproductivePlan(profile.role, profile.specialty, saved.planType) ? saved.planType : (canManageReproductivePlan(profile.role, profile.specialty, "gestacional") ? "gestacional" : "in_vitro"));
        setStartDate(saved.startDate);
        setEndDate(saved.endDate);
        setPlanningNotes(saved.planningNotes);
        setEditingPlanId(saved.editingPlanId);
        setConfirmedKey(saved.confirmedKey);
        setConfirmedSteps(saved.confirmedSteps);
        const shortcutPassport = new URLSearchParams(window.location.search).get("patient");
        if (!shortcutPassport && saved.selectedPassport !== selectedPassport) selectPatient(saved.selectedPassport);
      }
    } catch { /* armazenamento é opcional */ }
    setDraftReadyFor(doctorId);
  }, [profile.id, loading, selectPatient, selectedPassport]);

  useEffect(() => {
    if (!profile.id || draftReadyFor !== profile.id || lastDraftSnapshot.current === draftSnapshot) return;
    try {
      if (draft.selectedPassport || draft.startDate || draft.endDate || draft.planningNotes || draft.editingPlanId || draft.confirmedSteps.length || draft.planType !== "gestacional") {
        sessionStorage.setItem(obstetricDraftKey(profile.id), draftSnapshot);
      } else sessionStorage.removeItem(obstetricDraftKey(profile.id));
      lastDraftSnapshot.current = draftSnapshot;
    } catch { /* armazenamento é opcional */ }
  }, [profile.id, draftReadyFor, draft, draftSnapshot]);

  useEffect(() => {
    const lock = integralModalOpen || individualModalOpen || individualEditorOpen || formManagerModalOpen || newPlanModalOpen;
    if (!lock) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [integralModalOpen, individualModalOpen, individualEditorOpen, formManagerModalOpen, newPlanModalOpen]);

  useEffect(() => {
    if (!message && !error) return;
    const timeout = window.setTimeout(() => {
      setMessage("");
      setError("");
    }, error ? 9000 : 6000);
    return () => window.clearTimeout(timeout);
  }, [message, error]);

  function invalidateSchedule() {
    setSuggestion(null);
    setScheduleAvailabilityNote("");
    setConfirmedKey("");
    setConfirmedSteps([]);
    setIntegralPreview(null);
  }

  function openNewPlanningModal() {
    setNewPlanPassport(selectedPassport || selectedPatient?.passport || "");
    setNewPlanModalOpen(true);
  }

  function openFormManagerModal() {
    setFormManagerPassport(selectedPassport || selectedPatient?.passport || "");
    setFormManagerModalOpen(true);
  }

  async function confirmNewPlanningSetup() {
    if (!newPlanPassport) {
      setError("Selecione a paciente que receberá o novo planejamento.");
      return;
    }
    await switchPlanningPatient(newPlanPassport, true);
    setNewPlanModalOpen(false);
    setMessage("Novo planejamento iniciado para a paciente selecionada.");
  }

  /** Trocar paciente inicia um novo formulário; nunca transfere um plano existente. */
  async function switchPlanningPatient(nextPassport: string, startNew = false) {
    if (busy || (!startNew && nextPassport === selectedPassport)) return;
    const hasDraft = Boolean(editingPlanId || startDate || endDate || planningNotes.trim() || confirmedSteps.length);
    if (hasDraft && !(await hpsrConfirm(
      "Trocar de paciente ou iniciar outro planejamento? As alterações não salvas neste formulário serão descartadas. Os planejamentos já salvos continuarão no histórico.",
      "Trocar paciente"
    ))) return;

    if (nextPassport !== selectedPassport) selectPatient(nextPassport);
    setEditingPlanId("");
    setStartDate("");
    setEndDate("");
    setPlanningNotes("");
    setSuggestion(null);
    setScheduleAvailabilityNote("");
    setConfirmedKey("");
    setConfirmedSteps([]);
    setIntegralPreview(null);
    setIntegralModalOpen(false);
    setReleaseIntegralOnSave(false);
    setSelectedPlanId("");
    setOccurrences([]);
    setSelectedOccurrenceId("");
    setIndividualPlanned("");
    setIndividualEvolution("");
    setIndividualObservation("");
    setReportExams(""); setReportExplanation(""); setPatientObservations(""); setPrivateDraft("");
    setIndividualPreview(null);
    setIndividualModalOpen(false);
    setReleaseIndividualOnSave(false);
    setError("");
    setMessage(startNew ? "Novo planejamento iniciado." : "Paciente alterado. Comece um novo planejamento para o paciente selecionado.");
  }

  function changePlanType(next: PlanningKind) {
    if (!canManageReproductivePlan(profile.role, profile.specialty, next)) return;
    if (next === planType) { setWorkspaceView("planning"); return; }
    setWorkspaceView("planning");
    setPlanType(next);
    setEditingPlanId("");
    setStartDate("");
    setEndDate("");
    setPlanningNotes("");
    setSelectedPlanId("");
    setOccurrences([]);
    setSelectedOccurrenceId("");
    setHistorySearch("");
    invalidateSchedule();
    setError("");
    setMessage("");
  }

  function showPlanningView() {
    setWorkspaceView("planning");
  }

  function showVaccinationView() {
    setPlanType("gestacional");
    setWorkspaceView("vaccination");
    setIntegralModalOpen(false);
    setIndividualModalOpen(false);
  }

  function changeStartDate(value: string) {
    setStartDate(value);
    setSuggestion(null);
    setScheduleAvailabilityNote("");
    setConfirmedKey(confirmedSteps.length ? planningKey(planType, value, endDate) : "");
    setIntegralPreview(null);
  }

  function changeEndDate(value: string) {
    setEndDate(value);
    setSuggestion(null);
    setScheduleAvailabilityNote("");
    setConfirmedKey(confirmedSteps.length ? planningKey(planType, startDate, value) : "");
    setIntegralPreview(null);
  }

  async function loadScheduleAvailabilityAdvisory(next: PlanningSuggestion) {
    if (!profile.id || !next.valid || !next.candidateDates.length) return "";
    const client = createClient();
    if (!client) return "";
    const firstDate = next.candidateDates[0];
    const lastDate = next.candidateDates[next.candidateDates.length - 1];
    const { data, error: availabilityError } = await client.from("clinical_appointment_slots")
      .select("starts_at,specialty,status")
      .eq("doctor_id", profile.id)
      .gte("starts_at", `${firstDate}T00:00:00-03:00`)
      .lte("starts_at", `${lastDate}T23:59:59-03:00`)
      .limit(500);
    if (availabilityError) return "Não foi possível conferir a agenda publicada agora. O cronograma clínico continua válido e o Agendamento permanece independente.";

    const relevant = (data || []).filter((slot) => linkMatchesPlan(next.kind, String(slot.specialty || "")) && ["Disponível", "Ocupado"].includes(String(slot.status || "")));
    if (!relevant.length) return `Não há agenda publicada para ${specialtyForPlan(next.kind)} no período consultado. O planejamento foi mantido em ${next.targetWeekdayLabel}; o agendamento ficará pendente até existir horário compatível.`;

    const civilDate = (value: string) => {
      const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(value));
      const get = (type: string) => parts.find((part) => part.type === type)?.value || "";
      return `${get("year")}-${get("month")}-${get("day")}`;
    };
    const weekday = (value: string) => new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long" }).format(new Date(value));
    const publishedDates = new Set(relevant.map((slot) => civilDate(String(slot.starts_at || ""))));
    const publishedWeekdays = [...new Set(relevant.map((slot) => weekday(String(slot.starts_at || ""))))];
    const matchingCount = next.candidateDates.filter((date) => publishedDates.has(date)).length;
    if (matchingCount === next.candidateDates.length) return `A agenda publicada possui horários nas ${next.candidateDates.length} datas sugeridas em ${next.targetWeekdayLabel}. O vínculo com o Agendamento continua sendo feito separadamente.`;
    if (!matchingCount) return `Cronograma clínico em ${next.targetWeekdayLabel}. A agenda publicada no período está em ${publishedWeekdays.join(", ")}; nenhuma das datas sugeridas coincide com a agenda atual. Isso é apenas um aviso e não altera o planejamento.`;
    return `${matchingCount} de ${next.candidateDates.length} datas sugeridas em ${next.targetWeekdayLabel} possuem agenda publicada no período. As demais continuam como planejamento e poderão ser agendadas quando houver horário compatível.`;
  }

  async function handleSuggestSchedule() {
    setError("");
    setMessage("");
    setScheduleAvailabilityNote("");
    if (confirmedSteps.length && !(await hpsrConfirm("Uma nova sugestão poderá substituir o cronograma que você já personalizou. Deseja continuar?", "Substituir cronograma"))) return;
    const next = createPlanningSuggestion(planType, startDate, endDate);
    setSuggestion(next);
    setConfirmedKey("");
    setConfirmedSteps([]);
    setIntegralPreview(null);
    if (!next.valid) { setError(next.warning); return; }
    setMessage(next.warning || "Sugestão gerada. A médica pode confirmar ou ajustar livremente as datas depois.");
    setScheduleAvailabilityNote(await loadScheduleAvailabilityAdvisory(next));
  }

  function confirmSuggestion() {
    if (!suggestion || suggestion.key !== scheduleKey || !suggestion.valid) return;
    setConfirmedKey(scheduleKey);
    setConfirmedSteps((suggestion.steps.length ? suggestion.steps : [newPlanningStep(planType, 0, startDate)]).map((step) => ({ ...step })));
    setIntegralPreview(null);
    setMessage("Sugestão confirmada. As datas continuam editáveis e a decisão final é da médica.");
    setError("");
  }

  function updateConfirmedStep(index: number, patch: Partial<PlanningStep>) {
    setConfirmedSteps((current) => current.map((step, currentIndex) => currentIndex === index ? { ...step, ...patch, description: patch.planned_text ?? patch.description ?? step.description } : step));
    setIntegralPreview(null);
  }

  function addConfirmedStep() {
    setConfirmedSteps((current) => {
      const previousDate = current[current.length - 1]?.date || startDate;
      const proposedDate = previousDate ? new Date(`${previousDate}T12:00:00Z`) : null;
      if (proposedDate) proposedDate.setUTCDate(proposedDate.getUTCDate() + 7);
      return renumberPlanningSteps(planType, [...current, newPlanningStep(planType, current.length, proposedDate ? proposedDate.toISOString().slice(0, 10) : "")]);
    });
    setIntegralPreview(null);
  }

  function removeConfirmedStep(index: number) {
    setConfirmedSteps((current) => renumberPlanningSteps(planType, current.filter((_, currentIndex) => currentIndex !== index)));
    setIntegralPreview(null);
  }

  async function hasRequiredPatientLink(kind: PlanningKind, passport: string) {
    const client = createClient();
    if (!client || !profile.id || !canManageReproductivePlan(profile.role, profile.specialty, kind)) return false;
    const { data, error: linkError } = await client.from("patient_doctor_links").select("specialty").eq("doctor_id", profile.id).eq("patient_passport", passport);
    if (linkError) throw linkError;
    return (data || []).some((link) => linkMatchesPlan(kind, String(link.specialty || "")));
  }

  async function loadHistory(preselectId?: string) {
    if (!profile.id) return;
    const client = createClient();
    if (!client) return;
    const { data, error: historyError } = await client.from("clinical_followup_plans")
      .select("id,doctor_id,doctor_name,patient_name,patient_passport,specialty,start_date,end_date,planning_notes,consultation_schedule,portal_released_at,total_consultations,status,created_at,plan_type,schedule_confirmed_at,planning_document_path,planning_released_document_path,planning_released_snapshot,planning_document_versions")
      .eq("doctor_id", profile.id).in("plan_type", ["gestacional", "in_vitro"]).order("created_at", { ascending: false }).limit(50);
    if (historyError) {
      setError(historyError.message);
      return;
    }
    const normalized = (data || []).map((plan) => ({ ...plan, consultation_schedule: normalizePlanningSteps(plan.plan_type as PlanningKind, plan.consultation_schedule) })) as ObstetricPlan[];
    setPlans(normalized);
    if (preselectId) setSelectedPlanId(preselectId);
  }

  async function loadOccurrences(planId: string) {
    if (!planId || !profile.id) { setOccurrences([]); return [] as FollowupOccurrence[]; }
    const client = createClient();
    if (!client) return [] as FollowupOccurrence[];
    const { data, error: occurrenceError } = await client.from("clinical_followup_occurrences")
      .select("id,plan_id,doctor_id,patient_name,patient_passport,specialty,planned_date,status,appointment_id,slot_id,step_number,rp_marker,step_title,planned_text,evolution_text,medical_observation_text,conduct_text,followup_report,individual_document_path,individual_released_document_path,individual_released_snapshot,individual_document_versions,individual_released_at")
      .eq("plan_id", planId).eq("doctor_id", profile.id).order("step_number", { ascending: true }).order("planned_date", { ascending: true });
    if (occurrenceError) { setError(occurrenceError.message); return [] as FollowupOccurrence[]; }
    const rows = (data || []) as FollowupOccurrence[];
    setOccurrences(rows);
    return rows;
  }

  useEffect(() => { void loadHistory(); }, [profile.id]);
  useEffect(() => { void loadOccurrences(selectedPlanId); setSelectedOccurrenceId(""); setIndividualPreview(null); }, [selectedPlanId]);

  async function generateIntegralPreview() {
    setError(""); setMessage("");
    if (!selectedPatient || !profile.id || !doctorName) return setError("Selecione uma paciente e confirme o médico responsável.");
    if (!canManageReproductivePlan(profile.role, profile.specialty, planType)) return setError("Seu perfil não possui autorização para esta modalidade.");
    if (!scheduleConfirmed) return setError("Gere e confirme a sugestão de cronograma antes da prévia.");
    const reason = validatePlanningSteps(planType, confirmedSteps, startDate, endDate);
    if (reason) return setError(reason);
    setBusy(true);
    try {
      const canvas = await renderIntegralPlanningCanvas({ kind: planType, patient: selectedPatient.name, passport: selectedPatient.passport, doctor: doctorName, steps: confirmedSteps, referenceDate: endDate });
      setIntegralPreview({ canvas, signature: currentIntegralSignature });
      setReleaseIntegralOnSave(false);
      setIntegralModalOpen(true);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível gerar a prévia integral."); }
    finally { setBusy(false); }
  }

  async function syncOccurrences(client: NonNullable<ReturnType<typeof createClient>>, planId: string, kind: PlanningKind, patient: { name: string; passport: string }, steps: PlanningStep[]) {
    const specialty = specialtyForPlan(kind);
    const { data: existing, error: existingError } = await client.from("clinical_followup_occurrences")
      .select("id,step_number,appointment_id,slot_id,planned_date,planned_text,evolution_text,medical_observation_text,conduct_text,followup_report,individual_document_path,individual_released_document_path,individual_released_at,individual_released_snapshot,individual_document_versions").eq("plan_id", planId).eq("doctor_id", profile.id);
    if (existingError) throw existingError;
    const byStep = new Map((existing || []).filter((item) => item.step_number).map((item) => [Number(item.step_number), item]));
    const incomingNumbers = new Set(steps.map((step) => step.number));
    const removable = (existing || []).filter((current) => {
      const stepNumber = Number(current.step_number || 0);
      if (!stepNumber || incomingNumbers.has(stepNumber)) return false;
      const report = current.followup_report && typeof current.followup_report === "object" ? current.followup_report as Record<string, unknown> : {};
      const hasReport = Object.values(report).some((value) => typeof value === "string" ? value.trim() : Boolean(value));
      if (current.appointment_id || current.slot_id || current.planned_text || current.evolution_text || current.medical_observation_text || current.conduct_text || hasReport || current.individual_document_path || current.individual_released_document_path || current.individual_released_at || current.individual_released_snapshot) {
        throw new Error(`A consulta/etapa ${stepNumber} possui dados, documento, liberação ou agendamento e não pode ser removida automaticamente. Abra o registro e ajuste-o antes.`);
      }
      return true;
    });

    await Promise.all(removable.map(async (current) => {
      const stepNumber = Number(current.step_number || 0);
      const { data: deleted, error: deleteError } = await client.from("clinical_followup_occurrences").delete().eq("id", current.id).eq("doctor_id", profile.id).select("id").maybeSingle();
      if (deleteError) throw deleteError;
      if (!deleted?.id) throw new Error(`A consulta/etapa ${stepNumber} não pôde ser removida. Verifique sua autorização clínica e tente novamente.`);
    }));

    await Promise.all(steps.map(async (step) => {
      const current = byStep.get(step.number);
      const payload = {
        plan_id: planId,
        doctor_id: profile.id,
        patient_passport: patient.passport,
        patient_name: patient.name,
        specialty,
        planned_date: step.date,
        step_number: step.number,
        rp_marker: step.marker,
        step_title: step.title,
        planned_text: step.planned_text || step.description || "",
        updated_at: new Date().toISOString(),
      };
      if (current) {
        if (current.appointment_id && current.planned_date && current.planned_date !== step.date) {
          throw new Error(`A consulta ${step.number} já possui agendamento vinculado em ${formatDate(current.planned_date)}. Ajuste o agendamento antes de alterar a data planejada.`);
        }
        const { data: updated, error: updateError } = await client.from("clinical_followup_occurrences")
          .update(payload).eq("id", current.id).eq("doctor_id", profile.id).select("id").maybeSingle();
        if (updateError) throw updateError;
        if (!updated?.id) throw new Error(`A consulta/etapa ${step.number} não foi atualizada. Verifique o vínculo clínico e sua autorização para esta modalidade.`);
      } else {
        const { data: inserted, error: insertError } = await client.from("clinical_followup_occurrences").insert({ ...payload, status: "Planejada" }).select("id").maybeSingle();
        if (insertError) throw insertError;
        if (!inserted?.id) throw new Error(`A consulta/etapa ${step.number} não foi criada. Verifique o vínculo clínico e sua autorização para esta modalidade.`);
      }
    }));
  }

  async function saveIntegralPlan() {
    if (!readyIntegralPreview || !selectedPatient || !profile.id) return setError("Gere e confira a prévia atual antes de salvar.");
    if (!canManageReproductivePlan(profile.role, profile.specialty, planType)) return setError("Seu perfil não possui autorização para esta modalidade.");
    const reason = validatePlanningSteps(planType, confirmedSteps, startDate, endDate);
    if (reason) return setError(reason);
    setBusy(true); setError(""); setMessage("");
    const client = createClient();
    if (!client) { setBusy(false); return setError("Supabase não configurado."); }
    let createdId = "";
    try {
      if (!(await hasRequiredPatientLink(planType, selectedPatient.passport))) throw new Error(`É necessário existir um vínculo ativo de ${planType === "in_vitro" ? "Ginecologia" : "Obstetrícia"} entre esta paciente e a médica antes de criar o planejamento.`);
      const previous = editingPlanId ? plans.find((plan) => plan.id === editingPlanId) : undefined;
      if (editingPlanId && (!previous || previous.patient_passport !== selectedPatient.passport || previous.plan_type !== planType)) throw new Error("A edição deve manter a paciente e a modalidade do planejamento original.");
      const now = new Date().toISOString();
      const payload = {
        doctor_id: profile.id,
        doctor_name: doctorName,
        patient_passport: selectedPatient.passport,
        patient_name: selectedPatient.name,
        specialty: specialtyForPlan(planType),
        plan_type: planType,
        frequency: "Personalizada",
        interval_days: 7,
        start_date: startDate,
        end_date: endDate,
        planning_notes: planningNotes.trim() || null,
        consultation_schedule: confirmedSteps.map((step) => ({ ...step, description: step.planned_text || step.description || "" })),
        total_consultations: confirmedSteps.length,
        total_weeks: planType === "in_vitro" ? 5 : 40,
        schedule_confirmed_at: now,
        status: previous?.status || "Ativo",
        updated_at: now,
      };
      let planId = editingPlanId;
      if (!planId) {
        const { data, error: insertError } = await client.from("clinical_followup_plans").insert(payload).select("id").single();
        if (insertError || !data?.id) throw insertError || new Error("Falha ao criar o planejamento.");
        planId = data.id;
        createdId = planId;
      }

      // v1.1.11: o PNG continua disponível como prévia local, mas o salvamento é estruturado.
      // Salvar nunca republica automaticamente: o snapshot do Portal só muda quando
      // a médica ativa explicitamente a liberação nesta prévia.
      const versions = previous?.planning_document_versions || [];
      const archived = previous
        ? [...versions, { ...(previous.planning_document_path ? { path: previous.planning_document_path } : {}), at: now, start_date: previous.start_date,
            end_date: previous.end_date, consultation_schedule: previous.consultation_schedule || [],
            planning_notes: previous.planning_notes }]
        : [...versions];
      if (releaseIntegralOnSave && previous?.portal_released_at && previous.planning_released_snapshot) {
        archived.push({ at: now, released_snapshot: previous.planning_released_snapshot });
      }
      const snapshot = { patient_name: selectedPatient.name, patient_passport: selectedPatient.passport,
        doctor_name: doctorName, specialty: specialtyForPlan(planType), start_date: startDate,
        end_date: endDate, planning_notes: null, consultation_schedule: confirmedSteps,
        total_consultations: confirmedSteps.length, plan_type: planType };
      const { data: savedPlan, error: updateError } = await client.from("clinical_followup_plans").update({
        ...payload, planning_document_path: null, planning_document_versions: archived,
        ...(releaseIntegralOnSave ? {
          portal_released_at: previous?.portal_released_at || now,
          planning_released_document_path: null,
          planning_released_snapshot: snapshot,
        } : {}),
      }).eq("id", planId).eq("doctor_id", profile.id)
        .select("id,portal_released_at,planning_released_snapshot").maybeSingle();
      if (updateError) throw updateError;
      if (!savedPlan?.id) throw new Error("O planejamento não foi salvo. Verifique o vínculo clínico, sua especialidade e tente novamente.");
      if (releaseIntegralOnSave && (!savedPlan.portal_released_at || !savedPlan.planning_released_snapshot)) {
        throw new Error("O planejamento foi atualizado, mas a liberação para a paciente não foi confirmada. Confira o histórico antes de repetir a operação.");
      }
      await syncOccurrences(client, planId, planType, selectedPatient, confirmedSteps);

      setIntegralModalOpen(false);
      setReleaseIntegralOnSave(false);
      setEditingPlanId(planId);
      setSelectedPlanId(planId);
      setMessage(releaseIntegralOnSave
        ? "Planejamento salvo e nova versão liberada para a paciente."
        : previous?.portal_released_at
          ? "Planejamento salvo. A paciente continua vendo a última versão explicitamente liberada."
          : "Planejamento salvo. A liberação para a paciente permanece independente.");
      try { sessionStorage.removeItem(obstetricDraftKey(profile.id)); } catch { /* opcional */ }
      await Promise.all([loadHistory(planId), loadOccurrences(planId)]);
    } catch (caught) {
      if (createdId) await client.from("clinical_followup_plans").delete().eq("id", createdId).eq("doctor_id", profile.id);
      setError(caught instanceof Error ? caught.message : "Não foi possível salvar o planejamento.");
    } finally { setBusy(false); }
  }

  async function toggleHistoryTimeline(plan: ObstetricPlan) {
    if (expandedHistoryPlanId === plan.id) {
      setExpandedHistoryPlanId("");
      return;
    }
    setExpandedHistoryPlanId(plan.id);
    if (historyTimeline[plan.id]) return;
    setHistoryTimelineLoading(plan.id);
    try {
      const client = createClient();
      if (!client) return;
      const formType = plan.plan_type === "in_vitro" ? "ivf_ropa" : "gestational";
      const [formsResult, occurrencesResult] = await Promise.all([
        client.from("followup_intake_forms").select("status,requested_at,submitted_at,reviewed_at").eq("patient_passport", plan.patient_passport).eq("form_type", formType).order("requested_at", { ascending: true }),
        client.from("clinical_followup_occurrences").select("step_number,individual_document_versions,individual_released_at").eq("plan_id", plan.id).eq("doctor_id", profile.id).order("step_number", { ascending: true }),
      ]);
      const events: HistoryTimelineEvent[] = [{ at: plan.created_at, title: "Planejamento criado", detail: `${planTypeLabel(plan.plan_type)} · ${plan.patient_name}` }];
      (plan.planning_document_versions || []).forEach((version) => {
        if (version?.at) events.push({ at: version.at, title: "Planejamento integral atualizado", detail: "Uma versão anterior foi preservada no histórico." });
      });
      if (plan.portal_released_at) events.push({ at: plan.portal_released_at, title: "Planejamento integral liberado", detail: "Versão disponibilizada no Portal do Paciente." });
      (formsResult.data || []).forEach((form: any) => {
        if (form.requested_at) events.push({ at: form.requested_at, title: "Ficha solicitada", detail: "Formulário liberado para preenchimento da paciente." });
        if (form.submitted_at) events.push({ at: form.submitted_at, title: "Ficha enviada pela paciente", detail: "Respostas recebidas pela equipe médica." });
        if (form.reviewed_at) events.push({ at: form.reviewed_at, title: "Ficha analisada", detail: "A equipe médica concluiu a análise desta versão." });
      });
      (occurrencesResult.data || []).forEach((occurrence: any) => {
        const label = plan.plan_type === "in_vitro" ? `Etapa ${occurrence.step_number || "—"}` : `Consulta ${occurrence.step_number || "—"}`;
        (Array.isArray(occurrence.individual_document_versions) ? occurrence.individual_document_versions : []).forEach((version: any) => {
          if (version?.at) events.push({ at: version.at, title: `${label} atualizada`, detail: "Edição individual registrada." });
        });
        if (occurrence.individual_released_at) events.push({ at: occurrence.individual_released_at, title: `${label} liberada`, detail: "Versão individual disponibilizada no Portal do Paciente." });
      });
      events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
      setHistoryTimeline((current) => ({ ...current, [plan.id]: events }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar a linha do tempo do planejamento.");
    } finally {
      setHistoryTimelineLoading("");
    }
  }

  function goToPlanningHistory() {
    setHistoryShortcutActive(true);
    document.getElementById("acompanhamento-historico")?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => setHistoryShortcutActive(false), 1400);
  }

  function beginEditing(plan: ObstetricPlan) {
    selectPatient(plan.patient_passport);
    setPlanType(plan.plan_type);
    setStartDate(plan.start_date);
    setEndDate(plan.end_date || "");
    setPlanningNotes(plan.planning_notes || "");
    const steps = normalizePlanningSteps(plan.plan_type, plan.consultation_schedule || []);
    const key = planningKey(plan.plan_type, plan.start_date, plan.end_date || "");
    setSuggestion(null);
    setConfirmedKey(key);
    setConfirmedSteps(steps);
    setEditingPlanId(plan.id);
    setSelectedPlanId(plan.id);
    setIntegralPreview(null);
    setMessage("Planejamento carregado para edição. As alterações só chegam à paciente após nova liberação.");
    setError("");
    window.setTimeout(() => document.getElementById("acompanhamento-dados")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  async function releaseCurrentIntegral(plan: ObstetricPlan) {
    if (!profile.id) return;
    if (!canManageReproductivePlan(profile.role, profile.specialty, plan.plan_type)) return setError("Seu perfil não possui autorização clínica para esta modalidade.");
    if (!(await hasRequiredPatientLink(plan.plan_type, plan.patient_passport))) return setError("O vínculo médico-paciente da especialidade não está ativo. Regularize o vínculo antes de liberar.");
    if (!(await hpsrConfirm(`Liberar a versão integral atual de ${plan.patient_name} para a paciente?`, "Liberar planejamento integral"))) return;
    const client = createClient();
    if (!client) return;
    setBusy(true); setError("");
    try {
      const now = new Date().toISOString();
      const snapshot = { patient_name: plan.patient_name, patient_passport: plan.patient_passport, doctor_name: plan.doctor_name, specialty: plan.specialty, start_date: plan.start_date, end_date: plan.end_date, planning_notes: null, consultation_schedule: plan.consultation_schedule, total_consultations: plan.total_consultations, plan_type: plan.plan_type };
      const versions = [...(plan.planning_document_versions || [])];
      if (plan.portal_released_at && plan.planning_released_snapshot) {
        versions.push({ at: now, released_snapshot: plan.planning_released_snapshot });
      }
      const { data: releasedPlan, error: releaseError } = await client.from("clinical_followup_plans").update({
        portal_released_at: plan.portal_released_at || now,
        planning_released_document_path: null,
        planning_released_snapshot: snapshot,
        planning_document_versions: versions,
      }).eq("id", plan.id).eq("doctor_id", profile.id)
        .select("id,portal_released_at,planning_released_snapshot").maybeSingle();
      if (releaseError) throw releaseError;
      if (!releasedPlan?.id || !releasedPlan.portal_released_at || !releasedPlan.planning_released_snapshot) throw new Error("A liberação não foi confirmada pelo sistema. Verifique sua autorização clínica e tente novamente.");
      setMessage("Planejamento integral dinâmico liberado para a paciente.");
      await loadHistory(plan.id);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível liberar o planejamento."); }
    finally { setBusy(false); }
  }

  async function openStoredDocument(path: string | null) {
    if (!path) return setError("Este registro ainda não possui PNG armazenado.");
    const client = createClient();
    if (!client) return;
    const { data, error: signedError } = await client.storage.from("obstetric-plans").createSignedUrl(path, 300);
    if (signedError || !data?.signedUrl) return setError("Não foi possível abrir o documento armazenado.");
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function deletePlan(plan: ObstetricPlan) {
    if (!(await hpsrConfirm(`Excluir o planejamento ${planTypeLabel(plan.plan_type)} de ${plan.patient_name}? Consultas já realizadas permanecem no histórico clínico.`, "Excluir planejamento"))) return;
    const client = createClient();
    if (!client) return;
    setBusy(true); setError("");
    try {
      const { error: rpcError } = await client.rpc("delete_clinical_followup_plan", { p_plan_id: plan.id });
      if (rpcError) throw rpcError;
      setSelectedPlanId("");
      setMessage("Planejamento removido. O vínculo médico-paciente não foi alterado.");
      await loadHistory();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível excluir o planejamento."); }
    finally { setBusy(false); }
  }

  function consolidatedEvolution(occurrence: FollowupOccurrence) {
    return [
      occurrence.evolution_text || "",
      occurrence.followup_report?.patient_observations ? `Observações: ${occurrence.followup_report.patient_observations}` : "",
    ].filter(Boolean).join("\n");
  }

  function consolidatedExamSummary(occurrence: FollowupOccurrence) {
    return [
      occurrence.followup_report?.exams_performed || "",
      occurrence.followup_report?.exam_explanation ? `Resultados: ${occurrence.followup_report.exam_explanation}` : "",
    ].filter(Boolean).join("\n");
  }

  function consolidatedInternalNote(occurrence: FollowupOccurrence) {
    return [
      occurrence.medical_observation_text || "",
      occurrence.followup_report?.private_draft ? `Rascunho anterior: ${occurrence.followup_report.private_draft}` : "",
    ].filter(Boolean).join("\n");
  }

  function occurrenceEditorSnapshot(occurrence: FollowupOccurrence) {
    return JSON.stringify({
      planned: occurrence.planned_text || "",
      evolution: consolidatedEvolution(occurrence),
      observation: consolidatedInternalNote(occurrence),
      exams: consolidatedExamSummary(occurrence),
      explanation: "",
      patientObservations: "",
      privateDraft: "",
    });
  }

  function openIndividual(occurrence: FollowupOccurrence) {
    setSelectedOccurrenceId(occurrence.id);
    setIndividualPlanned(occurrence.planned_text || "");
    setIndividualEvolution(consolidatedEvolution(occurrence));
    setIndividualObservation(consolidatedInternalNote(occurrence));
    setReportExams(consolidatedExamSummary(occurrence));
    setReportExplanation("");
    setPatientObservations("");
    setPrivateDraft("");
    setIndividualBaseline(occurrenceEditorSnapshot(occurrence));
    setIndividualPreview(null);
    setReleaseIndividualOnSave(false);
    setError("");
    setMessage("");
  }

  async function openIndividualEditor(plan: ObstetricPlan) {
    if (busy) return;
    setSelectedPlanId(plan.id);
    setSelectedOccurrenceId("");
    setIndividualBaseline("");
    setPendingIndividualAction(null);
    setIndividualPreview(null);
    setIndividualEditorOpen(true);
    setError("");
    setMessage("");
    await loadOccurrences(plan.id);
  }

  async function openIndividualEditorAtStep(plan: ObstetricPlan, stepNumber: number) {
    if (busy) return;
    setSelectedPlanId(plan.id);
    setIndividualBaseline("");
    setPendingIndividualAction(null);
    setIndividualPreview(null);
    setIndividualEditorOpen(true);
    setError("");
    setMessage("");
    const rows = await loadOccurrences(plan.id);
    const target = rows.find((item) => Number(item.step_number || 0) === stepNumber);
    if (target) openIndividual(target);
  }

  function closeIndividualEditorNow() {
    setIndividualEditorOpen(false);
    setPendingIndividualAction(null);
    setSelectedOccurrenceId("");
    setIndividualBaseline("");
    setIndividualPreview(null);
  }

  function requestCloseIndividualEditor() {
    if (busy) return;
    if (individualDirty) return setPendingIndividualAction({ type: "close" });
    closeIndividualEditorNow();
  }

  function requestOpenIndividual(occurrence: FollowupOccurrence) {
    if (busy || occurrence.id === selectedOccurrenceId) return;
    if (individualDirty) return setPendingIndividualAction({ type: "switch", occurrenceId: occurrence.id });
    openIndividual(occurrence);
  }

  function continuePendingIndividualAction(action: PendingIndividualAction = pendingIndividualAction) {
    if (!action) return;
    setPendingIndividualAction(null);
    if (action.type === "close") return closeIndividualEditorNow();
    const target = occurrences.find((occurrence) => occurrence.id === action.occurrenceId);
    if (target) openIndividual(target);
  }

  async function generateIndividualPreview() {
    if (!selectedPlan || !selectedOccurrence || !individualStep) return setError("Selecione uma consulta/etapa individual.");
    setBusy(true); setError("");
    try {
      const canvas = await renderIndividualPlanningCanvas({
        kind: selectedPlan.plan_type, patient: selectedPlan.patient_name, passport: selectedPlan.patient_passport,
        doctor: selectedPlan.doctor_name, step: individualStep,
        evolution: [individualEvolution, patientObservations && `Observações: ${patientObservations}`].filter(Boolean).join("\n"),
        exams: [reportExams && `Exames: ${reportExams}`, reportExplanation && `Resultados: ${reportExplanation}`].filter(Boolean).join("\n"),
        observation: "",
      });
      setIndividualPreview({ canvas, signature: individualSignature });
      setIndividualModalOpen(true);
      setReleaseIndividualOnSave(false);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível gerar a prévia individual."); }
    finally { setBusy(false); }
  }

  async function updateIntegralAfterIndividual(client: NonNullable<ReturnType<typeof createClient>>, plan: ObstetricPlan, occurrence: FollowupOccurrence, newPlannedText: string) {
    const schedule = normalizePlanningSteps(plan.plan_type, plan.consultation_schedule || []).map((step) => step.number === occurrence.step_number ? { ...step, planned_text: newPlannedText, description: newPlannedText } : step);
    if (!schedule.length) return;
    const now = new Date().toISOString();
    const versions = plan.planning_document_versions || [];
    const archived = [...versions, { ...(plan.planning_document_path ? { path: plan.planning_document_path } : {}), at: now,
          start_date: plan.start_date, end_date: plan.end_date,
          consultation_schedule: plan.consultation_schedule || [], planning_notes: plan.planning_notes }];
    const { data: updatedPlan, error: planError } = await client.from("clinical_followup_plans").update({
      consultation_schedule: schedule, planning_document_path: null,
      planning_document_versions: archived, updated_at: now,
    }).eq("id", plan.id).eq("doctor_id", profile.id).select("id").maybeSingle();
    if (planError) throw planError;
    if (!updatedPlan?.id) throw new Error("O planejamento integral não foi atualizado. A versão já liberada para a paciente foi preservada.");
  }

  async function persistIndividual(releaseToPatient = false) {
    if (!selectedPlan || !selectedOccurrence || !individualStep || !profile.id) {
      setError("Selecione uma consulta/etapa individual antes de salvar.");
      return false;
    }
    if (!canManageReproductivePlan(profile.role, profile.specialty, selectedPlan.plan_type)) {
      setError("Seu perfil não possui autorização para esta modalidade.");
      return false;
    }
    if (!(await hasRequiredPatientLink(selectedPlan.plan_type, selectedPlan.patient_passport))) {
      setError("O vínculo médico-paciente da especialidade não está ativo. Regularize o vínculo antes de salvar.");
      return false;
    }
    const client = createClient();
    if (!client) return false;
    setBusy(true); setError(""); setMessage("");
    try {
      const now = new Date().toISOString();
      const versions = [...(selectedOccurrence.individual_document_versions || [])];
      const archived = [...versions, { ...(selectedOccurrence.individual_document_path ? { path: selectedOccurrence.individual_document_path } : {}), at: now,
            planned_text: selectedOccurrence.planned_text, evolution_text: selectedOccurrence.evolution_text,
            conduct_text: selectedOccurrence.conduct_text, medical_observation_text: selectedOccurrence.medical_observation_text,
            followup_report: selectedOccurrence.followup_report || {} }];
      if (releaseToPatient && selectedOccurrence.individual_released_at && selectedOccurrence.individual_released_snapshot) {
        archived.push({ at: now, released_snapshot: selectedOccurrence.individual_released_snapshot });
      }
      const updatePayload: Record<string, unknown> = {
        planned_text: individualPlanned.trim() || null,
        evolution_text: individualEvolution.trim() || null,
        medical_observation_text: individualObservation.trim() || null,
        followup_report: {
          exams_performed: reportExams.trim(),
          exam_explanation: reportExplanation.trim(),
          patient_observations: patientObservations.trim(),
          private_draft: privateDraft.trim(),
        },
        rp_marker: individualStep.marker,
        step_title: individualStep.title,
        individual_document_path: null,
        individual_document_versions: archived,
        updated_at: now,
      };
      if (releaseToPatient) {
        updatePayload.individual_released_at = selectedOccurrence.individual_released_at || now;
        updatePayload.individual_released_document_path = null;
        updatePayload.individual_released_snapshot = {
          plan_type: selectedPlan.plan_type,
          plan_id: selectedPlan.id,
          occurrence_id: selectedOccurrence.id,
          patient_name: selectedPlan.patient_name,
          doctor_name: selectedPlan.doctor_name,
          step_number: individualStep.number,
          planned_date: individualStep.date,
          marker: individualStep.marker,
          title: individualStep.title,
          planned_text: individualPlanned.trim(),
          evolution_text: individualEvolution.trim(),
          exams_performed: reportExams.trim(),
          exam_explanation: reportExplanation.trim(),
          patient_observations: patientObservations.trim(),
        };
      }
      const { data: savedOccurrence, error: occurrenceError } = await client.from("clinical_followup_occurrences").update(updatePayload).eq("id", selectedOccurrence.id).eq("doctor_id", profile.id)
        .select("id,individual_released_at,individual_released_snapshot").maybeSingle();
      if (occurrenceError) throw occurrenceError;
      if (!savedOccurrence?.id) throw new Error("A consulta/etapa não foi salva. Verifique o vínculo clínico, sua especialidade e tente novamente.");
      if (releaseToPatient && (!savedOccurrence.individual_released_at || !savedOccurrence.individual_released_snapshot)) {
        throw new Error("A consulta/etapa foi atualizada, mas a liberação para a paciente não foi confirmada. Confira o histórico antes de repetir a operação.");
      }

      const previousPlanned = selectedOccurrence.planned_text || "";
      if (previousPlanned.trim() !== individualPlanned.trim()) await updateIntegralAfterIndividual(client, selectedPlan, selectedOccurrence, individualPlanned.trim());

      const clinicalPayload = {
        followupPlanId: selectedPlan.id,
        followupOccurrenceId: selectedOccurrence.id,
        planType: selectedPlan.plan_type,
        specialty: selectedPlan.specialty,
        stepNumber: individualStep.number,
        marker: individualStep.marker,
        plannedDate: individualStep.date,
        planning: individualPlanned.trim(),
        evolution: individualEvolution.trim(),
        medicalObservation: individualObservation.trim(),
        examsPerformed: reportExams.trim(),
        examExplanation: reportExplanation.trim(),
        patientObservations: patientObservations.trim(),
      };
      const recordId = `followup-${selectedOccurrence.id}`;
      const { data: savedClinicalRecord, error: clinicalError } = await client.from("clinical_records").upsert({
        id: recordId,
        patient_passport: selectedPlan.patient_passport,
        record_type: selectedPlan.plan_type === "in_vitro" ? "Evolução FIV" : "Evolução obstétrica",
        payload: clinicalPayload,
        created_by: profile.id,
        updated_at: now,
        is_confidential: true,
        history_title: `${planTypeLabel(selectedPlan.plan_type)} · ${selectedPlan.plan_type === "in_vitro" ? "Etapa" : "Consulta"} ${individualStep.number}`,
        history_patient_name: selectedPlan.patient_name,
        history_doctor_name: selectedPlan.doctor_name,
      }, { onConflict: "id" }).select("id").maybeSingle();
      if (clinicalError) throw clinicalError;
      if (!savedClinicalRecord?.id) throw new Error("O atendimento foi salvo no planejamento, mas o registro clínico não foi confirmado no prontuário. Confira o histórico antes de repetir a operação.");

      setIndividualBaseline(individualFormSnapshot);
      setMessage(releaseToPatient
        ? `${selectedPlan.plan_type === "in_vitro" ? "Etapa" : "Consulta"} ${individualStep.number} salva e nova versão liberada para a paciente.`
        : selectedOccurrence.individual_released_at
          ? `${selectedPlan.plan_type === "in_vitro" ? "Etapa" : "Consulta"} ${individualStep.number} salva. A paciente continua vendo a última versão explicitamente liberada.`
          : `${selectedPlan.plan_type === "in_vitro" ? "Etapa" : "Consulta"} ${individualStep.number} salva. A liberação individual permanece independente.`);
      await Promise.all([loadHistory(selectedPlan.id), loadOccurrences(selectedPlan.id)]);
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível salvar a consulta individual.");
      return false;
    } finally { setBusy(false); }
  }

  async function saveIndividual() {
    if (!readyIndividualPreview) return setError("Gere e confira a prévia individual antes de liberar ou salvar por esta janela.");
    const saved = await persistIndividual(releaseIndividualOnSave);
    if (saved) setIndividualModalOpen(false);
  }

  async function savePendingIndividualAndContinue() {
    const pending = pendingIndividualAction;
    if (!pending) return;
    const saved = await persistIndividual(false);
    if (saved) continuePendingIndividualAction(pending);
  }


  return <div className="hpsr-obstetra-page space-y-5" data-planning-kind={planType}>
    {(message || error) && <div className="fixed bottom-3 right-3 z-[260] w-[min(92vw,440px)] sm:bottom-5 sm:right-5">
      <div role={error ? "alert" : "status"} className={`flex items-start gap-3 rounded-[16px] border px-4 py-3 shadow-[0_18px_50px_rgba(42,7,0,0.18)] ${error ? "border-rose-200 bg-rose-50 text-rose-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>
        <div className="mt-0.5 shrink-0">{error ? <X size={18} /> : <CheckCircle2 size={18} />}</div>
        <p className="min-w-0 flex-1 text-sm font-bold leading-relaxed">{error || message}</p>
        <button type="button" aria-label="Fechar aviso" onClick={() => { setError(""); setMessage(""); }} className="grid h-7 w-7 shrink-0 place-items-center rounded-full hover:bg-black/5"><X size={15} /></button>
      </div>
    </div>}

    <div className="hpsr-topbar" aria-hidden="true" />

    <section className="hpsr-obstetric-overview rounded-[22px] border border-[#e1c9b8] bg-[linear-gradient(120deg,#f8ecdf_0%,#f4e3d7_100%)] p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="hpsr-obstetric-icon hpsr-obstetric-icon-hero grid h-12 w-12 shrink-0 place-items-center rounded-[16px] bg-[linear-gradient(135deg,#672614,#2a0700)] text-white">
            {workspaceView === "vaccination" ? <Syringe size={22} /> : planType === "in_vitro" ? <Sparkles size={22} /> : <HeartPulse size={22} />}
          </div>
          <div>
            <p className="hpsr-obstetric-accent-label text-[10px] font-black uppercase tracking-[.16em] text-hpsr-wineLight">Planejamento médico</p>
            <h2 className="mt-1 text-2xl font-black leading-tight text-hpsr-text">{workspaceView === "vaccination" ? "Vacinação gestacional" : planType === "in_vitro" ? "Fertilização in vitro" : "Planejamento gestacional"}</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-hpsr-muted">{workspaceView === "vaccination" ? "Registre e acompanhe a vacinação gestacional dentro do mesmo espaço de acompanhamento." : "As semanas são marcadores do RP. O cálculo usa apenas o calendário real e nunca converte esses marcadores em semanas reais."}</p>
          </div>
        </div>
        <div className={`grid gap-2 sm:grid-cols-2 lg:min-w-[440px] ${canManageGestationalVaccination(profile.role, profile.specialty) ? "xl:grid-cols-3" : ""}`} aria-label="Alternar acompanhamento">
          {canManageReproductivePlan(profile.role, profile.specialty, "gestacional") && <button type="button" aria-pressed={planType === "gestacional" && workspaceView === "planning"} onClick={() => changePlanType("gestacional")} className={`rounded-[16px] border px-4 py-3 text-left transition ${planType === "gestacional" && workspaceView === "planning" ? "border-hpsr-wine bg-hpsr-wine text-white shadow-sm" : "border-[#ddc1b1] bg-[#f5e5d9] text-hpsr-text hover:border-[#bc8c78]"}`}><p className={`text-[9px] font-black uppercase tracking-[.12em] ${planType === "gestacional" && workspaceView === "planning" ? "text-white/75" : "text-hpsr-wineLight"}`}>Acompanhamento</p><p className="mt-1 text-sm font-black leading-tight">Gestacional</p></button>}
          {canManageGestationalVaccination(profile.role, profile.specialty) && <button type="button" aria-pressed={workspaceView === "vaccination"} onClick={showVaccinationView} className={`rounded-[16px] border px-4 py-3 text-left transition ${workspaceView === "vaccination" ? "border-hpsr-wine bg-hpsr-wine text-white shadow-sm" : "border-[#ddc1b1] bg-[#f5e5d9] text-hpsr-text hover:border-[#bc8c78]"}`}><p className={`text-[9px] font-black uppercase tracking-[.12em] ${workspaceView === "vaccination" ? "text-white/75" : "text-hpsr-wineLight"}`}>Gestação</p><p className="mt-1 text-sm font-black leading-tight">Vacinação gestacional</p></button>}
          {canManageReproductivePlan(profile.role, profile.specialty, "in_vitro") && <button type="button" aria-pressed={planType === "in_vitro" && workspaceView === "planning"} onClick={() => changePlanType("in_vitro")} className={`rounded-[16px] border px-4 py-3 text-left transition ${planType === "in_vitro" && workspaceView === "planning" ? "border-hpsr-wine bg-hpsr-wine text-white shadow-sm" : "border-[#ddc1b1] bg-[#f5e5d9] text-hpsr-text hover:border-[#bc8c78]"}`}><p className={`text-[9px] font-black uppercase tracking-[.12em] ${planType === "in_vitro" && workspaceView === "planning" ? "text-white/75" : "text-hpsr-wineLight"}`}>Acompanhamento</p><p className="mt-1 text-sm font-black leading-tight">Fertilização in vitro</p></button>}
        </div>
      </div>
    </section>

    {planType === "gestacional" && workspaceView === "vaccination" && canManageGestationalVaccination(profile.role, profile.specialty) && <section id="vacinacao-gestacional" className="rounded-[22px] border border-[#dcbac4] bg-[#f5e7e5] p-3 shadow-sm sm:p-5"><VaccinationWorkspace mode="gestational" /></section>}

    {workspaceView === "planning" && <>
    <div className="hpsr-obstetric-editor-list grid min-w-0 gap-4">
      <section id="acompanhamento-dados" className="hpsr-planning-panel hpsr-gestational-form min-w-0 rounded-[24px] border border-[#ad7665] p-4 shadow-[0_14px_34px_rgba(125,35,29,0.08)] sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-center gap-3"><div className="hpsr-obstetric-icon grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-[linear-gradient(135deg,#672614,#2a0700)] text-white"><Baby size={20} /></div><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-hpsr-wineLight">Dados do planejamento</p><h3 className="text-lg font-black text-hpsr-text">Definição médica</h3><p className="text-sm text-hpsr-muted">Defina o planejamento do acompanhamento e gerencie as consultas previstas para a paciente.</p></div></div><div className="flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={openNewPlanningModal} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[12px] border border-hpsr-wine bg-hpsr-wine px-3.5 text-xs font-black text-white transition hover:opacity-90 disabled:opacity-50"><Plus size={15} />Novo planejamento</button><button type="button" onClick={openFormManagerModal} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[12px] border border-[#c8a992] bg-[#fff8f3] px-3.5 text-xs font-black text-hpsr-wine transition hover:bg-[#f6e5da]"><ClipboardList size={15} />Formulário</button><button type="button" onClick={goToPlanningHistory} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[12px] border border-[#c8a992] bg-[#fff8f3] px-3.5 text-xs font-black text-hpsr-wine transition hover:bg-[#f6e5da]"><History size={15} />Histórico</button></div></div>

        <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1040px)_minmax(240px,320px)] xl:items-stretch xl:justify-between">
          <div className="grid min-w-0 gap-5">
          <div className="grid max-w-[1080px] gap-3 xl:grid-cols-[minmax(320px,560px)_minmax(260px,400px)] xl:items-end">
            <Field label="Planejamento ativo" hint={editingPlanId ? "Troque rapidamente entre acompanhamentos já salvos." : "Comece um novo planejamento ou carregue um registro existente."}>
              <StyledSelect value={editingPlanId} onChange={(event) => { const nextId = event.target.value; if (!nextId) { openNewPlanningModal(); return; } const plan = manageablePlans.find((item) => item.id === nextId); if (plan) beginEditing(plan); }} searchable disabled={busy}>
                <option value="">Novo planejamento · ainda não salvo</option>
                {manageablePlans.map((plan) => <option key={plan.id} value={plan.id}>{plan.patient_name} · {planTypeLabel(plan.plan_type)} · {formatDate(plan.start_date)}</option>)}
              </StyledSelect>
            </Field>
            <Field label="Paciente" hint={editingPlanId ? "Trocar de paciente inicia um novo planejamento e preserva o atual." : "Nome e passaporte são preenchidos automaticamente."}>
              <StyledSelect value={selectedPassport} onChange={(event) => switchPlanningPatient(event.target.value)} searchable disabled={loading || busy}>
                <option value="">{loading ? "Carregando pacientes..." : "Selecionar paciente"}</option>
                {patients.map((patient) => <option key={patient.passport} value={patient.passport}>{patient.name} · {patient.passport}</option>)}
              </StyledSelect>
            </Field>
          </div>

          <div className="flex min-h-6 flex-wrap items-center gap-2 text-xs">
            <span className={`rounded-full px-2.5 py-1 font-black ${editingPlan ? "bg-[#ead7ca] text-hpsr-wine" : "bg-[#efe3d8] text-hpsr-text"}`}>{editingPlan ? "Editando registro salvo" : "Novo planejamento"}</span>
            <span className="text-hpsr-muted">{editingPlan ? `${editingPlan.patient_name} · ${planTypeLabel(editingPlan.plan_type)} · iniciado em ${formatDate(editingPlan.start_date)}` : "Os dados abaixo serão usados para criar um novo planejamento."}</span>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,360px)_150px_minmax(210px,300px)_minmax(220px,300px)]"><Field label="Nome do paciente"><input className={`${inputClass} bg-[#f8efe5]`} value={selectedPatient?.name || ""} readOnly /></Field><Field label="Passaporte"><input className={`${inputClass} bg-[#f8efe5]`} value={selectedPatient?.passport || ""} readOnly /></Field><Field label="Médico responsável"><input className={`${inputClass} bg-[#f8efe5]`} value={doctorName} readOnly /></Field><Field label="Acompanhamento"><input className={`${inputClass} bg-[#f8efe5]`} value={planType === "in_vitro" ? "Fertilização in vitro — FIV" : "Acompanhamento gestacional"} readOnly /></Field></div>

          <div className="grid gap-3 xl:grid-cols-[200px_200px_minmax(300px,1fr)] xl:items-start"><Field label="Data inicial" hint="O dia da semana desta data será preservado na sugestão."><input className={inputClass} type="date" value={startDate} onChange={(event) => changeStartDate(event.target.value)} /></Field><Field label="Data final · referência" hint={planType === "in_vitro" ? "Referência do planejamento FIV; não cria uma sexta etapa." : "Referência prevista para o parto; não cria consulta extra."}><input className={inputClass} type="date" min={startDate || undefined} value={endDate} onChange={(event) => changeEndDate(event.target.value)} /></Field><div className="flex flex-wrap items-start gap-2 xl:pt-[22px]"><button type="button" disabled={!startDate || !endDate || busy} onClick={() => void handleSuggestSchedule()} className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-hpsr-wine bg-white px-4 text-sm font-black text-hpsr-wine disabled:opacity-50"><CalendarDays size={17} />Sugerir cronograma</button>{suggestion?.valid && suggestion.key === scheduleKey && !scheduleConfirmed && <button type="button" disabled={busy} onClick={confirmSuggestion} className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-hpsr-wine px-4 text-sm font-black text-white"><CheckCircle2 size={17} />Confirmar sugestão</button>}</div></div>

          {(suggestion && suggestion.key === scheduleKey) && <div className={`border-t pt-3 ${suggestion.valid ? "border-emerald-200" : "border-amber-200"}`}><p className="text-sm font-black text-hpsr-text">{planType === "in_vitro" ? `${suggestion.steps.length} etapas sugeridas` : `${suggestion.foundCount} de ${suggestion.expectedCount} consultas sugeridas`}</p><p className="mt-1 text-xs leading-relaxed text-hpsr-muted">{suggestion.warning || `Cronograma sugerido em ${suggestion.targetWeekdayLabel}, seguindo o dia da semana da data inicial.`}</p><div className="mt-2 flex flex-wrap gap-1.5">{suggestion.candidateDates.map((date) => <span key={date} className="rounded-full border border-[#dec4b5] bg-[#fff8f3] px-2.5 py-1 text-xs font-bold text-hpsr-text">{formatDate(date)}</span>)}</div>{scheduleAvailabilityNote && <p className="mt-3 text-xs font-bold leading-relaxed text-amber-900">{scheduleAvailabilityNote}</p>}</div>}
          {scheduleConfirmed && <div className="border-t border-emerald-200 pt-3 text-sm font-bold text-emerald-800"><CheckCircle2 size={16} className="mr-2 inline" />Cronograma confirmado pela médica. Nenhuma consulta foi criada no Agendamento.{confirmedAdvisories.length > 0 && <p className="mt-2 text-xs font-semibold leading-relaxed text-amber-800">{confirmedAdvisories.join(" ")} São apenas orientações: você pode salvar exatamente o cronograma definido.</p>}</div>}

          <div className="max-w-[760px]"><Field label="Observações gerais" hint="Registro interno do planejamento; não substitui os campos individuais."><textarea className={`${textAreaClass} min-h-[120px]`} maxLength={4000} value={planningNotes} onChange={(event) => { setPlanningNotes(event.target.value); setIntegralPreview(null); }} placeholder="Observações gerais da médica sobre o planejamento" /></Field></div>
          </div>

          <aside className="flex h-full min-h-[360px] w-full max-w-[320px] justify-self-end flex-col bg-transparent px-5 py-5 xl:min-h-0" aria-label="Resumo do acompanhamento">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#9e5a72]">Resumo do acompanhamento</p>
              <h4 className="mt-1 text-lg font-black text-hpsr-text">{editingPlan ? "Planejamento atual" : "Novo planejamento"}</h4>
              <p className="mt-1 text-sm leading-relaxed text-hpsr-muted">Visão rápida dos principais marcos deste acompanhamento.</p>
            </div>

            <div className="mt-5 flex flex-1 flex-col justify-between border-t border-[#dfc4cd] pt-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">{planType === "in_vitro" ? "Próxima etapa" : "Próxima consulta"}</p>
                {summaryNextStep ? <>
                  <p className="mt-2 text-[28px] font-black leading-none text-hpsr-text">{formatDate(summaryNextStep.date)}</p>
                  <p className="mt-2 text-sm font-black text-hpsr-wine">{summaryNextStep.marker || (planType === "in_vitro" ? `Etapa ${summaryNextStep.number}` : `Consulta ${summaryNextStep.number}`)}</p>
                </> : <>
                  <p className="mt-2 text-lg font-black leading-tight text-hpsr-text">{scheduleConfirmed ? "Cronograma concluído" : "Cronograma não definido"}</p>
                  <p className="mt-2 max-w-[280px] text-xs leading-relaxed text-hpsr-muted">{scheduleConfirmed ? "Não há outro marco pendente neste cronograma." : "Defina o período e confirme o cronograma para visualizar o próximo marco."}</p>
                </>}
              </div>

              <dl className="mt-6 grid gap-4 border-t border-[#dfc4cd] py-5 text-sm sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <div className="min-w-0">
                  <dt className="text-[9px] font-black uppercase tracking-[.10em] text-hpsr-wineLight">{planType === "in_vitro" ? "Confirmação β-hCG" : "Parto previsto"}</dt>
                  <dd className="mt-1.5 text-base font-black text-hpsr-text">{summaryFinalReference ? formatDate(summaryFinalReference) : "Ainda não definido"}</dd>
                </div>
                <div className="min-w-0 2xl:border-l 2xl:border-[#dfc4cd] 2xl:pl-4">
                  <dt className="text-[9px] font-black uppercase tracking-[.10em] text-hpsr-wineLight">Planejamento integral</dt>
                  <dd className="mt-1.5">
                    {editingPlan ? (
                      <button
                        type="button"
                        disabled={busy || Boolean(editingPlan.portal_released_at)}
                        onClick={() => void releaseCurrentIntegral(editingPlan)}
                        className={`inline-flex min-h-[34px] items-center justify-center rounded-[10px] border px-3 text-xs font-black transition ${editingPlan.portal_released_at ? "cursor-default border-[#c7b7ad] bg-[#eee3dc] text-[#5f443a]" : "border-hpsr-wine bg-hpsr-wine text-white hover:opacity-90"} disabled:opacity-70`}
                      >
                        {editingPlan.portal_released_at ? "Liberado" : "Não liberado"}
                      </button>
                    ) : (
                      <span className="inline-flex min-h-[34px] items-center rounded-[10px] border border-[#d8c5ba] bg-[#f2e8e1] px-3 text-xs font-black text-hpsr-muted">Não salvo</span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>

        <div className="mt-6 flex flex-col items-center border-t border-[#d9c1b4] pt-5">
          <button type="button" disabled={busy || !scheduleConfirmed || !selectedPatient} onClick={() => void generateIntegralPreview()} className="hpsr-obstetric-primary-action inline-flex min-h-[52px] w-full max-w-[390px] items-center justify-center gap-2 rounded-[17px] bg-hpsr-wine px-5 text-sm font-black text-white transition hover:opacity-90 disabled:opacity-50">{busy ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}{busy ? "Preparando..." : "Gerar prévia integral"}</button>
          <p className="mt-2 text-center text-xs text-hpsr-muted">Confirme o cronograma e revise os dados acima antes de gerar a prévia do planejamento.</p>
        </div>
      </section>

      <div className="min-w-0">
      <section id="acompanhamento-conteudo" className="hpsr-planning-panel hpsr-gestational-form hpsr-obstetric-stage-preview min-w-0 rounded-[24px] border border-[#ad7665] p-4 shadow-[0_14px_34px_rgba(125,35,29,0.08)] sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="flex shrink-0 items-center gap-3"><div className="hpsr-obstetric-icon grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-[linear-gradient(135deg,#672614,#2a0700)] text-white"><CalendarDays size={20} /></div><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-hpsr-wineLight">Consultas do planejamento</p><h3 className="text-lg font-black text-hpsr-text">Gerencie as consultas e libere o que for necessário</h3><p className="text-sm text-hpsr-muted">Use editar para abrir cada consulta em modal. A prévia integral fica disponível na Definição médica e também pode ser reaberta por aqui.</p></div></div><div className="flex flex-wrap gap-2"><button type="button" disabled={busy || !scheduleConfirmed || !selectedPatient} onClick={() => readyIntegralPreview ? setIntegralModalOpen(true) : void generateIntegralPreview()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[12px] border border-hpsr-wine bg-hpsr-wine px-3.5 text-xs font-black text-white transition hover:opacity-90 disabled:opacity-50"><Eye size={15} />Ver integral</button></div></div>
        {scheduleConfirmed ? <div className="mt-5 overflow-hidden rounded-[18px] border border-[#dec8bb] bg-[#fffaf7]"><div className="overflow-x-auto"><table className="min-w-full border-collapse text-sm"><thead><tr className="border-b border-[#e4d1c5] bg-[#f8efe7] text-left"><th className="px-4 py-3 text-[10px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">Consulta</th><th className="px-4 py-3 text-[10px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">Semana</th><th className="px-4 py-3 text-[10px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">Data prevista</th><th className="px-4 py-3 text-[10px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">Conteúdo</th><th className="px-4 py-3 text-[10px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">Ações</th></tr></thead><tbody>{confirmedSteps.map((step, index) => { const occurrence = occurrences.find((item) => (item.step_number || 0) === step.number); const released = Boolean(occurrence?.individual_released_at); return <tr key={`${step.number}-${index}`} className="border-b border-[#eddccf] last:border-b-0"><td className="px-4 py-3 font-black text-hpsr-text">{planType === "in_vitro" ? `Etapa ${step.number}` : `Consulta ${step.number}`}</td><td className="px-4 py-3 font-semibold text-hpsr-text">{step.marker || "—"}</td><td className="px-4 py-3 font-semibold text-hpsr-text">{formatDate(step.date)}</td><td className="px-4 py-3 text-hpsr-muted">{(step.planned_text || "").trim() || "Conteúdo não preenchido"}</td><td className="px-4 py-3"><div className="flex flex-wrap gap-2">{occurrence ? <button type="button" onClick={() => editingPlan && void openIndividualEditorAtStep(editingPlan, step.number)} className="inline-flex min-h-[34px] items-center justify-center gap-1 rounded-[10px] border border-hpsr-wine bg-hpsr-wine px-3 text-xs font-black text-white transition hover:opacity-90"><Eye size={12} />Editar</button> : <span className="inline-flex min-h-[34px] items-center rounded-[10px] border border-dashed border-[#d7b6a6] px-3 text-[11px] font-bold text-hpsr-muted">Salve o planejamento</span>}{released && <span className="inline-flex min-h-[34px] items-center rounded-[10px] border border-emerald-200 bg-emerald-50 px-3 text-[11px] font-black text-emerald-800">Liberada</span>}</div></td></tr>;})}</tbody></table></div></div> : <div className="mt-5 flex flex-1 flex-col items-center justify-center border-t border-[#d9c1b4] px-2 py-10 text-center"><CalendarDays size={28} className="mx-auto text-[#b87a91]" /><p className="mt-3 font-black text-hpsr-text">Aguardando confirmação</p><p className="mt-1 text-sm text-hpsr-muted">Informe o período, peça a sugestão e confirme. Depois disso as consultas aparecerão aqui para edição individual.</p></div>}
      </section>
      </div>
    </div>

    <section id="acompanhamento-historico" className={`hpsr-planning-panel hpsr-gestational-history scroll-mt-5 rounded-[24px] border p-4 shadow-sm transition-[box-shadow,border-color] duration-500 sm:p-5 ${historyShortcutActive ? "border-hpsr-wine shadow-[0_0_0_3px_rgba(125,35,29,0.10),0_14px_34px_rgba(125,35,29,0.10)]" : ""}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3"><div className="hpsr-obstetric-icon grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-[linear-gradient(135deg,#672614,#2a0700)] text-white"><History size={20} /></div><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-hpsr-wineLight">Acompanhamentos salvos</p><h3 className="text-lg font-black text-hpsr-text">Histórico de planejamentos</h3><p className="text-sm text-hpsr-muted">Linha do tempo das alterações do planejamento. A edição acontece somente na Definição médica acima.</p></div></div>
        <span className="w-fit rounded-full border border-[#d8b9a9] bg-[#f5e8dc] px-3 py-1.5 text-xs font-black text-hpsr-wine">{manageablePlans.length} {manageablePlans.length === 1 ? "planejamento" : "planejamentos"}</span>
      </div>
      {manageablePlans.length > 0 && <div className="mt-4 flex max-w-[900px] flex-col gap-3 md:flex-row md:items-center"><div className="relative min-w-0 flex-1 md:max-w-[520px]"><Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-hpsr-wineLight" /><input value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} className={`${inputClass} pl-10`} placeholder="Buscar paciente, passaporte, data ou modalidade" aria-label="Buscar no histórico de planejamentos" /></div><div className="flex flex-wrap gap-1.5" aria-label="Filtrar histórico por modalidade"><button type="button" aria-pressed={historyTypeFilter === "all"} onClick={() => setHistoryTypeFilter("all")} className={`rounded-full border px-3 py-1.5 text-xs font-black transition ${historyTypeFilter === "all" ? "border-hpsr-wine bg-hpsr-wine text-white" : "border-[#d2b7a8] bg-transparent text-hpsr-wine hover:bg-[#f2dfd2]"}`}>Todos</button>{canManageReproductivePlan(profile.role, profile.specialty, "gestacional") && <button type="button" aria-pressed={historyTypeFilter === "gestacional"} onClick={() => setHistoryTypeFilter("gestacional")} className={`rounded-full border px-3 py-1.5 text-xs font-black transition ${historyTypeFilter === "gestacional" ? "border-hpsr-wine bg-hpsr-wine text-white" : "border-[#d2b7a8] bg-transparent text-hpsr-wine hover:bg-[#f2dfd2]"}`}>Gestacional</button>}{canManageReproductivePlan(profile.role, profile.specialty, "in_vitro") && <button type="button" aria-pressed={historyTypeFilter === "in_vitro"} onClick={() => setHistoryTypeFilter("in_vitro")} className={`rounded-full border px-3 py-1.5 text-xs font-black transition ${historyTypeFilter === "in_vitro" ? "border-hpsr-wine bg-hpsr-wine text-white" : "border-[#d2b7a8] bg-transparent text-hpsr-wine hover:bg-[#f2dfd2]"}`}>FIV</button>}</div></div>}
      {manageablePlans.length === 0 ? <div className="mt-5 border-t border-[#d9c1b4] pt-6 text-sm font-semibold text-hpsr-muted">Nenhum planejamento criado por esta médica.</div> : filteredHistoryPlans.length === 0 ? <div className="mt-5 border-t border-[#d9c1b4] pt-6 text-sm font-semibold text-hpsr-muted">Nenhum planejamento corresponde aos filtros atuais.</div> : <div className="mt-5 divide-y divide-[#d9c1b4] border-t border-[#d9c1b4]">{filteredHistoryPlans.map((plan) => { const events = historyTimeline[plan.id] || []; const expanded = expandedHistoryPlanId === plan.id; return <article key={plan.id} className="py-4 first:pt-4 last:pb-0"><button type="button" onClick={() => void toggleHistoryTimeline(plan)} className="flex w-full flex-col gap-3 text-left lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><p className="truncate font-black text-hpsr-text">{plan.patient_name}</p><div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs"><span className="font-black text-hpsr-wine">{planTypeLabel(plan.plan_type)}</span><span className="text-hpsr-muted">{formatDate(plan.start_date)} → referência {formatDate(plan.end_date)}</span><span className="text-hpsr-muted">Passaporte {plan.patient_passport}</span></div></div><div className="flex items-center gap-2"><span className="rounded-full bg-[#ead7ca] px-2 py-1 text-[10px] font-black text-hpsr-wine">{plan.status}</span><span className="text-xs font-black text-hpsr-wine">{expanded ? "Fechar linha do tempo" : "Ver linha do tempo"}</span></div></button>{expanded && <div className="mt-4 rounded-[16px] border border-[#dfc8bb] bg-[#fff8f3] p-4">{historyTimelineLoading === plan.id ? <div className="flex items-center gap-2 text-sm font-bold text-hpsr-muted"><Loader2 size={15} className="animate-spin" />Carregando histórico...</div> : events.length ? <div className="space-y-0">{events.map((event, index) => <div key={`${event.at}-${index}`} className="relative grid grid-cols-[18px_1fr] gap-3 pb-4 last:pb-0"><div className="relative"><span className="absolute left-[6px] top-2 h-2.5 w-2.5 rounded-full bg-hpsr-wine" />{index < events.length - 1 && <span className="absolute left-[10px] top-5 h-[calc(100%-8px)] w-px bg-[#d9bdae]" />}</div><div><p className="text-xs font-black text-hpsr-text">{event.title}</p><p className="mt-0.5 text-[11px] font-semibold text-hpsr-wine">{formatDateTime(event.at)}</p>{event.detail && <p className="mt-1 text-xs leading-relaxed text-hpsr-muted">{event.detail}</p>}</div></div>)}</div> : <p className="text-sm text-hpsr-muted">Nenhuma movimentação registrada além da criação do planejamento.</p>}</div>}</article>; })}</div>}
    </section>
    </>}

    {formManagerModalOpen && typeof document !== "undefined" && createPortal(<div className="fixed inset-0 z-[206] flex items-center justify-center bg-[rgba(42,7,0,.78)] backdrop-blur-[2px] p-3 sm:p-5"><button type="button" className="absolute inset-0" aria-label="Fechar formulários" onClick={() => setFormManagerModalOpen(false)} /><div className="relative flex max-h-[94dvh] w-full max-w-[900px] flex-col overflow-hidden rounded-[22px] border border-[#d5b7a4] bg-[#f9efe6] shadow-[0_24px_80px_rgba(62,21,12,.28)]"><header className="relative flex shrink-0 items-start justify-between gap-3 border-b border-[#ddc6b7] bg-[linear-gradient(120deg,#f8eadf_0%,#f4e2d5_100%)] px-5 py-4 sm:px-6 before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-hpsr-wine"><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-hpsr-wineLight">Formulários do acompanhamento</p><h3 className="mt-1 text-xl font-black text-hpsr-text">Gerenciar fichas dos pacientes</h3><p className="mt-1 text-sm leading-relaxed text-hpsr-muted">Solicite uma ficha, acompanhe o preenchimento, consulte respostas e envie uma nova solicitação de atualização quando necessário.</p></div><button type="button" onClick={() => setFormManagerModalOpen(false)} className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] border border-[#d3b39d] bg-[#fffaf6] text-hpsr-wine"><X size={18} /></button></header><div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6"><div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"><Field label="Paciente" hint="Selecione quem terá a ficha gerenciada neste acompanhamento."><StyledSelect value={formManagerPassport} onChange={(event) => setFormManagerPassport(event.target.value)} searchable><option value="">Selecionar paciente</option>{patients.map((patient) => <option key={patient.passport} value={patient.passport}>{patient.name} · {patient.passport}</option>)}</StyledSelect></Field><button type="button" onClick={() => { const current = formManagerPassport; setFormManagerPassport(""); window.setTimeout(() => setFormManagerPassport(current), 0); }} disabled={!formManagerPassport} className="inline-flex h-11 items-center justify-center gap-2 rounded-[12px] border border-hpsr-wine bg-[#fff8f3] px-4 text-sm font-black text-hpsr-wine disabled:opacity-40"><RefreshCcw size={15} />Atualizar</button></div>{formManagerPassport ? (() => { const formPatient = patients.find((patient) => patient.passport === formManagerPassport); return formPatient && profile.id ? <div className="mt-5 rounded-[20px] border border-[#d9c1b4] bg-[#fff8f3] p-4 sm:p-5"><FollowupIntakeFormManager patientPassport={formPatient.passport} patientName={formPatient.name} doctorId={profile.id} doctorName={doctorName} planType={planType} /></div> : null; })() : <div className="mt-5 rounded-[18px] border border-dashed border-[#d2b3a1] bg-[#f5e5d9] px-4 py-8 text-center"><ClipboardList size={26} className="mx-auto text-hpsr-wineLight" /><p className="mt-3 font-black text-hpsr-text">Selecione uma paciente</p><p className="mt-1 text-sm text-hpsr-muted">As opções de solicitação, acompanhamento e histórico da ficha aparecem aqui.</p></div>}</div><footer className="shrink-0 border-t border-[#ddc6b7] bg-[#f4e4d8] px-5 py-3 text-right sm:px-6"><button type="button" onClick={() => setFormManagerModalOpen(false)} className="inline-flex min-h-10 items-center justify-center rounded-[12px] border border-[#c8a992] bg-[#fff8f3] px-4 text-sm font-black text-hpsr-wine">Fechar</button></footer></div></div>, document.body)}

    {newPlanModalOpen && typeof document !== "undefined" && createPortal(<div className="fixed inset-0 z-[205] flex items-center justify-center bg-[rgba(42,7,0,.78)] backdrop-blur-[2px] p-3 sm:p-5"><button type="button" className="absolute inset-0" aria-label="Fechar novo planejamento" onClick={() => setNewPlanModalOpen(false)} /><div className="relative w-full max-w-[680px] overflow-hidden rounded-[22px] border border-[#d5b7a4] bg-[#f9efe6] shadow-[0_24px_80px_rgba(62,21,12,.28)]"><div className="relative flex items-start justify-between gap-3 border-b border-[#ddc6b7] bg-[linear-gradient(120deg,#f8eadf_0%,#f4e2d5_100%)] px-5 py-4 sm:px-6 before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-hpsr-wine"><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-hpsr-wineLight">Novo planejamento</p><h3 className="mt-1 text-xl font-black text-hpsr-text">Preparar novo acompanhamento</h3><p className="mt-1 text-sm leading-relaxed text-hpsr-muted">Selecione a paciente para iniciar a definição médica do novo planejamento.</p></div><button type="button" onClick={() => setNewPlanModalOpen(false)} className="grid h-10 w-10 place-items-center rounded-[12px] border border-[#d3b39d] bg-[#fffaf6] text-hpsr-wine"><X size={18} /></button></div><div className="px-5 py-5 sm:px-6"><Field label="Paciente" hint="Esse planejamento será iniciado para a paciente selecionada."><StyledSelect value={newPlanPassport} onChange={(event) => setNewPlanPassport(event.target.value)} searchable><option value="">Selecionar paciente</option>{patients.map((patient) => <option key={patient.passport} value={patient.passport}>{patient.name} · {patient.passport}</option>)}</StyledSelect></Field></div><div className="flex flex-wrap justify-end gap-2 border-t border-[#ddc6b7] bg-[#f4e4d8] px-5 py-3 sm:px-6"><button type="button" onClick={() => setNewPlanModalOpen(false)} className="inline-flex min-h-10 items-center justify-center rounded-[12px] border border-[#c8a992] bg-[#fff8f3] px-4 text-sm font-black text-hpsr-wine">Cancelar</button><button type="button" onClick={confirmNewPlanningSetup} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[12px] border border-hpsr-wine bg-hpsr-wine px-4 text-sm font-black text-white"><Plus size={15} />Começar planejamento</button></div></div></div>, document.body)}

    {individualEditorOpen && selectedPlan && typeof document !== "undefined" && createPortal(<div className="fixed inset-0 z-[210] flex items-center justify-center bg-[rgba(42,7,0,.78)] backdrop-blur-[2px] p-2 sm:p-5"><button type="button" className="absolute inset-0" aria-label="Fechar editor de consultas" onClick={requestCloseIndividualEditor} /><div className="relative flex max-h-[96dvh] w-full max-w-[1180px] flex-col overflow-hidden rounded-[22px] border border-[#d5b7a4] bg-[#f9efe6] shadow-[0_24px_80px_rgba(62,21,12,.28)]">
      <header className="flex shrink-0 flex-col gap-3 relative border-b border-[#ddc6b7] bg-[linear-gradient(120deg,#f8eadf_0%,#f4e2d5_100%)] px-4 py-4 before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-hpsr-wine sm:flex-row sm:items-center sm:justify-between sm:px-5"><div className="flex min-w-0 items-center gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-[linear-gradient(135deg,#672614,#2a0700)] text-white">{selectedPlan.plan_type === "in_vitro" ? <Sparkles size={19} /> : <HeartPulse size={19} />}</div><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[.15em] text-hpsr-wineLight">Acompanhamento · edição individual</p><h2 className="truncate text-lg font-black text-hpsr-text">{selectedPlan.patient_name}</h2><p className="mt-0.5 text-xs text-hpsr-muted">{planTypeLabel(selectedPlan.plan_type)} · {formatDate(selectedPlan.start_date)} → referência {formatDate(selectedPlan.end_date)}</p></div></div><div className="flex items-center gap-2">{individualDirty && <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.08em] text-amber-900">Alterações não salvas</span>}<button type="button" disabled={busy} onClick={requestCloseIndividualEditor} className="grid h-10 w-10 place-items-center rounded-[12px] border border-[#d3b39d] bg-[#fffaf6] text-hpsr-wine disabled:opacity-40"><X size={18} /></button></div></header>
      <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
        <section className="rounded-[18px] border border-[#dec6bb] bg-[#f4e5d9] p-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Consultas do planejamento</p><h3 className="text-base font-black text-hpsr-text">Selecione a {selectedPlan.plan_type === "in_vitro" ? "etapa" : "consulta"} que deseja editar</h3></div><span className="w-fit rounded-full border border-[#d8b9a9] bg-[#fff8f3] px-3 py-1.5 text-xs font-black text-hpsr-wine">{occurrences.length} {selectedPlan.plan_type === "in_vitro" ? "etapas" : "consultas"}</span></div><div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">{occurrences.map((occurrence) => <button key={occurrence.id} type="button" aria-pressed={selectedOccurrenceId === occurrence.id} onClick={() => requestOpenIndividual(occurrence)} className={`hpsr-planning-visit-card rounded-[15px] border p-3 text-left transition ${selectedOccurrenceId === occurrence.id ? "border-hpsr-wine bg-[#fff7f1] ring-2 ring-hpsr-wine/10" : "border-[#dec8bb] bg-[#f5e9dd] hover:border-[#bc8c78]"}`}><div className="flex items-start justify-between gap-2"><p className="font-black text-hpsr-text">{selectedPlan.plan_type === "in_vitro" ? "Etapa" : "Consulta"} {occurrence.step_number || "—"}</p>{occurrence.individual_released_at && <span className="rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-black text-emerald-800">Liberada</span>}</div><p className="mt-1 text-xs font-bold text-hpsr-wine">{occurrence.rp_marker || "Marco não informado"}</p><p className="mt-1 text-xs text-hpsr-muted">{formatDate(occurrence.planned_date)} · {occurrence.status}</p></button>)}</div></section>

        {!selectedOccurrence && <div className="mt-4 rounded-[18px] border border-dashed border-[#d2b3a1] bg-[#f5e5d9] px-4 py-8 text-center"><CalendarDays size={25} className="mx-auto text-hpsr-wineLight" /><p className="mt-3 font-black text-hpsr-text">Selecione uma {selectedPlan.plan_type === "in_vitro" ? "etapa" : "consulta"}</p><p className="mt-1 text-sm text-hpsr-muted">Os campos individuais aparecem somente para o atendimento escolhido.</p></div>}

        {selectedOccurrence && individualStep && <div className="mt-4 space-y-4"><section className="rounded-[18px] border border-[#dac0b3] bg-[#fff8f3] p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Relatório individual</p><h4 className="mt-1 text-lg font-black text-hpsr-text">{selectedPlan.plan_type === "in_vitro" ? "Etapa" : "Consulta"} {individualStep.number} · {individualStep.marker}</h4><p className="mt-1 text-sm text-hpsr-muted">{formatDate(individualStep.date)} · {selectedOccurrence.appointment_id ? "Agendamento vinculado" : "Sem agendamento vinculado"} · {selectedOccurrence.individual_released_at ? "Liberada" : "Não liberada"}</p></div><div className="flex flex-wrap gap-2"><button type="button" disabled={!previousOccurrence || busy} onClick={() => previousOccurrence && requestOpenIndividual(previousOccurrence)} className="rounded-[10px] border border-[#d2b29f] bg-[#fffaf6] px-3 py-2 text-xs font-black text-hpsr-wine disabled:opacity-35">← Anterior</button><button type="button" disabled={!nextOccurrence || busy} onClick={() => nextOccurrence && requestOpenIndividual(nextOccurrence)} className="rounded-[10px] border border-[#d2b29f] bg-[#fffaf6] px-3 py-2 text-xs font-black text-hpsr-wine disabled:opacity-35">Próxima →</button></div></div></section>

          <section className="rounded-[18px] border border-[#dcc4b6] bg-[#fff7f1] p-4"><Field label="Planejamento previsto" hint="É o mesmo conteúdo da linha correspondente no planejamento integral."><textarea className={`${textAreaClass} min-h-[130px] text-[15px]`} maxLength={1800} value={individualPlanned} onChange={(event) => { setIndividualPlanned(event.target.value); setIndividualPreview(null); }} /></Field></section>

          <div className="grid gap-4 lg:grid-cols-2"><section className="rounded-[18px] border border-[#dcc4b6] bg-[#f8eee4] p-4"><Field label="Evolução / Observações médicas" hint="Registre de forma direta o que aconteceu na consulta."><textarea className={`${textAreaClass} min-h-[170px] text-[15px]`} maxLength={3600} value={individualEvolution} onChange={(event) => { setIndividualEvolution(event.target.value); setIndividualPreview(null); }} /></Field></section><section className="rounded-[18px] border border-[#dcc4b6] bg-[#f8eee4] p-4"><Field label="Exames e resultados" hint="Um único campo para resumir exames realizados e seus resultados."><textarea className={`${textAreaClass} min-h-[170px] text-[15px]`} maxLength={3600} value={reportExams} onChange={(event) => { setReportExams(event.target.value); setIndividualPreview(null); }} /></Field></section></div>

          <details className="rounded-[16px] border border-[#d7bbad] bg-[#f1ded0] px-4 py-3"><summary className="cursor-pointer select-none text-xs font-black uppercase tracking-[.12em] text-hpsr-wineLight">Anotação interna opcional</summary><div className="mt-3"><Field label="Anotação interna" hint="Somente equipe médica. Não aparece no PNG nem no Portal do Paciente."><textarea className={`${textAreaClass} min-h-[110px] text-[15px]`} maxLength={3600} value={individualObservation} onChange={(event) => { setIndividualObservation(event.target.value); setIndividualPreview(null); }} /></Field></div></details></div>}
      </div>
      <footer className="flex shrink-0 flex-col gap-3 border-t border-[#ddc6b7] bg-[#f4e4d8] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div><p className="text-xs font-bold text-hpsr-text">{selectedOccurrence ? `${selectedPlan.plan_type === "in_vitro" ? "Etapa" : "Consulta"} ${selectedOccurrence.step_number || ""}${individualDirty ? " · alterações não salvas" : ""}` : "Selecione uma consulta para editar"}</p><p className="mt-0.5 text-[11px] text-hpsr-muted">Salvar atualiza os dados internos e não libera automaticamente para a paciente.</p></div><div className="flex flex-wrap justify-end gap-2"><button type="button" disabled={busy} onClick={requestCloseIndividualEditor} className="rounded-[11px] border border-[#c9aa97] bg-[#fffaf6] px-4 py-2 text-sm font-black text-hpsr-wine disabled:opacity-40">Fechar</button><button type="button" disabled={busy || !selectedOccurrence} onClick={() => void generateIndividualPreview()} className="inline-flex items-center gap-2 rounded-[11px] border border-hpsr-wine bg-[#fff8f3] px-4 py-2 text-sm font-black text-hpsr-wine disabled:opacity-40"><FileImage size={16} />Gerar prévia individual</button><button type="button" disabled={busy || !selectedOccurrence || !individualDirty} onClick={() => void persistIndividual(false)} className="inline-flex items-center gap-2 rounded-[11px] bg-hpsr-wine px-4 py-2 text-sm font-black text-white disabled:opacity-40">{busy && <Loader2 size={16} className="animate-spin" />}{busy ? "Salvando..." : `Salvar ${selectedPlan.plan_type === "in_vitro" ? "etapa" : "consulta"}`}</button></div></footer>

      {pendingIndividualAction && <div className="absolute inset-0 z-20 grid place-items-center bg-[rgba(42,7,0,.72)] backdrop-blur-[1px] p-4"><div className="w-full max-w-[460px] rounded-[18px] border border-[#d5b7a4] bg-[#f9efe6] p-5 shadow-[0_20px_60px_rgba(62,21,12,.26)]"><p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Alterações não salvas</p><h3 className="mt-1 text-lg font-black text-hpsr-text">O que deseja fazer antes de continuar?</h3><p className="mt-2 text-sm leading-relaxed text-hpsr-muted">A consulta atual possui alterações que ainda não foram gravadas.</p><div className="mt-5 grid gap-2 sm:grid-cols-3"><button type="button" disabled={busy} onClick={() => void savePendingIndividualAndContinue()} className="rounded-[11px] bg-hpsr-wine px-3 py-2.5 text-xs font-black text-white disabled:opacity-40">Salvar e continuar</button><button type="button" disabled={busy} onClick={() => continuePendingIndividualAction()} className="rounded-[11px] border border-[#c9aa97] bg-white px-3 py-2.5 text-xs font-black text-hpsr-wine disabled:opacity-40">Descartar</button><button type="button" disabled={busy} onClick={() => setPendingIndividualAction(null)} className="rounded-[11px] border border-[#d8c3b7] bg-[#f3e5da] px-3 py-2.5 text-xs font-black text-hpsr-text disabled:opacity-40">Cancelar</button></div></div></div>}
    </div></div>, document.body)}

    {readyIntegralPreview && integralModalOpen && typeof document !== "undefined" && createPortal(<div className="hpsr-modal-tone fixed inset-0 z-[220] flex items-center justify-center bg-[rgba(42,7,0,.78)] backdrop-blur-[2px] p-2 sm:p-5"><button type="button" className="absolute inset-0" aria-label="Fechar" onClick={() => !busy && setIntegralModalOpen(false)} /><div className="relative flex max-h-[94dvh] w-full max-w-[1160px] flex-col overflow-hidden rounded-[22px] border border-[#d5b7a4] bg-[#f9efe6] shadow-[0_24px_80px_rgba(62,21,12,.28)]"><header className="relative flex items-center justify-between gap-3 border-b border-[#ddc6b7] bg-[linear-gradient(120deg,#f8eadf_0%,#f4e2d5_100%)] px-4 py-3 before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-hpsr-wine"><div><p className="text-[10px] font-black uppercase tracking-[.15em] text-hpsr-wineLight">Modelo integral aprovado</p><h2 className="text-lg font-black text-hpsr-text">{planTypeLabel(planType)} · conferência</h2></div><button type="button" disabled={busy} onClick={() => setIntegralModalOpen(false)} className="grid h-10 w-10 place-items-center rounded-[12px] border border-[#d3b39d] bg-white text-hpsr-wine"><X size={18} /></button></header><div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5"><CanvasPreviewSurface source={readyIntegralPreview.canvas} label="Prévia do planejamento integral" /></div><footer className="border-t border-[#ddc6b7] bg-[#f4e4d8] p-4">{editingPlan && <div className="mb-3 rounded-[14px] border border-[#d7bba6] bg-[#fff8f3] p-3"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-black text-hpsr-text">Consultas individuais</p><p className="mt-0.5 text-xs text-hpsr-muted">Abra uma consulta para editar, gerar a prévia individual e decidir a liberação separadamente.</p></div><span className="rounded-full border border-[#d8b9a9] bg-[#f5e8dc] px-2.5 py-1 text-[10px] font-black text-hpsr-wine">{confirmedSteps.length} {planType === "in_vitro" ? "etapas" : "consultas"}</span></div><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{confirmedSteps.map((step) => { const occurrence = occurrences.find((item) => Number(item.step_number || 0) === step.number); const released = Boolean(occurrence?.individual_released_at); return <button key={`integral-step-${step.number}`} type="button" disabled={!occurrence || busy} onClick={() => { setIntegralModalOpen(false); if (editingPlan) void openIndividualEditorAtStep(editingPlan, step.number); }} className={`flex min-h-[48px] items-center justify-between gap-3 rounded-[11px] border px-3 text-left text-xs font-black transition disabled:opacity-45 ${released ? "border-[#b8cdbf] bg-[#eef5f0] text-[#315b43]" : "border-[#d7b6a6] bg-white text-hpsr-wine hover:border-hpsr-wine"}`}><span>{planType === "in_vitro" ? `Etapa ${step.number}` : `Consulta ${step.number}`}</span><span className="text-[10px]">{released ? "Liberada" : occurrence ? "Editar / liberar" : "Salve primeiro"}</span></button>;})}</div></div>}<div className="flex flex-col gap-2 rounded-[14px] border border-[#d7bba6] bg-[#f3e1d0] p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-black text-hpsr-text">Liberar planejamento integral para a paciente</p><p className="text-xs text-hpsr-muted">Independente das liberações individuais.</p></div><button type="button" role="switch" aria-checked={releaseIntegralOnSave} onClick={() => setReleaseIntegralOnSave((value) => !value)} className={`relative h-8 w-14 rounded-full border-2 ${releaseIntegralOnSave ? "border-[#73362b] bg-hpsr-wine" : "border-[#c6a895] bg-[#e2d0c2]"}`}><span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${releaseIntegralOnSave ? "left-[26px]" : "left-0.5"}`} /></button></div><div className="mt-3 flex flex-wrap justify-end gap-2"><button type="button" disabled={busy} onClick={() => setIntegralModalOpen(false)} className="rounded-[12px] border border-[#c9aa97] px-4 py-2 text-sm font-bold text-hpsr-wine">Voltar</button><button type="button" onClick={() => void downloadCanvasPng(readyIntegralPreview.canvas, `planejamento-${planType}.png`).catch((caught) => setError(caught instanceof Error ? caught.message : "Não foi possível gerar o PNG solicitado."))} className="rounded-[12px] border border-hpsr-wine px-4 py-2 text-sm font-bold text-hpsr-wine">Baixar PNG</button><button type="button" disabled={busy} onClick={() => void saveIntegralPlan()} className="inline-flex items-center gap-2 rounded-[12px] bg-hpsr-wine px-5 py-2 text-sm font-black text-white disabled:opacity-50">{busy && <Loader2 size={16} className="animate-spin" />}{busy ? "Salvando..." : editingPlanId ? "Salvar atualização" : "Salvar planejamento"}</button></div></footer></div></div>, document.body)}

    {readyIndividualPreview && individualModalOpen && typeof document !== "undefined" && createPortal(<div className="hpsr-modal-tone fixed inset-0 z-[230] flex items-center justify-center bg-[rgba(42,7,0,.78)] backdrop-blur-[2px] p-2 sm:p-5"><button type="button" className="absolute inset-0" aria-label="Fechar" onClick={() => !busy && setIndividualModalOpen(false)} /><div className="relative flex max-h-[94dvh] w-full max-w-[1160px] flex-col overflow-hidden rounded-[22px] border border-[#d5b7a4] bg-[#f9efe6] shadow-[0_24px_80px_rgba(62,21,12,.28)]"><header className="relative flex items-center justify-between gap-3 border-b border-[#ddc6b7] bg-[linear-gradient(120deg,#f8eadf_0%,#f4e2d5_100%)] px-4 py-3 before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-hpsr-wine"><div><p className="text-[10px] font-black uppercase tracking-[.15em] text-hpsr-wineLight">Modelo individual aprovado</p><h2 className="text-lg font-black text-hpsr-text">{selectedPlan?.plan_type === "in_vitro" ? "Etapa" : "Consulta"} {individualStep?.number || ""} · conferência</h2></div><button type="button" disabled={busy} onClick={() => setIndividualModalOpen(false)} className="grid h-10 w-10 place-items-center rounded-[12px] border border-[#d3b39d] bg-white text-hpsr-wine"><X size={18} /></button></header><div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5"><CanvasPreviewSurface source={readyIndividualPreview.canvas} label="Prévia da consulta individual" /></div><footer className="border-t border-[#ddc6b7] bg-[#f4e4d8] p-4"><div className="flex flex-col gap-2 rounded-[14px] border border-[#d7bba6] bg-[#f3e1d0] p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-black text-hpsr-text">Liberar esta {selectedPlan?.plan_type === "in_vitro" ? "etapa" : "consulta"} individual</p><p className="text-xs text-hpsr-muted">A paciente recebe somente esta versão, sem liberar automaticamente o plano integral ou as outras consultas.</p></div><button type="button" role="switch" aria-checked={releaseIndividualOnSave} onClick={() => setReleaseIndividualOnSave((value) => !value)} className={`relative h-8 w-14 rounded-full border-2 ${releaseIndividualOnSave ? "border-[#73362b] bg-hpsr-wine" : "border-[#c6a895] bg-[#e2d0c2]"}`}><span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow ${releaseIndividualOnSave ? "left-[26px]" : "left-0.5"}`} /></button></div><div className="mt-3 flex flex-wrap justify-end gap-2"><button type="button" disabled={busy} onClick={() => setIndividualModalOpen(false)} className="rounded-[12px] border border-[#c9aa97] px-4 py-2 text-sm font-bold text-hpsr-wine">Voltar</button><button type="button" onClick={() => void downloadCanvasPng(readyIndividualPreview.canvas, `${selectedPlan?.plan_type === "in_vitro" ? "etapa" : "consulta"}-${individualStep?.number || "individual"}.png`).catch((caught) => setError(caught instanceof Error ? caught.message : "Não foi possível gerar o PNG solicitado."))} className="rounded-[12px] border border-hpsr-wine px-4 py-2 text-sm font-bold text-hpsr-wine">Baixar PNG</button><button type="button" disabled={busy} onClick={() => void saveIndividual()} className="inline-flex items-center gap-2 rounded-[12px] bg-hpsr-wine px-5 py-2 text-sm font-black text-white disabled:opacity-50">{busy && <Loader2 size={16} className="animate-spin" />}{busy ? "Salvando..." : `Salvar ${selectedPlan?.plan_type === "in_vitro" ? "etapa" : "consulta"}`}</button></div></footer></div></div>, document.body)}
  </div>;
}
