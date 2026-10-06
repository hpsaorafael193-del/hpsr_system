"use client";

import { brazilIso } from "@/lib/brazil-datetime";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  CalendarDays,
  CalendarClock,
  Clock3,
  CalendarPlus2,
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  ClipboardPlus,
  Download,
  FileClock,
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
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase";
import { useCurrentUserProfile } from "@/components/auth/CurrentUserProfileProvider";
import { hpsrConfirm, hpsrAlert } from "@/components/ui/HpsrDialogProvider";
import { usePatientSelection } from "@/components/patients/PatientSelectionProvider";
import { specialties } from "@/data/mock";
import { findSpecialtyScheduleConflict, normalizeSpecialty } from "@/data/appointment-rules";
import { isClinicalProfessional, normalizeClinicalPassport } from "@/lib/clinical-scheduling";
import { clinicalSpecialtyOptionsForStaffRole } from "@/lib/staff-specialties";

const BRAZIL_TIMEZONE = "America/Sao_Paulo";

const weekdayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

type Appointment = { id: string; patient: string; passport: string; specialty: string; physician: string; doctorId: string; date: string; time: string; status: string; managementStatus?: string; managementNote?: string };

type AvailabilitySlot = {
  id: string;
  seriesId: string | null;
  doctorId: string;
  doctorName: string;
  specialty: string;
  startsAt: string;
  endsAt: string;
  status: string;
  patientName: string | null;
  patientPassport: string | null;
  appointmentId: string | null;
};


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

type ScheduleToolModal = "availability" | null;

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
    case "Consulta realizada":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Em atendimento":
    case "Paciente compareceu":
      return "bg-violet-50 text-violet-700 border-violet-200";
    case "Cancelada":
    case "Consulta cancelada":
    case "Sem resposta":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "Não compareceu":
    case "Paciente faltou":
    case "Atrasada":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "Adiada":
    case "Paciente pediu adiamento":
    case "Médico sem disponibilidade":
    case "Reagendada":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "Confirmada":
    case "Paciente confirmou":
      return "bg-sky-50 text-sky-700 border-sky-200";
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
  const openNewAppointmentFromShortcut = searchParams.get("new") === "1";
  const { profile: currentUserProfile } = useCurrentUserProfile();
  const isDirector = ["Diretora", "Diretora Geral", "Vice Diretor", "Vice-Diretor", "Vice Diretor / Dev", "Vice-Diretor / Dev", "Vice Diretor/Dev", "Vice-Diretor/Dev"].some((role) => role === currentUserProfile.role || role === currentUserProfile.systemRole);
  const canViewAllMedicalSchedules = isDirector;
  const [scheduledAppointments, setScheduledAppointments] = useState<Appointment[]>([]);
  const brasiliaToday = useMemo(() => getBrasiliaToday(), []);
  const [currentMonth, setCurrentMonth] = useState(
    new Date(brasiliaToday.getFullYear(), brasiliaToday.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(brasiliaToday);
  const [modal, setModal] = useState<ModalState>(null);
  const newAppointmentShortcutHandled = useRef(false);
  const [scheduleToolModal, setScheduleToolModal] = useState<ScheduleToolModal>(null);
  const [appointmentSearch, setAppointmentSearch] = useState("");
  const [scheduleScope, setScheduleScope] = useState<"mine" | "all">("mine");
  const [showCompletedAppointments, setShowCompletedAppointments] = useState(false);
  const [completedSearch, setCompletedSearch] = useState("");
  const [quickStatusSavingId, setQuickStatusSavingId] = useState<string | null>(null);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityBusyId, setAvailabilityBusyId] = useState("");
  const [availabilityStatusFilter, setAvailabilityStatusFilter] = useState<"all" | "available" | "reserved">("all");

  const dateKey = toDateKey(selectedDate);

  const loadAppointments = useCallback(async () => {
    const client = createClient();
    if (!client) return;
    const [{ data, error }, { data: doctorProfiles }] = await Promise.all([
      client
        .from("appointments")
        .select("id,passport,patient,status,payload,created_at")
        .in("status", ["Aceita", "Agendada", "Confirmada", "Reagendamento aceito", "Em atendimento", "Adiada", "Atrasada", "Realizada", "Concluída", "Não compareceu", "Cancelada"])
        .order("created_at", { ascending: false })
        .limit(400),
      client.from("profiles").select("id,name").eq("access_status", "Aprovado"),
    ]);
    if (error) throw error;
    const doctorNameById = new Map<string, string>((doctorProfiles || []).map((item: any) => [String(item.id || ""), String(item.name || "").trim()]));
    setScheduledAppointments((data || [])
      .filter((row: any) => ["Aceita", "Agendada", "Confirmada", "Reagendamento aceito", "Em atendimento", "Adiada", "Atrasada", "Realizada", "Concluída", "Não compareceu", "Cancelada"].includes(String(row.status)))
      .map((row: any) => {
        const payload = (row.payload || {}) as Record<string, unknown>;
        const doctorId = String(payload.doctorId || payload.doctor_id || payload.acceptedById || "");
        return {
          id: String(row.id),
          patient: String(row.patient || payload.patient || "Paciente"),
          passport: String(row.passport || payload.passport || ""),
          specialty: String(payload.specialty || "Sem especialidade"),
          physician: doctorNameById.get(doctorId) || String(payload.physician || payload.doctor || payload.acceptedByName || "A definir"),
          doctorId,
          date: String(row.status === "Reagendamento aceito" ? payload.proposedDate || payload.preferredDate || payload.date || "" : payload.preferredDate || payload.date || ""),
          time: String(row.status === "Reagendamento aceito" ? payload.proposedTime || payload.time || "09:00" : payload.time || payload.preferredTime || (payload.preferredPeriod === "Tarde" ? "14:00" : payload.preferredPeriod === "Noite" ? "19:00" : "09:00")),
          status: String(row.status),
          managementStatus: String(payload.appointmentManagementStatus || payload.attendanceSituation || ""),
          managementNote: String(payload.appointmentManagementNote || payload.attendanceSummary || ""),
        };
      }));

    if (currentUserProfile.id) {
      setAvailabilityLoading(true);
      let slotQuery = client
        .from("clinical_appointment_slots")
        .select("id,series_id,doctor_id,doctor_name,specialty,starts_at,ends_at,status,patient_name,patient_passport,appointment_id")
        .order("starts_at", { ascending: false })
        .limit(2400);
      if (!canViewAllMedicalSchedules) slotQuery = slotQuery.eq("doctor_id", currentUserProfile.id);
      const { data: slotData, error: slotError } = await slotQuery;
      if (slotError) {
        setAvailabilitySlots([]);
        setAvailabilityLoading(false);
      } else setAvailabilitySlots(((slotData || []) as any[]).map((row) => ({
        id: String(row.id),
        seriesId: row.series_id ? String(row.series_id) : null,
        doctorId: String(row.doctor_id || ""),
        doctorName: doctorNameById.get(String(row.doctor_id || "")) || String(row.doctor_name || currentUserProfile.systemName || "Médico"),
        specialty: String(row.specialty || "Sem especialidade"),
        startsAt: String(row.starts_at || ""),
        endsAt: String(row.ends_at || ""),
        status: String(row.status || "Disponível"),
        patientName: row.patient_name ? String(row.patient_name) : null,
        patientPassport: row.patient_passport ? String(row.patient_passport) : null,
        appointmentId: row.appointment_id ? String(row.appointment_id) : null,
      })));
      setAvailabilityLoading(false);
    }
  }, [currentUserProfile.id, canViewAllMedicalSchedules, currentUserProfile.systemName]);

  useEffect(() => {
    const client = createClient();
    if (!client) return;
    void loadAppointments();
    const refreshVisibleAgenda = () => {
      if (document.visibilityState === "visible") void loadAppointments();
    };
    const channel = client
      .channel("agenda-clinica-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => void loadAppointments())
      .on("postgres_changes", { event: "*", schema: "public", table: "clinical_appointment_slots" }, () => void loadAppointments())
      .subscribe();
    window.addEventListener("focus", refreshVisibleAgenda);
    document.addEventListener("visibilitychange", refreshVisibleAgenda);
    return () => {
      window.removeEventListener("focus", refreshVisibleAgenda);
      document.removeEventListener("visibilitychange", refreshVisibleAgenda);
      void client.removeChannel(channel);
    };
  }, [loadAppointments]);

  useEffect(() => {
    if (!openNewAppointmentFromShortcut || newAppointmentShortcutHandled.current) return;
    newAppointmentShortcutHandled.current = true;
    setModal({ mode: "new" });
  }, [openNewAppointmentFromShortcut]);

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
    .sort((a, b) => a.specialty.localeCompare(b.specialty, "pt-BR") || `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  const filteredCompletedDoctorAppointments = completedDoctorAppointments.filter((appointment) => {
    const query = completedSearch.trim().toLocaleLowerCase("pt-BR");
    if (!query) return true;
    return [appointment.patient, appointment.passport, appointment.specialty, appointment.physician, appointment.status]
      .some((value) => value.toLocaleLowerCase("pt-BR").includes(query));
  });

  const appointmentsOnSelectedDay = activeDoctorAppointments
    .filter((appointment) => appointment.date === dateKey)
    .sort((a, b) => a.time.localeCompare(b.time));

  const visibleAppointmentsOnSelectedDay = appointmentsOnSelectedDay.filter((appointment) => {
    const query = appointmentSearch.trim().toLocaleLowerCase("pt-BR");
    if (!query) return true;
    return [appointment.patient, appointment.passport, appointment.specialty, appointment.physician, appointment.status, appointment.time]
      .some((value) => value.toLocaleLowerCase("pt-BR").includes(query));
  }).sort((left, right) => {
    const specialtyDifference = left.specialty.localeCompare(right.specialty, "pt-BR");
    const sectionDifference = appointmentSectionOrder[appointmentSection(left.status)] - appointmentSectionOrder[appointmentSection(right.status)];
    return specialtyDifference || sectionDifference || left.time.localeCompare(right.time);
  });



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
      cancellationReason: "Consulta excluída da Agenda do Médico",
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

  async function removePublishedSlot(slot: AvailabilitySlot) {
    if (slotVisualState(slot) === "Ocupado") {
      await hpsrAlert("Este horário está ocupado por um paciente. Abra a consulta correspondente para reagendar ou cancelar sem perder o vínculo clínico.", "Horário ocupado");
      return;
    }
    const confirmed = await hpsrConfirm(
      `Deseja remover o horário de ${slotTime(slot.startsAt)} em ${slotDateKey(slot.startsAt).split("-").reverse().join("/")}?`,
      "Remover horário publicado",
    );
    if (!confirmed) return;
    const client = createClient();
    if (!client) return;
    setAvailabilityBusyId(slot.id);
    try {
      const { error: deleteError } = await client.from("clinical_appointment_slots").delete().eq("id", slot.id).eq("doctor_id", currentUserProfile.id);
      if (deleteError) throw deleteError;
      await loadAppointments();
    } catch (caught) {
      await hpsrAlert(caught instanceof Error ? caught.message : "Não foi possível remover o horário.", "Falha ao remover horário");
    } finally {
      setAvailabilityBusyId("");
    }
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

  const selectedDateFullLabel = new Intl.DateTimeFormat("pt-BR", {
    timeZone: BRAZIL_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(selectedDate);

  const appointmentById = useMemo(() => new Map(scheduledAppointments.map((item) => [item.id, item])), [scheduledAppointments]);

  function slotDateKey(value: string) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-CA", { timeZone: BRAZIL_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  }

  function slotTime(value: string) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("pt-BR", { timeZone: BRAZIL_TIMEZONE, hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
  }

  function slotVisualState(slot: AvailabilitySlot) {
    const appointment = slot.appointmentId ? appointmentById.get(slot.appointmentId) : undefined;
    const appointmentStatus = appointment?.status || "";
    if (["Realizada", "Concluída"].includes(appointmentStatus)) return "Concluído";
    if (appointmentStatus === "Não compareceu") return "Não compareceu";
    if (["Cancelada", "Recusada"].includes(appointmentStatus) || ["Cancelado", "Encerrado"].includes(slot.status)) return "Encerrado";
    if (slot.status === "Bloqueado") return "Bloqueado";
    if (slot.status === "Ocupado" || Boolean(slot.appointmentId)) return "Ocupado";
    return "Livre";
  }

  const todayKey = toDateKey(brasiliaToday);
  const publishedSlots = useMemo(() => availabilitySlots
    .filter((slot) => viewingAllSchedules || slot.doctorId === currentUserProfile.id)
    .map((slot) => {
      const appointment = slot.appointmentId ? appointmentById.get(slot.appointmentId) : undefined;
      return {
        ...slot,
        dateKey: slotDateKey(slot.startsAt),
        visualState: slotVisualState(slot),
        appointment,
        patientDisplay: appointment?.patient || slot.patientName || "—",
        passportDisplay: appointment?.passport || slot.patientPassport || "",
        timeRange: `${slotTime(slot.startsAt)} - ${slotTime(slot.endsAt)}`,
      };
    })
    .filter((slot) => Boolean(slot.dateKey) && slot.dateKey >= todayKey)
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey) || a.startsAt.localeCompare(b.startsAt) || a.doctorName.localeCompare(b.doctorName, "pt-BR")), [availabilitySlots, appointmentById, viewingAllSchedules, currentUserProfile.id, todayKey]);

  const filteredPublishedSlots = publishedSlots.filter((item) => availabilityStatusFilter === "all" ? true : availabilityStatusFilter === "reserved" ? item.visualState === "Ocupado" : item.visualState === "Livre");

  return (
    <div className="hpsr-page hpsr-schedule-page gap-2.5 xl:h-[calc(100dvh-2.4rem)] xl:min-h-0 xl:max-h-[calc(100dvh-2.4rem)] xl:overflow-hidden">
      <PageHeader
        schedule
        compact
        eyebrow="Agendamentos"
        title="Agenda do médico"
        description="Organize suas consultas e publique seus horários."
      />

      <section className="shrink-0 rounded-[15px] border border-[#8b594c] bg-[linear-gradient(110deg,#47231f_0%,#65352f_62%,#7a493e_100%)] px-3 py-2 text-white shadow-[0_8px_20px_rgba(42,7,0,.13)] sm:px-3.5 sm:py-2.5">
        <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-[linear-gradient(135deg,#7a2e19_0%,#512015_100%)] text-white shadow-[0_8px_20px_rgba(92,31,15,.16)]">
              <CalendarDays size={16} />
            </div>
            <div className="min-w-0">
              <h1 className="text-[clamp(1.25rem,1.8vw,1.65rem)] font-black tracking-tight text-white">Agenda do médico</h1>
              <p className="mt-0.5 text-xs text-white/75">Organize suas consultas e publique seus horários.</p>
              {canViewAllMedicalSchedules && (
                <div className="mt-1 inline-flex rounded-[10px] border border-white/20 bg-white/10 p-0.5 backdrop-blur-sm">
                  <button type="button" onClick={() => setScheduleScope("mine")} className={cn("rounded-[8px] px-2.5 py-1 text-[11px] font-black transition", scheduleScope === "mine" ? "bg-[#f2dfd4] text-[#4a160f]" : "text-white/75 hover:bg-white/10 hover:text-white")}>Minha agenda</button>
                  <button type="button" onClick={() => setScheduleScope("all")} className={cn("rounded-[8px] px-2.5 py-1 text-[11px] font-black transition", scheduleScope === "all" ? "bg-[#f2dfd4] text-[#4a160f]" : "text-white/75 hover:bg-white/10 hover:text-white")}>Todos os profissionais</button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-1.5">
            <button onClick={() => setModal({ mode: "new" })} className="inline-flex min-h-[34px] items-center justify-center gap-1.5 rounded-[10px] border border-white/25 bg-white/12 px-3 text-xs font-black text-white shadow-sm transition hover:bg-white/20">
              <CalendarPlus2 size={15} /> Agendar consulta
            </button>
            <button type="button" onClick={() => setScheduleToolModal("availability")} className="inline-flex min-h-[34px] items-center justify-center gap-1.5 rounded-[10px] border border-[#f0d7c9]/40 bg-[#f0d7c9] px-3 text-xs font-black text-[#4b160f] shadow-[0_10px_24px_rgba(42,7,0,.18)] transition hover:brightness-105">
              <Clock3 size={15} /> Publicar horários
            </button>
          </div>
        </div>
      </section>

      <section className="grid shrink-0 items-stretch gap-2.5 xl:grid-cols-[minmax(300px,470px)_minmax(0,1fr)]">
        <article className="h-full overflow-hidden rounded-[16px] border border-[#d2b5a4] bg-[#f3e7dc] shadow-[0_6px_18px_rgba(82,48,27,.05)]">
          <div className="border-b border-[#dcc1b1] bg-[linear-gradient(135deg,#ead5c8,#f2e5dc)] px-3.5 py-2.5 sm:px-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-[11px] bg-[linear-gradient(135deg,#672614,#2a0700)] text-white shadow-sm"><CalendarDays size={18} /></div>
                <div>
                  <h2 className="text-xl font-black text-hpsr-text capitalize">{monthLabel(currentMonth)}</h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" aria-label="Mês anterior" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="grid h-9 w-9 place-items-center rounded-[11px] border border-[#d5b9a9] bg-[#f3e7dc] text-hpsr-wine transition hover:bg-[#edd9cc]"><ChevronLeft size={16} /></button>
                <button type="button" onClick={() => { const today = getBrasiliaToday(); setSelectedDate(today); setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1)); }} className="rounded-[11px] border border-[#d5b9a9] bg-[#f7ebe2] px-3 py-2 text-xs font-black text-hpsr-wine transition hover:bg-[#f6e9e0]">Hoje</button>
              </div>
            </div>
          </div>
          <div className="px-3.5 py-3 sm:px-4 sm:py-3.5">
            <div className="grid grid-cols-7 gap-y-2 text-center">
              {weekdayLabels.map((day) => <span key={day} className="py-1 text-[11px] font-black uppercase tracking-[.12em] text-hpsr-muted">{day}</span>)}
              {monthDays.map(({ date, currentMonth: isCurrentMonth }) => {
                const key = toDateKey(date);
                const isSelected = key === dateKey;
                const isToday = key === toDateKey(brasiliaToday);
                const hasAppointments = daysWithAppointments.has(key);
                return (
                  <button key={key} type="button" onClick={() => setSelectedDate(date)} className={cn("relative mx-auto flex h-10 w-10 flex-col items-center justify-center gap-[2px] rounded-[12px] text-lg font-semibold transition", isCurrentMonth ? "text-hpsr-text" : "text-[#c7b1a2]", isSelected ? "bg-[linear-gradient(135deg,#672614_0%,#2a0700_100%)] text-white shadow-[0_10px_18px_rgba(42,7,0,.20)]" : "hover:bg-[#f5e4da]", isToday && !isSelected && "border border-[#cb9d88]")}>
                    <span className="leading-none">{date.getDate()}</span>
                    <span aria-hidden="true" className={cn("h-1 w-1 rounded-full", hasAppointments ? (isSelected ? "bg-white" : "bg-hpsr-wineLight") : "bg-transparent")} />
                  </button>
                );
              })}
            </div>
          </div>
        </article>

        <article className="h-full overflow-hidden rounded-[16px] border border-[#d2b5a4] bg-[#f3e7dc] shadow-[0_6px_18px_rgba(82,48,27,.05)]">
          <div className="flex flex-col gap-3 border-b border-[#dcc1b1] bg-[linear-gradient(135deg,#ead5c8,#f2e5dc)] px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-[11px] bg-[linear-gradient(135deg,#672614,#2a0700)] text-white shadow-sm"><CalendarClock size={16} /></div>
              <div>
                <h2 className="text-xl font-black text-hpsr-text">Consultas do dia</h2>
                <p className="mt-0.5 text-sm text-hpsr-muted capitalize">{selectedDateFullLabel}</p>
              </div>
            </div>
            <span className="inline-flex h-8 items-center rounded-full border border-[#d3b3a1] bg-[#f8eee7] px-3 text-xs font-black text-hpsr-wine">{visibleAppointmentsOnSelectedDay.length} consulta{visibleAppointmentsOnSelectedDay.length === 1 ? '' : 's'}</span>
          </div>
          <div className="overflow-x-auto border-t border-[#d6b9a8]">
            <table className="min-w-full bg-[#f3e7dc]">
              <thead className="bg-[linear-gradient(135deg,#e2c9ba,#ecddd3)]">
                <tr>
                  {['Horário','Paciente','Especialidade','Status','Ações'].map((label) => <th key={label} className="px-3.5 py-2.5 text-left text-[11px] font-black uppercase tracking-[.12em] text-hpsr-wine">{label}</th>)}
                </tr>
              </thead>
              <tbody>
                {visibleAppointmentsOnSelectedDay.length ? visibleAppointmentsOnSelectedDay.map((appointment) => (
                  <tr key={appointment.id} className="border-t border-[#d8baaa] bg-[#f3e7dc] transition hover:bg-[#edd9cc]">
                    <td className="px-3.5 py-3 text-[1rem] font-black text-hpsr-text">{appointment.time}</td>
                    <td className="px-3.5 py-3 text-base font-semibold text-hpsr-text">{appointment.patient}</td>
                    <td className="px-3.5 py-3 text-base text-hpsr-text">{appointment.specialty}</td>
                    <td className="px-3.5 py-3"><span className={cn("inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-black", statusClasses(appointment.managementStatus || appointment.status))}><span className="h-2.5 w-2.5 rounded-full bg-current opacity-80" />{appointment.managementStatus || appointment.status}</span></td>
                    <td className="px-3.5 py-3">
                      <div className="flex items-center gap-0">
                        <button type="button" onClick={() => setModal({ mode: "open", appointment })} className="inline-flex min-h-[44px] items-center gap-2 rounded-l-[14px] border border-[#d2b2a1] bg-[#f7ebe2] px-4 text-sm font-black text-hpsr-wine transition hover:bg-[#edd9cc]"><ClipboardPlus size={14} />Gerenciar</button>
                        <button type="button" onClick={() => setModal({ mode: "patient", appointment })} className="inline-flex min-h-[44px] items-center rounded-r-[14px] border border-l-0 border-[#bd927c] bg-[#f7ebe2] px-3 text-hpsr-wine transition hover:bg-[#edd9cc]"><ChevronRight size={16} /></button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="px-5 py-14 text-center text-sm font-semibold text-hpsr-muted">Nenhuma consulta agendada para esta data.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[16px] border border-[#d2b5a4] bg-[#f3e7dc] shadow-[0_6px_18px_rgba(82,48,27,.05)]">
        <div className="shrink-0 flex flex-col gap-2.5 border-b border-[#dcc1b1] bg-[linear-gradient(135deg,#e8d2c5,#f0e2d8)] px-3.5 py-2.5 sm:px-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-[11px] bg-[linear-gradient(135deg,#672614,#2a0700)] text-white shadow-sm"><Clock3 size={15} /></div>
            <div>
              <h2 className="text-lg font-black text-hpsr-text">Horários publicados</h2>
              <p className="mt-0.5 text-sm text-hpsr-muted">{viewingAllSchedules ? "Próximos horários publicados pelos profissionais, com pacientes, especialidades e situação de cada vaga." : "Próximos horários que você publicou, com pacientes, especialidades e situação de cada vaga."}</p>
            </div>
          </div>
          <div className="inline-flex overflow-hidden rounded-[10px] border border-[#d3b3a1] bg-[#f3e7dc] shadow-sm">
            <button type="button" onClick={() => setAvailabilityStatusFilter('all')} className={cn("px-3 py-2 text-xs font-black transition", availabilityStatusFilter === 'all' ? "bg-hpsr-wine text-white" : "text-hpsr-wine hover:bg-[#f1dfd4]")}>Todos ({publishedSlots.length})</button>
            <button type="button" onClick={() => setAvailabilityStatusFilter('available')} className={cn("border-l border-[#d3b3a1] px-3 py-2 text-xs font-black transition", availabilityStatusFilter === 'available' ? "bg-hpsr-wine text-white" : "text-hpsr-wine hover:bg-[#f1dfd4]")}>Livres ({publishedSlots.filter((item) => item.visualState === 'Livre').length})</button>
            <button type="button" onClick={() => setAvailabilityStatusFilter('reserved')} className={cn("border-l border-[#d3b3a1] px-3 py-2 text-xs font-black transition", availabilityStatusFilter === 'reserved' ? "bg-hpsr-wine text-white" : "text-hpsr-wine hover:bg-[#f1dfd4]")}>Ocupados ({publishedSlots.filter((item) => item.visualState === 'Ocupado').length})</button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto border-t border-[#d6b9a8] bg-[#f3e7dc] [scrollbar-gutter:stable]">
            <table className="min-w-full bg-[#f3e7dc]">
              <thead className="sticky top-0 z-10 bg-[linear-gradient(135deg,#e2c9ba,#ecddd3)]">
                <tr>
                  {['Data','Horário', ...(viewingAllSchedules ? ['Médico'] : []), 'Especialidade','Paciente','Status','Ações'].map((label) => <th key={label} className="px-3.5 py-2.5 text-left text-[11px] font-black uppercase tracking-[.12em] text-hpsr-wine">{label}</th>)}
                </tr>
              </thead>
              <tbody>
                {filteredPublishedSlots.length ? filteredPublishedSlots.map((slot) => (
                  <tr key={slot.id} className="border-t border-[#d8baaa] bg-[#f3e7dc] transition hover:bg-[#edd9cc]">
                    <td className="px-3.5 py-3 text-sm font-black text-hpsr-text">{slot.dateKey.split("-").reverse().join("/")}</td>
                    <td className="px-3.5 py-3 text-sm font-black text-hpsr-text">{slot.timeRange}</td>
                    {viewingAllSchedules && <td className="px-3.5 py-3"><p className="text-sm font-black text-hpsr-text">{slot.doctorName}</p></td>}
                    <td className="px-3.5 py-3 text-sm text-hpsr-text">{slot.specialty}</td>
                    <td className="px-3.5 py-3"><p className="text-sm font-black text-hpsr-text">{slot.patientDisplay}</p>{slot.passportDisplay && <p className="mt-0.5 text-[11px] font-semibold text-hpsr-muted">Passaporte {slot.passportDisplay}</p>}</td>
                    <td className="px-3.5 py-3"><span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black", slot.visualState === 'Livre' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : slot.visualState === 'Ocupado' ? 'border-amber-200 bg-amber-50 text-amber-700' : slot.visualState === 'Concluído' ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-zinc-200 bg-zinc-50 text-zinc-700')}><span className="h-2 w-2 rounded-full bg-current opacity-80" />{slot.visualState}</span></td>
                    <td className="px-3.5 py-3">
                      {slot.appointment ? (
                        <div className="flex items-center gap-0"><button type="button" onClick={() => setModal({ mode: 'open', appointment: slot.appointment! })} className="inline-flex min-h-[36px] items-center gap-1.5 rounded-l-[11px] border border-[#d2b2a1] bg-[#f7ebe2] px-3 text-xs font-black text-hpsr-wine transition hover:bg-[#edd9cc]"><ClipboardPlus size={13} />Consulta</button><button type="button" onClick={() => setModal({ mode: 'patient', appointment: slot.appointment! })} className="inline-flex min-h-[36px] items-center rounded-r-[11px] border border-l-0 border-[#d2b2a1] bg-[#f7ebe2] px-2.5 text-hpsr-wine transition hover:bg-[#edd9cc]"><ChevronRight size={14} /></button></div>
                      ) : slot.visualState === 'Livre' && slot.doctorId === currentUserProfile.id ? (
                        <button type="button" disabled={availabilityBusyId === slot.id} onClick={() => void removePublishedSlot(slot)} className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[11px] border border-[#d2b2a1] bg-[#f7ebe2] px-3 text-xs font-black text-hpsr-wine transition hover:bg-[#edd9cc] disabled:opacity-50"><Trash2 size={13} />Remover</button>
                      ) : slot.doctorId !== currentUserProfile.id ? <span className="text-[11px] font-bold text-hpsr-muted">Somente visualização</span> : <span className="text-[11px] font-bold text-hpsr-muted">Sem ação disponível</span>}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={viewingAllSchedules ? 7 : 6} className="px-5 py-12 text-center text-sm font-semibold text-hpsr-muted">{availabilityLoading ? "Carregando horários publicados..." : "Nenhum horário futuro publicado encontrado."}</td></tr>
                )}
              </tbody>
            </table>
        </div>
      </section>


      {showCompletedAppointments && (
        <section className="rounded-[18px] border border-[#d1b69e] bg-[#eaddcd] p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Histórico da agenda</p><h2 className="mt-1 text-lg font-black text-hpsr-text">Consultas finalizadas</h2><p className="mt-1 text-xs font-semibold text-hpsr-muted">Consultas realizadas, concluídas, canceladas ou marcadas como ausência não aparecem no calendário ativo.</p></div>
            <button type="button" onClick={() => setShowCompletedAppointments(false)} className="rounded-[11px] border border-hpsr-border bg-white px-3 py-2 text-xs font-black text-hpsr-wine">Ocultar histórico</button>
          </div>
          <div className="mb-3 flex items-center gap-2 rounded-[12px] border border-[#dcc6b2] bg-[#f8f0e6] px-3"><Search size={15} className="text-hpsr-wineLight"/><input value={completedSearch} onChange={(event) => setCompletedSearch(event.target.value)} placeholder="Buscar paciente, passaporte, médico ou especialidade" className="h-10 min-w-0 flex-1 bg-transparent text-xs font-semibold text-hpsr-text outline-none"/></div>
          <div className="hpsr-touch-scroll max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {filteredCompletedDoctorAppointments.length ? filteredCompletedDoctorAppointments.map((appointment) => (
              <article key={`completed-${appointment.id}`} className="flex flex-col gap-3 rounded-[15px] border border-[#d9c2ab] bg-[#f7eee4] p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-black", statusClasses(appointment.managementStatus || appointment.status))}>{appointment.managementStatus || appointment.status}</span><span className="text-xs font-semibold text-hpsr-muted">{appointment.date.split("-").reverse().join("/")} às {appointment.time}</span></div><p className="mt-2 truncate text-sm font-black text-hpsr-text">{appointment.patient}</p><p className="mt-1 truncate text-xs font-semibold text-hpsr-muted">{appointment.specialty} · {appointment.physician} · Passaporte {appointment.passport}</p></div>
                <div className="flex shrink-0 flex-wrap gap-2"><button type="button" onClick={() => setModal({ mode: "patient", appointment })} className="rounded-[11px] border border-hpsr-border bg-white px-3 py-2 text-xs font-black text-hpsr-wine">Ver dados</button><button type="button" onClick={() => setModal({ mode: "reschedule", appointment })} className="rounded-[11px] border border-hpsr-border bg-white px-3 py-2 text-xs font-black text-hpsr-wine">Editar/Reagendar</button></div>
              </article>
            )) : <div className="rounded-[15px] border border-dashed border-[#d8c0aa] bg-[#f3e7da] p-6 text-center text-sm text-hpsr-muted">Nenhuma consulta finalizada encontrada.</div>}
          </div>
        </section>
      )}

      <ScheduleToolDialog
        mode={scheduleToolModal}
        onClose={() => { setScheduleToolModal(null); void loadAppointments(); }}
        doctorId={currentUserProfile.id}
        doctorName={currentUserProfile.systemName}
        doctorRole={currentUserProfile.role}
        defaultSpecialty={currentUserProfile.specialty || ""}
      />

      <AgendaModal modal={modal} onClose={() => setModal(null)} onNavigate={setModal} onChanged={loadAppointments} selectedDate={dateKey} appointments={doctorAppointments} />
    </div>
  );
}

function ScheduleToolDialog({
  mode,
  onClose,
  doctorId,
  doctorName,
  doctorRole,
  defaultSpecialty,
}: {
  mode: ScheduleToolModal;
  onClose: () => void;
  doctorId?: string;
  doctorName: string;
  doctorRole: string;
  defaultSpecialty: string;
}) {
  if (!mode) return null;

  return (
    <div className="hpsr-modal-tone fixed inset-0 z-[1000] flex items-center justify-center px-3 py-3 sm:px-5">
      <button type="button" onClick={onClose} aria-label="Fechar modal" className="hpsr-modal-backdrop" />

      <section className="relative flex max-h-[94vh] w-full max-w-[1180px] flex-col overflow-hidden rounded-[24px] border border-hpsr-border bg-[#fffaf5] shadow-[0_28px_80px_rgba(57,19,8,.28)]">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-hpsr-border bg-white px-4 py-3.5 sm:px-5">
          <div className="flex min-w-0 items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[15px] bg-hpsr-wine text-white shadow-sm">
              <CalendarClock size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[.18em] text-hpsr-wineLight">Agenda clínica</p>
              <h2 className="mt-0.5 text-xl font-black text-hpsr-text">Publicar horários</h2>
              <p className="mt-1 text-sm leading-relaxed text-hpsr-muted">Defina e publique os horários disponíveis para atendimento médico.</p>
            </div>
          </div>

          <button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] border border-hpsr-border bg-white text-hpsr-muted transition hover:border-hpsr-wineLight hover:bg-[#fff8f0] hover:text-hpsr-wine" aria-label="Fechar">
            <X size={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-auto p-4 sm:p-5" style={{ scrollbarGutter: "stable" }}>
          <DoctorAvailabilityManager doctorId={doctorId} doctorName={doctorName} doctorRole={doctorRole} defaultSpecialty={defaultSpecialty} embedded />
        </div>
      </section>
    </div>
  );
}

function AgendaModal({
  modal,
  onClose,
  onNavigate,
  onChanged,
  selectedDate,
  appointments,
}: {
  modal: ModalState;
  onClose: () => void;
  onNavigate: (next: ModalState) => void;
  onChanged: () => Promise<void>;
  selectedDate: string;
  appointments: Appointment[];
}) {
  if (!modal) return null;

  const appointment = modal.appointment;

  const titleMap: Record<ModalMode, string> = {
    new: "Nova consulta",
    export: "Exportar relatório",
    open: "Gerenciar consulta",
    patient: "Dados do paciente",
    reschedule: "Reagendar consulta",
  };

  const descriptionMap: Record<ModalMode, string> = {
    new: "Cadastre uma consulta manualmente na Agenda do Médico.",
    export: "Defina o período e o formato do relatório da agenda.",
    open: "Atualize a situação do agendamento e registre o que aconteceu com esta consulta.",
    patient: "Visualize os dados principais vinculados à consulta selecionada.",
    reschedule: "Escolha uma nova data e horário no padrão de Brasília.",
  };

  return (
    <div className="hpsr-modal-tone fixed inset-0 z-[999] flex items-center justify-center px-3 py-3 sm:px-4">
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar modal"
        className="hpsr-modal-backdrop"
      />

      <div className="hpsr-modal-shell flex max-h-[calc(100dvh-1.5rem)] max-w-3xl flex-col overflow-hidden">
        <div className="hpsr-modal-header flex items-start justify-between gap-4 px-4 py-3.5 sm:px-5">
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

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-auto bg-[#fffaf5] p-4 sm:p-5 [scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch]">
          {modal.mode === "new" && <NewAppointmentForm selectedDate={selectedDate} onClose={onClose} appointments={appointments} />}
          {modal.mode === "export" && <ExportReportForm onClose={onClose} />}
          {modal.mode === "open" && appointment && <OpenAttendanceForm appointment={appointment} onClose={onClose} onChanged={onChanged} onReschedule={() => onNavigate({ mode: "reschedule", appointment })} />}
          {modal.mode === "patient" && appointment && <PatientDetails appointment={appointment} />}
          {modal.mode === "reschedule" && appointment && (
            <RescheduleForm appointment={appointment} onClose={onClose} appointments={appointments} onChanged={onChanged} />
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
  const [doctors, setDoctors] = useState<Array<{ id: string; name: string; role: string; specialty: string }>>([]);
  const [specialty, setSpecialty] = useState("");
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickPatient, setQuickPatient] = useState({ name: "", passport: "", age: "", bloodType: "" });
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const selectedDoctor = useMemo(() => doctors.find((doctor) => doctor.name === physician), [doctors, physician]);
  const selectedDoctorSpecialties = useMemo(
    () => selectedDoctor ? clinicalSpecialtyOptionsForStaffRole(selectedDoctor.role, selectedDoctor.specialty, specialties) : [],
    [selectedDoctor]
  );

  useEffect(() => {
    const client = createClient();
    if (!client) return;
    void client.from("profiles").select("id,name,role,specialty,crm").eq("access_status", "Aprovado").order("name").then(({ data, error }) => {
      if (error) {
        setMessage({ type: "error", text: `Não foi possível carregar os médicos: ${error.message}` });
        return;
      }
      const canManageAllDoctors = currentUserProfile.systemRole === "Administrador do Sistema" || currentUserProfile.accessLevel === "Total" || ["Diretora", "Vice Diretor", "Vice-Diretor"].some((role) => role === currentUserProfile.role || role === currentUserProfile.systemRole);
      const available = (data || [])
        .filter((row) => isClinicalProfessional(row))
        .map((row) => ({ id: String(row.id), name: String(row.name || "Médico"), role: String(row.role || ""), specialty: String(row.specialty || "") }))
        .filter((doctor) => canManageAllDoctors || doctor.id === currentUserProfile.id || doctor.name === currentUserProfile.systemName);
      setDoctors(available);
      const current = available.find((item) => item.name === currentUserProfile.systemName) || available[0];
      const nextPhysician = current?.name || "";
      setPhysician(nextPhysician);
      const nextSpecialties = current ? clinicalSpecialtyOptionsForStaffRole(current.role, current.specialty, specialties) : [];
      setSpecialty(nextSpecialties[0] || "");
    });
  }, [currentUserProfile.id, currentUserProfile.role, currentUserProfile.systemName, currentUserProfile.systemRole, currentUserProfile.accessLevel]);

  useEffect(() => {
    if (!selectedDoctor) {
      setSpecialty("");
      return;
    }
    setSpecialty((current) => selectedDoctorSpecialties.includes(current) ? current : selectedDoctorSpecialties[0] || "");
  }, [selectedDoctor, selectedDoctorSpecialties]);

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
    if (!selectedDoctor || !specialty || !selectedDoctorSpecialties.includes(specialty)) {
      setMessage({ type: "error", text: "Selecione um médico com especialidade clínica válida antes de salvar." });
      return;
    }
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
    const doctorId = selectedDoctor.id;

    const { data: acceptedRows, error: acceptedLookupError } = await client
      .from("appointments")
      .select("id,payload,created_at,updated_at")
      .eq("passport", patientPassport)
      .eq("status", "Aceita")
      .neq("payload->>flowType", "Exames")
      .order("updated_at", { ascending: false })
      .limit(20);
    if (acceptedLookupError) {
      setMessage({ type: "error", text: `Não foi possível verificar a solicitação aceita: ${acceptedLookupError.message}` });
      return;
    }

    const acceptedRequest = (acceptedRows || []).find((row: any) => {
      const requestPayload = row?.payload || {};
      const sameSpecialty = normalizeSpecialty(String(requestPayload.specialty || "")) === normalizeSpecialty(specialty);
      const requestDoctorId = String(requestPayload.doctorId || requestPayload.acceptedById || "");
      const sameDoctor = requestDoctorId ? requestDoctorId === doctorId : String(requestPayload.physician || requestPayload.doctor || "") === physician;
      return sameSpecialty && sameDoctor;
    }) as any | undefined;

    const basePayload = (acceptedRequest?.payload || {}) as Record<string, unknown>;
    const payload = {
      ...basePayload,
      patient: patientName,
      passport: patientPassport,
      specialty,
      physician,
      doctor: physician,
      doctorId,
      date,
      preferredDate: date,
      time,
      preferredTime: time,
      source: "clinical_schedule",
      schedulingMode: "staff_manual_schedule",
      sourceRequestId: acceptedRequest?.id || undefined,
      createdAt: String(basePayload.createdAt || acceptedRequest?.created_at || now),
      updatedAt: now,
    };

    const saveResult = acceptedRequest
      ? await client.from("appointments").update({ patient: patientName, status: "Agendada", payload, updated_at: now }).eq("id", acceptedRequest.id)
      : await client.from("appointments").insert({ id, passport: patientPassport, patient: patientName, status: "Agendada", payload, created_at: now, updated_at: now });
    if (saveResult.error) { setMessage({ type: "error", text: saveResult.error.message }); return; }
    setMessage({ type: "success", text: acceptedRequest ? "Agendamento manual salvo e sincronizado com a solicitação aceita, sem duplicar o atendimento." : "Consulta salva e sincronizada com a visão geral e o prontuário." });
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
          <StyledSelect className={inputClass} value={specialty} disabled={!selectedDoctorSpecialties.length} onChange={(event) => setSpecialty(event.target.value)}>
            {selectedDoctorSpecialties.length ? selectedDoctorSpecialties.map((item) => <option key={item}>{item}</option>) : <option value="">Sem especialidade clínica disponível</option>}
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

      {quickOpen && <div className="hpsr-modal-tone fixed inset-0 z-[1000] grid place-items-center overflow-hidden bg-[#1f0805]/60 p-2 sm:p-4">
        <div className="flex max-h-[calc(100dvh-1rem)] w-full max-w-[520px] flex-col overflow-hidden rounded-[22px] border border-hpsr-border bg-[#fffaf4] shadow-2xl">
          <div className="flex items-start justify-between border-b border-hpsr-border bg-white px-5 py-4"><div className="flex gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-hpsr-border text-hpsr-wine"><UserPlus size={19}/></div><div><h3 className="font-black text-hpsr-text">Registro rápido de paciente</h3><p className="text-xs font-semibold text-hpsr-muted">Preencha apenas os dados necessários para esta consulta.</p></div></div><button type="button" onClick={() => setQuickOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-hpsr-wine text-white"><X size={18}/></button></div>
          <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto overscroll-y-auto p-4 sm:grid-cols-2 sm:p-5 [scrollbar-gutter:stable]"><label className="sm:col-span-2 text-[10px] font-black uppercase tracking-[.12em] text-hpsr-muted">Nome completo<input className={`${inputClass} mt-1.5`} value={quickPatient.name} onChange={(e)=>setQuickPatient((c)=>({...c,name:e.target.value}))}/></label><label className="text-[10px] font-black uppercase tracking-[.12em] text-hpsr-muted">Documento / Passaporte<input className={`${inputClass} mt-1.5`} value={quickPatient.passport} onChange={(e)=>setQuickPatient((c)=>({...c,passport:e.target.value}))}/></label><label className="text-[10px] font-black uppercase tracking-[.12em] text-hpsr-muted">Idade<input className={`${inputClass} mt-1.5`} value={quickPatient.age} onChange={(e)=>setQuickPatient((c)=>({...c,age:e.target.value}))}/></label><label className="sm:col-span-2 text-[10px] font-black uppercase tracking-[.12em] text-hpsr-muted">Tipo sanguíneo<StyledSelect className={`${inputClass} mt-1.5`} value={quickPatient.bloodType} onChange={(e)=>setQuickPatient((c)=>({...c,bloodType:e.target.value}))}><option value="">Selecione</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option></StyledSelect></label></div>
          <div className="flex shrink-0 justify-end gap-2 border-t border-hpsr-border bg-white px-4 py-3 sm:px-5 sm:py-4"><button type="button" onClick={() => setQuickOpen(false)} className="rounded-[14px] border border-hpsr-border bg-white px-4 py-3 text-xs font-black text-hpsr-text">Cancelar</button><button type="button" onClick={() => void saveQuickPatient()} className="rounded-[14px] bg-hpsr-wine px-4 py-3 text-xs font-black text-white">Salvar paciente</button></div>
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

function OpenAttendanceForm({
  appointment,
  onClose,
  onChanged,
  onReschedule,
}: {
  appointment: Appointment;
  onClose: () => void;
  onChanged: () => Promise<void>;
  onReschedule: () => void;
}) {
  const statusOptions = [
    { value: "agendada", label: "Agendada", canonical: "Agendada", description: "A consulta permanece marcada e aguardando o atendimento." },
    { value: "confirmada", label: "Paciente confirmou", canonical: "Confirmada", description: "O paciente confirmou que comparecerá no horário." },
    { value: "compareceu", label: "Paciente compareceu", canonical: "Em atendimento", description: "O paciente chegou e a consulta pode ser iniciada." },
    { value: "realizada", label: "Consulta realizada", canonical: "Realizada", description: "O atendimento foi concluído normalmente." },
    { value: "ausente", label: "Paciente faltou", canonical: "Não compareceu", description: "O paciente não compareceu ao horário agendado." },
    { value: "paciente_adiou", label: "Paciente pediu adiamento", canonical: "Adiada", description: "O paciente solicitou que a consulta seja adiada para outro momento." },
    { value: "medico_indisponivel", label: "Médico sem disponibilidade", canonical: "Adiada", description: "A consulta precisou ser adiada por indisponibilidade do médico." },
    { value: "reagendada", label: "Reagendada", canonical: "Reagendamento aceito", description: "Defina uma nova data e um novo horário para concluir o reagendamento." },
    { value: "cancelada", label: "Consulta cancelada", canonical: "Cancelada", description: "O agendamento foi encerrado e não será realizado." },
    { value: "sem_resposta", label: "Sem resposta", canonical: "Cancelada", description: "Não houve retorno do paciente para manter ou confirmar o agendamento." },
  ] as const;

  const initialStatus = (() => {
    const label = appointment.managementStatus || "";
    const byLabel = statusOptions.find((option) => option.label === label);
    if (byLabel) return byLabel.value;
    if (appointment.status === "Confirmada") return "confirmada";
    if (appointment.status === "Em atendimento") return "compareceu";
    if (["Realizada", "Concluída"].includes(appointment.status)) return "realizada";
    if (appointment.status === "Não compareceu") return "ausente";
    if (appointment.status === "Adiada") return "paciente_adiou";
    if (appointment.status === "Reagendamento aceito") return "reagendada";
    if (appointment.status === "Cancelada") return "cancelada";
    return "agendada";
  })();

  const [status, setStatus] = useState(initialStatus);
  const [summary, setSummary] = useState(appointment.managementNote || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const { profile: currentUserProfile } = useCurrentUserProfile();
  const selectedStatus = statusOptions.find((option) => option.value === status) || statusOptions[0];

  async function handleSave() {
    if (status === "reagendada") {
      onReschedule();
      return;
    }

    const nextStatus = selectedStatus.canonical;
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
        attendanceSituation: selectedStatus.label,
        attendanceSummary: summary.trim() || null,
        appointmentManagementStatus: selectedStatus.label,
        appointmentManagementCode: status,
        appointmentManagementNote: summary.trim() || null,
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
        throw new Error("O banco não confirmou a alteração da consulta. Verifique as permissões e tente novamente.");
      }

      const occurrenceId = String(currentPayload.occurrenceId || "");
      if (occurrenceId) {
        const occurrenceStatus = nextStatus === "Realizada" ? "Consulta realizada" : nextStatus;
        await client.from("clinical_followup_occurrences").update({ status: occurrenceStatus, updated_at: now }).eq("id", occurrenceId);
      }

      await onChanged();
      setMessage({ type: "success", text: `Situação atualizada para “${selectedStatus.label}”.` });
      window.setTimeout(() => onClose(), 500);
    } catch (caught) {
      setMessage({ type: "error", text: caught instanceof Error ? caught.message : "Não foi possível atualizar a consulta." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4">
      <AppointmentSummary appointment={appointment} />

      <section className="overflow-hidden rounded-[18px] border border-[#dcc3b4] bg-[#fbf3ed]">
        <div className="border-b border-[#e5d1c4] bg-[linear-gradient(135deg,#ead6ca,#f4e8df)] px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-[.16em] text-hpsr-wineLight">Situação do agendamento</p>
          <h3 className="mt-1 text-base font-black text-hpsr-text">O que aconteceu com esta consulta?</h3>
        </div>
        <div className="grid gap-3 p-4">
          <Field label="Status da consulta">
            <StyledSelect className={inputClass} value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
              {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </StyledSelect>
          </Field>

          <div className="rounded-[14px] border border-[#e6d2c5] bg-[#fffaf6] px-3.5 py-3 text-sm leading-relaxed text-hpsr-muted">
            <strong className="font-black text-hpsr-wine">{selectedStatus.label}:</strong> {selectedStatus.description}
          </div>

          <Field label="Observação do agendamento">
            <textarea className={inputClass} rows={3} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Opcional. Ex.: paciente avisou que não conseguiria comparecer." />
          </Field>
        </div>
      </section>

      {status === "reagendada" && (
        <div className="rounded-[14px] border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold leading-relaxed text-blue-800">
          Para marcar como reagendada, defina a nova data e o novo horário. O sistema atualiza o compromisso e a vaga correspondente.
        </div>
      )}

      {message && <ValidationMessage type={message.type} text={message.text} />}

      <div className="flex flex-col-reverse gap-2 border-t border-[#e4cfc1] pt-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onClose} disabled={saving} className="rounded-[12px] border border-[#d8bbaa] bg-[#fffaf6] px-4 py-2.5 text-xs font-black text-hpsr-text transition hover:bg-[#f7ebe3] disabled:opacity-50">Fechar</button>
        <button type="button" onClick={() => void handleSave()} disabled={saving} className="rounded-[12px] bg-[linear-gradient(135deg,#672614,#2a0700)] px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:brightness-105 disabled:opacity-50">{status === "reagendada" ? "Definir novo horário" : saving ? "Salvando..." : "Salvar situação"}</button>
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
  onChanged,
}: {
  appointment: Appointment;
  onClose: () => void;
  appointments: Appointment[];
  onChanged: () => Promise<void>;
}) {
  const [date, setDate] = useState(appointment.date);
  const [time, setTime] = useState(appointment.time);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const { profile: currentUserProfile } = useCurrentUserProfile();

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
    if (!client) {
      setMessage({ type: "error", text: "Não foi possível acessar o banco de dados." });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const { data, error } = await client.rpc("reschedule_clinical_appointment", {
        p_appointment_id: appointment.id,
        p_new_date: date,
        p_new_time: time,
        p_reason: reason || "Ajuste combinado com o paciente",
        p_notes: notes || null,
      });
      if (error) throw error;
      const result = (data || {}) as { ok?: boolean; error?: string; date?: string; time?: string };
      if (!result.ok) throw new Error(result.error || "Não foi possível confirmar o novo horário.");

      const managementUpdatedAt = brazilIso();
      const { data: refreshedAppointment } = await client
        .from("appointments")
        .select("payload")
        .eq("id", appointment.id)
        .maybeSingle();
      if (refreshedAppointment) {
        const refreshedPayload = (refreshedAppointment.payload || {}) as Record<string, unknown>;
        await client
          .from("appointments")
          .update({
            payload: {
              ...refreshedPayload,
              appointmentManagementStatus: "Reagendada",
              appointmentManagementCode: "reagendada",
              appointmentManagementNote: notes.trim() || reason || null,
              attendanceSituation: "Reagendada",
              attendanceUpdatedAt: managementUpdatedAt,
              attendanceUpdatedBy: currentUserProfile.systemName,
            },
            updated_at: managementUpdatedAt,
          })
          .eq("id", appointment.id);
      }

      await onChanged();
      setMessage({
        type: "success",
        text: `Novo horário confirmado para ${date.split("-").reverse().join("/")} às ${time}. O Portal do Paciente já passa a mostrar esse compromisso.`,
      });
      window.setTimeout(() => onClose(), 750);
    } catch (caught) {
      setMessage({ type: "error", text: caught instanceof Error ? caught.message : "Não foi possível reagendar a consulta." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-3">
      <AppointmentSummary appointment={appointment} />

      <div className="rounded-2xl border border-hpsr-border bg-[#fcf6ee] p-3.5 text-sm leading-relaxed text-hpsr-muted">
        Combine o novo horário com o paciente pelo canal de contato habitual e confirme aqui. Depois de salvo, o novo compromisso aparece para os dois lados do sistema.
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nova data">
          <input className={inputClass} type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </Field>
        <Field label="Novo horário de Brasília">
          <input className={inputClass} type="time" value={time} onChange={(event) => setTime(event.target.value)} />
        </Field>
        <Field label="Motivo do ajuste">
          <StyledSelect className={inputClass} value={reason} onChange={(event) => setReason(event.target.value)}>
            <option value="" disabled>Selecione</option>
            <option>Pedido do paciente</option>
            <option>Indisponibilidade médica</option>
            <option>Reorganização da agenda</option>
            <option>Outro</option>
          </StyledSelect>
        </Field>
        <Field label="Observação">
          <input className={inputClass} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Opcional" />
        </Field>
      </div>

      {message && <ValidationMessage type={message.type} text={message.text} />}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onClose} disabled={saving} className="rounded-[14px] border border-hpsr-border bg-white px-4 py-3 text-xs font-black text-hpsr-text disabled:opacity-50">Cancelar</button>
        <button type="button" onClick={() => void handleSave()} disabled={saving || !date || !time} className="rounded-[14px] bg-hpsr-wine px-4 py-3 text-xs font-black text-white disabled:opacity-50">{saving ? "Confirmando..." : "Confirmar novo horário"}</button>
      </div>
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
        <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", statusClasses(appointment.managementStatus || appointment.status))}>
          {appointment.managementStatus || appointment.status}
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
