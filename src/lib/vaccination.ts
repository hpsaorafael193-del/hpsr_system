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
  slotId?: string;
  observations?: string;
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
  doctor?: VaccinationIdentityField;
};

export type VaccinationCardDefinition = {
  width: number;
  height: number;
  template: string;
  slots: CardSlot[];
  identity: VaccinationIdentityLayout;
  notes?: { x: number; y: number; width: number; lineHeight: number; fontSize: number; maxLines: number };
  official?: boolean;
};

// Coordenadas medidas nos PNGs OFICIAIS de 1448 × 1086; as imagens nunca
// são redesenhadas nem substituídas por elementos HTML.
const adultMaleIdentity: VaccinationIdentityLayout = {
  doctor: { mode: "line", startX: 9.6, endX: 35.5, lineY: 18.1, fontSize: 24, minFontSize: 15 },
  name: { mode: "line", startX: 8.7, endX: 41.7, lineY: 21.3, fontSize: 24, minFontSize: 15 },
  passport: { mode: "line", startX: 12.0, endX: 41.7, lineY: 24.2, fontSize: 23, minFontSize: 15 },
};
const adultFemaleIdentity: VaccinationIdentityLayout = {
  doctor: { mode: "line", startX: 9.6, endX: 33.5, lineY: 16.6, fontSize: 24, minFontSize: 15 },
  name: { mode: "line", startX: 8.7, endX: 38.5, lineY: 19.6, fontSize: 24, minFontSize: 15 },
  passport: { mode: "line", startX: 12.0, endX: 40.0, lineY: 22.55, fontSize: 23, minFontSize: 15 },
};
const elderlyIdentity: VaccinationIdentityLayout = {
  doctor: { mode: "line", startX: 9.4, endX: 34.0, lineY: 17.0, fontSize: 23, minFontSize: 15 },
  name: { mode: "line", startX: 7.8, endX: 38.0, lineY: 20.0, fontSize: 23, minFontSize: 15 },
  passport: { mode: "line", startX: 12.4, endX: 39.1, lineY: 22.7, fontSize: 23, minFontSize: 15 },
};
const childIdentity: VaccinationIdentityLayout = {
  doctor: { mode: "line", startX: 10.9, endX: 37.5, lineY: 15.4, fontSize: 22, minFontSize: 14 },
  name: { mode: "line", startX: 9.7, endX: 40.1, lineY: 18.5, fontSize: 23, minFontSize: 15 },
  passport: { mode: "line", startX: 13.0, endX: 49.0, lineY: 21.4, fontSize: 22, minFontSize: 14 },
};

const pregnantIdentity: VaccinationIdentityLayout = {
  name: { mode: "line", startX: 12.2, endX: 39.3, lineY: 23.35, fontSize: 16, minFontSize: 11, color: "#672614" },
  passport: { mode: "line", startX: 16.5, endX: 39.3, lineY: 27.25, fontSize: 16, minFontSize: 11, color: "#672614" },
};

// Cada retângulo de carimbo recebe UM endereço estável: vacina + dose.
// A posição é a área branca interna, não o bloco que contém o nome impresso.
const officialSlot = (id: string, vaccine: string, dose: number, x: number, y: number, w: number, h: number, aliases: string[] = []): CardSlot => ({
  id, left: x / 14.48, top: y / 10.86, width: w / 14.48, height: h / 10.86,
  aliases: [vaccine, ...aliases],
  doseAliases: dose === 1 ? ["1ª dose", "1a dose", "dose 1", "dose única", "dose unica"] : [`${dose}ª dose`, `${dose}a dose`, `dose ${dose}`],
});
const officialDoses = (vaccine: string, boxes: number[][], aliases: string[] = []) =>
  boxes.map(([x, y, w, h], i) => officialSlot(`${normalizeVaccineText(vaccine).replace(/ /g, "-")}-${i + 1}`, vaccine, i + 1, x, y, w, h, aliases));

const adultFemaleSlots = [
  ...officialDoses("Hepatite B", [[152,359,189,82],[152,449,189,87],[152,545,189,88]]),
  ...officialDoses("dT", [[511,359,174,90],[511,467,174,94]]),
  ...officialDoses("dTpa", [[848,373,176,106]]),
  ...officialDoses("Influenza", [[1190,371,189,105]], ["Gripe"]),
  ...officialDoses("Febre Amarela", [[153,765,188,103]]),
  ...officialDoses("Tríplice Viral", [[508,682,175,98],[508,788,175,95]]),
  ...officialDoses("HPV", [[836,609,190,76],[836,699,190,79],[836,798,190,88]]),
  ...officialDoses("Covid-19", [[1186,609,189,77],[1186,702,189,78],[1186,799,189,85]], ["COVID", "Coronavírus"]),
];
const adultMaleSlots = [
  ...officialDoses("Hepatite B", [[143,381,206,93],[143,489,206,94],[143,599,206,94]]),
  ...officialDoses("dT", [[506,383,188,93],[506,489,188,94]]),
  ...officialDoses("dTpa", [[836,388,196,112]]),
  ...officialDoses("Influenza", [[1186,389,193,110]], ["Gripe"]),
  ...officialDoses("Febre Amarela", [[143,810,207,118]]),
  ...officialDoses("Tríplice Viral", [[504,713,191,93],[504,812,191,94]]),
  ...officialDoses("HPV", [[836,638,198,91],[836,737,198,91],[836,835,198,91]]),
  ...officialDoses("Covid-19", [[1186,640,193,89],[1186,737,193,90],[1186,836,193,91]], ["COVID", "Coronavírus"]),
];
const childSlots = [
  ...officialDoses("BCG", [[144,358,215,137]]),
  ...officialDoses("Hepatite B", [[537,337,165,74],[537,419,165,74],[537,502,165,75]]),
  ...officialDoses("Pentavalente", [[884,337,164,76],[884,419,164,74],[884,501,164,75]]),
  ...officialDoses("Poliomielite", [[1228,337,155,76],[1228,419,155,74],[1228,501,155,75]], ["VIP", "VOP", "Poliomielite (VIP)", "Poliomielite (VOP)"]),
  ...officialDoses("Pneumocócica", [[201,698,160,47],[201,753,160,65],[201,825,160,63]], ["Pneumocócica 10", "Pneumocócica conjugada"]),
  ...officialDoses("Rotavírus", [[536,698,165,82],[536,791,165,78]]),
  ...officialDoses("Tríplice Viral", [[884,698,164,83],[884,790,164,80]]),
  ...officialDoses("Febre Amarela", [[1227,699,157,147]]),
];
const elderlySlots = [
  ...officialDoses("Influenza", [[152,382,194,109]], ["Gripe"]),
  ...officialDoses("Pneumocócica", [[495,382,216,90],[495,490,216,101]], ["Pneumocócica VPC13", "Pneumocócica VPP23"]),
  ...officialDoses("dT", [[866,406,164,111]]),
  ...officialDoses("dTpa", [[1192,406,187,111]]),
  ...officialDoses("Hepatite B", [[153,656,193,87],[153,766,193,91],[153,883,193,97]]),
  ...officialDoses("Herpes-zóster", [[497,737,215,93],[497,864,215,97]], ["Herpes zoster", "Shingrix"]),
  ...officialDoses("Covid-19", [[861,678,167,84],[861,783,167,84],[861,890,167,84]], ["COVID", "Coronavírus"]),
  ...officialDoses("Febre Amarela", [[1187,654,185,100]]),
];

export type CardVaccineOption = { name: string; doses: string[] };
const optionsFromSlots = (slots: CardSlot[]): CardVaccineOption[] => {
  const options = new Map<string, CardVaccineOption>();
  slots.forEach((slot) => {
    const name = slot.aliases?.[0] || "";
    const dose = slot.doseAliases?.[0] || "1ª dose";
    if (!options.has(name)) options.set(name, { name, doses: [] });
    options.get(name)!.doses.push(dose);
  });
  return [...options.values()];
};
export function cardVaccineOptions(group: VaccinationGroup, adultVariant: AdultCardVariant = "masculino"): CardVaccineOption[] {
  if (group === "gestante") return pregnantVaccines.map((item) => ({ name: item.name, doses: [...item.doses] }));
  const slots = group === "crianca" ? childSlots : group === "idoso" ? elderlySlots : adultVariant === "feminino" ? adultFemaleSlots : adultMaleSlots;
  return optionsFromSlots(slots);
}
export function findVaccinationSlot(definition: VaccinationCardDefinition, vaccine: string, dose: string): CardSlot | undefined {
  const normalizedVaccine = normalizeVaccineText(vaccine);
  const normalizedDose = normalizeVaccineText(dose);
  return definition.slots.find((slot) =>
    slot.aliases?.some((alias) => normalizeVaccineText(alias) === normalizedVaccine)
    && slot.doseAliases?.some((alias) => normalizeVaccineText(alias) === normalizedDose)
  );
}

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
  const base = { width: 1448, height: 1086 };
  if (group === "crianca") return {
    ...base, template: "/vacinacao/caderneta-crianca.png", slots: childSlots, identity: childIdentity,
    notes: { x: 445, y: 946, width: 850, lineHeight: 28, fontSize: 20, maxLines: 3 }, official: true,
  };
  if (group === "gestante") return { ...base, template: "/vacinacao/caderneta-gestante.png", slots: pregnantSlots, identity: pregnantIdentity };
  if (group === "idoso") return {
    ...base, template: "/vacinacao/caderneta-idoso.png", slots: elderlySlots, identity: elderlyIdentity,
    notes: { x: 1076, y: 854, width: 274, lineHeight: 27, fontSize: 16, maxLines: 5 }, official: true,
  };
  return {
    ...base,
    template: adultVariant === "feminino" ? "/vacinacao/caderneta-adulto-feminino.png" : "/vacinacao/caderneta-adulto-masculino.png",
    slots: adultVariant === "feminino" ? adultFemaleSlots : adultMaleSlots,
    identity: adultVariant === "feminino" ? adultFemaleIdentity : adultMaleIdentity,
    notes: { x: 340, y: 955, width: 865, lineHeight: 29, fontSize: 21, maxLines: 3 }, official: true,
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
  const result = new Map<string, VaccinationApplication>();
  // Doses são endereçadas por vacina + número; a segunda nunca ocupa a primeira.
  // Registros antigos sem slotId são reconciliados pelo nome e dose.
  for (const application of applications) {
    const explicit = definition.slots.find((slot) => slot.id === application.slotId);
    const matched = explicit && findVaccinationSlot(definition, application.vaccine, application.dose)?.id === explicit.id
      ? explicit : findVaccinationSlot(definition, application.vaccine, application.dose);
    if (matched && !result.has(matched.id)) result.set(matched.id, application);
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
