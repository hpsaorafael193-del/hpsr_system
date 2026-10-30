'use client';
import Link from 'next/link';
import { Baby,HeartPulse,Sparkles,Syringe } from 'lucide-react';
import { followupNavigation,followupTabHref,type FollowupTab } from '@/lib/followup-navigation';
import styles from './followup-navigation.module.css';
const items={
 gestacional:{label:'Gestacional',href:'/dashboard/acompanhamento?specialty=obstetra',icon:HeartPulse},
 in_vitro:{label:'Fertilização in vitro',href:'/dashboard/acompanhamento?specialty=ginecologia',icon:Sparkles},
 pediatria:{label:'Pediatria',href:followupTabHref('pediatria'),icon:Baby},
 vacina_gestacional:{label:'Gestacional',href:'/dashboard/acompanhamento?view=vaccination',icon:Syringe},
 vacina_infantil:{label:'Infantil',href:followupTabHref('vacina_infantil'),icon:Syringe},
};
export function FollowupNavigation({role,specialty,active,onSelect}:{role:string;specialty:string;active:FollowupTab;onSelect?:(tab:FollowupTab)=>boolean|void}){
 const sections=followupNavigation(role,specialty);
 return <nav className={styles.navigation} data-followup-navigation="true" aria-label="Acompanhamento e vacinação por especialidade">
 {([['Acompanhamento',sections.followups],['Vacinação',sections.vaccination]] as const).filter(([,tabs])=>tabs.length).map(([label,tabs])=><div className={styles.group} key={label}><span className={styles.label}>{label}</span><div className={styles.tabs}>{tabs.map(tab=>{const item=items[tab],Icon=item.icon;return <Link key={tab} className={styles.tab} data-childhood={tab==='pediatria'||tab==='vacina_infantil'} aria-current={active===tab?'page':undefined} href={item.href} aria-label={`${label} ${item.label}`} onClick={e=>{if(active===tab){e.preventDefault();return}if(onSelect?.(tab))e.preventDefault()}}><Icon size={15}/>{item.label}</Link>})}</div></div>)}
 </nav>;
}
