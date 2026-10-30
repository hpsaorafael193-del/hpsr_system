import { canManageReproductivePlan } from '@/lib/obstetra-access';
import { canManageGestationalVaccination } from '@/lib/gestational-vaccination-access';
import { canAccessPediatrics } from '@/lib/pediatric-planning';
export type FollowupTab='gestacional'|'in_vitro'|'pediatria'|'vacina_gestacional'|'vacina_infantil';
export function followupNavigation(role:string,specialty:string){
 const followups:FollowupTab[]=[],vaccination:FollowupTab[]=[];
 if(canManageReproductivePlan(role,specialty,'gestacional'))followups.push('gestacional');
 if(canManageReproductivePlan(role,specialty,'in_vitro'))followups.push('in_vitro');
 if(canAccessPediatrics(role,specialty))followups.push('pediatria');
 if(canManageGestationalVaccination(role,specialty))vaccination.push('vacina_gestacional');
 if(canAccessPediatrics(role,specialty))vaccination.push('vacina_infantil');
 return {followups,vaccination};
}
