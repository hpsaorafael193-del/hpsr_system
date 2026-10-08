import { defaultPlanningContent } from "@/lib/obstetric-default-content";
/**
 * Planejamento Obstetra/FIV no RP.
 *
 * A data inicial define o dia da semana do cronograma sugerido. O sistema
 * propõe as consultas/etapas a cada 7 dias preservando esse dia, mas a médica
 * pode ajustar qualquer data depois da confirmação. A data final permanece
 * apenas como referência/limite visual do planejamento e não cria etapa extra.
 */
export type PlanningKind = "gestacional" | "in_vitro";

export type PlanningStep = {
  fiv_recipient?: "gestante" | "doadora";
  fiv_step_id?: string;
  fiv_order?: number;
  number: number;
  title: string;
  description: string;
  planned_text: string;
  marker: string;
  week: number;
  date: string;
};

export type PlanningSuggestion = {
  kind: PlanningKind;
  key: string;
  candidateDates: string[];
  steps: PlanningStep[];
  expectedCount: number;
  foundCount: number;
  targetWeekday: number;
  targetWeekdayLabel: string;
  valid: boolean;
  warning: string;
  suggestedStartDate: string | null;
};

export const GESTATIONAL_WEEKS = [12, 16, 20, 24, 28, 32, 36, 38] as const;
export const IVF_WEEKS = [1, 2, 3, 4, 5] as const;

export const PLANNING_CONFIG = {
  gestacional: {
    expectedCount: 8,
    markers: GESTATIONAL_WEEKS.map((week) => `${week === 12 ? "até " : ""}${week} semanas`),
    weeks: [...GESTATIONAL_WEEKS],
    defaultTitles: GESTATIONAL_WEEKS.map((_, index) => `Consulta ${index + 1}`),
  },
  in_vitro: {
    expectedCount: 5,
    markers: IVF_WEEKS.map((week) => `${week}ª semana`),
    weeks: [...IVF_WEEKS],
    defaultTitles: IVF_WEEKS.map((_, index) => `Etapa ${index + 1}`),
  },
} as const;

const WEEKDAY_LABELS = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"] as const;

export function isDateOnly(value: string) { return /^\d{4}-\d{2}-\d{2}$/.test(value); }
export function dateOnlyToUtc(value: string) { const [y,m,d]=value.split("-").map(Number); return new Date(Date.UTC(y,m-1,d)); }
export function utcToDateOnly(date: Date) { return date.toISOString().slice(0,10); }
export function addPlanningDays(value: string, count: number) { if(!isDateOnly(value)) return ""; const d=dateOnlyToUtc(value); d.setUTCDate(d.getUTCDate()+count); return utcToDateOnly(d); }
export function weekdayForDate(value: string) { return isDateOnly(value) ? dateOnlyToUtc(value).getUTCDay() : -1; }
export function planningWeekdayLabel(value: string) { const weekday=weekdayForDate(value); return weekday>=0 ? WEEKDAY_LABELS[weekday] : "dia da data inicial"; }
export function nextPlanningWeekday(value: string, targetWeekday: number) { if(!isDateOnly(value)) return ""; const d=dateOnlyToUtc(value); d.setUTCDate(d.getUTCDate()+((targetWeekday-d.getUTCDay()+7)%7)); return utcToDateOnly(d); }
export function collectPlanningWeekdays(initial:string, finalDate:string, targetWeekday:number) {
  if(!isDateOnly(initial)||!isDateOnly(finalDate)||finalDate<initial) return [];
  const first=nextPlanningWeekday(initial,targetWeekday); if(!first||first>finalDate) return [];
  const dates:string[]=[]; let current=first;
  while(current<=finalDate){ dates.push(current); current=addPlanningDays(current,7); if(!current) break; }
  return dates;
}
export function planningKey(kind:PlanningKind, initial:string, finalDate:string){ return `${kind}:${initial}:${finalDate}`; }

function defaultMarker(kind:PlanningKind,index:number){
  const config=PLANNING_CONFIG[kind];
  return config.markers[index] || (kind === "gestacional" ? `Marco ${index+1}` : `Etapa ${index+1}`);
}
function defaultTitle(kind:PlanningKind,index:number){ return PLANNING_CONFIG[kind].defaultTitles[index] || (kind === "gestacional" ? `Consulta ${index+1}` : `Etapa ${index+1}`); }
function defaultWeek(kind:PlanningKind,index:number){ return PLANNING_CONFIG[kind].weeks[index] || index+1; }

export function createPlanningSuggestion(kind:PlanningKind, initial:string, finalDate:string):PlanningSuggestion {
  const config=PLANNING_CONFIG[kind];
  const key=planningKey(kind,initial,finalDate);
  if(!isDateOnly(initial)||!isDateOnly(finalDate)||finalDate<initial){
    return {kind,key,candidateDates:[],steps:[],expectedCount:config.expectedCount,foundCount:0,targetWeekday:-1,targetWeekdayLabel:"dia da data inicial",valid:false,warning:"Informe uma data inicial e uma data final válidas.",suggestedStartDate:null};
  }

  const targetWeekday=weekdayForDate(initial);
  const targetWeekdayLabel=planningWeekdayLabel(initial);
  const candidateDates=Array.from({length:config.expectedCount},(_,index)=>addPlanningDays(initial,index*7));
  const steps=candidateDates.map((date,index)=>({
    number:index+1,
    title:defaultTitle(kind,index),
    description:defaultPlanningContent(kind,index),
    planned_text:defaultPlanningContent(kind,index),
    marker:defaultMarker(kind,index),
    week:defaultWeek(kind,index),
    date,
  }));

  const messages=[`Cronograma sugerido em ${targetWeekdayLabel}: todas as ${kind === "in_vitro" ? "etapas" : "consultas"} mantêm o dia da semana da data inicial.`];
  if(candidateDates[candidateDates.length-1] > finalDate) {
    messages.push(`A ${kind === "in_vitro" ? "5ª etapa" : "8ª consulta"} sugerida ultrapassa a data final de referência. Confira o período; as datas continuam editáveis.`);
  }

  return {
    kind,key,candidateDates,steps,expectedCount:config.expectedCount,foundCount:steps.length,
    targetWeekday,targetWeekdayLabel,valid:true,warning:messages.join(" "),suggestedStartDate:null,
  };
}

export function normalizePlanningStep(step:Partial<PlanningStep>,kind:PlanningKind,index:number):PlanningStep {
  const plannedText=typeof step.planned_text==="string"?step.planned_text:typeof step.description==="string"?step.description:"";
  return { ...(kind === "in_vitro" ? { fiv_recipient: step.fiv_recipient === "doadora" ? "doadora" as const : "gestante" as const, ...(step.fiv_step_id ? { fiv_step_id: step.fiv_step_id } : {}), ...(step.fiv_order ? { fiv_order: step.fiv_order } : {}) } : {}),number:index+1,title:typeof step.title==="string"&&step.title.trim()?step.title.trim():defaultTitle(kind,index),description:plannedText,planned_text:plannedText,marker:typeof step.marker==="string"&&step.marker.trim()?step.marker.trim():defaultMarker(kind,index),week:typeof step.week==="number"&&Number.isFinite(step.week)?step.week:defaultWeek(kind,index),date:typeof step.date==="string"?step.date:""};
}
export function normalizePlanningSteps(kind:PlanningKind,steps:unknown):PlanningStep[]{ if(!Array.isArray(steps)) return []; return steps.map((step,index)=>normalizePlanningStep((step||{}) as Partial<PlanningStep>,kind,index)); }

/** Somente erros estruturais impedem salvar. Padrão clínico/calendário é orientação. */
export function validatePlanningSteps(kind:PlanningKind,steps:PlanningStep[],initial?:string,finalDate?:string){
  if(!steps.length) return "Inclua pelo menos uma consulta/etapa no planejamento.";
  if(steps.some(step=>!isDateOnly(step.date))) return "Informe uma data válida para cada consulta/etapa.";
  if(new Set(steps.map(step=>kind === "in_vitro" ? `${step.fiv_recipient || "gestante"}:${step.date}` : step.date)).size!==steps.length) return "Há consultas/etapas com a mesma data. Defina datas distintas antes de salvar.";
  if(initial && !isDateOnly(initial)) return "Informe uma data inicial válida.";
  if(finalDate && !isDateOnly(finalDate)) return "Informe uma data final de referência válida.";
  return "";
}

export function planningAdvisories(kind:PlanningKind,steps:PlanningStep[],initial?:string,finalDate?:string){
  const config=PLANNING_CONFIG[kind]; const warnings:string[]=[];
  if(steps.length!==config.expectedCount) warnings.push(`Quantidade diferente do padrão de referência (${steps.length} informadas; referência ${config.expectedCount}).`);
  const referenceDate=(initial && isDateOnly(initial) ? initial : steps.find(s=>isDateOnly(s.date))?.date) || "";
  const referenceWeekday=weekdayForDate(referenceDate);
  if(referenceWeekday>=0){
    const offDay=steps.filter(s=>isDateOnly(s.date)&&weekdayForDate(s.date)!==referenceWeekday).length;
    if(offDay) warnings.push(`${offDay} ${offDay===1?"data está":"datas estão"} fora de ${planningWeekdayLabel(referenceDate)}, dia definido pela data inicial.`);
  }
  for(let i=1;i<steps.length;i+=1){ if(isDateOnly(steps[i].date) && isDateOnly(steps[i-1].date) && steps[i].date<=steps[i-1].date){ warnings.push("As datas não estão em ordem cronológica."); break; } }
  if(initial && steps.some(s=>s.date<initial)) warnings.push("Há consulta/etapa anterior à data inicial de referência.");
  if(finalDate && steps.some(s=>s.date>finalDate)) warnings.push("Há consulta/etapa posterior à data final de referência.");
  return warnings;
}

export function renumberPlanningSteps(kind:PlanningKind,steps:PlanningStep[]){ return steps.map((step,index)=>normalizePlanningStep({...step,number:index+1},kind,index)); }
export function newPlanningStep(kind:PlanningKind,index:number,date=""):PlanningStep { return normalizePlanningStep({date, planned_text:defaultPlanningContent(kind,index)},kind,index); }
