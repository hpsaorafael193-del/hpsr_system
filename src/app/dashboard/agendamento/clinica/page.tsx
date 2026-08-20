"use client";

import { brazilIso } from "@/lib/brazil-datetime";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CalendarDays,
  CalendarClock,
  CalendarPlus2,
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  ClipboardPlus,
  Download,
  FileClock,
  HeartPulse,
  Plus,
  Search,
  ListFilter,
  Stethoscope,
  UserRound,
  UserPlus,
  UsersRound,
  Trash2,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DoctorAvailabilityManager } from "@/components/dashboard/DoctorAvailabilityManager";
import { DeveloperAppointmentManager } from "@/components/dashboard/DeveloperAppointmentManager";
import { ClinicalFollowupPlanner } from "@/components/dashboard/ClinicalFollowupPlanner";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase";
import { useCurrentUserProfile } from "@/components/auth/CurrentUserProfileProvider";
import { hpsrConfirm, hpsrAlert } from "@/components/ui/HpsrDialogProvider";
import { usePatientSelection } from "@/components/patients/PatientSelectionProvider";
import { specialties } from "@/data/mock";
import { findSpecialtyScheduleConflict } from "@/data/appointment-rules";
import { isClinicalProfessional, normalizeClinicalPassport } from "@/lib/clinical-scheduling";

const BRAZIL_TIMEZONE = "America/Sao_Paulo";

const weekdayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

type Appointment = { id: string; patient: string; passport: string; specialty: string; physician: string; doctorId: string; date: string; time: string; status: string };



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

type ScheduleToolModal = "followup" | "availability" | null;

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

function appointmentSection(status: string) {
  if (["Realizada", "Concluída", "Não compareceu", "Cancelada"].includes(status)) return "Concluídas";
  if (["Aceita", "Reagendamento aceito", "Em atendimento"].includes(status)) return "Aguardando ação";
  return "Próximas consultas";
}

const appointmentSectionOrder: Record<string, number> = {
  "Aguardando ação": 0,
  "Próximas consultas": 1,
  "Concluídas": 2,
};

function statusClasses(status: string) {
  switch (status) {
    case "Concluída":
    case "Realizada":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Em atendimento":
      return "bg-violet-50 text-violet-700 border-violet-200";
    case "Cancelada":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "Não compareceu":
    case "Atrasada":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "Adiada":
      return "bg-blue-50 text-blue-700 border-blue-200";
    default:
      return "bg-blue-50 text-blue-700 border-blue-200";
  }
}

const inputClass =
  "min-w-0 w-full rounded-[14px] border border-hpsr-border bg-white px-4 py-3 text-sm font-medium text-hpsr-text outline-none transition placeholder:text-zinc-400 focus:ring-2 focus:ring-hpsr-wineLight";

const labelClass = "text-xs font-semibold uppercase tracking-[0.16em] text-hpsr-muted";

export default function ClinicalSchedulePage() {
  const searchParams = useSearchParams();
  const requestedAppointmentId = searchParams.get("appointment") || "";
  const { profile: currentUserProfile } = useCurrentUserProfile();
  const isDeveloper = currentUserProfile.systemRole === "Diretor Técnico / Dev" || currentUserProfile.accessLevel === "Total";
  const isDirector = ["Diretora", "Vice Diretor", "Vice-Diretor"].some((role) => role === currentUserProfile.role || role === currentUserProfile.systemRole);
  const canViewAllMedicalSchedules = isDeveloper || isDirector;
  const [scheduledAppointments, setScheduledAppointments] = useState<Appointment[]>([]);
  const brasiliaToday = useMemo(() => getBrasiliaToday(), []);
  const [currentMonth, setCurrentMonth] = useState(
    new Date(brasiliaToday.getFullYear(), brasiliaToday.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(brasiliaToday);
  const [modal, setModal] = useState<ModalState>(null);
  const [scheduleToolModal, setScheduleToolModal] = useState<ScheduleToolModal>(null);
  const [appointmentSearch, setAppointmentSearch] = useState("");
  const [scheduleScope, setScheduleScope] = useState<"mine" | "all">("mine");
  const [showCompletedAppointments, setShowCompletedAppointments] = useState(false);
  const [quickStatusSavingId, setQuickStatusSavingId] = useState<string | null>(null);

  const dateKey = toDateKey(selectedDate);

  const loadAppointments = useCallback(async () => {
    const client = createClient();
    if (!client) return;
    const { data, error } = await client
      .from("appointments")
      .select("id,passport,patient,status,payload,created_at")
      .in("status", ["Aceita", "Agendada", "Confirmada", "Reagendamento aceito", "Em atendimento", "Adiada", "Atrasada", "Realizada", "Concluída", "Não compareceu", "Cancelada"])
      .order("created_at", { ascending: false })
      .limit(400);
    if (error) throw error;
    setScheduledAppointments((data || [])
      .filter((row: any) => ["Aceita", "Agendada", "Confirmada", "Reagendamento aceito", "Em atendimento", "Adiada", "Atrasada", "Realizada", "Concluída", "Não compareceu", "Cancelada"].includes(String(row.status)))
      .map((row: any) => {
        const payload = (row.payload || {}) as Record<string, unknown>;
        return {
          id: String(row.id),
          patient: String(row.patient || payload.patient || "Paciente"),
          passport: String(row.passport || payload.passport || ""),
          specialty: String(payload.specialty || "Clínico Geral"),
          physician: String(payload.physician || payload.doctor || "A definir"),
          doctorId: String(payload.doctorId || payload.doctor_id || ""),
          date: String(row.status === "Reagendamento aceito" ? payload.proposedDate || payload.preferredDate || payload.date || "" : payload.preferredDate || payload.date || ""),
          time: String(row.status === "Reagendamento aceito" ? payload.proposedTime || payload.time || "09:00" : payload.time || payload.preferredTime || (payload.preferredPeriod === "Tarde" ? "14:00" : payload.preferredPeriod === "Noite" ? "19:00" : "09:00")),
          status: String(row.status === "Aceita" ? "Agendada" : row.status),
        };
      }));
  }, []);

  useEffect(() => {
    const client = createClient();
    if (!client) return;
    void loadAppointments();
    const channel = client
      .channel("agenda-clinica-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => void loadAppointments())
      .subscribe();
    return () => { void client.removeChannel(channel); };
  }, [loadAppointments]);

  useEffect(() => {
    if (!requestedAppointmentId || modal) return;
    const target = scheduledAppointments.find((item) => item.id === requestedAppointmentId);
    if (!target) return;
    if (!canViewAllMedicalSchedules && target.doctorId && target.doctorId !== currentUserProfile.id) return;
    if (!canViewAllMedicalSchedules && !target.doctorId && target.physician !== currentUserProfile.systemName) return;
    if (target.date) {
      const [year, month, day] = target.date.split("-").map(Number);
      if (year && month && day) {
        const selected = new Date(year, month - 1, day, 12, 0, 0);
        setSelectedDate(selected);
        setCurrentMonth(new Date(year, month - 1, 1));
      }
    }
    setAppointmentSearch(target.patient);
  }, [requestedAppointmentId, scheduledAppointments, modal, canViewAllMedicalSchedules, currentUserProfile.id, currentUserProfile.systemName]);

  const viewingAllSchedules = canViewAllMedicalSchedules && scheduleScope === "all";
  const doctorAppointments = scheduledAppointments.filter((appointment) => {
    if (viewingAllSchedules) return true;
    if (appointment.doctorId) return appointment.doctorId === currentUserProfile.id;
    return appointment.physician === currentUserProfile.systemName;
  });

  const completedStatuses = new Set(["Realizada", "Concluída", "Não compareceu", "Cancelada"]);
  const activeDoctorAppointments = doctorAppointments.filter((appointment) => !completedStatuses.has(appointment.status));
  const completedDoctorAppointments = doctorAppointments
    .filter((appointment) => completedStatuses.has(appointment.status))
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));

  const appointmentsOnSelectedDay = activeDoctorAppointments
    .filter((appointment) => appointment.date === dateKey)
    .sort((a, b) => a.time.localeCompare(b.time));

  const visibleAppointmentsOnSelectedDay = appointmentsOnSelectedDay.filter((appointment) => {
    const query = appointmentSearch.trim().toLocaleLowerCase("pt-BR");
    if (!query) return true;
    return [appointment.patient, appointment.passport, appointment.specialty, appointment.physician, appointment.status, appointment.time]
      .some((value) => value.toLocaleLowerCase("pt-BR").includes(query));
  }).sort((left, right) => {
    const sectionDifference = appointmentSectionOrder[appointmentSection(left.status)] - appointmentSectionOrder[appointmentSection(right.status)];
    return sectionDifference || left.time.localeCompare(right.time);
  });

  const todayKey = toDateKey(brasiliaToday);
  const todayAppointments = activeDoctorAppointments.filter((appointment) => appointment.date === todayKey);
  const confirmedAppointments = doctorAppointments.filter((appointment) => appointment.status === "Confirmada").length;
  const inServiceAppointments = doctorAppointments.filter((appointment) => appointment.status === "Em atendimento").length;


  function canManageAppointment(appointment: Appointment) {
    if (canViewAllMedicalSchedules) return true;
    if (appointment.doctorId) return appointment.doctorId === currentUserProfile.id;
    return appointment.physician === currentUserProfile.systemName;
  }

  async function handleQuickStatus(appointment: Appointment, nextStatus: "Em atendimento" | "Concluída" | "Adiada" | "Atrasada" | "Não compareceu") {
    if (!canManageAppointment(appointment) || quickStatusSavingId) return;
    const client = createClient();
    if (!client) {
      await hpsrAlert("Não foi possível acessar o banco de dados.", "Falha ao atualizar consulta");
      return;
    }

    if (["Concluída", "Não compareceu"].includes(nextStatus)) {
      const action = nextStatus === "Concluída" ? "concluir esta consulta" : "registrar que o paciente não compareceu";
      const confirmed = await hpsrConfirm(`Deseja ${action}?`, "Confirmar alteração");
      if (!confirmed) return;
    }

    setQuickStatusSavingId(appointment.id);
    try {
      const { data: currentRow, error: readError } = await client
        .from("appointments")
        .select("payload,status")
        .eq("id", appointment.id)
        .maybeSingle();
      if (readError) throw readError;
      if (!currentRow) throw new Error("A consulta não foi encontrada no banco de dados.");

      const now = brazilIso();
      const currentPayload = (currentRow.payload || {}) as Record<string, unknown>;
      const payload = {
        ...currentPayload,
        attendanceStatus: nextStatus,
        attendanceUpdatedAt: now,
        attendanceUpdatedBy: currentUserProfile.systemName,
        previousStatus: currentRow.status,
        updatedAt: now,
      };
      const { data: updatedRow, error: updateError } = await client
        .from("appointments")
        .update({ status: nextStatus, payload, updated_at: now })
        .eq("id", appointment.id)
        .select("id,status")
        .maybeSingle();
      if (updateError) throw updateError;
      if (!updatedRow || updatedRow.status !== nextStatus) throw new Error("O banco não confirmou a alteração do status.");

      const slotId = String(currentPayload.slotId || "");
      if (slotId) {
        const slotStatus = nextStatus === "Concluída" ? "Concluído" : nextStatus === "Não compareceu" ? "Ausente" : nextStatus;
        await client.from("clinical_appointment_slots").update({ status: slotStatus, updated_at: now }).eq("id", slotId);
      }
      const occurrenceId = String(currentPayload.occurrenceId || "");
      if (occurrenceId) {
        const occurrenceStatus = nextStatus === "Concluída" ? "Consulta realizada" : nextStatus;
        await client.from("clinical_followup_occurrences").update({ status: occurrenceStatus, updated_at: now }).eq("id", occurrenceId);
      }
      await loadAppointments();
    } catch (caught) {
      await hpsrAlert(caught instanceof Error ? caught.message : "Não foi possível atualizar a consulta.", "Falha ao atualizar consulta");
    } finally {
      setQuickStatusSavingId(null);
    }
  }

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

    const now = brazilIso();
    const payload = {
      ...((currentRow?.payload || {}) as Record<string, unknown>),
      cancellationReason: "Consulta excluída da Agenda Clínica",
      deletedAt: now,
      deletedBy: currentUserProfile.systemName,
      previousStatus: appointment.status,
    };
    const { data: cancelledRow, error } = await client
      .from("appointments")
      .update({ status: "Cancelada", payload, updated_at: now })
      .eq("id", appointment.id)
      .select("id,status")
      .maybeSingle();
    if (error) {
      await hpsrAlert(error.message, "Falha ao excluir consulta");
      return;
    }
    if (!cancelledRow || cancelledRow.status !== "Cancelada") {
      await hpsrAlert("O banco não confirmou a alteração desta consulta. Verifique as permissões do usuário e tente novamente.", "Consulta não alterada");
      return;
    }

    await loadAppointments();
  }

  async function handleDeleteOldAppointment(appointment: Appointment) {
    const confirmed = await hpsrConfirm(
      `Excluir definitivamente a consulta antiga de ${appointment.patient}, em ${appointment.date.split("-").reverse().join("/")} às ${appointment.time}? Ela será removida da agenda, mas a ação continuará registrada na auditoria do sistema.`,
      "Excluir consulta antiga?"
    );
    if (!confirmed) return;

    const client = createClient();
    if (!client) {
      await hpsrAlert("Não foi possível acessar o banco de dados.", "Falha ao excluir consulta");
      return;
    }

    const { data, error } = await client.rpc("delete_clinical_appointment", { p_appointment_id: appointment.id });
    if (error) {
      await hpsrAlert(error.message, "Falha ao excluir consulta");
      return;
    }
    if (!(data as { deleted?: boolean } | null)?.deleted) {
      await hpsrAlert("O banco não confirmou a exclusão da consulta.", "Consulta não excluída");
      return;
    }
    await loadAppointments();
  }

  const monthlyAppointments = activeDoctorAppointments.filter((appointment) => {
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
        title="Minha Agenda Clínica"
        description="Organize sua disponibilidade, consultas, acompanhamentos e atendimentos em um único lugar."
      />

      <section className="overflow-hidden rounded-[20px] border border-hpsr-border bg-[linear-gradient(135deg,#fffaf7_0%,#f7e8e1_100%)] shadow-sm">
        <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1.25fr)_auto] lg:items-center lg:p-5">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-hpsr-wineLight">Central de trabalho médico</p>
            <h1 className="mt-1.5 text-2xl font-black tracking-tight text-hpsr-text sm:text-3xl">Cuide de toda a sua agenda</h1>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-hpsr-muted">
              Publique quando pode atender, acompanhe as consultas do dia, responda às solicitações e organize retornos sem sair desta área.
            </p>
            {canViewAllMedicalSchedules && (
              <div className="mt-4 inline-flex rounded-[13px] border border-hpsr-border bg-white p-1 shadow-sm">
                <button type="button" onClick={() => setScheduleScope("mine")} className={cn("rounded-[10px] px-3 py-2 text-xs font-black transition", scheduleScope === "mine" ? "bg-hpsr-wine text-white" : "text-hpsr-wine hover:bg-[#fff7f2]")}>Minha agenda</button>
                <button type="button" onClick={() => setScheduleScope("all")} className={cn("rounded-[10px] px-3 py-2 text-xs font-black transition", scheduleScope === "all" ? "bg-hpsr-wine text-white" : "text-hpsr-wine hover:bg-[#fff7f2]")}>Todos os profissionais</button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <button onClick={() => setModal({ mode: "new" })} className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-hpsr-wine px-4 py-3 text-sm font-black text-white shadow-sm transition hover:opacity-95">
              <Plus size={16} /> Nova consulta
            </button>
            <button onClick={() => setShowCompletedAppointments((current) => !current)} className="inline-flex items-center justify-center gap-2 rounded-[14px] border border-hpsr-border bg-white px-4 py-3 text-sm font-black text-hpsr-wine transition hover:bg-[#fffaf4]">
              <CalendarCheck2 size={16} /> Finalizadas ({completedDoctorAppointments.length})
            </button>
            <button onClick={() => setModal({ mode: "export" })} className="inline-flex items-center justify-center gap-2 rounded-[14px] border border-hpsr-border bg-white px-4 py-3 text-sm font-black text-hpsr-wine transition hover:bg-[#fffaf4]">
              <Download size={16} /> Exportar
            </button>
          </div>
        </div>

        <div className="grid gap-px border-t border-hpsr-border bg-[#eadbd6] sm:grid-cols-2 xl:grid-cols-4">
          <button type="button" onClick={() => setScheduleToolModal("availability")} className="group bg-white p-4 text-left transition hover:bg-[#fff8f3]">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-hpsr-wine text-white"><CalendarClock size={19} /></div>
              <div className="min-w-0">
                <p className="text-sm font-black text-hpsr-text">Minha disponibilidade</p>
                <p className="mt-1 text-xs leading-relaxed text-hpsr-muted">Publique os dias e horários em que poderá atender.</p>
              </div>
            </div>
          </button>

          <button type="button" onClick={() => { setSelectedDate(brasiliaToday); setCurrentMonth(new Date(brasiliaToday.getFullYear(), brasiliaToday.getMonth(), 1)); }} className="group bg-white p-4 text-left transition hover:bg-[#fff8f3]">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[#f3e1da] text-hpsr-wine"><CalendarDays size={19} /></div>
              <div className="min-w-0">
                <div className="flex items-center gap-2"><p className="text-sm font-black text-hpsr-text">Agenda do dia</p><span className="rounded-full bg-[#f6e7e1] px-2 py-0.5 text-[10px] font-black text-hpsr-wine">{todayAppointments.length}</span></div>
                <p className="mt-1 text-xs leading-relaxed text-hpsr-muted">Veja os pacientes de hoje e inicie os atendimentos.</p>
              </div>
            </div>
          </button>

          <Link href="/dashboard/agendamento" className="group bg-white p-4 text-left transition hover:bg-[#fff8f3]">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[#f3e1da] text-hpsr-wine"><UsersRound size={19} /></div>
              <div className="min-w-0">
                <p className="text-sm font-black text-hpsr-text">Consultas e solicitações</p>
                <p className="mt-1 text-xs leading-relaxed text-hpsr-muted">Analise pedidos, confirmações e reagendamentos.</p>
              </div>
            </div>
          </Link>

          <button type="button" onClick={() => setScheduleToolModal("followup")} className="group bg-white p-4 text-left transition hover:bg-[#fff8f3]">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[#f3e1da] text-hpsr-wine"><HeartPulse size={19} /></div>
              <div className="min-w-0">
                <p className="text-sm font-black text-hpsr-text">Planejamentos e retornos</p>
                <p className="mt-1 text-xs leading-relaxed text-hpsr-muted">Organize acompanhamentos e próximas consultas.</p>
              </div>
            </div>
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["Consultas hoje", String(todayAppointments.length)],
          ["Consultas no mês", String(monthlyAppointments.length)],
          ["Confirmadas", String(confirmedAppointments)],
          ["Em atendimento", String(inServiceAppointments)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[14px] border border-hpsr-border bg-white px-3.5 py-3 shadow-sm">
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-hpsr-wineLight">{label}</p>
            <p className="mt-1 text-xl font-black text-hpsr-text">{value}</p>
          </div>
        ))}
      </section>

      <section className="grid items-start gap-3 xl:grid-cols-[minmax(320px,410px)_minmax(0,1fr)]">
        <article className="flex h-auto flex-col overflow-hidden rounded-[18px] border border-hpsr-border bg-[linear-gradient(180deg,#fffdfb_0%,#fff8f4_100%)] shadow-sm xl:h-[560px]">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-hpsr-border/80 bg-white/85 px-4 py-3">
            <div>
              <h2 className="text-base font-black text-hpsr-text">Calendário</h2>
              <p className="mt-0.5 text-xs font-semibold text-hpsr-muted">Escolha um dia para ver os atendimentos.</p>
            </div>
            <CalendarDays size={18} className="text-hpsr-wine" />
          </div>
          <div className="min-h-0 flex-1 p-4">
          <div className="rounded-[18px] border border-hpsr-border bg-white p-3.5 shadow-sm">
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
          </div>
          <div className="border-t border-hpsr-border bg-[#fffaf6] px-4 py-3 text-xs font-semibold leading-relaxed text-hpsr-muted">
            Os dias com consultas possuem um marcador. Selecione uma data para atualizar o painel de atendimentos.
          </div>
        </article>

        <article className="flex h-auto min-h-0 flex-col overflow-hidden rounded-[18px] border border-hpsr-border bg-[linear-gradient(180deg,#fffdfb_0%,#fff8f4_100%)] shadow-sm xl:h-[560px]">
          <div className="shrink-0 border-b border-hpsr-border/80 bg-white/85 p-3.5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-black capitalize text-hpsr-text">{selectedDateLabel}</h2>
                <p className="mt-0.5 text-xs font-semibold text-hpsr-muted">{appointmentsOnSelectedDay.length} consulta{appointmentsOnSelectedDay.length === 1 ? "" : "s"} neste dia · horário de Brasília</p>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-[12px] border border-hpsr-border bg-[#fffaf6] px-3">
              <Search size={16} className="shrink-0 text-hpsr-wineLight" />
              <input
                value={appointmentSearch}
                onChange={(event) => setAppointmentSearch(event.target.value)}
                placeholder="Buscar paciente, passaporte, médico ou status"
                className="h-11 min-w-0 flex-1 bg-transparent text-sm font-semibold text-hpsr-text outline-none placeholder:text-hpsr-muted/70"
              />
              <ListFilter size={16} className="shrink-0 text-hpsr-muted" />
            </div>
          </div>

          <div
            className="hpsr-appointments-scroll min-h-0 max-h-[510px] flex-1 overflow-y-auto p-4 [scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch]"
            onWheel={(event) => {
              const panel = event.currentTarget;
              if (panel.scrollHeight > panel.clientHeight) {
                panel.scrollTop += event.deltaY;
                event.stopPropagation();
              }
            }}
          >
          {appointmentsOnSelectedDay.length === 0 ? (
            <div className="flex h-full min-h-[260px] flex-col items-center justify-center rounded-[18px] border border-dashed border-[#dfc6bb] bg-white px-5 text-center shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#f7e8e4] text-hpsr-wine">
                <FileClock size={24} />
              </div>
              <h3 className="mt-4 text-xl font-black text-hpsr-text">Nenhuma consulta agendada</h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-hpsr-muted">
                Selecione outra data no calendário ou crie um novo agendamento para o corpo clínico.
              </p>
              <button
                onClick={() => setModal({ mode: "new" })}
                className="mt-5 inline-flex items-center gap-2 rounded-[14px] bg-hpsr-wine px-4 py-3 text-sm font-black text-white transition hover:opacity-95"
              >
                <Plus size={16} />
                Agendar consulta
              </button>
            </div>
          ) : visibleAppointmentsOnSelectedDay.length === 0 ? (
            <div className="flex h-full min-h-[260px] flex-col items-center justify-center rounded-[18px] border border-dashed border-[#dfc6bb] bg-white px-5 text-center shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#f7e8e4] text-hpsr-wine"><Search size={22} /></div>
              <h3 className="mt-4 text-xl font-black text-hpsr-text">Nenhuma consulta encontrada</h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-hpsr-muted">Revise o termo pesquisado para visualizar os agendamentos deste dia.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {visibleAppointmentsOnSelectedDay.map((appointment, index) => {
                const section = appointmentSection(appointment.status);
                const previousSection = index > 0 ? appointmentSection(visibleAppointmentsOnSelectedDay[index - 1].status) : "";
                const isClosedAppointment = section === "Concluídas";
                return (
                <div key={appointment.id}>
                  {section !== previousSection && (
                    <div className="mb-2 mt-2 flex items-center gap-2 first:mt-0">
                      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">{section}</span>
                      <span className="h-px flex-1 bg-hpsr-border" />
                    </div>
                  )}
                <div
                  className="rounded-[18px] border border-[#e5d1c6] bg-white p-3.5 shadow-sm transition hover:border-[#d6b8ac] hover:bg-[#fffdfa]"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-2 rounded-full border border-[#ead8cf] bg-[#fff8f4] px-3 py-1 text-xs font-semibold text-hpsr-wine ">
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
                    {!isClosedAppointment && canManageAppointment(appointment) && (
                      <>
                        {appointment.status !== "Em atendimento" && <button type="button" disabled={quickStatusSavingId === appointment.id} onClick={() => void handleQuickStatus(appointment, "Em atendimento")} className="inline-flex items-center gap-2 rounded-[13px] bg-hpsr-wine px-3.5 py-2.5 text-xs font-black text-white transition disabled:opacity-50"><ClipboardPlus size={14}/>Iniciar</button>}
                        <button type="button" disabled={quickStatusSavingId === appointment.id} onClick={() => void handleQuickStatus(appointment, "Concluída")} className="rounded-[13px] border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-black text-emerald-700 transition disabled:opacity-50">Concluir</button>
                        <button type="button" disabled={quickStatusSavingId === appointment.id} onClick={() => void handleQuickStatus(appointment, "Adiada")} className="rounded-[13px] border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-xs font-black text-blue-700 transition disabled:opacity-50">Adiar</button>
                        <button type="button" disabled={quickStatusSavingId === appointment.id} onClick={() => void handleQuickStatus(appointment, "Atrasada")} className="rounded-[13px] border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-black text-amber-700 transition disabled:opacity-50">Atrasada</button>
                        <button type="button" disabled={quickStatusSavingId === appointment.id} onClick={() => void handleQuickStatus(appointment, "Não compareceu")} className="rounded-[13px] border border-amber-200 bg-white px-3.5 py-2.5 text-xs font-black text-amber-800 transition disabled:opacity-50">Não compareceu</button>
                      </>
                    )}
                    <button onClick={() => setModal({ mode: "patient", appointment })} className="inline-flex items-center gap-2 rounded-[13px] border border-hpsr-border bg-white px-3.5 py-2.5 text-xs font-black text-hpsr-wine transition hover:bg-[#fffdf9]"><UserRound size={14}/>Ver paciente</button>
                    {!isClosedAppointment && canManageAppointment(appointment) && (
                      <>
                        <button onClick={() => setModal({ mode: "reschedule", appointment })} className="inline-flex items-center gap-2 rounded-[13px] border border-hpsr-border bg-white px-3.5 py-2.5 text-xs font-black text-hpsr-wine transition hover:bg-[#fffdf9]"><Stethoscope size={14}/>Reagendar</button>
                        <button onClick={() => void handleDeleteAppointment(appointment)} className="inline-flex items-center gap-2 rounded-[13px] border border-rose-200 bg-white px-3.5 py-2.5 text-xs font-black text-rose-700 transition hover:bg-rose-50"><Trash2 size={14}/>Excluir</button>
                      </>
                    )}
                  </div>
                </div>
                </div>
                );
              })}
            </div>
          )}
          </div>
        </article>
      </section>

      {showCompletedAppointments && (
        <section className="rounded-[18px] border border-hpsr-border bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Histórico da agenda</p><h2 className="mt-1 text-lg font-black text-hpsr-text">Consultas finalizadas</h2><p className="mt-1 text-xs font-semibold text-hpsr-muted">Consultas realizadas, concluídas, canceladas ou marcadas como ausência não aparecem no calendário ativo.</p></div>
            <button type="button" onClick={() => setShowCompletedAppointments(false)} className="rounded-[11px] border border-hpsr-border bg-white px-3 py-2 text-xs font-black text-hpsr-wine">Ocultar histórico</button>
          </div>
          <div className="hpsr-touch-scroll max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {completedDoctorAppointments.length ? completedDoctorAppointments.map((appointment) => (
              <article key={`completed-${appointment.id}`} className="flex flex-col gap-3 rounded-[15px] border border-hpsr-border bg-[#fffdf9] p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-black", statusClasses(appointment.status))}>{appointment.status}</span><span className="text-xs font-semibold text-hpsr-muted">{appointment.date.split("-").reverse().join("/")} às {appointment.time}</span></div><p className="mt-2 truncate text-sm font-black text-hpsr-text">{appointment.patient}</p><p className="mt-1 truncate text-xs font-semibold text-hpsr-muted">{appointment.specialty} · {appointment.physician} · Passaporte {appointment.passport}</p></div>
                <div className="flex shrink-0 flex-wrap gap-2"><button type="button" onClick={() => setModal({ mode: "patient", appointment })} className="rounded-[11px] border border-hpsr-border bg-white px-3 py-2 text-xs font-black text-hpsr-wine">Ver dados</button><button type="button" onClick={() => setModal({ mode: "reschedule", appointment })} className="rounded-[11px] border border-hpsr-border bg-white px-3 py-2 text-xs font-black text-hpsr-wine">Editar/Reagendar</button><button type="button" onClick={() => void handleDeleteOldAppointment(appointment)} className="inline-flex items-center gap-1.5 rounded-[11px] border border-rose-200 bg-white px-3 py-2 text-xs font-black text-rose-700 transition hover:bg-rose-50"><Trash2 size={14} />Excluir</button></div>
              </article>
            )) : <div className="rounded-[15px] border border-dashed border-hpsr-border p-6 text-center text-sm text-hpsr-muted">Nenhuma consulta finalizada encontrada.</div>}
          </div>
        </section>
      )}

      <DeveloperAppointmentManager
        doctorId={currentUserProfile.id}
        doctorName={currentUserProfile.systemName}
        canViewAll={canViewAllMedicalSchedules}
        appointments={doctorAppointments.map(({ id, status, patient, passport }) => ({ id, status, patient, passport }))}
      />

      <ScheduleToolDialog
        mode={scheduleToolModal}
        onClose={() => setScheduleToolModal(null)}
        doctorId={currentUserProfile.id}
        doctorName={currentUserProfile.systemName}
        defaultSpecialty={currentUserProfile.specialty || "Clínico Geral"}
      />

      <AgendaModal modal={modal} onClose={() => setModal(null)} onChanged={loadAppointments} selectedDate={dateKey} appointments={doctorAppointments} />
    </div>
  );
}

function ScheduleToolDialog({
  mode,
  onClose,
  doctorId,
  doctorName,
  defaultSpecialty,
}: {
  mode: ScheduleToolModal;
  onClose: () => void;
  doctorId?: string;
  doctorName: string;
  defaultSpecialty: string;
}) {
  if (!mode) return null;

  const isFollowup = mode === "followup";

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center px-3 py-3 sm:px-5">
      <button type="button" onClick={onClose} aria-label="Fechar modal" className="hpsr-modal-backdrop" />

      <section className="relative flex max-h-[94vh] w-full max-w-[1180px] flex-col overflow-hidden rounded-[24px] border border-hpsr-border bg-[#fffaf5] shadow-[0_28px_80px_rgba(57,19,8,.28)]">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-hpsr-border bg-white px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[15px] bg-hpsr-wine text-white shadow-sm">
              {isFollowup ? <CalendarCheck2 size={20} /> : <CalendarClock size={20} />}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[.18em] text-hpsr-wineLight">Agenda clínica</p>
              <h2 className="mt-0.5 text-xl font-black text-hpsr-text">{isFollowup ? "Planejar acompanhamento" : "Publicar horários"}</h2>
              <p className="mt-1 text-sm leading-relaxed text-hpsr-muted">
                {isFollowup
                  ? "Monte uma sequência de acompanhamento para o paciente sem sair da visão principal da agenda."
                  : "Defina e publique os horários disponíveis para atendimento médico."}
              </p>
            </div>
          </div>

          <button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] border border-hpsr-border bg-white text-hpsr-muted transition hover:border-hpsr-wineLight hover:bg-[#fff8f0] hover:text-hpsr-wine" aria-label="Fechar">
            <X size={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5" style={{ scrollbarGutter: "stable" }}>
          {isFollowup ? (
            <ClinicalFollowupPlanner doctorId={doctorId} doctorName={doctorName} defaultSpecialty={defaultSpecialty} embedded />
          ) : (
            <DoctorAvailabilityManager doctorId={doctorId} doctorName={doctorName} defaultSpecialty={defaultSpecialty} embedded />
          )}
        </div>
      </section>
    </div>
  );
}

function AgendaModal({
  modal,
  onClose,
  onChanged,
  selectedDate,
  appointments,
}: {
  modal: ModalState;
  onClose: () => void;
  onChanged: () => Promise<void>;
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

      <div className="hpsr-modal-shell max-w-3xl overflow-visible">
        <div className="hpsr-modal-header flex items-start justify-between gap-4 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-hpsr-wine text-white shadow-[0_8px_20px_rgba(92,31,15,.18)]">
              <CalendarPlus2 size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-hpsr-wineLight">Agenda clínica</p>
              <h2 className="mt-0.5 text-xl font-black tracking-tight text-hpsr-text">{titleMap[modal.mode]}</h2>
              <p className="mt-1 text-sm font-medium leading-relaxed text-hpsr-muted">{descriptionMap[modal.mode]}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-hpsr-border bg-white text-hpsr-muted transition hover:border-hpsr-wineLight hover:bg-[#fff8f0] hover:text-hpsr-wine"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-visible bg-[#fffaf5] p-4 sm:p-5">
          {modal.mode === "new" && <NewAppointmentForm selectedDate={selectedDate} onClose={onClose} appointments={appointments} />}
          {modal.mode === "export" && <ExportReportForm onClose={onClose} />}
          {modal.mode === "open" && appointment && <OpenAttendanceForm appointment={appointment} onClose={onClose} onChanged={onChanged} />}
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
    void client.from("profiles").select("id,name,role,specialty,crm").eq("access_status", "Aprovado").order("name").then(({ data, error }) => {
      if (error) {
        setMessage({ type: "error", text: `Não foi possível carregar os médicos: ${error.message}` });
        return;
      }
      const canManageAllDoctors = currentUserProfile.systemRole === "Diretor Técnico / Dev" || currentUserProfile.accessLevel === "Total" || ["Diretora", "Vice Diretor", "Vice-Diretor"].some((role) => role === currentUserProfile.role || role === currentUserProfile.systemRole);
      const available = (data || [])
        .filter((row) => isClinicalProfessional(row))
        .map((row) => ({ id: String(row.id), name: String(row.name || "Médico"), specialty: String(row.specialty || "Clínico Geral") }))
        .filter((doctor) => canManageAllDoctors || doctor.id === currentUserProfile.id || doctor.name === currentUserProfile.systemName);
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
    const now = brazilIso();
    const { data: duplicate, error: duplicateError } = await client.from("patient_registry").select("name").eq("passport", normalizedPassport).maybeSingle();
    if (duplicateError) { setMessage({ type: "error", text: `Não foi possível verificar o passaporte: ${duplicateError.message}` }); return; }
    if (duplicate) { setMessage({ type: "error", text: `Passaporte já cadastrado para ${duplicate.name}. Abra o prontuário para editar ou substituir os dados com confirmação.` }); return; }
    const { error: registryError } = await client.from("patient_registry").insert({
      passport: normalizedPassport,
      name,
      age: patient.age || null,
      blood_type: patient.bloodType || null,
      updated_at: now,
    });
    if (registryError) {
      setMessage({ type: "error", text: registryError.code === "23505" ? "Este passaporte acabou de ser cadastrado por outro profissional." : `Não foi possível cadastrar o paciente: ${registryError.message}` });
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
    const duplicateAppointment = appointments.find((item) =>
      normalizeClinicalPassport(item.passport) === normalizeClinicalPassport(patientPassport) &&
      item.date === date && item.time === time && item.doctorId === (doctors.find((doctor) => doctor.name === physician)?.id || currentUserProfile.id) &&
      !["Cancelada", "Cancelado", "Realizada", "Concluída", "Não compareceu"].includes(item.status)
    );
    if (duplicateAppointment) {
      setMessage({ type: "error", text: "Já existe uma consulta ativa deste paciente com o mesmo médico, data e horário." });
      return;
    }
    const client = createClient();
    if (!client) return;
    const now = brazilIso();
    const id = `appointment-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const selectedDoctor = doctors.find((doctor) => doctor.name === physician);
    const payload = { patient: patientName, passport: patientPassport, specialty, physician, doctor: physician, doctorId: selectedDoctor?.id || currentUserProfile.id, date, preferredDate: date, time, source: "clinical_schedule", createdAt: now, updatedAt: now };
    const { error } = await client.from("appointments").insert({ id, passport: patientPassport, patient: patientName, status: "Agendada", payload, created_at: now, updated_at: now });
    if (error) { setMessage({ type: "error", text: error.message }); return; }
    setMessage({ type: "success", text: "Consulta salva e sincronizada com a visão geral e o prontuário." });
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-start gap-3 rounded-[16px] border border-hpsr-border bg-white px-4 py-3 text-sm leading-relaxed text-hpsr-muted">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] bg-[#f7ede3] text-hpsr-wine"><UsersRound size={16} /></div>
        <p><strong className="text-hpsr-text">Selecione paciente e médico.</strong> O cadastro rápido utiliza o mesmo registro compartilhado do Prontuário.</p>
      </div>

      <div className="grid gap-4 rounded-[18px] border border-hpsr-border bg-white p-4 sm:grid-cols-2 sm:p-5">
        <Field label="Paciente">
          <div className="flex gap-2">
            <StyledSelect className={inputClass} value={patientPassport} onChange={(event) => { const passport = event.target.value; const found = patients.find((item) => item.passport === passport); setPatientPassport(passport); setPatientName(found?.name || ""); if (found) selectPatient(found); }}>
              <option value="">Selecione o paciente</option>
              {patients.map((item) => <option key={item.passport} value={item.passport}>{item.name} · {item.passport}</option>)}
            </StyledSelect>
            <button type="button" onClick={() => setQuickOpen(true)} title="Registro rápido de paciente" aria-label="Registro rápido de paciente" className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[14px] border border-hpsr-border bg-white text-hpsr-wine hover:bg-[#fff8f0]"><UserPlus size={18}/></button>
          </div>
        </Field>
        <Field label="Médico responsável">
          <StyledSelect className={inputClass} value={physician} onChange={(event) => setPhysician(event.target.value)}>
            <option value="">Selecione o médico</option>
            {doctors.map((doctor) => <option key={doctor.id} value={doctor.name}>{doctor.name}</option>)}
          </StyledSelect>
        </Field>
        <Field label="Especialidade">
          <StyledSelect className={inputClass} value={specialty} onChange={(event) => setSpecialty(event.target.value)}>
            {specialties.map((item) => <option key={item}>{item}</option>)}
          </StyledSelect>
        </Field>
        <Field label="Data"><input className={inputClass} type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Field>
        <Field label="Horário de Brasília"><input className={inputClass} type="time" value={time} onChange={(event) => setTime(event.target.value)} /></Field>
        <div className="hidden sm:block" />
        <div className="sm:col-span-2">
          <Field label="Observações"><textarea className={`${inputClass} min-h-[105px] resize-y py-3 leading-relaxed`} rows={3} placeholder="Motivo da consulta, orientação interna ou observações." /></Field>
        </div>
      </div>
      {message && <ValidationMessage type={message.type} text={message.text} />}
      <ModalActions onClose={onClose} actionLabel="Validar e salvar" onConfirm={handleSave} />

      {quickOpen && <div className="fixed inset-0 z-[1000] grid place-items-center bg-[#1f0805]/60 p-4">
        <div className="w-full max-w-[520px] overflow-hidden rounded-[22px] border border-hpsr-border bg-[#fffaf4] shadow-2xl">
          <div className="flex items-start justify-between border-b border-hpsr-border bg-white px-5 py-4"><div className="flex gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-hpsr-border text-hpsr-wine"><UserPlus size={19}/></div><div><h3 className="font-black text-hpsr-text">Registro rápido de paciente</h3><p className="text-xs font-semibold text-hpsr-muted">Preencha apenas os dados necessários para esta consulta.</p></div></div><button type="button" onClick={() => setQuickOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-hpsr-wine text-white"><X size={18}/></button></div>
          <div className="grid gap-3 p-5 sm:grid-cols-2"><label className="sm:col-span-2 text-[10px] font-black uppercase tracking-[.12em] text-hpsr-muted">Nome completo<input className={`${inputClass} mt-1.5`} value={quickPatient.name} onChange={(e)=>setQuickPatient((c)=>({...c,name:e.target.value}))}/></label><label className="text-[10px] font-black uppercase tracking-[.12em] text-hpsr-muted">Documento / Passaporte<input className={`${inputClass} mt-1.5`} value={quickPatient.passport} onChange={(e)=>setQuickPatient((c)=>({...c,passport:e.target.value}))}/></label><label className="text-[10px] font-black uppercase tracking-[.12em] text-hpsr-muted">Idade<input className={`${inputClass} mt-1.5`} value={quickPatient.age} onChange={(e)=>setQuickPatient((c)=>({...c,age:e.target.value}))}/></label><label className="sm:col-span-2 text-[10px] font-black uppercase tracking-[.12em] text-hpsr-muted">Tipo sanguíneo<StyledSelect className={`${inputClass} mt-1.5`} value={quickPatient.bloodType} onChange={(e)=>setQuickPatient((c)=>({...c,bloodType:e.target.value}))}><option value="">Selecione</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option></StyledSelect></label></div>
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
          <StyledSelect className={inputClass} defaultValue="todos">
            <option value="todos">Todos</option>
            <option>Agendada</option>
            <option>Concluída</option>
            <option>Cancelada</option>
            <option>Não compareceu</option>
          </StyledSelect>
        </Field>
        <Field label="Formato">
          <StyledSelect className={inputClass} defaultValue="png">
            <option value="png">PNG / imagem</option>
            <option value="csv">CSV</option>
            <option value="xlsx">Planilha</option>
          </StyledSelect>
        </Field>
      </div>

      <div className="rounded-2xl border border-hpsr-border bg-[#fcf6ee] p-3.5 text-sm leading-relaxed text-hpsr-muted">
        O relatório será gerado futuramente com as consultas filtradas, horários em Brasília e identificação do Hospital São Rafael.
      </div>

      <ModalActions onClose={onClose} actionLabel="Gerar relatório" />
    </div>
  );
}

function OpenAttendanceForm({ appointment, onClose, onChanged }: { appointment: Appointment; onClose: () => void; onChanged: () => Promise<void> }) {
  const [status, setStatus] = useState("em_atendimento");
  const [recordType, setRecordType] = useState("consulta");
  const [summary, setSummary] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const { profile: currentUserProfile } = useCurrentUserProfile();

  const statusMap: Record<string, string> = {
    agendada: "Agendada",
    confirmada: "Confirmada",
    em_atendimento: "Em atendimento",
    realizada: "Realizada",
    ausente: "Não compareceu",
    cancelada: "Cancelada",
  };

  async function handleSave() {
    const nextStatus = statusMap[status];
    if (!nextStatus) {
      setMessage({ type: "error", text: "Selecione um status válido para o atendimento." });
      return;
    }

    const client = createClient();
    if (!client) {
      setMessage({ type: "error", text: "Não foi possível acessar o banco de dados." });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const { data: currentRow, error: readError } = await client
        .from("appointments")
        .select("payload,status")
        .eq("id", appointment.id)
        .maybeSingle();
      if (readError) throw readError;
      if (!currentRow) throw new Error("A consulta não foi encontrada no banco de dados.");

      const now = brazilIso();
      const currentPayload = (currentRow.payload || {}) as Record<string, unknown>;
      const payload = {
        ...currentPayload,
        attendanceStatus: nextStatus,
        attendanceRecordType: recordType,
        attendanceSummary: summary.trim() || null,
        attendanceUpdatedAt: now,
        attendanceUpdatedBy: currentUserProfile.systemName,
        previousStatus: currentRow.status,
        updatedAt: now,
      };

      const { data: updatedAppointment, error: updateError } = await client
        .from("appointments")
        .update({ status: nextStatus, payload, updated_at: now })
        .eq("id", appointment.id)
        .select("id,status,payload")
        .maybeSingle();
      if (updateError) throw updateError;
      if (!updatedAppointment || updatedAppointment.status !== nextStatus) {
        throw new Error("O banco não confirmou a alteração do status. Verifique as permissões e tente novamente.");
      }

      const slotId = String(currentPayload.slotId || "");
      if (slotId) {
        const slotStatus = nextStatus === "Realizada" ? "Concluído" : nextStatus === "Não compareceu" ? "Ausente" : nextStatus;
        await client.from("clinical_appointment_slots").update({ status: slotStatus, updated_at: now }).eq("id", slotId);
      }

      const occurrenceId = String(currentPayload.occurrenceId || "");
      if (occurrenceId) {
        const occurrenceStatus = nextStatus === "Realizada" ? "Consulta realizada" : nextStatus;
        await client.from("clinical_followup_occurrences").update({ status: occurrenceStatus, updated_at: now }).eq("id", occurrenceId);
      }

      await onChanged();
      setMessage({ type: "success", text: `Status alterado para “${nextStatus}” e sincronizado no sistema.` });
      window.setTimeout(() => onClose(), 500);
    } catch (caught) {
      setMessage({ type: "error", text: caught instanceof Error ? caught.message : "Não foi possível atualizar o atendimento." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-3">
      <AppointmentSummary appointment={appointment} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Status do atendimento">
          <StyledSelect className={inputClass} value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="agendada">Agendada</option>
            <option value="confirmada">Confirmada</option>
            <option value="em_atendimento">Em atendimento</option>
            <option value="realizada">Consulta realizada</option>
            <option value="ausente">Paciente não compareceu</option>
            <option value="cancelada">Cancelada</option>
          </StyledSelect>
        </Field>
        <Field label="Tipo de registro">
          <StyledSelect className={inputClass} value={recordType} onChange={(event) => setRecordType(event.target.value)}>
            <option value="consulta">Consulta clínica</option>
            <option value="retorno">Retorno</option>
            <option value="triagem">Triagem</option>
          </StyledSelect>
        </Field>
      </div>

      <Field label="Resumo do atendimento">
        <textarea className={inputClass} rows={4} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Registre queixa principal, conduta inicial ou observação do atendimento." />
      </Field>

      {message && <ValidationMessage type={message.type} text={message.text} />}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onClose} disabled={saving} className="rounded-[14px] border border-hpsr-border bg-white px-4 py-3 text-xs font-black text-hpsr-text disabled:opacity-50">Cancelar</button>
        <button type="button" onClick={() => void handleSave()} disabled={saving} className="rounded-[14px] bg-hpsr-wine px-4 py-3 text-xs font-black text-white disabled:opacity-50">{saving ? "Salvando..." : "Salvar atendimento"}</button>
      </div>
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
    const payload = { ...((row?.payload || {}) as Record<string, unknown>), proposedDate: date, proposedTime: time, rescheduleReason: reason || notes || "Reagendamento solicitado pelo médico", rescheduleNotes: notes, physician: appointment.physician, doctor: appointment.physician, updatedAt: brazilIso() };
    const { error } = await client.from("appointments").update({ status: "Reagendamento solicitado", payload, updated_at: brazilIso() }).eq("id", appointment.id);
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
          <StyledSelect className={inputClass} value={reason} onChange={(event) => setReason(event.target.value)}>
            <option value="" disabled>Selecione</option>
            <option>Pedido do paciente</option>
            <option>Indisponibilidade médica</option>
            <option>Reorganização da agenda</option>
            <option>Outro</option>
          </StyledSelect>
        </Field>
        <Field label="Comunicação">
          <StyledSelect className={inputClass} defaultValue="pendente">
            <option value="pendente">Aviso pendente</option>
            <option value="avisado">Paciente avisado</option>
          </StyledSelect>
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
