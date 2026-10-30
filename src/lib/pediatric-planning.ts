import { childhoodStages } from '@/lib/vaccination';
import { addPlanningDays } from '@/lib/obstetric-planning';
import { normalizeStaffSpecialtyName, specialtiesForStaffRole } from '@/lib/staff-specialties';

export function canAccessPediatrics(role: string, specialty: string) {
  if (['Diretora','Vice Diretor','Vice Diretor / Dev'].includes(role)) return true;
  return ['Médico Especialista','Médico Supervisor','Médico Plantonista','Médico Cirurgião','Diretor Clínico'].includes(role)
    && specialtiesForStaffRole(role,specialty).some(s => ['pediatria','pediatra'].includes(normalizeStaffSpecialtyName(s)));
}
export type PediatricVisit = {
  id: string; date: string; title: string; planned: string; status: 'prevista'|'realizada';
  health: string; growth: string; routine: string; development: string; prevention: string; conduct: string;
  weight: string; height: string; actual_date: string;
  author?: {id:string;name:string;at:string};
};
export type PediatricPlan = {
  id:string; patient_passport:string; doctor_id:string; doctor_name:string; patient_name:string;
  guardian_link_id:string|null; start_date:string; next_return:string|null; notes:string; title:string;
  status:'ativo'|'concluido'; consultations:PediatricVisit[]; updated_at:string;
  updated_by_name:string; revisions:Array<{at:string;by:string;snapshot:Record<string,unknown>}>;
};
export function pediatricVisit(start:string,index:number):PediatricVisit {
  const review=index%2===1;
  return { id:crypto.randomUUID(),date:addPlanningDays(start,index*15),title:`Consulta ${index+1}`,status:'prevista',
    planned:review
      ? 'Retorno em 15 dias: revisar os resultados dos exames solicitados, registrar a evolução, reavaliar crescimento, alimentação e desenvolvimento. Conferir a caderneta infantil e as doses pendentes para a idade. Ajustar as orientações e definir o próximo retorno.'
      : 'Avaliação pediátrica: atualizar queixas e histórico com o responsável; avaliar peso, estatura, exame físico, alimentação, sono e desenvolvimento. Definir os exames necessários conforme idade, queixas e avaliação, sem solicitação automática de rotina. Conferir a caderneta infantil e as vacinas previstas para a idade. Orientar o responsável e planejar retorno em 15 dias para revisar os resultados.',
    health:'',growth:'',routine:'',development:'',prevention:'',conduct:'',weight:'',height:'',actual_date:''};
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
