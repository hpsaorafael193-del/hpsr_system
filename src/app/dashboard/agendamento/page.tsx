"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
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

const PUBLIC_APPOINTMENTS_KEY = "hpsr-public-appointments";

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
  preferred?: string;
  reason?: string;
  notes?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  doctor?: string;
  answer?: string;
  source?: string;
};

function readPublicAppointments(): PublicAppointmentRequest[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(PUBLIC_APPOINTMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePublicAppointments(requests: PublicAppointmentRequest[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PUBLIC_APPOINTMENTS_KEY, JSON.stringify(requests));
}

function publicRequestPreferred(item: PublicAppointmentRequest) {
  const date = item.preferredDate ? formatDate(item.preferredDate) : "Data a definir";
  const period = item.preferredPeriod || "Período a definir";
  return item.preferred || `${date} · ${period}`;
}

function buildPublicAnswer(status: string, doctorName: string) {
  if (status === "Aceita") {
    return `Consulta aceita por ${doctorName}. Compareça ao hospital no período informado ou aguarde contato interno no RP.`;
  }

  if (status === "Recusada") {
    return `Solicitação analisada por ${doctorName} e recusada. Procure a equipe do Hospital São Rafael para nova orientação.`;
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

  useEffect(() => {
    async function loadAppointments() {
      const client = createClient();
      if (!client) {
        setPublicRequests([]);
        return;
      }
      const { data, error } = await client
        .from("appointments")
        .select("id, passport, patient, status, payload, created_at, updated_at")
        .order("created_at", { ascending: false });
      if (error) return;
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
    }
    void loadAppointments();
  }, []);

  async function updatePublicRequestStatus(request: PublicAppointmentRequest, status: string) {
    const updatedRequest: PublicAppointmentRequest = {
      ...request,
      status,
      doctor: currentUserProfile.systemName,
      answer: buildPublicAnswer(status, currentUserProfile.systemName),
      updatedAt: new Date().toISOString(),
    };

    const client = createClient();
    if (client) {
      const payload = {
        ...request,
        ...updatedRequest,
        physician: status === "Aceita" ? currentUserProfile.systemName : request.doctor || "A definir",
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
      const nextRequests = exists
        ? currentRequests.map((item) => (item.id === request.id ? updatedRequest : item))
        : [updatedRequest, ...currentRequests];
      savePublicAppointments(nextRequests);
      return nextRequests;
    });
  }

  const pendingRequests = useMemo(() => {
    const storedRequests = publicRequests.filter((item) =>
      ["Solicitação enviada", "Em análise pelo médico", "Aguardando ajuste", "solicitado", "em análise", "pendente"].includes(item.status) &&
      doctorCanAccessSpecialty(item.specialty)
    );

    return storedRequests;
  }, [publicRequests]);

  const publicAcceptedAppointments = useMemo(() => {
    return publicRequests
      .filter((item) => item.status === "Aceita")
      .map((item) => ({
        id: item.id,
        time: preferredPeriodToTime(item.preferredPeriod),
        date: item.preferredDate || "A definir",
        passport: item.passport,
        patient: item.patient,
        specialty: item.specialty,
        doctor: item.doctor || currentUserProfile.systemName,
        type: "Consulta comum",
        status: "Agendada",
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
        item.specialty.toLowerCase().includes(normalizedSearch)
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
    <div className="hpsr-page gap-3">
      <PageHeader
        eyebrow="Agendamentos"
        title="Central de agendamentos"
        description="Painel geral para solicitações, consultas, acompanhamentos, reagendamentos e pendências de cobrança. Procedimentos seguem separados na agenda própria."
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <IndicatorCard
          icon={<CalendarCheck2 size={18} />}
          label="Consultas de hoje"
          value={String(loggedDoctorConsultationsToday.length)}
          description="Do médico logado"
        />
        <IndicatorCard
          icon={<CalendarDays size={18} />}
          label="Solicitações"
          value={String(pendingRequests.length)}
          description="Consultas aguardando análise"
        />
        <IndicatorCard
          icon={<RotateCcw size={18} />}
          label="Reagendamentos/cancelamentos"
          value={String(pendingScheduleChanges.length)}
          description="Pedidos pendentes"
        />
        <IndicatorCard
          icon={<FileClock size={18} />}
          label="Consultas no mês"
          value={String(monthlyDoctorConsultations.length)}
          description="Total do médico logado"
        />
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <ScheduleCard
          icon={Stethoscope}
          title="Agenda Clínica"
          description="Área detalhada para calendário mensal e controle das consultas."
          href="/dashboard/agendamento/clinica"
          count={visibleAppointments.length}
        />

        <ScheduleCard
          icon={Scissors}
          title="Agenda de Procedimentos"
          description="Procedimentos ficam separados por exigirem sala, equipe e duração específica."
          href="/dashboard/agendamento/cirurgias"
          count={4}
        />

        <button
          type="button"
          onClick={() => setRequestsModalOpen(true)}
          className="rounded-[16px] border border-hpsr-border bg-white p-3.5 text-left transition hover:bg-[#fffdf9]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[16px] bg-[linear-gradient(135deg,#672614,#74321e)] text-white">
                <CalendarDays size={21} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-hpsr-text">Solicitações de Consulta</h3>
                <p className="mt-1 text-sm leading-relaxed text-hpsr-muted">
                  Abrir análise de pedidos do Portal do Paciente.
                </p>
              </div>
            </div>
            <span className="rounded-full border border-hpsr-border bg-[#fcf6ee] px-3 py-1 text-xs font-bold text-hpsr-wine">
              {pendingRequests.length}
            </span>
          </div>
        </button>
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
    <section className="overflow-hidden rounded-[16px] border border-hpsr-border bg-white">
      <div className="flex flex-col gap-3 border-b border-hpsr-border bg-[linear-gradient(135deg,#fffaf4_0%,#f5e7d8_100%)] p-3.5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-hpsr-wineLight">
            Visão geral
          </p>
          <h2 className="mt-1 text-lg font-black text-hpsr-text">Consultas agendadas</h2>
          <p className="mt-1 text-sm leading-relaxed text-hpsr-muted">
            Lista geral das consultas de todos os médicos, com paciente, responsável, data, horário e status.
          </p>
        </div>
        <span className="rounded-2xl border border-hpsr-border bg-white px-4 py-2 text-xs font-black text-hpsr-wine">
          {sortedAppointments.length} consultas
        </span>
      </div>

      <div className="grid gap-3 p-3.5">
        {sortedAppointments.map((item) => (
          <article
            key={item.id}
            className="grid gap-3 rounded-[16px] border border-hpsr-border bg-[#fffaf4] p-3.5 lg:grid-cols-[minmax(0,1.3fr)_minmax(180px,0.7fr)_150px_150px]"
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
  onUpdateStatus: (request: PublicAppointmentRequest, status: string) => void;
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
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-hpsr-wineLight">
                  Especialidades visíveis
                </p>
                <p className="mt-1 text-sm leading-relaxed text-hpsr-muted">
                  {doctorVisibleSpecialties.join(" · ")}
                </p>
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

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
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

function RequestsTab({ requests, onUpdateStatus }: { requests: PublicAppointmentRequest[]; onUpdateStatus: (request: PublicAppointmentRequest, status: string) => void }) {
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
            {requests.map((item) => (
              <AppointmentCard
                key={item.id ?? item.passport}
                title={item.patient}
                subtitle={`Passaporte ${item.passport} · ${item.specialty} · Preferência: ${publicRequestPreferred(item)}`}
                status={<StatusBadge status={item.status} />}
                meta={[
                  ["Motivo", item.reason || "Aguardando análise médica"],
                  ["Fluxo", "Consulta comum"],
                ]}
                actions={
                  <>
                    <ActionButton variant="primary" onClick={() => onUpdateStatus(item, "Aceita")}>Aceitar</ActionButton>
                    <ActionButton onClick={() => onUpdateStatus(item, "Aguardando ajuste")}>Reagendar</ActionButton>
                    <ActionButton variant="danger" onClick={() => onUpdateStatus(item, "Recusada")}>Recusar</ActionButton>
                  </>
                }
              />
            ))}
          </div>
        </div>
      ) : (
        <EmptyState title="Nenhuma solicitação encontrada" description="Ajuste a busca ou aguarde novos pedidos do Portal do Paciente." />
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
    <article className="rounded-[16px] border border-hpsr-border bg-white p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">{label}</p>
          <p className="mt-2 text-lg font-black leading-none text-hpsr-text">{value}</p>
          <p className="mt-2 text-xs font-semibold text-hpsr-muted">{description}</p>
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[16px] bg-[#fcf6ee] text-hpsr-wine">
          {icon}
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
      className="group rounded-[16px] border border-hpsr-border bg-white p-3.5 transition hover:bg-[#fffdf9]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[16px] bg-[linear-gradient(135deg,#672614,#74321e)] text-white">
            <Icon size={21} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-hpsr-text">{title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-hpsr-muted">{description}</p>
          </div>
        </div>
        <span className="rounded-full border border-hpsr-border bg-[#fcf6ee] px-3 py-1 text-xs font-bold text-hpsr-wine">
          {count}
        </span>
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
}: {
  title: string;
  subtitle: string;
  status: ReactNode;
  meta: Array<[string, string]>;
  actions: ReactNode;
  alert?: string;
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
            <p className="mt-3 inline-flex items-start gap-2 rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
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
