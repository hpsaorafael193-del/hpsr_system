export type VaccinationGroup = "adulto" | "crianca" | "gestante" | "idoso";
export type AdultCardVariant = "masculino" | "feminino";

export type VaccinationApplication = {
  id: string;
  patientPassport: string;
  patientName: string;
  group: VaccinationGroup;
  adultVariant?: AdultCardVariant;
  vaccine: string;
  dose: string;
  date: string;
  lot: string;
  observation?: string;
  doctorName: string;
  doctorCrm: string;
  signatureImage?: string | null;
  createdAt: string;
  createdBy?: string;
};

export type CardSlot = {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
  stampScale?: number;
  aliases?: string[];
};

export type VaccinationCardDefinition = {
  width: number;
  height: number;
  template: string;
  slots: CardSlot[];
};

const adultSlots: CardSlot[] = [
  { id: "a1", left: 4.2, top: 38.3, width: 29.1, height: 23.4 },
  { id: "a2", left: 35.4, top: 38.3, width: 29.1, height: 23.4 },
  { id: "a3", left: 66.6, top: 38.3, width: 29.1, height: 23.4 },
  { id: "a4", left: 4.2, top: 64.0, width: 29.1, height: 23.4 },
  { id: "a5", left: 35.4, top: 64.0, width: 29.1, height: 23.4 },
  { id: "a6", left: 66.6, top: 64.0, width: 29.1, height: 23.4 },
];

const childSlots: CardSlot[] = [
  { id: "c1", left: 31.2, top: 35.8, width: 18.0, height: 10.0, stampScale: 0.78 },
  { id: "c2", left: 50.3, top: 35.8, width: 18.0, height: 10.0, stampScale: 0.78 },
  { id: "c3", left: 31.2, top: 46.0, width: 18.0, height: 14.7, stampScale: 0.78 },
  { id: "c4", left: 50.3, top: 46.0, width: 18.0, height: 14.7, stampScale: 0.78 },
  { id: "c5", left: 31.2, top: 60.9, width: 18.0, height: 15.0, stampScale: 0.78 },
  { id: "c6", left: 50.3, top: 60.9, width: 18.0, height: 15.0, stampScale: 0.78 },
  { id: "c7", left: 31.2, top: 76.1, width: 18.0, height: 13.1, stampScale: 0.78 },
  { id: "c8", left: 50.3, top: 76.1, width: 18.0, height: 13.1, stampScale: 0.78 },
];

const pregnantSlots: CardSlot[] = [
  { id: "hb1", left: 4.5, top: 37.5, width: 27.5, height: 18.0, aliases: ["hepatite b"] },
  { id: "hb2", left: 4.5, top: 56.0, width: 27.5, height: 18.0, aliases: ["hepatite b"] },
  { id: "hb3", left: 4.5, top: 74.5, width: 27.5, height: 18.0, aliases: ["hepatite b"] },
  { id: "dt1", left: 35.0, top: 37.5, width: 27.5, height: 18.0, aliases: ["dt", "dupla adulto", "difteria tetano", "difteria tétano"] },
  { id: "dt2", left: 35.0, top: 56.0, width: 27.5, height: 18.0, aliases: ["dt", "dupla adulto", "difteria tetano", "difteria tétano"] },
  { id: "dt3", left: 35.0, top: 74.5, width: 27.5, height: 18.0, aliases: ["dt", "dupla adulto", "difteria tetano", "difteria tétano"] },
  { id: "dtpa", left: 68.0, top: 36.5, width: 27.0, height: 25.5, aliases: ["dtpa"] },
  { id: "influenza", left: 68.0, top: 63.5, width: 27.0, height: 27.5, aliases: ["influenza", "gripe"] },
];

export function getVaccinationCardDefinition(group: VaccinationGroup, adultVariant: AdultCardVariant = "masculino"): VaccinationCardDefinition {
  if (group === "crianca") return { width: 1122, height: 1402, template: "/vacinacao/caderneta-crianca.png", slots: childSlots };
  if (group === "gestante") return { width: 1448, height: 1086, template: "/vacinacao/caderneta-gestante.png", slots: pregnantSlots };
  if (group === "idoso") return { width: 1448, height: 1086, template: "/vacinacao/caderneta-idoso.png", slots: adultSlots };
  return {
    width: 1448,
    height: 1086,
    template: adultVariant === "feminino" ? "/vacinacao/caderneta-adulto-feminino.png" : "/vacinacao/caderneta-adulto-masculino.png",
    slots: adultSlots,
  };
}

export function normalizeVaccineText(value: string) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function assignApplicationsToSlots(applications: VaccinationApplication[], definition: VaccinationCardDefinition) {
  const slots = definition.slots;
  const result = new Map<string, VaccinationApplication>();
  const remaining: VaccinationApplication[] = [];

  for (const application of applications) {
    const normalized = normalizeVaccineText(application.vaccine);
    const matched = slots.find((slot) =>
      !result.has(slot.id) && slot.aliases?.some((alias) => normalized.includes(normalizeVaccineText(alias))),
    );
    if (matched) result.set(matched.id, application);
    else remaining.push(application);
  }

  for (const application of remaining) {
    const next = slots.find((slot) => !result.has(slot.id));
    if (!next) break;
    result.set(next.id, application);
  }

  return result;
}

export function suggestVaccinationGroup(age: string): VaccinationGroup {
  const normalized = normalizeVaccineText(age);
  const number = Number((normalized.match(/\d+/)?.[0] || "").trim());
  if (!Number.isFinite(number)) return "adulto";
  if (normalized.includes("mes") || normalized.includes("dia") || number < 18) return "crianca";
  if (number >= 60) return "idoso";
  return "adulto";
}

export const commonVaccines = [
  "BCG",
  "Hepatite B",
  "Pentavalente",
  "Poliomielite (VIP)",
  "Poliomielite (VOP)",
  "Pneumocócica 10",
  "Rotavírus",
  "Meningocócica C",
  "Meningocócica ACWY",
  "Febre Amarela",
  "Tríplice Viral",
  "Tetra Viral",
  "Hepatite A",
  "DTP",
  "dT",
  "dTpa",
  "HPV",
  "Influenza",
  "COVID-19",
];

export const doseOptions = ["Dose única", "1ª dose", "2ª dose", "3ª dose", "Reforço", "1º reforço", "2º reforço", "Dose adicional"];
