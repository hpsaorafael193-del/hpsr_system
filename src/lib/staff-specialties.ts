export const NO_CLINICAL_SPECIALTY_ROLES = new Set([
  "Residente",
  "Estagiário de Enfermagem",
  "Enfermeiro",
  "Técnico de Enfermagem",
]);

export const GENERAL_BASE_SPECIALTY_ROLES = new Set([
  "Médico Clínico",
  "Médico Especialista",
  "Médico Cirurgião",
  "Diretor Clínico",
  "Diretora",
  "Vice Diretor",
  "Diretor Técnico / Dev",
]);

export const UNRESTRICTED_SPECIALTY_ROLES = new Set([
  "Diretora",
  "Vice Diretor",
  "Diretor Técnico / Dev",
]);

export function normalizeStaffSpecialtyName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace("clinica geral", "clinico geral");
}

export function parseStaffSpecialties(value: string) {
  return value
    .split(/[,;|\n/]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function uniqueStaffSpecialties(items: string[]) {
  return items.filter((item, index, list) => {
    const normalized = normalizeStaffSpecialtyName(item);
    return normalized && list.findIndex((candidate) => normalizeStaffSpecialtyName(candidate) === normalized) === index;
  });
}

export function isGeneralClinicalSpecialty(value: string) {
  return normalizeStaffSpecialtyName(value) === "clinico geral";
}

export function specialtyForStaffRole(role: string, specialty: string | null | undefined) {
  const normalizedRole = role.trim();
  if (NO_CLINICAL_SPECIALTY_ROLES.has(normalizedRole)) return "";
  if (normalizedRole === "Médico Clínico") return "Clínico Geral";

  const supplied = uniqueStaffSpecialties(parseStaffSpecialties(String(specialty || "")));
  if (!GENERAL_BASE_SPECIALTY_ROLES.has(normalizedRole)) return supplied.join(", ");

  const additional = supplied.filter((item) => !isGeneralClinicalSpecialty(item));
  return ["Clínico Geral", ...additional].join(", ");
}

export function specialtiesForStaffRole(role: string, specialty: string | null | undefined) {
  const normalized = specialtyForStaffRole(role, specialty);
  return normalized ? parseStaffSpecialties(normalized) : [];
}
