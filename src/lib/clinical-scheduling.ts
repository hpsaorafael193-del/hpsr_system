export const CLINICAL_BOOKING_CUTOFF_MS = 24 * 60 * 60 * 1000;
export const CLINICAL_TIMEZONE = "America/Sao_Paulo";

export function normalizeClinicalPassport(value: unknown) {
  return String(value ?? "").trim().replace(/\s+/g, "").toUpperCase();
}

export function normalizeClinicalSpecialty(value: unknown) {
  let normalized = String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("pt-BR");

  normalized = normalized
    .replace(/^(medico|medica|dr|dra)\s+/i, "")
    .replace(/^(especialista em|especialidade em)\s+/i, "")
    .replace(/\s+clinico$/i, "")
    .trim();

  const aliases: Record<string, string> = {
    "clinica geral": "clinico geral",
    "clinico": "clinico geral",
    "medico clinico": "clinico geral",
    "obstetricia": "obstetra",
    "obstetrica": "obstetra",
    "ginecologia e obstetricia": "obstetra",
    "ginecologista e obstetra": "obstetra",
    "pediatria": "pediatra",
    "psicologia": "psicologa",
    "psicologo": "psicologa",
    "psiquiatria": "psiquiatra",
    "neurologista": "neurologia",
    "oftalmologista": "oftalmologia",
    "cardiologista": "cardiologia",
    "dermatologista": "dermatologia",
    "nutricao": "nutricionista",
    "cirurgia": "cirurgiao",
    "cirurgiao geral": "cirurgiao",
    "ginecologista": "ginecologia",
  };

  return aliases[normalized] || normalized;
}

export function clinicalSpecialtyCandidates(profile: { specialty?: unknown; role?: unknown }) {
  const candidates = [profile.specialty, profile.role]
    .map(normalizeClinicalSpecialty)
    .filter((value) => value && value !== "nao informado" && value !== "medico" && value !== "medica");
  return [...new Set(candidates)];
}

export function profileMatchesClinicalSpecialty(profile: { specialty?: unknown; role?: unknown }, specialty: unknown) {
  const wanted = normalizeClinicalSpecialty(specialty);
  if (!wanted) return false;
  return clinicalSpecialtyCandidates(profile).some((candidate) =>
    candidate === wanted || candidate.includes(wanted) || wanted.includes(candidate)
  );
}

export function isClinicalProfessional(profile: { role?: unknown; specialty?: unknown; crm?: unknown }) {
  const role = String(profile.role ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
  const crm = String(profile.crm ?? "").trim();
  const specialtyCandidates = clinicalSpecialtyCandidates(profile);
  const clinicalRoles = ["medico", "diretor clinico", "diretora", "vice diretor", "obstetra", "pediatra", "psicolog", "psiquiatra", "nutricionista", "cirurgiao", "ginecolog"];
  return specialtyCandidates.length > 0 && (Boolean(crm && crm !== "—") || clinicalRoles.some((item) => role.includes(item)));
}

export function clinicalDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CLINICAL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function sameClinicalSpecialty(left: unknown, right: unknown) {
  return normalizeClinicalSpecialty(left) === normalizeClinicalSpecialty(right);
}
