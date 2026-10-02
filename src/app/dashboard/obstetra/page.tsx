"use client";

import { Baby, CalendarDays, CheckCircle2, FileImage, HeartPulse, History, Loader2, Sparkles, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useCurrentUserProfile } from "@/components/auth/CurrentUserProfileProvider";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { usePatientSelection } from "@/components/patients/PatientSelectionProvider";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { canAccessObstetra, canManageReproductivePlan } from "@/lib/obstetra-access";
import { renderIndividualPlanning, renderIntegralPlanning } from "@/lib/obstetric-document";
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

const inputClass = "hpsr-planning-input h-11 w-full rounded-[14px] border border-hpsr-border bg-white px-3.5 text-sm font-semibold text-hpsr-text outline-none transition focus:border-hpsr-wine";
const textAreaClass = `${inputClass} min-h-[112px] resize-y py-3 leading-relaxed`;

type PlanningDocumentVersion = {
  path: string;
  at: string;
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
  conduct_text: string | null;
  individual_document_path: string | null;
  individual_released_document_path: string | null;
  individual_document_versions: Array<{ path: string; at: string }> | null;
  individual_released_at: string | null;
};

type PreviewState = { url: string; blob: Blob; signature: string };

type FieldProps = { label: string; children: React.ReactNode; hint?: string };
function Field({ label, children, hint }: FieldProps) {
  return <label className="hpsr-planning-field grid min-w-0 gap-1.5"><span className="hpsr-planning-field-label text-[10px] font-black uppercase tracking-[.15em] text-hpsr-wineLight">{label}</span>{children}{hint && <span className="text-[11px] leading-relaxed text-hpsr-muted">{hint}</span>}</label>;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return value.split("-").reverse().join("/");
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
    return <div className="hpsr-page gap-3"><PageHeader eyebrow="Especialidade médica" title="Obstetra" description="Acesso restrito a Obstetrícia e Ginecologia." /><section className="rounded-[18px] border border-[#dcb6bd] bg-[#fff8f4] p-5"><p className="font-bold text-hpsr-text">Acesso restrito à especialidade.</p><p className="mt-2 text-sm text-hpsr-muted">Somente profissionais médicos com Obstetrícia ou Ginecologia no perfil e membros da Direção podem acessar esta aba.</p><Link href="/dashboard" className="mt-4 inline-flex rounded-[12px] bg-hpsr-wine px-4 py-2 text-sm font-bold text-white">Voltar ao painel</Link></section></div>;
  }
  return <ObstetricianWorkspace />;
}

function ObstetricianWorkspace() {
  const { patients, selectedPassport, selectedPatient, selectPatient, loading } = usePatientSelection();
  const { profile } = useCurrentUserProfile();
  const [planType, setPlanType] = useState<PlanningKind>(() => canManageReproductivePlan(profile.role, profile.specialty, "gestacional") ? "gestacional" : "in_vitro");
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
  const [individualConduct, setIndividualConduct] = useState("");
  const [integralPreview, setIntegralPreview] = useState<PreviewState | null>(null);
  const [individualPreview, setIndividualPreview] = useState<PreviewState | null>(null);
  const [integralModalOpen, setIntegralModalOpen] = useState(false);
  const [individualModalOpen, setIndividualModalOpen] = useState(false);
  const [releaseIntegralOnSave, setReleaseIntegralOnSave] = useState(false);
  const [releaseIndividualOnSave, setReleaseIndividualOnSave] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [draftReadyFor, setDraftReadyFor] = useState("");
  const restoredDraftFor = useRef("");
  const lastDraftSnapshot = useRef("");

  const doctorName = profile.systemName || profile.characterName || "";
  const scheduleKey = planningKey(planType, startDate, endDate);
  const scheduleConfirmed = Boolean(confirmedKey && confirmedKey === scheduleKey && confirmedSteps.length);
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) || null;
  const selectedOccurrence = occurrences.find((occurrence) => occurrence.id === selectedOccurrenceId) || null;
  const confirmedAdvisories = useMemo(() => scheduleConfirmed ? planningAdvisories(planType, confirmedSteps, startDate, endDate) : [], [scheduleConfirmed, planType, confirmedSteps, startDate, endDate]);

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

  const individualSignature = useMemo(() => JSON.stringify({ plan: selectedPlanId, occurrence: selectedOccurrenceId, individualStep, individualEvolution, individualObservation, individualConduct, doctorName }), [selectedPlanId, selectedOccurrenceId, individualStep, individualEvolution, individualObservation, individualConduct, doctorName]);
  const readyIndividualPreview = individualPreview?.signature === individualSignature ? individualPreview : null;

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
        if (saved.selectedPassport !== selectedPassport) selectPatient(saved.selectedPassport);
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

  useEffect(() => () => {
    if (integralPreview?.url) URL.revokeObjectURL(integralPreview.url);
    if (individualPreview?.url) URL.revokeObjectURL(individualPreview.url);
  }, [integralPreview?.url, individualPreview?.url]);

  useEffect(() => {
    const lock = integralModalOpen || individualModalOpen;
    if (!lock) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [integralModalOpen, individualModalOpen]);

  function invalidateSchedule() {
    setSuggestion(null);
    setConfirmedKey("");
    setConfirmedSteps([]);
    setIntegralPreview(null);
  }

  /** Trocar paciente inicia um novo formulário; nunca transfere um plano existente. */
  function switchPlanningPatient(nextPassport: string, startNew = false) {
    if (busy || (!startNew && nextPassport === selectedPassport)) return;
    const hasDraft = Boolean(editingPlanId || startDate || endDate || planningNotes.trim() || confirmedSteps.length);
    if (hasDraft && !window.confirm(
      "Trocar de paciente ou iniciar outro planejamento? As alterações não salvas neste formulário serão descartadas. Os planejamentos já salvos continuarão no histórico."
    )) return;

    if (nextPassport !== selectedPassport) selectPatient(nextPassport);
    setEditingPlanId("");
    setStartDate("");
    setEndDate("");
    setPlanningNotes("");
    setSuggestion(null);
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
    setIndividualConduct("");
    setIndividualPreview(null);
    setIndividualModalOpen(false);
    setReleaseIndividualOnSave(false);
    setError("");
    setMessage(startNew ? "Formulário liberado para um novo planejamento." : "Paciente alterado. Comece um novo planejamento para o paciente selecionado.");
  }

  function changePlanType(next: PlanningKind) {
    if (!canManageReproductivePlan(profile.role, profile.specialty, next)) return;
    setPlanType(next);
    invalidateSchedule();
    setError("");
    setMessage("");
  }

  function changeStartDate(value: string) {
    setStartDate(value);
    invalidateSchedule();
  }

  function changeEndDate(value: string) {
    setEndDate(value);
    invalidateSchedule();
  }

  function handleSuggestSchedule() {
    setError("");
    setMessage("");
    const next = createPlanningSuggestion(planType, startDate, endDate);
    setSuggestion(next);
    setConfirmedKey("");
    setConfirmedSteps([]);
    setIntegralPreview(null);
    if (!next.valid) setError(next.warning);
    else if (next.warning) setMessage(next.warning);
    else setMessage("Sugestão gerada. A médica pode confirmar ou ajustar livremente as datas depois.");
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
      .select("id,doctor_id,doctor_name,patient_name,patient_passport,specialty,start_date,end_date,planning_notes,consultation_schedule,portal_released_at,total_consultations,status,created_at,plan_type,schedule_confirmed_at,planning_document_path,planning_released_document_path,planning_document_versions")
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
    if (!planId || !profile.id) { setOccurrences([]); return; }
    const client = createClient();
    if (!client) return;
    const { data, error: occurrenceError } = await client.from("clinical_followup_occurrences")
      .select("id,plan_id,doctor_id,patient_name,patient_passport,specialty,planned_date,status,appointment_id,slot_id,step_number,rp_marker,step_title,planned_text,evolution_text,medical_observation_text,conduct_text,individual_document_path,individual_released_document_path,individual_document_versions,individual_released_at")
      .eq("plan_id", planId).eq("doctor_id", profile.id).order("step_number", { ascending: true }).order("planned_date", { ascending: true });
    if (occurrenceError) { setError(occurrenceError.message); return; }
    setOccurrences((data || []) as FollowupOccurrence[]);
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
      const blob = await renderIntegralPlanning({ kind: planType, patient: selectedPatient.name, passport: selectedPatient.passport, doctor: doctorName, steps: confirmedSteps, referenceDate: endDate });
      const url = URL.createObjectURL(blob);
      if (integralPreview?.url) URL.revokeObjectURL(integralPreview.url);
      setIntegralPreview({ url, blob, signature: currentIntegralSignature });
      setReleaseIntegralOnSave(false);
      setIntegralModalOpen(true);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível gerar a prévia integral."); }
    finally { setBusy(false); }
  }

  async function syncOccurrences(client: NonNullable<ReturnType<typeof createClient>>, planId: string, kind: PlanningKind, patient: { name: string; passport: string }, steps: PlanningStep[]) {
    const specialty = specialtyForPlan(kind);
    const { data: existing, error: existingError } = await client.from("clinical_followup_occurrences")
      .select("id,step_number,appointment_id,slot_id,planned_date,planned_text,evolution_text,medical_observation_text,conduct_text").eq("plan_id", planId).eq("doctor_id", profile.id);
    if (existingError) throw existingError;
    const byStep = new Map((existing || []).filter((item) => item.step_number).map((item) => [Number(item.step_number), item]));
    const incomingNumbers = new Set(steps.map((step) => step.number));
    for (const current of (existing || [])) {
      const stepNumber = Number(current.step_number || 0);
      if (!stepNumber || incomingNumbers.has(stepNumber)) continue;
      if (current.appointment_id || current.slot_id || current.planned_text || current.evolution_text || current.medical_observation_text || current.conduct_text) {
        throw new Error(`A consulta/etapa ${stepNumber} possui dados ou agendamento e não pode ser removida automaticamente. Abra o registro e ajuste-o antes.`);
      }
      const { error: deleteError } = await client.from("clinical_followup_occurrences").delete().eq("id", current.id).eq("doctor_id", profile.id);
      if (deleteError) throw deleteError;
    }
    for (const step of steps) {
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
        const { error: updateError } = await client.from("clinical_followup_occurrences").update(payload).eq("id", current.id).eq("doctor_id", profile.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await client.from("clinical_followup_occurrences").insert({ ...payload, status: "Planejada" });
        if (insertError) throw insertError;
      }
    }
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
    let uploadedPath = "";
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

      uploadedPath = `${profile.id}/${planId}/integral/${crypto.randomUUID()}.png`;
      const { error: uploadError } = await client.storage.from("obstetric-plans").upload(uploadedPath, readyIntegralPreview.blob, { contentType: "image/png", upsert: false });
      if (uploadError) throw uploadError;
      const versions = previous?.planning_document_versions || [];
      const archived = previous?.planning_document_path ? [...versions, { path: previous.planning_document_path, at: now, start_date: previous.start_date, end_date: previous.end_date, consultation_schedule: previous.consultation_schedule || [], planning_notes: previous.planning_notes }] : versions;
      const { error: updateError } = await client.from("clinical_followup_plans").update({ ...payload, planning_document_path: uploadedPath, planning_document_versions: archived }).eq("id", planId).eq("doctor_id", profile.id);
      if (updateError) throw updateError;
      await syncOccurrences(client, planId, planType, selectedPatient, confirmedSteps);

      if (releaseIntegralOnSave) {
        const snapshot = { patient_name: selectedPatient.name, patient_passport: selectedPatient.passport, doctor_name: doctorName, specialty: specialtyForPlan(planType), start_date: startDate, end_date: endDate, planning_notes: planningNotes.trim() || null, consultation_schedule: confirmedSteps, total_consultations: confirmedSteps.length, plan_type: planType };
        const { error: releaseError } = await client.from("clinical_followup_plans").update({ portal_released_at: now, planning_released_document_path: uploadedPath, planning_released_snapshot: snapshot }).eq("id", planId).eq("doctor_id", profile.id);
        if (releaseError) throw releaseError;
      }

      setIntegralModalOpen(false);
      setReleaseIntegralOnSave(false);
      setEditingPlanId("");
      setMessage(releaseIntegralOnSave ? "Planejamento integral salvo e liberado para a paciente." : "Planejamento integral salvo. A liberação para a paciente permanece independente.");
      try { sessionStorage.removeItem(obstetricDraftKey(profile.id)); } catch { /* opcional */ }
      await loadHistory(planId);
      await loadOccurrences(planId);
    } catch (caught) {
      if (uploadedPath && createdId) await client.storage.from("obstetric-plans").remove([uploadedPath]);
      if (createdId) await client.from("clinical_followup_plans").delete().eq("id", createdId).eq("doctor_id", profile.id);
      setError(caught instanceof Error ? caught.message : "Não foi possível salvar o planejamento.");
    } finally { setBusy(false); }
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function releaseCurrentIntegral(plan: ObstetricPlan) {
    if (!plan.planning_document_path || !profile.id) return;
    if (!window.confirm(`Liberar a versão integral atual de ${plan.patient_name} para a paciente?`)) return;
    const client = createClient();
    if (!client) return;
    setBusy(true); setError("");
    try {
      const now = new Date().toISOString();
      const snapshot = { patient_name: plan.patient_name, patient_passport: plan.patient_passport, doctor_name: plan.doctor_name, specialty: plan.specialty, start_date: plan.start_date, end_date: plan.end_date, planning_notes: plan.planning_notes, consultation_schedule: plan.consultation_schedule, total_consultations: plan.total_consultations, plan_type: plan.plan_type };
      const { error: releaseError } = await client.from("clinical_followup_plans").update({ portal_released_at: now, planning_released_document_path: plan.planning_document_path, planning_released_snapshot: snapshot }).eq("id", plan.id).eq("doctor_id", profile.id);
      if (releaseError) throw releaseError;
      setMessage("Planejamento integral liberado para a paciente.");
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
    if (!window.confirm(`Excluir o planejamento ${planTypeLabel(plan.plan_type)} de ${plan.patient_name}? Consultas já realizadas permanecem no histórico clínico.`)) return;
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

  function openIndividual(occurrence: FollowupOccurrence) {
    setSelectedOccurrenceId(occurrence.id);
    setIndividualPlanned(occurrence.planned_text || "");
    setIndividualEvolution(occurrence.evolution_text || "");
    setIndividualObservation(occurrence.medical_observation_text || "");
    setIndividualConduct(occurrence.conduct_text || "");
    setIndividualPreview(null);
    setReleaseIndividualOnSave(false);
    setError("");
    setMessage("");
  }

  async function generateIndividualPreview() {
    if (!selectedPlan || !selectedOccurrence || !individualStep) return setError("Selecione uma consulta/etapa individual.");
    setBusy(true); setError("");
    try {
      const blob = await renderIndividualPlanning({ kind: selectedPlan.plan_type, patient: selectedPlan.patient_name, passport: selectedPlan.patient_passport, doctor: selectedPlan.doctor_name, step: individualStep, evolution: individualEvolution, observation: individualObservation, conduct: individualConduct });
      const url = URL.createObjectURL(blob);
      if (individualPreview?.url) URL.revokeObjectURL(individualPreview.url);
      setIndividualPreview({ url, blob, signature: individualSignature });
      setIndividualModalOpen(true);
      setReleaseIndividualOnSave(false);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível gerar a prévia individual."); }
    finally { setBusy(false); }
  }

  async function updateIntegralAfterIndividual(client: NonNullable<ReturnType<typeof createClient>>, plan: ObstetricPlan, occurrence: FollowupOccurrence, newPlannedText: string) {
    const schedule = normalizePlanningSteps(plan.plan_type, plan.consultation_schedule || []).map((step) => step.number === occurrence.step_number ? { ...step, planned_text: newPlannedText, description: newPlannedText } : step);
    if (!schedule.length) return;
    const blob = await renderIntegralPlanning({ kind: plan.plan_type, patient: plan.patient_name, passport: plan.patient_passport, doctor: plan.doctor_name, steps: schedule, referenceDate: plan.end_date || "" });
    const now = new Date().toISOString();
    const path = `${profile.id}/${plan.id}/integral/${crypto.randomUUID()}.png`;
    const { error: uploadError } = await client.storage.from("obstetric-plans").upload(path, blob, { contentType: "image/png", upsert: false });
    if (uploadError) throw uploadError;
    const versions = plan.planning_document_versions || [];
    const archived = plan.planning_document_path ? [...versions, { path: plan.planning_document_path, at: now, start_date: plan.start_date, end_date: plan.end_date, consultation_schedule: plan.consultation_schedule || [], planning_notes: plan.planning_notes }] : versions;
    const { error: planError } = await client.from("clinical_followup_plans").update({ consultation_schedule: schedule, planning_document_path: path, planning_document_versions: archived, updated_at: now }).eq("id", plan.id).eq("doctor_id", profile.id);
    if (planError) throw planError;
  }

  async function saveIndividual() {
    if (!readyIndividualPreview || !selectedPlan || !selectedOccurrence || !individualStep || !profile.id) return setError("Gere e confira a prévia individual antes de salvar.");
    if (!canManageReproductivePlan(profile.role, profile.specialty, selectedPlan.plan_type)) return setError("Seu perfil não possui autorização para esta modalidade.");
    if (!(await hasRequiredPatientLink(selectedPlan.plan_type, selectedPlan.patient_passport))) return setError("O vínculo médico-paciente da especialidade não está ativo. Regularize o vínculo antes de salvar.");
    const client = createClient();
    if (!client) return;
    setBusy(true); setError(""); setMessage("");
    let uploadedPath = "";
    try {
      const now = new Date().toISOString();
      uploadedPath = `${profile.id}/${selectedPlan.id}/individual/${selectedOccurrence.id}/${crypto.randomUUID()}.png`;
      const { error: uploadError } = await client.storage.from("obstetric-plans").upload(uploadedPath, readyIndividualPreview.blob, { contentType: "image/png", upsert: false });
      if (uploadError) throw uploadError;
      const versions = selectedOccurrence.individual_document_versions || [];
      const archived = selectedOccurrence.individual_document_path ? [...versions, { path: selectedOccurrence.individual_document_path, at: now }] : versions;
      const updatePayload: Record<string, unknown> = {
        planned_text: individualPlanned.trim() || null,
        evolution_text: individualEvolution.trim() || null,
        medical_observation_text: individualObservation.trim() || null,
        conduct_text: individualConduct.trim() || null,
        rp_marker: individualStep.marker,
        step_title: individualStep.title,
        individual_document_path: uploadedPath,
        individual_document_versions: archived,
        updated_at: now,
      };
      if (releaseIndividualOnSave) {
        updatePayload.individual_released_at = now;
        updatePayload.individual_released_document_path = uploadedPath;
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
          conduct_text: individualConduct.trim(),
        };
      }
      const { error: occurrenceError } = await client.from("clinical_followup_occurrences").update(updatePayload).eq("id", selectedOccurrence.id).eq("doctor_id", profile.id);
      if (occurrenceError) throw occurrenceError;

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
        conduct: individualConduct.trim(),
      };
      const recordId = `followup-${selectedOccurrence.id}`;
      const { error: clinicalError } = await client.from("clinical_records").upsert({
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
      }, { onConflict: "id" });
      if (clinicalError) throw clinicalError;

      setIndividualModalOpen(false);
      setMessage(releaseIndividualOnSave ? `${selectedPlan.plan_type === "in_vitro" ? "Etapa" : "Consulta"} ${individualStep.number} salva e liberada individualmente para a paciente.` : `${selectedPlan.plan_type === "in_vitro" ? "Etapa" : "Consulta"} ${individualStep.number} salva. A liberação individual permanece independente.`);
      await loadHistory(selectedPlan.id);
      await loadOccurrences(selectedPlan.id);
    } catch (caught) {
      if (uploadedPath) await client.storage.from("obstetric-plans").remove([uploadedPath]);
      setError(caught instanceof Error ? caught.message : "Não foi possível salvar a consulta individual.");
    } finally { setBusy(false); }
  }

  return <div className="hpsr-obstetra-page space-y-5" data-planning-kind={planType}>
    <PageHeader eyebrow="Especialidade médica" title="Obstetra" description="Planejamento Gestacional e FIV com cronograma sugerido, confirmação médica e registros individuais." />

    <section className="hpsr-obstetric-overview rounded-[22px] border border-[#e1c9b8] bg-[linear-gradient(120deg,#f8ecdf_0%,#f4e3d7_100%)] p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div className="flex min-w-0 items-center gap-3"><div className="hpsr-obstetric-icon hpsr-obstetric-icon-hero grid h-12 w-12 shrink-0 place-items-center rounded-[16px] bg-[linear-gradient(135deg,#672614,#2a0700)] text-white"><HeartPulse size={22} /></div><div><p className="hpsr-obstetric-accent-label text-[10px] font-black uppercase tracking-[.16em] text-hpsr-wineLight">Planejamento médico</p><h2 className="mt-1 text-2xl font-black leading-tight text-hpsr-text">{planType === "in_vitro" ? "Fertilização in vitro" : "Planejamento gestacional"}</h2><p className="mt-1 max-w-2xl text-sm leading-relaxed text-hpsr-muted">As semanas são marcadores do RP. O cálculo usa apenas o calendário real e nunca converte esses marcadores em semanas reais.</p></div></div><div className="grid gap-2 sm:grid-cols-3 lg:min-w-[420px]"><div className="rounded-[16px] bg-[#f5e5d9] px-4 py-3 ring-1 ring-[#ddc1b1]"><p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Início</p><p className="mt-1 text-lg font-black text-hpsr-text">{formatDate(startDate)}</p></div><div className="rounded-[16px] bg-[#f5e5d9] px-4 py-3 ring-1 ring-[#ddc1b1]"><p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Cronograma</p><p className="mt-1 text-lg font-black text-hpsr-text">{scheduleConfirmed ? "Confirmado" : "Pendente"}</p></div><div className="rounded-[16px] bg-[#f5e5d9] px-4 py-3 ring-1 ring-[#ddc1b1]"><p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Final · referência</p><p className="mt-1 text-lg font-black text-hpsr-text">{formatDate(endDate)}</p></div></div></div>
    </section>

    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.03fr)_minmax(390px,0.97fr)]">
      <section className="hpsr-planning-panel hpsr-gestational-form rounded-[24px] border border-[#ad7665] p-4 shadow-[0_14px_34px_rgba(125,35,29,0.08)] sm:p-5">
        <div className="flex items-center gap-3"><div className="hpsr-obstetric-icon grid h-11 w-11 place-items-center rounded-[14px] bg-[linear-gradient(135deg,#672614,#2a0700)] text-white"><Baby size={20} /></div><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-hpsr-wineLight">Dados do planejamento</p><h3 className="text-lg font-black text-hpsr-text">Definição médica</h3><p className="text-sm text-hpsr-muted">O sistema sugere e orienta; a médica pode alterar o cronograma e decide o que será salvo.</p></div></div>
        <div className="mt-5 grid gap-4">
          <div className="grid gap-2">
            <Field label="Paciente" hint={editingPlanId ? "Você está editando um planejamento salvo. Trocar de paciente abre um novo formulário e mantém o planejamento original intacto." : "Selecione qualquer paciente cadastrado. Nome e passaporte são preenchidos automaticamente."}>
              <StyledSelect value={selectedPassport} onChange={(event) => switchPlanningPatient(event.target.value)} searchable disabled={loading || busy}>
                <option value="">{loading ? "Carregando pacientes..." : "Selecionar paciente"}</option>
                {patients.map((patient) => <option key={patient.passport} value={patient.passport}>{patient.name} · {patient.passport}</option>)}
              </StyledSelect>
            </Field>
            {editingPlanId && <button type="button" disabled={busy} onClick={() => switchPlanningPatient(selectedPassport, true)} className="w-fit rounded-[12px] border border-[#c8a992] bg-white px-3 py-2 text-xs font-black text-hpsr-wine transition hover:bg-[#fff5ee] disabled:opacity-50">Encerrar edição · Novo planejamento</button>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Nome do paciente"><input className={`${inputClass} bg-[#f8efe5]`} value={selectedPatient?.name || ""} readOnly /></Field><Field label="Passaporte"><input className={`${inputClass} bg-[#f8efe5]`} value={selectedPatient?.passport || ""} readOnly /></Field><Field label="Médico responsável"><input className={`${inputClass} bg-[#f8efe5]`} value={doctorName} readOnly /></Field><Field label="Modelo"><StyledSelect value={planType} disabled={Boolean(editingPlanId)} onChange={(event) => changePlanType(event.target.value as PlanningKind)}>{canManageReproductivePlan(profile.role, profile.specialty, "gestacional") && <option value="gestacional">Planejamento Gestacional</option>}{canManageReproductivePlan(profile.role, profile.specialty, "in_vitro") && <option value="in_vitro">Fertilização in vitro</option>}</StyledSelect></Field><Field label="Data inicial" hint={`O cronograma será sugerido em ${planType === "in_vitro" ? "terças-feiras" : "quartas-feiras"}.`}><input className={inputClass} type="date" value={startDate} onChange={(event) => changeStartDate(event.target.value)} /></Field><Field label="Data final · referência" hint={planType === "in_vitro" ? "Limite de referência do planejamento FIV; não cria uma sexta consulta." : "Data prevista de referência para o parto; não gera agendamento automático."}><input className={inputClass} type="date" min={startDate || undefined} value={endDate} onChange={(event) => changeEndDate(event.target.value)} /></Field></div>
          <Field label="Observações gerais" hint="Registro interno do planejamento; não substitui os campos individuais."><textarea className={textAreaClass} maxLength={4000} value={planningNotes} onChange={(event) => { setPlanningNotes(event.target.value); setIntegralPreview(null); }} placeholder="Observações gerais da médica sobre o planejamento" /></Field>
          <div className="flex flex-wrap gap-2"><button type="button" disabled={!startDate || !endDate || busy} onClick={handleSuggestSchedule} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[14px] border border-hpsr-wine bg-white px-4 text-sm font-black text-hpsr-wine disabled:opacity-50"><CalendarDays size={17} />Sugerir cronograma</button>{suggestion?.valid && suggestion.key === scheduleKey && !scheduleConfirmed && <button type="button" disabled={busy} onClick={confirmSuggestion} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[14px] bg-hpsr-wine px-4 text-sm font-black text-white"><CheckCircle2 size={17} />Confirmar sugestão</button>}</div>
          {suggestion && suggestion.key === scheduleKey && <div className={`rounded-[15px] border p-3 ${suggestion.valid ? "border-emerald-200 bg-emerald-50/70" : "border-amber-200 bg-amber-50"}`}><p className="text-sm font-black text-hpsr-text">{suggestion.foundCount} de {suggestion.expectedCount} datas esperadas</p><p className="mt-1 text-xs leading-relaxed text-hpsr-muted">{suggestion.warning || `Período compatível. Confira as ${suggestion.targetWeekdayLabel}s abaixo e confirme.`}</p><div className="mt-2 flex flex-wrap gap-1.5">{suggestion.candidateDates.map((date) => <span key={date} className="rounded-full border border-[#dec4b5] bg-white px-2.5 py-1 text-xs font-bold text-hpsr-text">{formatDate(date)}</span>)}</div></div>}
          {scheduleConfirmed && <div className="rounded-[15px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800"><CheckCircle2 size={16} className="mr-2 inline" />Cronograma confirmado pela médica. Nenhuma consulta foi criada no Agendamento.</div>}{scheduleConfirmed && confirmedAdvisories.length > 0 && <div className="rounded-[15px] border border-amber-200 bg-amber-50 px-3 py-2"><p className="text-sm font-black text-amber-900">Recomendações do sistema</p><p className="mt-1 text-xs leading-relaxed text-amber-800">{confirmedAdvisories.join(" ")} São apenas orientações: você pode salvar exatamente o cronograma definido.</p></div>}
        </div>
      </section>

      <section className="hpsr-planning-panel hpsr-obstetric-stage-preview overflow-hidden rounded-[24px] border border-[#e1c5cb] shadow-sm">
        <div className="border-b border-[#e6d0cd] bg-[linear-gradient(115deg,#fbf3eb_0%,#f5e7e1_100%)] px-4 py-4"><p className="text-[10px] font-black uppercase tracking-[.14em] text-[#a45a76]">Conteúdo integral</p><h3 className="mt-0.5 text-[16px] font-black text-hpsr-text">Planejamento previsto por consulta</h3><p className="mt-1 text-xs text-hpsr-muted">O mesmo conteúdo abastece o modelo integral e o individual.</p></div>
        {scheduleConfirmed ? <div className="grid max-h-[720px] gap-3 overflow-y-auto p-3 sm:p-4 [scrollbar-gutter:stable]">{confirmedSteps.map((step, index) => <article key={`${step.number}-${index}`} className="hpsr-planning-step-card rounded-[15px] border border-[#e6d0c1] bg-[#fffaf6] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-black text-hpsr-text">{planType === "in_vitro" ? `Etapa ${step.number}` : `Consulta ${step.number}`}</p><button type="button" onClick={() => removeConfirmedStep(index)} disabled={confirmedSteps.length <= 1} className="inline-flex items-center gap-1 rounded-[10px] border border-[#dfb7aa] px-2.5 py-1.5 text-xs font-bold text-hpsr-wine disabled:opacity-40"><Trash2 size={14} />Remover</button></div><div className="mt-3 grid gap-3 sm:grid-cols-2"><Field label="Data"><input type="date" className={inputClass} value={step.date} onChange={(event) => updateConfirmedStep(index, { date: event.target.value })} /></Field><Field label={planType === "in_vitro" ? "Etapa / marco" : "Semana / marco"}><input className={inputClass} value={step.marker} maxLength={120} onChange={(event) => updateConfirmedStep(index, { marker: event.target.value })} /></Field></div>{planType === "in_vitro" && <input className={`${inputClass} mt-3`} value={step.title} maxLength={120} onChange={(event) => updateConfirmedStep(index, { title: event.target.value })} placeholder={`Título da etapa ${step.number}`} />}<textarea className={`${textAreaClass} mt-3 min-h-[92px]`} maxLength={1000} value={step.planned_text || ""} onChange={(event) => updateConfirmedStep(index, { planned_text: event.target.value, description: event.target.value })} placeholder="Planejamento previsto para esta consulta/etapa" /></article>)}<button type="button" onClick={addConfirmedStep} className="min-h-11 rounded-[14px] border border-dashed border-hpsr-wine bg-[#fff8f3] px-4 text-sm font-black text-hpsr-wine">+ Adicionar {planType === "in_vitro" ? "etapa" : "consulta"}</button></div> : <div className="px-5 py-12 text-center"><CalendarDays size={28} className="mx-auto text-[#b87a91]" /><p className="mt-3 font-black text-hpsr-text">Aguardando confirmação</p><p className="mt-1 text-sm text-hpsr-muted">Informe o período, peça a sugestão e confirme. Depois você pode editar, incluir ou remover datas livremente.</p></div>}
      </section>
    </div>

    <div className="flex flex-col items-center gap-2"><button type="button" disabled={busy || !scheduleConfirmed || !selectedPatient} onClick={() => void generateIntegralPreview()} className="hpsr-obstetric-primary-action inline-flex min-h-[52px] w-full max-w-[390px] items-center justify-center gap-2 rounded-[17px] bg-hpsr-wine px-5 text-sm font-black text-white disabled:opacity-50">{busy ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}{busy ? "Preparando..." : "Gerar prévia integral"}</button><p className="text-center text-xs text-hpsr-muted">A prévia usa o modelo aprovado. Avisos de padrão são orientativos e nunca impedem a decisão médica.</p></div>
    {message && <p className="rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{message}</p>}
    {error && <p role="alert" className="rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">{error}</p>}

    <section className="hpsr-planning-panel hpsr-gestational-history rounded-[24px] border p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-3"><div className="hpsr-obstetric-icon grid h-11 w-11 place-items-center rounded-[14px] bg-[linear-gradient(135deg,#672614,#2a0700)] text-white"><History size={20} /></div><div><h3 className="text-lg font-black text-hpsr-text">Histórico de planejamentos</h3><p className="text-sm text-hpsr-muted">Integral e consultas individuais permanecem vinculados ao mesmo planejamento.</p></div></div>
      {plans.length === 0 ? <div className="mt-4 rounded-[18px] border border-dashed border-hpsr-border bg-[#f5e8db] px-4 py-8 text-center text-sm text-hpsr-muted">Nenhum planejamento Gestacional/FIV criado por esta médica.</div> : <div className="mt-4 grid gap-3 lg:grid-cols-2">{plans.map((plan) => <article key={plan.id} onClick={() => setSelectedPlanId(plan.id)} className={`hpsr-planning-history-item cursor-pointer rounded-[18px] border p-4 transition ${selectedPlanId === plan.id ? "border-hpsr-wine bg-[#fff1ec] ring-2 ring-hpsr-wine/15" : "border-[#d9bead] bg-[#efdfd0] hover:border-[#cfa9a3]"}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-black text-hpsr-text">{plan.patient_name}</p><p className="mt-0.5 text-xs font-black text-hpsr-wine">{planTypeLabel(plan.plan_type)}</p><p className="mt-0.5 text-xs text-hpsr-muted">{formatDate(plan.start_date)} → referência {formatDate(plan.end_date)}</p></div><div className="flex flex-wrap justify-end gap-1">{plan.portal_released_at && <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-800">Integral liberado</span>}<span className="rounded-full bg-[#f3dfda] px-2 py-1 text-[10px] font-black text-hpsr-wine">{plan.status}</span></div></div><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={(event) => { event.stopPropagation(); beginEditing(plan); }} className="rounded-[10px] border border-[#c8a992] px-3 py-2 text-xs font-black text-hpsr-wine">Editar integral</button><button type="button" disabled={!plan.planning_document_path} onClick={(event) => { event.stopPropagation(); void openStoredDocument(plan.planning_document_path); }} className="rounded-[10px] border border-[#c8a992] px-3 py-2 text-xs font-black text-hpsr-wine disabled:opacity-40">Visualizar PNG</button><button type="button" disabled={!plan.planning_document_path || busy} onClick={(event) => { event.stopPropagation(); void releaseCurrentIntegral(plan); }} className="rounded-[10px] border border-emerald-300 px-3 py-2 text-xs font-black text-emerald-800 disabled:opacity-40">Liberar integral</button><button type="button" disabled={busy} onClick={(event) => { event.stopPropagation(); void deletePlan(plan); }} className="rounded-[10px] border border-red-200 px-3 py-2 text-xs font-black text-red-700 disabled:opacity-40"><Trash2 size={13} className="mr-1 inline" />Excluir</button></div></article>)}</div>}
    </section>

    {selectedPlan && <section className="hpsr-planning-panel rounded-[24px] border border-[#d9beb1] bg-[#fbf2e8] p-4 shadow-sm sm:p-5"><div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.15em] text-hpsr-wineLight">Planejamento selecionado</p><h3 className="mt-1 text-lg font-black text-hpsr-text">Consultas/etapas individuais · {selectedPlan.patient_name}</h3><p className="text-sm text-hpsr-muted">Cada registro tem planejamento, evolução, conduta e liberação próprios.</p></div><span className="rounded-full border border-[#dec1b2] bg-white px-3 py-1.5 text-xs font-black text-hpsr-wine">{planTypeLabel(selectedPlan.plan_type)}</span></div>
      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">{occurrences.map((occurrence) => <button key={occurrence.id} type="button" aria-pressed={selectedOccurrenceId === occurrence.id} onClick={() => openIndividual(occurrence)} className={`hpsr-planning-visit-card rounded-[15px] border p-3 text-left transition ${selectedOccurrenceId === occurrence.id ? "border-hpsr-wine bg-[#fff7f1] ring-2 ring-hpsr-wine/10" : "border-[#dec8bb] bg-[#f5e9dd] hover:border-[#bc8c78]"}`}><div className="flex items-start justify-between gap-2"><p className="font-black text-hpsr-text">{selectedPlan.plan_type === "in_vitro" ? "Etapa" : "Consulta"} {occurrence.step_number || "—"}</p>{occurrence.individual_released_at && <span className="rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-black text-emerald-800">Liberada</span>}</div><p className="mt-1 text-xs font-bold text-hpsr-wine">{occurrence.rp_marker || "Marco não informado"}</p><p className="mt-1 text-xs text-hpsr-muted">{formatDate(occurrence.planned_date)} · {occurrence.status}</p></button>)}</div>

      {selectedOccurrence && individualStep && <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]"><div className="hpsr-planning-individual-form min-w-0 rounded-[18px] border border-[#dbc4b7] bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Modelo individual</p><h4 className="mt-1 text-lg font-black text-hpsr-text">{selectedPlan.plan_type === "in_vitro" ? "Etapa" : "Consulta"} {individualStep.number} · {individualStep.marker}</h4></div><span className="rounded-full bg-[#f5e4d9] px-3 py-1.5 text-xs font-black text-hpsr-wine">{formatDate(individualStep.date)}</span></div><div className="mt-4 grid gap-4"><Field label="Planejamento previsto" hint="Compartilhado com a linha correspondente do planejamento integral."><textarea className={textAreaClass} maxLength={1800} value={individualPlanned} onChange={(event) => { setIndividualPlanned(event.target.value); setIndividualPreview(null); }} /></Field><Field label="Evolução" hint="Registro do que efetivamente aconteceu no atendimento."><textarea className={textAreaClass} maxLength={2400} value={individualEvolution} onChange={(event) => { setIndividualEvolution(event.target.value); setIndividualPreview(null); }} /></Field><Field label="Observação médica" hint="Registro interno exclusivo desta consulta/etapa; não entra no PNG integral."><textarea className={textAreaClass} maxLength={2400} value={individualObservation} onChange={(event) => { setIndividualObservation(event.target.value); setIndividualPreview(null); }} /></Field><Field label="Conduta / Retorno" hint="Conduta definida após o atendimento."><textarea className={textAreaClass} maxLength={1800} value={individualConduct} onChange={(event) => { setIndividualConduct(event.target.value); setIndividualPreview(null); }} /></Field></div><button type="button" disabled={busy} onClick={() => void generateIndividualPreview()} className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-[14px] bg-hpsr-wine px-4 text-sm font-black text-white disabled:opacity-50"><FileImage size={17} />Gerar prévia individual</button></div><aside className="hpsr-planning-context self-start rounded-[18px] border border-[#dbc4b7] bg-[#fffaf5] p-4"><p className="text-xs font-black uppercase tracking-[.14em] text-hpsr-wineLight">Vínculo operacional</p><dl className="mt-3 grid gap-3 text-sm"><div><dt className="text-xs font-bold text-hpsr-muted">Paciente</dt><dd className="font-black text-hpsr-text">{selectedPlan.patient_name}</dd></div><div><dt className="text-xs font-bold text-hpsr-muted">Especialidade</dt><dd className="font-black text-hpsr-text">{selectedPlan.specialty}</dd></div><div><dt className="text-xs font-bold text-hpsr-muted">Agendamento</dt><dd className="font-black text-hpsr-text">{selectedOccurrence.appointment_id ? "Consulta vinculada" : "Pendente de agendamento"}</dd></div><div><dt className="text-xs font-bold text-hpsr-muted">Liberação individual</dt><dd className="font-black text-hpsr-text">{selectedOccurrence.individual_released_at ? formatDate(selectedOccurrence.individual_released_at.slice(0, 10)) : "Não liberada"}</dd></div></dl><p className="mt-4 text-xs leading-relaxed text-hpsr-muted">O planejamento não cria vaga nem horário. O Agendamento continua usando somente os horários publicados pelo médico.</p></aside></div>}
    </section>}

    {readyIntegralPreview && integralModalOpen && typeof document !== "undefined" && createPortal(<div className="hpsr-modal-tone fixed inset-0 z-[220] flex items-center justify-center bg-[#26140fe0] p-2 sm:p-5"><button type="button" className="absolute inset-0" aria-label="Fechar" onClick={() => !busy && setIntegralModalOpen(false)} /><div className="relative flex max-h-[94dvh] w-full max-w-[1160px] flex-col overflow-hidden rounded-[22px] border border-[#c9a78f] bg-[#f8eee3] shadow-2xl"><header className="flex items-center justify-between gap-3 border-b border-[#d7bba6] px-4 py-3"><div><p className="text-[10px] font-black uppercase tracking-[.15em] text-hpsr-wineLight">Modelo integral aprovado</p><h2 className="text-lg font-black text-hpsr-text">{planTypeLabel(planType)} · conferência</h2></div><button type="button" disabled={busy} onClick={() => setIntegralModalOpen(false)} className="grid h-10 w-10 place-items-center rounded-[12px] border border-[#d3b39d] bg-white text-hpsr-wine"><X size={18} /></button></header><div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5"><img src={readyIntegralPreview.url} alt="Prévia do planejamento integral" className="mx-auto h-auto w-full max-w-[1040px] rounded-[10px] border border-[#dec5b2] bg-white shadow-sm" /></div><footer className="border-t border-[#d7bba6] bg-[#f8ebdc] p-4"><div className="flex flex-col gap-2 rounded-[14px] border border-[#d7bba6] bg-[#f3e1d0] p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-black text-hpsr-text">Liberar planejamento integral para a paciente</p><p className="text-xs text-hpsr-muted">Independente das liberações individuais.</p></div><button type="button" role="switch" aria-checked={releaseIntegralOnSave} onClick={() => setReleaseIntegralOnSave((value) => !value)} className={`relative h-8 w-14 rounded-full border-2 ${releaseIntegralOnSave ? "border-[#73362b] bg-hpsr-wine" : "border-[#c6a895] bg-[#e2d0c2]"}`}><span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${releaseIntegralOnSave ? "left-[26px]" : "left-0.5"}`} /></button></div><div className="mt-3 flex flex-wrap justify-end gap-2"><button type="button" disabled={busy} onClick={() => setIntegralModalOpen(false)} className="rounded-[12px] border border-[#c9aa97] px-4 py-2 text-sm font-bold text-hpsr-wine">Voltar</button><a href={readyIntegralPreview.url} download={`planejamento-${planType}.png`} className="rounded-[12px] border border-hpsr-wine px-4 py-2 text-sm font-bold text-hpsr-wine">Baixar prévia</a><button type="button" disabled={busy} onClick={() => void saveIntegralPlan()} className="inline-flex items-center gap-2 rounded-[12px] bg-hpsr-wine px-5 py-2 text-sm font-black text-white disabled:opacity-50">{busy && <Loader2 size={16} className="animate-spin" />}{editingPlanId ? "Salvar atualização" : "Salvar planejamento"}</button></div></footer></div></div>, document.body)}

    {readyIndividualPreview && individualModalOpen && typeof document !== "undefined" && createPortal(<div className="hpsr-modal-tone fixed inset-0 z-[230] flex items-center justify-center bg-[#26140fe0] p-2 sm:p-5"><button type="button" className="absolute inset-0" aria-label="Fechar" onClick={() => !busy && setIndividualModalOpen(false)} /><div className="relative flex max-h-[94dvh] w-full max-w-[1160px] flex-col overflow-hidden rounded-[22px] border border-[#c9a78f] bg-[#f8eee3] shadow-2xl"><header className="flex items-center justify-between gap-3 border-b border-[#d7bba6] px-4 py-3"><div><p className="text-[10px] font-black uppercase tracking-[.15em] text-hpsr-wineLight">Modelo individual aprovado</p><h2 className="text-lg font-black text-hpsr-text">{selectedPlan?.plan_type === "in_vitro" ? "Etapa" : "Consulta"} {individualStep?.number || ""} · conferência</h2></div><button type="button" disabled={busy} onClick={() => setIndividualModalOpen(false)} className="grid h-10 w-10 place-items-center rounded-[12px] border border-[#d3b39d] bg-white text-hpsr-wine"><X size={18} /></button></header><div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5"><img src={readyIndividualPreview.url} alt="Prévia da consulta individual" className="mx-auto h-auto w-full max-w-[1040px] rounded-[10px] border border-[#dec5b2] bg-white shadow-sm" /></div><footer className="border-t border-[#d7bba6] bg-[#f8ebdc] p-4"><div className="flex flex-col gap-2 rounded-[14px] border border-[#d7bba6] bg-[#f3e1d0] p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-black text-hpsr-text">Liberar esta consulta individual</p><p className="text-xs text-hpsr-muted">A paciente recebe somente esta versão, sem liberar automaticamente o plano integral ou as outras consultas.</p></div><button type="button" role="switch" aria-checked={releaseIndividualOnSave} onClick={() => setReleaseIndividualOnSave((value) => !value)} className={`relative h-8 w-14 rounded-full border-2 ${releaseIndividualOnSave ? "border-[#73362b] bg-hpsr-wine" : "border-[#c6a895] bg-[#e2d0c2]"}`}><span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow ${releaseIndividualOnSave ? "left-[26px]" : "left-0.5"}`} /></button></div><div className="mt-3 flex flex-wrap justify-end gap-2"><button type="button" disabled={busy} onClick={() => setIndividualModalOpen(false)} className="rounded-[12px] border border-[#c9aa97] px-4 py-2 text-sm font-bold text-hpsr-wine">Voltar</button><a href={readyIndividualPreview.url} download={`consulta-${individualStep?.number || "individual"}.png`} className="rounded-[12px] border border-hpsr-wine px-4 py-2 text-sm font-bold text-hpsr-wine">Baixar prévia</a><button type="button" disabled={busy} onClick={() => void saveIndividual()} className="inline-flex items-center gap-2 rounded-[12px] bg-hpsr-wine px-5 py-2 text-sm font-black text-white disabled:opacity-50">{busy && <Loader2 size={16} className="animate-spin" />}Salvar consulta</button></div></footer></div></div>, document.body)}
  </div>;
}
