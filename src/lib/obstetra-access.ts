import { normalizeStaffSpecialtyName, specialtiesForStaffRole } from "@/lib/staff-specialties";

/** Acesso à aba Obstetra; não concede especialidades clínicas ao perfil. */
export function canAccessObstetra(role: string, specialty: string | null | undefined): boolean {
  const normalizedRole = String(role || "").trim();
  if (["Diretora", "Vice Diretor", "Vice Diretor / Dev"].includes(normalizedRole)) return true;
  if (!["Médico Clínico", "Médico Especialista", "Médico Plantonista", "Médico Cirurgião", "Diretor Clínico"].includes(normalizedRole)) return false;

  return specialtiesForStaffRole(normalizedRole, specialty).some((value) =>
    ["obstetra", "obstetricia", "ginecologia", "ginecologista", "obstetricia e ginecologia", "ginecologia e obstetricia"].includes(normalizeStaffSpecialtyName(value))
  );
}
