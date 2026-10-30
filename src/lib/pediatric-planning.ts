import { childhoodStages } from '@/lib/vaccination';
import { addPlanningDays } from '@/lib/obstetric-planning';
import { normalizeStaffSpecialtyName, specialtiesForStaffRole } from '@/lib/staff-specialties';

export function canAccessPediatrics(role: string, specialty: string) {
  if (['Diretora','Vice Diretor','Vice Diretor / Dev'].includes(role)) return true;
  return ['Médico Especialista','Médico Supervisor','Médico Plantonista','Médico Cirurgião','Diretor Clínico'].includes(role)
    && specialtiesForStaffRole(role,specialty).some(s => ['pediatria','pediatra'].includes(normalizeStaffSpecialtyName(s)));
}
export type PediatricVisit = {
  kind?: 'consultation'|'guardian_return';
  exams?:string;vaccines?:string;instructions?:string;observations?:string;
  id: string; date: string; title: string; planned: string; status: 'prevista'|'realizada';
  health: string; growth: string; routine: string; development: string; prevention: string; conduct: string;
  weight: string; height: string; actual_date: string;
  author?: {id:string;name:string;at:string};
};
export type PediatricPlan = {
  frequency?:PediatricFrequency;publication_notes?:string;
  id:string; patient_passport:string; doctor_id:string; doctor_name:string; patient_name:string;
  guardian_link_id:string|null; start_date:string; next_return:string|null; notes:string; title:string;
  status:'ativo'|'concluido'; consultations:PediatricVisit[]; updated_at:string;
  updated_by_name:string; revisions:Array<{at:string;by:string;snapshot:Record<string,unknown>}>;
};
export type PediatricFrequency='semanal'|'quinzenal'|'mensal'|'personalizado';
export function pediatricNextDate(start:string,index:number,frequency:PediatricFrequency='quinzenal'):string {
 if(frequency!=='mensal')return addPlanningDays(start,index*(frequency==='semanal'?7:frequency==='quinzenal'?15:1));
 const [y,m,d]=start.split('-').map(Number);const target=new Date(Date.UTC(y,m-1+index,1));const last=new Date(Date.UTC(target.getUTCFullYear(),target.getUTCMonth()+1,0)).getUTCDate();target.setUTCDate(Math.min(d,last));return target.toISOString().slice(0,10);
}
export const PEDIATRIC_DEFAULT_PLANS = [
 'Avaliação inicial: conhecer o histórico da criança, avaliar crescimento e desenvolvimento e conferir a caderneta. Exames e vacinas conforme avaliação do pediatra.',
 'Reavaliar o crescimento e as informações dos responsáveis. Revisar exames disponíveis e atualizar orientações e o planejamento vacinal, se indicado.',
 'Acompanhar o desenvolvimento, a alimentação e a rotina. Definir exames e cuidados adicionais conforme as necessidades identificadas.',
 'Revisar a evolução e os resultados disponíveis. Conferir a vacinação e ajustar as orientações com os responsáveis.',
 'Avaliar a evolução do acompanhamento e organizar os próximos cuidados. Definir a continuidade das consultas com os responsáveis.',
] as const;
export function pediatricVisit(start:string,index:number):PediatricVisit {
  return { id:crypto.randomUUID(),kind:'consultation',date:addPlanningDays(start,index*15),title:`Consulta ${index+1}`,status:'prevista',
    planned:PEDIATRIC_DEFAULT_PLANS[Math.min(index,4)],
    exams:'',vaccines:'',instructions:'',observations:'',
    health:'',growth:'',routine:'',development:'',prevention:'',conduct:'',weight:'',height:'',actual_date:''};
}
export function pediatricGuardianReturn(date:string):PediatricVisit {
  return {...pediatricVisit(date,0),kind:'guardian_return',title:'Retorno com os responsáveis',date,exams:'Apresentar e explicar os resultados dos exames realizados.',vaccines:'Esclarecer dúvidas sobre a caderneta e as vacinas combinadas.',instructions:'Explicar a conduta e orientar os cuidados aos responsáveis.',
    planned:'Conversa com os responsáveis: apresentar e explicar os resultados dos exames realizados, esclarecer o que está acontecendo com a criança e registrar a conduta e as orientações. A presença da criança não é obrigatória. Combinar a data com os responsáveis; este retorno não entra na contagem nem reinicia o intervalo das consultas pediátricas.'};
}
export function nextPediatricConsultation(visits:PediatricVisit[],start:string,frequency:PediatricFrequency='quinzenal'):string {
 const medical=visits.filter(v=>v.kind!=='guardian_return');
 const upcoming=medical.filter(v=>v.status==='prevista').sort((a,b)=>a.date.localeCompare(b.date))[0];
 if(upcoming)return upcoming.date;
 const last=[...medical].sort((a,b)=>(b.actual_date||b.date).localeCompare(a.actual_date||a.date))[0];
 return frequency==='personalizado'?'':pediatricNextDate(last?.actual_date||last?.date||start,1,frequency);
}

export function validatePediatricPlan(plan:Pick<PediatricPlan,'start_date'|'consultations'|'next_return'>) {
  const valid=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
  if(!valid(plan.start_date))return 'Informe a data inicial.';
  if(plan.next_return&&!valid(plan.next_return))return 'Confira o próximo retorno.';
  if(!plan.consultations.length)return 'Inclua pelo menos uma consulta.';
  const ids=new Set<string>(),dates=new Set<string>();
  for(const v of plan.consultations){
    if(!valid(v.date)||v.date<plan.start_date)return 'Confira as datas das consultas.';
    if(ids.has(v.id)||dates.has(v.date))return 'Há consultas repetidas ou na mesma data.';
    if(v.status==='realizada'&&(!v.actual_date||!valid(v.actual_date)||![v.health,v.growth,v.routine,v.development,v.prevention,v.conduct].some(t=>t.trim())))return 'Informe a data e o registro da consulta realizada.';
    ids.add(v.id);dates.add(v.date);
  }
  return '';
}
export function ageInMonths(age:string):number|null {
 const n=Number(age.replace(',','.').match(/\d+(?:\.\d+)?/)?.[0]);
 if(!age.trim()||!Number.isFinite(n))return null;
 const s=normalizeStaffSpecialtyName(age);
 return /dia/.test(s)?n/30:/mes/.test(s)?n:n*12;
}
export function pediatricVaccineGuidance(age:string,completed:string[]) {
 const months=ageInMonths(age);if(months===null)return [];
 return childhoodStages.filter(stage=>{
  const at=stage.id==='nascer'?0:stage.id.endsWith('-anos')?Number(stage.id.split('-')[0])*12:Number(stage.id.split('-')[0]);
  return at<=months&&!completed.includes(stage.id)&&!completed.includes(stage.label);
 });
}
