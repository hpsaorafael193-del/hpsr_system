"use client";

import { brazilIso } from "@/lib/brazil-datetime";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  CalendarPlus2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  FlaskConical,
  Hash,
  Phone,
  Search,
  Trash2,
  Stethoscope,
  UserCheck,
  UsersRound,
  X,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useCurrentUserProfile } from "@/components/auth/CurrentUserProfileProvider";
import { normalizeSpecialty } from "@/data/appointment-rules";
import { createClient } from "@/lib/supabase";
import { hpsrAlert, hpsrConfirm } from "@/components/ui/HpsrDialogProvider";

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

type ClinicalRequestBoardItem = PublicAppointmentRequest & {
  ownSpecialty: boolean;
  canClaim: boolean;
  availabilityReason: string;
};

function isDirectionRole(role: string) {
  return ["Diretora", "Vice Diretor", "Vice Diretor / Dev"].includes(role.trim());
}

function belongsToProfileSpecialties(specialty: string, specialties: string[]) {
  const normalized = normalizeSpecialty(specialty);
  return Boolean(normalized) && specialties.some((item) => normalizeSpecialty(item) === normalized);
}

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

type ScheduledAppointment = { id: string; time: string; date: string; passport: string; patient: string; specialty: string; doctor: string; type: string; status: string; acceptedAt?: string; acceptedById?: string; acceptedByName?: string; acceptedBySelf?: boolean; contactEmail?: string; discordId?: string; discord?: string; cityPhone?: string; reason?: string; notes?: string; createdAt?: string };
const scheduledAppointments: ScheduledAppointment[] = [];


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
    specialty: String(payload.specialty || "Sem especialidade"),
  };
}

function mapRequestBoardRow(row: any): ClinicalRequestBoardItem {
  return {
    ...mapAppointmentRow(row),
    ownSpecialty: row?.own_specialty === true,
    canClaim: row?.can_claim === true,
    availabilityReason: String(row?.availability_reason || ""),
  };
}

export default function AppointmentsPage() {
  const { profile: currentUserProfile } = useCurrentUserProfile();
  const [searchTerm, setSearchTerm] = useState("");
  const [publicRequests, setPublicRequests] = useState<PublicAppointmentRequest[]>([]);
  const [requestBoard, setRequestBoard] = useState<ClinicalRequestBoardItem[]>([]);
  const [requestsModalOpen, setRequestsModalOpen] = useState(false);
  const [deletingRequestId, setDeletingRequestId] = useState<string | null>(null);

  const isDirection = isDirectionRole(currentUserProfile.role);
  const userSpecialties = currentUserProfile.specialties;

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
      ? await client.from("patient_registry").select("passport,city_phone,discord").in("passport", passports)
      : { data: [] as any[] };
    const contactByPassport = new Map<string, { cityPhone: string; discord: string }>((patientContacts || []).map((item: any) => [String(item.passport || ""), { cityPhone: String(item.city_phone || "").trim(), discord: String(item.discord || "").trim() }]));
    setPublicRequests(mapped.map((item) => {
      const central = contactByPassport.get(item.passport) || { cityPhone: "", discord: "" };
      return { ...item, cityPhone: central.cityPhone || item.cityPhone || "", discordId: central.discord || item.discordId || item.discord || "", contactChannel: central.discord || item.discordId || item.discord ? "discord" : "city_phone" };
    }));
  }, []);

  const loadRequestBoard = useCallback(async () => {
    const client = createClient();
    if (!client || !currentUserProfile.id) {
      setRequestBoard([]);
      return;
    }

    const { data, error } = await client.rpc("hpsr_my_clinical_request_board", { p_limit: 400 });
    if (error) {
      console.error("[HPSR][Agendamento] Falha ao carregar quadro de solicitações:", error);
      setRequestBoard([]);
      return;
    }

    setRequestBoard((data || []).map(mapRequestBoardRow));
  }, [currentUserProfile.id]);

  useEffect(() => {
    const client = createClient();
    void Promise.all([loadAppointments(), loadRequestBoard()]);
    if (!client) return;

    const channel = client
      .channel("appointment-requests-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        () => {
          void Promise.all([loadAppointments(), loadRequestBoard()]);
        }
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [loadAppointments, loadRequestBoard]);

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
        await Promise.all([loadAppointments(), loadRequestBoard()]);
        return;
      }
      await Promise.all([loadAppointments(), loadRequestBoard()]);
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

  async function deleteMistakenRequest(request: PublicAppointmentRequest) {
    if (!isDirection || deletingRequestId) return;
    const confirmed = await hpsrConfirm(
      `Excluir a solicitação pendente de ${request.patient} (passaporte ${request.passport})?\n\nUse apenas para pedidos enviados por engano. Esta ação não exclui o cadastro do paciente nem atendimentos já confirmados e ficará registrada no histórico do sistema.`,
      "Excluir solicitação enviada por engano"
    );
    if (!confirmed) return;
    const client = createClient();
    if (!client) {
      await hpsrAlert("Conexão com o banco indisponível.", "Solicitação não excluída");
      return;
    }
    setDeletingRequestId(request.id);
    try {
      const { data, error } = await client.rpc("hpsr_delete_mistaken_clinical_request", { p_request_id: request.id });
      const result = (data || {}) as { ok?: boolean; error?: string };
      if (error || !result.ok) {
        await hpsrAlert(result.error || error?.message || "Não foi possível excluir esta solicitação.", "Solicitação não excluída");
        return;
      }
      await Promise.all([loadAppointments(), loadRequestBoard()]);
    } finally {
      setDeletingRequestId(null);
    }
  }

  const pendingRequests = useMemo(() =>
    [...requestBoard].sort((a, b) =>
      Number(b.ownSpecialty) - Number(a.ownSpecialty)
      || String(b.createdAt || b.updatedAt || "").localeCompare(String(a.createdAt || a.updatedAt || ""))
    ),
    [requestBoard]
  );

  const availableRequestCount = pendingRequests.filter((item) => item.canClaim).length;
  const requestMonitoringCount = pendingRequests.length - availableRequestCount;

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
      .filter((item) => isDirection || belongsToProfileSpecialties(item.specialty, userSpecialties))
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
          doctor: item.doctor || "A definir",
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
  }, [publicRequests, isDirection, userSpecialties, currentUserProfile.id]);

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
    if (!normalizedSearch) return pendingRequests;

    return pendingRequests.filter((item) =>
      item.patient.toLowerCase().includes(normalizedSearch) ||
      item.passport.toLowerCase().includes(normalizedSearch) ||
      item.specialty.toLowerCase().includes(normalizedSearch) ||
      (item.flowType === "Exames" ? "exame" : "consulta").includes(normalizedSearch) ||
      (item.reason || item.flowDetails || "").toLowerCase().includes(normalizedSearch)
    );
  }, [pendingRequests, searchTerm]);

  return (
    <div className="hpsr-page gap-3">
      <PageHeader
        eyebrow="Agendamentos"
        title="Central de agendamentos"
        description="Painel geral para solicitações, consultas, acompanhamentos, reagendamentos e pendências de cobrança."
      />

      <section className="shrink-0 rounded-[18px] border border-hpsr-border bg-white p-3 shadow-sm sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Acessos rápidos</p>
            <p className="mt-0.5 text-sm font-semibold text-hpsr-muted">Escolha a área que deseja gerenciar.</p>
          </div>
          <div className="hidden h-9 w-9 items-center justify-center rounded-[12px] bg-[#f7e9e3] text-hpsr-wine sm:flex">
            <CalendarClock size={18} />
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <ScheduleCard
            icon={Stethoscope}
            title="Agenda do Médico"
            description="Calendário, consultas e gestão médica."
            href="/dashboard/agendamento/clinica"
          />

          <ScheduleCard
            icon={CalendarPlus2}
            title="Agendar consulta"
            description="Abra a Agenda do Médico já no formulário de nova consulta."
            href="/dashboard/agendamento/clinica?new=1"
          />

          <button
            type="button"
            onClick={() => { setSearchTerm(""); setRequestsModalOpen(true); }}
            className="group rounded-[17px] border border-hpsr-border bg-[#fffdfb] p-3.5 text-left transition hover:border-hpsr-wineLight/50 hover:bg-[#fff8f3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hpsr-wine/30"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-hpsr-wine text-white shadow-sm">
                <CalendarDays size={19} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="truncate text-sm font-black text-hpsr-text">Solicitações</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full bg-[#f6e7e1] px-2.5 py-1 text-[10px] font-black text-hpsr-wine">{availableRequestCount} para atender</span>
                    {requestMonitoringCount > 0 && <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-black text-amber-800">{requestMonitoringCount} para acompanhar</span>}
                    <span className="rounded-full border border-hpsr-border bg-white px-2.5 py-1 text-[10px] font-black text-hpsr-muted">{acceptedForContactCount} aceite{acceptedForContactCount === 1 ? "" : "s"}</span>
                  </div>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-hpsr-muted">Consultas e exames por especialidade, com indisponíveis identificadas e seus aceites logo abaixo.</p>
              </div>
            </div>
          </button>
        </div>
      </section>

      <ConsultationOverview appointments={visibleAppointments} prioritySpecialties={isDirection ? userSpecialties : []} />

      {requestsModalOpen && (
        <RequestsCenterModal
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          requests={filteredRequests}
          totalPending={pendingRequests.length}
          isDirection={isDirection}
          prioritySpecialties={userSpecialties}
          myAcceptedRequests={filteredAcceptedRequests}
          onUpdateStatus={updatePublicRequestStatus}
          onDeleteRequest={deleteMistakenRequest}
          deletingRequestId={deletingRequestId}
          onClose={() => setRequestsModalOpen(false)}
        />
      )}
    </div>
  );
}

function ConsultationOverview({ appointments, prioritySpecialties }: { appointments: typeof scheduledAppointments; prioritySpecialties: string[] }) {
  const [recentOnly, setRecentOnly] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<ScheduledAppointment | null>(null);
  const [relatedRecords, setRelatedRecords] = useState<Array<{ id: string; type: string; title: string; released: boolean }>>([]);
  const [selectedPatientContact, setSelectedPatientContact] = useState<{ cityPhone: string; discord: string }>({ cityPhone: "", discord: "" });
  const [copiedDetail, setCopiedDetail] = useState("");

  const loadAppointmentDetails = useCallback(async (appointment: ScheduledAppointment | null) => {
    setRelatedRecords([]);
    setSelectedPatientContact({ cityPhone: "", discord: "" });
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
        .select("city_phone,discord")
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
      discord: String(patientResult.data?.discord || appointment.discordId || appointment.discord || ""),
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
    // Na Direção, atendimentos das próprias especialidades aparecem primeiro.
    const firstOwn = belongsToProfileSpecialties(first.specialty, prioritySpecialties);
    const secondOwn = belongsToProfileSpecialties(second.specialty, prioritySpecialties);
    if (firstOwn !== secondOwn) return firstOwn ? -1 : 1;

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
      <section className="flex min-h-0 flex-col overflow-hidden rounded-[20px] border border-hpsr-border bg-white shadow-sm xl:max-h-[calc(100dvh-250px)]">
        <div className="flex shrink-0 flex-col gap-3 border-b border-hpsr-border bg-[linear-gradient(135deg,#fffaf7_0%,#f7e9e2_100%)] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-hpsr-wineLight">Visão geral</p>
            <h2 className="mt-0.5 text-lg font-black text-hpsr-text">Agendamento geral</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-hpsr-muted">Visão consolidada dos atendimentos já assumidos ou agendados.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setRecentOnly(false)} className={`rounded-[12px] border px-3 py-2 text-xs font-black transition ${!recentOnly ? "border-hpsr-wine bg-hpsr-wine text-white" : "border-hpsr-border bg-white text-hpsr-wine"}`}>Todos</button>
            <button type="button" onClick={() => setRecentOnly(true)} className={`rounded-[12px] border px-3 py-2 text-xs font-black transition ${recentOnly ? "border-hpsr-wine bg-hpsr-wine text-white" : "border-hpsr-border bg-white text-hpsr-wine"}`}>Aceitos recentemente · {recentlyAcceptedCount}</button>
          </div>
        </div>

        <div className="grid min-h-0 content-start gap-3 overflow-visible p-3 sm:p-4 xl:flex-1 xl:overflow-y-auto xl:overscroll-y-auto xl:pr-3 [scrollbar-gutter:stable]">
          {sortedAppointments.length ? sortedAppointments.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => setSelectedAppointment(item)}
              className={`group relative grid min-h-[118px] w-full gap-5 overflow-hidden rounded-[20px] border bg-white p-5 text-left shadow-[0_6px_22px_rgba(89,44,30,0.05)] transition duration-200 hover:border-hpsr-wineLight/60 hover:bg-[#fffdfb] hover:shadow-[0_12px_32px_rgba(89,44,30,0.09)] 2xl:grid-cols-[minmax(0,1.35fr)_minmax(210px,0.8fr)_minmax(180px,0.6fr)_180px] 2xl:items-center ${item.status === "Aceita" ? "border-amber-200/90" : "border-hpsr-border"}`}
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

              <div className="2xl:border-l 2xl:border-hpsr-border/70 2xl:pl-5">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Médico responsável</p>
                <p className="mt-1.5 text-[15px] font-black text-hpsr-text">{item.doctor}</p>
                <p className="mt-1 text-xs font-semibold text-hpsr-muted">{item.type}</p>
              </div>

              <div className="2xl:border-l 2xl:border-hpsr-border/70 2xl:pl-5">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Data e hora</p>
                <p className="mt-1.5 text-[15px] font-black text-hpsr-text">{item.status === "Aceita" ? "Aguardando agendamento" : (item.date && item.date !== "A definir" ? formatDate(item.date) : "A definir")}</p>
                <p className="mt-1 text-xs font-semibold text-hpsr-muted">{item.status === "Aceita" ? "Definição manual" : (item.time && item.time !== "A definir" ? item.time : "Horário a definir")}</p>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-hpsr-border/70 pt-4 2xl:grid 2xl:justify-items-end 2xl:border-l 2xl:border-t-0 2xl:pl-5 2xl:pt-0">
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
                  {selectedPatientContact.discord && <button type="button" onClick={() => void copyDetail(selectedPatientContact.discord, "discord")} className="inline-flex items-center gap-2 rounded-[11px] border border-hpsr-border bg-white px-3 py-2 text-xs font-black text-hpsr-text transition hover:border-hpsr-wineLight/50"><Hash size={14} className="text-hpsr-wine"/>Discord ID {selectedPatientContact.discord}<Copy size={12} className="text-hpsr-muted"/></button>}
                  {!selectedPatientContact.discord && !selectedPhone && <p className="text-sm font-bold text-amber-800">Nenhum telefone da cidade ou ID do Discord registrado para este paciente.</p>}
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
  searchTerm,
  setSearchTerm,
  requests,
  totalPending,
  isDirection,
  prioritySpecialties,
  myAcceptedRequests,
  onUpdateStatus,
  onDeleteRequest,
  deletingRequestId,
  onClose,
}: {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  requests: ClinicalRequestBoardItem[];
  totalPending: number;
  isDirection: boolean;
  prioritySpecialties: string[];
  myAcceptedRequests: PublicAppointmentRequest[];
  onUpdateStatus: (
    request: PublicAppointmentRequest,
    status: string,
    details?: { proposedDate?: string; proposedTime?: string; reason?: string }
  ) => void;
  onDeleteRequest: (request: PublicAppointmentRequest) => void;
  deletingRequestId: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, []);

  const acceptedForContact = myAcceptedRequests.filter((item) => item.status === "Aceita" && !item.syncedScheduleId).length;

  return (
    <div className="fixed inset-0 z-[99999] grid min-h-dvh place-items-center overflow-hidden p-0 sm:px-5 sm:py-5">
      <button
        type="button"
        aria-label="Fechar solicitações"
        onClick={onClose}
        className="fixed inset-0 bg-[#1f0805]/70 backdrop-blur-[2px]"
      />

      <section className="hpsr-modal-motion relative z-10 flex h-dvh w-full flex-col overflow-hidden bg-white shadow-[0_22px_60px_rgba(42,14,7,0.22)] sm:max-h-[calc(100dvh-2rem)] sm:max-w-6xl sm:rounded-[22px] sm:border sm:border-[#eadfd8]">
        <header className="shrink-0 border-b border-hpsr-border bg-[#fffaf7] px-4 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-hpsr-wineLight">
                <CalendarDays size={15} />
                <span className="text-[10px] font-black uppercase tracking-[0.14em]">Central clínica</span>
                <span className="text-[10px] font-bold text-hpsr-muted">• {isDirection ? "visão da Direção" : "suas especialidades"}</span>
              </div>
              <h2 className="mt-1.5 text-xl font-black tracking-tight text-hpsr-text sm:text-2xl">Solicitações</h2>
              <p className="mt-1 max-w-3xl text-xs font-semibold leading-relaxed text-hpsr-muted sm:text-sm">
                {isDirection
                  ? "Suas especialidades primeiro; as demais ficam disponíveis para acompanhamento. Aceites respeitam a elegibilidade clínica."
                  : "Consultas e exames das suas especialidades, separados das solicitações que você já assumiu."}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-hpsr-wine px-3 py-1.5 text-[10px] font-black text-white sm:text-xs">
                  {requests.filter((item) => item.canClaim).length} para atender
                </span>
                {requests.some((item) => !item.canClaim) && <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-black text-amber-800 sm:text-xs">
                  {requests.filter((item) => !item.canClaim).length} para acompanhar
                </span>}
                {searchTerm.trim() && <span className="rounded-full border border-hpsr-border bg-white px-3 py-1.5 text-[10px] font-black text-hpsr-muted sm:text-xs">
                  {requests.length} de {totalPending} no filtro
                </span>}
                <span className="rounded-full border border-hpsr-border bg-white px-3 py-1.5 text-[10px] font-black text-hpsr-muted sm:text-xs">
                  {acceptedForContact} aceite{acceptedForContact === 1 ? "" : "s"} para contato
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] border border-hpsr-border bg-white text-hpsr-wine shadow-sm transition hover:border-hpsr-wineLight/50 hover:bg-[#fff5ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hpsr-wine/30"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="shrink-0 border-b border-hpsr-border bg-white px-4 py-3 sm:px-6">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-hpsr-wineLight" />
            <input
              className={`${inputClass} h-[44px] rounded-[12px] border-[#e5d5ca] bg-white pl-11 pr-4`}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar paciente, passaporte, especialidade, consulta ou exame"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#fffdfb] p-3 sm:p-5">
          <div className="grid gap-7">
            <UnifiedRequestsQueue requests={requests} isDirection={isDirection} prioritySpecialties={prioritySpecialties} onUpdateStatus={onUpdateStatus} onDeleteRequest={onDeleteRequest} deletingRequestId={deletingRequestId} />
            <div className="border-t border-hpsr-border pt-6">
              <MyAcceptedRequestsTab requests={myAcceptedRequests} />
            </div>
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
      .sort((a, b) => String(b.acceptedAt || b.updatedAt || b.createdAt || "").localeCompare(String(a.acceptedAt || a.updatedAt || a.createdAt || "")))
      .forEach((item) => {
        const specialty = item.specialty || "Sem especialidade";
        groups.set(specialty, [...(groups.get(specialty) || []), item]);
      });
    return Array.from(groups.entries()).sort(([, first], [, second]) =>
      String(second[0]?.acceptedAt || second[0]?.updatedAt || second[0]?.createdAt || "").localeCompare(String(first[0]?.acceptedAt || first[0]?.updatedAt || first[0]?.createdAt || ""))
    );
  };

  const renderRequest = (item: PublicAppointmentRequest) => {
    const discord = item.discordId || item.discord || "";
    const phone = item.cityPhone || "";
    const contact = discord || phone;
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
              <span className="rounded-full border border-hpsr-border bg-white px-2.5 py-1 text-[9px] font-black text-hpsr-muted">{isExam ? "Exame" : "Consulta"}</span>
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
            <p className="text-[9px] font-black uppercase tracking-[.13em] text-hpsr-wineLight">Contatos</p>
            <div className="mt-1 space-y-1 break-all text-sm font-black text-hpsr-text">
              <p>Discord: {discord || "Não informado"}</p>
              <p>Telefone: {phone || "Não informado"}</p>
            </div>
          </div>
          <div className="rounded-[13px] border border-hpsr-border bg-[#fffaf5] p-3">
            <p className="text-[9px] font-black uppercase tracking-[.13em] text-hpsr-wineLight">Situação</p>
            <p className="mt-1 text-sm font-black text-hpsr-text">{alreadyScheduled ? (item.status === "Aceita" ? "Agendamento vinculado" : item.status) : "Para contato"}</p>
          </div>
        </div>

        {(item.reason || item.flowDetails) && <p className="mt-3 rounded-[13px] border border-hpsr-border bg-white px-3 py-2 text-xs font-semibold text-hpsr-muted"><span className="font-black text-hpsr-text">Objetivo:</span> {item.flowDetails || item.reason}</p>}

        <div className="mt-3 flex flex-wrap gap-2">
          <ActionButton variant="primary" onClick={() => void copyValue(item.passport, `passport-${item.id}`)}>{copied === `passport-${item.id}` ? "Passaporte copiado" : "Copiar passaporte"}</ActionButton>
          {discord && <ActionButton onClick={() => void copyValue(discord, `discord-${item.id}`)}>{copied === `discord-${item.id}` ? "Discord copiado" : "Copiar Discord"}</ActionButton>}
          {phone && <ActionButton onClick={() => void copyValue(phone, `phone-${item.id}`)}>{copied === `phone-${item.id}` ? "Telefone copiado" : "Copiar telefone"}</ActionButton>}
          {!contact && <span className="rounded-[12px] border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black text-amber-800">Contato não informado</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="grid gap-5">
      <SectionTitle icon={<UserCheck size={18} />} title="Meus aceites" description="Solicitações que você assumiu. O aceite libera os dados de contato; o agendamento continua sendo feito manualmente." />

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

function UnifiedRequestsQueue({
  requests,
  isDirection,
  prioritySpecialties,
  onUpdateStatus,
  onDeleteRequest,
  deletingRequestId,
}: {
  requests: ClinicalRequestBoardItem[];
  isDirection: boolean;
  prioritySpecialties: string[];
  onUpdateStatus: (request: PublicAppointmentRequest, status: string) => void;
  onDeleteRequest: (request: PublicAppointmentRequest) => void;
  deletingRequestId: string | null;
}) {
  const segments = isDirection
    ? [
        { title: "Suas especialidades", description: "Solicitações relacionadas às especialidades do seu perfil.", items: requests.filter((item) => item.ownSpecialty) },
        { title: "Demais especialidades", description: "Visão da Direção. Solicitações fora da sua atuação clínica permanecem apenas para acompanhamento.", items: requests.filter((item) => !item.ownSpecialty) },
      ]
    : [{ title: "Suas especialidades", description: "Solicitações das especialidades do seu perfil.", items: requests }];

  return (
    <section className="grid gap-4">
      <SectionTitle
        icon={<CalendarDays size={18} />}
        title="Solicitações pendentes"
        description="Consultas e exames em filas separadas. Solicitações indisponíveis permanecem identificadas, sem liberar aceite indevido."
      />

      {requests.length ? segments.filter((segment) => segment.items.length > 0).map((segment, index) => (
        <section key={segment.title} className={`grid gap-4 ${index > 0 ? "border-t border-hpsr-border pt-5" : ""}`}>
          {isDirection && <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-black text-hpsr-text">{segment.title}</h3>
              <p className="mt-0.5 text-xs font-semibold text-hpsr-muted">{segment.description}</p>
            </div>
            <span className="rounded-full border border-hpsr-border bg-white px-3 py-1 text-xs font-black text-hpsr-wine">{segment.items.length}</span>
          </div>}
          <RequestTypeSection kind="Consulta" requests={segment.items} prioritySpecialties={prioritySpecialties} onUpdateStatus={onUpdateStatus} isDirection={isDirection} onDeleteRequest={onDeleteRequest} deletingRequestId={deletingRequestId} />
          <RequestTypeSection kind="Exames" requests={segment.items} prioritySpecialties={prioritySpecialties} onUpdateStatus={onUpdateStatus} isDirection={isDirection} onDeleteRequest={onDeleteRequest} deletingRequestId={deletingRequestId} />
        </section>
      )) : (
        <EmptyState title="Nenhuma solicitação para este perfil" description="Não há consultas ou exames pendentes visíveis para suas especialidades neste momento." />
      )}
    </section>
  );
}

function RequestTypeSection({
  kind,
  requests,
  prioritySpecialties,
  onUpdateStatus,
  isDirection,
  onDeleteRequest,
  deletingRequestId,
}: {
  kind: "Consulta" | "Exames";
  requests: ClinicalRequestBoardItem[];
  prioritySpecialties: string[];
  onUpdateStatus: (request: PublicAppointmentRequest, status: string) => void;
  isDirection: boolean;
  onDeleteRequest: (request: PublicAppointmentRequest) => void;
  deletingRequestId: string | null;
}) {
  const typeRequests = requests.filter((item) => (item.flowType === "Exames") === (kind === "Exames"));
  const grouped = Array.from(typeRequests.reduce((groups, item) => {
    const specialty = item.specialty || "Sem especialidade";
    const key = normalizeSpecialty(specialty);
    const group = groups.get(key) || { specialty, items: [] as ClinicalRequestBoardItem[] };
    group.items.push(item);
    groups.set(key, group);
    return groups;
  }, new Map<string, { specialty: string; items: ClinicalRequestBoardItem[] }>()).values());
  grouped.sort((first, second) => {
    const priority = (specialty: string) => {
      const position = prioritySpecialties.findIndex((value) => normalizeSpecialty(value) === normalizeSpecialty(specialty));
      return position < 0 ? Number.MAX_SAFE_INTEGER : position;
    };
    const firstPriority = priority(first.specialty);
    const secondPriority = priority(second.specialty);
    return firstPriority - secondPriority
      || String(second.items[0]?.createdAt || "").localeCompare(String(first.items[0]?.createdAt || ""));
  });

  return (
    <section className="grid gap-3">
      <div className="flex items-center justify-between gap-3 border-b border-hpsr-border pb-2">
        <div className="flex items-center gap-2">
          {kind === "Exames" ? <FlaskConical size={17} className="text-blue-700" /> : <Stethoscope size={17} className="text-hpsr-wine" />}
          <h4 className="text-sm font-black text-hpsr-text">{kind === "Exames" ? "Exames" : "Consultas"}</h4>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-black ${kind === "Exames" ? "bg-blue-50 text-blue-800" : "bg-[#f7e8e1] text-hpsr-wine"}`}>{typeRequests.length}</span>
      </div>
      {grouped.length ? <div className="grid gap-3">
        {grouped.map(({ specialty, items }) => (
          <div key={normalizeSpecialty(specialty)} className="overflow-hidden rounded-[16px] border border-hpsr-border bg-white">
            <div className="flex items-center justify-between gap-2 border-b border-hpsr-border bg-[#fff9f5] px-4 py-2.5">
              <h5 className="text-sm font-black text-hpsr-text">{specialty}</h5>
              <span className="text-xs font-bold text-hpsr-muted">{items.length}</span>
            </div>
            <div className="grid gap-3 p-3">{items.map((item) => (
              <ClinicalRequestCard key={item.id} item={item} onUpdateStatus={onUpdateStatus} isDirection={isDirection} onDeleteRequest={onDeleteRequest} deletingRequestId={deletingRequestId} />
            ))}</div>
          </div>
        ))}
      </div> : <p className="rounded-[12px] bg-[#fffaf7] px-3 py-2.5 text-xs font-semibold text-hpsr-muted">
        Nenhuma solicitação de {kind === "Exames" ? "exame" : "consulta"} neste grupo.
      </p>}
    </section>
  );
}

function ClinicalRequestCard({
  item,
  onUpdateStatus,
  isDirection,
  onDeleteRequest,
  deletingRequestId,
}: {
  item: ClinicalRequestBoardItem;
  onUpdateStatus: (request: PublicAppointmentRequest, status: string) => void;
  isDirection: boolean;
  onDeleteRequest: (request: PublicAppointmentRequest) => void;
  deletingRequestId: string | null;
}) {
  const isExam = item.flowType === "Exames";
  const created = item.createdAt || item.updatedAt || "";
  const objective = item.flowDetails || item.reason || (isExam ? "Exame solicitado pelo paciente." : "Solicitação de consulta enviada pelo paciente.");

  return (
    <article className="relative overflow-hidden rounded-[15px] border border-hpsr-border bg-[#fffdfb] p-3.5 shadow-[0_4px_14px_rgba(89,44,30,0.035)] sm:p-4">
      <span className={`absolute inset-y-0 left-0 w-1 ${isExam ? "bg-blue-500" : "bg-hpsr-wine"}`} />
      <div className="pl-1.5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${item.canClaim ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
                {item.canClaim ? "Disponível para aceite" : "Para acompanhamento"}
              </span>
            </div>
            <h5 className="mt-2 text-base font-black text-hpsr-text">{item.patient}</h5>
            <p className="mt-1 text-xs font-semibold text-hpsr-muted">Passaporte {item.passport} · {item.specialty || "Sem especialidade"}</p>
          </div>
          {created && <span className="shrink-0 text-[11px] font-bold text-hpsr-muted">
            {new Date(created).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
          </span>}
        </div>
        <div className="mt-3 rounded-[12px] border border-hpsr-border bg-white px-3 py-2.5">
          <p className="text-[10px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">{isExam ? "Solicitação do exame" : "Motivo da consulta"}</p>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-hpsr-text">{objective}</p>
        </div>
        {item.canClaim ? <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => onUpdateStatus(item, "Aceita")}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[13px] bg-hpsr-wine px-4 py-2.5 text-xs font-black text-white transition hover:bg-hpsr-wineDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hpsr-wine/30">
            <CheckCircle2 size={15} />{isExam ? "Receber solicitação" : "Aceitar consulta"}
          </button>
          <button type="button" onClick={() => onUpdateStatus(item, "Recusada")}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[13px] border border-rose-200 bg-white px-4 py-2.5 text-xs font-black text-rose-700 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200">
            <XCircle size={15} />Recusar
          </button>
        </div> : <p className="mt-3 rounded-[12px] border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-bold text-amber-900">
          {item.availabilityReason || "Esta solicitação não está disponível para aceite no momento."}
        </p>}
        {isDirection && (item.source || "patient_portal") === "patient_portal" &&
          ["Solicitação enviada", "Aguardando análise", "Acompanhamento aguardando confirmação"].includes(item.status) && (
          <div className="mt-3 flex justify-end border-t border-hpsr-border pt-3">
            <button type="button" disabled={deletingRequestId !== null} onClick={() => onDeleteRequest(item)}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[12px] border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
              title="Apenas para solicitações pendentes enviadas por engano">
              <Trash2 size={15} />{deletingRequestId === item.id ? "Excluindo..." : "Excluir"}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

function ScheduleCard({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[17px] border border-hpsr-border bg-[#fffdfb] p-3.5 transition hover:border-hpsr-wineLight/50 hover:bg-[#fff8f3]"
    >
      <div className="flex items-start gap-3">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-hpsr-wine text-white shadow-sm">
            <Icon size={19} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-black text-hpsr-text">{title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-hpsr-muted">{description}</p>
          </div>
        </div>
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
