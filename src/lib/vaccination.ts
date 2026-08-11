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
  doctorName: string;
  doctorCrm: string;
  signatureImage?: string | null;
  createdAt: string;
  createdBy?: string;
};

export type VaccinationSlotContentLayout = {
  left: number;
  top: number;
  width: number;
  lineGap: number;
};

export type VaccinationStampLayout = {
  centerX: number;
  centerY: number;
  radius: number;
};

export type CardSlot = {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
  stampScale?: number;
  contentLayout?: VaccinationSlotContentLayout;
  stampLayout?: VaccinationStampLayout;
  aliases?: string[];
  doseAliases?: string[];
};

export type VaccinationIdentityField = {
  mode: "line" | "box";
  startX: number;
  endX: number;
  lineY?: number;
  top?: number;
  bottom?: number;
  fontSize: number;
  minFontSize?: number;
  color?: string;
  weight?: string;
};

export type VaccinationIdentityLayout = {
  name: VaccinationIdentityField;
  passport: VaccinationIdentityField;
  birthDate?: VaccinationIdentityField;
  guardians?: VaccinationIdentityField;
};

export type VaccinationCardDefinition = {
  width: number;
  height: number;
  template: string;
  slots: CardSlot[];
  identity: VaccinationIdentityLayout;
};

const adultIdentity: VaccinationIdentityLayout = {
  name: { mode: "line", startX: 11.8, endX: 52.1, lineY: 25.05, fontSize: 20, minFontSize: 13 },
  passport: { mode: "line", startX: 14.7, endX: 52.1, lineY: 29.38, fontSize: 20, minFontSize: 13 },
  birthDate: { mode: "line", startX: 20.7, endX: 52.1, lineY: 33.72, fontSize: 20, minFontSize: 13 },
};

const elderlyIdentity: VaccinationIdentityLayout = {
  name: { mode: "line", startX: 9.0, endX: 61.4, lineY: 26.15, fontSize: 20, minFontSize: 13 },
  passport: { mode: "line", startX: 11.6, endX: 36.6, lineY: 31.05, fontSize: 20, minFontSize: 13 },
  birthDate: { mode: "line", startX: 51.0, endX: 61.4, lineY: 31.05, fontSize: 20, minFontSize: 12 },
};

const childIdentity: VaccinationIdentityLayout = {
  // O template infantil não possui linhas de preenchimento: cada valor começa
  // imediatamente após o respectivo rótulo impresso e permanece na mesma linha visual.
  name: { mode: "box", startX: 30.8, endX: 78.0, top: 7.55, bottom: 9.45, fontSize: 18, minFontSize: 12, color: "#ffffff", weight: "800" },
  passport: { mode: "box", startX: 36.2, endX: 78.0, top: 10.95, bottom: 12.95, fontSize: 17, minFontSize: 12, color: "#ffffff", weight: "800" },
  birthDate: { mode: "box", startX: 50.3, endX: 78.0, top: 14.25, bottom: 16.35, fontSize: 16, minFontSize: 11, color: "#ffffff", weight: "800" },
  guardians: { mode: "box", startX: 40.0, endX: 78.0, top: 17.45, bottom: 19.65, fontSize: 15, minFontSize: 10, color: "#ffffff", weight: "800" },
};

const pregnantIdentity: VaccinationIdentityLayout = {
  name: { mode: "line", startX: 12.2, endX: 39.3, lineY: 23.35, fontSize: 16, minFontSize: 11, color: "#672614" },
  passport: { mode: "line", startX: 16.5, endX: 39.3, lineY: 27.25, fontSize: 16, minFontSize: 11, color: "#672614" },
};

const adultSlots: CardSlot[] = [
  { id: "a1", left: 4.2, top: 38.3, width: 29.1, height: 23.4 },
  { id: "a2", left: 35.4, top: 38.3, width: 29.1, height: 23.4 },
  { id: "a3", left: 66.6, top: 38.3, width: 29.1, height: 23.4 },
  { id: "a4", left: 4.2, top: 64.0, width: 29.1, height: 23.4 },
  { id: "a5", left: 35.4, top: 64.0, width: 29.1, height: 23.4 },
  { id: "a6", left: 66.6, top: 64.0, width: 29.1, height: 23.4 },
];

const childShortContent: VaccinationSlotContentLayout = { left: 4.5, top: 5, width: 59, lineGap: 21 };
const childRegularContent: VaccinationSlotContentLayout = { left: 4.5, top: 6, width: 59, lineGap: 17 };
const childShortStamp: VaccinationStampLayout = { centerX: 82, centerY: 58, radius: 22 };
const childRegularStamp: VaccinationStampLayout = { centerX: 80, centerY: 69, radius: 18.5 };

const childSlots: CardSlot[] = [
  { id: "c1", left: 31.2, top: 35.8, width: 18.0, height: 10.0, contentLayout: childShortContent, stampLayout: childShortStamp },
  { id: "c2", left: 50.3, top: 35.8, width: 18.0, height: 10.0, contentLayout: childShortContent, stampLayout: childShortStamp },
  { id: "c3", left: 31.2, top: 46.0, width: 18.0, height: 14.7, contentLayout: childRegularContent, stampLayout: childRegularStamp },
  { id: "c4", left: 50.3, top: 46.0, width: 18.0, height: 14.7, contentLayout: childRegularContent, stampLayout: childRegularStamp },
  { id: "c5", left: 31.2, top: 60.9, width: 18.0, height: 15.0, contentLayout: childRegularContent, stampLayout: childRegularStamp },
  { id: "c6", left: 50.3, top: 60.9, width: 18.0, height: 15.0, contentLayout: childRegularContent, stampLayout: childRegularStamp },
  { id: "c7", left: 31.2, top: 76.1, width: 18.0, height: 13.1, contentLayout: childRegularContent, stampLayout: childRegularStamp },
  { id: "c8", left: 50.3, top: 76.1, width: 18.0, height: 13.1, contentLayout: childRegularContent, stampLayout: childRegularStamp },
];

const pregnantDoseContent: VaccinationSlotContentLayout = { left: 39, top: 31, width: 53, lineGap: 19 };
const pregnantDoseStamp: VaccinationStampLayout = { centerX: 72, centerY: 73, radius: 17.5 };
const pregnantLargeContent: VaccinationSlotContentLayout = { left: 8, top: 31, width: 52, lineGap: 18 };
const pregnantLargeStamp: VaccinationStampLayout = { centerX: 76, centerY: 66, radius: 20 };

const pregnantSlots: CardSlot[] = [
  { id: "hb1", left: 4.5, top: 37.5, width: 27.5, height: 18.0, contentLayout: pregnantDoseContent, stampLayout: pregnantDoseStamp, aliases: ["hepatite b"], doseAliases: ["1ª dose", "1a dose", "1 dose"] },
  { id: "hb2", left: 4.5, top: 56.0, width: 27.5, height: 18.0, contentLayout: pregnantDoseContent, stampLayout: pregnantDoseStamp, aliases: ["hepatite b"], doseAliases: ["2ª dose", "2a dose", "2 dose"] },
  { id: "hb3", left: 4.5, top: 74.5, width: 27.5, height: 18.0, contentLayout: pregnantDoseContent, stampLayout: pregnantDoseStamp, aliases: ["hepatite b"], doseAliases: ["3ª dose", "3a dose", "3 dose"] },
  { id: "dt1", left: 35.0, top: 37.5, width: 27.5, height: 18.0, contentLayout: pregnantDoseContent, stampLayout: pregnantDoseStamp, aliases: ["dt", "dupla adulto"], doseAliases: ["1ª dose", "1a dose", "1 dose"] },
  { id: "dt2", left: 35.0, top: 56.0, width: 27.5, height: 18.0, contentLayout: pregnantDoseContent, stampLayout: pregnantDoseStamp, aliases: ["dt", "dupla adulto"], doseAliases: ["2ª dose", "2a dose", "2 dose"] },
  { id: "dt3", left: 35.0, top: 74.5, width: 27.5, height: 18.0, contentLayout: pregnantDoseContent, stampLayout: pregnantDoseStamp, aliases: ["dt", "dupla adulto"], doseAliases: ["3ª dose", "3a dose", "3 dose"] },
  { id: "dtpa", left: 68.0, top: 36.5, width: 27.0, height: 25.5, contentLayout: pregnantLargeContent, stampLayout: pregnantLargeStamp, aliases: ["dtpa"], doseAliases: ["dose única", "dose unica"] },
  { id: "influenza", left: 68.0, top: 63.5, width: 27.0, height: 27.5, contentLayout: pregnantLargeContent, stampLayout: pregnantLargeStamp, aliases: ["influenza", "gripe"], doseAliases: ["dose única", "dose unica"] },
];

export function getVaccinationCardDefinition(group: VaccinationGroup, adultVariant: AdultCardVariant = "masculino"): VaccinationCardDefinition {
  if (group === "crianca") return { width: 1122, height: 1402, template: "/vacinacao/caderneta-crianca.png", slots: childSlots, identity: childIdentity };
  if (group === "gestante") return { width: 1448, height: 1086, template: "/vacinacao/caderneta-gestante.png", slots: pregnantSlots, identity: pregnantIdentity };
  if (group === "idoso") return { width: 1448, height: 1086, template: "/vacinacao/caderneta-idoso.png", slots: adultSlots, identity: elderlyIdentity };
  return {
    width: 1448,
    height: 1086,
    template: adultVariant === "feminino" ? "/vacinacao/caderneta-adulto-feminino.png" : "/vacinacao/caderneta-adulto-masculino.png",
    slots: adultSlots,
    identity: adultIdentity,
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
    const normalizedVaccine = normalizeVaccineText(application.vaccine);
    const normalizedDose = normalizeVaccineText(application.dose);
    const matched = slots.find((slot) => {
      if (result.has(slot.id) || !slot.aliases?.length) return false;
      const vaccineMatches = slot.aliases.some((alias) => normalizedVaccine === normalizeVaccineText(alias));
      const doseMatches = !slot.doseAliases?.length || slot.doseAliases.some((alias) => normalizedDose === normalizeVaccineText(alias));
      return vaccineMatches && doseMatches;
    });
    if (matched) result.set(matched.id, application);
    else remaining.push(application);
  }

  // Modelos livres (Adulto, Infantil e Idoso) recebem aplicações em sequência.
  // Slots pré-definidos, como os da Gestante, nunca recebem uma vacina desconhecida.
  for (const application of remaining) {
    const next = slots.find((slot) => !result.has(slot.id) && !slot.aliases?.length);
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

export const pregnantVaccines = [
  { name: "Hepatite B", doses: ["1ª dose", "2ª dose", "3ª dose"] },
  { name: "dT", doses: ["1ª dose", "2ª dose", "3ª dose"] },
  { name: "dTpa", doses: ["Dose única"] },
  { name: "Influenza", doses: ["Dose única"] },
] as const;

export function getPregnantDoseOptions(vaccine: string) {
  const normalized = normalizeVaccineText(vaccine);
  return pregnantVaccines.find((item) => normalizeVaccineText(item.name) === normalized)?.doses || [];
}


export function generateVaccinationLot() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  try {
    const cryptoApi = globalThis.crypto;
    if (cryptoApi?.getRandomValues) {
      const bytes = new Uint8Array(7);
      cryptoApi.getRandomValues(bytes);
      const random = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
      return `VX-${random}`;
    }
  } catch {}

  let fallback = "";
  for (let index = 0; index < 7; index += 1) {
    fallback += alphabet[Math.floor(Math.random() * alphabet.length)] || "X";
  }
  return `VX-${fallback}`;
}

export const doseOptions = ["Dose única", "1ª dose", "2ª dose", "3ª dose", "Reforço", "1º reforço", "2º reforço", "Dose adicional"];
