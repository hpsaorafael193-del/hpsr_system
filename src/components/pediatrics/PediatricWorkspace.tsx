'use client';
import { useCallback,useEffect,useMemo,useRef,useState } from 'react';
import {PediatricDocumentViewer} from './PediatricDocumentViewer';
import {pediatricSnapshot,type PediatricSnapshot} from '@/lib/pediatric-document';
import {pediatricNextDate,type PediatricFrequency} from '@/lib/pediatric-planning';
import { StyledSelect } from '@/components/ui/StyledSelect';
import { FollowupNavigation } from '@/components/followup/FollowupNavigation';
import type {FollowupTab} from '@/lib/followup-navigation';
import { Baby,Stethoscope,Plus,History,RefreshCcw,Syringe,Pencil,List,X,Save,CalendarDays } from 'lucide-react';
import { useCurrentUserProfile } from '@/components/auth/CurrentUserProfileProvider';
import { usePatientSelection } from '@/components/patients/PatientSelectionProvider';
import { VaccinationWorkspace } from '@/components/vaccination/VaccinationWorkspace';
import { createClient } from '@/lib/supabase';
import { hpsrConfirm } from '@/components/ui/HpsrDialogProvider';
import { isLinkedActiveFollowup } from '@/lib/followup-plan-visibility';
import { addPlanningDays } from '@/lib/obstetric-planning';
import { canAccessPediatrics,pediatricVisit,pediatricGuardianReturn,nextPediatricConsultation,pediatricVaccineGuidance,validatePediatricPlan,type PediatricPlan,type PediatricVisit } from '@/lib/pediatric-planning';
import styles from './pediatrics.module.css';
import {filterPediatricPatients,patientAgeLabel} from '@/lib/patient-age-group';

type Guardian={id:string;child_passport:string;guardian_passport:string;guardian_name:string|null;access_status:string};
type PatientLink={doctor_id:string;patient_passport:string;specialty:string};
const format=(date:string|null|undefined)=>date?date.slice(0,10).split('-').reverse().join('/'):'—';
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const matches=(s:string)=>['pediatria','pediatra'].includes(s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase());
const blank=():PediatricPlan=>({frequency:'quinzenal',id:'',patient_passport:'',doctor_id:'',doctor_name:'',patient_name:'',guardian_link_id:null,start_date:today(),next_return:today(),title:'Acompanhamento de rotina',notes:'',status:'ativo',consultations:[],updated_at:'',updated_by_name:'',revisions:[]});
function Field({label,children,full=false}:{label:string;children:React.ReactNode;full?:boolean}){return <label className={`${styles.field} ${full?styles.full:''}`}><span>{label}</span>{children}</label>}
export function PediatricWorkspace({activeTab='pediatria',onNavigate}:{activeTab?:FollowupTab;onNavigate?:(tab:FollowupTab)=>void}={}){
 const {profile,loading:profileLoading}=useCurrentUserProfile();
 const {patients,selectPatient,loading:patientsLoading}=usePatientSelection();
 const [plans,setPlans]=useState<PediatricPlan[]>([]),[links,setLinks]=useState<PatientLink[]>([]),[guardians,setGuardians]=useState<Guardian[]>([]);
 const [draft,setDraft]=useState<PediatricPlan>(blank),[dirty,setDirty]=useState(false),[ready,setReady]=useState(false);
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const [history,setHistory]=useState(false),[search,setSearch]=useState(''),[view,setView]=useState<'planning'|'vaccination'>('planning');
 const [editor,setEditor]=useState<PediatricVisit|null>(null),[vaccines,setVaccines]=useState<string[]>([]);
 const [documentReady,setDocumentReady]=useState(false);
 const [quantity,setQuantity]=useState(1),[preview,setPreview]=useState<{snapshot:PediatricSnapshot;visitId?:string;version:string}|null>(null);
 const [publications,setPublications]=useState<Array<{id:string;visit_id:string|null}>>([]);
 const initialized=useRef(''); const draftKey=`hpsr-pediatric-draft:${profile.id}`;
 const allowed=canAccessPediatrics(profile.role,profile.specialty);
 const patient=patients.find(p=>p.passport===draft.patient_passport);
 const ownLink=links.some(l=>l.doctor_id===profile.id&&l.patient_passport===draft.patient_passport&&matches(l.specialty));
 const canEdit=allowed&&(profile.role==='Vice Diretor / Dev'||((!draft.id||draft.doctor_id===profile.id)&&ownLink));
 const active=plans.filter(p=>isLinkedActiveFollowup(p,links,matches));
 const childGuardians=guardians.filter(g=>g.child_passport===draft.patient_passport&&g.access_status==='authorized');
 const guardian=guardians.find(g=>g.id===draft.guardian_link_id);
 const guardianLabel=guardian?(guardian.guardian_name||patients.find(p=>p.passport===guardian.guardian_passport)?.name||`Passaporte ${guardian.guardian_passport}`):'Responsável não informado';
 const eligible=useMemo(()=>filterPediatricPatients(patients,'children'),[patients]);
 const pending=useMemo(()=>pediatricVaccineGuidance(patient?.age||'',vaccines),[patient?.age,vaccines]);
 const load=useCallback(async()=>{
  if(!profile.id||!allowed)return;const c=createClient();if(!c)return;setLoading(true);setError('');
  try{const [p,l,g]=await Promise.all([
   c.from('pediatric_followups').select('*').order('updated_at',{ascending:false}),
   c.from('patient_doctor_links').select('doctor_id,patient_passport,specialty'),
   c.from('patient_guardian_links').select('id,child_passport,guardian_passport,guardian_name,access_status').eq('access_status','authorized')
  ]);if(p.error||l.error||g.error)throw new Error(p.error?.message||l.error?.message||g.error?.message);setPlans((p.data||[]) as PediatricPlan[]);setLinks(l.data||[]);setGuardians(g.data||[]);}catch(e){setError(e instanceof Error?e.message:'Não foi possível carregar os acompanhamentos.');}finally{setLoading(false);}
 },[profile.id,allowed]);
 useEffect(()=>{void load()},[load]);
 useEffect(()=>{if(activeTab==='pediatria')setView('planning');if(activeTab==='vacina_infantil')setView('vaccination')},[activeTab]);
 useEffect(()=>{if(!profile.id||initialized.current===profile.id)return;initialized.current=profile.id;try{const raw=JSON.parse(localStorage.getItem(draftKey)||'null');if(raw?.patient_passport&&Array.isArray(raw.consultations)){setDraft(raw);setDirty(true);setMessage('Rascunho recuperado. Confira os dados antes de salvar.');}}catch{/* Rascunho inválido não altera o registro salvo. */}setReady(true)},[profile.id,draftKey]);
 useEffect(()=>{if(!ready||!profile.id)return;try{if(dirty)localStorage.setItem(draftKey,JSON.stringify(draft));else localStorage.removeItem(draftKey)}catch{/* O registro persistido continua disponível. */}},[draft,dirty,ready,draftKey,profile.id]);
 useEffect(()=>{if(!dirty)return;const f=(e:BeforeUnloadEvent)=>e.preventDefault();window.addEventListener('beforeunload',f);return()=>window.removeEventListener('beforeunload',f)},[dirty]);
 useEffect(()=>{let live=true;setVaccines([]);if(!draft.patient_passport)return;const c=createClient();if(!c)return;void c.from('clinical_records').select('payload').eq('record_type','Vacina').eq('patient_passport',draft.patient_passport).then(({data,error:e})=>{if(!live)return;if(e){setError('Não foi possível consultar as doses. Abra a caderneta antes de definir as vacinas.');return}setVaccines((data||[]).filter(r=>r.payload?.vaccine?.group==='crianca').flatMap(r=>[String(r.payload?.vaccine?.name||''),String(r.payload?.vaccine?.slotId||'')]))});return()=>{live=false}},[draft.patient_passport]);
 function change(patch:Partial<PediatricPlan>){setDraft(d=>({...d,...patch}));setDirty(true);setMessage('')}
 function changeConsultations(consultations:PediatricVisit[]){change({consultations,next_return:nextPediatricConsultation(consultations,draft.start_date,draft.frequency)||null})}
 async function discard(){return !dirty||await hpsrConfirm('Há alterações em rascunho. Deseja descartá-las para abrir outro acompanhamento?','Alterações não salvas')}
 async function open(p:PediatricPlan){if(!await discard())return;setDraft(structuredClone(p));setDirty(false);setEditor(null);setView('planning');setMessage('');setError('');setHistory(false)}
 async function newPlan(passport=''){if(!await discard())return;const p=patients.find(p=>p.passport===passport);const d=blank();d.patient_passport=passport;d.patient_name=p?.name||'';d.doctor_id=profile.id;d.doctor_name=profile.characterName;d.consultations=[pediatricVisit(d.start_date,0)];d.guardian_link_id=guardians.find(g=>g.child_passport===passport)?.id||null;setDraft(d);setDirty(Boolean(passport));setEditor(null);setView('planning');setMessage('');setError('')}
 function changeStart(value:string){
  if(!draft.id&&value&&draft.start_date){const delta=Math.round((Date.parse(value)-Date.parse(draft.start_date))/86400000);change({start_date:value,next_return:draft.next_return?addPlanningDays(draft.next_return,delta):null,consultations:draft.consultations.map(v=>({...v,date:addPlanningDays(v.date,delta)}))})}else change({start_date:value});
 }
 async function save(candidate=draft){
  if(!canEdit)return setError('Somente o pediatra com vínculo ativo ou Vice Diretor / Dev pode editar.');
  const validation=validatePediatricPlan(candidate);if(validation)return setError(validation);
  if(!candidate.patient_passport)return setError('Selecione a criança.');
  const c=createClient();if(!c)return setError('Sessão indisponível.');setBusy(true);setError('');
  try{const values={publication_notes:candidate.publication_notes||'',frequency:candidate.frequency||'quinzenal',title:candidate.title,guardian_link_id:candidate.guardian_link_id,start_date:candidate.start_date,next_return:candidate.next_return,notes:candidate.notes,status:candidate.status,consultations:candidate.consultations};
   const query=candidate.id?c.from('pediatric_followups').update(values).eq('id',candidate.id).eq('updated_at',candidate.updated_at):c.from('pediatric_followups').insert({...values,patient_passport:candidate.patient_passport,doctor_id:profile.id});
   const {data,error:e}=await query.select('*').maybeSingle();if(e)throw new Error(e.message);if(!data)throw new Error('Este acompanhamento foi alterado por outro profissional. Seu rascunho foi preservado; atualize e confira antes de salvar.');
   setDraft(data as PediatricPlan);setDirty(false);setEditor(null);setMessage('Acompanhamento salvo.');await load();
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível salvar.')}finally{setBusy(false)}
 }
 function addVisit(kind:'consultation'|'guardian_return'='consultation'){
  const medical=draft.consultations.filter(v=>v.kind!=='guardian_return');
  const last=[...medical].sort((a,b)=>(b.actual_date||b.date).localeCompare(a.actual_date||a.date))[0];
  const v=kind==='guardian_return'?pediatricGuardianReturn(addPlanningDays(last?.actual_date||last?.date||draft.start_date,1)):pediatricVisit(draft.start_date,medical.length);
  if(kind==='consultation'&&last)v.date=pediatricNextDate(last.actual_date||last.date,1,draft.frequency||'quinzenal');
  if(kind==='consultation'&&draft.consultations.some(item=>item.date===v.date)){setError('Já existe um atendimento nessa data. Confira a data no planejamento antes de adicionar outra consulta.');return;}
  while(draft.consultations.some(item=>item.date===v.date))v.date=addPlanningDays(v.date,1);
  changeConsultations([...draft.consultations,v]);setEditor(v);
 }
 function addConsultations(){
  if(!Number.isInteger(quantity)||quantity<1||quantity>500-draft.consultations.length)return setError('Confira a quantidade de consultas.');
  const medical=draft.consultations.filter(v=>v.kind!=='guardian_return');const last=[...medical].sort((a,b)=>b.date.localeCompare(a.date))[0];
  const base=last?.date||draft.start_date;const generated=Array.from({length:quantity},(_,i)=>({...pediatricVisit(draft.start_date,medical.length+i),date:pediatricNextDate(base,i+(last?1:0),draft.frequency||'quinzenal')}));
  if(generated.some(v=>draft.consultations.some(old=>old.date===v.date)))return setError('Há um atendimento em uma das datas sugeridas. Ajuste as datas antes de continuar.');
  changeConsultations([...draft.consultations,...generated]);setError('');
 }
 const publicationRequest=useRef(0);
 const loadPublications=useCallback(async()=>{const request=++publicationRequest.current;setPublications([]);const c=createClient();if(!c||!draft.id)return;const {data,error:e}=await c.from('pediatric_plan_publications').select('id,visit_id').eq('plan_id',draft.id).eq('published',true);if(request!==publicationRequest.current)return;if(e){setError('Não foi possível conferir as publicações.');return;}setPublications(data||[]);},[draft.id]);
 useEffect(()=>{void loadPublications();return()=>{publicationRequest.current++}},[loadPublications]);
 async function showDocument(visitId?:string){if(dirty||!draft.id)return setError('Salve o planejamento antes de gerar a versão para publicação.');const c=createClient();if(!c)return;setBusy(true);setError('');try{const {data,error:e}=await c.rpc('hpsr_preview_pediatric_plan',{p_plan:draft.id,p_visit:visitId||null});if(e)throw e;setDocumentReady(false);setPreview({snapshot:pediatricSnapshot(data),visitId,version:draft.updated_at});}catch(e){setError(e instanceof Error?e.message:'Não foi possível gerar a prévia.');}finally{setBusy(false)}}
 async function publishDocument(){if(!preview||dirty||preview.version!==draft.updated_at)return setError('Salve e gere a prévia atualizada antes de publicar.');const c=createClient();if(!c)return;setBusy(true);try{const {error:e}=await c.rpc('hpsr_publish_pediatric_plan_v2',{p_plan:draft.id,p_expected:preview.version,p_visit:preview.visitId||null,p_snapshot:preview.snapshot});if(e)throw e;await loadPublications();setMessage('Planejamento publicado no portal da criança e dos responsáveis autorizados.');setPreview(null);}catch(e){setError(e instanceof Error?e.message:'Não foi possível publicar.');}finally{setBusy(false);}}
 async function recalculate(){
  if(draft.frequency==='personalizado')return setError('Ajuste as datas individualmente para esta periodicidade.');
  const medical=[...draft.consultations].filter(v=>v.kind!=='guardian_return').sort((a,b)=>a.date.localeCompare(b.date));
  const done=medical.filter(v=>v.status==='realizada').sort((a,b)=>(a.actual_date||a.date).localeCompare(b.actual_date||b.date));const pending=medical.filter(v=>v.status!=='realizada');if(!pending.length)return;
  if(!await hpsrConfirm('Recalcular as consultas previstas pela periodicidade selecionada? Datas ajustadas manualmente serão substituídas. Atendimentos realizados e retornos com responsáveis serão preservados.','Recalcular próximas consultas'))return;
  const base=done.at(-1)?.actual_date||done.at(-1)?.date||pending[0].date;
  const dates=new Map(pending.map((v,i)=>[v.id,pediatricNextDate(base,i+(done.length?1:0),draft.frequency||'quinzenal')]));
  const consultations=draft.consultations.map(v=>({...v,date:dates.get(v.id)||v.date}));
  const validation=validatePediatricPlan({...draft,consultations});if(validation)return setError(validation);
  change({consultations,next_return:nextPediatricConsultation(consultations,draft.start_date,draft.frequency)||null});setError('');
 }
 async function withdrawPublication(id:string){const c=createClient();if(!c)return;setBusy(true);const {error:e}=await c.from('pediatric_plan_publications').update({published:false}).eq('id',id);setBusy(false);if(e)return setError(e.message);await loadPublications();setMessage('Publicação retirada do portal; o histórico foi preservado.');}
 function updateVisit(v:PediatricVisit){setEditor(v);changeConsultations(draft.consultations.map(item=>item.id===v.id?v:item))}
 async function saveVisit(){if(!editor)return;const visits=draft.consultations.map(v=>v.id===editor.id?editor:v);const candidate={...draft,consultations:visits,next_return:nextPediatricConsultation(visits,draft.start_date,draft.frequency)||null};change(candidate);await save(candidate)}
 function openVaccines(){if(draft.patient_passport)selectPatient(draft.patient_passport);setView('vaccination')}
 const navigation=<FollowupNavigation role={profile.role} specialty={profile.specialty} active={view==='vaccination'?'vacina_infantil':'pediatria'} onSelect={tab=>{if(tab==='pediatria'){setView('planning');onNavigate?.(tab);return true}if(tab==='vacina_infantil'){openVaccines();onNavigate?.(tab);return true}if(onNavigate){onNavigate(tab);return true}return false}}/>;
 if(profileLoading)return <p className="p-6">Verificando acesso...</p>;
 if(!allowed)return <section className="p-6"><h1>Acompanhamento pediátrico</h1><p>Acesso destinado à Pediatria e à direção.</p></section>;
 const lastVisit=[...draft.consultations].filter(v=>v.kind!=='guardian_return'&&v.status==='realizada').sort((a,b)=>(b.actual_date||b.date).localeCompare(a.actual_date||a.date))[0];
 return <div className={`hpsr-page ${styles.workspace}`} data-pediatric-workspace="true">
  <header className={styles.header}><div className={styles.heading}><div className={styles.badge}><Stethoscope size={28}/></div><div><p className={styles.eyebrow}>Acompanhamento médico</p><h1>{view==='vaccination'?'Vacinação infantil':'Acompanhamento pediátrico'}</h1><p className={styles.muted}>{view==='vaccination'?'Consulte a caderneta e registre as vacinas da criança.':'Organize as consultas e acompanhe o desenvolvimento da criança.'}</p></div></div>{navigation}</header>
  {error&&<p role="alert" className={styles.error}>{error}</p>}{message&&<p role="status" className={styles.notice}>{message}</p>}
  {view==='vaccination'?<><button className={styles.button} onClick={()=>setView('planning')}>Voltar ao acompanhamento</button><VaccinationWorkspace key={draft.patient_passport} mode="childhood"/></>:<div className={styles.columns}>
   <section className={styles.panel}><div className={styles.sectionHeading}><div><h2>Dados do acompanhamento</h2><p className={styles.muted}>Cadastre e gerencie o acompanhamento pediátrico da criança.</p></div><div className={styles.actions}><button disabled={busy} onClick={()=>void newPlan()} className={styles.primary}><Plus size={15}/>Novo acompanhamento</button><button onClick={()=>setHistory(true)} className={styles.button}><History size={15}/>Histórico</button><button disabled={busy||loading} onClick={()=>void load()} className={styles.button}><RefreshCcw size={15}/>Atualizar</button></div></div>
   <div className={styles.form}><Field label="Acompanhamento ativo" full><select value={draft.id} disabled={busy} onChange={e=>{const p=plans.find(p=>p.id===e.target.value);if(p)void open(p);else void newPlan()}}><option value="">Novo acompanhamento</option>{draft.id&&!active.some(p=>p.id===draft.id)&&<option value={draft.id}>{draft.patient_name} · histórico</option>}{active.map(p=><option key={p.id} value={p.id}>{p.patient_name} · {p.doctor_name}</option>)}</select></Field>
   <Field label="Paciente" full><StyledSelect aria-label="Selecionar paciente" searchable disabled={busy||patientsLoading||Boolean(draft.id)} value={draft.patient_passport} onChange={e=>void newPlan(e.target.value)}><option value="">{patientsLoading?'Carregando…':'Selecione o paciente'}</option>{draft.patient_passport&&!eligible.some(p=>p.passport===draft.patient_passport)&&<option value={draft.patient_passport}>{patient?.name||draft.patient_name} · {draft.patient_passport}</option>}{eligible.map(p=><option key={p.passport} value={p.passport}>{p.name} · {p.passport} · {patientAgeLabel(p.age)}</option>)}</StyledSelect></Field>
   <Field label="Responsável"><select value={draft.guardian_link_id||''} disabled={!canEdit||busy} onChange={e=>change({guardian_link_id:e.target.value||null})}><option value="">Responsável não informado</option>{childGuardians.map(g=><option key={g.id} value={g.id}>{g.guardian_name||patients.find(p=>p.passport===g.guardian_passport)?.name||g.guardian_passport}</option>)}</select></Field>
   <div className={styles.facts}>{[['Idade',patientAgeLabel(patient?.age)],['Médico responsável',draft.doctor_name||profile.characterName]].map(([k,v])=><div className={styles.fact} key={k}><small>{k}</small>{v}</div>)}</div>
   <Field label="Início do acompanhamento"><input type="date" value={draft.start_date} disabled={!canEdit||busy} onChange={e=>changeStart(e.target.value)}/></Field><Field label="Próxima consulta da criança"><input type="date" value={draft.next_return||''} disabled={!canEdit||busy} onChange={e=>change({next_return:e.target.value||null})}/></Field>
   <Field label="Periodicidade combinada"><select disabled={!canEdit||busy} value={draft.frequency||'quinzenal'} onChange={e=>change({frequency:e.target.value as PediatricFrequency,next_return:nextPediatricConsultation(draft.consultations,draft.start_date,e.target.value as PediatricFrequency)||null})}><option value="semanal">Uma consulta por semana</option><option value="quinzenal">Uma consulta a cada 15 dias</option><option value="mensal">Uma consulta por mês</option><option value="personalizado">Datas combinadas individualmente</option></select><button type="button" className={styles.button} disabled={!canEdit||busy||draft.frequency==='personalizado'} onClick={()=>void recalculate()}>Recalcular próximas consultas</button></Field>
   <Field label="Consultas a adicionar"><input disabled={!canEdit||busy} type="number" min={1} max={500-draft.consultations.length} value={quantity} onChange={e=>setQuantity(Number(e.target.value))}/><button type="button" disabled={!canEdit||busy} className={styles.button} onClick={addConsultations}>Montar consultas</button></Field>
   <Field label="Observações do pediatra para o paciente" full><textarea value={draft.publication_notes||''} disabled={!canEdit||busy} onChange={e=>change({publication_notes:e.target.value})} maxLength={8000} placeholder="Estas observações aparecem na ficha publicada"/></Field><Field label="Anotações internas do acompanhamento" full><textarea value={draft.notes} disabled={!canEdit||busy} onChange={e=>change({notes:e.target.value})} placeholder="Informações gerais do acompanhamento" maxLength={8000}/></Field>
   </div><div className={styles.divider}/><div className={styles.sectionHeading}><div><h2>Planejamento das consultas</h2><p className={styles.muted}>Consultas da criança e conversas com os responsáveis, organizadas individualmente.</p></div><div className={styles.actions}><button disabled={!canEdit||busy} onClick={()=>addVisit('consultation')} className={styles.primary}><Plus size={15}/>Adicionar consulta</button><button disabled={!canEdit||busy} onClick={()=>addVisit('guardian_return')} className={styles.button}>Retorno com responsáveis</button></div></div>
   <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Consulta</th><th>Data prevista</th><th>Registro</th><th>Ações</th></tr></thead><tbody>{draft.consultations.map(v=><tr key={v.id}><td>{v.title}</td><td><input aria-label={`Data de ${v.title}`} type="date" value={v.date} disabled={!canEdit||busy} onChange={e=>changeConsultations(draft.consultations.map(item=>item.id===v.id?{...item,date:e.target.value}:item))}/></td><td><span className={styles.status} data-done={v.status==='realizada'}>{v.status==='realizada'?'Avaliação registrada':'Sem registro'}</span></td><td><button className={styles.button} disabled={busy} onClick={()=>setEditor(structuredClone(v))}><Pencil size={13}/>{canEdit?'Editar':'Consultar'}</button><button className={styles.button} disabled={busy||dirty||!draft.id} onClick={()=>void showDocument(v.id)}>Gerar individual</button></td></tr>)}</tbody></table></div>
   {!draft.consultations.length&&<p className={styles.muted}>Selecione uma criança para iniciar o planejamento.</p>}
   <div className={`${styles.actions} mt-4`}><button disabled={!canEdit||busy||!dirty} className={styles.primary} onClick={()=>void save()}><Save size={15}/>{busy?'Salvando...':'Salvar acompanhamento'}</button>{draft.id&&canEdit&&<button disabled={busy} className={styles.button} onClick={()=>change({status:draft.status==='ativo'?'concluido':'ativo'})}>{draft.status==='ativo'?'Concluir acompanhamento':'Reabrir acompanhamento'}</button>}<button className={styles.button} disabled={busy||dirty||!draft.id} onClick={()=>void showDocument()}>Gerar integral</button>{dirty&&<span className={styles.muted}>Rascunho ainda não salvo</span>}</div>
   {draft.patient_passport&&!canEdit&&<p className={`${styles.readOnly} mt-3`}>{!draft.id&&!ownLink?'Paciente selecionado do prontuário. Para salvar o acompanhamento, é necessário um vínculo pediátrico ativo com o médico responsável.':'Consulta do histórico. Edição disponível ao médico responsável com vínculo ativo e ao Vice Diretor / Dev.'}</p>}
   </section>
   <aside className={styles.panel}><h2>Resumo do acompanhamento</h2><div className={styles.card}><p className={styles.summaryTitle}>{patient?.name||draft.patient_name||'Selecione a criança'}{patient?.age?` · ${patient.age}`:''}</p><p className={styles.muted}>Passaporte: {draft.patient_passport||'—'}</p></div><div className={styles.summaryRow}><span>Responsável</span><span>{guardianLabel}</span></div><div className={styles.summaryRow}><span>Última consulta</span><span>{format(lastVisit?.actual_date||lastVisit?.date)}</span></div><div className={styles.summaryRow}><span>Próxima consulta</span><span>{format(draft.next_return)}</span></div>
   <section className={styles.summaryBlock}><h3><Syringe size={17} className="mr-2 inline"/>VACINAÇÃO</h3><p className={styles.muted}>Caderneta infantil e aplicações já registradas da criança.</p><button disabled={!draft.patient_passport} className={`${styles.primary} mt-3 w-full`} onClick={openVaccines}>Vacinação infantil</button>{draft.patient_passport&&<p className={`${styles.muted} mt-3`}>{pending.length?`${pending.length} faixas da caderneta para conferir conforme a idade cadastrada.`:'Confira a caderneta e o histórico com o responsável.'}</p>}</section>
   <section className={styles.summaryBlock}><h3>Orientações aos responsáveis</h3><p className={styles.muted}>{[...draft.consultations].filter(v=>v.status==='realizada'&&v.conduct).sort((a,b)=>(b.actual_date||b.date).localeCompare(a.actual_date||a.date))[0]?.conduct||'Registre as orientações em cada atendimento.'}</p></section>

   <section className={styles.summaryBlock}><h3>Publicações no portal</h3>{publications.length?publications.map(pub=><div className={styles.card} key={pub.id}><span>{pub.visit_id?draft.consultations.find(v=>v.id===pub.visit_id)?.title||'Individual':'Planejamento integral'}</span>{canEdit&&<button disabled={busy} className={styles.button} onClick={()=>void withdrawPublication(pub.id)}>Retirar do portal</button>}</div>):<p className={styles.muted}>Nenhum planejamento publicado.</p>}</section>
   {draft.updated_by_name&&<p className={`${styles.muted} mt-4`}>Última alteração: {draft.updated_by_name}.</p>}
   </aside></div>}
  {editor&&<div className={styles.overlay}><section role="dialog" aria-modal="true" aria-label="Consulta pediátrica" className={styles.modal}><div className={styles.sectionHeading}><h3>{editor.title}</h3><button aria-label="Fechar consulta" className={styles.button} onClick={async()=>{setEditor(null)}}><X size={18}/></button></div>
  {error&&<p role="alert" className={styles.error}>{error}</p>}<div className={styles.form}><Field label="Data prevista"><input disabled={!canEdit||busy} type="date" value={editor.date} onChange={e=>updateVisit({...editor,date:e.target.value})}/></Field><Field label="Situação"><select disabled={!canEdit||busy} value={editor.status} onChange={e=>updateVisit({...editor,status:e.target.value as PediatricVisit['status'],actual_date:editor.actual_date||today()})}><option value="prevista">Prevista</option><option value="realizada">Realizada</option></select></Field><Field label="Planejamento deste atendimento" full><textarea disabled={!canEdit||busy} value={editor.planned} onChange={e=>updateVisit({...editor,planned:e.target.value})}/></Field>
  <h4 className={styles.full}>Dados do planejamento para publicação</h4>
  {([['exams','Exames previstos'],['vaccines','Vacinas a conferir / aplicar'],['instructions','Orientações para os responsáveis'],['observations','Observações do planejamento']] as const).map(([key,label])=><Field key={key} full label={label}><textarea disabled={!canEdit||busy} maxLength={8000} value={editor[key]||''} onChange={e=>updateVisit({...editor,[key]:e.target.value})}/></Field>)}
  <h4 className={styles.full}>Registro clínico do atendimento</h4>
  <div className={styles.full}><p className={styles.notice}>Vacinação conforme a caderneta do RP e a idade cadastrada ({patient?.age||'não informada'}). {pending.length?pending.map(s=>`${s.label}: ${s.vaccineSummary.join(', ')}`).join(' · '):'Conferir histórico e indicações com o responsável.'} A ausência de registro não comprova falta da aplicação.</p></div>
  <Field label="Data do atendimento"><input type="date" disabled={!canEdit||busy} value={editor.actual_date} onChange={e=>updateVisit({...editor,actual_date:e.target.value})}/></Field>{(editor.weight||editor.height)&&<div className={styles.form}><Field label="Peso (kg)"><input disabled={!canEdit||busy} value={editor.weight} onChange={e=>updateVisit({...editor,weight:e.target.value})}/></Field><Field label="Estatura (cm)"><input disabled={!canEdit||busy} value={editor.height} onChange={e=>updateVisit({...editor,height:e.target.value})}/></Field></div>}
  {((editor.kind==='guardian_return'?[['prevention','Resultados dos exames e esclarecimentos'],['conduct','Orientações aos responsáveis']]:[['health','Atualização geral e queixas'],['growth','Avaliação física'],['routine','Alimentação, sono e rotina'],['development','Desenvolvimento infantil'],['prevention','Exames, resultados, vacinas e prevenção'],['conduct','Conduta e orientações ao responsável']]) as Array<["health"|"growth"|"routine"|"development"|"prevention"|"conduct",string]>).map(([key,label])=><Field label={label} key={key}><textarea disabled={!canEdit||busy} value={editor[key]} maxLength={8000} onChange={e=>updateVisit({...editor,[key]:e.target.value})}/></Field>)}
  </div>{editor.author&&<p className={`${styles.muted} mt-3`}>Registrado por {editor.author.name} em {format(editor.author.at)}.</p>}<div className={`${styles.actions} mt-4`}><button disabled={!canEdit||busy} className={styles.primary} onClick={()=>void saveVisit()}><Save size={15}/>{busy?'Salvando...':'Salvar consulta'}</button></div></section></div>}
  {preview&&<div className={styles.overlay}><section role="dialog" aria-modal="true" aria-label="Prévia do planejamento pediátrico" className={styles.modal}><div className={styles.sectionHeading}><h3>{preview.visitId?'Planejamento individual':'Planejamento integral'}</h3><button aria-label="Fechar prévia" disabled={busy} className={styles.button} onClick={()=>setPreview(null)}>Fechar</button></div><p className={styles.notice}>Confira todas as páginas antes de publicar. As datas são previstas e não confirmam um agendamento. Apenas os dados desta ficha serão liberados no portal.</p><PediatricDocumentViewer snapshot={preview.snapshot} onReady={setDocumentReady}/>{error&&<p role="alert" className={styles.error}>{error}</p>}<button disabled={busy||!canEdit||dirty||!documentReady} className={styles.primary} onClick={()=>void publishDocument()}>{busy?'Publicando…':'Publicar esta versão no portal'}</button></section></div>}
  {history&&<div className={styles.overlay}><section role="dialog" aria-modal="true" aria-label="Histórico pediátrico" className={styles.modal}><div className={styles.sectionHeading}><h3>Histórico pediátrico</h3><button aria-label="Fechar histórico" className={styles.button} onClick={()=>setHistory(false)}><X size={18}/></button></div><input className={`${styles.search} mb-3`} aria-label="Buscar histórico" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar criança, passaporte ou médico"/><div className={styles.history}>{plans.filter(p=>`${p.patient_name} ${p.patient_passport} ${p.doctor_name}`.toLowerCase().includes(search.toLowerCase())).map(p=><article key={p.id} className={styles.card}><strong>{p.patient_name} · {p.patient_passport}</strong><p className={styles.muted}>{p.doctor_name} · {active.some(a=>a.id===p.id)?'Ativo':p.status==='concluido'?'Concluído':'Vínculo encerrado'} · {format(p.start_date)}</p><button className={styles.button} onClick={()=>void open(p)}>Abrir acompanhamento</button></article>)}{!plans.length&&<p className={styles.muted}>Nenhum acompanhamento pediátrico registrado.</p>}</div></section></div>}

 </div>;
}
