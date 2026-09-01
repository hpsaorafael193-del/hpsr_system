"use client";

import { brazilDate, brazilIso, brazilMonth } from "@/lib/brazil-datetime";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  BadgeDollarSign,
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  FileClock,
  FlaskConical,
  Hash,
  HeartPulse,
  Phone,
  RotateCcw,
  Search,
  Stethoscope,
  UserCheck,
  UsersRound,
  X,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useCurrentUserProfile } from "@/components/auth/CurrentUserProfileProvider";
import { doctorCanAccessSpecialty, doctorVisibleSpecialties, normalizeSpecialty } from "@/data/appointment-rules";
import { createClient } from "@/lib/supabase";
import { hpsrAlert } from "@/components/ui/HpsrDialogProvider";
import { ClinicalFollowupPlanner } from "@/components/dashboard/ClinicalFollowupPlanner";

type TabId = "solicitacoes" | "aceitas" | "exames" | "consultas" | "acompanhamentos" | "reagendamentos" | "cobrancas";

type PublicAppointmentRequest = {
  id: string;
  passport: string;
  patient: string;
  cityPhone?: string;
  bloodType?: string;
  discord?: string;
  specialty: string;
  preferredDate?: string;
  preferredPeriod?: string;
  preferredTime?: string;
  preferred?: string;
  reason?: string;
  notes?: string;
  flowType?: string;
  flowDetails?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  doctor?: string;
  answer?: string;
  proposedDate?: string;
  proposedTime?: string;
  rescheduleReason?: string;
  patientResponse?: string;
  patientResponseAt?: string;
  patientAlternativeDate?: string;
  patientAlternativeTime?: string;
  source?: string;
  requestedDoctorId?: string;
  requestedDoctorName?: string;
  followupPlanId?: string;
  doctorNotificationUnread?: boolean;
  contactEmail?: string;
  discordId?: string;
  contactChannel?: "discord" | "city_phone";
  acceptedAt?: string;
  acceptedById?: string;
  acceptedByName?: string;
  doctorId?: string;
  sourceRequestId?: string;
  syncedScheduleId?: string;
};

function publicRequestPreferred(item: PublicAppointmentRequest) {
  if (!item.preferredDate && !item.preferredTime && !item.preferredPeriod) return "Definição pela equipe médica";
  const date = item.preferredDate ? formatDate(item.preferredDate) : "Data a definir";
  const period = item.preferredTime ? `às ${item.preferredTime}` : (item.preferredPeriod || "Período a definir");
  return item.preferred || `${date} · ${period}`;
}

function buildPublicAnswer(
  status: string,
  doctorName: string,
  details?: { proposedDate?: string; proposedTime?: string; reason?: string },
  flowType?: string,
) {
  if (status === "Aceita" && flowType === "Exames") {
    return `Solicitação de exame recebida por ${doctorName}. Ela seguirá no fluxo de exames e não cria uma consulta automaticamente.`;
  }

  if (status === "Aceita") {
    return `Solicitação aceita por ${doctorName}. O médico responsável entrará em contato pelo ID do Discord informado ou pelo telefone da cidade cadastrado para combinar o dia e o horário.`;
  }

  if (status === "Recusada") {
    return `Solicitação analisada por ${doctorName} e recusada. Procure a equipe do Hospital São Rafael para nova orientação.`;
  }

  if (status === "Reagendamento solicitado") {
    const date = details?.proposedDate ? formatDate(details.proposedDate) : "data a definir";
    const time = details?.proposedTime || "horário a definir";
    return `Reagendamento sugerido por ${doctorName} para ${date} às ${time}.${details?.reason ? ` Motivo: ${details.reason}` : ""}`;
  }

  if (status === "Aguardando ajuste") {
    return `Solicitação analisada por ${doctorName}. A equipe precisa ajustar data, período ou informações antes de confirmar.`;
  }

  return `Solicitação recebida. Aguardando análise da equipe médica responsável.`;
}


const inputClass =
  "min-w-0 w-full rounded-[14px] border border-hpsr-border bg-white px-4 py-3 text-sm font-medium text-hpsr-text outline-none transition placeholder:text-zinc-400 focus:border-hpsr-wineLight focus:bg-white focus:ring-2 focus:ring-hpsr-wineLight/20";

type ScheduledAppointment = { id: string; time: string; date: string; passport: string; patient: string; specialty: string; doctor: string; type: string; status: string; acceptedAt?: string; acceptedById?: string; acceptedByName?: string; acceptedBySelf?: boolean; contactEmail?: string; discordId?: string; cityPhone?: string; reason?: string; notes?: string; createdAt?: string };
const scheduledAppointments: ScheduledAppointment[] = [];

const followUps: Array<{ passport: string; patient: string; program: string; specialty: string; doctor: string; availability: string[]; nextSlot: string }> = [];

const reschedules: Array<{ id: string; patient: string; passport: string; specialty: string; original: string; next: string; reason: string; count: number; feeAlert: boolean }> = [];

const billingIssues: Array<{ id: string; patient: string; passport: string; appointment: string; reason: string; status: string }> = [];

const availableSlots: Array<{ specialty: string; doctor: string; date: string; times: string[]; type: string }> = [];

const tabs: Array<{ id: TabId; label: string; icon: ReactNode }> = [
  { id: "solicitacoes", label: "Solicitações", icon: <CalendarDays size={15} /> },
  { id: "aceitas", label: "Meus aceites", icon: <UserCheck size={15} /> },
  { id: "exames", label: "Exames", icon: <FlaskConical size={15} /> },
  { id: "consultas", label: "Consultas", icon: <Stethoscope size={15} /> },
  { id: "acompanhamentos", label: "Acompanhamentos", icon: <HeartPulse size={15} /> },
  { id: "reagendamentos", label: "Reagendamentos", icon: <RotateCcw size={15} /> },
  { id: "cobrancas", label: "Cobranças", icon: <BadgeDollarSign size={15} /> },
];

function formatDate(value: string) {
  if (!value || !value.includes("-")) return value || "A definir";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function todayInSaoPaulo() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function preferredPeriodToTime(period?: string) {
  switch (period) {
    case "Manhã":
      return "09:00";
    case "Tarde":
      return "14:00";
    case "Noite":
      return "19:00";
    default:
      return "A definir";
  }
}

function consultationStatusClass(status: string) {
  switch (status) {
    case "Confirmada":
    case "Concluída":
    case "Realizada":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Cancelada":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "Ausente":
    case "Não compareceu":
    case "Atrasada":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Adiada":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Reagendada":
      return "border-blue-200 bg-blue-50 text-blue-700";
    default:
      return "border-hpsr-border bg-[#fcf6ee] text-hpsr-wine";
  }
}

const baseVisibleAppointments = scheduledAppointments.filter((item) =>
  doctorCanAccessSpecialty(item.specialty)
);

function mapAppointmentRow(row: any): PublicAppointmentRequest {
  const payload = (row?.payload || {}) as Partial<PublicAppointmentRequest>;
  return {
    ...(payload as PublicAppointmentRequest),
    id: String(row?.id || payload.id || ""),
    passport: String(row?.passport || payload.passport || ""),
    patient: String(row?.patient || payload.patient || "Não informado"),
    status: String(row?.status || payload.status || "Solicitação enviada"),
    createdAt: String(payload.createdAt || row?.created_at || ""),
    updatedAt: String(payload.updatedAt || row?.updated_at || ""),
    specialty: String(payload.specialty || "Clínico Geral"),
  };
}

export default function AppointmentsPage() {
  const { profile: currentUserProfile } = useCurrentUserProfile();
  const [activeTab, setActiveTab] = useState<TabId>("solicitacoes");
  const [searchTerm, setSearchTerm] = useState("");
  const [publicRequests, setPublicRequests] = useState<PublicAppointmentRequest[]>([]);
  const [requestsModalOpen, setRequestsModalOpen] = useState(false);
  const [capacityBySpecialty, setCapacityBySpecialty] = useState<Record<string, number>>({});

  const loadAppointments = useCallback(async () => {
    const client = createClient();
    if (!client) {
      setPublicRequests([]);
      return;
    }

    const { data, error } = await client
      .from("appointments")
      .select("id, passport, patient, status, payload, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(400);

    if (error) {
      console.error("[HPSR][Agendamento] Falha ao carregar solicitações:", error);
      return;
    }

    const mapped = (data || []).map(mapAppointmentRow);
    const passports = Array.from(new Set(mapped.map((item) => item.passport).filter(Boolean)));
    const { data: patientContacts } = passports.length
      ? await client.from("patient_registry").select("passport,city_phone").in("passport", passports)
      : { data: [] as any[] };
    const cityPhoneByPassport = new Map((patientContacts || []).map((item: any) => [String(item.passport || ""), String(item.city_phone || "").trim()]));
    setPublicRequests(mapped.map((item) => ({ ...item, cityPhone: item.cityPhone || cityPhoneByPassport.get(item.passport) || "" })));
  }, []);

  useEffect(() => {
    const client = createClient();
    if (!client || !currentUserProfile.id) return;
    const userSpecialties = (currentUserProfile.specialties || []).map((item) => String(item).trim()).filter(Boolean);
    let active = true;
    void Promise.all(userSpecialties.map(async (specialty) => {
      const { data } = await client.rpc("hpsr_my_clinical_capacity", { p_specialty: specialty });
      return [normalizeSpecialty(specialty), Number((data as { available?: number } | null)?.available || 0)] as const;
    })).then((entries) => { if (active) setCapacityBySpecialty(Object.fromEntries(entries)); });
    return () => { active = false; };
  }, [currentUserProfile.id, currentUserProfile.specialties, publicRequests]);

  useEffect(() => {
    const client = createClient();
    void loadAppointments();
    if (!client) return;

    const channel = client
      .channel("appointment-requests-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        (change: any) => {
          if (change.eventType === "DELETE") {
            const deletedId = String(change.old?.id || "");
            if (deletedId) setPublicRequests((current) => current.filter((item) => item.id !== deletedId));
            return;
          }
          const next = mapAppointmentRow(change.new);
          if (!next.id) return;
          setPublicRequests((current) => {
            const exists = current.some((item) => item.id === next.id);
            return exists ? current.map((item) => item.id === next.id ? next : item) : [next, ...current];
          });
        }
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [loadAppointments]);

  async function updatePublicRequestStatus(
    request: PublicAppointmentRequest,
    status: string,
    details?: { proposedDate?: string; proposedTime?: string; reason?: string }
  ) {
    const client = createClient();
    if ((status === "Aceita" || status === "Recusada") && client) {
      const rpcName = status === "Aceita" ? "hpsr_claim_clinical_request" : "hpsr_decline_clinical_request";
      const { data, error } = await client.rpc(rpcName, { p_request_id: request.id });
      const result = (data || {}) as { ok?: boolean; error?: string; status?: string };
      if (error || !result.ok) {
        await hpsrAlert(result.error || error?.message || "Não foi possível atualizar esta solicitação.", "Solicitação não atualizada");
        await loadAppointments();
        return;
      }
      await loadAppointments();
      if (status === "Aceita") {
        if (["Acompanhamento", "Acompanhamento com especialista"].includes(request.flowType || "")) {
          setActiveTab("acompanhamentos");
        } else {
          setActiveTab("aceitas");
        }
      }
      return;
    }

    const updatedRequest: PublicAppointmentRequest = {
      ...request,
      status,
      doctor: currentUserProfile.systemName,
      answer: buildPublicAnswer(status, currentUserProfile.systemName, details, request.flowType),
      proposedDate: details?.proposedDate || request.proposedDate,
      proposedTime: details?.proposedTime || request.proposedTime,
      rescheduleReason: details?.reason || request.rescheduleReason,
      updatedAt: brazilIso(),
      ...(status === "Aceita" ? {
        acceptedAt: brazilIso(),
        acceptedById: currentUserProfile.id,
        acceptedByName: currentUserProfile.systemName,
      } : {}),
    };

    if (client) {
      const payload = {
        ...request,
        ...updatedRequest,
        physician:
          status === "Aceita" || status === "Reagendamento solicitado"
            ? currentUserProfile.systemName
            : request.doctor || "A definir",
        source: request.source || "patient_portal",
      };
      const { error } = await client
        .from("appointments")
        .update({ status, payload, updated_at: updatedRequest.updatedAt })
        .eq("id", request.id);
      if (error) {
        console.error("[HPSR][Agendamento] Falha ao atualizar solicitação:", error);
        return;
      }

    }

    setPublicRequests((currentRequests) => {
      const exists = currentRequests.some((item) => item.id === request.id);
      return exists
        ? currentRequests.map((item) => (item.id === request.id ? updatedRequest : item))
        : [updatedRequest, ...currentRequests];
    });
  }

  const pendingRequests = useMemo(() => {
    const pendingMarkers = [
      "solicit",
      "acompanhamento aguardando confirmacao",
      "em analise",
      "aguardando ajuste",
      "pendente",
      "nova proposta do paciente",
      "reagendamento recusado",
      "disponibilidade informada",
      "desistencia solicitada",
    ];

    return publicRequests.filter((item) => {
      const normalizedStatus = item.status
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      const declinedBy = Array.isArray((item as any).declinedBy) ? (item as any).declinedBy.map(String) : [];
      if (declinedBy.includes(String(currentUserProfile.id))) return false;
      const isManager = ["Total", "Diretor Técnico / Dev"].includes(currentUserProfile.accessLevel) || ["Diretora", "Vice Diretor", "Vice-Diretor"].includes(currentUserProfile.role);
      const requestedDoctorId = String(item.requestedDoctorId || "");
      const specialtyMatch = (currentUserProfile.specialties || []).some((specialty) => normalizeSpecialty(String(specialty)) === normalizeSpecialty(item.specialty));
      const hasCapacity = Number(capacityBySpecialty[normalizeSpecialty(item.specialty)] || 0) > 0;
      const belongsToDoctor = isManager || (specialtyMatch && hasCapacity && (!requestedDoctorId || requestedDoctorId === currentUserProfile.id));
      return belongsToDoctor && pendingMarkers.some((marker) => normalizedStatus.includes(marker));
    });
  }, [publicRequests, currentUserProfile.accessLevel, currentUserProfile.id, currentUserProfile.role, currentUserProfile.specialties, capacityBySpecialty]);

  const publicAcceptedAppointments = useMemo(() => {
    const scheduledRows = publicRequests.filter((item) =>
      item.flowType !== "Exames" &&
      ["Agendada", "Confirmada", "Reagendamento aceito", "Em atendimento", "Realizada", "Concluída", "Adiada", "Atrasada", "Não compareceu", "Cancelada"].includes(item.status)
    );

    const hasScheduledCounterpart = (accepted: PublicAppointmentRequest) => scheduledRows.some((scheduled) => {
      if (scheduled.id === accepted.id) return false;

      // Vínculos explícitos têm prioridade. Isso cobre os dados novos e os registros
      // históricos reconciliados pela migration de compatibilidade.
      if (String(accepted.syncedScheduleId || "") === scheduled.id) return true;
      if (String(scheduled.sourceRequestId || "") === accepted.id) return true;

      // Fallback apenas para registros legados ainda sem vínculo explícito.
      const samePatient = String(scheduled.passport || "").trim().toLowerCase() === String(accepted.passport || "").trim().toLowerCase();
      const sameSpecialty = normalizeSpecialty(scheduled.specialty) === normalizeSpecialty(accepted.specialty);
      const acceptedDoctorId = String(accepted.doctorId || accepted.acceptedById || "");
      const scheduledDoctorId = String(scheduled.doctorId || scheduled.acceptedById || "");
      const sameDoctor = acceptedDoctorId && scheduledDoctorId
        ? acceptedDoctorId === scheduledDoctorId
        : String(accepted.doctor || "").trim().toLowerCase() === String(scheduled.doctor || "").trim().toLowerCase();
      const scheduledAfterAccepted = !accepted.createdAt || !scheduled.createdAt || new Date(scheduled.createdAt).getTime() >= new Date(accepted.createdAt).getTime();
      return samePatient && sameSpecialty && sameDoctor && scheduledAfterAccepted;
    });

    return publicRequests
      .filter((item) => item.flowType !== "Exames" && ["Aceita", "Reagendamento aceito", "Agendada", "Confirmada", "Em atendimento", "Realizada", "Concluída", "Adiada", "Atrasada", "Não compareceu", "Cancelada"].includes(item.status))
      .filter((item) => item.status !== "Aceita" || !hasScheduledCounterpart(item))
      .map((item) => {
        const wasRescheduled = item.status === "Reagendamento aceito" || Boolean(item.proposedDate || item.proposedTime);
        return {
          id: item.id,
          time: wasRescheduled
            ? item.proposedTime || item.preferredTime || preferredPeriodToTime(item.preferredPeriod)
            : item.preferredTime || preferredPeriodToTime(item.preferredPeriod),
          date: wasRescheduled
            ? item.proposedDate || item.preferredDate || "A definir"
            : item.preferredDate || "A definir",
          passport: item.passport,
          patient: item.patient,
          specialty: item.specialty,
          doctor: item.doctor || currentUserProfile.systemName,
          type: item.flowType || "Consulta comum",
          status: item.status === "Reagendamento aceito" ? "Confirmada" : item.status,
          acceptedAt: item.acceptedAt,
          acceptedById: item.acceptedById,
          acceptedByName: item.acceptedByName,
          acceptedBySelf: Boolean(item.acceptedById && item.acceptedById === currentUserProfile.id),
          discordId: item.discordId || item.discord,
          cityPhone: item.cityPhone,
          reason: item.reason,
          notes: item.notes,
          createdAt: item.createdAt,
        };
      });
  }, [publicRequests]);

  const visibleAppointments = useMemo(
    () => [...publicAcceptedAppointments, ...scheduledAppointments],
    [publicAcceptedAppointments]
  );

  const myAcceptedRequests = useMemo(() => {
    const doctorId = String(currentUserProfile.id || "");
    const doctorName = String(currentUserProfile.systemName || "").trim().toLowerCase();

    return publicRequests
      .filter((item) => {
        if (String(item.source || "patient_portal") !== "patient_portal") return false;
        const acceptedById = String(item.acceptedById || item.doctorId || "");
        const acceptedByName = String(item.acceptedByName || item.doctor || "").trim().toLowerCase();
        const belongsToCurrentDoctor = acceptedById
          ? acceptedById === doctorId
          : Boolean(doctorName && acceptedByName === doctorName && (item.acceptedAt || item.status === "Aceita"));
        if (!belongsToCurrentDoctor) return false;
        return Boolean(item.acceptedAt) || ["Aceita", "Agendada", "Confirmada", "Reagendamento aceito", "Em atendimento", "Realizada", "Concluída", "Adiada", "Atrasada", "Não compareceu", "Cancelada"].includes(item.status);
      })
      .sort((a, b) => String(b.acceptedAt || b.updatedAt || b.createdAt || "").localeCompare(String(a.acceptedAt || a.updatedAt || a.createdAt || "")));
  }, [publicRequests, currentUserProfile.id, currentUserProfile.systemName]);

  const filteredAcceptedRequests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return myAcceptedRequests;
    return myAcceptedRequests.filter((item) => {
      const contact = `${item.discordId || item.discord || ""} ${item.cityPhone || ""}`.toLowerCase();
      return item.patient.toLowerCase().includes(normalizedSearch)
        || item.passport.toLowerCase().includes(normalizedSearch)
        || item.specialty.toLowerCase().includes(normalizedSearch)
        || (item.flowType || "Consulta comum").toLowerCase().includes(normalizedSearch)
        || contact.includes(normalizedSearch);
    });
  }, [myAcceptedRequests, searchTerm]);

  const acceptedForContactCount = useMemo(() =>
    myAcceptedRequests.filter((item) => item.status === "Aceita" && !item.syncedScheduleId).length,
    [myAcceptedRequests]
  );

  const filteredRequests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return pendingRequests.filter((item) => {
      if (item.flowType === "Exames") return false;
      if (!normalizedSearch) return true;
      return (
        item.patient.toLowerCase().includes(normalizedSearch) ||
        item.passport.includes(normalizedSearch) ||
        item.specialty.toLowerCase().includes(normalizedSearch) ||
        (item.flowType || "Consulta comum").toLowerCase().includes(normalizedSearch) ||
        (item.flowDetails || "").toLowerCase().includes(normalizedSearch)
      );
    });
  }, [pendingRequests, searchTerm]);

  const filteredExamRequests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return publicRequests.filter((item) => {
      if (item.flowType !== "Exames") return false;
      const isManager = ["Total", "Diretor Técnico / Dev"].includes(currentUserProfile.accessLevel) || ["Diretora", "Vice Diretor", "Vice-Diretor"].includes(currentUserProfile.role);
      const pending = ["Solicitação enviada", "Aguardando análise"].includes(item.status);
      const acceptedBySelf = item.acceptedById === currentUserProfile.id || (item as any).doctorId === currentUserProfile.id;
      const specialtyMatch = (currentUserProfile.specialties || []).some((specialty) => normalizeSpecialty(String(specialty)) === normalizeSpecialty(item.specialty));
      const declinedBy = Array.isArray((item as any).declinedBy) ? (item as any).declinedBy.map(String) : [];
      const eligiblePending = pending && specialtyMatch && Number(capacityBySpecialty[normalizeSpecialty(item.specialty)] || 0) > 0 && !declinedBy.includes(String(currentUserProfile.id));
      if (!isManager && !acceptedBySelf && !eligiblePending) return false;
      if (!normalizedSearch) return true;
      return item.patient.toLowerCase().includes(normalizedSearch) || item.passport.includes(normalizedSearch) || item.specialty.toLowerCase().includes(normalizedSearch) || (item.reason || "").toLowerCase().includes(normalizedSearch);
    });
  }, [publicRequests, searchTerm, currentUserProfile.accessLevel, currentUserProfile.id, currentUserProfile.role, currentUserProfile.specialties, capacityBySpecialty]);

  const loggedDoctorConsultationsToday = visibleAppointments.filter(
    (item) => item.date === brazilDate() && item.doctor === currentUserProfile.systemName
  );
  const pendingScheduleChanges = reschedules.filter((item) => item.next === "A definir" || item.feeAlert);
  const monthlyDoctorConsultations = visibleAppointments.filter(
    (item) => item.date.startsWith(brazilMonth()) && item.doctor === currentUserProfile.systemName
  );

  return (
    <div className="hpsr-page gap-2 xl:h-[calc(100dvh-2.4rem)] xl:min-h-0 xl:overflow-hidden">
      <PageHeader
        eyebrow="Agendamentos"
        title="Central de agendamentos"
        description="Painel geral para solicitações, consultas, acompanhamentos, reagendamentos e pendências de cobrança."
      />

      <section className="shrink-0 overflow-hidden rounded-[20px] border border-[#e6d2cd] bg-[linear-gradient(135deg,#fffaf7_0%,#fff4ee_100%)] shadow-sm">
        <div className="grid gap-px bg-[#eadbd6] md:grid-cols-2 xl:grid-cols-4">
          <IndicatorCard
            icon={<CalendarCheck2 size={17} />}
            label="Consultas de hoje"
            value={String(loggedDoctorConsultationsToday.length)}
            description="Do médico logado"
          />
          <IndicatorCard
            icon={<CalendarDays size={17} />}
            label="Solicitações"
            value={String(pendingRequests.length)}
            description="Aguardando análise"
          />
          <IndicatorCard
            icon={<RotateCcw size={17} />}
            label="Reagendamentos/cancelamentos"
            value={String(pendingScheduleChanges.length)}
            description="Pedidos pendentes"
          />
          <IndicatorCard
            icon={<FileClock size={17} />}
            label="Consultas no mês"
            value={String(monthlyDoctorConsultations.length)}
            description="Total do médico logado"
          />
        </div>
      </section>

      <section className="shrink-0 rounded-[20px] border border-hpsr-border bg-white p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Acessos rápidos</p>
            <p className="mt-0.5 text-sm font-semibold text-hpsr-muted">Escolha a área que deseja gerenciar.</p>
          </div>
          <div className="hidden h-9 w-9 items-center justify-center rounded-[12px] bg-[#f7e9e3] text-hpsr-wine sm:flex">
            <CalendarClock size={18} />
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          <ScheduleCard
            icon={Stethoscope}
            title="Agenda do Médico"
            description="Calendário, consultas e gestão médica."
            href="/dashboard/agendamento/clinica"
            count={visibleAppointments.length}
          />


          <button
            type="button"
            onClick={() => { setActiveTab("aceitas"); setRequestsModalOpen(true); }}
            className="group rounded-[17px] border border-hpsr-border bg-[#fffdfb] p-3.5 text-left transition hover:border-hpsr-wineLight/50 hover:bg-[#fff8f3]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#f7e9e3] text-hpsr-wine shadow-sm">
                <UserCheck size={19} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate text-sm font-black text-hpsr-text">Aceitos para contato</h3>
                  <span className="rounded-full bg-hpsr-wine px-2.5 py-1 text-[10px] font-black text-white">{acceptedForContactCount}</span>
                </div>
                <p className="mt-1 text-xs font-semibold text-hpsr-muted">Passaporte e contato de quem você assumiu.</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setRequestsModalOpen(true)}
            className="group rounded-[17px] border border-hpsr-border bg-[#fffdfb] p-3.5 text-left transition hover:border-hpsr-wineLight/50 hover:bg-[#fff8f3]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-hpsr-wine text-white shadow-sm">
                <CalendarDays size={19} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate text-sm font-black text-hpsr-text">Solicitações de Consulta</h3>
                  <span className="rounded-full bg-[#f6e7e1] px-2.5 py-1 text-[10px] font-black text-hpsr-wine">{pendingRequests.length}</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-hpsr-muted">Pedidos enviados pelo Portal do Paciente.</p>
              </div>
            </div>
          </button>
        </div>
      </section>

      <ConsultationOverview appointments={visibleAppointments} />

      {requestsModalOpen && (
        <RequestsCenterModal
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filteredRequests={filteredRequests}
          filteredExamRequests={filteredExamRequests}
          myAcceptedRequests={filteredAcceptedRequests}
          visibleAppointments={visibleAppointments}
          onUpdateStatus={updatePublicRequestStatus}
          onClose={() => setRequestsModalOpen(false)}
        />
      )}
    </div>
  );
}

function ConsultationOverview({ appointments }: { appointments: typeof scheduledAppointments }) {
  const [recentOnly, setRecentOnly] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<ScheduledAppointment | null>(null);
  const [relatedRecords, setRelatedRecords] = useState<Array<{ id: string; type: string; title: string; released: boolean }>>([]);
  const [selectedPatientContact, setSelectedPatientContact] = useState<{ cityPhone: string }>({ cityPhone: "" });
  const [copiedDetail, setCopiedDetail] = useState("");

  const loadAppointmentDetails = useCallback(async (appointment: ScheduledAppointment | null) => {
    setRelatedRecords([]);
    setSelectedPatientContact({ cityPhone: "" });
    if (!appointment) return;
    const client = createClient();
    if (!client) return;

    const [recordsResult, patientResult] = await Promise.all([
      client.from("clinical_records")
        .select("id,record_type,is_confidential,released_at,payload")
        .eq("patient_passport", appointment.passport)
        .eq("payload->>appointmentId", appointment.id)
        .order("created_at", { ascending: true })
        .limit(50),
      client.from("patient_registry")
        .select("city_phone")
        .eq("passport", appointment.passport)
        .maybeSingle(),
    ]);

    setRelatedRecords((recordsResult.data || []).map((row: any) => {
      const payload = (row.payload || {}) as Record<string, unknown>;
      return {
        id: String(row.id),
        type: String(row.record_type || "Registro"),
        title: String(payload.examName || payload.documentTitle || payload.title || row.record_type || "Registro clínico"),
        released: !row.is_confidential && Boolean(row.released_at),
      };
    }));

    setSelectedPatientContact({
      cityPhone: String(patientResult.data?.city_phone || appointment.cityPhone || ""),
    });
  }, []);

  async function copyDetail(value: string, key: string) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedDetail(key);
      window.setTimeout(() => setCopiedDetail((current) => current === key ? "" : current), 1600);
    } catch {
      await hpsrAlert("Não foi possível copiar automaticamente. Selecione o valor exibido.", "Cópia indisponível");
    }
  }

  useEffect(() => { void loadAppointmentDetails(selectedAppointment); }, [selectedAppointment, loadAppointmentDetails]);

  const recentCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentlyAcceptedCount = appointments.filter((item) => item.acceptedAt && new Date(item.acceptedAt).getTime() >= recentCutoff).length;
  const filteredAppointments = recentOnly
    ? appointments.filter((item) => item.acceptedAt && new Date(item.acceptedAt).getTime() >= recentCutoff)
    : appointments;
  const sortedAppointments = [...filteredAppointments].sort((first, second) => {
    const timestamp = (item: ScheduledAppointment) => {
      const preferred = item.acceptedAt || item.createdAt;
      if (preferred) {
        const parsed = new Date(preferred).getTime();
        if (Number.isFinite(parsed)) return parsed;
      }
      if (item.date && item.date !== "A definir") {
        const parsed = new Date(`${item.date}T${item.time && item.time !== "A definir" ? item.time : "00:00"}:00-03:00`).getTime();
        if (Number.isFinite(parsed)) return parsed;
      }
      return 0;
    };
    return timestamp(second) - timestamp(first);
  });
  const selectedPhone = selectedPatientContact.cityPhone || selectedAppointment?.cityPhone || "";

  return (
    <>
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[20px] border border-hpsr-border bg-white shadow-sm">
        <div className="flex shrink-0 flex-col gap-3 border-b border-hpsr-border bg-[linear-gradient(135deg,#fffaf7_0%,#f7e9e2_100%)] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-hpsr-wineLight">Visão geral</p>
            <h2 className="mt-0.5 text-lg font-black text-hpsr-text">Agendamento geral</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-hpsr-muted">Solicitações aceitas ficam aguardando o agendamento manual. Quando a consulta for marcada na Agenda do Médico, esta visão é sincronizada com a data e o horário reais.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setRecentOnly(false)} className={`rounded-[12px] border px-3 py-2 text-xs font-black transition ${!recentOnly ? "border-hpsr-wine bg-hpsr-wine text-white" : "border-hpsr-border bg-white text-hpsr-wine"}`}>Todos</button>
            <button type="button" onClick={() => setRecentOnly(true)} className={`rounded-[12px] border px-3 py-2 text-xs font-black transition ${recentOnly ? "border-hpsr-wine bg-hpsr-wine text-white" : "border-hpsr-border bg-white text-hpsr-wine"}`}>Aceitos recentemente · {recentlyAcceptedCount}</button>
            <span className="rounded-[13px] border border-[#dcc1ba] bg-white px-3 py-2 text-xs font-black text-hpsr-wine shadow-sm">{sortedAppointments.length} pacientes</span>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 content-start gap-3.5 overflow-y-auto overscroll-contain p-4 pr-3 [scrollbar-gutter:stable]">
          {sortedAppointments.length ? sortedAppointments.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => setSelectedAppointment(item)}
              className={`group relative grid min-h-[118px] w-full gap-5 overflow-hidden rounded-[20px] border bg-white p-5 text-left shadow-[0_6px_22px_rgba(89,44,30,0.05)] transition duration-200 hover:border-hpsr-wineLight/60 hover:bg-[#fffdfb] hover:shadow-[0_12px_32px_rgba(89,44,30,0.09)] lg:grid-cols-[minmax(0,1.35fr)_minmax(210px,0.8fr)_minmax(180px,0.6fr)_180px] lg:items-center ${item.status === "Aceita" ? "border-amber-200/90" : "border-hpsr-border"}`}
            >
              <span className={`absolute inset-y-0 left-0 w-1.5 ${item.status === "Aceita" ? "bg-amber-400" : item.status === "Agendada" || item.status === "Confirmada" ? "bg-emerald-500" : "bg-hpsr-wine/60"}`} />

              <div className="pl-2">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Paciente</p>
                <h3 className="mt-1.5 text-[17px] font-black leading-tight text-hpsr-text">{item.patient}</h3>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span className="rounded-[10px] border border-hpsr-border bg-[#fffaf7] px-2.5 py-1 text-[11px] font-black text-hpsr-muted">Passaporte {item.passport}</span>
                  <span className="rounded-[10px] bg-[#f7eee9] px-2.5 py-1 text-[11px] font-black text-hpsr-wine">{item.specialty}</span>
                </div>
              </div>

              <div className="lg:border-l lg:border-hpsr-border/70 lg:pl-5">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Médico responsável</p>
                <p className="mt-1.5 text-[15px] font-black text-hpsr-text">{item.doctor}</p>
                <p className="mt-1 text-xs font-semibold text-hpsr-muted">{item.type}</p>
              </div>

              <div className="lg:border-l lg:border-hpsr-border/70 lg:pl-5">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Data e hora</p>
                <p className="mt-1.5 text-[15px] font-black text-hpsr-text">{item.status === "Aceita" ? "Aguardando agendamento" : (item.date && item.date !== "A definir" ? formatDate(item.date) : "A definir")}</p>
                <p className="mt-1 text-xs font-semibold text-hpsr-muted">{item.status === "Aceita" ? "Definição manual" : (item.time && item.time !== "A definir" ? item.time : "Horário a definir")}</p>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-hpsr-border/70 pt-4 lg:grid lg:justify-items-end lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                <span className={`rounded-full border px-3.5 py-1.5 text-xs font-black ${consultationStatusClass(item.status)}`}>{item.status}</span>
                <span className="inline-flex items-center gap-1.5 rounded-[11px] border border-hpsr-wine/15 bg-[#fff8f4] px-3 py-2 text-[11px] font-black text-hpsr-wine transition group-hover:border-hpsr-wine/30 group-hover:bg-hpsr-wine group-hover:text-white">Ver detalhes <ChevronRight size={14}/></span>
              </div>
            </button>
          )) : <EmptyState title={recentOnly ? "Nenhum aceite recente" : "Nenhum paciente no agendamento geral"} description={recentOnly ? "Não há solicitações aceitas nos últimos 7 dias." : "As solicitações aceitas aparecerão aqui para continuidade do contato e agendamento."} />}
        </div>
      </section>

      {selectedAppointment && (
        <div className="fixed inset-0 z-[100000] grid place-items-center px-4 py-6">
          <button type="button" aria-label="Fechar detalhes" onClick={() => setSelectedAppointment(null)} className="fixed inset-0 bg-[#1f0805]/65" />
          <section className="hpsr-modal-motion relative z-10 w-full max-w-xl overflow-hidden rounded-[20px] border border-hpsr-border bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-hpsr-border bg-[linear-gradient(135deg,#fffaf4_0%,#f5e7d8_100%)] p-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.16em] text-hpsr-wineLight">Check-up do agendamento</p>
                <h3 className="mt-1 text-xl font-black text-hpsr-text">{selectedAppointment.patient}</h3>
                <p className="mt-1 text-sm font-semibold text-hpsr-muted">Passaporte {selectedAppointment.passport} · {selectedAppointment.specialty}</p>
              </div>
              <button type="button" onClick={() => setSelectedAppointment(null)} className="rounded-[12px] border border-hpsr-border bg-white p-2.5 text-hpsr-wine"><X size={18}/></button>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              <div className="sm:col-span-2 grid gap-2 sm:grid-cols-2">
                <div className="rounded-[16px] border border-[#dfc5bb] bg-[linear-gradient(135deg,#fff8f3_0%,#fffdfb_100%)] p-3.5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[.15em] text-hpsr-wineLight">Passaporte</p>
                      <p className="mt-1 text-lg font-black text-hpsr-text">{selectedAppointment.passport}</p>
                    </div>
                    <button type="button" onClick={() => void copyDetail(selectedAppointment.passport, "passport")} className="inline-flex items-center gap-1.5 rounded-[11px] bg-hpsr-wine px-2.5 py-2 text-[10px] font-black text-white shadow-sm transition hover:bg-[#7b2f1a]">
                      <Copy size={13}/>{copiedDetail === "passport" ? "Copiado" : "Copiar"}
                    </button>
                  </div>
                </div>
                <div className="rounded-[16px] border border-[#dfc5bb] bg-[linear-gradient(135deg,#fff8f3_0%,#fffdfb_100%)] p-3.5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-[.15em] text-hpsr-wineLight">Telefone</p>
                      <p className={`mt-1 break-all text-lg font-black ${selectedPhone ? "text-hpsr-text" : "text-amber-800"}`}>{selectedPhone || "Não informado"}</p>
                    </div>
                    {selectedPhone && <button type="button" onClick={() => void copyDetail(selectedPhone, "phone")} className="inline-flex shrink-0 items-center gap-1.5 rounded-[11px] bg-hpsr-wine px-2.5 py-2 text-[10px] font-black text-white shadow-sm transition hover:bg-[#7b2f1a]">
                      <Phone size={13}/>{copiedDetail === "phone" ? "Copiado" : "Copiar"}
                    </button>}
                  </div>
                </div>
              </div>
              <DetailCard label="Médico responsável" value={selectedAppointment.doctor || "A definir"} />
              <DetailCard label="Situação" value={selectedAppointment.status} />
              <DetailCard label="Data" value={selectedAppointment.status === "Aceita" ? "Aguardando agendamento manual" : (selectedAppointment.date && selectedAppointment.date !== "A definir" ? formatDate(selectedAppointment.date) : "A definir")} />
              <DetailCard label="Horário" value={selectedAppointment.status === "Aceita" ? "Será definido manualmente" : (selectedAppointment.time && selectedAppointment.time !== "A definir" ? selectedAppointment.time : "A definir")} />
              <DetailCard label="Aceita em" value={selectedAppointment.acceptedAt ? new Date(selectedAppointment.acceptedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "Registro anterior sem informação"} />
              <DetailCard label="Aceita por" value={selectedAppointment.acceptedBySelf ? `Você (${selectedAppointment.acceptedByName || "usuário atual"})` : (selectedAppointment.acceptedByName || "Registro anterior sem informação")} />
              <div className="sm:col-span-2 rounded-[15px] border border-hpsr-border bg-[#fffaf5] p-3">
                <p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Outros contatos</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedAppointment.discordId && <button type="button" onClick={() => void copyDetail(selectedAppointment.discordId || "", "discord")} className="inline-flex items-center gap-2 rounded-[11px] border border-hpsr-border bg-white px-3 py-2 text-xs font-black text-hpsr-text transition hover:border-hpsr-wineLight/50"><Hash size={14} className="text-hpsr-wine"/>Discord ID {selectedAppointment.discordId}<Copy size={12} className="text-hpsr-muted"/></button>}
                  {!selectedAppointment.discordId && !selectedPhone && <p className="text-sm font-bold text-amber-800">Nenhum telefone da cidade ou ID do Discord registrado para este paciente.</p>}
                </div>
              </div>
              {selectedAppointment.reason && <DetailCard wide label="Motivo da solicitação" value={selectedAppointment.reason} />}
              {selectedAppointment.notes && <DetailCard wide label="Observações" value={selectedAppointment.notes} />}
              <div className="sm:col-span-2 rounded-[15px] border border-hpsr-border bg-[#fffaf5] p-3">
                <p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Resumo da consulta</p>
                {relatedRecords.length ? <div className="mt-2 grid gap-2">{relatedRecords.map((record) => <div key={record.id} className="flex items-center justify-between gap-3 rounded-[12px] border border-hpsr-border bg-white px-3 py-2"><div className="min-w-0"><p className="truncate text-xs font-black text-hpsr-text">{record.title}</p><p className="text-[10px] font-semibold text-hpsr-muted">{record.type}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-black ${record.released ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{record.released ? "Liberado" : "Interno"}</span></div>)}</div> : <p className="mt-2 text-xs font-semibold text-hpsr-muted">Nenhum exame ou documento foi vinculado a esta consulta ainda.</p>}
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function DetailCard({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return <div className={`rounded-[14px] border border-hpsr-border bg-white p-3 ${wide ? "sm:col-span-2" : ""}`}><p className="text-[10px] font-black uppercase tracking-[.13em] text-hpsr-wineLight">{label}</p><p className="mt-1 break-words text-sm font-bold text-hpsr-text">{value || "—"}</p></div>;
}

function RequestsCenterModal({
  activeTab,
  setActiveTab,
  searchTerm,
  setSearchTerm,
  filteredRequests,
  filteredExamRequests,
  myAcceptedRequests,
  visibleAppointments,
  onUpdateStatus,
  onClose,
}: {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filteredRequests: PublicAppointmentRequest[];
  filteredExamRequests: PublicAppointmentRequest[];
  myAcceptedRequests: PublicAppointmentRequest[];
  visibleAppointments: typeof scheduledAppointments;
  onUpdateStatus: (
    request: PublicAppointmentRequest,
    status: string,
    details?: { proposedDate?: string; proposedTime?: string; reason?: string }
  ) => void;
  onClose: () => void;
}) {
  const { profile: currentUserProfile } = useCurrentUserProfile();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, []);

  const modalSummary = [
    { label: "Novas solicitações", value: filteredRequests.length, icon: <CalendarDays size={16} /> },
    { label: "Meus aceites", value: myAcceptedRequests.length, icon: <UserCheck size={16} /> },
    { label: "Exames pendentes", value: filteredExamRequests.length, icon: <FlaskConical size={16} /> },
  ];

  return (
    <div className="fixed inset-0 z-[99999] grid min-h-dvh place-items-center overflow-hidden px-3 py-3 sm:px-5 sm:py-5">
      <button
        type="button"
        aria-label="Fechar solicitações"
        onClick={onClose}
        className="fixed inset-0 bg-[#1f0805]/70 backdrop-blur-[2px]"
      />

      <section className="hpsr-modal-motion relative z-10 flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[22px] border border-[#eadfd8] bg-white shadow-[0_22px_60px_rgba(42,14,7,0.22)]">
        <header className="shrink-0 border-b border-hpsr-border bg-[#fffaf7] px-4 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-hpsr-wineLight">
                <Stethoscope size={15} />
                <span className="text-[10px] font-black uppercase tracking-[0.14em]">Central clínica</span>
                <span className="text-[10px] font-bold text-hpsr-muted">• por fluxo e especialidade</span>
              </div>
              <h2 className="mt-1.5 text-xl font-black tracking-tight text-hpsr-text sm:text-2xl">Solicitações e atendimentos</h2>
              <p className="mt-1 max-w-3xl text-xs font-semibold leading-relaxed text-hpsr-muted sm:text-sm">
                Solicitações, aceites e exames organizados sem alterar o fluxo de agendamento manual.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-[12px] border border-hpsr-border bg-white text-hpsr-wine transition hover:bg-[#fff5ef]"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            {modalSummary.map((item) => (
              <div key={item.label} className="inline-flex items-center gap-2 text-xs font-bold text-hpsr-muted">
                <span className="text-hpsr-wine">{item.icon}</span>
                <span className="font-black text-hpsr-text">{item.value}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-hpsr-border bg-white px-4 py-3 sm:px-6">
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-center">
              <nav className="flex gap-1 overflow-x-auto" aria-label="Áreas da central de solicitações">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-[10px] px-3 py-2 text-xs font-black transition ${
                      activeTab === tab.id
                        ? "bg-hpsr-wine text-white"
                        : "text-hpsr-wine hover:bg-[#fff5ef]"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </nav>

              <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-hpsr-wineLight" />
                <input
                  className={`${inputClass} h-[42px] rounded-[12px] border-[#e5d5ca] bg-white pl-11 pr-4`}
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar paciente, passaporte ou especialidade"
                />
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-white p-4 sm:p-5">
            {activeTab === "solicitacoes" && <RequestsTab requests={filteredRequests} onUpdateStatus={onUpdateStatus} />}
            {activeTab === "aceitas" && <MyAcceptedRequestsTab requests={myAcceptedRequests} />}
            {activeTab === "exames" && <ExamRequestsTab requests={filteredExamRequests} onUpdateStatus={onUpdateStatus} />}
            {activeTab === "consultas" && <ConsultationsTab appointments={visibleAppointments} />}
            {activeTab === "acompanhamentos" && <FollowUpsTab doctorId={currentUserProfile.id} doctorName={currentUserProfile.systemName} defaultSpecialty={currentUserProfile.specialty || "Clínico Geral"} />}
            {activeTab === "reagendamentos" && <ReschedulesTab />}
            {activeTab === "cobrancas" && <BillingTab />}
          </div>
        </div>
      </section>
    </div>
  );
}


function MyAcceptedRequestsTab({ requests }: { requests: PublicAppointmentRequest[] }) {
  const [copied, setCopied] = useState("");
  const scheduledStatuses = new Set(["Agendada", "Confirmada", "Reagendamento aceito", "Em atendimento", "Realizada", "Concluída", "Adiada", "Atrasada", "Não compareceu", "Cancelada"]);

  async function copyValue(value: string, key: string) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied((current) => current === key ? "" : current), 1600);
    } catch {
      await hpsrAlert("Não foi possível copiar automaticamente. Selecione o valor exibido no card.", "Cópia indisponível");
    }
  }

  const forContact = requests.filter((item) => item.status === "Aceita" && !item.syncedScheduleId);
  const forwarded = requests.filter((item) => item.status !== "Aceita" || Boolean(item.syncedScheduleId));

  const groupBySpecialty = (items: PublicAppointmentRequest[]) => {
    const groups = new Map<string, PublicAppointmentRequest[]>();
    [...items]
      .sort((a, b) => a.specialty.localeCompare(b.specialty, "pt-BR") || String(b.acceptedAt || b.updatedAt || b.createdAt || "").localeCompare(String(a.acceptedAt || a.updatedAt || a.createdAt || "")))
      .forEach((item) => {
        const specialty = item.specialty || "Clínico Geral";
        groups.set(specialty, [...(groups.get(specialty) || []), item]);
      });
    return Array.from(groups.entries());
  };

  const renderRequest = (item: PublicAppointmentRequest) => {
    const contact = item.discordId || item.discord || item.cityPhone || "";
    const contactLabel = (item.discordId || item.discord) ? `Discord ID ${item.discordId || item.discord}` : item.cityPhone ? `Telefone ${item.cityPhone}` : "Não informado";
    const isExam = item.flowType === "Exames";
    const alreadyScheduled = Boolean(item.syncedScheduleId) || scheduledStatuses.has(item.status);
    const acceptedDate = item.acceptedAt || item.updatedAt || item.createdAt || "";

    return (
      <div key={item.id} className="rounded-[18px] border border-hpsr-border border-l-4 border-l-hpsr-wine bg-white p-4 shadow-[0_6px_18px_rgba(89,44,30,0.06)] transition hover:-translate-y-px hover:shadow-[0_9px_24px_rgba(89,44,30,0.09)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-black text-hpsr-text">{item.patient}</h3>
              <StatusBadge status={alreadyScheduled ? item.status : "Aceita"} />
              <span className="rounded-full border border-hpsr-border bg-[#fffaf5] px-2.5 py-1 text-[9px] font-black uppercase tracking-[.1em] text-hpsr-wine">{item.specialty}</span>
              <span className="rounded-full border border-hpsr-border bg-white px-2.5 py-1 text-[9px] font-black text-hpsr-muted">{isExam ? "Exame" : (item.flowType || "Consulta comum")}</span>
            </div>
            <p className="mt-2 text-xs font-semibold text-hpsr-muted">
              {alreadyScheduled ? "Solicitação já encaminhada após o aceite." : isExam ? "Solicitação de exame recebida. Use os dados abaixo para contato." : "Aceita e aguardando contato/agendamento manual."}
            </p>
          </div>
          {acceptedDate && <span className="shrink-0 text-[10px] font-bold text-hpsr-muted">Aceita em {new Date(acceptedDate).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</span>}
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[13px] border border-hpsr-border bg-[#fffaf5] p-3">
            <p className="text-[9px] font-black uppercase tracking-[.13em] text-hpsr-wineLight">Passaporte</p>
            <p className="mt-1 text-sm font-black text-hpsr-text">{item.passport}</p>
          </div>
          <div className="rounded-[13px] border border-hpsr-border bg-[#fffaf5] p-3 sm:col-span-1 lg:col-span-2">
            <p className="text-[9px] font-black uppercase tracking-[.13em] text-hpsr-wineLight">Contato</p>
            <p className="mt-1 break-all text-sm font-black text-hpsr-text">{contactLabel}</p>
          </div>
          <div className="rounded-[13px] border border-hpsr-border bg-[#fffaf5] p-3">
            <p className="text-[9px] font-black uppercase tracking-[.13em] text-hpsr-wineLight">Situação</p>
            <p className="mt-1 text-sm font-black text-hpsr-text">{alreadyScheduled ? (item.status === "Aceita" ? "Agendamento vinculado" : item.status) : "Para contato"}</p>
          </div>
        </div>

        {(item.reason || item.flowDetails) && <p className="mt-3 rounded-[13px] border border-hpsr-border bg-white px-3 py-2 text-xs font-semibold text-hpsr-muted"><span className="font-black text-hpsr-text">Objetivo:</span> {item.flowDetails || item.reason}</p>}

        <div className="mt-3 flex flex-wrap gap-2">
          <ActionButton variant="primary" onClick={() => void copyValue(item.passport, `passport-${item.id}`)}>{copied === `passport-${item.id}` ? "Passaporte copiado" : "Copiar passaporte"}</ActionButton>
          {contact && <ActionButton onClick={() => void copyValue(contact, `contact-${item.id}`)}>{copied === `contact-${item.id}` ? "Contato copiado" : "Copiar contato"}</ActionButton>}
          {!contact && <span className="rounded-[12px] border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black text-amber-800">Contato não informado</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="grid gap-5">
      <SectionTitle icon={<UserCheck size={18} />} title="Meus aceites" description="Fila pessoal do médico. Aceitar apenas assume a solicitação; o agendamento continua sendo feito manualmente." />

      <section className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-hpsr-text">Para contato</h3>
            <p className="mt-0.5 text-xs font-semibold text-hpsr-muted">Solicitações que você assumiu e que ainda precisam de continuidade.</p>
          </div>
          <span className="rounded-full bg-hpsr-wine px-3 py-1.5 text-xs font-black text-white">{forContact.length}</span>
        </div>
        {forContact.length ? <div className="grid gap-4">{groupBySpecialty(forContact).map(([specialty, items]) => (
          <div key={`contact-${specialty}`} className="overflow-hidden rounded-[20px] border border-hpsr-border bg-[#fffdfb] shadow-[0_5px_18px_rgba(89,44,30,0.05)]">
            <div className="flex items-center justify-between gap-3 border-b border-hpsr-border bg-[linear-gradient(135deg,#f9ece6_0%,#fff9f4_100%)] px-5 py-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.16em] text-hpsr-wineLight">Especialidade</p>
                <h4 className="mt-0.5 text-sm font-black text-hpsr-text">{specialty}</h4>
              </div>
              <span className="rounded-full bg-hpsr-wine px-2.5 py-1 text-[10px] font-black text-white">{items.length}</span>
            </div>
            <div className="grid gap-3 p-3">{items.map(renderRequest)}</div>
          </div>
        ))}</div> : <EmptyState title="Nenhum aceite aguardando contato" description="Quando você aceitar uma nova solicitação, os dados dela aparecerão aqui imediatamente." />}
      </section>

      <section className="grid gap-3 border-t border-hpsr-border pt-4">
        <div>
          <h3 className="text-sm font-black text-hpsr-text">Histórico de aceites</h3>
          <p className="mt-0.5 text-xs font-semibold text-hpsr-muted">Solicitações que você aceitou e que já foram encaminhadas, agendadas ou finalizadas, mantendo a organização por especialidade.</p>
        </div>
        {forwarded.length ? <div className="grid gap-4">{groupBySpecialty(forwarded).map(([specialty, items]) => (
          <div key={`history-${specialty}`} className="overflow-hidden rounded-[20px] border border-hpsr-border bg-[#fffdfb] shadow-[0_5px_18px_rgba(89,44,30,0.05)]">
            <div className="flex items-center justify-between gap-3 border-b border-hpsr-border bg-[linear-gradient(135deg,#fff7f1_0%,#fffdf9_100%)] px-5 py-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.16em] text-hpsr-wineLight">Especialidade</p>
                <h4 className="mt-0.5 text-sm font-black text-hpsr-text">{specialty}</h4>
              </div>
              <span className="rounded-full border border-hpsr-border bg-white px-2.5 py-1 text-[10px] font-black text-hpsr-wine">{items.length}</span>
            </div>
            <div className="grid gap-3 p-3">{items.map(renderRequest)}</div>
          </div>
        ))}</div> : <p className="text-xs font-semibold text-hpsr-muted">Nenhum aceite anterior sincronizado.</p>}
      </section>
    </div>
  );
}

function ExamRequestsTab({ requests, onUpdateStatus }: { requests: PublicAppointmentRequest[]; onUpdateStatus: (request: PublicAppointmentRequest, status: string) => void }) {
  const actionable = new Set(["Solicitação enviada", "Aguardando análise"]);
  const orderedRequests = [...requests].sort((a, b) => a.specialty.localeCompare(b.specialty, "pt-BR") || String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  return (
    <div className="grid gap-3">
      <SectionTitle icon={<FlaskConical size={18} />} title="Solicitações de exame" description="Pedidos de exame ficam separados das consultas e nunca entram automaticamente no Agendamento Geral." />
      {orderedRequests.length ? <div className="max-h-[540px] overflow-y-auto pr-2"><div className="grid gap-3">{orderedRequests.map((item, index) => <div key={item.id}>{(index === 0 || orderedRequests[index - 1].specialty !== item.specialty) && <div className="mb-2 mt-1 flex items-center gap-2"><span className="text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">{item.specialty}</span><span className="h-px flex-1 bg-hpsr-border"/></div>}<AppointmentCard
        
        title={item.patient}
        subtitle={`Passaporte ${item.passport} · ${item.specialty}`}
        status={<StatusBadge status={item.status} />}
        meta={[["Fluxo", "Exame"], ["Necessidade", item.reason || "Não informada"], ["Contato", item.discordId ? `Discord ID ${item.discordId}` : item.cityPhone ? `Telefone ${item.cityPhone}` : "Não informado"]]}
        alert={item.answer || undefined}
        alertTone={item.status === "Recusada" ? "warning" : "success"}
        actions={actionable.has(item.status) ? <><ActionButton variant="primary" onClick={() => onUpdateStatus(item, "Aceita")}>Receber solicitação</ActionButton><ActionButton variant="danger" onClick={() => onUpdateStatus(item, "Recusada")}>Recusar</ActionButton></> : <span className="rounded-[12px] border border-hpsr-border bg-white px-3 py-2 text-xs font-black text-hpsr-muted">Fluxo de exame · {item.status}</span>}
      /></div>)}</div></div> : <EmptyState title="Nenhuma solicitação de exame" description="Os pedidos de exame enviados pelo Portal aparecerão aqui, separados das consultas." />}
    </div>
  );
}

function RequestsTab({
  requests,
  onUpdateStatus,
}: {
  requests: PublicAppointmentRequest[];
  onUpdateStatus: (
    request: PublicAppointmentRequest,
    status: string,
    details?: { proposedDate?: string; proposedTime?: string; reason?: string }
  ) => void;
}) {
  const [rescheduleRequest, setRescheduleRequest] = useState<PublicAppointmentRequest | null>(null);
  const [proposedDate, setProposedDate] = useState("");
  const [proposedTime, setProposedTime] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const orderedRequests = [...requests].sort((a, b) => a.specialty.localeCompare(b.specialty, "pt-BR") || String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  const requestsBySpecialty = Array.from(orderedRequests.reduce((groups, item) => {
    const specialty = item.specialty || "Clínico Geral";
    groups.set(specialty, [...(groups.get(specialty) || []), item]);
    return groups;
  }, new Map<string, PublicAppointmentRequest[]>()).entries());

  function openReschedule(request: PublicAppointmentRequest) {
    setRescheduleRequest(request);
    setProposedDate(request.proposedDate || request.preferredDate || "");
    setProposedTime(request.proposedTime || "");
    setRescheduleReason(request.rescheduleReason || "");
  }

  function confirmReschedule() {
    if (!rescheduleRequest || !proposedDate || !proposedTime) return;
    onUpdateStatus(rescheduleRequest, "Reagendamento solicitado", {
      proposedDate,
      proposedTime,
      reason: rescheduleReason.trim(),
    });
    setRescheduleRequest(null);
  }

  return (
    <div className="grid gap-3">
      <SectionTitle
        icon={<CalendarDays size={18} />}
        title="Solicitações de consulta"
        description="Pedidos enviados pelo Portal do Paciente, separados visualmente por especialidade para facilitar triagem, leitura e aceite."
      />

      {orderedRequests.length > 0 ? (
        <div className="max-h-[560px] overflow-y-auto pr-2">
          <div className="grid gap-5">
            {requestsBySpecialty.map(([specialty, specialtyRequests]) => (
              <section key={specialty} className="overflow-hidden rounded-[20px] border border-hpsr-border bg-[#fffdfb] shadow-[0_5px_18px_rgba(89,44,30,0.05)]">
                <div className="flex flex-col gap-3 border-b border-hpsr-border bg-[linear-gradient(135deg,#f7e8e1_0%,#fff9f4_100%)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-hpsr-wineLight">Área clínica</p>
                    <h3 className="mt-1 text-base font-black text-hpsr-text">{specialty}</h3>
                    <p className="mt-1 text-xs font-semibold text-hpsr-muted">Solicitações desta especialidade, separadas das demais áreas.</p>
                  </div>
                  <span className="inline-flex w-fit items-center rounded-full bg-hpsr-wine px-3 py-1.5 text-xs font-black text-white">
                    {specialtyRequests.length} {specialtyRequests.length === 1 ? "solicitação" : "solicitações"}
                  </span>
                </div>
                <div className="grid gap-3 p-3.5 sm:p-4">
            {specialtyRequests.map((item) => {
              const patientAcceptedReschedule = item.status === "Reagendamento aceito";
              const patientAnsweredReschedule = [
                "Nova proposta do paciente",
                "Reagendamento recusado",
                "Disponibilidade informada",
                "Desistência solicitada",
              ].includes(item.status);

              const responseAlert = patientAcceptedReschedule
                ? `Reagendamento aceito pelo paciente. Nova consulta confirmada para ${formatDate(item.proposedDate || item.preferredDate || "")} às ${item.proposedTime || item.preferredTime || "horário a definir"}.`
                : patientAnsweredReschedule
                  ? `Resposta do paciente: ${item.patientResponse || item.status}.${item.patientAlternativeDate ? ` Preferência: ${formatDate(item.patientAlternativeDate)} às ${item.patientAlternativeTime || "horário a definir"}.` : ""}`
                  : undefined;

              return (
                <div key={item.id ?? item.passport}>
                <AppointmentCard
                  title={item.patient}
                  subtitle={`Passaporte ${item.passport} · ${item.specialty} · Data e horário definidos após contato médico`}
                  status={<StatusBadge status={item.status} />}
                  meta={[
                    ["Fluxo", item.flowType || "Consulta comum"],
                    ["Contato", (item.discordId || item.discord) ? `Discord ID ${item.discordId || item.discord}` : item.cityPhone ? `Telefone ${item.cityPhone}` : "Não informado"],
                    ...(item.flowType === "Acompanhamento com especialista" ? [["Médico solicitado", item.requestedDoctorName || "Não informado"] as [string, string]] : []),
                    ["Objetivo", ["Acompanhamento", "Outros"].includes(item.flowType || "") ? (item.flowDetails || item.reason || "Não informado") : (item.reason || "Aguardando análise médica")],
                    ...(patientAnsweredReschedule ? [["Resposta do paciente", item.patientResponse || item.status] as [string, string]] : []),
                    ...(patientAcceptedReschedule ? [["Data confirmada", `${formatDate(item.proposedDate || item.preferredDate || "")} · ${item.proposedTime || item.preferredTime || "A definir"}`] as [string, string]] : []),
                  ]}
                  alert={responseAlert}
                  alertTone={patientAcceptedReschedule ? "success" : "warning"}
                  emphasis
                  actions={
                    patientAnsweredReschedule ? (
                      <span className={`inline-flex items-center gap-2 rounded-[14px] border px-3 py-2 text-xs font-black ${patientAcceptedReschedule ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
                        {patientAcceptedReschedule ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                        {patientAcceptedReschedule ? "Paciente confirmou" : "Resposta recebida"}
                      </span>
                    ) : item.flowType === "Acompanhamento com especialista" ? (
                      <>
                        <ActionButton variant="primary" onClick={() => onUpdateStatus(item, "Aceita")}>Confirmar acompanhamento</ActionButton>
                        <ActionButton variant="danger" onClick={() => onUpdateStatus(item, "Recusada")}>Recusar vínculo</ActionButton>
                      </>
                    ) : (
                      <>
                        <ActionButton variant="primary" onClick={() => onUpdateStatus(item, "Aceita")}>Aceitar</ActionButton>
                        <ActionButton variant="danger" onClick={() => onUpdateStatus(item, "Recusada")}>Recusar</ActionButton>
                      </>
                    )
                  }
                />
                </div>
              );
            })}
                </div>
              </section>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState title="Nenhuma solicitação encontrada" description="Ajuste a busca ou aguarde novos pedidos do Portal do Paciente." />
      )}

      {rescheduleRequest && (
        <div className="fixed inset-0 z-[100000] grid place-items-center px-4 py-6">
          <button
            type="button"
            aria-label="Fechar reagendamento"
            onClick={() => setRescheduleRequest(null)}
            className="fixed inset-0 bg-[#1f0805]/65"
          />
          <section className="hpsr-modal-motion relative z-10 w-full max-w-lg overflow-hidden rounded-[18px] border border-hpsr-border bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-hpsr-border bg-[linear-gradient(135deg,#fffaf4_0%,#f5e7d8_100%)] p-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Sugestão médica</p>
                <h3 className="mt-1 text-lg font-black text-hpsr-text">Sugerir nova data e horário</h3>
                <p className="mt-1 text-sm font-semibold text-hpsr-muted">{rescheduleRequest.patient} · {rescheduleRequest.specialty}</p>
              </div>
              <button type="button" onClick={() => setRescheduleRequest(null)} className="rounded-[14px] border border-hpsr-border bg-white p-2.5 text-hpsr-wine">
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-4 p-4 sm:grid-cols-2">
              <label className="text-xs font-black text-hpsr-muted">
                Nova data
                <input
                  type="date"
                  value={proposedDate}
                  min={todayInSaoPaulo()}
                  onChange={(event) => setProposedDate(event.target.value)}
                  className={`${inputClass} mt-1.5`}
                />
              </label>
              <label className="text-xs font-black text-hpsr-muted">
                Novo horário
                <input
                  type="time"
                  value={proposedTime}
                  onChange={(event) => setProposedTime(event.target.value)}
                  className={`${inputClass} mt-1.5`}
                />
              </label>
              <label className="text-xs font-black text-hpsr-muted sm:col-span-2">
                Motivo ou orientação (opcional)
                <textarea
                  rows={3}
                  value={rescheduleReason}
                  onChange={(event) => setRescheduleReason(event.target.value)}
                  placeholder="Informe uma orientação breve para o paciente."
                  className={`${inputClass} mt-1.5 resize-none`}
                />
              </label>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-hpsr-border bg-[#fffaf4] p-4 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setRescheduleRequest(null)} className="rounded-[14px] border border-hpsr-border bg-white px-4 py-2.5 text-xs font-black text-hpsr-wine">Cancelar</button>
              <button
                type="button"
                disabled={!proposedDate || !proposedTime}
                onClick={confirmReschedule}
                className="rounded-[14px] bg-hpsr-wine px-4 py-2.5 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Enviar sugestão
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function ConsultationsTab({ appointments }: { appointments: typeof scheduledAppointments }) {
  return (
    <div className="grid gap-3">
      <SectionTitle
        icon={<Stethoscope size={18} />}
        title="Consultas marcadas"
        description="Status simples: Agendada, Confirmada, Reagendada, Cancelada, Ausente e Realizada."
      />

      {appointments.map((item) => (
        <AppointmentCard
          key={item.id}
          title={item.patient}
          subtitle={`Passaporte ${item.passport} · ${item.specialty} · ${item.doctor}`}
          status={
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${consultationStatusClass(item.status)}`}>
              {item.status}
            </span>
          }
          meta={[
            ["Data", formatDate(item.date)],
            ["Horário", item.time],
            ["Tipo", item.type],
          ]}
          alert={item.status === "Ausente" ? "Ausência registrada: gerar pendência para cobrança via boleto dentro do RP." : undefined}
          actions={
            <>
              <ActionButton variant="primary">Confirmar</ActionButton>
              <ActionButton>Reagendar</ActionButton>
              <ActionButton variant="danger">Cancelar</ActionButton>
              <ActionButton>Ausente</ActionButton>
              <ActionButton>Concluir</ActionButton>
            </>
          }
        />
      ))}
    </div>
  );
}

function FollowUpsTab({
  doctorId,
  doctorName,
  defaultSpecialty,
}: {
  doctorId?: string;
  doctorName: string;
  defaultSpecialty: string;
}) {
  return (
    <div className="grid gap-3">
      <SectionTitle
        icon={<HeartPulse size={18} />}
        title="Acompanhamentos e planejamentos"
        description="Solicitações de acompanhamento aceitas entram aqui automaticamente. Organize os pacientes por especialidade e configure frequência e referências somente quando fizer sentido clínico."
      />
      <ClinicalFollowupPlanner doctorId={doctorId} doctorName={doctorName} defaultSpecialty={defaultSpecialty} embedded />
    </div>
  );
}

function ReschedulesTab() {
  return (
    <div className="grid gap-3">
      <SectionTitle
        icon={<RotateCcw size={18} />}
        title="Reagendamentos"
        description="O paciente não escolhe o novo horário pelo Portal. Após o contato, a equipe registra aqui o horário que foi combinado com o médico."
      />

      {reschedules.map((item) => (
        <AppointmentCard
          key={item.id}
          title={item.patient}
          subtitle={`Passaporte ${item.passport} · ${item.specialty}`}
          status={<span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">Reagendada</span>}
          meta={[
            ["Data original", item.original],
            ["Nova data", item.next],
            ["Quantidade", `${item.count} reagendamento${item.count === 1 ? "" : "s"}`],
            ["Motivo", item.reason],
          ]}
          alert={item.feeAlert ? "Reagendamento/cancelamento fora do prazo: possível taxa administrativa." : undefined}
          actions={
            <>
              <ActionButton variant="primary">Registrar novo horário</ActionButton>
              <ActionButton>Histórico</ActionButton>
            </>
          }
        />
      ))}
    </div>
  );
}

function BillingTab() {
  return (
    <div className="grid gap-3">
      <SectionTitle
        icon={<BadgeDollarSign size={18} />}
        title="Pendências de cobrança"
        description="O sistema apenas avisa a equipe. Boleto, cobrança e pagamento são confirmados manualmente dentro do RP."
      />

      <div className="rounded-[16px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
        Ausência ou cancelamento fora do prazo poderá gerar taxa administrativa pelo Hospital São Rafael, cobrada via boleto bancário dentro do RP.
      </div>

      {billingIssues.map((item) => (
        <AppointmentCard
          key={item.id}
          title={item.patient}
          subtitle={`Passaporte ${item.passport} · ${item.appointment}`}
          status={
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
              {item.status}
            </span>
          }
          meta={[
            ["Motivo", item.reason],
            ["Cobrança", "Confirmação manual pela equipe/médico"],
          ]}
          actions={
            <>
              <ActionButton variant="primary">Marcar cobrada</ActionButton>
              <ActionButton>Confirmar pagamento</ActionButton>
              <ActionButton>Dispensar</ActionButton>
            </>
          }
        />
      ))}
    </div>
  );
}

function IndicatorCard({
  icon,
  label,
  value,
  description,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <article className="bg-white px-3.5 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] bg-[#f6e7e1] text-hpsr-wine">{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[9px] font-black uppercase tracking-[0.13em] text-hpsr-wineLight">{label}</p>
          <div className="mt-0.5 flex items-baseline gap-2">
            <p className="text-xl font-black leading-none text-hpsr-text">{value}</p>
            <p className="truncate text-[10px] font-semibold text-hpsr-muted">{description}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

function ScheduleCard({
  icon: Icon,
  title,
  description,
  href,
  count,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[17px] border border-hpsr-border bg-[#fffdfb] p-3.5 transition hover:border-hpsr-wineLight/50 hover:bg-[#fff8f3]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-hpsr-wine text-white shadow-sm">
            <Icon size={19} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-black text-hpsr-text">{title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-hpsr-muted">{description}</p>
          </div>
        </div>
        <span className="rounded-full bg-[#f6e7e1] px-2.5 py-1 text-[10px] font-black text-hpsr-wine">{count}</span>
      </div>
    </Link>
  );
}

function SectionTitle({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="mb-1 flex items-start gap-3 rounded-[16px] border border-hpsr-border bg-[#fff8f0] p-3.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[14px] bg-white text-hpsr-wine">
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-bold text-hpsr-text">{title}</h2>
        <p className="mt-0.5 text-sm leading-relaxed text-hpsr-muted">{description}</p>
      </div>
    </div>
  );
}

function AppointmentCard({
  title,
  subtitle,
  status,
  meta,
  actions,
  alert,
  alertTone = "warning",
  emphasis = false,
}: {
  title: string;
  subtitle: string;
  status: ReactNode;
  meta: Array<[string, string]>;
  actions: ReactNode;
  alert?: string;
  alertTone?: "warning" | "success";
  emphasis?: boolean;
}) {
  return (
    <article className={`rounded-[18px] border bg-white transition ${emphasis ? "border-hpsr-border border-l-4 border-l-hpsr-wine p-4 shadow-[0_6px_18px_rgba(89,44,30,0.06)] hover:-translate-y-px hover:shadow-[0_9px_24px_rgba(89,44,30,0.09)]" : "border-hpsr-border p-3.5 hover:bg-[#fffdf9]"}`}>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-hpsr-text">{title}</h3>
            {status}
          </div>
          <p className="mt-1 text-sm text-hpsr-muted">{subtitle}</p>

          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {meta.map(([label, value]) => (
              <InfoPill key={`${label}-${value}`} label={label} value={value} />
            ))}
          </div>

          {alert && (
            <p className={`mt-3 inline-flex items-start gap-2 rounded-[14px] border px-4 py-3 text-xs font-semibold ${alertTone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
              {alertTone === "success" ? <CheckCircle2 size={15} className="mt-0.5 shrink-0" /> : <AlertTriangle size={15} className="mt-0.5 shrink-0" />}
              {alert}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 lg:max-w-[260px] lg:justify-end">
          {actions}
        </div>
      </div>
    </article>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-hpsr-border bg-[#fff8f0] px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-hpsr-wineLight">{label}</p>
      <p className="mt-1 text-xs font-semibold text-hpsr-text">{value}</p>
    </div>
  );
}

function ActionButton({
  children,
  variant = "default",
  onClick,
}: {
  children: ReactNode;
  variant?: "default" | "primary" | "danger";
  onClick?: () => void;
}) {
  const styles = {
    default: "border-hpsr-border bg-white text-hpsr-wine hover:bg-[#fffaf4]",
    primary: "border-hpsr-wine bg-hpsr-wine text-white hover:bg-hpsr-wineLight",
    danger: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-[14px] border px-3 py-2 text-xs font-semibold transition ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-[16px] border border-dashed border-hpsr-border bg-[#fcf6ee]/62 p-3.5 text-center">
      <div>
        <p className="text-base font-bold text-hpsr-text">{title}</p>
        <p className="mt-1 text-sm text-hpsr-muted">{description}</p>
      </div>
    </div>
  );
}
