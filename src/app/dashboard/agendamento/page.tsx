"use client";

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
  HeartPulse,
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

type TabId = "solicitacoes" | "consultas" | "acompanhamentos" | "reagendamentos" | "cobrancas";

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
  details?: { proposedDate?: string; proposedTime?: string; reason?: string }
) {
  if (status === "Aceita") {
    return `Solicitação aceita por ${doctorName}. A equipe entrará em contato pelo Discord privado ou pelo celular no RP para confirmar o dia e o horário.`;
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

type ScheduledAppointment = { id: string; time: string; date: string; passport: string; patient: string; specialty: string; doctor: string; type: string; status: string };
const scheduledAppointments: ScheduledAppointment[] = [];

const followUps: Array<{ passport: string; patient: string; program: string; specialty: string; doctor: string; availability: string[]; nextSlot: string }> = [];

const reschedules: Array<{ id: string; patient: string; passport: string; specialty: string; original: string; next: string; reason: string; count: number; feeAlert: boolean }> = [];

const billingIssues: Array<{ id: string; patient: string; passport: string; appointment: string; reason: string; status: string }> = [];

const availableSlots: Array<{ specialty: string; doctor: string; date: string; times: string[]; type: string }> = [];

const tabs: Array<{ id: TabId; label: string; icon: ReactNode }> = [
  { id: "solicitacoes", label: "Solicitações", icon: <CalendarDays size={15} /> },
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
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Cancelada":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "Ausente":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Reagendada":
      return "border-blue-200 bg-blue-50 text-blue-700";
    default:
      return "border-hpsr-border bg-[#fcf6ee] text-hpsr-wine";
  }
}

const baseVisibleAppointments = scheduledAppointments.filter((item) =>
  doctorCanAccessSpecialty(item.specialty)
);

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

    setPublicRequests((data || []).map((row: any) => ({
      ...((row.payload || {}) as PublicAppointmentRequest),
      id: String(row.id),
      passport: String(row.passport || ""),
      patient: String(row.patient || "Não informado"),
      status: String(row.status || "Solicitação enviada"),
      createdAt: String(((row.payload || {}) as Partial<PublicAppointmentRequest>).createdAt || row.created_at),
      updatedAt: String(((row.payload || {}) as Partial<PublicAppointmentRequest>).updatedAt || row.updated_at),
      specialty: String(((row.payload || {}) as Partial<PublicAppointmentRequest>).specialty || "Clínico Geral"),
    })));
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
        () => void loadAppointments()
      )
      .subscribe();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") void loadAppointments();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
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
      answer: buildPublicAnswer(status, currentUserProfile.systemName, details),
      proposedDate: details?.proposedDate || request.proposedDate,
      proposedTime: details?.proposedTime || request.proposedTime,
      rescheduleReason: details?.reason || request.rescheduleReason,
      updatedAt: new Date().toISOString(),
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
          return date.toISOString().slice(0, 10);
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
        updatedRequest.answer = `Acompanhamento confirmado por ${currentUserProfile.systemName}. Os próximos horários publicados por este médico ficarão disponíveis no portal.`;
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
      const isManager = ["Total", "Dev / Desenvolvedor do Sistema"].includes(currentUserProfile.accessLevel) || ["Diretora", "Vice Diretor", "Diretor Clínico"].includes(currentUserProfile.role);
      const belongsToDoctor = !isTargetedFollowup || item.requestedDoctorId === currentUserProfile.id || isManager;
      return belongsToDoctor && pendingMarkers.some((marker) => normalizedStatus.includes(marker));
    });
  }, [publicRequests, currentUserProfile.accessLevel, currentUserProfile.id, currentUserProfile.role]);

  const publicAcceptedAppointments = useMemo(() => {
    return publicRequests
      .filter((item) => item.status === "Aceita" || item.status === "Reagendamento aceito")
      .map((item) => ({
        id: item.id,
        time: item.status === "Reagendamento aceito"
          ? item.proposedTime || item.preferredTime || preferredPeriodToTime(item.preferredPeriod)
          : item.preferredTime || preferredPeriodToTime(item.preferredPeriod),
        date: item.status === "Reagendamento aceito"
          ? item.proposedDate || item.preferredDate || "A definir"
          : item.preferredDate || "A definir",
        passport: item.passport,
        patient: item.patient,
        specialty: item.specialty,
        doctor: item.doctor || currentUserProfile.systemName,
        type: item.flowType || "Consulta comum",
        status: item.status === "Reagendamento aceito" ? "Confirmada" : "Agendada",
      }));
  }, [publicRequests]);

  const visibleAppointments = useMemo(
    () => [...publicAcceptedAppointments, ...scheduledAppointments],
    [publicAcceptedAppointments]
  );

  const filteredRequests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return pendingRequests.filter((item) => {
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

  const loggedDoctorConsultationsToday = visibleAppointments.filter(
    (item) => item.date === new Date().toISOString().slice(0, 10) && item.doctor === currentUserProfile.systemName
  );
  const pendingScheduleChanges = reschedules.filter((item) => item.next === "A definir" || item.feeAlert);
  const monthlyDoctorConsultations = visibleAppointments.filter(
    (item) => item.date.startsWith(new Date().toISOString().slice(0, 7)) && item.doctor === currentUserProfile.systemName
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
          visibleAppointments={visibleAppointments}
          onUpdateStatus={updatePublicRequestStatus}
          onClose={() => setRequestsModalOpen(false)}
        />
      )}
    </div>
  );
}

function ConsultationOverview({ appointments }: { appointments: typeof scheduledAppointments }) {
  const sortedAppointments = [...appointments].sort((first, second) => {
    const firstDate = `${first.date} ${first.time}`;
    const secondDate = `${second.date} ${second.time}`;
    return firstDate.localeCompare(secondDate);
  });

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[20px] border border-hpsr-border bg-white shadow-sm">
      <div className="flex shrink-0 flex-col gap-2 border-b border-hpsr-border bg-[linear-gradient(135deg,#fffaf7_0%,#f7e9e2_100%)] px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-hpsr-wineLight">Visão geral</p>
          <h2 className="mt-0.5 text-lg font-black text-hpsr-text">Consultas agendadas</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-hpsr-muted">Paciente, profissional responsável, data, horário e situação atual.</p>
        </div>
        <span className="rounded-[13px] border border-[#dcc1ba] bg-white px-3 py-2 text-xs font-black text-hpsr-wine shadow-sm">
          {sortedAppointments.length} consultas
        </span>
      </div>

      <div className="grid min-h-0 flex-1 content-start gap-2 overflow-y-auto overscroll-contain p-3 pr-2 [scrollbar-gutter:stable]">
        {sortedAppointments.map((item) => (
          <article
            key={item.id}
            className="grid gap-3 rounded-[16px] border border-hpsr-border bg-white p-3 shadow-[0_4px_14px_rgba(89,44,30,0.04)] transition hover:border-hpsr-wineLight/40 hover:bg-[#fffdfb] lg:grid-cols-[minmax(0,1.3fr)_minmax(180px,0.7fr)_140px_140px]"
          >
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">
                Paciente
              </p>
              <h3 className="mt-1 text-sm font-black text-hpsr-text">{item.patient}</h3>
              <p className="mt-0.5 text-xs font-semibold text-hpsr-muted">
                Passaporte {item.passport} · {item.specialty}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">
                Médico responsável
              </p>
              <p className="mt-1 text-sm font-black text-hpsr-text">{item.doctor}</p>
              <p className="mt-0.5 text-xs font-semibold text-hpsr-muted">{item.type}</p>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">
                Data e hora
              </p>
              <p className="mt-1 text-sm font-black text-hpsr-text">{formatDate(item.date)}</p>
              <p className="mt-0.5 text-xs font-semibold text-hpsr-muted">{item.time}</p>
            </div>

            <div className="flex items-center lg:justify-end">
              <span className={`rounded-full border px-3 py-1 text-xs font-black ${consultationStatusClass(item.status)}`}>
                {item.status}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function RequestsCenterModal({
  activeTab,
  setActiveTab,
  searchTerm,
  setSearchTerm,
  filteredRequests,
  visibleAppointments,
  onUpdateStatus,
  onClose,
}: {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filteredRequests: PublicAppointmentRequest[];
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
        className="fixed inset-0 bg-[#1f0805]/65 backdrop-blur-md"
      />

      <section className="relative z-10 flex max-h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-[16px] border border-hpsr-border bg-white">
        <div className="flex items-start justify-between gap-3 border-b border-hpsr-border bg-[linear-gradient(135deg,#fffaf4_0%,#f5e7d8_100%)] p-3.5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-hpsr-wineLight">
              Central de solicitações
            </p>
            <h2 className="mt-1 text-lg font-black text-hpsr-text">Solicitações e fluxos clínicos</h2>
            <p className="mt-1 text-sm leading-relaxed text-hpsr-muted">
              Mesmo bloco anterior do agendamento geral, agora separado em modal para não misturar com a visão geral.
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
                  subtitle={`Passaporte ${item.passport} · ${item.specialty} · Preferência: ${publicRequestPreferred(item)}`}
                  status={<StatusBadge status={item.status} />}
                  meta={[
                    ["Fluxo", item.flowType || "Consulta comum"],
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
                        <ActionButton onClick={() => openReschedule(item)}>Reagendar</ActionButton>
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
            className="fixed inset-0 bg-[#1f0805]/65 backdrop-blur-sm"
          />
          <section className="relative z-10 w-full max-w-lg overflow-hidden rounded-[18px] border border-hpsr-border bg-white shadow-2xl">
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
        description="Status simples: Agendada, Confirmada, Reagendada, Cancelada, Ausente e Concluída."
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
        description="Pacientes em acompanhamento só escolhem horários liberados pelo médico responsável."
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
              <ActionButton variant="primary">Agendar</ActionButton>
              <ActionButton>Ver horários</ActionButton>
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
        description="Ao reagendar, o sistema mostra apenas horários futuros livres, compatíveis com médico e especialidade."
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
              <ActionButton variant="primary">Escolher horário</ActionButton>
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
