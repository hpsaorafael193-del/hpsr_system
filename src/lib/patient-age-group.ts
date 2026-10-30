/** RP age as entered in the registry. Missing age is never treated as a newborn. */
export function patientAgeInMonths(value: unknown): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const text = String(value).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(',', '.');
  if (/^\d+(?:\.\d+)?$/.test(text)) {
    const years = Number(text);
    return years <= 120 ? years * 12 : null;
  }
  const combined = text.match(/^(\d+)\s*anos?\s*(?:e\s*)?(\d+)\s*mes(?:es)?$/);
  if (combined) {
    const months = Number(combined[1]) * 12 + Number(combined[2]);
    return Number(combined[2]) < 12 && months <= 1440 ? months : null;
  }
  const match = text.match(/^(\d+(?:\.\d+)?)\s*(ano|anos|mes|meses|dia|dias|semana|semanas)$/);
  if (!match) return null;
  const count = Number(match[1]);
  const months = match[2].startsWith('ano') ? count * 12 : match[2].startsWith('mes') ? count : match[2].startsWith('semana') ? count * 7 / 30.4375 : count / 30.4375;
  return months <= 1440 ? months : null;
}
export type PatientAgeGroup = 'child' | 'adult' | 'unknown';
export function patientAgeGroup(age: unknown): PatientAgeGroup {
  const months = patientAgeInMonths(age);
  return months === null ? 'unknown' : months < 18 * 12 ? 'child' : 'adult';
}
export function patientAgeLabel(age: unknown): string {
  if (patientAgeInMonths(age) === null) return 'Idade não informada';
  const text = String(age).trim();
  return /^\d+(?:[.,]\d+)?$/.test(text) ? `${text} ${Number(text.replace(',', '.')) === 1 ? 'ano' : 'anos'}` : text;
}
export type PediatricPatientFilter = 'children' | 'all' | 'unknown';
export function filterPediatricPatients<T extends { name: string; passport: string; age: string }>(patients: T[], filter: PediatricPatientFilter, search = ''): T[] {
  const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
  const query = normalize(search.trim());
  return patients.filter(p => (filter === 'all' || patientAgeGroup(p.age) === (filter === 'children' ? 'child' : 'unknown')) && (!query || normalize(`${p.name} ${p.passport}`).includes(query)))
    .sort((a, b) => (patientAgeGroup(a.age) === 'child' ? 0 : 1) - (patientAgeGroup(b.age) === 'child' ? 0 : 1) || a.name.localeCompare(b.name, 'pt-BR'));
}
