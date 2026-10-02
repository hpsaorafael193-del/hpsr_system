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

/** Permissão específica de cada modalidade. A Direção conserva seu acesso
 * administrativo; os demais médicos dependem da especialidade atribuída. */
export function canManageReproductivePlan(
  role: string,
  specialty: string | null | undefined,
  kind: "gestacional" | "in_vitro",
): boolean {
  if (!canAccessObstetra(role, specialty)) return false;
  if (["Diretora", "Vice Diretor", "Vice Diretor / Dev"].includes(String(role || "").trim())) return true;
  const assigned = specialtiesForStaffRole(String(role || "").trim(), specialty)
    .map((entry) => normalizeStaffSpecialtyName(entry));
  const combined = ["ginecologia e obstetricia", "obstetricia e ginecologia", "ginecologista e obstetra"];
  if (kind === "gestacional") return assigned.some((value) =>
    ["obstetra", "obstetricia", "obstetrica", ...combined].includes(value)
  );
  return assigned.some((value) =>
    ["ginecologia", "ginecologista", ...combined].includes(value)
  );
}
