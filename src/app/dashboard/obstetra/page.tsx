"use client";



import { Baby, CalendarDays, CheckCircle2, Clock3, HeartPulse, History, Loader2, Sparkles, Stethoscope, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { usePatientSelection } from "@/components/patients/PatientSelectionProvider";
import { useCurrentUserProfile } from "@/components/auth/CurrentUserProfileProvider";
import { createClient } from "@/lib/supabase";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { addPlanningDays, calculatePlanningSteps, validatePlanningSteps, type PlanningStep } from "@/lib/obstetric-planning";
import { obstetricDraftKey, parseObstetricDraft, type ObstetricPlanningDraft } from "@/lib/obstetric-planning-draft";
import { renderOfficialPlanning } from "@/lib/obstetric-document";

const inputClass = "h-11 w-full rounded-[14px] border border-hpsr-border bg-white px-3.5 text-sm font-semibold text-hpsr-text outline-none transition focus:border-hpsr-wine";

type GestationalPlan = {
  id: string;
  patient_name: string;
  patient_passport: string;
  start_date: string;
  end_date: string | null;
  planning_notes: string | null;
  consultation_schedule: ConsultationStep[] | null;
  portal_released_at: string | null;
  plan_type: "gestacional" | "in_vitro";
  total_consultations: number | null;
  status: string;
  created_at: string;
  doctor_name: string;
  planning_document_path: string | null;
  planning_released_document_path: string | null;
  planning_document_versions: Array<{path:string; at:string; start_date:string; end_date:string | null; consultation_schedule: PlanningStep[]; planning_notes:string | null}> | null;
};

type ConsultationStep = PlanningStep;

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

export default function ObstetricianPage() {
  const { patients, selectedPassport, selectedPatient, selectPatient, loading } = usePatientSelection();
  const { profile: currentUserProfile } = useCurrentUserProfile();
  const [manualStartDate, setManualStartDate] = useState("");
  const [manualEndDate, setManualEndDate] = useState("");
  const [planningNotes, setPlanningNotes] = useState("");
  const [planType, setPlanType] = useState<"gestacional" | "in_vitro">("gestacional");
  const [releasingPlanId, setReleasingPlanId] = useState<string | null>(null);
  const [plans, setPlans] = useState<GestationalPlan[]>([]);
  const [planning, setPlanning] = useState(false);
  const [planningMessage, setPlanningMessage] = useState("");
  const [planningError, setPlanningError] = useState("");
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [manualPatient, setManualPatient] = useState(false);
  const [manualPatientData, setManualPatientData] = useState({ name: "", passport: "" });
  const [editingPlanId, setEditingPlanId] = useState("");
  const [overriddenSteps, setOverriddenSteps] = useState<{ key: string; steps: PlanningStep[] } | null>(null);
  const [imagePreview, setImagePreview] = useState<{ url: string; blob: Blob; signature: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [releaseOnSave, setReleaseOnSave] = useState(false);
  const [draftReadyFor, setDraftReadyFor] = useState("");
  const restoredDraftFor = useRef("");
  const savedDraftSnapshot = useRef<string | null>(null);

  // O rascunho é isolado por profissional e por aba do navegador. Identidade
  // e cadastro da paciente continuam vindo do seletor e do Supabase.
  useEffect(() => {
    const doctorId = currentUserProfile.id;
    if (!doctorId || loading || restoredDraftFor.current === doctorId) return;
    restoredDraftFor.current = doctorId;
    savedDraftSnapshot.current = null;
    try {
      const draft = parseObstetricDraft(sessionStorage.getItem(obstetricDraftKey(doctorId)));
      if (draft) {
        setManualStartDate(draft.startDate);
        setManualEndDate(draft.endDate);
        setPlanningNotes(draft.planningNotes);
        setPlanType(draft.planType);
        setManualPatient(draft.manualPatient);
        setManualPatientData(draft.manualPatientData);
        setEditingPlanId(draft.editingPlanId);
        setSelectedPlanId(draft.editingPlanId);
        setOverriddenSteps(draft.overriddenSteps);
        if (!draft.manualPatient && draft.selectedPassport !== selectedPassport) selectPatient(draft.selectedPassport);
      }
    } catch {
      // Navegador sem armazenamento disponível: o formulário continua utilizável.
    }
    setDraftReadyFor(doctorId);
  }, [currentUserProfile.id, loading, selectPatient, selectedPassport]);

  const draft = useMemo<ObstetricPlanningDraft>(() => ({
    version: 1, selectedPassport: manualPatient ? "" : selectedPassport,
    manualPatient, manualPatientData, planType,
    startDate: manualStartDate, endDate: manualEndDate, planningNotes,
    editingPlanId, overriddenSteps,
  }), [selectedPassport, manualPatient, manualPatientData, planType, manualStartDate, manualEndDate, planningNotes, editingPlanId, overriddenSteps]);
  const draftSnapshot = useMemo(() => JSON.stringify(draft), [draft]);

  useEffect(() => {
    const doctorId = currentUserProfile.id;
    if (!doctorId || draftReadyFor !== doctorId || draftSnapshot === savedDraftSnapshot.current) return;
    try {
      const key = obstetricDraftKey(doctorId);
      if (draft.startDate || draft.endDate || draft.planningNotes || draft.manualPatient ||
          draft.selectedPassport || draft.editingPlanId || draft.overriddenSteps || draft.planType !== "gestacional") {
        sessionStorage.setItem(key, draftSnapshot);
      } else {
        sessionStorage.removeItem(key);
      }
    } catch {
      // A indisponibilidade do armazenamento não impede o preenchimento.
    }
  }, [currentUserProfile.id, draftReadyFor, draft, draftSnapshot]);

  const isInVitro = planType === "in_vitro";
  const calculationKey = `${planType}:${manualStartDate}:${manualEndDate}`;
  const calculatedSteps = useMemo(() => calculatePlanningSteps(planType, manualStartDate, manualEndDate), [planType, manualStartDate, manualEndDate]);
  const consultationPreview = overriddenSteps?.key === calculationKey ? overriddenSteps.steps : calculatedSteps;
  const planningPatient = manualPatient ? {name: manualPatientData.name.trim(), passport: manualPatientData.passport.trim().toUpperCase()} : selectedPatient;
  const doctorName = currentUserProfile.systemName || "";
  const currentSignature = JSON.stringify({planType, manualStartDate, manualEndDate, planningPatient, doctorName, planningNotes, consultationPreview, editingPlanId});
  const readyPreview = imagePreview?.signature === currentSignature ? imagePreview : null;
  useEffect(() => () => { if (imagePreview?.url) URL.revokeObjectURL(imagePreview.url); }, [imagePreview?.url]);
  const previewVisible = previewModalOpen && Boolean(readyPreview);
  useEffect(() => {
    if (!previewVisible) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) setPreviewModalOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [previewVisible, saving]);

  function adjustStage(index: number, newDate: string) {
    if (!newDate || !consultationPreview.length) return;
    const last = index === consultationPreview.length - 1;
    const recalculate = !last && index < consultationPreview.length - 2 && window.confirm("Recalcular também as consultas seguintes? OK = recalcular; Cancelar = alterar apenas esta data. A data final permanece independente.");
    const steps = consultationPreview.map((item) => ({...item}));
    steps[index].date = newDate;
    if (recalculate) {
      for (let next = index + 1; next < steps.length - 1; next++) {
        const days = planType === "in_vitro" ? 7 : (steps[next].week - steps[next - 1].week) * 7;
        steps[next].date = addPlanningDays(steps[next - 1].date, days);
      }
    }
    setOverriddenSteps({key: `${planType}:${index === 0 ? newDate : manualStartDate}:${last ? newDate : manualEndDate}`, steps});
    if (last) setManualEndDate(newDate);
    if (index === 0) setManualStartDate(newDate);
  }

  async function generatePreview() {
    setPlanningError(""); setPlanningMessage("");
    const reason = validatePlanningSteps(consultationPreview);
    if (reason) return setPlanningError(reason);
    if (!planningPatient?.name || !planningPatient.passport || !doctorName) return setPlanningError("Selecione a paciente e confirme a médica responsável.");
    setPlanning(true);
    try {
      const blob = await renderOfficialPlanning({kind: planType, patient: planningPatient.name, passport: planningPatient.passport, doctor: doctorName, steps: consultationPreview});
      const url = URL.createObjectURL(blob);
      setImagePreview({url, blob, signature: currentSignature});
      setReleaseOnSave(false);
      setPreviewModalOpen(true);
    } catch (error) { setPlanningError(error instanceof Error ? error.message : "Falha ao gerar a prévia PNG."); }
    finally { setPlanning(false); }
  }

  function beginEditing(plan: GestationalPlan) {
    setPreviewModalOpen(false); setReleaseOnSave(false); setImagePreview(null);
    setEditingPlanId(plan.id); setSelectedPlanId(plan.id);
    setManualPatient(true); setManualPatientData({name:plan.patient_name, passport:plan.patient_passport});
    setPlanType(plan.plan_type); setManualStartDate(plan.start_date); setManualEndDate(plan.end_date || "");
    setPlanningNotes(plan.planning_notes || "");
    setOverriddenSteps({key:`${plan.plan_type}:${plan.start_date}:${plan.end_date || ""}`, steps:plan.consultation_schedule || []});
    setPlanningMessage("Planejamento carregado para edição. Gere uma nova prévia antes de salvar."); setPlanningError("");
    window.scrollTo({top:0, behavior:"smooth"});
  }

  async function openStoredDocument(plan: GestationalPlan) {
    if (!plan.planning_document_path) return setPlanningError("Este registro anterior não possui PNG armazenado.");
    const client = createClient(); if (!client) return;
    const {data,error} = await client.storage.from("obstetric-plans").createSignedUrl(plan.planning_document_path, 300);
    if (error || !data?.signedUrl) return setPlanningError("Não foi possível abrir o documento armazenado.");
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }


  async function loadHistory() {
    if (!currentUserProfile.id) return;
    const client = createClient();
    if (!client) return;
    const { data } = await client
      .from("clinical_followup_plans")
      .select("id,doctor_name,patient_name,patient_passport,start_date,end_date,planning_notes,consultation_schedule,portal_released_at,total_consultations,status,created_at,plan_type,planning_document_path,planning_released_document_path,planning_document_versions")
      .eq("doctor_id", currentUserProfile.id)
      .eq("specialty", "Obstetra")
      .order("created_at", { ascending: false })
      .limit(50);
    setPlans((data || []) as GestationalPlan[]);
  }

  useEffect(() => {
    void loadHistory();
  }, [currentUserProfile.id]);

  async function releaseGestationalPlan() {
    const plan = plans.find((item) => item.id === selectedPlanId);
    if (!plan) return setPlanningError("Selecione um planejamento para liberar.");
    if (releasingPlanId || !plan.planning_document_path || (plan.portal_released_at && plan.planning_document_path === plan.planning_released_document_path)) return;
    if (!window.confirm(`Liberar o planejamento ${plan.plan_type === "in_vitro" ? "in vitro" : "gestacional"} de ${plan.patient_name} para visualização no Portal do Paciente?`)) return;
    const client = createClient();
    if (!client) return setPlanningError("Supabase não configurado.");
    setReleasingPlanId(plan.id);
    setPlanningError("");
    setPlanningMessage("");
    try {
      const { data, error } = await client.from("clinical_followup_plans")
        .update({ portal_released_at: new Date().toISOString(), planning_released_document_path: plan.planning_document_path, planning_released_snapshot: {patient_name:plan.patient_name, doctor_name:plan.doctor_name, start_date:plan.start_date, end_date:plan.end_date, planning_notes:plan.planning_notes, consultation_schedule:plan.consultation_schedule, total_consultations:plan.total_consultations, plan_type:plan.plan_type} })
        .eq("id", plan.id).eq("doctor_id", currentUserProfile.id)
        .eq("specialty", "Obstetra")
        .select("id").maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Planejamento não encontrado ou já liberado.");
      await loadHistory();
      setPlanningMessage(`Planejamento de ${plan.patient_name} liberado no Portal do Paciente.`);
    } catch (caught) {
      setPlanningError(caught instanceof Error ? caught.message : "Não foi possível liberar o planejamento.");
    } finally {
      setReleasingPlanId(null);
    }
  }

  async function deleteGestationalPlan() {
    const plan = plans.find((item) => item.id === selectedPlanId);
    if (!plan) {
      setPlanningError("Selecione um planejamento para excluir.");
      return;
    }
    if (deletingPlanId) return;
    const confirmed = window.confirm(`Excluir o planejamento ${plan.plan_type === "in_vitro" ? "in vitro" : "gestacional"} de ${plan.patient_name}? Esta ação removerá também todas as etapas vinculadas.`);
    if (!confirmed) return;
    const client = createClient();
    if (!client) {
      setPlanningError("Supabase não configurado.");
      return;
    }
    setDeletingPlanId(plan.id);
    setPlanningError("");
    setPlanningMessage("");
    try {
      const { error: occurrenceError } = await client
        .from("clinical_followup_occurrences")
        .delete()
        .eq("plan_id", plan.id);
      if (occurrenceError) throw occurrenceError;
      const { error: planError } = await client
        .from("clinical_followup_plans")
        .delete()
        .eq("id", plan.id)
        .eq("doctor_id", currentUserProfile.id);
      if (planError) throw planError;
      setPlans((current) => current.filter((item) => item.id !== plan.id));
      setSelectedPlanId("");
      setPlanningMessage(`Planejamento de ${plan.patient_name} excluído.`);
    } catch (caught) {
      setPlanningError(caught instanceof Error ? caught.message : "Não foi possível excluir o planejamento.");
      await loadHistory();
    } finally {
      setDeletingPlanId(null);
    }
  }

  async function createGestationalPlan() {
    if (!readyPreview) return setPlanningError("Gere e confira a prévia atualizada antes de salvar.");
    const reason = validatePlanningSteps(consultationPreview);
    if (reason) return setPlanningError(reason);
    if (!currentUserProfile.id || !planningPatient?.name || !planningPatient.passport) return setPlanningError("Identificação incompleta.");
    setSaving(true); setPlanningError(""); setPlanningMessage("");
    const publishOnSave = releaseOnSave;
    const client = createClient();
    if (!client) { setSaving(false); return setPlanningError("Supabase não configurado."); }
    let createdId = ""; let uploadedPath = "";
    try {
      const previous = editingPlanId ? plans.find((item) => item.id === editingPlanId) : undefined;
      if (editingPlanId && (!previous || previous.patient_passport !== planningPatient.passport || previous.plan_type !== planType)) throw new Error("A edição deve manter a paciente e a modalidade do planejamento original.");
      const regularSteps = consultationPreview.slice(0,-1);
      const intervalDays = planType === "in_vitro" ? 7 : 28;
      const payload = {
        doctor_id: currentUserProfile.id, doctor_name: doctorName, patient_passport: planningPatient.passport,
        patient_name: planningPatient.name, specialty: "Obstetra", plan_type: planType,
        frequency: "Personalizada", interval_days: intervalDays, start_date: manualStartDate,
        end_date: manualEndDate, planning_notes: planningNotes.trim() || null,
        consultation_schedule: consultationPreview, total_consultations: consultationPreview.length,
        total_weeks: planType === "in_vitro" ? 5 : 40, status: previous?.status || "Ativo",
      };
      let planId = editingPlanId;
      if (!planId) {
        const {data,error} = await client.from("clinical_followup_plans").insert(payload).select("id").single();
        if (error || !data?.id) throw error || new Error("Falha ao criar planejamento.");
        planId = data.id; createdId = planId;
      }
      const revisions = previous?.planning_document_versions || [];
      const archived = previous?.planning_document_path ? [...revisions, {
        path: previous.planning_document_path, at: new Date().toISOString(), start_date: previous.start_date,
        end_date: previous.end_date, consultation_schedule: previous.consultation_schedule || [], planning_notes: previous.planning_notes,
      }] : revisions;
      uploadedPath = `${currentUserProfile.id}/${planId}/${crypto.randomUUID()}.png`;
      const {error:uploadError} = await client.storage.from("obstetric-plans").upload(uploadedPath, readyPreview.blob, {contentType:"image/png",upsert:false});
      if (uploadError) throw uploadError;
      const {error:saveError} = await client.from("clinical_followup_plans")
        .update({...payload, planning_document_path:uploadedPath, planning_document_versions:archived})
        .eq("id",planId).eq("doctor_id",currentUserProfile.id).eq("specialty","Obstetra");
      if (saveError) throw saveError;
      if (!previous) {
        const {error:occError} = await client.from("clinical_followup_occurrences").insert(regularSteps.map((step)=>({
          plan_id:planId,doctor_id:currentUserProfile.id,patient_passport:planningPatient.passport,
          patient_name:planningPatient.name,specialty:"Obstetra",planned_date:step.date,status:"Planejada",
        })));
        if (occError) throw occError;
      }
      // A opção do modal libera somente o PNG que acabou de ser salvo. Uma
      // edição sem nova liberação preserva o snapshot anterior no Portal.
      let publicationError = "";
      if (publishOnSave) {
        const {data: released, error: releaseError} = await client.from("clinical_followup_plans")
          .update({
            portal_released_at: new Date().toISOString(),
            planning_released_document_path: uploadedPath,
            planning_released_snapshot: {
              patient_name: planningPatient.name, doctor_name: doctorName,
              start_date: manualStartDate, end_date: manualEndDate,
              planning_notes: planningNotes.trim() || null,
              consultation_schedule: consultationPreview,
              total_consultations: consultationPreview.length, plan_type: planType,
            },
          })
          .eq("id", planId).eq("doctor_id", currentUserProfile.id).eq("specialty", "Obstetra")
          .eq("planning_document_path", uploadedPath)
          .select("id").maybeSingle();
        if (releaseError || !released) publicationError = releaseError?.message || "O registro não pôde ser liberado.";
      }
      // A edição do documento não altera consultas/atendimentos já registrados na agenda.
      if (publicationError) {
        setPlanningMessage("Planejamento e PNG salvos, mas a liberação não foi concluída. Selecione o registro no histórico para tentar novamente.");
        setPlanningError(`Não foi possível liberar o documento: ${publicationError}`);
      } else if (publishOnSave) {
        setPlanningMessage("Planejamento e PNG salvos e liberados no Portal do Paciente.");
      } else {
        setPlanningMessage(previous
          ? "Planejamento e PNG atualizados. A paciente continuará vendo a versão anterior até nova liberação."
          : "Planejamento e PNG salvos. A paciente verá o documento somente após liberação.");
      }
      // Plano salvo não é rascunho: remove a cópia temporária sem alterar os
      // campos que já estavam visíveis. Novas edições voltam a ser preservadas.
      savedDraftSnapshot.current = JSON.stringify({ ...draft, editingPlanId: "", overriddenSteps: null });
      try { sessionStorage.removeItem(obstetricDraftKey(currentUserProfile.id)); } catch { /* Armazenamento opcional. */ }
      setPreviewModalOpen(false); setReleaseOnSave(false);
      setEditingPlanId(""); setOverriddenSteps(null); setImagePreview(null);
      await loadHistory(); setSelectedPlanId(planId);
    } catch(error) {
      if (uploadedPath && createdId) await client.storage.from("obstetric-plans").remove([uploadedPath]);
      if (createdId) await client.from("clinical_followup_plans").delete().eq("id", createdId).eq("doctor_id",currentUserProfile.id);
      setPlanningError(error instanceof Error ? error.message : "Não foi possível salvar o planejamento.");
      await loadHistory();
    } finally { setSaving(false); }
  }

  return (
    <div className="hpsr-obstetra-page space-y-4">
      <PageHeader
        eyebrow="Especialidade médica"
        title="Obstetra"
        description="Planejamento gestacional e in vitro com datas informadas pela médica."
      />

      <section className="rounded-[22px] border border-[#e1c9b8] bg-[linear-gradient(120deg,#f8ecdf_0%,#f4e3d7_100%)] p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[16px] bg-[linear-gradient(135deg,#672614,#2a0700)] text-white"><HeartPulse size={22} /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.16em] text-hpsr-wineLight">Ferramenta principal</p>
              <h2 className="mt-1 text-2xl font-black leading-tight text-hpsr-text">{isInVitro ? "Contador in vitro" : "Contador gestacional"}</h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-hpsr-muted">{isInVitro ? "Organize quatro consultas semanais e a entrega do resultado do Beta-hCG na data final." : "Informe as datas inicial e final para montar o planejamento das consultas, encerrando com o parto."}</p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[420px]">
            <div className="rounded-[16px] bg-[#f5e5d9] px-4 py-3 shadow-sm ring-1 ring-[#ddc1b1]"><p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Início</p><p className="mt-1 text-lg font-black text-hpsr-text">{formatDate(manualStartDate)}</p></div>
            <div className="rounded-[16px] bg-[#f5e5d9] px-4 py-3 shadow-sm ring-1 ring-[#ddc1b1]"><p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Etapas</p><p className="mt-1 text-lg font-black text-hpsr-text">{consultationPreview.length || "—"}</p></div>
            <div className="rounded-[16px] bg-[#f5e5d9] px-4 py-3 shadow-sm ring-1 ring-[#ddc1b1]"><p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">{isInVitro ? "Entrega do resultado" : "Parto previsto"}</p><p className="mt-1 text-lg font-black text-hpsr-text">{formatDate(manualEndDate)}</p></div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        <section className="hpsr-gestational-form rounded-[24px] border border-[#ad7665] p-5 shadow-[0_14px_34px_rgba(125,35,29,0.08)]">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-[linear-gradient(135deg,#672614,#2a0700)] text-white"><Baby size={20} /></div>
            <div><p className="text-[10px] font-black uppercase tracking-[.16em] text-hpsr-wineLight">Contador</p><h3 className="text-lg font-black text-hpsr-text">Dados do acompanhamento</h3><p className="text-sm text-hpsr-muted">Preencha as datas do planejamento e as observações da médica.</p></div>
          </div>
          <div className="mt-5 grid gap-4">
            <Field label="Selecionar paciente" hint="Selecione uma paciente cadastrada para preencher automaticamente os dados de conferência.">
              <div className="space-y-2">
                <StyledSelect value={manualPatient ? "" : selectedPassport} onChange={(event) => { setManualPatient(false); selectPatient(event.target.value); }} searchable disabled={loading || manualPatient || Boolean(editingPlanId)}>
                  <option value="">{loading ? "Carregando pacientes..." : "Selecionar paciente"}</option>
                  {patients.map((patient) => <option key={patient.passport} value={patient.passport}>{patient.name} · {patient.passport}</option>)}
                </StyledSelect>
                <button type="button" disabled={Boolean(editingPlanId)} onClick={() => setManualPatient((current) => !current)} className="text-left text-xs font-black text-hpsr-wine">{manualPatient ? "Usar paciente do Prontuário" : "Informar paciente manualmente"}</button>
              </div>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome do paciente" hint={manualPatient ? "Preenchimento manual." : "Conferência do cadastro, sem edição."}>
                <input className={`${inputClass} ${manualPatient ? "" : "bg-[#f8efe5]"}`} value={manualPatient ? manualPatientData.name : selectedPatient?.name || ""} onChange={manualPatient ? (event) => setManualPatientData((current) => ({ ...current, name: event.target.value })) : undefined} readOnly={!manualPatient || Boolean(editingPlanId)} placeholder="Nome do paciente" />
              </Field>
              <Field label="Passaporte do paciente" hint={manualPatient ? "Preenchimento manual." : "Conferência do cadastro, sem edição."}>
                <input className={`${inputClass} ${manualPatient ? "" : "bg-[#f8efe5]"}`} value={manualPatient ? manualPatientData.passport : selectedPatient?.passport || ""} onChange={manualPatient ? (event) => setManualPatientData((current) => ({ ...current, passport: event.target.value })) : undefined} readOnly={!manualPatient || Boolean(editingPlanId)} placeholder="Passaporte" />
              </Field>
              <Field label="Médico responsável" hint="Profissional responsável pelo planejamento.">
                <input className={`${inputClass} bg-[#f8efe5]`} value={currentUserProfile.systemName || ""} readOnly placeholder="Profissional não identificado" />
              </Field>
              <Field label="Modelo do planejamento">
                <StyledSelect disabled={Boolean(editingPlanId)} value={planType} onChange={(event) => { setPlanType(event.target.value as "gestacional" | "in_vitro"); setPlanningError(""); setPlanningMessage(""); }}>
                  <option value="gestacional">Planejamento gestacional</option>
                  <option value="in_vitro">Planejamento in vitro</option>
                </StyledSelect>
              </Field>
              <Field label="Data inicial" hint="Primeiro dia do planejamento."><input className={inputClass} type="date" value={manualStartDate} onChange={(event) => setManualStartDate(event.target.value)} /></Field>
              <Field label="Data final" hint={isInVitro ? "Data da quinta etapa: entrega do resultado do Beta-hCG." : "Data prevista para o parto."}><input className={inputClass} type="date" value={manualEndDate} min={manualStartDate || undefined} onChange={(event) => setManualEndDate(event.target.value)} /></Field>
            </div>
            <Field label="Observações da médica" hint="Exibidas à paciente somente após a liberação."><textarea className={`${inputClass} min-h-[110px] resize-y py-3`} maxLength={4000} value={planningNotes} onChange={(event) => setPlanningNotes(event.target.value)} placeholder={isInVitro ? "Orientações e observações do planejamento in vitro" : "Orientações e observações do planejamento gestacional"} /></Field>
          </div>
          <div className="mt-5 flex justify-center">
            <button type="button" disabled={planning || saving || !currentUserProfile.id || consultationPreview.length !== (isInVitro ? 5 : 9) || (manualPatient ? !manualPatientData.name.trim() || !manualPatientData.passport.trim() : !selectedPatient)} onClick={() => void generatePreview()} className="flex min-h-[52px] w-full max-w-[360px] items-center justify-center gap-2 rounded-[17px] bg-hpsr-wine px-5 text-sm font-black text-white shadow-[0_10px_24px_rgba(125,35,29,0.18)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50">
              {planning ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}{planning ? "Preparando prévia..." : "Gerar plano"}
            </button>
          </div>
          <p className="mt-2 text-center text-xs leading-relaxed text-hpsr-muted">{isInVitro ? "Quatro consultas semanais e a entrega do resultado na quinta etapa. Os horários são reservados separadamente no Agendamento." : "O planejamento organiza oito consultas a partir da data inicial e a previsão de parto independente. Os horários são reservados separadamente no Agendamento."}</p>
          {manualStartDate && manualEndDate && consultationPreview.length === 0 && <p className="mt-3 text-sm font-semibold text-red-700">Informe datas inicial e final válidas.</p>}
          {consultationPreview.length > 0 && <div className="mt-4 rounded-[16px] border border-[#d9bdaa] bg-[#f7eadf] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm text-hpsr-text">Datas das etapas</strong><button type="button" className="text-xs font-black text-hpsr-wine underline" onClick={()=>setOverriddenSteps(null)}>Recalcular todas pela data inicial</button></div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">{consultationPreview.map((step,index)=><label key={step.number} className="flex items-center justify-between gap-2 rounded-[10px] bg-[#fff9f2] p-2 text-xs"><span>{step.title} · {planType === "in_vitro" ? `${step.week}ª semana` : `${step.week} semanas`}</span><input type="date" className="max-w-[145px] rounded border border-[#ddc4b3] bg-white p-1" value={step.date} onChange={event=>adjustStage(index,event.target.value)} /></label>)}</div>
          </div>}
          {readyPreview && !previewModalOpen && <div className="mt-3 flex justify-center">
            <button type="button" onClick={() => setPreviewModalOpen(true)} className="text-sm font-black text-hpsr-wine underline underline-offset-4">Abrir pré-visualização do plano</button>
          </div>}
          {planningMessage && <p className="mt-3 rounded-[14px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800"><CheckCircle2 className="mr-2 inline" size={16} />{planningMessage}</p>}
          {planningError && <p className="mt-3 rounded-[14px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-800">{planningError}</p>}
        </section>

        <section className="hpsr-gestational-summary rounded-[24px] border p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-[10px] font-black uppercase tracking-[.16em] text-hpsr-wineLight">Leitura rápida</p><h3 className="text-lg font-black text-hpsr-text">Resumo do acompanhamento</h3><p className="text-sm text-hpsr-muted">Informações principais do planejamento.</p></div>
            <div className="rounded-[14px] bg-[linear-gradient(135deg,#672614,#2a0700)] p-2.5 text-white"><Stethoscope size={18} /></div>
          </div>
          <div className="mt-4 rounded-[18px] border border-[#eddcdd] bg-[linear-gradient(135deg,#f2dfd1_0%,#f9efe5_100%)] p-4">
            <p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Paciente selecionada</p>
            <p className="mt-1 text-base font-black text-hpsr-text">{manualPatient ? manualPatientData.name || "Nenhuma paciente informada" : selectedPatient?.name || "Nenhuma paciente selecionada"}</p>
            <p className="mt-1 text-sm font-semibold text-hpsr-muted">{manualPatient ? (manualPatientData.passport ? `Passaporte ${manualPatientData.passport}` : "Informe o documento da paciente.") : selectedPatient ? `Passaporte ${selectedPatient.passport}` : "Escolha uma paciente no contador para começar."}</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[16px] border border-[#e3cdbb] bg-[#faf1e7] p-4"><div className="flex items-center gap-2 text-hpsr-wine"><CalendarDays size={16} /><span className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Data inicial</span></div><p className="mt-2 text-xl font-black text-hpsr-text">{formatDate(manualStartDate)}</p></div>
            <div className="rounded-[16px] border border-[#e3cdbb] bg-[#faf1e7] p-4"><div className="flex items-center gap-2 text-hpsr-wine"><HeartPulse size={16} /><span className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">{isInVitro ? "Entrega do resultado" : "Parto previsto"}</span></div><p className="mt-2 text-xl font-black text-hpsr-text">{formatDate(manualEndDate)}</p></div>
            <div className="rounded-[16px] border border-[#e3cdbb] bg-[#faf1e7] p-4"><div className="flex items-center gap-2 text-hpsr-wine"><Clock3 size={16} /><span className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Etapas previstas</span></div><p className="mt-2 text-xl font-black text-hpsr-text">{consultationPreview.length || "—"}</p></div>
            <div className="rounded-[16px] border border-[#e3cdbb] bg-[#faf1e7] p-4"><div className="flex items-center gap-2 text-hpsr-wine"><Baby size={16} /><span className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Etapa final</span></div><p className="mt-2 text-base font-black leading-snug text-hpsr-text">{isInVitro ? "Beta-hCG · entrega do resultado" : "Parto"}</p></div>
          </div>
          <p className="mt-4 rounded-[18px] border border-[#dcc6b5] bg-[#f4e8da] p-4 text-sm leading-relaxed text-hpsr-muted">{isInVitro ? "As quatro consultas semanais e a data independente de entrega do resultado ficam registradas no histórico. O resultado positivo só é registrado após confirmação médica." : "Ao montar o planejamento, as oito consultas e suas orientações ficam registradas no histórico e podem ser liberadas para a paciente."}</p>
        </section>
      </div>

      <section className="hpsr-gestational-history rounded-[24px] border p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-[linear-gradient(135deg,#672614,#2a0700)] text-white"><History size={20} /></div>
            <div>
              <h3 className="text-lg font-black text-hpsr-text">Histórico de planejamentos</h3>
              <p className="text-sm text-hpsr-muted">Planejamentos gestacionais e in vitro criados pelo médico logado.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button type="button" onClick={() => void releaseGestationalPlan()}
              disabled={!selectedPlanId || Boolean(releasingPlanId) || !plans.find((item) => item.id === selectedPlanId)?.planning_document_path || Boolean(plans.find((item) => item.id === selectedPlanId)?.portal_released_at && plans.find((item) => item.id === selectedPlanId)?.planning_document_path === plans.find((item) => item.id === selectedPlanId)?.planning_released_document_path)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[14px] bg-hpsr-wine px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">
              {releasingPlanId ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {releasingPlanId ? "Liberando..." : plans.find((item) => item.id === selectedPlanId)?.portal_released_at && plans.find((item) => item.id === selectedPlanId)?.planning_document_path === plans.find((item) => item.id === selectedPlanId)?.planning_released_document_path ? "Liberado à paciente" : "Liberar para paciente"}
            </button>
            <span className="shrink-0 rounded-full border border-hpsr-border bg-[#fffaf8] px-3 py-1.5 text-center text-xs font-black text-hpsr-wine">{plans.length} registro{plans.length === 1 ? "" : "s"}</span>
            <button
              type="button"
              onClick={() => void deleteGestationalPlan()}
              disabled={!selectedPlanId || Boolean(deletingPlanId)}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-[14px] border border-red-200 bg-white px-4 text-sm font-black text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deletingPlanId ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              {deletingPlanId ? "Excluindo..." : selectedPlanId ? "Excluir selecionado" : "Selecione um planejamento"}
            </button>
          </div>
        </div>

        <p className="mt-3 text-xs font-semibold text-hpsr-muted">Clique em um planejamento para selecioná-lo. Depois, libere-o para a paciente ou use o botão de exclusão.</p>
        <div className="mt-3 max-h-[360px] overflow-y-auto pr-1 [scrollbar-gutter:stable]">
          {plans.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-hpsr-border bg-[#f5e8db] px-4 py-8 text-center">
              <p className="font-black text-hpsr-text">Nenhum planejamento registrado</p>
              <p className="mt-1 text-sm text-hpsr-muted">Use o botão do contador para criar o primeiro planejamento.</p>
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {plans.map((plan) => (
                <article
                  key={plan.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selectedPlanId === plan.id}
                  onClick={() => setSelectedPlanId((current) => current === plan.id ? "" : plan.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedPlanId((current) => current === plan.id ? "" : plan.id);
                    }
                  }}
                  className={`cursor-pointer rounded-[18px] border p-4 transition ${selectedPlanId === plan.id ? "border-hpsr-wine bg-[#fff1ec] ring-2 ring-hpsr-wine/15" : "border-hpsr-border bg-[#f6e9dd] hover:border-[#cfa9a3] hover:bg-[#f2dfd2]"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-black text-hpsr-text">{plan.patient_name}</p>
                      <p className="mt-0.5 text-xs font-bold text-hpsr-wine">{plan.plan_type === "in_vitro" ? "Planejamento in vitro" : "Planejamento gestacional"}</p>
                      <p className="mt-0.5 text-xs font-semibold text-hpsr-muted">Passaporte {plan.patient_passport}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {selectedPlanId === plan.id && <span className="rounded-full bg-hpsr-wine px-2.5 py-1 text-[10px] font-black uppercase tracking-[.12em] text-white">Selecionado</span>}
                      {plan.portal_released_at && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black text-emerald-800">Liberado</span>}
                      <span className="rounded-full bg-[#f3dfda]  px-2.5 py-1 text-[10px] font-black uppercase tracking-[.12em] text-hpsr-wine">{plan.status}</span>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                    <div><p className="text-[9px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">Início</p><p className="mt-1 font-bold text-hpsr-text">{formatDate(plan.start_date)}</p></div>
                    <div><p className="text-[9px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">Conclusão</p><p className="mt-1 font-bold text-hpsr-text">{plan.end_date ? formatDate(plan.end_date) : "—"}</p></div>
                    <div><p className="text-[9px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">Etapas</p><p className="mt-1 font-bold text-hpsr-text">{plan.total_consultations || 0}</p></div>
                  </div>
                  {plan.consultation_schedule?.length ? <div className="mt-3 grid gap-1.5">{plan.consultation_schedule.map((item) => <p key={item.number} className="rounded-[10px] bg-[#fff9f1] p-2 text-xs text-hpsr-text"><strong>{plan.plan_type !== "in_vitro" && item.title.toLowerCase().includes("parto") ? "Parto (previsão)" : `Consulta ${item.number} · ${item.title}`} · {formatDate(item.date)}</strong><span className="block">{item.description}</span></p>)}</div> : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" className="rounded-[10px] border border-[#c8a992] px-3 py-2 text-xs font-black text-hpsr-wine" onClick={(event)=>{event.stopPropagation();beginEditing(plan);}}>Editar planejamento</button>
                    <button type="button" className="rounded-[10px] border border-[#c8a992] px-3 py-2 text-xs font-black text-hpsr-wine disabled:opacity-50" disabled={!plan.planning_document_path} onClick={(event)=>{event.stopPropagation();void openStoredDocument(plan);}}>Visualizar PNG</button>
                  </div>
                  {plan.planning_notes && <p className="mt-3 whitespace-pre-wrap rounded-[12px] bg-[#fff9f1] p-3 text-xs text-hpsr-text">{plan.planning_notes}</p>}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {readyPreview && previewModalOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#26140fe0] p-2 sm:p-5">
          <button type="button" aria-label="Fechar pré-visualização" disabled={saving} onClick={() => setPreviewModalOpen(false)} className="absolute inset-0 cursor-default disabled:cursor-wait" />
          <div role="dialog" aria-modal="true" aria-labelledby="obstetric-preview-title" className="relative flex max-h-[94dvh] w-full max-w-[1120px] flex-col overflow-hidden rounded-[22px] border border-[#c9a78f] bg-[#f8eee3] shadow-[0_28px_85px_rgba(25,10,6,0.35)]">
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#d7bba6] bg-[linear-gradient(115deg,#f7e7d7,#f4e1d8)] px-4 py-3 sm:px-6">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[.15em] text-hpsr-wineLight">Conferência antes do salvamento</p>
                <h2 id="obstetric-preview-title" className="mt-0.5 text-lg font-black text-hpsr-text">Pré-visualização do planejamento {isInVitro ? "in vitro" : "gestacional"}</h2>
                <p className="truncate text-xs text-hpsr-muted">{planningPatient?.name} · Passaporte {planningPatient?.passport}</p>
              </div>
              <button type="button" autoFocus aria-label="Fechar pré-visualização" disabled={saving} onClick={() => setPreviewModalOpen(false)} className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] border border-[#d3b39d] bg-[#fff9f2] text-hpsr-wine hover:bg-[#f0dfd1] disabled:opacity-50"><X size={19} /></button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-5 [scrollbar-gutter:stable]">
              <img src={readyPreview.url} alt={`Prévia fiel do planejamento ${isInVitro ? "in vitro" : "gestacional"}`} className="mx-auto h-auto w-full max-w-[1000px] rounded-[10px] border border-[#dec5b2] bg-white shadow-sm" />
            </div>
            <footer className="shrink-0 border-t border-[#d7bba6] bg-[#f8ebdc] px-4 py-3 sm:px-6">
              <div className="flex flex-col gap-2 rounded-[14px] border border-[#d7bba6] bg-[#f3e1d0] p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p id="obstetric-release-label" className="text-sm font-black text-hpsr-text">Liberar no Portal do Paciente</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-hpsr-muted">{releaseOnSave
                    ? "Ao salvar, esta versão ficará disponível para a paciente."
                    : editingPlanId && plans.find((plan) => plan.id === editingPlanId)?.portal_released_at
                      ? "A paciente continuará vendo a versão anteriormente liberada até nova autorização."
                      : "O planejamento será salvo somente no sistema e poderá ser liberado depois."}</p>
                </div>
                <button type="button" role="switch" aria-labelledby="obstetric-release-label" aria-checked={releaseOnSave} disabled={saving} onClick={() => setReleaseOnSave((current) => !current)} className={`relative h-8 w-14 shrink-0 self-end rounded-full border-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hpsr-wine disabled:opacity-50 sm:self-auto ${releaseOnSave ? "border-[#73362b] bg-hpsr-wine" : "border-[#c6a895] bg-[#e2d0c2]"}`}>
                  <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${releaseOnSave ? "left-[26px]" : "left-0.5"}`} />
                </button>
              </div>
              {planningError && <p role="alert" className="mt-2 rounded-[10px] border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-800">{planningError}</p>}
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <button type="button" disabled={saving} onClick={() => setPreviewModalOpen(false)} className="rounded-[12px] border border-[#c9aa97] px-4 py-2 text-sm font-bold text-hpsr-wine disabled:opacity-50">Voltar</button>
                <a href={readyPreview.url} download={`planejamento-${planType}.png`} className="rounded-[12px] border border-hpsr-wine px-4 py-2 text-sm font-bold text-hpsr-wine">Baixar prévia PNG</a>
                <button type="button" disabled={saving} onClick={() => void createGestationalPlan()} className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-hpsr-wine px-5 py-2 text-sm font-black text-white disabled:opacity-50">{saving && <Loader2 size={16} className="animate-spin" />}{saving ? "Salvando..." : editingPlanId ? "Salvar atualização" : "Salvar planejamento"}</button>
              </div>
            </footer>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
