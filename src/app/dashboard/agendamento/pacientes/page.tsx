"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  CircleUserRound,
  Filter,
  History,
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
  "Mudança de médico",
  "Impossibilidade de continuidade",
] as const;

const fieldClass = "min-h-[46px] w-full rounded-[14px] border border-hpsr-border bg-white px-3.5 text-sm font-semibold text-hpsr-text outline-none transition focus:border-hpsr-wine focus:ring-2 focus:ring-hpsr-wineLight/20";
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

const UNRESTRICTED_SPECIALTY_ROLES = new Set(["Diretor Técnico / Dev", "Diretora", "Vice Diretor"]);

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
  const [adminDoctorFilter, setAdminDoctorFilter] = useState("");
  const [adminSpecialtyFilter, setAdminSpecialtyFilter] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
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
      const [linksResult, historyResult, profilesResult, adminResult] = await Promise.all([
        client.from("patient_doctor_links").select("id,patient_passport,doctor_id,specialty,started_at").order("started_at", { ascending: false }),
        client.from("patient_doctor_link_history").select("id,patient_passport,doctor_id,specialty,started_at,ended_at,end_reason").order("ended_at", { ascending: false }),
        client.from("profiles").select("id,name,role,specialty,crm,access_status").eq("access_status", "Aprovado").order("name"),
        client.rpc("hpsr_is_patient_link_admin"),
      ]);

      if (linksResult.error) throw linksResult.error;
      if (historyResult.error) throw historyResult.error;
      if (profilesResult.error) throw profilesResult.error;
      if (adminResult.error) throw adminResult.error;

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

  const searchFilteredMyLinks = useMemo(() => {
    const term = normalize(search);
    if (!term) return myLinks;
    return myLinks.filter((row) => {
      const patient = patientByPassport.get(row.patient_passport);
      return [patient?.name, row.patient_passport, row.specialty]
        .some((value) => normalize(value).includes(term));
    });
  }, [myLinks, patientByPassport, search]);

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
      const result = data as { ok?: boolean; error?: string; futureAppointments?: number; activeFollowups?: number } | null;
      if (!result?.ok) throw new Error(result?.error || "Não foi possível encerrar o vínculo.");
      const preserved = Number(result.futureAppointments || 0) + Number(result.activeFollowups || 0);
      setEndModal(null);
      setMessage(preserved > 0 ? `Vínculo encerrado e registrado no histórico. ${preserved} compromisso(s) relacionado(s) permanecem na Agenda do Médico para revisão.` : "Vínculo encerrado e registrado no histórico com sucesso.");
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
    <div className="hpsr-page hpsr-patients-page gap-3">
      <PageHeader eyebrow="Agendamentos" title="Meus Pacientes" description="Carteira de vínculos médico-paciente organizada por especialidade." />

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] border border-hpsr-border bg-white shadow-[0_12px_34px_rgba(74,38,24,0.06)]">
        <div className="border-b border-hpsr-border bg-[linear-gradient(180deg,#fffdfb_0%,#fff9f5_100%)] px-3 py-3.5 sm:px-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="inline-flex w-full rounded-[13px] border border-[#eadbd5] bg-white p-1 sm:w-auto">
              <button
                type="button"
                onClick={() => setView("mine")}
                className={`flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-[10px] px-4 text-xs font-black transition sm:min-w-[150px] ${view === "mine" ? "bg-hpsr-wine text-white shadow-sm" : "text-hpsr-muted hover:bg-[#fff8f4] hover:text-hpsr-text"}`}
              >
                <UsersRound size={14} /> Minha carteira
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setView("admin")}
                  className={`flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-[10px] px-4 text-xs font-black transition sm:min-w-[170px] ${view === "admin" ? "bg-hpsr-wine text-white shadow-sm" : "text-hpsr-muted hover:bg-[#fff8f4] hover:text-hpsr-text"}`}
                >
                  <ShieldCheck size={14} /> Visão administrativa
                </button>
              )}
              <button
                type="button"
                onClick={() => setView("history")}
                className={`flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-[10px] px-4 text-xs font-black transition sm:min-w-[130px] ${view === "history" ? "bg-hpsr-wine text-white shadow-sm" : "text-hpsr-muted hover:bg-[#fff8f4] hover:text-hpsr-text"}`}
              >
                <History size={14} /> Histórico
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
              <Link
                href="/dashboard/agendamento/clinica"
                className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[12px] border border-hpsr-border bg-white px-3.5 text-xs font-black text-hpsr-wine shadow-sm transition hover:-translate-y-0.5 hover:border-hpsr-wineLight hover:bg-[#fff9f5]"
              >
                <ArrowLeft size={15} /> Agenda do Médico
              </Link>
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[12px] bg-[linear-gradient(135deg,#742b18_0%,#45150b_100%)] px-4 text-xs font-black text-white shadow-[0_8px_18px_rgba(83,31,16,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(83,31,16,0.24)] sm:text-sm"
              >
                <Plus size={16} /> Novo vínculo
              </button>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
          {message && <div className="mb-4 rounded-[13px] border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm font-bold text-emerald-900">{message}</div>}
          {error && !modal && <div className="mb-4 rounded-[13px] border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm font-bold text-rose-900">{error}</div>}

          <div className="mb-3 rounded-[15px] border border-hpsr-border bg-[#fffaf7] p-2.5 sm:p-3">
            <div className={`grid gap-2.5 ${view !== "mine" && isAdmin ? "lg:grid-cols-[minmax(260px,1fr)_220px_220px_auto]" : "lg:grid-cols-[minmax(280px,520px)]"}`}>
              <div className="relative min-w-0">
                <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-hpsr-muted" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={view === "mine" ? "Buscar paciente ou passaporte..." : view === "history" ? "Buscar no histórico..." : "Buscar paciente, passaporte ou médico..."}
                  className={`${fieldClass} bg-white pl-10 placeholder:font-medium placeholder:text-zinc-400`}
                />
              </div>

              {view !== "mine" && isAdmin && (
                <>
                  <div className="min-w-0">
                    <StyledSelect value={adminDoctorFilter} onChange={(event) => setAdminDoctorFilter(event.target.value)} searchable>
                      <option value="">Todos os médicos</option>
                      {doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name}</option>)}
                    </StyledSelect>
                  </div>
                  <div className="min-w-0">
                    <StyledSelect value={adminSpecialtyFilter} onChange={(event) => setAdminSpecialtyFilter(event.target.value)} searchable>
                      <option value="">Todas as especialidades</option>
                      {allAdminSpecialties.map((specialty) => <option key={specialty} value={specialty}>{specialty}</option>)}
                    </StyledSelect>
                  </div>
                  <button
                    type="button"
                    onClick={clearAdminFilters}
                    disabled={!hasAdminFilters}
                    className="inline-flex min-h-[46px] items-center justify-center gap-1.5 rounded-[12px] border border-hpsr-border bg-white px-3 text-xs font-black text-hpsr-muted transition hover:text-hpsr-wine disabled:cursor-default disabled:opacity-40"
                  >
                    <RotateCcw size={14} /> Limpar
                  </button>
                </>
              )}
            </div>
            {view !== "mine" && isAdmin && (
              <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-hpsr-muted">
                <Filter size={12} /> Use os filtros para localizar rapidamente um vínculo específico.
              </div>
            )}
          </div>

          <div className="hpsr-patients-scroll min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch]">
          {(loading || patientsLoading) ? (
            <div className="flex min-h-[300px] items-center justify-center gap-2 text-sm font-bold text-hpsr-muted">
              <Loader2 size={18} className="animate-spin" /> Carregando carteira...
            </div>
          ) : view === "mine" ? (
            myGroups.length ? (
              <div className="space-y-3">
                {myGroups.map((group) => {
                  const key = `mine:${group.specialty}`;
                  const collapsed = collapsedSpecialties.has(key);
                  return (
                    <section key={key} className="overflow-hidden rounded-[17px] border border-hpsr-border bg-white shadow-[0_4px_16px_rgba(74,38,24,0.035)]">
                      <button
                        type="button"
                        onClick={() => toggleSpecialty(key)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-[#fff9f5] sm:px-5"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-[#f8eee9] text-hpsr-wine">
                            <Stethoscope size={16} />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-hpsr-text">{group.specialty}</p>
                            <p className="mt-0.5 text-[11px] font-semibold text-hpsr-muted">{group.rows.length} paciente{group.rows.length === 1 ? "" : "s"} vinculado{group.rows.length === 1 ? "" : "s"}</p>
                          </div>
                        </div>
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] text-hpsr-muted">
                          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                        </span>
                      </button>
                      {!collapsed && (
                        <div className="space-y-2 border-t border-hpsr-border bg-[#fbf8f6] p-2.5 sm:p-3">
                          {group.rows.map((row) => (
                            <PatientLinkCard
                              key={row.id}
                              row={row}
                              patient={patientByPassport.get(row.patient_passport)}
                              doctor={doctorById.get(row.doctor_id)}
                              expanded={expanded.has(row.id)}
                              onToggle={() => toggleExpanded(row.id)}
                              onEdit={() => openEdit(row)}
                              onEnd={() => openEnd(row)}
                              showDoctor={false}
                            />
                          ))}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            ) : (
              <EmptyState title="Sua carteira está vazia" text={search ? "Nenhum paciente da sua carteira corresponde à busca." : "Quando um vínculo for criado para você, o paciente aparecerá aqui agrupado por especialidade."} />
            )
          ) : view === "history" ? (
            historyFiltered.length ? (
              <div className="space-y-2.5">
                {historyFiltered.map((row) => (
                  <HistoryLinkCard
                    key={row.id}
                    row={row}
                    patient={patientByPassport.get(row.patient_passport)}
                    doctor={doctorById.get(row.doctor_id)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState title="Histórico vazio" text={search ? "Nenhum vínculo encerrado corresponde à busca." : "Os vínculos encerrados ou substituídos aparecerão aqui."} />
            )
          ) : isAdmin ? (
            adminGroups.length ? (
              <div className="space-y-3">
                {adminGroups.map((doctorGroup) => {
                  const doctorKey = `admin-doctor:${doctorGroup.doctorId}`;
                  const doctorCollapsed = collapsedDoctors.has(doctorKey);
                  const total = doctorGroup.specialties.reduce((sum, group) => sum + group.rows.length, 0);
                  return (
                    <section key={doctorKey} className="overflow-hidden rounded-[17px] border border-hpsr-border bg-white shadow-[0_4px_16px_rgba(74,38,24,0.035)]">
                      <button
                        type="button"
                        onClick={() => toggleDoctor(doctorKey)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-[#fff9f5] sm:px-5"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-hpsr-wine text-white">
                            <CircleUserRound size={18} />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-hpsr-text">{doctorGroup.doctor?.name || "Médico não localizado"}</p>
                            <p className="mt-0.5 truncate text-[11px] font-semibold text-hpsr-muted">{doctorGroup.doctor?.role || "Profissional"} · {doctorGroup.specialties.length} especialidade{doctorGroup.specialties.length === 1 ? "" : "s"}</p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="rounded-full bg-[#f6ece7] px-2.5 py-1 text-[10px] font-black text-hpsr-muted">{total} vínculo{total === 1 ? "" : "s"}</span>
                          {doctorCollapsed ? <ChevronDown size={16} className="text-hpsr-muted" /> : <ChevronUp size={16} className="text-hpsr-muted" />}
                        </div>
                      </button>

                      {!doctorCollapsed && (
                        <div className="space-y-2.5 border-t border-hpsr-border bg-[#fffaf7] p-2.5 sm:p-3">
                          {doctorGroup.specialties.map((group) => {
                            const specialtyKey = `${doctorKey}:${group.specialty}`;
                            const specialtyCollapsed = collapsedSpecialties.has(specialtyKey);
                            return (
                              <section key={specialtyKey} className="overflow-hidden rounded-[15px] border border-hpsr-border bg-white">
                                <button
                                  type="button"
                                  onClick={() => toggleSpecialty(specialtyKey)}
                                  className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left transition hover:bg-[#fff8f4]"
                                >
                                  <div className="flex min-w-0 items-center gap-2.5">
                                    <Stethoscope size={14} className="shrink-0 text-hpsr-wine" />
                                    <span className="truncate text-xs font-black text-hpsr-text">{group.specialty}</span>
                                    <span className="rounded-full bg-[#f6ece7] px-2 py-0.5 text-[9px] font-black text-hpsr-muted">{group.rows.length}</span>
                                  </div>
                                  {specialtyCollapsed ? <ChevronDown size={14} className="text-hpsr-muted" /> : <ChevronUp size={14} className="text-hpsr-muted" />}
                                </button>
                                {!specialtyCollapsed && (
                                  <div className="space-y-2 border-t border-hpsr-border bg-[#fffaf7] p-2.5">
                                    {group.rows.map((row) => (
                                      <PatientLinkCard
                                        key={row.id}
                                        row={row}
                                        patient={patientByPassport.get(row.patient_passport)}
                                        doctor={doctorGroup.doctor}
                                        expanded={expanded.has(row.id)}
                                        onToggle={() => toggleExpanded(row.id)}
                                        onEdit={() => openEdit(row)}
                                        onEnd={() => openEnd(row)}
                                        showDoctor={false}
                                      />
                                    ))}
                                  </div>
                                )}
                              </section>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            ) : (
              <EmptyState title="Nenhum vínculo encontrado" text="Ajuste os filtros ou a busca para localizar outros vínculos." />
            )
          ) : null}
          </div>
        </div>
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
}: {
  row: LinkRow;
  patient?: SharedPatient;
  doctor?: Doctor;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onEnd: () => void;
  showDoctor?: boolean;
}) {
  const name = patient?.name || `Paciente ${row.patient_passport}`;
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "P";

  return (
    <article className="overflow-hidden rounded-[14px] border border-hpsr-border bg-white shadow-[0_3px_12px_rgba(74,38,24,0.025)] transition hover:-translate-y-px hover:border-hpsr-wineLight/60 hover:shadow-[0_7px_18px_rgba(74,38,24,0.055)]">
      <div className="flex flex-col gap-3 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f5ece7] text-xs font-black text-hpsr-wine">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-hpsr-text">{name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-hpsr-muted">
              <span className="inline-flex items-center gap-1"><IdCard size={11} /> {row.patient_passport}</span>
              {showDoctor && doctor && <span className="truncate">{doctor.name}</span>}
              {showDoctor && <span className="truncate text-hpsr-wine">{row.specialty}</span>}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggle}
          className="inline-flex min-h-[36px] shrink-0 items-center justify-center gap-1.5 rounded-[10px] border border-hpsr-border bg-[#fffaf7] px-3 text-xs font-black text-hpsr-wine transition hover:border-hpsr-wineLight hover:bg-white"
        >
          {expanded ? "Fechar" : "Detalhes"}
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-hpsr-border bg-[#fbf8f6] px-3.5 py-3 sm:px-4">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <Detail icon={<Stethoscope size={13} />} label="Especialidade" value={row.specialty} />
            <Detail icon={<CalendarClock size={13} />} label="Início do vínculo" value={formatStartedAt(row.started_at)} />
            <Detail icon={<Phone size={13} />} label="Telefone" value={patient?.cityPhone || "Não informado"} />
            <Detail icon={<MessageCircle size={13} />} label="Discord" value="Não disponível" />
          </div>
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[10px] border border-hpsr-border bg-white px-3 text-xs font-black text-hpsr-wine transition hover:bg-[#f8f5f2]"
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
      )}
    </article>
  );
}

function HistoryLinkCard({ row, patient, doctor }: { row: HistoryRow; patient?: SharedPatient; doctor?: Doctor }) {
  const name = patient?.name || `Paciente ${row.patient_passport}`;
  return (
    <article className="rounded-[15px] border border-hpsr-border bg-white px-4 py-3.5 shadow-[0_3px_12px_rgba(74,38,24,0.025)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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
        <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[520px]">
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
    <div className="rounded-[11px] border border-hpsr-border bg-white px-3 py-2.5">
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
    <div className="grid min-h-[260px] place-items-center rounded-[18px] border border-dashed border-hpsr-border bg-[#fffaf7] p-6 text-center">
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
    <div className="fixed inset-0 z-[999] flex items-end justify-center bg-[#2a0700]/35 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-t-[24px] border border-hpsr-border bg-white shadow-2xl sm:rounded-[22px]">
        <div className="flex items-start justify-between gap-4 border-b border-hpsr-border px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-rose-50 text-rose-700"><UserRoundX size={18}/></span>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-hpsr-muted">Encerramento de vínculo</p>
              <h2 className="mt-0.5 truncate text-lg font-black text-hpsr-text">{patient?.name || `Paciente ${state.row.patient_passport}`}</h2>
              <p className="mt-1 text-sm font-medium text-hpsr-muted">{doctor?.name || "Médico"} · {state.row.specialty}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border border-hpsr-border bg-white text-hpsr-muted"><X size={17}/></button>
        </div>
        <div className="space-y-4 p-5">
          {error && <div className="rounded-[13px] border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm font-bold text-rose-900">{error}</div>}
          <div>
            <label className={labelClass}>Motivo do encerramento</label>
            <StyledSelect value={state.reason} onChange={(event) => setState({ ...state, reason: event.target.value })}>
              <option value="">Selecione o motivo</option>
              {LINK_END_REASONS.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
            </StyledSelect>
          </div>
          <div className="rounded-[13px] border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs font-semibold leading-relaxed text-amber-900">Consultas futuras e acompanhamentos já existentes não serão apagados automaticamente. Eles permanecem na Agenda do Médico para revisão, até a integração da Mudança 5.</div>
        </div>
        <div className="flex justify-end gap-2 border-t border-hpsr-border bg-[#fbfaf9] px-5 py-3.5">
          <button type="button" disabled={busy} onClick={onClose} className="min-h-[42px] rounded-[13px] border border-hpsr-border bg-white px-4 text-sm font-black text-hpsr-text">Cancelar</button>
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
    <div className="fixed inset-0 z-[999] flex items-end justify-center bg-[#2a0700]/35 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-t-[24px] border border-hpsr-border bg-white shadow-2xl sm:rounded-[22px]">
        <div className="flex items-start justify-between gap-4 border-b border-hpsr-border px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[#f5ece7] text-hpsr-wine"><UsersRound size={18}/></span>
            <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[0.12em] text-hpsr-muted">Meus Pacientes</p><h2 className="mt-0.5 text-lg font-black text-hpsr-text">{mode === "create" ? "Criar vínculo" : "Corrigir vínculo"}</h2><p className="mt-1 text-sm font-medium leading-relaxed text-hpsr-muted">{mode === "create" ? "Registre paciente, médico e especialidade." : "Use esta edição apenas para corrigir um cadastro feito de forma incorreta."}</p></div>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border border-hpsr-border bg-white text-hpsr-muted transition hover:bg-[#fff8f4] hover:text-hpsr-text"><X size={17}/></button>
        </div>

        <div className="space-y-4 p-4 sm:p-6">
          {mode === "edit" && <div className="rounded-[13px] border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs font-semibold leading-relaxed text-amber-900">Correções cadastrais simples são salvas no vínculo atual. Se você trocar médico ou especialidade, o sistema encerrará o vínculo anterior, registrará o histórico e criará um novo automaticamente.</div>}
          {error && <div className="rounded-[13px] border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm font-bold text-rose-900">{error}</div>}

          <div>
            <label className={labelClass}>Paciente</label>
            <StyledSelect value={form.passport} onChange={(event) => setForm({ ...form, passport: event.target.value })} searchable>
              <option value="">Selecione um paciente</option>
              {patients.map((patient) => <option key={patient.passport} value={patient.passport}>{patient.name} · {patient.passport}</option>)}
            </StyledSelect>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Médico</label>
              {isAdmin ? (
                <StyledSelect value={form.doctorId} onChange={(event) => changeDoctor(event.target.value)} searchable>
                  <option value="">Selecione o médico</option>
                  {doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name}</option>)}
                </StyledSelect>
              ) : (
                <div className={`${fieldClass} flex items-center`}>{doctors.find((doctor) => doctor.id === currentDoctorId)?.name || "Médico atual"}</div>
              )}
            </div>
            <div>
              <label className={labelClass}>Especialidade</label>
              <StyledSelect value={form.specialty} onChange={(event) => setForm({ ...form, specialty: event.target.value })} searchable>
                <option value="">Selecione a especialidade</option>
                {specialties.map((specialty) => <option key={specialty} value={specialty}>{specialty}</option>)}
              </StyledSelect>
            </div>
          </div>

          {mode === "edit" && (
            <div>
              <label className={labelClass}>Motivo caso haja troca de médico/especialidade</label>
              <StyledSelect value={form.replacementReason || "Mudança de médico"} onChange={(event) => setForm({ ...form, replacementReason: event.target.value })}>
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

          <div className="rounded-[13px] border border-hpsr-border bg-white px-3.5 py-3 text-xs font-semibold leading-relaxed text-hpsr-muted">
            Este vínculo é a fonte oficial da relação médico-paciente. O Portal passa a exibir novos horários deste médico e especialidade enquanto o vínculo estiver ativo; consultas já marcadas continuam preservadas mesmo após o encerramento.
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-hpsr-border bg-[#fbfaf9] px-4 py-3.5 sm:px-6">
          <button type="button" disabled={busy} onClick={onClose} className="min-h-[42px] rounded-[13px] border border-hpsr-border bg-white px-4 text-sm font-black text-hpsr-text">Cancelar</button>
          <button type="button" disabled={busy} onClick={onSave} className="inline-flex min-h-[42px] min-w-[150px] items-center justify-center gap-2 rounded-[13px] bg-hpsr-wine px-4 text-sm font-black text-white disabled:opacity-50">{busy ? <Loader2 size={16} className="animate-spin"/> : mode === "create" ? <Plus size={16}/> : <Pencil size={16}/>} {mode === "create" ? "Criar vínculo" : "Salvar correção"}</button>
        </div>
      </div>
    </div>
  );
}
