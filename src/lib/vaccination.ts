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
  notes?: { x: number; y: number; width: number; lineHeight: number; fontSize: number; maxLines: number; continuationX?: number; continuationWidth?: number; lineYs?: number[]; baselineOffset?: number };
  official?: boolean;
};

// Coordenadas medidas nos PNGs OFICIAIS de 1448 × 1086; as imagens nunca
// são redesenhadas nem substituídas por elementos HTML.
const adultMaleIdentity: VaccinationIdentityLayout = {
 doctor:{mode:"line",startX:10.01,endX:36.05,lineY:17.91,fontSize:21},
 name:{mode:"line",startX:8.63,endX:39.64,lineY:20.86,fontSize:22},
 passport:{mode:"line",startX:12.57,endX:42.20,lineY:23.94,fontSize:21},
};
const adultFemaleIdentity: VaccinationIdentityLayout = {
 doctor:{mode:"line",startX:10.08,endX:33.98,lineY:17.54,fontSize:21},
 name:{mode:"line",startX:9.05,endX:39.30,lineY:20.40,fontSize:22},
 passport:{mode:"line",startX:12.78,endX:41.30,lineY:23.62,fontSize:21},
};
const elderlyIdentity: VaccinationIdentityLayout = {
 doctor:{mode:"line",startX:9.81,endX:34.32,lineY:17.45,fontSize:21},
 name:{mode:"line",startX:8.98,endX:38.05,lineY:20.49,fontSize:22},
 passport:{mode:"line",startX:12.43,endX:39.16,lineY:23.30,fontSize:21},
};
const childIdentity: VaccinationIdentityLayout = {
 doctor:{mode:"line",startX:10.98,endX:37.15,lineY:17.27,fontSize:21},
 name:{mode:"line",startX:9.19,endX:42.33,lineY:20.21,fontSize:21},
 passport:{mode:"line",startX:13.05,endX:42.40,lineY:23.16,fontSize:21},
};

const pregnantIdentity: VaccinationIdentityLayout = {
  doctor: { mode: "line", startX: 11.0, endX: 34.0, lineY: 17.68, fontSize: 18, minFontSize: 11, color: "#6a2a16", weight: "700" },
  name: { mode: "line", startX: 8.9, endX: 39.4, lineY: 20.61, fontSize: 18, minFontSize: 11, color: "#6a2a16", weight: "700" },
  passport: { mode: "line", startX: 12.7, endX: 41.3, lineY: 23.74, fontSize: 18, minFontSize: 11, color: "#6a2a16", weight: "700" },
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

// v1.1.7: carimbos alinhados aos cinco modelos aprovados; na infantil há
// UM registro por etapa de idade, sem seleção de vacina/dose individual.
const adultFemaleSlots = [
  ...officialDoses("Hepatite B", [[143,376,214,72],[143,468,214,72],[143,560,214,72]]),
  ...officialDoses("dT", [[496,376,205,72],[496,468,205,72],[496,560,205,72]]),
  ...officialDoses("Influenza", [[841,376,205,72],[841,468,205,72],[841,560,205,72]], ["Gripe"]),
  ...officialDoses("HPV", [[1195,376,196,72],[1195,468,196,72],[1195,560,196,72]]),
  ...officialDoses("Febre Amarela", [[151,772,308,73]]),
  ...officialDoses("dTpa", [[541,772,350,73]]),
  ...officialDoses("Tríplice Viral", [[1056,752,326,59],[1056,824,326,59]]),
];
const adultMaleSlots = [
  ...officialDoses("Hepatite B", [[138,370,217,77],[138,462,217,77],[138,554,217,77]]),
  ...officialDoses("dT", [[497,370,201,77],[497,462,201,77],[497,554,201,77]]),
  ...officialDoses("Influenza", [[841,370,201,77],[841,462,201,77],[841,554,201,77]], ["Gripe"]),
  ...officialDoses("HPV", [[1177,370,200,77],[1177,462,200,77],[1177,554,200,77]]),
  ...officialDoses("Febre Amarela", [[152,770,304,76]]),
  ...officialDoses("dTpa", [[549,771,337,76]]),
  ...officialDoses("Tríplice Viral", [[1057,750,318,61],[1057,824,318,61]]),
];
export type ChildhoodStage = { id: string; label: string; page: number; vaccineSummary: string[]; slot: CardSlot };
const ageSlot=(id:string,x:number,y:number,w:number,h:number):CardSlot=>({
  id,left:x/14.48,top:y/10.86,width:w/14.48,height:h/10.86,
  aliases:[id],doseAliases:["Etapa completa"]
});
// A etapa de 2 anos aparece nas duas páginas para manter a continuidade visual,
// mas é UM único registro; o mesmo carimbo aparece em ambas.
export const childhoodStages: ChildhoodStage[] = [
  {id:"nascer",label:"Ao nascer",page:0,vaccineSummary:["BCG","Hepatite B"],slot:ageSlot("nascer",277,327,173,138)},
  {id:"2-meses",label:"2 meses",page:0,vaccineSummary:["Pentavalente","Poliomielite (VIP)","Pneumocócica","Rotavírus"],slot:ageSlot("2-meses",738,329,171,137)},
  {id:"4-meses",label:"4 meses",page:0,vaccineSummary:["Pentavalente","Poliomielite (VIP)","Pneumocócica","Rotavírus"],slot:ageSlot("4-meses",1202,328,170,138)},
  {id:"6-meses",label:"6 meses",page:0,vaccineSummary:["Pentavalente","Poliomielite (VIP)","Influenza"],slot:ageSlot("6-meses",287,557,171,142)},
  {id:"9-meses",label:"9 meses",page:0,vaccineSummary:["Febre Amarela","Meningocócica ACWY"],slot:ageSlot("9-meses",738,557,170,142)},
  {id:"12-meses",label:"12 meses",page:0,vaccineSummary:["Tríplice Viral","Pneumocócica","Meningocócica"],slot:ageSlot("12-meses",1210,557,171,142)},
  {id:"15-meses",label:"15 meses",page:0,vaccineSummary:["DTP","Poliomielite","Hepatite A"],slot:ageSlot("15-meses",283,789,170,128)},
  {id:"18-meses",label:"18 meses",page:0,vaccineSummary:["Hepatite A","Influenza"],slot:ageSlot("18-meses",736,788,174,128)},
  {id:"2-anos",label:"2 anos",page:0,vaccineSummary:["Influenza (anual)"],slot:ageSlot("2-anos",1211,788,173,127)},
  {id:"4-anos",label:"4 anos",page:1,vaccineSummary:["DTP (reforço)","Varicela","Influenza (anual)"],slot:ageSlot("4-anos",770,338,158,179)},
  {id:"6-anos",label:"6 anos",page:1,vaccineSummary:["DTP (reforço)","Influenza (anual)"],slot:ageSlot("6-anos",1213,338,158,179)},
  {id:"7-anos",label:"7 anos",page:1,vaccineSummary:["HPV (conforme indicação)","Influenza (anual)"],slot:ageSlot("7-anos",213,639,125,193)},
  {id:"9-anos",label:"9 anos",page:1,vaccineSummary:["HPV","Influenza (anual)"],slot:ageSlot("9-anos",564,639,125,193)},
  {id:"11-anos",label:"11 anos",page:1,vaccineSummary:["Meningocócica ACWY","Influenza (anual)"],slot:ageSlot("11-anos",903,639,125,193)},
  {id:"12-anos",label:"12 anos",page:1,vaccineSummary:["DTP (conforme orientação)","Meningocócica ACWY","Influenza (anual)"],slot:ageSlot("12-anos",1246,639,125,193)},
];
const childSlots = childhoodStages.map(stage=>({...stage.slot,aliases:[stage.label,stage.id],doseAliases:["Etapa completa"]}));
const elderlySlots = [
  ...officialDoses("Influenza", [[47,365,297,134]], ["Gripe"]),
  ...officialDoses("Pneumocócica", [[509,371,210,80],[509,472,210,80]]),
  ...officialDoses("dT", [[869,380,162,125]]),
  ...officialDoses("dTpa", [[1196,380,182,125]]),
  ...officialDoses("Hepatite B", [[136,662,204,85],[136,771,204,85],[136,878,204,85]]),
  ...officialDoses("Herpes-zóster", [[510,739,210,96],[510,850,210,98]]),
  ...officialDoses("Febre Amarela", [[1196,654,180,127]]),
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
  if (group === "crianca") return childhoodStages.map(stage=>({name:stage.label,doses:["Etapa completa"]}));
  if (group === "gestante") return pregnantVaccines.map((item) => ({ name: item.name, doses: [...item.doses] }));
  const slots = group === "idoso" ? elderlySlots : adultVariant === "feminino" ? adultFemaleSlots : adultMaleSlots;
  return optionsFromSlots(slots);
}
export function findVaccinationSlot(definition: VaccinationCardDefinition, vaccine: string, dose: string): CardSlot | undefined {
  if (definition.template.includes("caderneta-crianca-p1-v117")) {
    return definition.slots.find(slot => normalizeVaccineText(slot.aliases?.[0] || "") === normalizeVaccineText(vaccine) && dose === "Etapa completa");
  }
  const normalizedVaccine = normalizeVaccineText(vaccine);
  const normalizedDose = normalizeVaccineText(dose);
  return definition.slots.find((slot) =>
    slot.aliases?.some((alias) => normalizeVaccineText(alias) === normalizedVaccine)
    && slot.doseAliases?.some((alias) => normalizeVaccineText(alias) === normalizedDose)
  );
}

const pregnantSlots: CardSlot[] = [
  { id: "hb1", left: 11.4, top: 37.75, width: 18.9, height: 11.1, aliases: ["hepatite b"], doseAliases: ["1ª dose", "1a dose", "dose 1"] },
  { id: "hb2", left: 11.4, top: 50.75, width: 18.9, height: 11.1, aliases: ["hepatite b"], doseAliases: ["2ª dose", "2a dose", "dose 2"] },
  { id: "hb3", left: 11.4, top: 63.8, width: 18.9, height: 11.1, aliases: ["hepatite b"], doseAliases: ["3ª dose", "3a dose", "dose 3"] },
  { id: "dt1", left: 42.9, top: 37.75, width: 19.0, height: 11.1, aliases: ["dT", "dt", "dupla adulto"], doseAliases: ["1ª dose", "1a dose", "dose 1"] },
  { id: "dt2", left: 42.9, top: 50.75, width: 19.0, height: 11.1, aliases: ["dT", "dt", "dupla adulto"], doseAliases: ["2ª dose", "2a dose", "dose 2"] },
  { id: "dt3", left: 42.9, top: 63.8, width: 19.0, height: 11.1, aliases: ["dT", "dt", "dupla adulto"], doseAliases: ["3ª dose", "3a dose", "dose 3"] },
  { id: "dtpa", left: 65.45, top: 37.2, width: 31.0, height: 13.7, aliases: ["dTpa", "dtpa"], doseAliases: ["dose única", "dose unica", "indefinido"] },
  { id: "influenza", left: 65.45, top: 64.25, width: 31.0, height: 13.7, aliases: ["influenza", "gripe"], doseAliases: ["dose única", "dose unica", "indefinido"] },
];

export function getVaccinationCardDefinition(group: VaccinationGroup, adultVariant: AdultCardVariant = "masculino"): VaccinationCardDefinition {
  const base = { width: 1448, height: 1086 };
  if (group === "crianca") return {
    ...base, template: "/vacinacao/caderneta-crianca-p1-v117.png", slots: childSlots, identity: childIdentity,
    notes: { x: 454, y: 994, width: 850, lineHeight: 32, fontSize: 20, maxLines: 3, continuationX: 215, continuationWidth: 1089, lineYs: [994, 1026, 1057], baselineOffset: -1 }, official: true,
  };
  if (group === "gestante") return { width: 1445, height: 1089, template: "/vacinacao/caderneta-gestante.png", slots: pregnantSlots, identity: pregnantIdentity, notes: { x: 292, y: 927, width: 985, lineHeight: 47, fontSize: 22, maxLines: 3, continuationX: 38, continuationWidth: 1239, lineYs: [927, 974, 1020], baselineOffset: -1 }, official: true };
  if (group === "idoso") return {
    ...base, template: "/vacinacao/caderneta-idoso-v117.png", slots: elderlySlots, identity: elderlyIdentity,
    notes: { x: 282, y: 949, width: 991, lineHeight: 37, fontSize: 20, maxLines: 3, continuationX: 56, continuationWidth: 1190, lineYs: [949, 986, 1023], baselineOffset: -1 }, official: true,
  };
  return {
    ...base,
    template: adultVariant === "feminino" ? "/vacinacao/caderneta-adulto-feminino-v117.png" : "/vacinacao/caderneta-adulto-masculino-v117.png",
    slots: adultVariant === "feminino" ? adultFemaleSlots : adultMaleSlots,
    identity: adultVariant === "feminino" ? adultFemaleIdentity : adultMaleIdentity,
    notes: adultVariant === "feminino"
      ? { x: 286, y: 975, width: 1005, lineHeight: 37, fontSize: 20, maxLines: 3, continuationX: 42, continuationWidth: 1213, lineYs: [975, 1012, 1048], baselineOffset: -1 }
      : { x: 273, y: 972, width: 1040, lineHeight: 29, fontSize: 20, maxLines: 3, continuationX: 42, continuationWidth: 1213, lineYs: [972, 1000, 1030], baselineOffset: -1 }, official: true,
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
    if (definition.template.includes("caderneta-crianca-p1-v117") && !explicit) continue;
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
  ];

export const pregnantVaccines = [
  { name: "Hepatite B", doses: ["1ª dose", "2ª dose", "3ª dose"] },
  { name: "dT", doses: ["1ª dose", "2ª dose", "3ª dose"] },
  { name: "dTpa", doses: ["Indefinido"] },
  { name: "Influenza", doses: ["Indefinido"] },
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
