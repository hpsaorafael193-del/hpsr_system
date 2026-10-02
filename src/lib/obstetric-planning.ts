/**
 * Planejamento Obstetra/FIV no RP.
 *
 * Os marcadores de semana/etapa são rótulos narrativos do RP. Eles nunca
 * determinam intervalos. O sistema apenas sugere datas; o médico pode alterar,
 * adicionar ou remover datas e a validação de padrão é somente orientativa.
 */
export type PlanningKind = "gestacional" | "in_vitro";

export type PlanningStep = {
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
    targetWeekday: 3,
    targetWeekdayLabel: "quarta-feira",
    markers: GESTATIONAL_WEEKS.map((week) => `${week === 12 ? "até " : ""}${week} semanas`),
    weeks: [...GESTATIONAL_WEEKS],
    defaultTitles: GESTATIONAL_WEEKS.map((_, index) => `Consulta ${index + 1}`),
  },
  in_vitro: {
    expectedCount: 5,
    targetWeekday: 2,
    targetWeekdayLabel: "terça-feira",
    markers: IVF_WEEKS.map((week) => `${week}ª semana`),
    weeks: [...IVF_WEEKS],
    defaultTitles: IVF_WEEKS.map((_, index) => `Etapa ${index + 1}`),
  },
} as const;

export function isDateOnly(value: string) { return /^\d{4}-\d{2}-\d{2}$/.test(value); }
export function dateOnlyToUtc(value: string) { const [y,m,d]=value.split("-").map(Number); return new Date(Date.UTC(y,m-1,d)); }
export function utcToDateOnly(date: Date) { return date.toISOString().slice(0,10); }
export function addPlanningDays(value: string, count: number) { if(!isDateOnly(value)) return ""; const d=dateOnlyToUtc(value); d.setUTCDate(d.getUTCDate()+count); return utcToDateOnly(d); }
export function weekdayForDate(value: string) { return isDateOnly(value) ? dateOnlyToUtc(value).getUTCDay() : -1; }
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
  const config=PLANNING_CONFIG[kind]; const key=planningKey(kind,initial,finalDate);
  if(!isDateOnly(initial)||!isDateOnly(finalDate)||finalDate<initial){
    return {kind,key,candidateDates:[],steps:[],expectedCount:config.expectedCount,foundCount:0,targetWeekday:config.targetWeekday,targetWeekdayLabel:config.targetWeekdayLabel,valid:false,warning:"Informe uma data inicial e uma data final válidas.",suggestedStartDate:null};
  }
  const candidateDates=collectPlanningWeekdays(initial,finalDate,config.targetWeekday);
  const suggestedStartDate=weekdayForDate(initial)===config.targetWeekday?null:nextPlanningWeekday(initial,config.targetWeekday);
  const foundCount=candidateDates.length; const messages:string[]=[];
  if(suggestedStartDate) messages.push(`A data inicial não corresponde a uma ${config.targetWeekdayLabel}. Como referência, a primeira data sugerida seria ${suggestedStartDate.split("-").reverse().join("/")}.`);
  if(foundCount!==config.expectedCount) messages.push(`O período informado sugere ${foundCount} ${foundCount===1?"data":"datas"} em ${config.targetWeekdayLabel}s; o modelo de referência costuma ter ${config.expectedCount}. Isto é apenas uma recomendação e não impede a confirmação.`);
  const steps=candidateDates.map((date,index)=>({number:index+1,title:defaultTitle(kind,index),description:"",planned_text:"",marker:defaultMarker(kind,index),week:defaultWeek(kind,index),date}));
  return {kind,key,candidateDates,steps,expectedCount:config.expectedCount,foundCount,targetWeekday:config.targetWeekday,targetWeekdayLabel:config.targetWeekdayLabel,valid:true,warning:messages.join(" "),suggestedStartDate};
}

export function normalizePlanningStep(step:Partial<PlanningStep>,kind:PlanningKind,index:number):PlanningStep {
  const plannedText=typeof step.planned_text==="string"?step.planned_text:typeof step.description==="string"?step.description:"";
  return {number:index+1,title:typeof step.title==="string"&&step.title.trim()?step.title.trim():defaultTitle(kind,index),description:plannedText,planned_text:plannedText,marker:typeof step.marker==="string"&&step.marker.trim()?step.marker.trim():defaultMarker(kind,index),week:typeof step.week==="number"&&Number.isFinite(step.week)?step.week:defaultWeek(kind,index),date:typeof step.date==="string"?step.date:""};
}
export function normalizePlanningSteps(kind:PlanningKind,steps:unknown):PlanningStep[]{ if(!Array.isArray(steps)) return []; return steps.map((step,index)=>normalizePlanningStep((step||{}) as Partial<PlanningStep>,kind,index)); }

/** Somente erros estruturais impedem salvar. Padrão clínico/calendário é orientação. */
export function validatePlanningSteps(_kind:PlanningKind,steps:PlanningStep[],initial?:string,finalDate?:string){
  if(!steps.length) return "Inclua pelo menos uma consulta/etapa no planejamento.";
  if(steps.some(step=>!isDateOnly(step.date))) return "Informe uma data válida para cada consulta/etapa.";
  if(new Set(steps.map(step=>step.date)).size!==steps.length) return "Há consultas/etapas com a mesma data. Defina datas distintas antes de salvar.";
  if(initial && !isDateOnly(initial)) return "Informe uma data inicial válida.";
  if(finalDate && !isDateOnly(finalDate)) return "Informe uma data final de referência válida.";
  return "";
}

export function planningAdvisories(kind:PlanningKind,steps:PlanningStep[],initial?:string,finalDate?:string){
  const config=PLANNING_CONFIG[kind]; const warnings:string[]=[];
  if(steps.length!==config.expectedCount) warnings.push(`Quantidade diferente do padrão de referência (${steps.length} informadas; referência ${config.expectedCount}).`);
  const offDay=steps.filter(s=>isDateOnly(s.date)&&weekdayForDate(s.date)!==config.targetWeekday).length;
  if(offDay) warnings.push(`${offDay} ${offDay===1?"data está":"datas estão"} fora de ${config.targetWeekdayLabel}.`);
  for(let i=1;i<steps.length;i+=1){ if(steps[i].date<=steps[i-1].date){ warnings.push("As datas não estão em ordem cronológica."); break; } }
  if(initial && steps.some(s=>s.date<initial)) warnings.push("Há consulta/etapa anterior à data inicial de referência.");
  if(finalDate && steps.some(s=>s.date>finalDate)) warnings.push("Há consulta/etapa posterior à data final de referência.");
  return warnings;
}

export function renumberPlanningSteps(kind:PlanningKind,steps:PlanningStep[]){ return steps.map((step,index)=>normalizePlanningStep({...step,number:index+1},kind,index)); }
export function newPlanningStep(kind:PlanningKind,index:number,date=""):PlanningStep { return normalizePlanningStep({date},kind,index); }
