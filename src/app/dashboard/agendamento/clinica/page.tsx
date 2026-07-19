"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CalendarDays,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ClipboardPlus,
  Download,
  FileClock,
  HeartPulse,
  Plus,
  Stethoscope,
  UserRound,
  UserPlus,
  Trash2,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase";
import { useCurrentUserProfile } from "@/components/auth/CurrentUserProfileProvider";
import { hpsrConfirm, hpsrAlert } from "@/components/ui/HpsrDialogProvider";
import { usePatientSelection } from "@/components/patients/PatientSelectionProvider";
import { specialties } from "@/data/mock";
import {
  doctorCanAccessSpecialty,
  doctorVisibleSpecialties,
  findSpecialtyScheduleConflict,
} from "@/data/appointment-rules";

const BRAZIL_TIMEZONE = "America/Sao_Paulo";

const weekdayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

type Appointment = { id: string; patient: string; passport: string; specialty: string; physician: string; date: string; time: string; status: string };



type ModalMode =
  | "new"
  | "export"
  | "open"
  | "patient"
  | "reschedule";

type ModalState = {
  mode: ModalMode;
  appointment?: Appointment;
} | null;

function getBrasiliaToday() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: BRAZIL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === "year")?.value ?? "2026");
  const month = Number(parts.find((part) => part.type === "month")?.value ?? "1");
  const day = Number(parts.find((part) => part.type === "day")?.value ?? "1");

  return new Date(year, month - 1, day);
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: BRAZIL_TIMEZONE,
    month: "long",
    year: "numeric",
  }).format(date);
}

function buildMonthMatrix(baseDate: Date) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const firstWeekDay = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const previousMonthDays = new Date(year, month, 0).getDate();

  const cells: Array<{ date: Date; currentMonth: boolean }> = [];

  for (let i = firstWeekDay - 1; i >= 0; i -= 1) {
    cells.push({
      date: new Date(year, month - 1, previousMonthDays - i),
      currentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      date: new Date(year, month, day),
      currentMonth: true,
    });
  }

  while (cells.length % 7 !== 0) {
    const nextDay = cells.length - (firstWeekDay + daysInMonth) + 1;
    cells.push({
      date: new Date(year, month + 1, nextDay),
      currentMonth: false,
    });
  }

  return cells;
}

function statusClasses(status: string) {
  switch (status) {
    case "Concluída":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Cancelada":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "Não compareceu":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-blue-50 text-blue-700 border-blue-200";
  }
}

const inputClass =
  "min-w-0 w-full rounded-[14px] border border-hpsr-border bg-white px-4 py-3 text-sm font-medium text-hpsr-text outline-none transition placeholder:text-zinc-400 focus:ring-2 focus:ring-hpsr-wineLight";

const labelClass = "text-xs font-semibold uppercase tracking-[0.16em] text-hpsr-muted";

export default function ClinicalSchedulePage() {
  const { profile: currentUserProfile } = useCurrentUserProfile();
  const [scheduledAppointments, setScheduledAppointments] = useState<Appointment[]>([]);
  const brasiliaToday = useMemo(() => getBrasiliaToday(), []);
  const [currentMonth, setCurrentMonth] = useState(
    new Date(brasiliaToday.getFullYear(), brasiliaToday.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(brasiliaToday);
  const [modal, setModal] = useState<ModalState>(null);

  const dateKey = toDateKey(selectedDate);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    const client = supabase;
    let active = true;
    async function loadAppointments() {
      const { data, error } = await client.from("appointments").select("id,passport,patient,status,payload,created_at").order("created_at", { ascending: false });
      if (error || !active) return;
      setScheduledAppointments((data || []).filter((row: any) => row.status === "Aceita" || row.status === "Agendada" || row.status === "Confirmada" || row.status === "Reagendamento aceito").map((row: any) => {
        const payload = (row.payload || {}) as Record<string, unknown>;
        return {
          id: String(row.id), patient: String(row.patient || payload.patient || "Paciente"), passport: String(row.passport || payload.passport || ""),
          specialty: String(payload.specialty || "Clínico Geral"), physician: String(payload.physician || payload.doctor || "A definir"),
          date: String(row.status === "Reagendamento aceito" ? payload.proposedDate || payload.preferredDate || payload.date || "" : payload.preferredDate || payload.date || ""), time: String(row.status === "Reagendamento aceito" ? payload.proposedTime || payload.time || "09:00" : payload.time || (payload.preferredPeriod === "Tarde" ? "14:00" : payload.preferredPeriod === "Noite" ? "19:00" : "09:00")),
          status: String(row.status === "Aceita" ? "Agendada" : row.status),
        };
      }));
    }
    void loadAppointments();
    const channel = client.channel("agenda-clinica-sync").on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, loadAppointments).subscribe();
    return () => { active = false; void client.removeChannel(channel); };
  }, []);

  const doctorAppointments = scheduledAppointments.filter((appointment) =>
    appointment.physician === currentUserProfile.systemName || doctorCanAccessSpecialty(appointment.specialty)
  );

  const appointmentsOnSelectedDay = doctorAppointments
    .filter((appointment) => appointment.date === dateKey)
    .sort((a, b) => a.time.localeCompare(b.time));

  async function handleDeleteAppointment(appointment: Appointment) {
    const confirmed = await hpsrConfirm(
      `A consulta de ${appointment.patient}, em ${appointment.date.split("-").reverse().join("/")} às ${appointment.time}, será cancelada e removida da agenda. O registro de auditoria permanecerá no sistema.`,
      "Excluir consulta agendada"
    );
    if (!confirmed) return;

    const client = createClient();
    if (!client) {
      await hpsrAlert("Não foi possível acessar o banco de dados.", "Falha ao excluir consulta");
      return;
    }

    const { data: currentRow, error: readError } = await client
      .from("appointments")
      .select("payload")
      .eq("id", appointment.id)
      .maybeSingle();
    if (readError) {
      await hpsrAlert(readError.message, "Falha ao excluir consulta");
      return;
    }

    const now = new Date().toISOString();
    const payload = {
      ...((currentRow?.payload || {}) as Record<string, unknown>),
      cancellationReason: "Consulta excluída da Agenda Clínica",
      deletedAt: now,
      deletedBy: currentUserProfile.systemName,
      previousStatus: appointment.status,
    };
    const { error } = await client
      .from("appointments")
      .update({ status: "Cancelada", payload, updated_at: now })
      .eq("id", appointment.id);
    if (error) {
      await hpsrAlert(error.message, "Falha ao excluir consulta");
      return;
    }

    setScheduledAppointments((current) => current.filter((item) => item.id !== appointment.id));
  }

  const monthlyAppointments = doctorAppointments.filter((appointment) => {
    const [year, month] = appointment.date.split("-").map(Number);
    return year === currentMonth.getFullYear() && month - 1 === currentMonth.getMonth();
  });


  const daysWithAppointments = new Set(monthlyAppointments.map((item) => item.date));
  const monthDays = buildMonthMatrix(currentMonth);

  const selectedDateLabel = new Intl.DateTimeFormat("pt-BR", {
    timeZone: BRAZIL_TIMEZONE,
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(selectedDate);

  return (
    <div className="hpsr-page gap-3">
      <PageHeader
        eyebrow="Agendamentos"
        title="Agenda Clínica"
        description="Gerencie consultas da sua especialidade, respeitando intervalo mínimo de 1 hora por especialidade e horários no padrão de Brasília."
      />

      <section className="rounded-[16px] border border-hpsr-border bg-[#fffaf4] px-4 py-3 text-hpsr-text lg:px-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-hpsr-border bg-white px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wine">
              <CalendarClock size={15} />
              Agenda clínica
            </span>
            <h2 className="mt-2 max-w-4xl text-[clamp(1.25rem,2vw,1.75rem)] font-black leading-tight tracking-tight">
              Calendário clínico com consultas, regras e atendimento
            </h2>
            <p className="mt-1.5 max-w-3xl text-[13px] leading-relaxed text-hpsr-muted">
              Controle consultas da especialidade do médico logado, evitando conflitos com menos de 1 hora e mantendo horários no padrão de Brasília.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <button
              onClick={() => setModal({ mode: "new" })}
              className="inline-flex items-center justify-center gap-2 rounded-[16px] bg-[linear-gradient(135deg,#672614,#74321e)] px-4 py-2.5 text-sm font-black text-white transition"
            >
              <Plus size={16} />
              Nova consulta
            </button>
            <button
              onClick={() => setModal({ mode: "export" })}
              className="inline-flex items-center justify-center gap-2 rounded-[16px] border border-hpsr-border bg-white px-4 py-2.5 text-sm font-black text-hpsr-wine transition hover:bg-[#fffdf9]"
            >
              <Download size={16} />
              Importar relatório
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="rounded-[16px] border border-hpsr-border bg-white p-3.5">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-hpsr-wineLight">
            Regras de agendamento
          </p>
          <p className="mt-2 text-sm leading-relaxed text-hpsr-muted">
            Não é permitido agendar consultas da mesma especialidade em horários com menos de 1 hora de intervalo.
            Solicitações e consultas exibidas aqui respeitam a especialidade do médico logado.
          </p>
        </div>

        <div className="rounded-[16px] border border-hpsr-border bg-[#fff8f0] px-4 py-3 lg:min-w-[360px]">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">Especialidades visíveis</p>
          <p className="mt-1 text-sm font-black text-hpsr-text">{doctorVisibleSpecialties.join(" · ")}</p>
        </div>
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(320px,430px)_minmax(0,1fr)]">
        <article className="overflow-hidden rounded-[16px] border border-hpsr-border bg-white p-3.5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-hpsr-wineLight">Calendário</p>
              <h2 className="mt-2 text-lg font-semibold text-hpsr-text">Consultas por data</h2>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-[14px] bg-[#f7f2ea] text-hpsr-wine">
              <CalendarDays size={20} />
            </div>
          </div>

          <div className="rounded-[16px] border border-hpsr-border bg-[#fff8f0] p-3.5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() =>
                  setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
                }
                className="flex h-8 w-8 items-center justify-center rounded-[14px] border border-hpsr-border bg-white text-hpsr-text transition hover:bg-[#fffdf9]"
              >
                <ChevronLeft size={18} />
              </button>

              <p className="text-base font-semibold capitalize text-hpsr-text">
                {monthLabel(currentMonth)}
              </p>

              <button
                type="button"
                onClick={() =>
                  setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
                }
                className="flex h-8 w-8 items-center justify-center rounded-[14px] border border-hpsr-border bg-white text-hpsr-text transition hover:bg-[#fffdf9]"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center">
              {weekdayLabels.map((day) => (
                <span
                  key={day}
                  className="py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-hpsr-muted"
                >
                  {day}
                </span>
              ))}

              {monthDays.map(({ date, currentMonth: isCurrentMonth }) => {
                const key = toDateKey(date);
                const isSelected = key === dateKey;
                const isToday = key === toDateKey(brasiliaToday);
                const hasAppointments = daysWithAppointments.has(key);

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDate(date)}
                    className={cn(
                      "relative flex aspect-square items-center justify-center rounded-[14px] text-sm font-semibold transition",
                      isCurrentMonth ? "text-hpsr-text" : "text-hpsr-muted/45",
                      isSelected
                        ? "bg-[linear-gradient(135deg,#672614,#2a0700)] text-white"
                        : "bg-white hover:bg-[#fffdf9]",
                      isToday && !isSelected && "border-2 border-hpsr-wineLight"
                    )}
                  >
                    {date.getDate()}
                    {hasAppointments && (
                      <span
                        className={cn(
                          "absolute bottom-2 h-1.5 w-1.5 rounded-full",
                          isSelected ? "bg-white" : "bg-hpsr-wineLight"
                        )}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </article>

        <article className="overflow-hidden rounded-[16px] border border-hpsr-border bg-white p-3.5">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-hpsr-wineLight">Próximas consultas</p>
              <h2 className="mt-2 text-lg font-semibold capitalize text-hpsr-text">{selectedDateLabel}</h2>
              <p className="mt-2 text-sm text-hpsr-muted">
                Horários exibidos no padrão de Brasília (BRT).
              </p>
            </div>

            <div className="rounded-2xl border border-hpsr-border bg-[#fcf6ee] px-4 py-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-hpsr-muted">Resumo do dia</p>
              <p className="mt-1 font-semibold text-hpsr-text">
                {appointmentsOnSelectedDay.length} consulta{appointmentsOnSelectedDay.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          {appointmentsOnSelectedDay.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[16px] border border-dashed border-hpsr-border bg-[#fff8f0] px-4 text-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-[14px] bg-white text-hpsr-wine ">
                <FileClock size={24} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-hpsr-text">Nenhuma consulta agendada</h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-hpsr-muted">
                Selecione outra data no calendário ou crie um novo agendamento para o corpo clínico.
              </p>
              <button
                onClick={() => setModal({ mode: "new" })}
                className="mt-5 inline-flex items-center gap-2 rounded-[14px] bg-hpsr-wineLight px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95"
              >
                <Plus size={16} />
                Agendar consulta
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              {appointmentsOnSelectedDay.map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-[16px] border border-hpsr-border bg-[#fff8f0] p-3.5 transition hover:bg-[#fffdf9]"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-hpsr-wine ">
                          <CalendarDays size={14} />
                          {appointment.time} · Brasília
                        </span>
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                            statusClasses(appointment.status)
                          )}
                        >
                          {appointment.status}
                        </span>
                      </div>

                      <h3 className="mt-3 text-lg font-semibold text-hpsr-text">{appointment.patient}</h3>
                      <p className="mt-1 text-sm text-hpsr-muted">
                        Passaporte {appointment.passport} · {appointment.specialty}
                      </p>
                    </div>

                    <div className="grid gap-2 text-sm text-hpsr-muted sm:grid-cols-2 lg:min-w-[250px]">
                      <div className="rounded-[16px] border border-hpsr-border bg-white px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em]">Médico</p>
                        <p className="mt-1 font-semibold text-hpsr-text">{appointment.physician}</p>
                      </div>
                      <div className="rounded-[16px] border border-hpsr-border bg-white px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em]">Consulta</p>
                        <p className="mt-1 font-semibold text-hpsr-text">{appointment.id}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => setModal({ mode: "open", appointment })}
                      className="inline-flex items-center gap-2 rounded-[16px] bg-[linear-gradient(135deg,#672614,#74321e)] px-4 py-2.5 text-xs font-black text-white transition"
                    >
                      <ClipboardPlus size={15} />
                      Abrir atendimento
                    </button>
                    <button
                      onClick={() => setModal({ mode: "patient", appointment })}
                      className="inline-flex items-center gap-2 rounded-[16px] border border-hpsr-border bg-white px-4 py-2.5 text-xs font-black text-hpsr-wine transition hover:bg-[#fffdf9]"
                    >
                      <UserRound size={15} />
                      Ver paciente
                    </button>
                    <button
                      onClick={() => setModal({ mode: "reschedule", appointment })}
                      className="inline-flex items-center gap-2 rounded-[16px] border border-hpsr-border bg-white px-4 py-2.5 text-xs font-black text-hpsr-wine transition hover:bg-[#fffdf9]"
                    >
                      <Stethoscope size={15} />
                      Reagendar
                    </button>
                    <button
                      onClick={() => void handleDeleteAppointment(appointment)}
                      className="inline-flex items-center gap-2 rounded-[16px] border border-rose-200 bg-white px-4 py-2.5 text-xs font-black text-rose-700 transition hover:bg-rose-50"
                    >
                      <Trash2 size={15} />
                      Excluir consulta
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <AgendaModal modal={modal} onClose={() => setModal(null)} selectedDate={dateKey} appointments={doctorAppointments} />
    </div>
  );
}

function AgendaModal({
  modal,
  onClose,
  selectedDate,
  appointments,
}: {
  modal: ModalState;
  onClose: () => void;
  selectedDate: string;
  appointments: Appointment[];
}) {
  if (!modal) return null;

  const appointment = modal.appointment;

  const titleMap: Record<ModalMode, string> = {
    new: "Nova consulta",
    export: "Exportar relatório",
    open: "Abrir atendimento",
    patient: "Dados do paciente",
    reschedule: "Reagendar consulta",
  };

  const descriptionMap: Record<ModalMode, string> = {
    new: "Cadastre uma consulta manualmente na agenda clínica.",
    export: "Defina o período e o formato do relatório da agenda.",
    open: "Inicie o atendimento e prepare o registro clínico do paciente.",
    patient: "Visualize os dados principais vinculados à consulta selecionada.",
    reschedule: "Escolha uma nova data e horário no padrão de Brasília.",
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center overflow-y-auto px-4 py-3">
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar modal"
        className="hpsr-modal-backdrop"
      />

      <div className="hpsr-modal-shell max-w-2xl">
        <div className="hpsr-modal-header flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-hpsr-wineLight">Agenda Clínica</p>
            <h2 className="mt-1 text-lg font-semibold text-hpsr-text">{titleMap[modal.mode]}</h2>
            <p className="mt-1 text-sm leading-relaxed text-hpsr-muted">{descriptionMap[modal.mode]}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[14px] border border-hpsr-border bg-white text-hpsr-muted transition hover:bg-[#fffdf9] hover:text-hpsr-wine"
          >
            <X size={18} />
          </button>
        </div>

        <div className="bg-[#fff8f1] p-3.5">
          {modal.mode === "new" && <NewAppointmentForm selectedDate={selectedDate} onClose={onClose} appointments={appointments} />}
          {modal.mode === "export" && <ExportReportForm onClose={onClose} />}
          {modal.mode === "open" && appointment && <OpenAttendanceForm appointment={appointment} onClose={onClose} />}
          {modal.mode === "patient" && appointment && <PatientDetails appointment={appointment} />}
          {modal.mode === "reschedule" && appointment && (
            <RescheduleForm appointment={appointment} onClose={onClose} appointments={appointments} />
          )}
        </div>
      </div>
    </div>
  );
}

function NewAppointmentForm({
  selectedDate,
  onClose,
  appointments,
}: {
  selectedDate: string;
  onClose: () => void;
  appointments: Appointment[];
}) {
  const [date, setDate] = useState(selectedDate);
  const [time, setTime] = useState("09:00");
  const { profile: currentUserProfile } = useCurrentUserProfile();
  const { patients, selectPatient, upsertPatient } = usePatientSelection();
  const [patientPassport, setPatientPassport] = useState("");
  const [patientName, setPatientName] = useState("");
  const [physician, setPhysician] = useState("");
  const [doctors, setDoctors] = useState<Array<{ id: string; name: string; specialty: string }>>([]);
  const [specialty, setSpecialty] = useState("Clínico Geral");
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickPatient, setQuickPatient] = useState({ name: "", passport: "", age: "", bloodType: "" });
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    const client = createClient();
    if (!client) return;
    void client.from("profiles").select("id,name,role,specialty").eq("access_status", "Aprovado").order("name").then(({ data }) => {
      const available = (data || [])
        .filter((row: any) => String(row.role || "").includes("Médico") || ["Diretor Clínico", "Diretora", "Vice Diretor"].includes(String(row.role || "")))
        .map((row: any) => ({ id: String(row.id), name: String(row.name || "Médico"), specialty: String(row.specialty || "Clínico Geral") }));
      setDoctors(available);
      const current = available.find((item) => item.name === currentUserProfile.systemName);
      setPhysician(current?.name || available[0]?.name || currentUserProfile.systemName);
    });
  }, [currentUserProfile.systemName]);

  async function saveQuickPatient() {
    const name = quickPatient.name.trim();
    const passport = quickPatient.passport.trim();
    if (!name || !passport) {
      setMessage({ type: "error", text: "Informe nome completo e documento/passaporte." });
      return;
    }
    const normalizedPassport = passport.toUpperCase();
    const patient = { name, passport: normalizedPassport, age: quickPatient.age.trim(), bloodType: quickPatient.bloodType.trim() };
    const client = createClient();
    if (!client) {
      setMessage({ type: "error", text: "Não foi possível conectar ao Supabase." });
      return;
    }
    const now = new Date().toISOString();
    const { error: registryError } = await client.from("patient_registry").upsert({
      passport: normalizedPassport,
      name,
      age: patient.age || null,
      blood_type: patient.bloodType || null,
      updated_at: now,
    }, { onConflict: "passport" });
    if (registryError) {
      setMessage({ type: "error", text: `Não foi possível cadastrar o paciente: ${registryError.message}` });
      return;
    }
    const { error } = await client.from("clinical_records").insert({
      id: `patient-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      patient_passport: normalizedPassport,
      record_type: "Cadastro de paciente",
      is_confidential: true,
      released_at: null,
      payload: { patient, patientName: name, age: patient.age, bloodType: patient.bloodType, source: "quick_registration", savedAt: now },
    });
    if (error) {
      setMessage({ type: "error", text: `O paciente foi cadastrado, mas o registro clínico não foi criado: ${error.message}` });
      return;
    }
    upsertPatient(patient);
    selectPatient(patient);
    setPatientName(name);
    setPatientPassport(passport);
    setQuickOpen(false);
    setQuickPatient({ name: "", passport: "", age: "", bloodType: "" });
    setMessage({ type: "success", text: "Paciente cadastrado rapidamente e selecionado." });
  }

  async function handleSave() {
    const conflict = findSpecialtyScheduleConflict({ appointments, date, time, specialty });
    if (conflict) {
      setMessage({ type: "error", text: `Conflito: já existe ${conflict.specialty} às ${conflict.time} nesta data. Mantenha pelo menos 1 hora de intervalo para a mesma especialidade.` });
      return;
    }
    if (!patientPassport || !patientName) {
      setMessage({ type: "error", text: "Selecione ou cadastre um paciente antes de salvar." });
      return;
    }
    if (!physician) {
      setMessage({ type: "error", text: "Selecione o médico responsável." });
      return;
    }
    const client = createClient();
    if (!client) return;
    const now = new Date().toISOString();
    const id = `appointment-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const payload = { patient: patientName, passport: patientPassport, specialty, physician, doctor: physician, date, preferredDate: date, time, source: "clinical_schedule", createdAt: now, updatedAt: now };
    const { error } = await client.from("appointments").insert({ id, passport: patientPassport, patient: patientName, status: "Agendada", payload, created_at: now, updated_at: now });
    if (error) { setMessage({ type: "error", text: error.message }); return; }
    setMessage({ type: "success", text: "Consulta salva e sincronizada com a visão geral e o prontuário." });
  }

  return (
    <div className="grid gap-3">
      <div className="rounded-2xl border border-hpsr-border bg-[#fcf6ee] p-3.5 text-sm leading-relaxed text-hpsr-muted">
        Selecione paciente e médico. O cadastro rápido usa o mesmo registro compartilhado do Prontuário.
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Paciente">
          <div className="flex gap-2">
            <select className={inputClass} value={patientPassport} onChange={(event) => { const passport = event.target.value; const found = patients.find((item) => item.passport === passport); setPatientPassport(passport); setPatientName(found?.name || ""); if (found) selectPatient(found); }}>
              <option value="">Selecione o paciente</option>
              {patients.map((item) => <option key={item.passport} value={item.passport}>{item.name} · {item.passport}</option>)}
            </select>
            <button type="button" onClick={() => setQuickOpen(true)} title="Registro rápido de paciente" aria-label="Registro rápido de paciente" className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[14px] border border-hpsr-border bg-white text-hpsr-wine hover:bg-[#fff8f0]"><UserPlus size={18}/></button>
          </div>
        </Field>
        <Field label="Médico responsável">
          <select className={inputClass} value={physician} onChange={(event) => setPhysician(event.target.value)}>
            <option value="">Selecione o médico</option>
            {doctors.map((doctor) => <option key={doctor.id} value={doctor.name}>{doctor.name}</option>)}
          </select>
        </Field>
        <Field label="Especialidade">
          <select className={inputClass} value={specialty} onChange={(event) => setSpecialty(event.target.value)}>
            {specialties.map((item) => <option key={item}>{item}</option>)}
          </select>
        </Field>
        <Field label="Data"><input className={inputClass} type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Field>
        <Field label="Horário de Brasília"><input className={inputClass} type="time" value={time} onChange={(event) => setTime(event.target.value)} /></Field>
      </div>

      <Field label="Observações"><textarea className={inputClass} rows={4} placeholder="Motivo da consulta, orientação interna ou observações." /></Field>
      {message && <ValidationMessage type={message.type} text={message.text} />}
      <ModalActions onClose={onClose} actionLabel="Validar e salvar" onConfirm={handleSave} />

      {quickOpen && <div className="fixed inset-0 z-[1000] grid place-items-center bg-[#1f0805]/60 p-4 backdrop-blur-sm">
        <div className="w-full max-w-[520px] overflow-hidden rounded-[22px] border border-hpsr-border bg-[#fffaf4] shadow-2xl">
          <div className="flex items-start justify-between border-b border-hpsr-border bg-white px-5 py-4"><div className="flex gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-hpsr-border text-hpsr-wine"><UserPlus size={19}/></div><div><h3 className="font-black text-hpsr-text">Registro rápido de paciente</h3><p className="text-xs font-semibold text-hpsr-muted">Preencha apenas os dados necessários para esta consulta.</p></div></div><button type="button" onClick={() => setQuickOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-hpsr-wine text-white"><X size={18}/></button></div>
          <div className="grid gap-3 p-5 sm:grid-cols-2"><label className="sm:col-span-2 text-[10px] font-black uppercase tracking-[.12em] text-hpsr-muted">Nome completo<input className={`${inputClass} mt-1.5`} value={quickPatient.name} onChange={(e)=>setQuickPatient((c)=>({...c,name:e.target.value}))}/></label><label className="text-[10px] font-black uppercase tracking-[.12em] text-hpsr-muted">Documento / Passaporte<input className={`${inputClass} mt-1.5`} value={quickPatient.passport} onChange={(e)=>setQuickPatient((c)=>({...c,passport:e.target.value}))}/></label><label className="text-[10px] font-black uppercase tracking-[.12em] text-hpsr-muted">Idade<input className={`${inputClass} mt-1.5`} value={quickPatient.age} onChange={(e)=>setQuickPatient((c)=>({...c,age:e.target.value}))}/></label><label className="sm:col-span-2 text-[10px] font-black uppercase tracking-[.12em] text-hpsr-muted">Tipo sanguíneo<input className={`${inputClass} mt-1.5`} placeholder="Ex.: B-" value={quickPatient.bloodType} onChange={(e)=>setQuickPatient((c)=>({...c,bloodType:e.target.value}))}/></label></div>
          <div className="flex justify-end gap-2 border-t border-hpsr-border bg-white px-5 py-4"><button type="button" onClick={() => setQuickOpen(false)} className="rounded-[14px] border border-hpsr-border bg-white px-4 py-3 text-xs font-black text-hpsr-text">Cancelar</button><button type="button" onClick={() => void saveQuickPatient()} className="rounded-[14px] bg-hpsr-wine px-4 py-3 text-xs font-black text-white">Salvar paciente</button></div>
        </div>
      </div>}
    </div>
  );
}

function ExportReportForm({ onClose }: { onClose: () => void }) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Data inicial">
          <input className={inputClass} type="date" />
        </Field>
        <Field label="Data final">
          <input className={inputClass} type="date" />
        </Field>
        <Field label="Status">
          <select className={inputClass} defaultValue="todos">
            <option value="todos">Todos</option>
            <option>Agendada</option>
            <option>Concluída</option>
            <option>Cancelada</option>
            <option>Não compareceu</option>
          </select>
        </Field>
        <Field label="Formato">
          <select className={inputClass} defaultValue="pdf">
            <option value="pdf">PDF</option>
            <option value="csv">CSV</option>
            <option value="xlsx">Planilha</option>
          </select>
        </Field>
      </div>

      <div className="rounded-2xl border border-hpsr-border bg-[#fcf6ee] p-3.5 text-sm leading-relaxed text-hpsr-muted">
        O relatório será gerado futuramente com as consultas filtradas, horários em Brasília e identificação do Hospital São Rafael.
      </div>

      <ModalActions onClose={onClose} actionLabel="Gerar relatório" />
    </div>
  );
}

function OpenAttendanceForm({ appointment, onClose }: { appointment: Appointment; onClose: () => void }) {
  return (
    <div className="grid gap-3">
      <AppointmentSummary appointment={appointment} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Status do atendimento">
          <select className={inputClass} defaultValue="em_atendimento">
            <option value="em_atendimento">Em atendimento</option>
            <option value="concluida">Concluir consulta</option>
            <option value="ausente">Paciente não compareceu</option>
          </select>
        </Field>
        <Field label="Tipo de registro">
          <select className={inputClass} defaultValue="consulta">
            <option value="consulta">Consulta clínica</option>
            <option value="retorno">Retorno</option>
            <option value="triagem">Triagem</option>
          </select>
        </Field>
      </div>

      <Field label="Resumo inicial">
        <textarea className={inputClass} rows={4} placeholder="Registre queixa principal, conduta inicial ou observação do atendimento." />
      </Field>

      <ModalActions onClose={onClose} actionLabel="Iniciar atendimento" />
    </div>
  );
}

function PatientDetails({ appointment }: { appointment: Appointment }) {
  return (
    <div className="grid gap-3">
      <AppointmentSummary appointment={appointment} />

      <div className="grid gap-3 sm:grid-cols-2">
        <InfoBox label="Paciente" value={appointment.patient} />
        <InfoBox label="Passaporte" value={appointment.passport} />
        <InfoBox label="Especialidade" value={appointment.specialty} />
        <InfoBox label="Médico responsável" value={appointment.physician} />
        <InfoBox label="Data" value={appointment.date.split("-").reverse().join("/")} />
        <InfoBox label="Horário" value={`${appointment.time} · Brasília`} />
      </div>

      <div className="rounded-2xl border border-hpsr-border bg-[#fcf6ee] p-3.5 text-sm leading-relaxed text-hpsr-muted">
        Quando o Supabase for conectado, este modal poderá exibir convênio, telefone na cidade, histórico de consultas e prontuários vinculados ao passaporte.
      </div>
    </div>
  );
}

function RescheduleForm({
  appointment,
  onClose,
  appointments,
}: {
  appointment: Appointment;
  onClose: () => void;
  appointments: Appointment[];
}) {
  const [date, setDate] = useState(appointment.date);
  const [time, setTime] = useState(appointment.time);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSave() {
    const conflict = findSpecialtyScheduleConflict({
      appointments,
      date,
      time,
      specialty: appointment.specialty,
      ignoreId: appointment.id,
    });

    if (conflict) {
      setMessage({
        type: "error",
        text: `Conflito: já existe ${conflict.specialty} às ${conflict.time} nesta data. Mantenha pelo menos 1 hora de intervalo para a mesma especialidade.`,
      });
      return;
    }

    const client = createClient();
    if (!client) return;
    const { data: row, error: readError } = await client.from("appointments").select("payload").eq("id", appointment.id).maybeSingle();
    if (readError) { setMessage({ type: "error", text: readError.message }); return; }
    const payload = { ...((row?.payload || {}) as Record<string, unknown>), proposedDate: date, proposedTime: time, rescheduleReason: reason || notes || "Reagendamento solicitado pelo médico", rescheduleNotes: notes, physician: appointment.physician, doctor: appointment.physician, updatedAt: new Date().toISOString() };
    const { error } = await client.from("appointments").update({ status: "Reagendamento solicitado", payload, updated_at: new Date().toISOString() }).eq("id", appointment.id);
    if (error) { setMessage({ type: "error", text: error.message }); return; }
    setMessage({ type: "success", text: "Proposta enviada ao Portal do Paciente para aceitar, recusar, informar disponibilidade ou desistir." });
  }

  return (
    <div className="grid gap-3">
      <AppointmentSummary appointment={appointment} />

      <div className="rounded-2xl border border-hpsr-border bg-[#fcf6ee] p-3.5 text-sm leading-relaxed text-hpsr-muted">
        Reagendamentos também respeitam a regra de 1 hora entre consultas da mesma especialidade.
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nova data">
          <input className={inputClass} type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </Field>
        <Field label="Novo horário de Brasília">
          <input className={inputClass} type="time" value={time} onChange={(event) => setTime(event.target.value)} />
        </Field>
        <Field label="Motivo do reagendamento">
          <select className={inputClass} value={reason} onChange={(event) => setReason(event.target.value)}>
            <option value="" disabled>Selecione</option>
            <option>Pedido do paciente</option>
            <option>Indisponibilidade médica</option>
            <option>Reorganização da agenda</option>
            <option>Outro</option>
          </select>
        </Field>
        <Field label="Comunicação">
          <select className={inputClass} defaultValue="pendente">
            <option value="pendente">Aviso pendente</option>
            <option value="avisado">Paciente avisado</option>
          </select>
        </Field>
      </div>

      <Field label="Observações">
        <textarea className={inputClass} rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Informe detalhes do reagendamento." />
      </Field>

      {message && <ValidationMessage type={message.type} text={message.text} />}

      <ModalActions onClose={onClose} actionLabel="Validar reagendamento" onConfirm={handleSave} />
    </div>
  );
}

function AppointmentSummary({ appointment }: { appointment: Appointment }) {
  return (
    <div className="rounded-[16px] border border-hpsr-border bg-[#fff8f0] p-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-hpsr-wine">
          {appointment.id}
        </span>
        <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", statusClasses(appointment.status))}>
          {appointment.status}
        </span>
      </div>

      <h3 className="mt-3 text-lg font-semibold text-hpsr-text">{appointment.patient}</h3>
      <p className="mt-1 text-sm text-hpsr-muted">
        Passaporte {appointment.passport} · {appointment.specialty} · {appointment.date.split("-").reverse().join("/")} às {appointment.time} Brasília
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className={labelClass}>{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-hpsr-border bg-white px-4 py-3">
      <p className={labelClass}>{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-hpsr-text">{value}</p>
    </div>
  );
}

function ValidationMessage({ type, text }: { type: "error" | "success"; text: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm font-semibold leading-relaxed",
        type === "error"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      )}
    >
      {text}
    </div>
  );
}

function ModalActions({
  onClose,
  actionLabel,
  onConfirm,
}: {
  onClose: () => void;
  actionLabel: string;
  onConfirm?: () => void;
}) {
  return (
    <div className="mt-2 flex flex-col-reverse gap-3 border-t border-hpsr-border pt-4 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onClose}
        className="rounded-2xl border border-hpsr-border bg-white px-4 py-3 text-sm font-semibold text-hpsr-text transition hover:bg-[#fffaf4]"
      >
        Cancelar
      </button>
      <button
        type="button"
        onClick={onConfirm ?? onClose}
        className="rounded-2xl bg-[linear-gradient(135deg,#672614,#2a0700)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95"
      >
        {actionLabel}
      </button>
    </div>
  );
}
