type Plan = {doctor_id: string; patient_passport: string; status: string};
type Link = {doctor_id: string; patient_passport: string; specialty: string};
const terminalStatuses = new Set(["arquivado", "concluido", "concluida", "cancelado", "cancelada", "encerrado", "encerrada"]);
const normalize = (value: string) => value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// Current links determine active work only. Never use this filter for history.
export function isLinkedActiveFollowup(plan: Plan, links: Link[], matchesSpecialty: (specialty: string) => boolean) {
  if (terminalStatuses.has(normalize(plan.status || ""))) return false;
  return links.some(link => link.doctor_id === plan.doctor_id
    && normalize(link.patient_passport) === normalize(plan.patient_passport)
    && matchesSpecialty(link.specialty));
}
