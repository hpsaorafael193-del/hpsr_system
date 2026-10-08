"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CalendarClock,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  CircleUserRound,
  History,
  HeartPulse,
  IdCard,
  Loader2,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Stethoscope,
  UserRoundX,
  UsersRound,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { useCurrentUserProfile } from "@/components/auth/CurrentUserProfileProvider";
import { usePatientSelection, type SharedPatient } from "@/components/patients/PatientSelectionProvider";
import { createClient } from "@/lib/supabase";
import { isClinicalProfessional } from "@/lib/clinical-scheduling";
import { specialties as systemSpecialties } from "@/data/mock";


type LinkRow = {
  id: string;
  patient_passport: string;
  doctor_id: string;
  specialty: string;
  started_at: string;
};

type HistoryRow = LinkRow & {
  ended_at: string;
  end_reason: string;
};

type IntakeFormStatus = { patient_passport: string; form_type: "gestational" | "ivf_ropa"; status: string; requested_at: string };

type Doctor = {
  id: string;
  name: string;
  role: string;
  specialty: string;
};

type ViewMode = "mine" | "admin" | "history";
type ModalMode = "create" | "edit";

type LinkForm = {
  id?: string;
  passport: string;
  doctorId: string;
  specialty: string;
  startedAt: string;
  replacementReason?: string;
};

type EndModalState = {
  row: LinkRow;
  reason: string;
};

const LINK_END_REASONS = [
  "Acompanhamento concluído",
  "Desistência do paciente",
  "Falta de resposta",
  "Mudança de médico",
  "Impossibilidade de continuidade",
] as const;

const fieldClass = "min-h-[44px] w-full rounded-[13px] border border-[#cfb6a4] bg-[#efe1d5] px-3.5 text-sm font-semibold text-hpsr-text outline-none transition focus:border-hpsr-wine focus:ring-2 focus:ring-hpsr-wineLight/20";
const labelClass = "text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-muted";

function normalize(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

function normalizeSpecialty(value: unknown) {
  const key = normalize(value);
  const aliases: Record<string, string> = {
    "clinica geral": "clinico geral",
    "clinico": "clinico geral",
    "medico clinico": "clinico geral",
    "obstetricia": "obstetra",
    "obstetrica": "obstetra",
    "ginecologia e obstetricia": "obstetra",
    "ginecologista e obstetra": "obstetra",
    "pediatria": "pediatra",
    "psicologia": "psicologa",
    "psicologo": "psicologa",
    "psiquiatria": "psiquiatra",
    "cardiologista": "cardiologia",
    "dermatologista": "dermatologia",
    "ginecologista": "ginecologia",
  };
  return aliases[key] || key;
}

const UNRESTRICTED_SPECIALTY_ROLES = new Set(["Vice Diretor / Dev", "Diretora", "Vice Diretor"]);

function doctorSpecialties(doctor?: Doctor | null) {
  if (doctor && UNRESTRICTED_SPECIALTY_ROLES.has(doctor.role)) {
    return [...systemSpecialties];
  }
  const source = String(doctor?.specialty || "")
    .split(/[,;/|]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return Array.from(new Set(source));
}

function formatStartedAt(value: string) {
  if (!value) return "Não informado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function toDatetimeLocal(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function friendlyDatabaseError(error: { code?: string; message?: string } | null | undefined) {
  const code = String(error?.code || "");
  const message = String(error?.message || "");
  if (message.includes("CAPACIDADE_VINCULOS_ESGOTADA")) {
    return "Este médico atingiu o limite de pacientes vinculados nessa especialidade.";
  }
  if (code === "23505" || message.includes("patient_doctor_links_patient")) {
    return "Este paciente já possui um médico vinculado nesta especialidade.";
  }
  if (code === "23514" || message.toLocaleLowerCase("pt-BR").includes("especialidade informada não pertence")) {
    return "A especialidade selecionada não pertence ao médico escolhido.";
  }
  if (code === "42501" || message.toLocaleLowerCase("pt-BR").includes("permission denied") || message.toLocaleLowerCase("pt-BR").includes("row-level security")) {
    return "Você não possui permissão para realizar esta alteração.";
  }
  return message || "Não foi possível salvar o vínculo.";
}

export default function MyPatientsPage() {
  const { profile: currentUserProfile } = useCurrentUserProfile();
  const { patients, loading: patientsLoading } = usePatientSelection();
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState<ViewMode>("mine");
  const [search, setSearch] = useState("");
  const [mineSpecialtyFilter, setMineSpecialtyFilter] = useState("");
  const [adminDoctorFilter, setAdminDoctorFilter] = useState("");
  const [adminSpecialtyFilter, setAdminSpecialtyFilter] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [intakeStatus, setIntakeStatus] = useState<Map<string, IntakeFormStatus>>(new Map());
  const [collapsedSpecialties, setCollapsedSpecialties] = useState<Set<string>>(new Set());
  const [collapsedDoctors, setCollapsedDoctors] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<{ mode: ModalMode; form: LinkForm } | null>(null);
  const [endModal, setEndModal] = useState<EndModalState | null>(null);

  const patientByPassport = useMemo(
    () => new Map(patients.map((patient) => [patient.passport, patient])),
    [patients],
  );
  const doctorById = useMemo(
    () => new Map(doctors.map((doctor) => [doctor.id, doctor])),
    [doctors],
  );

  async function load() {
    const client = createClient();
    if (!client) {
      setLoading(false);
      setError("Supabase não configurado.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const [linksResult, historyResult, profilesResult, adminResult, formsResult] = await Promise.all([
        client.from("patient_doctor_links").select("id,patient_passport,doctor_id,specialty,started_at").order("started_at", { ascending: false }),
        client.from("patient_doctor_link_history").select("id,patient_passport,doctor_id,specialty,started_at,ended_at,end_reason").order("ended_at", { ascending: false }),
        client.from("profiles").select("id,name,role,specialty,crm,access_status").eq("access_status", "Aprovado").order("name"),
        client.rpc("hpsr_is_patient_link_admin"),
        client.from("followup_intake_forms").select("patient_passport,form_type,status,requested_at").order("requested_at", { ascending: false }).limit(500),
      ]);

      if (linksResult.error) throw linksResult.error;
      if (historyResult.error) throw historyResult.error;
      if (profilesResult.error) throw profilesResult.error;
      if (adminResult.error) throw adminResult.error;

      const latestIntake = new Map<string, IntakeFormStatus>();
      if (!formsResult.error) {
        ((formsResult.data || []) as IntakeFormStatus[]).forEach((row) => {
          const key = `${row.patient_passport}|${row.form_type}`;
          if (!latestIntake.has(key)) latestIntake.set(key, row);
        });
      }
      setIntakeStatus(latestIntake);

      const availableDoctors = (profilesResult.data || [])
        .filter((row) => isClinicalProfessional(row))
        .map((row) => ({
          id: String(row.id),
          name: String(row.name || "Médico"),
          role: String(row.role || "Médico"),
          specialty: String(row.specialty || ""),
        }));

      setLinks((linksResult.data || []) as LinkRow[]);
      setHistory((historyResult.data || []) as HistoryRow[]);
      setDoctors(availableDoctors);
      setIsAdmin(Boolean(adminResult.data));
      if (!adminResult.data && view === "admin") setView("mine");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar os vínculos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const myLinks = useMemo(
    () => links.filter((row) => row.doctor_id === currentUserProfile.id),
    [links, currentUserProfile.id],
  );

  const mySpecialties = useMemo(
    () => Array.from(new Set(myLinks.map((row) => row.specialty))).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [myLinks],
  );

  const searchFilteredMyLinks = useMemo(() => {
    const term = normalize(search);
    return myLinks.filter((row) => {
      const patient = patientByPassport.get(row.patient_passport);
      const searchMatch = !term || [patient?.name, row.patient_passport, row.specialty]
        .some((value) => normalize(value).includes(term));
      const specialtyMatch = !mineSpecialtyFilter || normalizeSpecialty(row.specialty) === normalizeSpecialty(mineSpecialtyFilter);
      return searchMatch && specialtyMatch;
    });
  }, [myLinks, patientByPassport, search, mineSpecialtyFilter]);

  const myGroups = useMemo(() => {
    const groups = new Map<string, LinkRow[]>();
    for (const row of searchFilteredMyLinks) {
      const current = groups.get(row.specialty) || [];
      current.push(row);
      groups.set(row.specialty, current);
    }
    return [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b, "pt-BR"))
      .map(([specialty, rows]) => ({ specialty, rows: rows.sort((a, b) => patientName(a).localeCompare(patientName(b), "pt-BR")) }));
  }, [searchFilteredMyLinks, patientByPassport]);

  function patientName(row: LinkRow) {
    return patientByPassport.get(row.patient_passport)?.name || `Paciente ${row.patient_passport}`;
  }

  const allAdminSpecialties = useMemo(
    () => Array.from(new Set([...links, ...history].map((row) => row.specialty))).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [links, history],
  );

  const adminFilteredLinks = useMemo(() => {
    const term = normalize(search);
    return links.filter((row) => {
      const patient = patientByPassport.get(row.patient_passport);
      const doctor = doctorById.get(row.doctor_id);
      const searchMatch = !term || [patient?.name, row.patient_passport, doctor?.name, row.specialty]
        .some((value) => normalize(value).includes(term));
      const doctorMatch = !adminDoctorFilter || row.doctor_id === adminDoctorFilter;
      const specialtyMatch = !adminSpecialtyFilter || normalizeSpecialty(row.specialty) === normalizeSpecialty(adminSpecialtyFilter);
      return searchMatch && doctorMatch && specialtyMatch;
    });
  }, [links, search, adminDoctorFilter, adminSpecialtyFilter, patientByPassport, doctorById]);

  const historyFiltered = useMemo(() => {
    const term = normalize(search);
    return history.filter((row) => {
      const patient = patientByPassport.get(row.patient_passport);
      const doctor = doctorById.get(row.doctor_id);
      const searchMatch = !term || [patient?.name, row.patient_passport, doctor?.name, row.specialty, row.end_reason]
        .some((value) => normalize(value).includes(term));
      const doctorMatch = !isAdmin || !adminDoctorFilter || row.doctor_id === adminDoctorFilter;
      const specialtyMatch = !isAdmin || !adminSpecialtyFilter || normalizeSpecialty(row.specialty) === normalizeSpecialty(adminSpecialtyFilter);
      return searchMatch && doctorMatch && specialtyMatch;
    });
  }, [history, search, isAdmin, adminDoctorFilter, adminSpecialtyFilter, patientByPassport, doctorById]);

  const adminGroups = useMemo(() => {
    const doctorGroups = new Map<string, Map<string, LinkRow[]>>();
    for (const row of adminFilteredLinks) {
      const specialties = doctorGroups.get(row.doctor_id) || new Map<string, LinkRow[]>();
      const current = specialties.get(row.specialty) || [];
      current.push(row);
      specialties.set(row.specialty, current);
      doctorGroups.set(row.doctor_id, specialties);
    }

    return [...doctorGroups.entries()]
      .sort(([doctorA], [doctorB]) => (doctorById.get(doctorA)?.name || "").localeCompare(doctorById.get(doctorB)?.name || "", "pt-BR"))
      .map(([doctorId, specialtyMap]) => ({
        doctorId,
        doctor: doctorById.get(doctorId),
        specialties: [...specialtyMap.entries()]
          .sort(([a], [b]) => a.localeCompare(b, "pt-BR"))
          .map(([specialty, rows]) => ({ specialty, rows: rows.sort((a, b) => patientName(a).localeCompare(patientName(b), "pt-BR")) })),
      }));
  }, [adminFilteredLinks, doctorById, patientByPassport]);

  function openCreate() {
    const ownDoctor = doctors.find((doctor) => doctor.id === currentUserProfile.id);
    const defaultDoctorId = isAdmin ? (ownDoctor?.id || doctors[0]?.id || "") : currentUserProfile.id;
    const defaultDoctor = doctors.find((doctor) => doctor.id === defaultDoctorId);
    setModal({
      mode: "create",
      form: {
        passport: "",
        doctorId: defaultDoctorId,
        specialty: doctorSpecialties(defaultDoctor)[0] || "",
        startedAt: "",
      },
    });
    setError("");
    setMessage("");
  }

  function openEdit(row: LinkRow) {
    setModal({
      mode: "edit",
      form: {
        id: row.id,
        passport: row.patient_passport,
        doctorId: row.doctor_id,
        specialty: row.specialty,
        startedAt: toDatetimeLocal(row.started_at),
        replacementReason: "Mudança de médico",
      },
    });
    setError("");
    setMessage("");
  }

  async function saveModal() {
    if (!modal) return;
    const client = createClient();
    if (!client) return;
    const form = modal.form;
    if (!form.passport || !form.doctorId || !form.specialty) {
      setError("Selecione paciente, médico e especialidade.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (modal.mode === "create") {
        const { error: insertError } = await client.from("patient_doctor_links").insert({
          patient_passport: form.passport,
          doctor_id: form.doctorId,
          specialty: form.specialty.trim(),
        });
        if (insertError) throw insertError;
        setMessage("Vínculo criado com sucesso na nova carteira de pacientes.");
      } else {
        if (!form.id) throw new Error("Vínculo inválido.");
        const original = links.find((row) => row.id === form.id);
        if (!original) throw new Error("Vínculo original não localizado.");
        const identityChanged = original.doctor_id !== form.doctorId || normalizeSpecialty(original.specialty) !== normalizeSpecialty(form.specialty);

        if (identityChanged) {
          const { data: replaceData, error: replaceError } = await client.rpc("hpsr_replace_patient_doctor_link", {
            p_link_id: form.id,
            p_new_doctor_id: form.doctorId,
            p_new_specialty: form.specialty.trim(),
            p_end_reason: form.replacementReason || "Mudança de médico",
          });
          if (replaceError) throw replaceError;
          const result = replaceData as { ok?: boolean; error?: string; futureAppointments?: number; activeFollowups?: number } | null;
          if (!result?.ok) throw new Error(result?.error || "Não foi possível substituir o vínculo.");
          const preserved = Number(result.futureAppointments || 0) + Number(result.activeFollowups || 0);
          setMessage(preserved > 0 ? `Vínculo substituído e histórico registrado. ${preserved} compromisso(s) relacionado(s) foram preservados para revisão na Agenda do Médico.` : "Vínculo substituído e histórico registrado com sucesso.");
        } else {
          const startedAt = form.startedAt ? new Date(form.startedAt).toISOString() : undefined;
          const patch: Record<string, string> = { patient_passport: form.passport, specialty: form.specialty.trim() };
          if (startedAt) patch.started_at = startedAt;
          const { error: updateError } = await client.from("patient_doctor_links").update(patch).eq("id", form.id);
          if (updateError) throw updateError;
          setMessage("Correção cadastral do vínculo salva com sucesso.");
        }
      }
      setModal(null);
      await load();
    } catch (caught) {
      const databaseError = caught as { code?: string; message?: string };
      setError(friendlyDatabaseError(databaseError));
    } finally {
      setBusy(false);
    }
  }

  function openEnd(row: LinkRow) {
    setEndModal({ row, reason: "" });
    setError("");
    setMessage("");
  }

  async function confirmEnd() {
    if (!endModal?.reason) {
      setError("Selecione o motivo do encerramento.");
      return;
    }
    const client = createClient();
    if (!client) return;
    setBusy(true);
    setError("");
    try {
      const { data, error: rpcError } = await client.rpc("hpsr_end_patient_doctor_link", {
        p_link_id: endModal.row.id,
        p_end_reason: endModal.reason,
      });
      if (rpcError) throw rpcError;
      const result = data as { ok?: boolean; error?: string; futureAppointments?: number; activeFollowups?: number; cancelledAppointments?: number; archivedFollowups?: number; cancelledOccurrences?: number; commitmentsPreserved?: boolean } | null;
      if (!result?.ok) throw new Error(result?.error || "Não foi possível encerrar o vínculo.");
      const isNoResponse = endModal.reason === "Falta de resposta";
      const preserved = Number(result.futureAppointments || 0) + Number(result.activeFollowups || 0);
      let cancelledAppointments = Number(result.cancelledAppointments || 0);
      let archivedFollowups = Number(result.archivedFollowups || 0);

      // Compatibilidade com bancos que ainda estejam na função anterior do RPC:
      // o encerramento por falta de resposta não pode preservar compromissos ativos.
      if (isNoResponse && result.commitmentsPreserved !== false) {
        const endedAt = new Date().toISOString();
        const doctorId = endModal.row.doctor_id;
        const specialtyKey = normalizeSpecialty(endModal.row.specialty);

        const { data: appointmentRows, error: appointmentReadError } = await client
          .from("appointments")
          .select("id,status,payload")
          .eq("passport", endModal.row.patient_passport);
        if (appointmentReadError) throw appointmentReadError;
        const activeAppointmentIds = (appointmentRows || []).filter((item: any) => {
          const payload = (item.payload || {}) as Record<string, unknown>;
          const itemDoctorId = String(payload.doctorId || payload.doctor_id || payload.acceptedById || "");
          const itemSpecialty = normalizeSpecialty(String(payload.specialty || ""));
          return itemDoctorId === doctorId
            && itemSpecialty === specialtyKey
            && !["Realizada","Concluída","Concluído","Não compareceu","Cancelada","Recusada","Recusado","Arquivado","Encerrado"].includes(String(item.status || ""));
        });
        for (const item of activeAppointmentIds) {
          const payload = { ...((item as any).payload || {}), appointmentManagementStatus: "Sem resposta", appointmentManagementNote: "Encerrado automaticamente com o vínculo por falta de resposta.", cancellationReason: "Falta de resposta", cancelledAt: endedAt, cancelledById: currentUserProfile.id, cancelledByName: currentUserProfile.systemName, updatedAt: endedAt };
          const { error: appointmentUpdateError } = await client.from("appointments").update({ status: "Cancelada", payload, updated_at: endedAt }).eq("id", item.id);
          if (appointmentUpdateError) throw appointmentUpdateError;
        }
        cancelledAppointments = activeAppointmentIds.length;

        const { data: planRows, error: plansReadError } = await client
          .from("clinical_followup_plans")
          .select("id,status,specialty")
          .eq("patient_passport", endModal.row.patient_passport)
          .eq("doctor_id", doctorId);
        if (plansReadError) throw plansReadError;
        const activePlans = (planRows || []).filter((plan: any) => normalizeSpecialty(String(plan.specialty || "")) === specialtyKey && !["Arquivado","Concluído","Concluída","Cancelado","Cancelada"].includes(String(plan.status || "Ativo")));
        const activePlanIds = activePlans.map((plan: any) => String(plan.id));
        if (activePlanIds.length) {
          const { data: occurrenceRows, error: occurrenceReadError } = await client
            .from("clinical_followup_occurrences")
            .select("id,status")
            .in("plan_id", activePlanIds);
          if (occurrenceReadError) throw occurrenceReadError;
          const activeOccurrenceIds = (occurrenceRows || [])
            .filter((occurrence: any) => !["Realizada","Concluída","Concluído","Cancelado","Cancelada","Não compareceu"].includes(String(occurrence.status || "")))
            .map((occurrence: any) => String(occurrence.id));
          if (activeOccurrenceIds.length) {
            const { error: occurrenceUpdateError } = await client
              .from("clinical_followup_occurrences")
              .update({ status: "Cancelado", updated_at: endedAt })
              .in("id", activeOccurrenceIds);
            if (occurrenceUpdateError) throw occurrenceUpdateError;
          }

          const { error: planUpdateError } = await client
            .from("clinical_followup_plans")
            .update({ status: "Arquivado", updated_at: endedAt })
            .in("id", activePlanIds);
          if (planUpdateError) throw planUpdateError;
        }
        archivedFollowups = activePlanIds.length;
      }

      setEndModal(null);
      if (isNoResponse) {
        const details = [
          cancelledAppointments ? `${cancelledAppointments} consulta(s)/solicitação(ões) ativa(s) encerrada(s)` : "",
          archivedFollowups ? `${archivedFollowups} acompanhamento(s) ativo(s) arquivado(s)` : "",
        ].filter(Boolean).join(" e ");
        setMessage(details ? `Vínculo encerrado por falta de resposta e mantido somente no histórico. ${details}.` : "Vínculo encerrado por falta de resposta e mantido somente no histórico.");
      } else {
        setMessage(preserved > 0 ? `Vínculo encerrado e registrado no histórico. ${preserved} compromisso(s) relacionado(s) permanecem na Agenda do Médico para revisão.` : "Vínculo encerrado e registrado no histórico com sucesso.");
      }
      await load();
    } catch (caught) {
      setError(friendlyDatabaseError(caught as { code?: string; message?: string }));
    } finally {
      setBusy(false);
    }
  }

  function toggleExpanded(id: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSpecialty(key: string) {
    setCollapsedSpecialties((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleDoctor(key: string) {
    setCollapsedDoctors((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const hasAdminFilters = Boolean(adminDoctorFilter || adminSpecialtyFilter);

  function clearAdminFilters() {
    setAdminDoctorFilter("");
    setAdminSpecialtyFilter("");
  }

  return (
    <div className="hpsr-page hpsr-schedule-page hpsr-patients-page gap-3 bg-[#eadbce] px-1.5 pb-2 sm:px-2">
      <PageHeader compact schedule eyebrow="Agendamentos" title="Meus pacientes" description="Gerencie os pacientes sob sua responsabilidade." />

      <header className="flex shrink-0 flex-col gap-3 px-2 pb-1 sm:flex-row sm:items-center sm:justify-between sm:px-3">
        <div>
          <h1 className="text-[clamp(1.55rem,2.2vw,2rem)] font-black tracking-tight text-[#4b1b13]">Meus pacientes</h1>
          <p className="mt-0.5 text-sm font-semibold text-[#7f6356]">Gerencie os pacientes sob sua responsabilidade.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/agendamento/clinica" className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-[12px] border border-[#b98770] bg-[#efe1d5] px-4 text-xs font-black text-[#5b2117] transition hover:bg-[#e7d3c4]">
            <CalendarClock size={15} /> Agenda do médico
          </Link>
          <button type="button" onClick={openCreate} className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-[12px] bg-[linear-gradient(135deg,#71301f,#4b190f)] px-4 text-xs font-black text-[#fff5ed] shadow-[0_6px_14px_rgba(73,25,15,.18)] transition hover:brightness-105">
            <Plus size={16} /> Novo vínculo
          </button>
        </div>
      </header>

      <nav className="shrink-0 rounded-[14px] border border-[#8b594c] bg-[linear-gradient(110deg,#4a211a,#6b352a_65%,#7b4638)] p-1.5 shadow-[0_7px_18px_rgba(62,23,14,.12)]">
        <div className="grid gap-1.5 sm:grid-cols-3">
          <button type="button" onClick={() => setView("mine")} className={`inline-flex min-h-[40px] items-center justify-center gap-2 rounded-[10px] px-4 text-xs font-black transition ${view === "mine" ? "bg-[#8a3a22] text-white shadow-sm" : "text-[#f1ddd0] hover:bg-white/10 hover:text-white"}`}><UsersRound size={14}/> Minha carteira</button>
          {isAdmin ? <button type="button" onClick={() => setView("admin")} className={`inline-flex min-h-[40px] items-center justify-center gap-2 rounded-[10px] px-4 text-xs font-black transition ${view === "admin" ? "bg-[#8a3a22] text-white shadow-sm" : "text-[#f1ddd0] hover:bg-white/10 hover:text-white"}`}><ShieldCheck size={14}/> Visão administrativa</button> : <span className="hidden sm:block" />}
          <button type="button" onClick={() => setView("history")} className={`inline-flex min-h-[40px] items-center justify-center gap-2 rounded-[10px] px-4 text-xs font-black transition ${view === "history" ? "bg-[#8a3a22] text-white shadow-sm" : "text-[#f1ddd0] hover:bg-white/10 hover:text-white"}`}><History size={14}/> Histórico</button>
        </div>
      </nav>

      {message && <div className="shrink-0 rounded-[12px] border border-emerald-300/80 bg-[#dce9da] px-3.5 py-2.5 text-sm font-bold text-emerald-900">{message}</div>}
      {error && !modal && <div className="shrink-0 rounded-[12px] border border-rose-300 bg-[#efd9d4] px-3.5 py-2.5 text-sm font-bold text-rose-900">{error}</div>}

      <section className="shrink-0 border-b border-[#c8a991] pb-3">
        <div className={`grid gap-2.5 ${view === "mine" ? "lg:grid-cols-[minmax(300px,1fr)_300px]" : isAdmin ? "lg:grid-cols-[minmax(280px,1fr)_240px_240px_auto]" : "lg:grid-cols-[minmax(300px,1fr)]"}`}>
          <div className="relative min-w-0">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#85513d]" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={view === "mine" ? "Buscar paciente ou passaporte..." : view === "history" ? "Buscar no histórico..." : "Buscar paciente, passaporte ou médico..."} className={`${fieldClass} pl-10 placeholder:font-medium placeholder:text-[#9b7d6c]`} />
          </div>

          {view === "mine" && (
            <div className="min-w-0">
              <StyledSelect className={fieldClass} value={mineSpecialtyFilter} onChange={(event) => setMineSpecialtyFilter(event.target.value)} searchable>
                <option value="">Todas as especialidades</option>
                {mySpecialties.map((specialty) => <option key={specialty} value={specialty}>{specialty}</option>)}
              </StyledSelect>
            </div>
          )}

          {view !== "mine" && isAdmin && <>
            <StyledSelect className={fieldClass} value={adminDoctorFilter} onChange={(event) => setAdminDoctorFilter(event.target.value)} searchable><option value="">Todos os médicos</option>{doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name}</option>)}</StyledSelect>
            <StyledSelect className={fieldClass} value={adminSpecialtyFilter} onChange={(event) => setAdminSpecialtyFilter(event.target.value)} searchable><option value="">Todas as especialidades</option>{allAdminSpecialties.map((specialty) => <option key={specialty} value={specialty}>{specialty}</option>)}</StyledSelect>
            <button type="button" onClick={clearAdminFilters} disabled={!hasAdminFilters} className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-[12px] border border-[#c6a58f] bg-[#e7d5c7] px-3 text-xs font-black text-[#78503f] transition hover:bg-[#dfc9b9] disabled:opacity-40"><RotateCcw size={14}/> Limpar</button>
          </>}
        </div>
      </section>

      <section className="hpsr-patients-scroll min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch]">
        {(loading || patientsLoading) ? (
          <div className="flex min-h-[300px] items-center justify-center gap-2 text-sm font-bold text-[#806657]"><Loader2 size={18} className="animate-spin"/> Carregando carteira...</div>
        ) : view === "mine" ? (
          myGroups.length ? <div className="space-y-3">
            {myGroups.map((group) => {
              const key=`mine:${group.specialty}`;
              const collapsed=collapsedSpecialties.has(key);
              return <section key={key} className="overflow-hidden rounded-[16px] border border-[#c9a991] bg-[#e6d5c7]">
                <button type="button" onClick={() => toggleSpecialty(key)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-[#dec8b8] sm:px-5">
                  <div className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-[#ead9cd] text-[#6a281b]"><Stethoscope size={17}/></span><div className="min-w-0"><p className="truncate text-sm font-black text-[#3f2119]">{group.specialty}</p><p className="mt-0.5 text-[11px] font-semibold text-[#7d6456]">{group.rows.length} paciente{group.rows.length === 1 ? "" : "s"} vinculado{group.rows.length === 1 ? "" : "s"}</p></div></div>
                  {collapsed ? <ChevronDown size={16} className="text-[#6d3b2c]"/> : <ChevronUp size={16} className="text-[#6d3b2c]"/>}
                </button>
                {!collapsed && <div className="border-t border-[#c7a78f]">{group.rows.map((row) => <PatientLinkCard key={row.id} row={row} patient={patientByPassport.get(row.patient_passport)} doctor={doctorById.get(row.doctor_id)} expanded={expanded.has(row.id)} onToggle={() => toggleExpanded(row.id)} onEdit={() => openEdit(row)} onEnd={() => openEnd(row)} showDoctor={false} intakeStatus={intakeStatus}/>)}</div>}
              </section>;
            })}
          </div> : <EmptyState title="Sua carteira está vazia" text={search || mineSpecialtyFilter ? "Nenhum paciente da sua carteira corresponde aos filtros." : "Quando um vínculo for criado para você, o paciente aparecerá aqui agrupado por especialidade."}/>
        ) : view === "history" ? (
          historyFiltered.length ? <div className="space-y-2.5">{historyFiltered.map((row) => <HistoryLinkCard key={row.id} row={row} patient={patientByPassport.get(row.patient_passport)} doctor={doctorById.get(row.doctor_id)}/>)}</div> : <EmptyState title="Histórico vazio" text={search ? "Nenhum vínculo encerrado corresponde à busca." : "Os vínculos encerrados ou substituídos aparecerão aqui."}/>
        ) : isAdmin ? (
          adminGroups.length ? <div className="space-y-3">{adminGroups.map((doctorGroup) => {
            const doctorKey=`admin-doctor:${doctorGroup.doctorId}`;
            const doctorCollapsed=collapsedDoctors.has(doctorKey);
            const total=doctorGroup.specialties.reduce((sum,group)=>sum+group.rows.length,0);
            return <section key={doctorKey} className="overflow-hidden rounded-[16px] border border-[#c9a991] bg-[#e4d1c1]">
              <button type="button" onClick={() => toggleDoctor(doctorKey)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-[#dcc4b4] sm:px-5">
                <div className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#6b2a1c] text-[#f8e9de]"><CircleUserRound size={18}/></span><div className="min-w-0"><p className="truncate text-sm font-black text-[#3f2119]">{doctorGroup.doctor?.name || "Médico não localizado"}</p><p className="mt-0.5 text-[11px] font-semibold text-[#7d6456]">{doctorGroup.doctor?.role || "Profissional"} · {total} vínculo{total===1?"":"s"}</p></div></div>
                {doctorCollapsed ? <ChevronDown size={16} className="text-[#6d3b2c]"/> : <ChevronUp size={16} className="text-[#6d3b2c]"/>}
              </button>
              {!doctorCollapsed && <div className="space-y-2.5 border-t border-[#c7a78f] p-2.5">{doctorGroup.specialties.map((group) => {
                const specialtyKey=`${doctorKey}:${group.specialty}`;
                const specialtyCollapsed=collapsedSpecialties.has(specialtyKey);
                return <section key={specialtyKey} className="overflow-hidden rounded-[14px] border border-[#c9ad99] bg-[#e9d9cc]"><button type="button" onClick={() => toggleSpecialty(specialtyKey)} className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left hover:bg-[#dfcabb]"><div className="flex items-center gap-2.5"><Stethoscope size={14} className="text-[#6b2a1c]"/><span className="text-xs font-black text-[#3f2119]">{group.specialty}</span><span className="rounded-full bg-[#d9c0ae] px-2 py-0.5 text-[9px] font-black text-[#684333]">{group.rows.length}</span></div>{specialtyCollapsed ? <ChevronDown size={14}/> : <ChevronUp size={14}/>}</button>{!specialtyCollapsed && <div className="border-t border-[#c9ad99]">{group.rows.map((row) => <PatientLinkCard key={row.id} row={row} patient={patientByPassport.get(row.patient_passport)} doctor={doctorGroup.doctor} expanded={expanded.has(row.id)} onToggle={() => toggleExpanded(row.id)} onEdit={() => openEdit(row)} onEnd={() => openEnd(row)} showDoctor={false} intakeStatus={intakeStatus}/>)}</div>}</section>;
              })}</div>}
            </section>;
          })}</div> : <EmptyState title="Nenhum vínculo encontrado" text="Ajuste os filtros ou a busca para localizar outros vínculos."/>
        ) : null}
      </section>

      {modal && (
        <LinkModal
          mode={modal.mode}
          form={modal.form}
          setForm={(form) => setModal((current) => current ? { ...current, form } : current)}
          patients={patients}
          doctors={doctors}
          isAdmin={isAdmin}
          currentDoctorId={currentUserProfile.id}
          busy={busy}
          error={error}
          onClose={() => { setModal(null); setError(""); }}
          onSave={() => void saveModal()}
        />
      )}

      {endModal && (
        <EndLinkModal
          state={endModal}
          setState={setEndModal}
          patient={patientByPassport.get(endModal.row.patient_passport)}
          doctor={doctorById.get(endModal.row.doctor_id)}
          busy={busy}
          error={error}
          onClose={() => { setEndModal(null); setError(""); }}
          onConfirm={() => void confirmEnd()}
        />
      )}
    </div>
  );
}

function PatientLinkCard({
  row,
  patient,
  doctor,
  expanded,
  onToggle,
  onEdit,
  onEnd,
  showDoctor = true,
  intakeStatus,
}: {
  row: LinkRow;
  patient?: SharedPatient;
  doctor?: Doctor;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onEnd: () => void;
  showDoctor?: boolean;
  intakeStatus: Map<string, IntakeFormStatus>;
}) {
  const name = patient?.name || `Paciente ${row.patient_passport}`;
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "P";
  const normalizedSpecialty = normalizeSpecialty(row.specialty);
  const formType = normalizedSpecialty === "ginecologia" ? "ivf_ropa" : normalizedSpecialty === "obstetra" ? "gestational" : null;
  const form = formType ? intakeStatus.get(`${row.patient_passport}|${formType}`) : undefined;
  const formStatusLabel = !form ? "Não solicitada" : form.status === "requested" ? "Aguardando paciente" : form.status === "draft" ? "Em preenchimento" : form.status === "submitted" ? "Enviada ao médico" : form.status === "reviewed" ? "Analisada" : "Encerrada";
  const formStatusClass = !form ? "bg-[#f2e9e3] text-hpsr-muted" : form.status === "submitted" ? "bg-[#f5dfd7] text-hpsr-wine" : form.status === "reviewed" ? "bg-[#eadfd7] text-[#573126]" : "bg-[#f7eee8] text-hpsr-wine";

  return (
    <article className="border-b border-[#cdb29f] bg-[#eadccd] last:border-b-0">
      <div className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1.35fr)_160px_150px_auto] sm:items-center sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#dcc2b0] text-xs font-black text-[#6a291d]">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-hpsr-text">{name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-[#765c4e]">
              <span>Passaporte {row.patient_passport}</span>
              {patient?.age && <><span>·</span><span>{patient.age} anos</span></>}
              {patient?.sex && <><span>·</span><span>{patient.sex}</span></>}
              {showDoctor && doctor && <><span>·</span><span className="truncate">{doctor.name}</span></>}
            </div>
          </div>
        </div>

        <div className="border-l border-[#cdb29f] pl-4"><p className="text-[9px] font-black uppercase tracking-[.14em] text-[#805342]">Vínculo</p><span className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-[#d8eadb] px-2.5 py-1 text-[10px] font-black text-emerald-800"><span className="h-1.5 w-1.5 rounded-full bg-emerald-700"/>Ativo</span></div>
        <div className="border-l border-[#cdb29f] pl-4"><p className="text-[9px] font-black uppercase tracking-[.14em] text-[#805342]">Desde</p><p className="mt-1 text-xs font-black text-[#3f2119]">{formatStartedAt(row.started_at).split(",")[0]}</p></div>
        <button type="button" onClick={onToggle} className="inline-flex min-h-[36px] shrink-0 items-center justify-center gap-1.5 rounded-[11px] border border-[#ba927b] bg-[#e5d1c2] px-3 text-xs font-black text-[#632619] transition hover:bg-[#dcc3b2]">
          <Pencil size={13}/>{expanded ? "Fechar" : "Gerenciar vínculo"}{expanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>} 
        </button>
      </div>

      {expanded && (
        <div className="border-t border-[#cdb29f] bg-[#dfccbd] px-4 py-3 sm:px-5">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <Detail icon={<Stethoscope size={13} />} label="Especialidade" value={row.specialty} />
            <Detail icon={<CalendarClock size={13} />} label="Início do vínculo" value={formatStartedAt(row.started_at)} />
            <Detail icon={<MessageCircle size={13} />} label="Discord · preferencial" value={patient?.discord || "Não informado"} />
            <Detail icon={<Phone size={13} />} label="Telefone da cidade" value={patient?.cityPhone || "Não informado"} />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            {["obstetra","ginecologia"].includes(normalizeSpecialty(row.specialty)) && <span className={`inline-flex min-h-[32px] items-center gap-1.5 rounded-[9px] px-2.5 text-[10px] font-black ${formStatusClass}`}><ClipboardList size={12}/> Ficha: {formStatusLabel}</span>}
            <div className="ml-auto flex flex-wrap justify-end gap-2">
            {["obstetra","ginecologia"].includes(normalizeSpecialty(row.specialty)) && <Link href={`/dashboard/obstetra?patient=${encodeURIComponent(row.patient_passport)}&specialty=${encodeURIComponent(row.specialty)}`} className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[10px] bg-hpsr-wine px-3 text-xs font-black text-white transition hover:brightness-105"><HeartPulse size={13}/> Ver acompanhamento</Link>}
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[10px] border border-hpsr-border bg-[#eadccd] px-3 text-xs font-black text-[#632619] transition hover:bg-[#e0cbbb]"
            >
              <Pencil size={13} /> Corrigir vínculo
            </button>
            <button
              type="button"
              onClick={onEnd}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[10px] border border-rose-200 bg-rose-50 px-3 text-xs font-black text-rose-800 transition hover:bg-rose-100"
            >
              <UserRoundX size={13} /> Encerrar vínculo
            </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function HistoryLinkCard({ row, patient, doctor }: { row: HistoryRow; patient?: SharedPatient; doctor?: Doctor }) {
  const name = patient?.name || `Paciente ${row.patient_passport}`;
  return (
    <article className="rounded-[14px] border border-[#c9aa94] bg-[#e4d1c1] px-4 py-3.5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-black text-hpsr-text">{name}</p>
            <span className="rounded-full bg-[#f6ece7] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-hpsr-wine">Encerrado</span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-semibold text-hpsr-muted">
            <span className="inline-flex items-center gap-1"><IdCard size={11} /> {row.patient_passport}</span>
            <span>{doctor?.name || "Médico não localizado"}</span>
            <span className="text-hpsr-wine">{row.specialty}</span>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[520px]">
          <Detail icon={<CalendarClock size={13} />} label="Início" value={formatStartedAt(row.started_at)} />
          <Detail icon={<History size={13} />} label="Encerramento" value={formatStartedAt(row.ended_at)} />
          <Detail icon={<UserRoundX size={13} />} label="Motivo" value={row.end_reason} />
        </div>
      </div>
    </article>
  );
}

function Detail({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[11px] border border-[#c8ab97] bg-[#eadacd] px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-hpsr-muted">
        {icon}
        <p className="text-[9px] font-black uppercase tracking-[0.1em]">{label}</p>
      </div>
      <p className="mt-1.5 break-words text-xs font-bold text-hpsr-text">{value}</p>
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="grid min-h-[260px] place-items-center rounded-[16px] border border-dashed border-[#bc9d87] bg-[#e5d3c5] p-6 text-center">
      <div className="max-w-md">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#f5ece7] text-hpsr-wine">
          <UsersRound size={20} />
        </span>
        <h3 className="mt-3 text-base font-black text-hpsr-text">{title}</h3>
        <p className="mt-1 text-sm font-medium leading-relaxed text-hpsr-muted">{text}</p>
      </div>
    </div>
  );
}

function EndLinkModal({
  state,
  setState,
  patient,
  doctor,
  busy,
  error,
  onClose,
  onConfirm,
}: {
  state: EndModalState;
  setState: (state: EndModalState) => void;
  patient?: SharedPatient;
  doctor?: Doctor;
  busy: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="hpsr-modal-tone fixed inset-0 z-[999] flex items-end justify-center bg-[#2a0700]/35 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-t-[24px] border border-[#c9ad99] bg-[#eadbce] shadow-2xl sm:rounded-[22px]">
        <div className="flex items-start justify-between gap-4 border-b border-[#c8ab97] bg-[#e1ccbc] px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-rose-50 text-rose-700"><UserRoundX size={18}/></span>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-hpsr-muted">Encerramento de vínculo</p>
              <h2 className="mt-0.5 truncate text-lg font-black text-hpsr-text">{patient?.name || `Paciente ${state.row.patient_passport}`}</h2>
              <p className="mt-1 text-sm font-medium text-hpsr-muted">{doctor?.name || "Médico"} · {state.row.specialty}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border border-hpsr-border bg-[#eadacd] text-hpsr-muted"><X size={17}/></button>
        </div>
        <div className="space-y-4 p-5">
          {error && <div className="rounded-[13px] border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm font-bold text-rose-900">{error}</div>}
          <div>
            <label className={labelClass}>Motivo do encerramento</label>
            <StyledSelect className={fieldClass} value={state.reason} onChange={(event) => setState({ ...state, reason: event.target.value })}>
              <option value="">Selecione o motivo</option>
              {LINK_END_REASONS.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
            </StyledSelect>
          </div>
          {state.reason === "Falta de resposta" ? (
            <div className="rounded-[13px] border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs font-semibold leading-relaxed text-rose-900">Ao encerrar por falta de resposta, o vínculo fica apenas no histórico. Consultas/solicitações ainda ativas serão canceladas e acompanhamentos ativos serão arquivados, sem apagar o histórico clínico já registrado.</div>
          ) : (
            <div className="rounded-[13px] border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs font-semibold leading-relaxed text-amber-900">Nos demais motivos, consultas futuras e acompanhamentos já existentes permanecem preservados para revisão na Agenda do Médico.</div>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-[#c8ab97] bg-[#dfcbbb] px-5 py-3.5">
          <button type="button" disabled={busy} onClick={onClose} className="min-h-[42px] rounded-[13px] border border-hpsr-border bg-[#eadacd] px-4 text-sm font-black text-hpsr-text">Cancelar</button>
          <button type="button" disabled={busy || !state.reason} onClick={onConfirm} className="inline-flex min-h-[42px] min-w-[150px] items-center justify-center gap-2 rounded-[13px] bg-rose-700 px-4 text-sm font-black text-white disabled:opacity-50">{busy ? <Loader2 size={16} className="animate-spin"/> : <UserRoundX size={16}/>} Encerrar vínculo</button>
        </div>
      </div>
    </div>
  );
}

function LinkModal({
  mode,
  form,
  setForm,
  patients,
  doctors,
  isAdmin,
  currentDoctorId,
  busy,
  error,
  onClose,
  onSave,
}: {
  mode: ModalMode;
  form: LinkForm;
  setForm: (form: LinkForm) => void;
  patients: SharedPatient[];
  doctors: Doctor[];
  isAdmin: boolean;
  currentDoctorId: string;
  busy: boolean;
  error: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const selectedDoctor = doctors.find((doctor) => doctor.id === form.doctorId);
  const specialties = doctorSpecialties(selectedDoctor);

  function changeDoctor(doctorId: string) {
    const doctor = doctors.find((item) => item.id === doctorId);
    const allowed = doctorSpecialties(doctor);
    setForm({ ...form, doctorId, specialty: allowed.includes(form.specialty) ? form.specialty : allowed[0] || "" });
  }

  return (
    <div className="hpsr-modal-tone fixed inset-0 z-[999] flex items-end justify-center bg-[#2a0700]/35 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-t-[24px] border border-[#c9ad99] bg-[#eadbce] shadow-2xl sm:rounded-[22px]">
        <div className="flex items-start justify-between gap-4 border-b border-[#c8ab97] bg-[#e1ccbc] px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[#f5ece7] text-hpsr-wine"><UsersRound size={18}/></span>
            <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[0.12em] text-hpsr-muted">Meus Pacientes</p><h2 className="mt-0.5 text-lg font-black text-hpsr-text">{mode === "create" ? "Criar vínculo" : "Corrigir vínculo"}</h2><p className="mt-1 text-sm font-medium leading-relaxed text-hpsr-muted">{mode === "create" ? "Registre paciente, médico e especialidade." : "Use esta edição apenas para corrigir um cadastro feito de forma incorreta."}</p></div>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border border-hpsr-border bg-[#eadacd] text-hpsr-muted transition hover:bg-[#dfc9ba] hover:text-hpsr-text"><X size={17}/></button>
        </div>

        <div className="space-y-4 p-4 sm:p-6">
          {mode === "edit" && <div className="rounded-[13px] border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs font-semibold leading-relaxed text-amber-900">Correções cadastrais simples são salvas no vínculo atual. Se você trocar médico ou especialidade, o sistema encerrará o vínculo anterior, registrará o histórico e criará um novo automaticamente.</div>}
          {error && <div className="rounded-[13px] border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm font-bold text-rose-900">{error}</div>}

          <div>
            <label className={labelClass}>Paciente</label>
            <StyledSelect className={fieldClass} value={form.passport} onChange={(event) => setForm({ ...form, passport: event.target.value })} searchable>
              <option value="">Selecione um paciente</option>
              {patients.map((patient) => <option key={patient.passport} value={patient.passport}>{patient.name} · {patient.passport}</option>)}
            </StyledSelect>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Médico</label>
              {isAdmin ? (
                <StyledSelect className={fieldClass} value={form.doctorId} onChange={(event) => changeDoctor(event.target.value)} searchable>
                  <option value="">Selecione o médico</option>
                  {doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name}</option>)}
                </StyledSelect>
              ) : (
                <div className={`${fieldClass} flex items-center`}>{doctors.find((doctor) => doctor.id === currentDoctorId)?.name || "Médico atual"}</div>
              )}
            </div>
            <div>
              <label className={labelClass}>Especialidade</label>
              <StyledSelect className={fieldClass} value={form.specialty} onChange={(event) => setForm({ ...form, specialty: event.target.value })} searchable>
                <option value="">Selecione a especialidade</option>
                {specialties.map((specialty) => <option key={specialty} value={specialty}>{specialty}</option>)}
              </StyledSelect>
            </div>
          </div>

          {mode === "edit" && (
            <div>
              <label className={labelClass}>Motivo caso haja troca de médico/especialidade</label>
              <StyledSelect className={fieldClass} value={form.replacementReason || "Mudança de médico"} onChange={(event) => setForm({ ...form, replacementReason: event.target.value })}>
                {LINK_END_REASONS.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
              </StyledSelect>
            </div>
          )}

          {mode === "edit" && (
            <div>
              <label className={labelClass}>Início do vínculo</label>
              <div className="relative"><CalendarClock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-hpsr-wineLight"/><input type="datetime-local" value={form.startedAt} onChange={(event) => setForm({ ...form, startedAt: event.target.value })} className={`${fieldClass} pl-10`}/></div>
            </div>
          )}

          <div className="rounded-[13px] border border-[#c8ab97] bg-[#e5d3c5] px-3.5 py-3 text-xs font-semibold leading-relaxed text-hpsr-muted">
            Este vínculo é a fonte oficial da relação médico-paciente. O Portal passa a exibir novos horários deste médico e especialidade enquanto o vínculo estiver ativo; consultas já marcadas continuam preservadas mesmo após o encerramento.
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#c8ab97] bg-[#dfcbbb] px-4 py-3.5 sm:px-6">
          <button type="button" disabled={busy} onClick={onClose} className="min-h-[42px] rounded-[13px] border border-hpsr-border bg-[#eadacd] px-4 text-sm font-black text-hpsr-text">Cancelar</button>
          <button type="button" disabled={busy} onClick={onSave} className="inline-flex min-h-[42px] min-w-[150px] items-center justify-center gap-2 rounded-[13px] bg-hpsr-wine px-4 text-sm font-black text-white disabled:opacity-50">{busy ? <Loader2 size={16} className="animate-spin"/> : mode === "create" ? <Plus size={16}/> : <Pencil size={16}/>} {mode === "create" ? "Criar vínculo" : "Salvar correção"}</button>
        </div>
      </div>
    </div>
  );
}
