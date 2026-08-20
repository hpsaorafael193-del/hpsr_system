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
  Clock3,
  FileClock,
  FlaskConical,
  Hash,
  HeartPulse,
  Mail,
  RotateCcw,
  Scissors,
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
import { doctorCanAccessSpecialty, doctorVisibleSpecialties } from "@/data/appointment-rules";
import { createClient } from "@/lib/supabase";

type TabId = "solicitacoes" | "exames" | "consultas" | "acompanhamentos" | "reagendamentos" | "cobrancas";

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
  contactChannel?: "email" | "discord";
  acceptedAt?: string;
  acceptedById?: string;
  acceptedByName?: string;
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
    return `Solicitação aceita por ${doctorName}. O médico responsável entrará em contato pelo e-mail cadastrado ou, quando necessário, pelo ID do Discord informado para combinar o dia e o horário.`;
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

type ScheduledAppointment = { id: string; time: string; date: string; passport: string; patient: string; specialty: string; doctor: string; type: string; status: string; acceptedAt?: string; acceptedById?: string; acceptedByName?: string; acceptedBySelf?: boolean; contactEmail?: string; discordId?: string; reason?: string; notes?: string; createdAt?: string };
const scheduledAppointments: ScheduledAppointment[] = [];

const followUps: Array<{ passport: string; patient: string; program: string; specialty: string; doctor: string; availability: string[]; nextSlot: string }> = [];

const reschedules: Array<{ id: string; patient: string; passport: string; specialty: string; original: string; next: string; reason: string; count: number; feeAlert: boolean }> = [];

const billingIssues: Array<{ id: string; patient: string; passport: string; appointment: string; reason: string; status: string }> = [];

const availableSlots: Array<{ specialty: string; doctor: string; date: string; times: string[]; type: string }> = [];

const tabs: Array<{ id: TabId; label: string; icon: ReactNode }> = [
  { id: "solicitacoes", label: "Consultas", icon: <CalendarDays size={15} /> },
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

    setPublicRequests((data || []).map(mapAppointmentRow));
  }, []);

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

    const client = createClient();
    if (client) {
      if (status === "Acompanhamento confirmado") {
        if (request.requestedDoctorId && request.requestedDoctorId !== currentUserProfile.id) {
          console.error("[HPSR][Agendamento] Este acompanhamento foi direcionado a outro médico.");
          return;
        }
        const startDate = request.preferredDate || todayInSaoPaulo();
        const dates = Array.from({ length: 9 }, (_, index) => {
          const date = new Date(`${startDate}T12:00:00`);
          date.setDate(date.getDate() + index * 7);
          return brazilDate(date);
        });
        const { data: plan, error: planError } = await client.from("clinical_followup_plans").insert({
          doctor_id: currentUserProfile.id,
          doctor_name: currentUserProfile.systemName,
          patient_passport: request.passport.trim().toUpperCase(),
          patient_name: request.patient,
          specialty: request.specialty,
          frequency: "Semanal",
          interval_days: 7,
          start_date: dates[0],
          end_date: dates[dates.length - 1],
          total_consultations: dates.length,
          status: "Ativo",
        }).select("id").single();
        if (planError || !plan) {
          console.error("[HPSR][Agendamento] Falha ao confirmar acompanhamento:", planError);
          return;
        }
        const { error: occurrenceError } = await client.from("clinical_followup_occurrences").insert(dates.map((plannedDate) => ({
          plan_id: plan.id,
          doctor_id: currentUserProfile.id,
          patient_passport: request.passport.trim().toUpperCase(),
          patient_name: request.patient,
          specialty: request.specialty,
          planned_date: plannedDate,
          status: "Planejada",
        })));
        if (occurrenceError) {
          await client.from("clinical_followup_plans").delete().eq("id", plan.id);
          console.error("[HPSR][Agendamento] Falha ao criar ocorrências:", occurrenceError);
          return;
        }
        updatedRequest.followupPlanId = String(plan.id);
        updatedRequest.doctorNotificationUnread = false;
        updatedRequest.answer = `Acompanhamento confirmado por ${currentUserProfile.systemName}. O médico responsável entrará em contato pelo e-mail cadastrado ou pelo Discord informado para combinar os próximos atendimentos.`;
      }
      const payload = {
        ...request,
        ...updatedRequest,
        physician:
          status === "Aceita" || status === "Reagendamento solicitado" || status === "Acompanhamento confirmado"
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

      // Receber uma solicitação cria automaticamente o vínculo leve paciente -> médico -> especialidade.
      // Assim o paciente não precisa configurar nada: os horários publicados por este médico
      // passam a aparecer no Portal sem transformar uma consulta comum em acompanhamento formal.
      if (status === "Aceita" && request.flowType !== "Exames") {
        const { error: linkError } = await client.rpc("set_patient_schedule_link", {
          target_passport: request.passport.trim().toUpperCase(),
          target_doctor_id: currentUserProfile.id,
          target_doctor_name: currentUserProfile.systemName,
          target_specialty: request.specialty,
          target_enabled: true,
        });
        if (linkError) console.error("[HPSR][Agendamento] Solicitação aceita, mas o vínculo automático não pôde ser atualizado:", linkError);
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

      const isTargetedFollowup = item.flowType === "Acompanhamento com especialista" && Boolean(item.requestedDoctorId);
      const isManager = ["Total", "Diretor Técnico / Dev"].includes(currentUserProfile.accessLevel) || ["Diretora", "Vice Diretor", "Vice-Diretor"].includes(currentUserProfile.role);
      const belongsToDoctor = !isTargetedFollowup || item.requestedDoctorId === currentUserProfile.id || isManager;
      return belongsToDoctor && pendingMarkers.some((marker) => normalizedStatus.includes(marker));
    });
  }, [publicRequests, currentUserProfile.accessLevel, currentUserProfile.id, currentUserProfile.role]);

  const publicAcceptedAppointments = useMemo(() => {
    return publicRequests
      .filter((item) => item.flowType !== "Exames" && ["Aceita", "Reagendamento aceito", "Agendada", "Confirmada", "Em atendimento", "Realizada", "Concluída", "Adiada", "Atrasada", "Não compareceu", "Cancelada"].includes(item.status))
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
          status: item.status === "Aceita" ? "Aguardando contato" : item.status === "Reagendamento aceito" ? "Confirmada" : item.status,
          acceptedAt: item.acceptedAt,
          acceptedById: item.acceptedById,
          acceptedByName: item.acceptedByName,
          acceptedBySelf: Boolean(item.acceptedById && item.acceptedById === currentUserProfile.id),
          contactEmail: item.contactEmail,
          discordId: item.discordId || item.discord,
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
      if (!normalizedSearch) return true;
      return item.patient.toLowerCase().includes(normalizedSearch) || item.passport.includes(normalizedSearch) || item.specialty.toLowerCase().includes(normalizedSearch) || (item.reason || "").toLowerCase().includes(normalizedSearch);
    });
  }, [publicRequests, searchTerm]);

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
        description="Painel geral para solicitações, consultas, acompanhamentos, reagendamentos e pendências de cobrança. Procedimentos seguem separados na agenda própria."
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

        <div className="grid gap-2 md:grid-cols-3">
          <ScheduleCard
            icon={Stethoscope}
            title="Agenda Clínica"
            description="Calendário, consultas e gestão médica."
            href="/dashboard/agendamento/clinica"
            count={visibleAppointments.length}
          />

          <ScheduleCard
            icon={Scissors}
            title="Procedimentos"
            description="Salas, equipes e duração específica."
            href="/dashboard/agendamento/cirurgias"
            count={4}
          />

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

  const loadRelatedRecords = useCallback(async (appointment: ScheduledAppointment | null) => {
    setRelatedRecords([]);
    if (!appointment) return;
    const client = createClient();
    if (!client) return;
    const { data } = await client.from("clinical_records")
      .select("id,record_type,is_confidential,released_at,payload")
      .eq("patient_passport", appointment.passport)
      .eq("payload->>appointmentId", appointment.id)
      .order("created_at", { ascending: true })
      .limit(50);
    setRelatedRecords((data || []).map((row: any) => {
      const payload = (row.payload || {}) as Record<string, unknown>;
      return {
        id: String(row.id),
        type: String(row.record_type || "Registro"),
        title: String(payload.examName || payload.documentTitle || payload.title || row.record_type || "Registro clínico"),
        released: !row.is_confidential && Boolean(row.released_at),
      };
    }));
  }, []);

  useEffect(() => { void loadRelatedRecords(selectedAppointment); }, [selectedAppointment, loadRelatedRecords]);

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

  return (
    <>
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[20px] border border-hpsr-border bg-white shadow-sm">
        <div className="flex shrink-0 flex-col gap-3 border-b border-hpsr-border bg-[linear-gradient(135deg,#fffaf7_0%,#f7e9e2_100%)] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-hpsr-wineLight">Visão geral</p>
            <h2 className="mt-0.5 text-lg font-black text-hpsr-text">Agendamento geral</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-hpsr-muted">Solicitações aceitas aparecem aqui mesmo antes da definição de data e horário. Clique no paciente para ver os detalhes.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setRecentOnly(false)} className={`rounded-[12px] border px-3 py-2 text-xs font-black transition ${!recentOnly ? "border-hpsr-wine bg-hpsr-wine text-white" : "border-hpsr-border bg-white text-hpsr-wine"}`}>Todos</button>
            <button type="button" onClick={() => setRecentOnly(true)} className={`rounded-[12px] border px-3 py-2 text-xs font-black transition ${recentOnly ? "border-hpsr-wine bg-hpsr-wine text-white" : "border-hpsr-border bg-white text-hpsr-wine"}`}>Aceitos recentemente · {recentlyAcceptedCount}</button>
            <span className="rounded-[13px] border border-[#dcc1ba] bg-white px-3 py-2 text-xs font-black text-hpsr-wine shadow-sm">{sortedAppointments.length} pacientes</span>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 content-start gap-2 overflow-y-auto overscroll-contain p-3 pr-2 [scrollbar-gutter:stable]">
          {sortedAppointments.length ? sortedAppointments.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => setSelectedAppointment(item)}
              className="grid w-full gap-3 rounded-[16px] border border-hpsr-border bg-white p-3 text-left shadow-[0_4px_14px_rgba(89,44,30,0.04)] transition hover:border-hpsr-wineLight/50 hover:bg-[#fffaf8] lg:grid-cols-[minmax(0,1.3fr)_minmax(180px,0.7fr)_140px_140px]"
            >
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">Paciente</p>
                <h3 className="mt-1 text-sm font-black text-hpsr-text">{item.patient}</h3>
                <p className="mt-0.5 text-xs font-semibold text-hpsr-muted">Passaporte {item.passport} · {item.specialty}</p>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">Médico responsável</p>
                <p className="mt-1 text-sm font-black text-hpsr-text">{item.doctor}</p>
                <p className="mt-0.5 text-xs font-semibold text-hpsr-muted">{item.type}</p>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">Data e hora</p>
                <p className="mt-1 text-sm font-black text-hpsr-text">{item.date && item.date !== "A definir" ? formatDate(item.date) : "A definir"}</p>
                <p className="mt-0.5 text-xs font-semibold text-hpsr-muted">{item.time || "A definir"}</p>
              </div>

              <div className="flex items-center lg:justify-end">
                <span className={`rounded-full border px-3 py-1 text-xs font-black ${consultationStatusClass(item.status)}`}>{item.status}</span>
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
              <DetailCard label="Médico responsável" value={selectedAppointment.doctor || "A definir"} />
              <DetailCard label="Situação" value={selectedAppointment.status} />
              <DetailCard label="Data" value={selectedAppointment.date && selectedAppointment.date !== "A definir" ? formatDate(selectedAppointment.date) : "A definir após contato"} />
              <DetailCard label="Horário" value={selectedAppointment.time && selectedAppointment.time !== "A definir" ? selectedAppointment.time : "A definir após contato"} />
              <DetailCard label="Aceita em" value={selectedAppointment.acceptedAt ? new Date(selectedAppointment.acceptedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "Registro anterior sem informação"} />
              <DetailCard label="Aceita por" value={selectedAppointment.acceptedBySelf ? `Você (${selectedAppointment.acceptedByName || "usuário atual"})` : (selectedAppointment.acceptedByName || "Registro anterior sem informação")} />
              <div className="sm:col-span-2 rounded-[15px] border border-hpsr-border bg-[#fffaf5] p-3">
                <p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Contato para agendamento</p>
                {selectedAppointment.contactEmail ? <p className="mt-2 flex items-center gap-2 break-all text-sm font-black text-hpsr-text"><Mail size={15} className="text-hpsr-wine"/>{selectedAppointment.contactEmail}</p> : selectedAppointment.discordId ? <p className="mt-2 flex items-center gap-2 break-all text-sm font-black text-hpsr-text"><Hash size={15} className="text-hpsr-wine"/>Discord ID {selectedAppointment.discordId}</p> : <p className="mt-2 text-sm font-bold text-amber-800">Contato não registrado nesta solicitação antiga.</p>}
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
  visibleAppointments: typeof scheduledAppointments;
  onUpdateStatus: (
    request: PublicAppointmentRequest,
    status: string,
    details?: { proposedDate?: string; proposedTime?: string; reason?: string }
  ) => void;
  onClose: () => void;
}) {
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

  return (
    <div className="fixed inset-0 z-[99999] grid min-h-dvh place-items-center overflow-hidden px-4 py-3">
      <button
        type="button"
        aria-label="Fechar solicitações"
        onClick={onClose}
        className="fixed inset-0 bg-[#1f0805]/65"
      />

      <section className="hpsr-modal-motion relative z-10 flex max-h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-[16px] border border-hpsr-border bg-white">
        <div className="flex items-start justify-between gap-3 border-b border-hpsr-border bg-[linear-gradient(135deg,#fffaf4_0%,#f5e7d8_100%)] p-3.5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-hpsr-wineLight">
              Central de solicitações
            </p>
            <h2 className="mt-1 text-lg font-black text-hpsr-text">Solicitações e fluxos clínicos</h2>
            <p className="mt-1 text-sm leading-relaxed text-hpsr-muted">
              Consultas e solicitações de exames ficam separadas para preservar cada fluxo sem perder o contexto do paciente.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-hpsr-border bg-white p-3 text-hpsr-wine transition hover:bg-[#fff8f0]"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-hpsr-border bg-[linear-gradient(135deg,#fffaf4_0%,#f5e7d8_100%)] p-3.5">
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-center">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-[16px] border px-4 py-2.5 text-xs font-black transition ${
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

              <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-hpsr-muted/45" />
                <input
                  className={`${inputClass} pl-11`}
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar nome, passaporte ou especialidade"
                />
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3.5">
            {activeTab === "solicitacoes" && <RequestsTab requests={filteredRequests} onUpdateStatus={onUpdateStatus} />}
            {activeTab === "exames" && <ExamRequestsTab requests={filteredExamRequests} onUpdateStatus={onUpdateStatus} />}
            {activeTab === "consultas" && <ConsultationsTab appointments={visibleAppointments} />}
            {activeTab === "acompanhamentos" && <FollowUpsTab />}
            {activeTab === "reagendamentos" && <ReschedulesTab />}
            {activeTab === "cobrancas" && <BillingTab />}
          </div>
        </div>
      </section>
    </div>
  );
}

function ExamRequestsTab({ requests, onUpdateStatus }: { requests: PublicAppointmentRequest[]; onUpdateStatus: (request: PublicAppointmentRequest, status: string) => void }) {
  const actionable = new Set(["Solicitação enviada", "Aguardando análise"]);
  return (
    <div className="grid gap-3">
      <SectionTitle icon={<FlaskConical size={18} />} title="Solicitações de exame" description="Pedidos de exame ficam separados das consultas e nunca entram automaticamente no Agendamento Geral." />
      {requests.length ? <div className="max-h-[540px] overflow-y-auto pr-2"><div className="grid gap-3">{requests.map((item) => <AppointmentCard
        key={item.id}
        title={item.patient}
        subtitle={`Passaporte ${item.passport} · ${item.specialty}`}
        status={<StatusBadge status={item.status} />}
        meta={[["Fluxo", "Exame"], ["Necessidade", item.reason || "Não informada"], ["Contato", item.contactEmail ? item.contactEmail : item.discordId ? `Discord ID ${item.discordId}` : "Não informado"]]}
        alert={item.answer || undefined}
        alertTone={item.status === "Recusada" ? "warning" : "success"}
        actions={actionable.has(item.status) ? <><ActionButton variant="primary" onClick={() => onUpdateStatus(item, "Aceita")}>Receber solicitação</ActionButton><ActionButton variant="danger" onClick={() => onUpdateStatus(item, "Recusada")}>Recusar</ActionButton></> : <span className="rounded-[12px] border border-hpsr-border bg-white px-3 py-2 text-xs font-black text-hpsr-muted">Fluxo de exame · {item.status}</span>}
      />)}</div></div> : <EmptyState title="Nenhuma solicitação de exame" description="Os pedidos de exame enviados pelo Portal aparecerão aqui, separados das consultas." />}
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
        description="Pedidos enviados pelo Portal do Paciente. O modal exibe até 3 solicitações por vez e libera rolagem quando houver mais."
      />

      {requests.length > 0 ? (
        <div className="max-h-[540px] overflow-y-auto pr-2">
          <div className="grid gap-3">
            {requests.map((item) => {
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
                <AppointmentCard
                  key={item.id ?? item.passport}
                  title={item.patient}
                  subtitle={`Passaporte ${item.passport} · ${item.specialty} · Data e horário definidos após contato médico`}
                  status={<StatusBadge status={item.status} />}
                  meta={[
                    ["Fluxo", item.flowType || "Consulta comum"],
                    ["Contato", item.contactEmail ? item.contactEmail : (item.discordId || item.discord) ? `Discord ID ${item.discordId || item.discord}` : "Não informado"],
                    ...(item.flowType === "Acompanhamento com especialista" ? [["Médico solicitado", item.requestedDoctorName || "Não informado"] as [string, string]] : []),
                    ["Objetivo", item.flowType === "Outros" ? (item.flowDetails || "Não informado") : (item.reason || "Aguardando análise médica")],
                    ...(patientAnsweredReschedule ? [["Resposta do paciente", item.patientResponse || item.status] as [string, string]] : []),
                    ...(patientAcceptedReschedule ? [["Data confirmada", `${formatDate(item.proposedDate || item.preferredDate || "")} · ${item.proposedTime || item.preferredTime || "A definir"}`] as [string, string]] : []),
                  ]}
                  alert={responseAlert}
                  alertTone={patientAcceptedReschedule ? "success" : "warning"}
                  actions={
                    patientAnsweredReschedule ? (
                      <span className={`inline-flex items-center gap-2 rounded-[14px] border px-3 py-2 text-xs font-black ${patientAcceptedReschedule ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
                        {patientAcceptedReschedule ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                        {patientAcceptedReschedule ? "Paciente confirmou" : "Resposta recebida"}
                      </span>
                    ) : item.flowType === "Acompanhamento com especialista" ? (
                      <>
                        <ActionButton variant="primary" onClick={() => onUpdateStatus(item, "Acompanhamento confirmado")}>Confirmar acompanhamento</ActionButton>
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
              );
            })}
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

function FollowUpsTab() {
  return (
    <div className="grid gap-3">
      <SectionTitle
        icon={<HeartPulse size={18} />}
        title="Acompanhamentos"
        description="Pacientes em acompanhamento não definem horários pelo Portal. Os próximos atendimentos são combinados diretamente com o médico responsável."
      />

      {followUps.map((item) => (
        <AppointmentCard
          key={item.passport}
          title={item.patient}
          subtitle={`Passaporte ${item.passport} · ${item.program} · ${item.doctor}`}
          status={<span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">Acompanhamento</span>}
          meta={[
            ["Especialidade", item.specialty],
            ["Próximo horário", item.nextSlot],
            ["Disponibilidade", item.availability.join(" · ")],
          ]}
          actions={
            <>
              <ActionButton variant="primary">Registrar horário combinado</ActionButton>
              <ActionButton>Contato / histórico</ActionButton>
            </>
          }
        />
      ))}

      <div className="rounded-[16px] border border-hpsr-border bg-[#fcf6ee] p-3.5">
        <p className="text-sm font-bold text-hpsr-text">Horários disponíveis para reagendamento</p>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {availableSlots.map((slot) => (
            <div key={`${slot.specialty}-${slot.date}`} className="rounded-[16px] border border-hpsr-border bg-white p-3">
              <p className="text-sm font-bold text-hpsr-text">{slot.specialty}</p>
              <p className="mt-1 text-xs text-hpsr-muted">{slot.doctor} · {slot.type}</p>
              <p className="mt-2 text-xs font-semibold text-hpsr-wine">{slot.date}: {slot.times.join(" · ")}</p>
            </div>
          ))}
        </div>
      </div>
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
}: {
  title: string;
  subtitle: string;
  status: ReactNode;
  meta: Array<[string, string]>;
  actions: ReactNode;
  alert?: string;
  alertTone?: "warning" | "success";
}) {
  return (
    <article className="rounded-[16px] border border-hpsr-border bg-white p-3.5 transition hover:bg-[#fffdf9]">
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
