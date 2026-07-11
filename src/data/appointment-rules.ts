import { currentUserProfile } from "./current-user-profile";

export type AppointmentLike = {
  id?: string;
  date: string;
  time: string;
  specialty: string;
};

export const APPOINTMENT_MIN_INTERVAL_MINUTES = 60;

export const doctorVisibleSpecialties = currentUserProfile.specialties ?? [
  currentUserProfile.specialty,
];

export function normalizeSpecialty(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace("obstetricia", "obstetra")
    .replace("pediatria", "pediatra")
    .replace("psicologia", "psicologa")
    .replace("nutricao", "nutricionista")
    .replace("cirurgia", "cirurgiao")
    .replace("clinico geral", "clinico geral");
}

export function doctorCanAccessSpecialty(specialty: string) {
  const normalized = normalizeSpecialty(specialty);

  return doctorVisibleSpecialties.some(
    (doctorSpecialty) => normalizeSpecialty(doctorSpecialty) === normalized
  );
}

export function timeToMinutes(time: string) {
  const [hour, minute] = time.split(":").map(Number);

  if (Number.isNaN(hour) || Number.isNaN(minute)) return 0;

  return hour * 60 + minute;
}

export function findSpecialtyScheduleConflict({
  appointments,
  date,
  time,
  specialty,
  ignoreId,
}: {
  appointments: AppointmentLike[];
  date: string;
  time: string;
  specialty: string;
  ignoreId?: string;
}) {
  const desiredMinutes = timeToMinutes(time);
  const desiredSpecialty = normalizeSpecialty(specialty);

  return appointments.find((appointment) => {
    if (ignoreId && appointment.id === ignoreId) return false;
    if (appointment.date !== date) return false;
    if (normalizeSpecialty(appointment.specialty) !== desiredSpecialty) return false;

    const appointmentMinutes = timeToMinutes(appointment.time);

    return Math.abs(appointmentMinutes - desiredMinutes) < APPOINTMENT_MIN_INTERVAL_MINUTES;
  });
}
