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
/** Canonical address for every accompaniment. In-page switches keep the current URL. */
export function followupTabHref(tab:FollowupTab):string {
 const params:Record<FollowupTab,string>={gestacional:'specialty=obstetra',in_vitro:'specialty=ginecologia',pediatria:'specialty=pediatria',vacina_gestacional:'specialty=obstetra&view=vaccination',vacina_infantil:'specialty=pediatria&view=vaccination'};
 return `/dashboard/acompanhamento?${params[tab]}`;
}
export function initialFollowupTab(role:string,specialty:string,search:string):FollowupTab|null {
 const sections=followupNavigation(role,specialty),allowed=[...sections.followups,...sections.vaccination];
 const params=new URLSearchParams(search);const value=(params.get('specialty')||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const pediatric=['pediatria','pediatra'].includes(value);const requested:FollowupTab=params.get('view')==='vaccination'?(pediatric?'vacina_infantil':'vacina_gestacional'):pediatric?'pediatria':['ginecologia','ginecologista'].includes(value)?'in_vitro':'gestacional';
 return allowed.includes(requested)?requested:allowed[0]||null;
}
