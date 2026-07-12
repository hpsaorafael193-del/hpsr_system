"use client";

import { FormEvent, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  BriefcaseMedical,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Code2,
  Crown,
  FileText,
  Download,
  UserPlus,
  Trash2,
  CalendarClock,
  MessageCircle,
  KeyRound,
  Plus,
  Radio,
  Search,
  ShieldCheck,
  Stethoscope,
  UserCog,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { roles } from "@/data/mock";
import { useCurrentUserProfile } from "@/components/auth/CurrentUserProfileProvider";
import { mirrorRecord, removeRecord } from "@/lib/data-bridge";
import { createClient } from "@/lib/supabase";
import { registerSystemActivity } from "@/lib/administrative-storage";
import { hpsrAlert, hpsrConfirm } from "@/components/ui/HpsrDialogProvider";

type TeamCategory = "Sistema" | "Direção" | "Corpo Médico" | "Formação";
type ServiceStatus = "Em serviço" | "Fora de serviço" | "Em atendimento" | "Em procedimento";

type TeamMember = {
  id: string;
  name: string;
  passport: string;
  crm: string;
  hospitalRole: string;
  systemRole?: string;
  accessLevel: "Total" | "Direção" | "Clínico avançado" | "Clínico" | "Supervisionado" | "Restrito";
  category: TeamCategory;
  department: string;
  specialty: string;
  cityPhone: string;
  email: string;
  radio: string;
  joinedAt: string;
  serviceStatus: ServiceStatus;
  permissions: string[];
  warnings: number;
  suspensions: number;
  history: string[];
  clinicalActivity?: {
    exams: number;
    certificates: number;
    agreements: number;
    consultations: number;
    prescriptions: number;
    procedures: number;
    lastActivity?: string;
  };
};


type PendingAdministrativeAction = {
  member: TeamMember;
  action: "Editar cargo" | "Promover" | "Ajustar permissões" | "Registrar conduta" | "Aplicar advertência" | "Desligar";
  value: string;
};

const STAFF_APPLICATIONS_KEY = "hpsr-staff-applications";
const TEAM_MEMBERS_STORAGE_KEY = "hpsr-team-members";
const STAFF_REGISTRATION_REQUESTS_KEY = "hpsr-staff-registration-requests";

type StaffRegistrationRequest = {
  id: string;
  authUserId?: string;
  name: string;
  passport: string;
  email: string;
  cityPhone: string;
  discord: string;
  crm: string;
  specialty: string;
  requestedRole: string;
  createdAt: string;
  status: "Pendente" | "Aprovado" | "Recusado";
};

type PublicStaffApplication = {
  protocol: string;
  token?: string;
  name: string;
  passport?: string;
  desiredRole: string;
  interestArea?: string;
  availability: string;
  cityPhone?: string;
  discord?: string;
  experience?: string;
  motivation?: string;
  notes?: string;
  status: string;
  createdAt?: string;
  triageDecision?: "Aprovado" | "Recusado" | "Pendente";
  decisionAt?: string;
  interviewStatus?: "Não agendada" | "Agendada" | "Realizada" | "Sem resposta";
  interviewAt?: string;
  interviewResult?: "Contratado" | "Não contratado" | "Pendente";
  interviewNotes?: string;
  birthDay?: string;
  birthMonth?: string;
  objective?: string;
  externalAvailability?: string;
  priorExperience?: string;
  declarationAccepted?: boolean;
  quizAnswers?: Array<{
    question: string;
    answer: string;
    optionIndex: number;
    correct: boolean;
  }>;
};

function readStoredStaffApplications(): PublicStaffApplication[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STAFF_APPLICATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredStaffApplications(applications: PublicStaffApplication[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STAFF_APPLICATIONS_KEY, JSON.stringify(applications));
}


const initialTeamMembers: TeamMember[] = [];

const roleDescriptions = [
  { title: "Dev / Desenvolvedor", description: "Acesso total técnico. Ajuste de permissões é função exclusiva do Dev.", group: "Sistema" },
  { title: "Diretora", description: "Acesso administrativo hospitalar total. Promoções são decisão exclusiva da Diretora.", group: "Direção" },
  { title: "Vice Diretor", description: "Gestão operacional ampla, procedimentos, convênios, equipe e prontuários. Pode remover membros, mas não promover nem ajustar permissões.", group: "Direção" },
  { title: "Diretor Clínico", description: "Monitoramento do histórico assistencial da equipe para revisão de exames, documentos, convênios, consultas e procedimentos, com finalidade de orientação clínica.", group: "Direção" },
  { title: "Médico Cirurgião", description: "Atendimento e condutas cirúrgicas conforme liberação e protocolo do hospital.", group: "Corpo Médico" },
  { title: "Médico Especialista", description: "Atendimento por especialidade, prontuários e acompanhamentos vinculados à área.", group: "Corpo Médico" },
  { title: "Médico Clínico", description: "Atendimento clínico geral, consultas, retornos e registros médicos.", group: "Corpo Médico" },
  { title: "Residente", description: "Atuação supervisionada, com acesso reduzido e acompanhamento de médico responsável.", group: "Formação" },
  { title: "Estagiário de Enfermagem", description: "Apoio supervisionado, visualização mínima e sem permissões administrativas.", group: "Formação" },
];

const categoryOrder: TeamCategory[] = ["Sistema", "Direção", "Corpo Médico", "Formação"];
const serviceStatuses: ServiceStatus[] = ["Em serviço", "Fora de serviço", "Em atendimento", "Em procedimento"];

const administrativeRoles = ["Diretora", "Vice Diretor"];


function formatDate(value: string) {
  if (!value.includes("-")) return value;
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function daysSince(value: string) {
  const start = new Date(`${value}T00:00:00`);
  const today = new Date();
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.max(0, Math.floor((current.getTime() - start.getTime()) / 86400000));
}

function getContractInfo(member: TeamMember) {
  if (member.systemRole || ["Diretora", "Vice Diretor", "Diretor Clínico"].includes(member.hospitalRole)) {
    return null;
  }

  const workedDays = daysSince(member.joinedAt);

  if (member.hospitalRole === "Estagiário de Enfermagem") {
    const limit = 7;
    const remaining = limit - workedDays;

    if (remaining <= 0) {
      return {
        kind: "Contrato concluído",
        tone: "danger" as const,
        workedDays,
        limit,
        message: "Estagiário cumpriu os 7 dias. Diretoria deve decidir promoção ou desligamento mediante multa.",
        actions: ["Promover", "Desligar com multa"],
      };
    }

    return {
      kind: "Estágio em andamento",
      tone: remaining <= 2 ? "warning" as const : "neutral" as const,
      workedDays,
      limit,
      message: `Faltam ${remaining} dia${remaining === 1 ? "" : "s"} para encerrar o contrato de estágio.`,
      actions: ["Acompanhar"],
    };
  }

  if (["Residente", "Médico Clínico", "Médico Especialista", "Médico Cirurgião"].includes(member.hospitalRole)) {
    const limit = 15;
    const remaining = limit - workedDays;

    if (member.hospitalRole === "Residente" && remaining <= 1) {
      return {
        kind: remaining <= 0 ? "Teste pendente" : "Último dia de residência",
        tone: "warning" as const,
        workedDays,
        limit,
        message: "Residente deve realizar teste. Após aprovação, escolher: iniciar especialização ou permanecer como clínico.",
        actions: ["Aplicar teste", "Iniciar especialização", "Manter clínico"],
      };
    }

    if (remaining <= 0) {
      return {
        kind: "Avaliação concluída",
        tone: "warning" as const,
        workedDays,
        limit,
        message: "Ciclo de 15 dias completo. Diretoria deve avaliar promoção, manutenção do cargo ou nova função.",
        actions: ["Avaliar", "Promover", "Manter cargo"],
      };
    }

    return {
      kind: "Período de avaliação",
      tone: remaining <= 2 ? "warning" as const : "neutral" as const,
      workedDays,
      limit,
      message: `Faltam ${remaining} dia${remaining === 1 ? "" : "s"} para avaliação de 15 dias.`,
      actions: ["Acompanhar"],
    };
  }

  return null;
}

function categoryClasses(category: TeamCategory) {
  switch (category) {
    case "Sistema":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "Direção":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "Corpo Médico":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default:
      return "border-blue-200 bg-blue-50 text-blue-700";
  }
}

function serviceClasses(status: ServiceStatus) {
  switch (status) {
    case "Em serviço":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Em atendimento":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Em procedimento":
      return "border-purple-200 bg-purple-50 text-purple-700";
    default:
      return "border-zinc-200 bg-zinc-100 text-zinc-700";
  }
}

function contractToneClasses(tone: "danger" | "warning" | "neutral") {
  if (tone === "danger") return "border-rose-200 bg-rose-50 text-rose-800";
  if (tone === "warning") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-blue-200 bg-blue-50 text-blue-800";
}

function roleIcon(role: string) {
  if (role.includes("Dev")) return <Code2 size={17} />;
  if (role === "Diretora" || role === "Vice Diretor") return <Crown size={17} />;
  if (role === "Diretor Clínico") return <ShieldCheck size={17} />;
  if (role.includes("Médico")) return <Stethoscope size={17} />;
  return <UserRound size={17} />;
}

function readRegistrationRequests(): StaffRegistrationRequest[] {
  if (typeof window === "undefined") return [];
  try { const raw = window.localStorage.getItem(STAFF_REGISTRATION_REQUESTS_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
function saveRegistrationRequests(items: StaffRegistrationRequest[]) {
  window.localStorage.setItem(STAFF_REGISTRATION_REQUESTS_KEY, JSON.stringify(items));
}

function categoryFromRole(role: string): TeamCategory {
  return getCategory(role, role.includes("Dev") ? role : "");
}

function memberFromProfile(row: any, supplemental?: Partial<TeamMember>): TeamMember {
  const role = String(row.role || supplemental?.hospitalRole || "Estagiário de Enfermagem");
  const specialties = Array.isArray(row.specialties) ? row.specialties.filter(Boolean) : [];
  const specialty = String(row.specialty || specialties.join(", ") || supplemental?.specialty || "Não informado");
  const systemRole = role.includes("Dev") ? role : supplemental?.systemRole;
  return {
    id: String(row.id),
    name: String(row.name || supplemental?.name || row.email || "Não informado"),
    passport: String(row.passport || supplemental?.passport || ""),
    crm: String(row.crm || supplemental?.crm || "CRM-RP pendente"),
    hospitalRole: role,
    systemRole,
    accessLevel: getAccessLevel(role, systemRole),
    category: categoryFromRole(role),
    department: String(row.department || supplemental?.department || "Hospital São Rafael"),
    specialty,
    cityPhone: String(row.city_phone || supplemental?.cityPhone || ""),
    email: String(row.email || supplemental?.email || ""),
    radio: String(row.discord || supplemental?.radio || ""),
    joinedAt: String((row.created_at || supplemental?.joinedAt || new Date().toISOString()).slice(0, 10)),
    serviceStatus: (row.service_status || supplemental?.serviceStatus || "Fora de serviço") as ServiceStatus,
    permissions: Array.isArray(supplemental?.permissions) ? supplemental.permissions : getDefaultPermissions(role, systemRole),
    warnings: Number(supplemental?.warnings || 0),
    suspensions: Number(supplemental?.suspensions || 0),
    history: Array.isArray(supplemental?.history) ? supplemental.history : [],
    clinicalActivity: supplemental?.clinicalActivity,
  };
}

export default function TeamPage() {
  const { profile: currentUserProfile } = useCurrentUserProfile();
  const isDevUser = currentUserProfile.systemRole === "Dev / Desenvolvedor do Sistema";
  const isDirectorUser = isDevUser || currentUserProfile.role === "Diretora";
  const isViceDirectorOrAboveUser = isDevUser || administrativeRoles.includes(currentUserProfile.role);
  const isClinicalDirectorUser = currentUserProfile.role === "Diretor Clínico";
  const hasTeamAdminAccess = isDevUser || administrativeRoles.includes(currentUserProfile.role);
  const canAccessTeamPage = hasTeamAdminAccess || isClinicalDirectorUser;
  const [members, setMembers] = useState<TeamMember[]>(initialTeamMembers);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<PublicStaffApplication | null>(null);
  const [publicApplications, setPublicApplications] = useState<PublicStaffApplication[]>([]);
  const [registrationRequests, setRegistrationRequests] = useState<StaffRegistrationRequest[]>([]);
  const [isRegistrationRequestsOpen, setIsRegistrationRequestsOpen] = useState(false);
  const [registrationRequestsLoading, setRegistrationRequestsLoading] = useState(false);
  const [registrationRequestError, setRegistrationRequestError] = useState("");
  const [registrationDecisionId, setRegistrationDecisionId] = useState("");
  const [pendingAdministrativeAction, setPendingAdministrativeAction] = useState<PendingAdministrativeAction | null>(null);

  useEffect(() => {
    async function loadAdministrativeData() {
      const client = createClient();
      if (!client) {
        setPublicApplications([]);
        setRegistrationRequests([]);
        setMembers([]);
        return;
      }

      const [membersResult, profilesResult, applicationsResult] = await Promise.all([
        client.from("team_members").select("id, passport, name, hospital_role, status, payload, created_at").order("created_at", { ascending: false }),
        client.from("profiles").select("id,name,email,passport,crm,role,specialty,city_phone,discord,service_status,access_status,created_at").eq("access_status", "Aprovado").order("name"),
        client.from("staff_applications").select("id, passport, token, name, desired_role, status, payload, created_at").order("created_at", { ascending: false }),
      ]);

      if (!profilesResult.error) {
        const supplementalRows = new Map<string, Partial<TeamMember>>();
        for (const row of membersResult.data || []) {
          const payload = (row.payload || {}) as Partial<TeamMember>;
          const normalized = { ...payload, id: String(row.id), passport: String(row.passport || payload.passport || "") };
          supplementalRows.set(String(row.id), normalized);
          if (normalized.passport) supplementalRows.set(`passport:${normalized.passport}`, normalized);
        }
        const remoteMembers = (profilesResult.data || []).map((row: any) => {
          const supplemental = supplementalRows.get(String(row.id)) || supplementalRows.get(`passport:${String(row.passport || "")}`);
          return memberFromProfile(row, supplemental);
        });
        setMembers(remoteMembers);
      } else if (!membersResult.error) {
        const fallbackMembers = (membersResult.data || []).map((row) => {
          const payload = (row.payload || {}) as Partial<TeamMember>;
          return {
            ...payload,
            id: String(row.id),
            passport: String(row.passport || payload.passport || ""),
            name: String(row.name || payload.name || "Não informado"),
            hospitalRole: String(row.hospital_role || payload.hospitalRole || "Estagiário de Enfermagem"),
            crm: String(payload.crm || ""),
            accessLevel: payload.accessLevel || "Clínico",
            category: payload.category || "Formação",
            department: String(payload.department || "Hospital São Rafael"),
            specialty: String(payload.specialty || "Não informado"),
            cityPhone: String(payload.cityPhone || ""),
            email: String(payload.email || ""),
            radio: String(payload.radio || ""),
            joinedAt: String(payload.joinedAt || String(row.created_at || "").slice(0, 10)),
            serviceStatus: payload.serviceStatus || "Fora de serviço",
            permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
            warnings: Number(payload.warnings || 0),
            suspensions: Number(payload.suspensions || 0),
            history: Array.isArray(payload.history) ? payload.history : [],
          } as TeamMember;
        });
        setMembers(fallbackMembers);
      }

      if (!applicationsResult.error) {
        const remoteApplications = (applicationsResult.data || []).map((row) => {
          const payload = (row.payload || {}) as Partial<PublicStaffApplication>;
          return {
            ...payload,
            protocol: String(row.id),
            passport: String(row.passport || payload.passport || ""),
            token: row.token ? String(row.token) : payload.token,
            name: String(row.name || payload.name || "Não informado"),
            desiredRole: String(row.desired_role || payload.desiredRole || "Não informado"),
            availability: String(payload.availability || ""),
            status: String(row.status || payload.status || "Pendente"),
            createdAt: String(payload.createdAt || row.created_at || ""),
          } as PublicStaffApplication;
        });
        setPublicApplications(remoteApplications);
      }

      await loadRegistrationRequestsFromSupabase();
    }

    void loadAdministrativeData();
  }, []);

  useEffect(() => {
    const client = createClient();
    if (!client) return;
    let reloadTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleReload = () => {
      if (reloadTimer) clearTimeout(reloadTimer);
      reloadTimer = setTimeout(() => window.location.reload(), 350);
    };
    const channel = client
      .channel("hpsr-team-live-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, scheduleReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "team_members" }, scheduleReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_applications" }, scheduleReload)
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_registration_requests" }, scheduleReload)
      .subscribe();
    return () => {
      if (reloadTimer) clearTimeout(reloadTimer);
      void client.removeChannel(channel);
    };
  }, []);

  async function loadRegistrationRequestsFromSupabase() {
    const client = createClient();
    if (!client) return;

    setRegistrationRequestsLoading(true);
    setRegistrationRequestError("");

    const { data, error } = await client
      .from("staff_registration_requests")
      .select("id, auth_user_id, passport, name, requested_role, status, payload, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setRegistrationRequestError(`Não foi possível carregar os cadastros: ${error.message}`);
      setRegistrationRequestsLoading(false);
      return;
    }

    const remoteItems: StaffRegistrationRequest[] = (data || []).map((row) => {
      const payload = (row.payload || {}) as Record<string, unknown>;
      return {
        id: String(row.id),
        authUserId: row.auth_user_id ? String(row.auth_user_id) : undefined,
        name: String(payload.name || row.name || "Não informado"),
        passport: String(payload.passport || row.passport || ""),
        email: String(payload.email || ""),
        cityPhone: String(payload.cityPhone || payload.city_phone || ""),
        discord: String(payload.discord || ""),
        crm: String(payload.crm || ""),
        specialty: String(payload.specialty || "Clínico Geral"),
        requestedRole: String(payload.requestedRole || row.requested_role || "Estagiário de Enfermagem"),
        createdAt: String(payload.createdAt || row.created_at || new Date().toISOString()),
        status: (row.status === "Aprovado" || row.status === "Recusado" ? row.status : "Pendente") as StaffRegistrationRequest["status"],
      };
    });

    setRegistrationRequests(remoteItems);
    saveRegistrationRequests(remoteItems);
    setRegistrationRequestsLoading(false);
  }

  useEffect(() => {
    window.localStorage.setItem(TEAM_MEMBERS_STORAGE_KEY, JSON.stringify(members));
  }, [members]);

  const selectedMember = members.find((member) => member.id === selectedId) ?? null;

  const visibleMembers = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return members;

    return members.filter((member) =>
      [member.name, member.passport, member.hospitalRole, member.systemRole ?? "", member.department, member.specialty]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );
  }, [members, searchTerm]);

  const allApplications: PublicStaffApplication[] = publicApplications;
  const pendingApplications = allApplications.filter((item) =>
    !["Recusado", "Contratado", "Não contratado", "Sem resposta"].includes(item.status)
  );
  const contractAlerts = members
    .map((member) => ({ member, contract: getContractInfo(member) }))
    .filter((item): item is { member: TeamMember; contract: NonNullable<ReturnType<typeof getContractInfo>> } =>
      Boolean(item.contract && item.contract.tone !== "neutral")
    );
  const inServiceCount = members.filter((member) => member.serviceStatus !== "Fora de serviço").length;
  const directionCount = members.filter((member) => member.category === "Direção" || member.category === "Sistema").length;
  const doctorCount = members.filter((member) => member.category === "Corpo Médico").length;
  const traineeCount = members.filter((member) => member.category === "Formação").length;


  async function persistMember(member: TeamMember) {
    const client = createClient();
    if (!client) return { ok: false, error: "Supabase não configurado." };
    const { error: profileError } = await client.rpc("admin_update_profile", {
      target_profile_id: member.id,
      profile_patch: {
        role: member.hospitalRole,
        specialty: member.specialty,
        service_status: member.serviceStatus,
        department: member.department,
      },
    });
    if (profileError) return { ok: false, error: profileError.message };
    const sync = await mirrorRecord("team_members", {
      id: member.id,
      passport: member.passport,
      name: member.name,
      hospital_role: member.hospitalRole,
      status: "Ativo",
      payload: member,
      updated_at: new Date().toISOString(),
    });
    return { ok: sync.synced, error: sync.error };
  }

  async function removeApplicationFromSupabase(application: PublicStaffApplication) {
    const client = createClient();
    if (!client) return { ok: false, error: "Supabase não configurado." };
    const { error } = await client.rpc("admin_delete_staff_application", { application_id: application.protocol });
    return { ok: !error, error: error?.message };
  }

  async function handleContractAction(member: TeamMember, action: string) {
    if (!(await hpsrConfirm(`Confirmar a ação "${action}" para ${member.name}?`, "Ação contratual"))) return;
    const timestamp = new Date().toLocaleString("pt-BR");
    if (action.includes("Desligar")) {
      setMembers((current) => current.filter((item) => item.id !== member.id));
      void removeRecord("team_members", member.id);
      setSelectedId("");
      return;
    }
    setMembers((current) => current.map((item) => {
      if (item.id !== member.id) return item;
      let hospitalRole = item.hospitalRole;
      if (action.includes("Especialização")) hospitalRole = "Médico Especialista";
      else if (action.includes("Promover") || action.toLowerCase().includes("clínico")) {
        if (item.hospitalRole === "Estagiário de Enfermagem") hospitalRole = "Residente";
        else if (item.hospitalRole === "Residente") hospitalRole = "Médico Clínico";
        else hospitalRole = "Médico Especialista";
      }
      return {
        ...item,
        hospitalRole,
        accessLevel: getAccessLevel(hospitalRole, item.systemRole),
        category: getCategory(hospitalRole, item.systemRole),
        permissions: getDefaultPermissions(hospitalRole, item.systemRole),
        history: [`${action} registrado em ${timestamp}`, ...item.history],
      };
    }));
  }

  function handleAdministrativeAction(member: TeamMember, action: string) {
    if (!["Editar cargo", "Promover", "Ajustar permissões", "Registrar conduta", "Aplicar advertência", "Desligar"].includes(action)) return;
    const suggested = member.hospitalRole === "Estagiário de Enfermagem" ? "Residente" : member.hospitalRole === "Residente" ? "Médico Clínico" : "Médico Especialista";
    const initialValue = action === "Promover" ? suggested : action === "Editar cargo" ? member.hospitalRole : action === "Ajustar permissões" ? member.permissions.join("; ") : "";
    setPendingAdministrativeAction({ member, action: action as PendingAdministrativeAction["action"], value: initialValue });
  }

  async function submitAdministrativeAction() {
    if (!pendingAdministrativeAction) return;
    const { member, action, value } = pendingAdministrativeAction;
    const timestamp = new Date().toLocaleString("pt-BR");
    const trimmedValue = value.trim();

    if ((action === "Registrar conduta" || action === "Aplicar advertência" || action === "Desligar") && !trimmedValue) return;
    if ((action === "Editar cargo" || action === "Promover") && (!trimmedValue || trimmedValue === member.hospitalRole)) {
      setPendingAdministrativeAction(null);
      return;
    }

    if (action === "Registrar conduta" || action === "Aplicar advertência") {
      setMembers((current) => current.flatMap((item) => {
        if (item.id !== member.id) return [item];
        if (action === "Registrar conduta") return [{ ...item, history: [`Conduta registrada em ${timestamp}: ${trimmedValue}`, ...item.history] }];
        let warnings = item.warnings + 1;
        let suspensions = item.suspensions;
        const history = [`Advertência aplicada em ${timestamp}: ${trimmedValue}`, ...item.history];
        if (warnings >= 3) {
          warnings = 0;
          suspensions += 1;
          history.unshift(`Suspensão automática registrada em ${timestamp} após 3 advertências.`);
        }
        if (suspensions >= 3) {
          history.unshift(`Desligamento automático registrado em ${timestamp} após 3 suspensões.`);
          return [];
        }
        return [{ ...item, warnings, suspensions, history }];
      }));
      if (member.suspensions + (member.warnings + 1 >= 3 ? 1 : 0) >= 3) {
        void removeRecord("team_members", member.id);
        setSelectedId("");
      }
      setPendingAdministrativeAction(null);
      return;
    }

    if (action === "Editar cargo" || action === "Promover") {
      const updatedMember = { ...member, hospitalRole: trimmedValue, accessLevel: getAccessLevel(trimmedValue, member.systemRole), category: getCategory(trimmedValue, member.systemRole), permissions: getDefaultPermissions(trimmedValue, member.systemRole), history: [`Cargo alterado de ${member.hospitalRole} para ${trimmedValue} em ${timestamp}`, ...member.history] };
      const result = await persistMember(updatedMember);
      if (!result.ok) {
        void hpsrAlert(result.error || "Não foi possível atualizar o cargo no Supabase.", "Erro ao salvar cargo");
        return;
      }
      setMembers((current) => current.map((item) => item.id === member.id ? updatedMember : item));
      setPendingAdministrativeAction(null);
      return;
    }

    if (action === "Ajustar permissões") {
      const permissions = value.split(";").map((item) => item.trim()).filter(Boolean);
      setMembers((current) => current.map((item) => item.id === member.id ? { ...item, permissions, history: [`Permissões atualizadas em ${timestamp}`, ...item.history] } : item));
      setPendingAdministrativeAction(null);
      return;
    }

    if (action === "Desligar") {
      setMembers((current) => current.filter((item) => item.id !== member.id));
      void removeRecord("team_members", member.id);
      setSelectedId("");
      setPendingAdministrativeAction(null);
    }
  }

  async function handleRegistrationRequest(request: StaffRegistrationRequest, decision: "Aprovado" | "Recusado") {
    if (!(await hpsrConfirm(`${decision === "Aprovado" ? "Aprovar" : "Recusar"} o cadastro de ${request.name}?`, "Cadastro médico"))) return;

    setRegistrationDecisionId(request.id);
    setRegistrationRequestError("");

    const client = createClient();
    if (client && request.authUserId) {
      const { error } = await client.rpc("decide_staff_registration", {
        request_id: request.id,
        decision,
      });

      if (error) {
        setRegistrationRequestError(`Não foi possível ${decision === "Aprovado" ? "aprovar" : "recusar"} o cadastro: ${error.message}`);
        setRegistrationDecisionId("");
        return;
      }
    } else {
      const sync = await mirrorRecord("staff_registration_requests", {
        id: request.id,
        auth_user_id: request.authUserId || null,
        passport: request.passport,
        name: request.name,
        requested_role: request.requestedRole,
        status: decision,
        payload: { ...request, status: decision },
        created_at: request.createdAt,
        updated_at: new Date().toISOString(),
      });
      if (client && !sync.synced) {
        setRegistrationRequestError(sync.error || "Não foi possível atualizar a solicitação no banco.");
        setRegistrationDecisionId("");
        return;
      }
    }

    if (decision === "Aprovado" && !members.some((member) => member.passport === request.passport)) {
      const role = request.requestedRole || "Estagiário de Enfermagem";
      const newMember: TeamMember = {
        id: request.authUserId || `member-${Date.now()}`,
        name: request.name,
        passport: request.passport,
        crm: request.crm || "CRM-RP pendente",
        hospitalRole: role,
        accessLevel: getAccessLevel(role, ""),
        category: getCategory(role, ""),
        department: "Hospital São Rafael",
        specialty: request.specialty || "Clínico Geral",
        cityPhone: request.cityPhone,
        email: request.email,
        radio: "193",
        joinedAt: new Date().toISOString().slice(0, 10),
        serviceStatus: "Fora de serviço",
        permissions: getDefaultPermissions(role, ""),
        warnings: 0,
        suspensions: 0,
        history: [`Cadastro público aprovado em ${new Date().toLocaleString("pt-BR")}`],
      };
      setMembers((current) => [newMember, ...current]);
    }

    setRegistrationRequests((current) => {
      const next = current.map((item) => item.id === request.id ? { ...item, status: decision } : item);
      saveRegistrationRequests(next);
      return next;
    });

    registerSystemActivity({
      module: "Equipe",
      action: `Cadastro médico ${decision.toLowerCase()}`,
      description: `${request.name} teve a solicitação de cadastro marcada como ${decision}.`,
      actor: currentUserProfile.systemName,
      reference: request.passport,
    });

    setRegistrationDecisionId("");
    await loadRegistrationRequestsFromSupabase();
  }


  function handleAddMember(data: Omit<TeamMember, "id" | "permissions" | "warnings" | "suspensions" | "history" | "accessLevel" | "category">) {
    const accessLevel = getAccessLevel(data.hospitalRole, data.systemRole);
    const category = getCategory(data.hospitalRole, data.systemRole);
    const newMember: TeamMember = {
      ...data,
      id: `member-${Date.now()}`,
      crm: data.crm || "CRM-RP pendente",
      accessLevel,
      category,
      permissions: getDefaultPermissions(data.hospitalRole, data.systemRole),
      warnings: 0,
      suspensions: 0,
      history: ["Membro cadastrado pela gestão da equipe"],
    };

    setMembers((currentMembers) => [newMember, ...currentMembers]);
    registerSystemActivity({ module: "Equipe", action: "Membro cadastrado", description: `${newMember.name} foi incluído na equipe como ${newMember.hospitalRole}.`, actor: currentUserProfile.systemName, reference: newMember.passport });
    setSelectedId(newMember.id);
    setSearchTerm("");
    setIsAddOpen(false);
  }

  async function updateApplicationStatus(application: PublicStaffApplication, status: string) {
    const updatedApplication = { ...application, status };
    const sync = await mirrorRecord("staff_applications", {
      id: application.protocol,
      passport: application.passport || null,
      token: application.token || null,
      name: application.name,
      desired_role: application.desiredRole,
      status,
      payload: updatedApplication,
      updated_at: new Date().toISOString(),
    });
    if (!sync.synced) {
      void hpsrAlert(sync.error || "Não foi possível atualizar a candidatura.", "Erro no Supabase");
      return;
    }
    setPublicApplications((currentApplications) => {
      const exists = currentApplications.some((item) => item.protocol === application.protocol);

      const nextApplications = exists
        ? currentApplications.map((item) => (item.protocol === application.protocol ? updatedApplication : item))
        : [updatedApplication, ...currentApplications];

      saveStoredStaffApplications(nextApplications);
      return nextApplications;
    });
  }

  async function updateApplication(application: PublicStaffApplication) {
    const sync = await mirrorRecord("staff_applications", {
      id: application.protocol,
      passport: application.passport || null,
      token: application.token || null,
      name: application.name,
      desired_role: application.desiredRole,
      status: application.status,
      payload: application,
      updated_at: new Date().toISOString(),
    });
    if (!sync.synced) {
      void hpsrAlert(sync.error || "Não foi possível salvar a candidatura.", "Erro no Supabase");
      return;
    }
    setPublicApplications((currentApplications) => {
      const exists = currentApplications.some((item) => item.protocol === application.protocol);
      const nextApplications = exists
        ? currentApplications.map((item) => (item.protocol === application.protocol ? application : item))
        : [application, ...currentApplications];
      saveStoredStaffApplications(nextApplications);
      return nextApplications;
    });
    setSelectedApplication(application);
  }

  async function deleteRejectedApplication(application: PublicStaffApplication) {
    if (application.status !== "Recusado") return;
    if (!(await hpsrConfirm(`Excluir definitivamente o formulário de ${application.name}?`, "Excluir formulário"))) return;
    const result = await removeApplicationFromSupabase(application);
    if (!result.ok) {
      void hpsrAlert(result.error || "Não foi possível excluir o formulário no Supabase.", "Erro ao excluir");
      return;
    }
    setPublicApplications((currentApplications) => {
      const nextApplications = currentApplications.filter((item) => item.protocol !== application.protocol);
      saveStoredStaffApplications(nextApplications);
      return nextApplications;
    });
    setSelectedApplication(null);
  }

  function exportAdministrativeReport() {
    const reportDate = new Date();
    const dateLabel = reportDate.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const memberRows = members.map((member) => ({
      Nome: member.name,
      Passaporte: member.passport,
      CRM: member.crm,
      Cargo: member.hospitalRole,
      Especialidade: member.specialty,
      Departamento: member.department,
      "Data de entrada": member.joinedAt,
      Promoções: member.history.filter((entry) => /promov/i.test(entry)).join(" | "),
      Rebaixamentos: member.history.filter((entry) => /rebaix/i.test(entry)).join(" | "),
      "Demissões / desligamentos": member.history.filter((entry) => /demit|deslig/i.test(entry)).join(" | "),
      "Histórico completo": member.history.join(" | "),
    }));

    const applicationRows = allApplications.map((item) => ({
      Nome: item.name,
      Passaporte: item.passport || "",
      Discord: item.discord || "",
      "Cargo pretendido": item.desiredRole,
      "Área de interesse": item.interestArea || "",
      "Data da candidatura": item.createdAt || "",
      "Resultado da triagem": item.triageDecision || (item.status === "Recusado" ? "Recusado" : "Pendente"),
      "Data da decisão": item.decisionAt || "",
      "Situação da entrevista": item.interviewStatus || "Não agendada",
      "Data da entrevista": item.interviewAt || "",
      "Resultado final": item.interviewResult || item.status,
      Observações: item.interviewNotes || item.notes || "",
    }));

    const movementRows = members.flatMap((member) =>
      member.history.map((entry) => ({
        Profissional: member.name,
        Cargo: member.hospitalRole,
        Movimento: /promov/i.test(entry)
          ? "Promoção"
          : /rebaix/i.test(entry)
            ? "Rebaixamento"
            : /demit|deslig/i.test(entry)
              ? "Demissão / desligamento"
              : "Registro administrativo",
        Descrição: entry,
      })),
    );

    const escapeXml = (value: unknown) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&apos;");

    const cell = (value: unknown, style = "Body") =>
      `<Cell ss:StyleID="${style}"><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`;

    const numberCell = (value: number, style = "KpiValue") =>
      `<Cell ss:StyleID="${style}"><Data ss:Type="Number">${value}</Data></Cell>`;

    const statusStyle = (value: unknown) => {
      const normalized = String(value ?? "").toLocaleLowerCase("pt-BR");
      if (/contratado|aprovado|realizada|em serviço/.test(normalized) && !/não contratado/.test(normalized)) return "StatusSuccess";
      if (/recusado|não contratado|demit|deslig/.test(normalized)) return "StatusDanger";
      if (/pendente|não agendada|sem resposta|agendada/.test(normalized)) return "StatusWarning";
      return "Body";
    };

    const columnWidth = (header: string) => {
      if (/nome|cargo|especialidade|departamento|área/i.test(header)) return 150;
      if (/histórico|observa|promo|rebaix|demiss|descrição/i.test(header)) return 240;
      if (/data/i.test(header)) return 118;
      if (/situação|resultado|status/i.test(header)) return 135;
      if (/discord|passaporte|crm/i.test(header)) return 105;
      return 125;
    };

    const createDataWorksheet = (name: string, title: string, subtitle: string, rows: Array<Record<string, unknown>>) => {
      const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
      const safeHeaders = headers.length ? headers : ["Informação"];
      const columns = safeHeaders.map((header) => `<Column ss:AutoFitWidth="0" ss:Width="${columnWidth(header)}"/>`).join("");
      const titleRow = `<Row ss:Height="30"><Cell ss:StyleID="SheetTitle" ss:MergeAcross="${Math.max(0, safeHeaders.length - 1)}"><Data ss:Type="String">${escapeXml(title)}</Data></Cell></Row>`;
      const subtitleRow = `<Row ss:Height="24"><Cell ss:StyleID="SheetSubtitle" ss:MergeAcross="${Math.max(0, safeHeaders.length - 1)}"><Data ss:Type="String">${escapeXml(subtitle)}</Data></Cell></Row>`;
      const spacer = `<Row ss:Height="8"/>`;
      const headerRow = `<Row ss:Height="28">${safeHeaders.map((header) => cell(header, "Header")).join("")}</Row>`;
      const dataRows = rows.length
        ? rows.map((row, index) => {
            const baseStyle = index % 2 === 0 ? "Body" : "BodyAlt";
            return `<Row ss:AutoFitHeight="1">${safeHeaders.map((header) => {
              const value = row[header];
              const style = /situação|resultado|status/i.test(header) ? statusStyle(value) : baseStyle;
              return cell(value, style);
            }).join("")}</Row>`;
          }).join("")
        : `<Row><Cell ss:StyleID="Empty" ss:MergeAcross="${Math.max(0, safeHeaders.length - 1)}"><Data ss:Type="String">Nenhum registro disponível.</Data></Cell></Row>`;

      const lastColumn = String.fromCharCode(64 + Math.min(safeHeaders.length, 26));
      const filterRange = `R4C1:R${Math.max(4, rows.length + 4)}C${safeHeaders.length}`;

      return `<Worksheet ss:Name="${escapeXml(name)}"><Table>${columns}${titleRow}${subtitleRow}${spacer}${headerRow}${dataRows}</Table><AutoFilter x:Range="${filterRange}" xmlns="urn:schemas-microsoft-com:office:excel"/><WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><Selected/><FreezePanes/><FrozenNoSplit/><SplitHorizontal>4</SplitHorizontal><TopRowBottomPane>4</TopRowBottomPane><ProtectObjects>False</ProtectObjects><ProtectScenarios>False</ProtectScenarios><PageSetup><Layout x:Orientation="Landscape"/><Header x:Margin="0.3"/><Footer x:Margin="0.3"/><PageMargins x:Bottom="0.5" x:Left="0.3" x:Right="0.3" x:Top="0.5"/></PageSetup><Print><ValidPrinterInfo/><HorizontalResolution>600</HorizontalResolution><VerticalResolution>600</VerticalResolution></Print></WorksheetOptions></Worksheet>`;
    };

    const pending = allApplications.filter((item) => !item.triageDecision || item.triageDecision === "Pendente").length;
    const approved = allApplications.filter((item) => item.triageDecision === "Aprovado").length;
    const rejected = allApplications.filter((item) => item.triageDecision === "Recusado" || item.status === "Recusado").length;
    const interviews = allApplications.filter((item) => ["Agendada", "Realizada"].includes(item.interviewStatus || "")).length;
    const hired = allApplications.filter((item) => item.interviewResult === "Contratado" || item.status === "Contratado").length;
    const notHired = allApplications.filter((item) => item.interviewResult === "Não contratado" || item.status === "Não contratado").length;
    const noResponse = allApplications.filter((item) => item.interviewStatus === "Sem resposta" || item.status === "Sem resposta").length;

    const statusMetrics = [
      ["Pendentes", pending, "KpiWarning"],
      ["Aprovados na triagem", approved, "KpiSuccess"],
      ["Recusados", rejected, "KpiDanger"],
      ["Entrevistas", interviews, "KpiNeutral"],
      ["Contratados", hired, "KpiSuccess"],
      ["Não contratados", notHired, "KpiDanger"],
      ["Sem resposta", noResponse, "KpiWarning"],
    ] as const;

    const roleCounts = Array.from(
      members.reduce((map, member) => map.set(member.hospitalRole, (map.get(member.hospitalRole) || 0) + 1), new Map<string, number>()),
    ).sort((a, b) => b[1] - a[1]);
    const maxRole = Math.max(1, ...roleCounts.map(([, value]) => value));
    const maxStatus = Math.max(1, ...statusMetrics.map(([, value]) => value));
    const bar = (value: number, max: number) => "■".repeat(Math.max(value ? 1 : 0, Math.round((value / max) * 18)));

    const summaryWorksheet = `<Worksheet ss:Name="Visão geral"><Table>
      <Column ss:Width="175"/><Column ss:Width="90"/><Column ss:Width="210"/><Column ss:Width="24"/><Column ss:Width="175"/><Column ss:Width="90"/><Column ss:Width="210"/>
      <Row ss:Height="34"><Cell ss:StyleID="ReportTitle" ss:MergeAcross="6"><Data ss:Type="String">HOSPITAL SÃO RAFAEL — RELATÓRIO DE GESTÃO ADMINISTRATIVA</Data></Cell></Row>
      <Row ss:Height="26"><Cell ss:StyleID="ReportSubtitle" ss:MergeAcross="6"><Data ss:Type="String">Gerado em ${escapeXml(dateLabel)} · Documento interno e confidencial</Data></Cell></Row>
      <Row ss:Height="10"/>
      <Row ss:Height="24"><Cell ss:StyleID="SectionTitle" ss:MergeAcross="6"><Data ss:Type="String">Indicadores gerais</Data></Cell></Row>
      <Row ss:Height="20"><Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Equipe cadastrada</Data></Cell><Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Candidaturas</Data></Cell><Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Contratações</Data></Cell><Cell/><Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Entrevistas</Data></Cell><Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Recusados</Data></Cell><Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Sem resposta</Data></Cell></Row>
      <Row ss:Height="32">${numberCell(members.length)}${numberCell(allApplications.length)}${numberCell(hired, "KpiValueSuccess")}<Cell/>${numberCell(interviews)}${numberCell(rejected, "KpiValueDanger")}${numberCell(noResponse, "KpiValueWarning")}</Row>
      <Row ss:Height="12"/>
      <Row ss:Height="24"><Cell ss:StyleID="SectionTitle" ss:MergeAcross="2"><Data ss:Type="String">Fluxo das candidaturas</Data></Cell><Cell/><Cell ss:StyleID="SectionTitle" ss:MergeAcross="2"><Data ss:Type="String">Distribuição da equipe por cargo</Data></Cell></Row>
      ${Array.from({ length: Math.max(statusMetrics.length, roleCounts.length, 1) }, (_, index) => {
        const status = statusMetrics[index];
        const role = roleCounts[index];
        return `<Row ss:Height="23">${status ? `${cell(status[0], "ChartLabel")}${numberCell(status[1], "ChartValue")}${cell(bar(status[1], maxStatus), status[2])}` : `<Cell/><Cell/><Cell/>`}<Cell/>${role ? `${cell(role[0], "ChartLabel")}${numberCell(role[1], "ChartValue")}${cell(bar(role[1], maxRole), "KpiNeutral")}` : `<Cell/><Cell/><Cell/>`}</Row>`;
      }).join("")}
      <Row ss:Height="12"/>
      <Row ss:Height="24"><Cell ss:StyleID="SectionTitle" ss:MergeAcross="6"><Data ss:Type="String">Leitura administrativa</Data></Cell></Row>
      <Row ss:Height="46"><Cell ss:StyleID="Note" ss:MergeAcross="6"><Data ss:Type="String">Use as abas Equipe, Candidaturas e Movimentações para consultar os registros completos. Os cabeçalhos possuem filtros e a primeira linha de dados permanece fixa durante a navegação.</Data></Cell></Row>
    </Table><WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><Selected/><FreezePanes/><FrozenNoSplit/><SplitHorizontal>2</SplitHorizontal><TopRowBottomPane>2</TopRowBottomPane><ProtectObjects>False</ProtectObjects><ProtectScenarios>False</ProtectScenarios></WorksheetOptions></Worksheet>`;

    const workbookXml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:html="http://www.w3.org/TR/REC-html40"><DocumentProperties xmlns="urn:schemas-microsoft-com:office:office"><Title>Relatório de Gestão Administrativa</Title><Subject>Equipe e candidaturas do Hospital São Rafael</Subject><Author>Hospital São Rafael</Author><Created>${reportDate.toISOString()}</Created></DocumentProperties><ExcelWorkbook xmlns="urn:schemas-microsoft-com:office:excel"><WindowHeight>12000</WindowHeight><WindowWidth>22000</WindowWidth><ProtectStructure>False</ProtectStructure><ProtectWindows>False</ProtectWindows></ExcelWorkbook><Styles>
      <Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Center"/><Borders/><Font ss:FontName="Arial" ss:Size="10" ss:Color="#2A211D"/><Interior/><NumberFormat/><Protection/></Style>
      <Style ss:ID="ReportTitle"><Alignment ss:Horizontal="Left" ss:Vertical="Center"/><Font ss:FontName="Arial" ss:Size="16" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#672614" ss:Pattern="Solid"/></Style>
      <Style ss:ID="ReportSubtitle"><Alignment ss:Horizontal="Left" ss:Vertical="Center"/><Font ss:FontName="Arial" ss:Size="10" ss:Color="#6B554A"/><Interior ss:Color="#F5E7D8" ss:Pattern="Solid"/></Style>
      <Style ss:ID="SheetTitle"><Alignment ss:Horizontal="Left" ss:Vertical="Center"/><Font ss:FontName="Arial" ss:Size="14" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#672614" ss:Pattern="Solid"/></Style>
      <Style ss:ID="SheetSubtitle"><Alignment ss:Horizontal="Left" ss:Vertical="Center" ss:WrapText="1"/><Font ss:FontName="Arial" ss:Size="9" ss:Color="#6B554A"/><Interior ss:Color="#F5E7D8" ss:Pattern="Solid"/></Style>
      <Style ss:ID="SectionTitle"><Alignment ss:Horizontal="Left" ss:Vertical="Center"/><Font ss:FontName="Arial" ss:Size="11" ss:Bold="1" ss:Color="#672614"/><Interior ss:Color="#F5E7D8" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9C4B5"/></Borders></Style>
      <Style ss:ID="Header"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Font ss:FontName="Arial" ss:Size="9" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#7A321D" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#542014"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#8D4B38"/></Borders></Style>
      <Style ss:ID="Body"><Alignment ss:Vertical="Top" ss:WrapText="1"/><Font ss:FontName="Arial" ss:Size="9"/><Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E8DDD5"/></Borders></Style>
      <Style ss:ID="BodyAlt"><Alignment ss:Vertical="Top" ss:WrapText="1"/><Font ss:FontName="Arial" ss:Size="9"/><Interior ss:Color="#FFF8F0" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E8DDD5"/></Borders></Style>
      <Style ss:ID="Empty"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:Italic="1" ss:Color="#806B61"/><Interior ss:Color="#FFF8F0" ss:Pattern="Solid"/></Style>
      <Style ss:ID="StatusSuccess"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Font ss:Bold="1" ss:Color="#17633A"/><Interior ss:Color="#DDF4E6" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B9DFC8"/></Borders></Style>
      <Style ss:ID="StatusDanger"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Font ss:Bold="1" ss:Color="#A12626"/><Interior ss:Color="#FBE1E1" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E7BEBE"/></Borders></Style>
      <Style ss:ID="StatusWarning"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Font ss:Bold="1" ss:Color="#8A5A00"/><Interior ss:Color="#FFF0C9" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E9D39C"/></Borders></Style>
      <Style ss:ID="KpiLabel"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Font ss:Size="9" ss:Bold="1" ss:Color="#6B554A"/><Interior ss:Color="#FFF8F0" ss:Pattern="Solid"/><Borders><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9C4B5"/><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9C4B5"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9C4B5"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9C4B5"/></Borders></Style>
      <Style ss:ID="KpiValue"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:Size="16" ss:Bold="1" ss:Color="#672614"/><Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9C4B5"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9C4B5"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9C4B5"/></Borders></Style>
      <Style ss:ID="KpiValueSuccess"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:Size="16" ss:Bold="1" ss:Color="#17633A"/><Interior ss:Color="#DDF4E6" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B9DFC8"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B9DFC8"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B9DFC8"/></Borders></Style>
      <Style ss:ID="KpiValueDanger"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:Size="16" ss:Bold="1" ss:Color="#A12626"/><Interior ss:Color="#FBE1E1" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E7BEBE"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E7BEBE"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E7BEBE"/></Borders></Style>
      <Style ss:ID="KpiValueWarning"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:Size="16" ss:Bold="1" ss:Color="#8A5A00"/><Interior ss:Color="#FFF0C9" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E9D39C"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E9D39C"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E9D39C"/></Borders></Style>
      <Style ss:ID="ChartLabel"><Alignment ss:Vertical="Center"/><Font ss:Size="9" ss:Bold="1" ss:Color="#4E3A31"/></Style>
      <Style ss:ID="ChartValue"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:Size="10" ss:Bold="1" ss:Color="#672614"/></Style>
      <Style ss:ID="KpiSuccess"><Alignment ss:Vertical="Center"/><Font ss:Size="10" ss:Bold="1" ss:Color="#268255"/></Style>
      <Style ss:ID="KpiDanger"><Alignment ss:Vertical="Center"/><Font ss:Size="10" ss:Bold="1" ss:Color="#C44848"/></Style>
      <Style ss:ID="KpiWarning"><Alignment ss:Vertical="Center"/><Font ss:Size="10" ss:Bold="1" ss:Color="#C18B22"/></Style>
      <Style ss:ID="KpiNeutral"><Alignment ss:Vertical="Center"/><Font ss:Size="10" ss:Bold="1" ss:Color="#7A321D"/></Style>
      <Style ss:ID="Note"><Alignment ss:Vertical="Center" ss:WrapText="1"/><Font ss:Size="9" ss:Color="#6B554A"/><Interior ss:Color="#FFF8F0" ss:Pattern="Solid"/><Borders><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9C4B5"/><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9C4B5"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9C4B5"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9C4B5"/></Borders></Style>
    </Styles>${summaryWorksheet}${createDataWorksheet("Equipe", "Equipe cadastrada", `Profissionais ativos e histórico funcional · Atualizado em ${dateLabel}`, memberRows)}${createDataWorksheet("Candidaturas", "Candidaturas e entrevistas", `Triagem, contato, entrevista e resultado final · Atualizado em ${dateLabel}`, applicationRows)}${createDataWorksheet("Movimentações", "Movimentações administrativas", `Promoções, rebaixamentos, desligamentos e registros internos · Atualizado em ${dateLabel}`, movementRows)}</Workbook>`;

    const blob = new Blob([workbookXml], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `relatorio-gestao-equipe-${reportDate.toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }




  if (!canAccessTeamPage) {
    return (
      <div className="hpsr-page gap-3">
        <PageHeader
          eyebrow="Administração"
          title="Equipe"
          description="Acesso administrativo restrito."
        />

        <section className="rounded-[16px] border border-amber-200 bg-amber-50 p-3.5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-1 shrink-0 text-amber-800" size={26} />
            <div>
              <p className="text-lg font-black text-amber-900">Aba restrita à administração.</p>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-relaxed text-amber-800">
                A página Equipe só fica disponível para Dev, Diretora, Vice Diretor e Diretor Clínico. Cargo atual: {currentUserProfile.role}.
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="hpsr-page gap-3">
      <PageHeader
        eyebrow="Administração"
        title="Equipe"
        description="Gestão da equipe, cargos, permissões e candidaturas do Hospital São Rafael."
      />

      <div className="min-h-0 flex flex-1 flex-col gap-3 overflow-hidden md:gap-4">
      <section className="shrink-0 overflow-hidden rounded-[16px] border border-hpsr-border bg-white md:rounded-[16px]">
        <div className="border-b border-hpsr-border bg-[linear-gradient(135deg,#fffaf4_0%,#f5e7d8_100%)] p-3 md:p-3.5">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(480px,0.82fr)] xl:items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-hpsr-wineLight">
                Administração da equipe
              </p>
              <h1 className="mt-1.5 text-[clamp(1.18rem,1.8vw,1.55rem)] font-black text-hpsr-text">
                Gestão administrativa da equipe
              </h1>
              <p className="mt-1 max-w-3xl text-xs leading-relaxed text-hpsr-muted sm:text-sm">
                A Diretoria administra vínculos e permissões. O Diretor Clínico acompanha exclusivamente o histórico assistencial para orientação técnica.
              </p>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              {hasTeamAdminAccess && (<>
              <button type="button" onClick={() => setIsRegistrationRequestsOpen(true)} className="relative inline-flex min-h-[38px] w-full items-center justify-center gap-2 rounded-[16px] border border-hpsr-border bg-white px-3.5 text-xs font-black text-hpsr-wine transition hover:bg-[#fff8f0] md:min-h-[46px] md:w-auto md:px-4 md:text-sm">
                <UserPlus size={16}/> Cadastros médicos
                {registrationRequests.filter((item) => item.status === "Pendente").length > 0 && <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-hpsr-wine px-2 py-0.5 text-[11px] font-black text-white">{registrationRequests.filter((item) => item.status === "Pendente").length}</span>}
              </button>

              <button
                type="button"
                onClick={() => setIsPendingModalOpen(true)}
                className={`relative inline-flex min-h-[38px] w-full items-center justify-center gap-2 rounded-[16px] border px-3.5 text-xs font-black transition md:min-h-[46px] md:w-auto md:rounded-[16px] md:px-4 md:text-sm ${
                  pendingApplications.length > 0
                    ? "border-amber-300 bg-amber-50 text-amber-900"
                    : "border-hpsr-border bg-white text-hpsr-text hover:bg-[#fff8f0]"
                }`}
              >
                <FileText size={16} />
                Formulários pendentes
                {pendingApplications.length > 0 && (
                  <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-amber-600 px-2 py-0.5 text-[11px] font-black text-white">
                    {pendingApplications.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={exportAdministrativeReport}
                className="inline-flex min-h-[38px] w-full items-center justify-center gap-2 rounded-[16px] border border-hpsr-border bg-white px-3.5 text-xs font-black text-hpsr-wine transition hover:bg-[#fff8f0] md:min-h-[46px] md:w-auto md:px-4 md:text-sm"
              >
                <Download size={16} />
                Exportar Relatório
              </button>

              <button
                type="button"
                onClick={() => setIsAddOpen(true)}
                className="inline-flex min-h-[38px] w-full items-center justify-center gap-2 rounded-[16px] bg-[linear-gradient(135deg,#672614,#74321e)] px-4 text-xs font-black text-white transition md:min-h-[46px] md:w-auto md:rounded-[16px] md:px-5 md:text-sm"
              >
                <Plus size={16} />
                Registrar médico
              </button>
              </>)}
            </div>
          </div>

          <div className="mt-3 grid gap-2 grid-cols-2 md:grid-cols-5">
            <PracticalMetric label="Pendências" value={String(pendingApplications.length)} />
            <PracticalMetric label="Contratos" value={String(contractAlerts.length)} />
            <PracticalMetric label="Membros" value={String(members.length)} />
            <PracticalMetric label="Em operação" value={String(inServiceCount)} />
            <PracticalMetric label="Formação" value={String(traineeCount)} />
          </div>
        </div>
      </section>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[16px] border border-hpsr-border bg-white md:rounded-[16px]">
        <div className="shrink-0 border-b border-hpsr-border bg-[#fcf6ee] px-4 py-3 md:px-5 md:py-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(320px,.65fr)_auto] lg:items-center">
            <div><h2 className="text-base font-black text-hpsr-text md:text-lg">Equipe cadastrada</h2><p className="mt-1 text-xs text-hpsr-muted md:text-sm">Clique em um resumo para expandir detalhes, contrato, permissões e ações administrativas.</p></div>
            <label className="flex min-h-[42px] items-center gap-3 rounded-[16px] border border-hpsr-border bg-white px-3.5 focus-within:border-hpsr-wineLight focus-within:ring-2 focus-within:ring-hpsr-wineLight/20"><Search size={17} className="text-hpsr-muted"/><input className="w-full bg-transparent text-sm font-semibold text-hpsr-text outline-none placeholder:text-zinc-400" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar na equipe cadastrada"/></label>
            <span className="rounded-full border border-hpsr-border bg-white px-3 py-1 text-xs font-black text-hpsr-wine">{visibleMembers.length} membro{visibleMembers.length === 1 ? "" : "s"}</span>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden p-3 md:p-4">
          <div className="grid h-full content-start gap-3 overflow-y-auto pr-1">
            {categoryOrder.map((category) => {
              const categoryMembers = visibleMembers.filter((member) => member.category === category);
              if (categoryMembers.length === 0) return null;

              return (
                <div key={category} className="grid gap-3">
                  <div className="sticky top-0 z-[1] flex items-center justify-between gap-3 rounded-[16px] border border-hpsr-border bg-[#fff8f0]/95 px-3 py-2.5 backdrop-blur md:rounded-[16px] md:px-4 md:py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">{category}</p>
                    <span className="rounded-full border border-hpsr-border bg-white px-2.5 py-1 text-[10px] font-black text-hpsr-wine">
                      {categoryMembers.length} item{categoryMembers.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  {categoryMembers.map((member) => {
                    const selected = selectedId === member.id;
                    const contract = getContractInfo(member);

                    return (
                      <article
                        key={member.id}
                        className={`overflow-hidden rounded-[16px] border transition ${
                          selected
                            ? "border-hpsr-wine bg-white shadow-[0_12px_34px_rgba(42,7,0,0.08)]"
                            : "border-hpsr-border bg-[#fffaf4]"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedId(selected ? "" : member.id)}
                          className="flex w-full flex-col gap-3 px-3 py-3 text-left md:px-4 md:py-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                                <p className="max-w-full truncate text-sm font-black text-hpsr-text md:text-base">{member.name}</p>
                                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${categoryClasses(member.category)}`}>
                                  {member.systemRole ? "Dev" : member.hospitalRole}
                                </span>
                                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${serviceClasses(member.serviceStatus)}`}>
                                  {member.serviceStatus}
                                </span>
                                {contract && (
                                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${contractToneClasses(contract.tone)}`}>
                                    {contract.kind}
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-sm font-semibold text-hpsr-muted">{member.name} | {member.crm}</p>
                              <p className="mt-1 text-xs font-semibold text-hpsr-muted">{member.department} · {member.specialty} · Passaporte {member.passport}</p>
                            </div>
                            <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
                              <span className="rounded-[14px] border border-hpsr-border bg-white px-3 py-2 text-[11px] font-black text-hpsr-wine">
                                {member.accessLevel}
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-[14px] bg-[#fff2e4] px-2.5 py-2 text-[11px] font-black text-hpsr-wine">
                                {selected ? "Recolher" : "Abrir"}
                                <ChevronDown size={15} className={`shrink-0 transition ${selected ? "rotate-180" : ""}`} />
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 border-t border-hpsr-border pt-3 sm:grid-cols-4">
                            <MiniStat label="Status" value={member.serviceStatus} />
                            <MiniStat label="Advertências" value={String(member.warnings)} />
                            <MiniStat label="Suspensões" value={String(member.suspensions)} />
                            <MiniStat label="Entrada" value={formatDate(member.joinedAt)} />
                          </div>

                          {contract && (
                            <div className={`rounded-[16px] border px-3 py-2 ${contractToneClasses(contract.tone)}`}>
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-[11px] font-black uppercase tracking-[0.14em]">{contract.kind}</p>
                                <span className="text-[11px] font-black">{contract.workedDays}/{contract.limit} dias</span>
                              </div>
                              <p className="mt-1 text-xs font-semibold leading-relaxed">{contract.message}</p>
                            </div>
                          )}
                        </button>

                        {selected && (
                          <div className="border-t border-hpsr-border bg-white p-3.5">
                            <TeamMemberExpandedContent member={member} onContractAction={handleContractAction} onAdministrativeAction={handleAdministrativeAction} />
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              );
            })}
            {visibleMembers.length === 0 && (
              <div className="rounded-[16px] border border-dashed border-hpsr-border bg-[#fff8f0] p-3.5 text-center">
                <p className="font-black text-hpsr-text">Nenhum médico encontrado.</p>
                <p className="mt-1 text-sm text-hpsr-muted">Ajuste a busca ou registre um novo médico.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      </div>

      {hasTeamAdminAccess && isRegistrationRequestsOpen && <RegistrationRequestsModal items={registrationRequests} loading={registrationRequestsLoading} error={registrationRequestError} decisionId={registrationDecisionId} onRefresh={loadRegistrationRequestsFromSupabase} onClose={() => setIsRegistrationRequestsOpen(false)} onDecision={handleRegistrationRequest} />}
      {hasTeamAdminAccess && isPendingModalOpen && (
        <PendingApplicationsModal
          items={allApplications}
          onClose={() => setIsPendingModalOpen(false)}
          onOpenAnalysis={setSelectedApplication}
          onDelete={deleteRejectedApplication}
        />
      )}
      {selectedApplication && (
        <ApplicationAnalysisModal
          item={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onSave={updateApplication}
          onDelete={deleteRejectedApplication}
        />
      )}
      {hasTeamAdminAccess && isAddOpen && <AddMemberModal onClose={() => setIsAddOpen(false)} onSave={handleAddMember} />}
      {pendingAdministrativeAction && (
        <AdministrativeActionModal
          state={pendingAdministrativeAction}
          onChange={(value) => setPendingAdministrativeAction((current) => current ? { ...current, value } : current)}
          onCancel={() => setPendingAdministrativeAction(null)}
          onConfirm={submitAdministrativeAction}
        />
      )}
    </div>
  );
}

function RegistrationRequestsModal({
  items,
  loading,
  error,
  decisionId,
  onRefresh,
  onClose,
  onDecision,
}: {
  items: StaffRegistrationRequest[];
  loading: boolean;
  error: string;
  decisionId: string;
  onRefresh: () => void | Promise<void>;
  onClose: () => void;
  onDecision: (item: StaffRegistrationRequest, decision: "Aprovado" | "Recusado") => void | Promise<void>;
}) {
  return (
    <div className="fixed inset-0 z-[99999] grid min-h-dvh place-items-center overflow-hidden px-4 py-3">
      <button type="button" aria-label="Fechar" onClick={onClose} className="fixed inset-0 bg-[#1f0805]/62 backdrop-blur-md" />
      <div className="relative z-10 flex w-full max-w-5xl flex-col overflow-hidden rounded-[18px] border border-white/45 bg-[#fcf6ee] shadow-[0_28px_90px_rgba(27,10,7,.36)]">
        <div className="flex items-start justify-between gap-3 border-b border-hpsr-border bg-white px-5 py-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.16em] text-hpsr-wineLight">Acesso da equipe</p>
            <h2 className="mt-1 text-lg font-black text-hpsr-text">Solicitações de cadastro médico</h2>
            <p className="mt-1 text-sm text-hpsr-muted">Aprove ou recuse os cadastros recebidos pelo Supabase.</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => void onRefresh()} disabled={loading} className="rounded-xl border border-hpsr-border bg-white px-3 py-2 text-xs font-black text-hpsr-wine disabled:opacity-50">
              {loading ? "Atualizando..." : "Atualizar"}
            </button>
            <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-[14px] border border-hpsr-border bg-white text-hpsr-wine"><X size={18} /></button>
          </div>
        </div>
        <div className="max-h-[76vh] overflow-y-auto p-4">
          {error ? <div className="mb-3 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div> : null}
          <div className="grid gap-3">
            {loading && items.length === 0 ? <div className="rounded-[16px] border border-hpsr-border bg-white p-6 text-center text-sm text-hpsr-muted">Carregando solicitações...</div> : null}
            {items.map((item) => {
              const deciding = decisionId === item.id;
              return (
                <article key={item.id} className="rounded-[16px] border border-hpsr-border bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><h3 className="font-black text-hpsr-text">{item.name}</h3><p className="mt-1 text-xs text-hpsr-muted">Passaporte {item.passport} · {item.requestedRole} · {item.specialty}</p></div>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4"><Info label="E-mail" value={item.email} /><Info label="Telefone" value={item.cityPhone} /><Info label="Discord" value={item.discord} /><Info label="CRM" value={item.crm} /></div>
                  {item.status === "Pendente" ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" disabled={deciding} onClick={() => void onDecision(item, "Aprovado")} className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50">{deciding ? "Processando..." : "Aprovar cadastro"}</button>
                      <button type="button" disabled={deciding} onClick={() => void onDecision(item, "Recusado")} className="rounded-xl bg-red-700 px-4 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50">Recusar</button>
                    </div>
                  ) : null}
                </article>
              );
            })}
            {!loading && items.length === 0 ? <div className="rounded-[16px] border border-dashed border-hpsr-border bg-white p-6 text-center text-sm text-hpsr-muted">Nenhuma solicitação de cadastro recebida.</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}


function AdministrativeActionModal({
  state,
  onChange,
  onCancel,
  onConfirm,
}: {
  state: PendingAdministrativeAction;
  onChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { member, action, value } = state;
  const needsLongText = action === "Registrar conduta" || action === "Aplicar advertência" || action === "Ajustar permissões" || action === "Desligar";
  const fieldLabel = action === "Editar cargo" || action === "Promover"
    ? "Novo cargo"
    : action === "Ajustar permissões"
      ? "Permissões (separadas por ponto e vírgula)"
      : action === "Desligar"
        ? "Motivo do desligamento"
        : action === "Aplicar advertência"
          ? "Motivo da advertência"
          : "Conduta administrativa";
  const description = action === "Promover"
    ? "Confirme o cargo de promoção para o profissional selecionado."
    : action === "Editar cargo"
      ? "Atualize o cargo hospitalar mantendo o histórico administrativo."
      : action === "Ajustar permissões"
        ? "Informe as permissões que permanecerão ativas para este perfil."
        : action === "Desligar"
          ? "Esta ação remove o profissional da equipe cadastrada e registra o motivo informado."
          : "Registre a justificativa desta ação para manter o histórico do colaborador atualizado.";

  return (
    <div className="fixed inset-0 z-[100001] grid min-h-dvh place-items-center overflow-y-auto px-4 py-3">
      <button type="button" aria-label="Fechar modal" onClick={onCancel} className="fixed inset-0 bg-[#1f0805]/68 backdrop-blur-md" />
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[22px] border border-white/55 bg-[#fcf6ee] shadow-[0_32px_100px_rgba(27,10,7,.42)]">
        <div className="border-b border-hpsr-border bg-[linear-gradient(135deg,#fffaf4_0%,#f7eadc_55%,#f2e3d0_100%)] px-5 py-4 md:px-6 md:py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[.18em] text-hpsr-wineLight">Ação administrativa</p>
              <h2 className="mt-1 text-2xl font-black text-hpsr-text">{action}</h2>
              <p className="mt-2 text-sm text-hpsr-muted">{description}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black">
                <span className="rounded-full border border-[#ead7c8] bg-white px-3 py-1 text-hpsr-wine">{member.name}</span>
                <span className="rounded-full border border-[#ead7c8] bg-white px-3 py-1 text-hpsr-text">Passaporte {member.passport}</span>
                <span className="rounded-full border border-[#ead7c8] bg-white px-3 py-1 text-hpsr-text">{member.hospitalRole}</span>
              </div>
            </div>
            <button type="button" onClick={onCancel} className="flex h-10 w-10 items-center justify-center rounded-[16px] border border-hpsr-border bg-white/95 text-hpsr-wine transition hover:bg-white"><X size={18} /></button>
          </div>
        </div>
        <div className="p-5 md:p-6">
          <label className="block">
            <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">{fieldLabel}</span>
            {needsLongText ? (
              <textarea
                value={value}
                onChange={(event) => onChange(event.target.value)}
                rows={action === "Ajustar permissões" ? 5 : 4}
                className="min-h-[112px] w-full rounded-[18px] border border-hpsr-border bg-white px-4 py-3 text-sm font-semibold text-hpsr-text outline-none transition focus:border-hpsr-wineLight focus:ring-2 focus:ring-hpsr-wineLight/20"
                placeholder={action === "Ajustar permissões" ? "Ex.: prontuários; exames; documentos; financeiro" : "Descreva aqui..."}
              />
            ) : action === "Editar cargo" || action === "Promover" ? (
              <select value={value} onChange={(event) => onChange(event.target.value)} className="h-12 w-full rounded-[18px] border border-hpsr-border bg-white px-4 text-sm font-semibold text-hpsr-text outline-none transition focus:border-hpsr-wineLight focus:ring-2 focus:ring-hpsr-wineLight/20">
                {roles.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            ) : (
              <input value={value} onChange={(event) => onChange(event.target.value)} className="h-12 w-full rounded-[18px] border border-hpsr-border bg-white px-4 text-sm font-semibold text-hpsr-text outline-none transition focus:border-hpsr-wineLight focus:ring-2 focus:ring-hpsr-wineLight/20" placeholder="Informe o valor" />
            )}
          </label>

          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <button type="button" onClick={onCancel} className="rounded-[16px] border border-hpsr-border bg-white px-4 py-2.5 text-sm font-black text-hpsr-text transition hover:bg-[#f7f2ea]">Cancelar</button>
            <button type="button" onClick={onConfirm} className={`rounded-[16px] px-4 py-2.5 text-sm font-black text-white transition ${action === "Desligar" ? "bg-red-700 hover:bg-red-800" : "bg-hpsr-wine hover:bg-hpsr-wineDark"}`}>
              {action === "Desligar" ? "Confirmar desligamento" : "Salvar ação"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


function PendingApplicationsModal({
  items,
  onClose,
  onOpenAnalysis,
  onDelete,
}: {
  items: PublicStaffApplication[];
  onClose: () => void;
  onOpenAnalysis: (item: PublicStaffApplication) => void;
  onDelete: (item: PublicStaffApplication) => void;
}) {
  const pendingCount = items.filter((item) => !["Recusado", "Contratado", "Não contratado", "Sem resposta"].includes(item.status)).length;
  return (
    <div className="fixed inset-0 z-[99999] grid min-h-dvh place-items-center overflow-hidden px-4 py-3">
      <button type="button" aria-label="Fechar modal" onClick={onClose} className="fixed inset-0 bg-[#1f0805]/62 backdrop-blur-md" />
      <div className="relative z-10 flex w-full max-w-6xl flex-col overflow-hidden rounded-[16px] border border-white/45 bg-[#fcf6ee] shadow-[0_28px_90px_rgba(27,10,7,0.36)]">
        <div className="border-b border-hpsr-border bg-[linear-gradient(135deg,#fffaf4_0%,#f5e7d8_100%)] px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Trabalhe Conosco</p><h2 className="mt-1 text-lg font-black text-hpsr-text">Formulários e histórico</h2><p className="mt-1 text-sm text-hpsr-muted">Triagem, decisão e acompanhamento das entrevistas.</p></div>
            <div className="flex items-center gap-2"><span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-800">{pendingCount} pendente{pendingCount === 1 ? "" : "s"}</span><button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-[14px] border border-hpsr-border bg-white text-hpsr-wine"><X size={18} /></button></div>
          </div>
        </div>
        <div className="max-h-[76vh] overflow-y-auto p-3.5"><div className="grid gap-3">{items.map((item) => <ApplicationCard key={item.protocol} item={item} onOpenAnalysis={onOpenAnalysis} onDelete={onDelete} />)}{items.length === 0 && <div className="rounded-[16px] border border-dashed border-hpsr-border bg-white p-6 text-center"><p className="font-black text-hpsr-text">Nenhum formulário registrado.</p></div>}</div></div>
      </div>
    </div>
  );
}

function ApplicationCard({ item, onOpenAnalysis, onDelete }: { item: PublicStaffApplication; onOpenAnalysis: (item: PublicStaffApplication) => void; onDelete: (item: PublicStaffApplication) => void; }) {
  const triageDone = item.triageDecision === "Aprovado" || item.status === "Recusado";
  const interviewActive = item.triageDecision === "Aprovado" || ["entrevista", "Contratado", "Não contratado", "Sem resposta"].includes(item.status);
  return (
    <div className="rounded-[16px] border border-hpsr-border bg-[#fff8f0] p-3.5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-base font-black text-hpsr-text">{item.name}</p><p className="mt-1 text-xs font-semibold text-hpsr-muted">{item.protocol} · {item.desiredRole} · {item.interestArea || "Área não informada"}</p></div><StatusBadge status={item.status} /></div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3"><PendingStep title="1. Triagem" description="Ficha e respostas do candidato." active /><PendingStep title="2. Decisão" description={item.triageDecision || "Aguardando decisão"} active={triageDone} /><PendingStep title="3. Entrevista" description={item.interviewStatus || "Não agendada"} active={interviewActive} /></div>
      <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => onOpenAnalysis(item)} className="rounded-2xl bg-hpsr-wineLight px-3 py-2 text-xs font-semibold text-white">Abrir análise</button>{item.status === "Recusado" && <button type="button" onClick={() => onDelete(item)} className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"><Trash2 size={14}/>Excluir formulário</button>}</div>
    </div>
  );
}

function ApplicationAnalysisModal({
  item,
  onClose,
  onSave,
  onDelete,
}: {
  item: PublicStaffApplication;
  onClose: () => void;
  onSave: (item: PublicStaffApplication) => void;
  onDelete: (item: PublicStaffApplication) => void;
}) {
  const [draft, setDraft] = useState(item);
  const correctAnswers = draft.quizAnswers?.filter((answer) => answer.correct).length || 0;

  const approveTriage = () => {
    const next = {
      ...draft,
      status: "Aprovado",
      triageDecision: "Aprovado" as const,
      decisionAt: new Date().toISOString(),
      interviewStatus: draft.interviewStatus || "Não agendada",
    };
    setDraft(next);
    onSave(next);
  };

  const rejectTriage = () => {
    const next = {
      ...draft,
      status: "Recusado",
      triageDecision: "Recusado" as const,
      decisionAt: new Date().toISOString(),
      interviewStatus: "Não agendada" as const,
      interviewResult: "Pendente" as const,
    };
    setDraft(next);
    onSave(next);
  };

  const saveInterview = () => {
    let status = draft.status;
    if (draft.interviewStatus === "Sem resposta") status = "Sem resposta";
    else if (draft.interviewResult === "Contratado") status = "Contratado";
    else if (draft.interviewResult === "Não contratado") status = "Não contratado";
    else if (draft.interviewStatus === "Agendada" || draft.interviewStatus === "Realizada") status = "entrevista";

    const next = { ...draft, status };
    setDraft(next);
    onSave(next);
  };

  return (
    <div className="fixed inset-0 z-[100000] grid min-h-dvh place-items-center overflow-y-auto px-4 py-3">
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="fixed inset-0 bg-[#1f0805]/68 backdrop-blur-md"
      />

      <div className="relative z-10 flex w-full max-w-7xl flex-col overflow-hidden rounded-[22px] border border-white/55 bg-[#fcf6ee] shadow-[0_32px_100px_rgba(27,10,7,.42)]">
        <div className="border-b border-hpsr-border bg-[linear-gradient(135deg,#fffaf4_0%,#f7eadc_55%,#f2e3d0_100%)] px-5 py-4 md:px-6 md:py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[.18em] text-hpsr-wineLight">
                Análise da candidatura
              </p>
              <h2 className="mt-1 text-2xl font-black text-hpsr-text">{draft.name}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-hpsr-muted">
                <span>{draft.protocol}</span>
                <span className="text-hpsr-border">•</span>
                <span>{draft.desiredRole || "Cargo não informado"}</span>
                {draft.interestArea ? (
                  <>
                    <span className="text-hpsr-border">•</span>
                    <span>{draft.interestArea}</span>
                  </>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-2 self-start">
              <StatusBadge status={draft.status} />
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-[16px] border border-hpsr-border bg-white/95 text-hpsr-wine transition hover:bg-white"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
            <div className="grid gap-3 sm:grid-cols-3">
              <AnalysisQuickStat
                label="Triagem"
                value={draft.triageDecision || "Pendente"}
                tone={draft.triageDecision === "Aprovado" ? "success" : draft.triageDecision === "Recusado" ? "danger" : "neutral"}
              />
              <AnalysisQuickStat
                label="Entrevista"
                value={draft.interviewStatus || "Não agendada"}
                tone={draft.interviewStatus === "Sem resposta" ? "warning" : draft.interviewStatus === "Realizada" ? "success" : "neutral"}
              />
              <AnalysisQuickStat
                label="Questionário"
                value={draft.quizAnswers?.length ? `${correctAnswers}/${draft.quizAnswers.length} acertos` : "Sem registro"}
                tone={draft.quizAnswers?.length ? "neutral" : "warning"}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
              <button
                type="button"
                onClick={approveTriage}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800"
              >
                <CheckCircle2 size={17} />
                Aprovar
              </button>
              <button
                type="button"
                onClick={rejectTriage}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-700 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-red-800"
              >
                <X size={17} />
                Recusar
              </button>
              {draft.status === "Recusado" && (
                <button
                  type="button"
                  onClick={() => onDelete(draft)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-black text-red-700 transition hover:bg-red-100"
                >
                  <Trash2 size={16} />
                  Excluir formulário
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="max-h-[82vh] overflow-y-auto p-4 md:p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,.7fr)]">
            <div className="grid gap-4">
              <section className="rounded-[18px] border border-hpsr-border bg-white p-4 shadow-sm md:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-hpsr-border/80 pb-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Etapa 1</p>
                    <h3 className="mt-1 text-lg font-black text-hpsr-text">Triagem — ficha preenchida</h3>
                    <p className="mt-1 text-sm text-hpsr-muted">
                      Dados enviados pelo candidato no formulário público Trabalhe Conosco.
                    </p>
                  </div>
                  {draft.quizAnswers?.length ? (
                    <span className="rounded-full border border-hpsr-border bg-[#fff8f0] px-3 py-1 text-xs font-black text-hpsr-wine">
                      {correctAnswers}/{draft.quizAnswers.length} respostas corretas
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
                  <Info label="Passaporte" value={draft.passport} />
                  <Info label="Nascimento" value={[draft.birthDay, draft.birthMonth].filter(Boolean).join(" de ")} />
                  <Info label="Discord" value={draft.discord} />
                  <Info label="Telefone" value={draft.cityPhone} />
                  <Info label="Objetivo no hospital" value={draft.objective} />
                  <Info label="Disponibilidade externa" value={draft.externalAvailability} />
                  <Info label="Disponibilidade de horário" value={draft.availability} />
                  <Info label="Data do envio" value={draft.createdAt} />
                </div>

                <div className="mt-4 grid gap-3">
                  <LongInfo label="Possui experiência prévia?" value={draft.experience} />
                  <LongInfo label="Experiência anterior em RP médico" value={draft.priorExperience} />
                  <LongInfo label="Motivação" value={draft.motivation} />
                  <LongInfo label="Observações" value={draft.notes} />
                </div>
              </section>

              <section className="rounded-[18px] border border-hpsr-border bg-white p-4 shadow-sm md:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-hpsr-border/80 pb-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Etapa 2</p>
                    <h3 className="mt-1 text-lg font-black text-hpsr-text">Decisão da triagem</h3>
                    <p className="mt-1 text-sm text-hpsr-muted">
                      A aprovação informa ao candidato que um médico entrará em contato pelo Discord para marcar a entrevista.
                    </p>
                  </div>
                  <div className="rounded-[16px] border border-hpsr-border bg-[#fffaf4] px-4 py-3 text-right">
                    <p className="text-[10px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">Decisão registrada</p>
                    <p className="mt-1 text-sm font-bold text-hpsr-text">{draft.triageDecision || "Pendente"}</p>
                    <p className="mt-1 text-xs text-hpsr-muted">{draft.decisionAt ? `Atualizado em ${formatDateTime(draft.decisionAt)}` : "Ainda sem decisão formal"}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <PendingStep title="1. Triagem" description="Ficha completa e questionário" active />
                  <PendingStep title="2. Decisão" description={draft.triageDecision || "Aguardando decisão"} active={draft.triageDecision !== "Pendente"} />
                  <PendingStep title="3. Entrevista" description={draft.interviewStatus || "Não agendada"} active={draft.triageDecision === "Aprovado" || ["entrevista", "Contratado", "Não contratado", "Sem resposta"].includes(draft.status)} />
                </div>
              </section>

              <section className="rounded-[18px] border border-hpsr-border bg-white p-4 shadow-sm md:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hpsr-border/80 pb-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Questionário</p>
                    <h3 className="mt-1 text-lg font-black text-hpsr-text">Normas e situações RP</h3>
                    <p className="mt-1 text-sm text-hpsr-muted">
                      Perguntas e respostas registradas exatamente no envio da candidatura.
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${draft.declarationAccepted ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                    {draft.declarationAccepted ? "Declaração aceita" : "Declaração não registrada"}
                  </span>
                </div>

                <div className="mt-4 grid gap-3">
                  {draft.quizAnswers?.length ? (
                    draft.quizAnswers.map((answer, index) => (
                      <QuizAnswerCard key={`${draft.protocol}-quiz-${index}`} index={index} answer={answer} />
                    ))
                  ) : (
                    <div className="rounded-[14px] border border-dashed border-hpsr-border bg-[#fffaf4] p-4 text-sm text-hpsr-muted">
                      Esta candidatura foi registrada em uma versão anterior e não possui as respostas detalhadas do questionário salvas.
                    </div>
                  )}
                </div>
              </section>
            </div>

            <aside className="grid content-start gap-4">
              <section className="rounded-[18px] border border-hpsr-border bg-white p-4 shadow-sm md:p-5">
                <div className="flex items-start justify-between gap-3 border-b border-hpsr-border/80 pb-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Resumo atual</p>
                    <h3 className="mt-1 text-lg font-black text-hpsr-text">Situação administrativa</h3>
                  </div>
                  <MessageCircle className="text-hpsr-wineLight" size={18} />
                </div>

                <div className="mt-4 grid gap-3">
                  <AsideInfo label="Status da candidatura" value={draft.status} />
                  <AsideInfo label="Resultado da triagem" value={draft.triageDecision || "Pendente"} />
                  <AsideInfo label="Situação da entrevista" value={draft.interviewStatus || "Não agendada"} />
                  <AsideInfo label="Resultado da entrevista" value={draft.interviewResult || "Pendente"} />
                  <AsideInfo label="Discord para contato" value={draft.discord || "Não informado"} />
                </div>
              </section>

              <section className="rounded-[18px] border border-hpsr-border bg-white p-4 shadow-sm md:p-5">
                <div className="flex items-start justify-between gap-3 border-b border-hpsr-border/80 pb-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Etapa 3</p>
                    <h3 className="mt-1 text-lg font-black text-hpsr-text">Entrevista</h3>
                    <p className="mt-1 text-sm text-hpsr-muted">Agendamento, retorno e conclusão administrativa.</p>
                  </div>
                  <CalendarClock className="text-hpsr-wineLight" size={18} />
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <label className="text-xs font-black text-hpsr-text">
                    Situação
                    <select
                      className={modalInputClass}
                      value={draft.interviewStatus || "Não agendada"}
                      onChange={(e) => setDraft({ ...draft, interviewStatus: e.target.value as PublicStaffApplication["interviewStatus"] })}
                    >
                      <option>Não agendada</option>
                      <option>Agendada</option>
                      <option>Realizada</option>
                      <option>Sem resposta</option>
                    </select>
                  </label>
                  <label className="text-xs font-black text-hpsr-text">
                    Data e hora
                    <input
                      type="datetime-local"
                      className={modalInputClass}
                      value={draft.interviewAt || ""}
                      onChange={(e) => setDraft({ ...draft, interviewAt: e.target.value })}
                    />
                  </label>
                  <label className="text-xs font-black text-hpsr-text sm:col-span-2 lg:col-span-1 xl:col-span-2">
                    Resultado
                    <select
                      className={modalInputClass}
                      value={draft.interviewResult || "Pendente"}
                      onChange={(e) => setDraft({ ...draft, interviewResult: e.target.value as PublicStaffApplication["interviewResult"] })}
                    >
                      <option>Pendente</option>
                      <option>Contratado</option>
                      <option>Não contratado</option>
                    </select>
                  </label>
                  <label className="text-xs font-black text-hpsr-text sm:col-span-2 lg:col-span-1 xl:col-span-2">
                    Observações
                    <textarea
                      className={`${modalInputClass} min-h-24`}
                      value={draft.interviewNotes || ""}
                      onChange={(e) => setDraft({ ...draft, interviewNotes: e.target.value })}
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={saveInterview}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-hpsr-wine px-4 py-3 text-sm font-black text-white shadow-sm transition hover:opacity-95"
                >
                  <CalendarClock size={16} />
                  Salvar entrevista
                </button>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}



function QuizAnswerCard({ index, answer }: { index: number; answer: NonNullable<PublicStaffApplication["quizAnswers"]>[number] }) {
  return (
    <div className="rounded-[14px] border border-hpsr-border bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-black leading-relaxed text-hpsr-text">{index + 1}. {answer.question}</p>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[.08em] ${answer.correct ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"}`}>{answer.correct ? "Correta" : "Incorreta"}</span>
      </div>
      <div className="mt-2 rounded-xl border border-hpsr-border bg-[#fffaf4] px-3 py-2">
        <p className="text-[10px] font-black uppercase tracking-[.1em] text-hpsr-wineLight">Resposta do candidato</p>
        <p className="mt-1 text-sm leading-relaxed text-hpsr-muted">{answer.answer || "Não respondida"}</p>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string }) { return <div className="rounded-[14px] border border-hpsr-border bg-[#fffaf4] p-3"><p className="text-[10px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">{label}</p><p className="mt-1 font-semibold text-hpsr-text">{value || "Não informado"}</p></div>; }
function LongInfo({ label, value }: { label: string; value?: string }) { return <div className="rounded-[14px] border border-hpsr-border bg-[#fffaf4] p-3"><p className="text-[10px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">{label}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-hpsr-muted">{value || "Não informado"}</p></div>; }

function AnalysisQuickStat({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "success" | "danger" | "warning" | "neutral"; }) {
  const tones = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    danger: "border-red-200 bg-red-50 text-red-800",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    neutral: "border-hpsr-border bg-white/80 text-hpsr-text",
  } as const;

  return <div className={`rounded-[16px] border px-3.5 py-3 ${tones[tone]}`}><p className="text-[10px] font-black uppercase tracking-[.12em] opacity-75">{label}</p><p className="mt-1 text-sm font-black leading-snug">{value}</p></div>;
}

function AsideInfo({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[14px] border border-hpsr-border bg-[#fffaf4] px-3.5 py-3"><p className="text-[10px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">{label}</p><p className="mt-1 text-sm font-semibold text-hpsr-text">{value}</p></div>;
}

function PendingStep({ title, description, active = false }: { title: string; description: string; active?: boolean }) {
  return (
    <div className={`rounded-[16px] border px-3 py-2 ${
      active ? "border-hpsr-wine bg-white text-hpsr-text" : "border-hpsr-border bg-white/70 text-hpsr-muted"
    }`}>
      <p className="text-xs font-black">{title}</p>
      <p className="mt-1 text-[11px] leading-relaxed">{description}</p>
    </div>
  );
}

function ContractStatusPanel({
  member,
  contract,
  onAction,
}: {
  member: TeamMember;
  contract: NonNullable<ReturnType<typeof getContractInfo>>;
  onAction: (member: TeamMember, action: string) => void;
}) {
  const { profile: currentUserProfile } = useCurrentUserProfile();
  const isDevUser = currentUserProfile.systemRole === "Dev / Desenvolvedor do Sistema";
  const isDirectorUser = isDevUser || currentUserProfile.role === "Diretora";
  const isViceDirectorOrAboveUser = isDevUser || administrativeRoles.includes(currentUserProfile.role);
  const hasTeamAdminAccess = isDevUser || administrativeRoles.includes(currentUserProfile.role);
  return (
    <section className={`rounded-[16px] border p-3.5 ${contractToneClasses(contract.tone)}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em]">Contrato e progressão</p>
          <h3 className="mt-1 text-sm font-black text-hpsr-text">{contract.kind}</h3>
          <p className="mt-1 text-xs font-semibold text-hpsr-muted">
            {member.hospitalRole} · {contract.workedDays}/{contract.limit} dias · Entrada {formatDate(member.joinedAt)}
          </p>
        </div>
        <AlertTriangle size={18} />
      </div>

      <p className="mt-3 rounded-[14px] border border-white/70 bg-white/70 px-3 py-2 text-sm font-semibold leading-relaxed text-current">
        {contract.message}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {contract.actions.map((action) => {
          const promoteAction = action.includes("Promover") || action.includes("Especialização") || action.includes("clínico");
          const removeAction = action.includes("Desligar");
          const allowed =
            promoteAction ? isDirectorUser : removeAction ? isViceDirectorOrAboveUser : hasTeamAdminAccess;
          const restriction = promoteAction
            ? "Somente Diretora"
            : removeAction
              ? "Diretora, Vice ou Dev"
              : "Diretoria técnica ou acima";

          return (
            <button
              key={action}
              type="button"
              disabled={!allowed}
              onClick={() => allowed && onAction(member, action)}
              className={`rounded-2xl px-3 py-2 text-xs font-black transition ${
                allowed ? "border border-white/60 bg-white/90 text-hpsr-text" : "border border-white/40 bg-white/50 text-hpsr-muted"
              }`}
            >
              {action}
              {!allowed ? ` · ${restriction}` : ""}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ContractAlertCard({
  member,
  contract,
}: {
  member: TeamMember;
  contract: NonNullable<ReturnType<typeof getContractInfo>>;
}) {
  const { profile: currentUserProfile } = useCurrentUserProfile();
  const isDevUser = currentUserProfile.systemRole === "Dev / Desenvolvedor do Sistema";
  const isDirectorUser = isDevUser || currentUserProfile.role === "Diretora";
  const isViceDirectorOrAboveUser = isDevUser || administrativeRoles.includes(currentUserProfile.role);
  const hasTeamAdminAccess = isDevUser || administrativeRoles.includes(currentUserProfile.role);
  const danger = contract.tone === "danger";

  return (
    <div className={`rounded-[16px] border p-3.5 ${
      danger ? "border-rose-200 bg-rose-50" : "border-amber-200 bg-amber-50"
    }`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${danger ? "text-rose-700" : "text-amber-800"}`}>
            {contract.kind}
          </p>
          <h3 className="mt-1 text-sm font-black text-hpsr-text">{member.name}</h3>
          <p className="mt-1 text-xs font-semibold text-hpsr-muted">
            {member.hospitalRole} · {contract.workedDays}/{contract.limit} dias · Entrada {formatDate(member.joinedAt)}
          </p>
        </div>
        <AlertTriangle size={20} className={danger ? "text-rose-700" : "text-amber-700"} />
      </div>

      <p className={`mt-3 rounded-[14px] border bg-white/78 px-3 py-2 text-sm font-semibold leading-relaxed ${
        danger ? "border-rose-200 text-rose-800" : "border-amber-200 text-amber-800"
      }`}>
        {contract.message}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {contract.actions.map((action) => {
          const promoteAction = action.includes("Promover") || action.includes("Especialização") || action.includes("clínico");
          const removeAction = action.includes("Desligar");
          const allowed =
            promoteAction ? isDirectorUser : removeAction ? isViceDirectorOrAboveUser : hasTeamAdminAccess;
          const restriction = promoteAction
            ? "Somente Diretora"
            : removeAction
              ? "Diretora, Vice ou Dev"
              : "Diretoria técnica ou acima";

          return (
            <button
              key={action}
              disabled={!allowed}
              title={allowed ? restriction : `Bloqueado: ${restriction}`}
              className={`rounded-2xl px-3 py-2 text-xs font-black ${
                allowed
                  ? danger
                    ? "bg-rose-700 text-white"
                    : "bg-amber-700 text-white"
                  : "cursor-not-allowed bg-zinc-200 text-zinc-500"
              }`}
            >
              {action}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AdminActionCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[16px] border border-hpsr-border bg-white/[0.86] px-4 py-3">
      <p className="text-xs font-black text-hpsr-text">{title}</p>
      <p className="mt-1 text-[11px] font-semibold leading-relaxed text-hpsr-muted">{description}</p>
    </div>
  );
}

function TeamMemberEmptyPanel({ members, onSelect }: { members: TeamMember[]; onSelect: (id: string) => void }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-[16px] border border-hpsr-border bg-white">
      <div className="border-b border-hpsr-border bg-[#fcf6ee] px-4 py-3">
        <h2 className="text-lg font-black text-hpsr-text">Resumo da equipe</h2>
        <p className="mt-1 text-sm text-hpsr-muted">
          Selecione um médico para abrir permissões, conduta e ações administrativas.
        </p>
      </div>

      <div className="grid gap-2 p-3.5">
        {members.map((member) => (
          <button
            key={member.id}
            type="button"
            onClick={() => onSelect(member.id)}
            className="rounded-[16px] border border-hpsr-border bg-[#fff8f0] px-4 py-3 text-left text-sm font-black text-hpsr-text transition hover:bg-white"
          >
            {member.name} <span className="font-semibold text-hpsr-muted">| {member.crm}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function PracticalMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-hpsr-border bg-white px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">{label}</p>
      <p className="mt-1 text-lg font-black text-hpsr-text">{value}</p>
    </div>
  );
}

function TeamMemberExpandedContent({ member, onContractAction, onAdministrativeAction }: { member: TeamMember; onContractAction: (member: TeamMember, action: string) => void; onAdministrativeAction: (member: TeamMember, action: string) => void }) {
  const { profile: currentUserProfile } = useCurrentUserProfile();
  const isDevUser = currentUserProfile.systemRole === "Dev / Desenvolvedor do Sistema";
  const isDirectorUser = isDevUser || currentUserProfile.role === "Diretora";
  const isViceDirectorOrAboveUser = isDevUser || administrativeRoles.includes(currentUserProfile.role);
  const hasTeamAdminAccess = isDevUser || administrativeRoles.includes(currentUserProfile.role);
  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
      <div className="grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <InfoBlock icon={<BriefcaseMedical size={16} />} label="Departamento" value={member.department} />
          <InfoBlock icon={<Stethoscope size={16} />} label="Especialidade" value={member.specialty} />
          <InfoBlock icon={<KeyRound size={16} />} label="CRM" value={member.crm} />
          <InfoBlock icon={<Radio size={16} />} label="Rádio" value={member.radio} />
          <InfoBlock icon={<BadgeCheck size={16} />} label="Entrada" value={formatDate(member.joinedAt)} />
          <InfoBlock icon={<ShieldCheck size={16} />} label="Nível de acesso" value={member.accessLevel} />
        </div>

        {getContractInfo(member) && <ContractStatusPanel member={member} contract={getContractInfo(member)!} onAction={onContractAction} />}

        <section className="rounded-[16px] border border-hpsr-border bg-[#fff8f0] p-3.5">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Conduta e histórico</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <ConductBox label="Advertências" value={String(member.warnings)} alert={member.warnings >= 2} />
            <ConductBox label="Suspensões" value={String(member.suspensions)} alert={member.suspensions >= 2} />
          </div>
          <div className="mt-3 grid gap-2">
            {member.history.map((item) => (
              <p key={item} className="rounded-2xl border border-hpsr-border bg-white px-3 py-2 text-sm font-semibold text-hpsr-muted">
                {item}
              </p>
            ))}
          </div>
          <p className="mt-3 rounded-[14px] border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
            Regra: 3 advertências geram suspensão automática. 3 suspensões geram demissão.
          </p>
        </section>
      </div>

      <div className="grid gap-3">
        {hasTeamAdminAccess && <section className="rounded-[16px] border border-hpsr-border bg-[#fff8f0] p-3.5">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Ações administrativas</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <AdminButton allowed={isDirectorUser} onClick={() => onAdministrativeAction(member, "Editar cargo")} note="Somente Diretora">Editar cargo</AdminButton>
            <AdminButton allowed={isDevUser} onClick={() => onAdministrativeAction(member, "Ajustar permissões")} note="Somente Dev">Ajustar permissões</AdminButton>
            <AdminButton allowed={hasTeamAdminAccess} onClick={() => onAdministrativeAction(member, "Registrar conduta")} note="Diretoria técnica ou acima">Registrar conduta</AdminButton>
            <AdminButton allowed={hasTeamAdminAccess} onClick={() => onAdministrativeAction(member, "Aplicar advertência")} note="Diretoria técnica ou acima">Aplicar advertência</AdminButton>
            <AdminButton allowed={isDirectorUser} onClick={() => onAdministrativeAction(member, "Promover")} note="Somente Diretora">Promover</AdminButton>
            <AdminButton allowed={isViceDirectorOrAboveUser} onClick={() => onAdministrativeAction(member, "Desligar")} note="Diretora, Vice ou Dev" variant="danger">Desligar</AdminButton>
          </div>
          <div className="mt-3 rounded-[14px] border border-hpsr-border bg-white px-3 py-2 text-xs font-semibold leading-relaxed text-hpsr-muted">
            Promoção é decisão exclusiva da Diretora. Remoção pode ser feita por Vices ou acima. Ajuste de permissões é restrito ao Dev.
          </div>
        </section>}

        <ClinicalActivityPanel member={member} />

        <section className="rounded-[16px] border border-hpsr-border bg-[#fff8f0] p-3.5">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Permissões ativas</p>
          <div className="mt-3 grid gap-2">
            {member.permissions.map((permission) => (
              <div key={permission} className="flex items-start gap-2 rounded-[14px] border border-hpsr-border bg-white px-3 py-2 text-sm font-semibold text-hpsr-text">
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                {permission}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}


function ClinicalActivityPanel({ member }: { member: TeamMember }) {
  const activity = member.clinicalActivity || { exams: 0, certificates: 0, agreements: 0, consultations: 0, prescriptions: 0, procedures: 0 };
  const total = activity.exams + activity.certificates + activity.agreements + activity.consultations + activity.prescriptions + activity.procedures;

  return (
    <section className="rounded-[16px] border border-hpsr-border bg-[#fff8f0] p-3.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Monitoramento clínico</p>
          <p className="mt-1 text-sm font-semibold text-hpsr-muted">Histórico quantitativo para revisão e orientação da prática assistencial.</p>
        </div>
        <span className="rounded-full border border-hpsr-border bg-white px-3 py-1 text-xs font-black text-hpsr-wine">{total} registros</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <MiniStat label="Exames" value={String(activity.exams)} />
        <MiniStat label="Atestados" value={String(activity.certificates)} />
        <MiniStat label="Convênios" value={String(activity.agreements)} />
        <MiniStat label="Consultas" value={String(activity.consultations)} />
        <MiniStat label="Prescrições" value={String(activity.prescriptions)} />
        <MiniStat label="Procedimentos" value={String(activity.procedures)} />
      </div>
      <div className="mt-3 rounded-[14px] border border-hpsr-border bg-white px-3 py-2 text-xs font-semibold leading-relaxed text-hpsr-muted">
        {activity.lastActivity ? `Última atividade registrada em ${formatDateTime(activity.lastActivity)}.` : "Nenhuma atividade assistencial registrada para este profissional."} O Diretor Clínico utiliza este histórico apenas para verificar a execução correta dos procedimentos e orientar a equipe.
      </div>
    </section>
  );
}

function TeamMemberPanel({ member }: { member: TeamMember }) {
  const { profile: currentUserProfile } = useCurrentUserProfile();
  const isDevUser = currentUserProfile.systemRole === "Dev / Desenvolvedor do Sistema";
  const isDirectorUser = isDevUser || currentUserProfile.role === "Diretora";
  const isViceDirectorOrAboveUser = isDevUser || administrativeRoles.includes(currentUserProfile.role);
  const hasTeamAdminAccess = isDevUser || administrativeRoles.includes(currentUserProfile.role);
  return (
    <div className="min-w-0 overflow-hidden rounded-[16px] border border-hpsr-border bg-white">
      <div className="border-b border-hpsr-border bg-[linear-gradient(135deg,#fffaf4_0%,#f5e7d8_100%)] p-3.5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-black text-hpsr-text">{member.name}</h2>
              <span className={`rounded-full border px-3 py-1 text-xs font-black ${categoryClasses(member.category)}`}>{member.category}</span>
              <span className={`rounded-full border px-3 py-1 text-xs font-black ${serviceClasses(member.serviceStatus)}`}>{member.serviceStatus}</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-hpsr-muted">
              Passaporte {member.passport} · {member.hospitalRole} {member.systemRole ? `· ${member.systemRole}` : ""}
            </p>
          </div>
          <div className="rounded-[16px] border border-hpsr-border bg-white px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">Nível de acesso</p>
            <p className="mt-1 text-sm font-black text-hpsr-text">{member.accessLevel}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-3.5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <InfoBlock icon={<BriefcaseMedical size={16} />} label="Departamento" value={member.department} />
          <InfoBlock icon={<Stethoscope size={16} />} label="Especialidade" value={member.specialty} />
          <InfoBlock icon={<KeyRound size={16} />} label="CRM" value={member.crm} />
          <InfoBlock icon={<Radio size={16} />} label="Rádio" value={member.radio} />
          <InfoBlock icon={<BadgeCheck size={16} />} label="Entrada" value={formatDate(member.joinedAt)} />
        </div>

        <div className="rounded-[16px] border border-hpsr-border bg-[#fff8f0] p-3.5">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Ações administrativas</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            <AdminButton allowed={isDirectorUser} note="Somente Diretora">
              Editar cargo
            </AdminButton>
            <AdminButton allowed={isDevUser} note="Somente Dev">
              Ajustar permissões
            </AdminButton>
            <AdminButton allowed={hasTeamAdminAccess} note="Diretoria técnica ou acima">
              Registrar conduta
            </AdminButton>
            <AdminButton allowed={isDirectorUser} note="Somente Diretora">
              Promover
            </AdminButton>
            <AdminButton allowed={isViceDirectorOrAboveUser} note="Diretora, Vice ou Dev" variant="danger">
              Desligar
            </AdminButton>
          </div>
          <div className="mt-3 rounded-[14px] border border-hpsr-border bg-white px-3 py-2 text-xs font-semibold leading-relaxed text-hpsr-muted">
            Promoção é decisão exclusiva da Diretora, exceto Dev para manutenção. Remoção pode ser feita por Vices ou acima. Ajuste de permissões é restrito ao Dev.
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <section className="rounded-[16px] border border-hpsr-border bg-[#fff8f0] p-3.5">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Permissões</p>
            <div className="mt-3 grid gap-2">
              {member.permissions.map((permission) => (
                <div key={permission} className="flex items-start gap-2 rounded-[14px] border border-hpsr-border bg-white px-3 py-2 text-sm font-semibold text-hpsr-text">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                  {permission}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[16px] border border-hpsr-border bg-[#fff8f0] p-3.5">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Conduta e histórico</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <ConductBox label="Advertências" value={String(member.warnings)} alert={member.warnings >= 2} />
              <ConductBox label="Suspensões" value={String(member.suspensions)} alert={member.suspensions >= 2} />
            </div>
            <div className="mt-3 grid gap-2">
              {member.history.map((item) => (
                <p key={item} className="rounded-2xl border border-hpsr-border bg-white px-3 py-2 text-sm font-semibold text-hpsr-muted">
                  {item}
                </p>
              ))}
            </div>
            <p className="mt-3 rounded-[14px] border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
              Regra: 3 advertências geram suspensão automática. 3 suspensões geram demissão.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function AddMemberModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (data: Omit<TeamMember, "id" | "permissions" | "warnings" | "suspensions" | "history" | "accessLevel" | "category">) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    passport: "",
    crm: "",
    hospitalRole: "Médico Clínico",
    systemRole: "",
    department: "Hospital São Rafael",
    specialty: "Clínico Geral",
    cityPhone: "",
    email: "",
    radio: "193",
    joinedAt: new Date().toISOString().slice(0, 10),
    serviceStatus: "Fora de serviço" as ServiceStatus,
  });

  const previewAccess = getAccessLevel(form.hospitalRole, form.systemRole);
  const previewCategory = getCategory(form.hospitalRole, form.systemRole);
  const contractHint =
    form.hospitalRole === "Estagiário de Enfermagem"
      ? "Estágio inicial de 7 dias com decisão de promoção ou desligamento."
      : form.hospitalRole === "Residente"
        ? "Ciclo de 15 dias com avaliação obrigatória no último dia."
        : "Ciclo padrão de 15 dias com revisão de função e desempenho.";

  function updateField(field: keyof typeof form, value: string) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim() || !form.passport.trim() || !form.hospitalRole.trim()) {
      void hpsrAlert("Informe nome, passaporte e cargo.", "Dados incompletos");
      return;
    }

    onSave(form);
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center overflow-y-auto px-4 py-3">
      <button type="button" aria-label="Fechar" onClick={onClose} className="absolute inset-0 bg-[#2a0700]/56 backdrop-blur-sm" />
      <form onSubmit={handleSubmit} className="relative z-10 flex w-full max-w-[1120px] max-h-[92vh] flex-col overflow-hidden rounded-[16px] border border-white/70 bg-[#fffaf4] shadow-[0_30px_90px_rgba(42,7,0,0.28)] md:rounded-[16px]">
        <div className="bg-[linear-gradient(135deg,#2a0700_0%,#672614_54%,#b18a72_100%)] px-4 py-3 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em]">
                <UserCog size={14} />
                Cadastro interno
              </span>
              <h2 className="mt-3 text-lg font-black tracking-tight">Registrar médico</h2>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-white/84">
                Cadastre profissionais, defina vínculo institucional, especialidade, status de serviço e dados internos de operação.
              </p>
            </div>
            <button type="button" onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[14px] border border-white/25 bg-white/10 text-white transition hover:bg-white/20">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="grid flex-1 overflow-y-auto xl:grid-cols-[320px_minmax(0,1fr)] xl:overflow-hidden">
          <aside className="border-b border-hpsr-border bg-[linear-gradient(180deg,#fff6ec_0%,#fffaf4_100%)] p-3.5 md:p-5 xl:border-b-0 xl:border-r">
            <div className="grid gap-3 xl:sticky xl:top-0">
              <div className="rounded-[16px] border border-hpsr-border bg-white p-3.5">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Pré-visualização</p>
                <div className="mt-3 flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[16px] bg-[#fff2e4] text-hpsr-wine">
                    <UserRound size={22} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-hpsr-text">{form.name || "Nome do médico"}</p>
                    <p className="mt-1 text-sm font-semibold text-hpsr-muted">{form.crm || "CRM ainda não informado"}</p>
                    <p className="mt-1 text-xs font-semibold text-hpsr-muted">Passaporte {form.passport || "---"}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <div className="rounded-[16px] border border-hpsr-border bg-white p-3.5">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">Cargo base</p>
                  <p className="mt-1 text-sm font-black text-hpsr-text">{form.hospitalRole}</p>
                </div>
                <div className="rounded-[16px] border border-hpsr-border bg-white p-3.5">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">Nível de acesso</p>
                  <p className="mt-1 text-sm font-black text-hpsr-text">{previewAccess}</p>
                </div>
                <div className="rounded-[16px] border border-hpsr-border bg-white p-3.5">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">Categoria</p>
                  <p className="mt-1 text-sm font-black text-hpsr-text">{previewCategory}</p>
                </div>
              </div>

              <div className="rounded-[16px] border border-hpsr-border bg-white p-3.5">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Regras rápidas</p>
                <div className="mt-3 grid gap-2 text-sm font-semibold text-hpsr-muted">
                  <p>• Diretora promove. Vice pode remover. Dev ajusta permissões.</p>
                  <p>• Rádio padrão do hospital: 193.</p>
                  <p>• {contractHint}</p>
                </div>
              </div>
            </div>
          </aside>

          <div className="p-4 md:p-5 xl:overflow-y-auto">
            <div className="grid gap-3">
              <section className="rounded-[16px] border border-hpsr-border bg-white p-3.5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[16px] bg-[#fff2e4] text-hpsr-wine">
                    <UserCog size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Identificação</p>
                    <h3 className="text-base font-black text-hpsr-text">Dados profissionais</h3>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <ModalField label="Nome do personagem">
                    <input className={modalInputClass} value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Ex.: Dr. Luidhy" />
                  </ModalField>
                  <ModalField label="Passaporte">
                    <input className={modalInputClass} value={form.passport} onChange={(event) => updateField("passport", event.target.value)} placeholder="Ex.: 0001" />
                  </ModalField>
                  <ModalField label="CRM">
                    <input className={modalInputClass} value={form.crm} onChange={(event) => updateField("crm", event.target.value)} placeholder="Ex.: CRM-RP 193-001" />
                  </ModalField>
                  <ModalField label="Cargo hospitalar">
                    <select className={modalInputClass} value={form.hospitalRole} onChange={(event) => updateField("hospitalRole", event.target.value)}>
                      {roles.map((role) => <option key={role} value={role}>{role}</option>)}
                    </select>
                  </ModalField>
                  <ModalField label="Cargo do sistema">
                    <select className={modalInputClass} value={form.systemRole} onChange={(event) => updateField("systemRole", event.target.value)}>
                      <option value="">Sem cargo técnico</option>
                      <option value="Dev / Desenvolvedor do Sistema">Dev / Desenvolvedor do Sistema</option>
                    </select>
                  </ModalField>
                  <ModalField label="Especialidades">
                    <input list="hpsr-specialties" className={modalInputClass} value={form.specialty} onChange={(event) => updateField("specialty", event.target.value)} placeholder="Selecione ou informe; separe múltiplas por vírgula" />
                    <datalist id="hpsr-specialties">
                      {["Clínico Geral", "Cardiologia", "Cirurgia Geral", "Obstetrícia", "Pediatria", "Ortopedia", "Neurologia", "Psiquiatria", "Enfermagem", "Radiologia", "Nutrição"].map((item) => <option key={item} value={item} />)}
                    </datalist>
                    <p className="mt-1 text-[11px] font-semibold text-hpsr-muted">É possível atribuir mais de uma especialidade separando por vírgulas.</p>
                  </ModalField>
                </div>
              </section>

              <section className="rounded-[16px] border border-hpsr-border bg-white p-3.5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[16px] bg-[#fff2e4] text-hpsr-wine">
                    <BriefcaseMedical size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Vínculo institucional</p>
                    <h3 className="text-base font-black text-hpsr-text">Lotação e contato</h3>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <ModalField label="Departamento">
                    <input className={modalInputClass} value={form.department} onChange={(event) => updateField("department", event.target.value)} />
                  </ModalField>
                  <ModalField label="Telefone na cidade">
                    <input className={modalInputClass} value={form.cityPhone} onChange={(event) => updateField("cityPhone", event.target.value)} placeholder="Ex.: (in game)" />
                  </ModalField>
                  <ModalField label="E-mail institucional">
                    <input className={modalInputClass} value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="Ex.: nome@hpsr.local" />
                  </ModalField>
                  <ModalField label="Rádio">
                    <input className={modalInputClass} value={form.radio} onChange={(event) => updateField("radio", event.target.value)} />
                  </ModalField>
                  <ModalField label="Data de entrada">
                    <input type="date" className={modalInputClass} value={form.joinedAt} onChange={(event) => updateField("joinedAt", event.target.value)} />
                  </ModalField>
                  <ModalField label="Status inicial">
                    <select className={modalInputClass} value={form.serviceStatus} onChange={(event) => updateField("serviceStatus", event.target.value)}>
                      {serviceStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </ModalField>
                </div>
              </section>

              <section className="rounded-[16px] border border-hpsr-border bg-[#fff8f0] p-3.5">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Conferência antes de salvar</p>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <div className="rounded-[16px] border border-hpsr-border bg-white p-3.5">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">Perfil</p>
                    <p className="mt-1 text-sm font-black text-hpsr-text">{form.hospitalRole}</p>
                    <p className="mt-1 text-xs font-semibold text-hpsr-muted">{form.specialty || "Especialidade não informada"}</p>
                  </div>
                  <div className="rounded-[16px] border border-hpsr-border bg-white p-3.5">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">Permissão prevista</p>
                    <p className="mt-1 text-sm font-black text-hpsr-text">{previewAccess}</p>
                    <p className="mt-1 text-xs font-semibold text-hpsr-muted">Categoria {previewCategory}</p>
                  </div>
                  <div className="rounded-[16px] border border-hpsr-border bg-white p-3.5">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">Contrato inicial</p>
                    <p className="mt-1 text-sm font-black text-hpsr-text">{form.hospitalRole === "Estagiário de Enfermagem" ? "7 dias" : "15 dias"}</p>
                    <p className="mt-1 text-xs font-semibold text-hpsr-muted">{contractHint}</p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex flex-col-reverse gap-3 border-t border-hpsr-border bg-white/[0.92] p-3.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold text-hpsr-muted">Após salvar, o médico será incluído na equipe cadastrada com permissões automáticas conforme o cargo.</p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <button type="button" onClick={onClose} className="rounded-[16px] border border-hpsr-border bg-white px-4 py-3 text-sm font-black text-hpsr-text transition hover:bg-[#fff8f0]">Cancelar</button>
            <button type="submit" className="rounded-[16px] bg-[linear-gradient(135deg,#672614,#74321e)] px-4 py-3 text-sm font-black text-white transition">Salvar registro</button>
          </div>
        </div>
      </form>
    </div>
  );
}

function getAccessLevel(hospitalRole: string, systemRole?: string): TeamMember["accessLevel"] {
  if (systemRole?.includes("Dev")) return "Total";
  if (hospitalRole === "Diretora" || hospitalRole === "Vice Diretor") return "Direção";
  if (hospitalRole === "Diretor Clínico") return "Clínico avançado";
  if (hospitalRole.includes("Médico")) return "Clínico";
  if (hospitalRole === "Residente") return "Supervisionado";
  return "Restrito";
}

function getCategory(hospitalRole: string, systemRole?: string): TeamCategory {
  if (systemRole?.includes("Dev")) return "Sistema";
  if (["Diretora", "Vice Diretor", "Diretor Clínico"].includes(hospitalRole)) return "Direção";
  if (hospitalRole.includes("Médico")) return "Corpo Médico";
  return "Formação";
}

function getDefaultPermissions(hospitalRole: string, systemRole?: string) {
  if (systemRole?.includes("Dev")) {
    return ["Acesso total ao sistema", "Manutenção e atualização", "Gestão de permissões", "Testes técnicos"];
  }
  if (hospitalRole === "Diretora" || hospitalRole === "Vice Diretor") {
    return ["Gestão de equipe", "Convênios", "Procedimentos", "Permissões", "Normas e punições"];
  }
  if (hospitalRole === "Diretor Clínico") {
    return ["Histórico assistencial", "Indicadores de produção clínica", "Revisão de exames e documentos", "Orientação da equipe médica"];
  }
  if (hospitalRole.includes("Médico")) return ["Atendimento clínico", "Prontuários", "Prescrições", "Consultas"];
  if (hospitalRole === "Residente") return ["Atendimento supervisionado", "Visualização clínica limitada"];
  return ["Apoio supervisionado", "Acesso restrito"];
}

function HeroMetric({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-[16px] border border-white/20 bg-white/10 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-white/75">{label}</p>
        <span className="text-white/85">{icon}</span>
      </div>
      <p className="mt-1 text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function SummaryCard({ title, value, description, icon }: { title: string; value: string; description: string; icon: ReactNode }) {
  return (
    <div className="rounded-[16px] border border-hpsr-border bg-white p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-hpsr-wineLight">{title}</p>
          <p className="mt-2 text-lg font-black text-hpsr-text">{value}</p>
          <p className="mt-1 text-sm leading-relaxed text-hpsr-muted">{description}</p>
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[16px] bg-[#fff8f0] text-hpsr-wine">{icon}</div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-hpsr-wineLight">{label}</p>
      <p className="mt-0.5 truncate text-xs font-black text-hpsr-text">{value}</p>
    </div>
  );
}

function AdminButton({
  children,
  variant = "default",
  allowed = true,
  note,
  onClick,
}: {
  children: ReactNode;
  variant?: "default" | "danger";
  allowed?: boolean;
  note: string;
  onClick?: () => void;
}) {
  const activeClass =
    variant === "danger"
      ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
      : "border-hpsr-border bg-white text-hpsr-wine hover:bg-[#fffaf4]";

  return (
    <button
      type="button"
      disabled={!allowed}
      onClick={onClick}
      title={allowed ? note : `Bloqueado: ${note}`}
      className={`rounded-2xl border px-3 py-2 text-left text-xs font-black transition ${
        allowed
          ? activeClass
          : "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-500"
      }`}
    >
      <span className="block">{children}</span>
      <span className="mt-1 block text-[10px] font-semibold opacity-75">{note}</span>
    </button>
  );
}

function InfoBlock({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-hpsr-border bg-[#fff8f0] p-3.5">
      <div className="flex items-center gap-2 text-hpsr-wine">
        {icon}
        <p className="text-[10px] font-black uppercase tracking-[0.14em]">{label}</p>
      </div>
      <p className="mt-2 text-sm font-black text-hpsr-text">{value}</p>
    </div>
  );
}

function ConductBox({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className={`rounded-[16px] border p-3.5 ${alert ? "border-amber-200 bg-amber-50" : "border-hpsr-border bg-white"}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">{label}</p>
      <p className="mt-1 text-lg font-black text-hpsr-text">{value}</p>
    </div>
  );
}

const modalInputClass =
  "min-w-0 w-full rounded-[16px] border border-hpsr-border bg-[#fff8f0] px-4 py-3 text-sm font-semibold text-hpsr-text outline-none transition placeholder:text-zinc-400 focus:border-hpsr-wineLight focus:bg-white focus:ring-2 focus:ring-hpsr-wineLight/20";

function ModalField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
