import {
  isFullAccessAdministrativeRole,
  normalizeStaffSpecialtyName,
  specialtiesForStaffRole,
} from "@/lib/staff-specialties";

/** O Supabase verifica adicionalmente access_status=Aprovado. */
export function canManageGestationalVaccination(role: string, specialty: string | null | undefined): boolean {
  const normalizedRole = String(role || "").trim();
  if (isFullAccessAdministrativeRole(normalizedRole)) return true;
  const allowed = ["Médico Clínico", "Médico Especialista", "Médico Plantonista", "Médico Cirurgião", "Diretor Clínico", "Vice Diretor"];
  if (!allowed.includes(normalizedRole)) return false;
  const permitted = new Set(["obstetra", "obstetricia", "obstetrica", "ginecologia", "ginecologista", "obstetricia e ginecologia", "ginecologia e obstetricia", "ginecologista e obstetra"]);
  return specialtiesForStaffRole(normalizedRole, specialty).some((entry) => permitted.has(normalizeStaffSpecialtyName(entry)));
}
