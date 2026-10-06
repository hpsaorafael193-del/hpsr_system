import {
  isFullAccessAdministrativeRole,
  normalizeStaffSpecialtyName,
  specialtiesForStaffRole,
} from "@/lib/staff-specialties";

const OBSTETRA_ELIGIBLE_ROLES = new Set([
  "Médico Especialista",
  "Médico Plantonista",
  "Médico Cirurgião",
  "Diretor Clínico",
  "Diretora",
  "Vice Diretor",
  "Vice Diretor / Dev",
]);

function assignedReproductiveSpecialties(role: string, specialty: string | null | undefined) {
  return specialtiesForStaffRole(String(role || "").trim(), specialty).map((entry) => normalizeStaffSpecialtyName(entry));
}

/** Diretora e Vice Diretor / Dev possuem acesso administrativo total. Demais perfis dependem da especialidade clínica atribuída. */
export function canAccessObstetra(role: string, specialty: string | null | undefined): boolean {
  const normalizedRole = String(role || "").trim();
  if (isFullAccessAdministrativeRole(normalizedRole)) return true;
  if (!OBSTETRA_ELIGIBLE_ROLES.has(normalizedRole)) return false;
  const assigned = assignedReproductiveSpecialties(normalizedRole, specialty);
  return assigned.some((value) => [
    "obstetra", "obstetricia", "obstetrica", "ginecologia", "ginecologista",
    "ginecologia e obstetricia", "obstetricia e ginecologia", "ginecologista e obstetra",
  ].includes(value));
}

/** Diretora e Vice Diretor / Dev podem assumir qualquer modalidade; demais profissionais dependem da especialidade atribuída. */
export function canManageReproductivePlan(
  role: string,
  specialty: string | null | undefined,
  kind: "gestacional" | "in_vitro",
): boolean {
  const normalizedRole = String(role || "").trim();
  if (isFullAccessAdministrativeRole(normalizedRole)) return true;
  if (!canAccessObstetra(normalizedRole, specialty)) return false;
  const assigned = assignedReproductiveSpecialties(normalizedRole, specialty);
  const combined = ["ginecologia e obstetricia", "obstetricia e ginecologia", "ginecologista e obstetra"];
  if (kind === "gestacional") return assigned.some((value) =>
    ["obstetra", "obstetricia", "obstetrica", ...combined].includes(value)
  );
  return assigned.some((value) =>
    ["ginecologia", "ginecologista", ...combined].includes(value)
  );
}
