"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardCheck, Eye, EyeOff, FilePenLine, FileText, History, RefreshCw, Search, ShieldCheck, TriangleAlert, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { GuardianApprovalPanel } from "@/components/dashboard/GuardianApprovalPanel";
import { useCurrentUserProfile } from "@/components/auth/CurrentUserProfileProvider";
import { createClient } from "@/lib/supabase";

type Section = "vinculos"|"cadastros"|"documentos"|"ocorrencias"|"historico";
type Patient = {passport:string;name:string;age:string|null;follow_up:string};
type Activity = {id:string;module:string;action:string;description:string;actor:string|null;reference:string|null;created_at:string};
type InternalDocument = {id:string;record_type:string;patient_passport:string|null;history_title:string|null;history_patient_name:string|null;history_doctor_name:string|null;is_confidential:boolean;released_at:string|null;updated_at:string};
const sections: {id:Section;label:string;detail:string;icon:typeof UsersRound}[] = [
  {id:"vinculos",label:"Vínculos",detail:"Autorizações familiares",icon:UsersRound},
  {id:"cadastros",label:"Cadastros",detail:"Conferência e correção",icon:FilePenLine},
  {id:"documentos",label:"Documentos",detail:"Metadados e publicação",icon:FileText},
  {id:"ocorrencias",label:"Ocorrências",detail:"Pendências internas",icon:TriangleAlert},
  {id:"historico",label:"Histórico",detail:"Rastreabilidade",icon:History},
];
const inputClass="w-full min-h-[43px] rounded-[12px] border border-hpsr-border bg-[#fffdfa] px-3 py-2 text-sm text-hpsr-text outline-none focus:border-[#b88c75] focus:ring-2 focus:ring-[#ead4c4]";
const formatDate=(value:string)=>new Date(value).toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"});

export default function InternalPage(){
  const {profile}=useCurrentUserProfile();
  const [permitted,setPermitted]=useState<boolean|null>(null);
  const [section,setSection]=useState<Section>("vinculos");
  const [notice,setNotice]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);
  const [query,setQuery]=useState("");
  const [patients,setPatients]=useState<Patient[]>([]);
  const [selected,setSelected]=useState<Patient|null>(null);
  const [name,setName]=useState("");const [age,setAge]=useState("");const [reason,setReason]=useState("");
  const [issueTitle,setIssueTitle]=useState("");const [issueCategory,setIssueCategory]=useState("Cadastro");const [issueDetails,setIssueDetails]=useState("");
  const [activities,setActivities]=useState<Activity[]>([]);
  const [resolution,setResolution]=useState<Record<string,string>>({});
  const [documentQuery,setDocumentQuery]=useState("");
  const [documents,setDocuments]=useState<InternalDocument[]>([]);
  const [selectedDocument,setSelectedDocument]=useState<InternalDocument|null>(null);
  const [documentTitle,setDocumentTitle]=useState("");
  const [documentReason,setDocumentReason]=useState("");
  useEffect(()=>{
    let active=true;
    const client=createClient();
    if(!client||!["Diretora","Vice Diretor / Dev"].includes(profile.role)){setPermitted(false);return;}
    setPermitted(null);
    void client.rpc("hpsr_can_access_internal").then(({data,error:rpcError})=>{if(active)setPermitted(!rpcError&&data===true);});
    return()=>{active=false;};
  },[profile.id,profile.role]);
  const loadPatients=useCallback(async(search="")=>{
    const client=createClient();if(!client||!permitted)return;
    setLoading(true);setError("");
    const clean=search.trim().slice(0,80);
    let request=client.from("patient_registry").select("passport,name,age,follow_up").order("updated_at",{ascending:false}).limit(35);
    if(clean)request=request.or(`passport.ilike.%${clean.replace(/[,%()]/g,"")}%,name.ilike.%${clean.replace(/[,%()]/g,"")}%`);
    const {data,error:requestError}=await request;
    if(requestError)setError(requestError.message);else setPatients((data||[]) as Patient[]);
    setLoading(false);
  },[permitted]);
  const loadDocuments=useCallback(async(search="")=>{
    const client=createClient();if(!client||!permitted)return;
    setLoading(true);setError("");
    const clean=search.trim().slice(0,80).replace(/[,%()]/g,"");
    let request=client.from("clinical_records")
      .select("id,record_type,patient_passport,history_title,history_patient_name,history_doctor_name,is_confidential,released_at,updated_at")
      .in("record_type",["Documento","documento","Exame","exame"])
      .order("updated_at",{ascending:false}).limit(120);
    if(clean)request=request.or(`patient_passport.ilike.%${clean}%,history_title.ilike.%${clean}%,history_patient_name.ilike.%${clean}%`);
    const {data,error:requestError}=await request;
    if(requestError)setError(requestError.message);else setDocuments((data||[]) as InternalDocument[]);
    setLoading(false);
  },[permitted]);
  const loadActivities=useCallback(async()=>{
    const client=createClient();if(!client||!permitted)return;
    setLoading(true);setError("");
    const {data,error:requestError}=await client.from("system_activities")
      .select("id,module,action,description,actor,reference,created_at")
      .in("module",["Interno","Cadastro infantil"]).order("created_at",{ascending:false}).limit(180);
    if(requestError)setError(requestError.message);else setActivities((data||[]) as Activity[]);
    setLoading(false);
  },[permitted]);
  useEffect(()=>{if(!permitted)return;if(section==="cadastros")void loadPatients();if(section==="documentos")void loadDocuments();if(section==="ocorrencias"||section==="historico")void loadActivities();},[permitted,section,loadPatients,loadDocuments,loadActivities]);
  const issueList=useMemo(()=>{
    const resolved=new Set(activities.filter(a=>a.action==="Ocorrência resolvida").map(a=>a.reference));
    return activities.filter(a=>a.action==="Ocorrência registrada").map(a=>({...a,resolved:resolved.has(a.reference)}));
  },[activities]);
  const choose=(p:Patient)=>{setSelected(p);setName(p.name);setAge(p.age||"");setReason("");setNotice("");setError("");};
  const call=async<T,>(promise:PromiseLike<{data:T|null;error:{message:string}|null}>,onSuccess:(result:T|null)=>void)=>{
    setLoading(true);setError("");setNotice("");
    try{const {data,error:rpcError}=await promise;if(rpcError)throw new Error(rpcError.message);onSuccess(data);}catch(err){setError(err instanceof Error?err.message:"Operação não concluída.");}finally{setLoading(false);}
  };
  async function correctPatient(){
    if(!selected||reason.trim().length<10||name.trim().length<2)return;
    const client=createClient();if(!client)return;
    await call(client.rpc("hpsr_internal_correct_patient",{p_passport:selected.passport,p_name:name.trim(),p_age:age.trim(),p_reason:reason.trim()}),result=>{
      const updated=Boolean((result as {updated?:boolean}|null)?.updated);
      setNotice(updated?"Cadastro corrigido. A alteração foi registrada no histórico.":"Nenhuma informação foi alterada.");
      setSelected(null);setReason("");void loadPatients(query);
    });
  }
  async function createIssue(){
    if(issueTitle.trim().length<4)return;
    const client=createClient();if(!client)return;
    await call(client.rpc("hpsr_internal_create_issue",{p_title:issueTitle.trim(),p_category:issueCategory,p_description:issueDetails.trim()}),()=>{
      setIssueTitle("");setIssueDetails("");setNotice("Ocorrência registrada no histórico interno.");void loadActivities();
    });
  }
  async function resolveIssue(ref:string){
    const note=(resolution[ref]||"").trim();if(note.length<8)return;
    const client=createClient();if(!client)return;
    await call(client.rpc("hpsr_internal_resolve_issue",{p_reference:ref,p_resolution:note}),()=>{
      setResolution(s=>({...s,[ref]:""}));setNotice("Ocorrência encerrada e registrada no histórico.");void loadActivities();
    });
  }
  const chooseDocument=(item:InternalDocument)=>{setSelectedDocument(item);setDocumentTitle(item.history_title||item.record_type);setDocumentReason("");setNotice("");setError("");};
  async function correctDocumentMetadata(){
    if(!selectedDocument||selectedDocument.record_type.toLowerCase()!=="documento"||documentTitle.trim().length<3||documentReason.trim().length<10)return;
    const client=createClient();if(!client)return;
    await call(client.rpc("hpsr_internal_correct_record_metadata",{p_record_id:selectedDocument.id,p_title:documentTitle.trim(),p_reason:documentReason.trim()}),()=>{
      setNotice("Metadados do documento corrigidos. O conteúdo clínico e a versão já liberada no Portal não foram alterados.");setSelectedDocument(null);setDocumentReason("");void loadDocuments(documentQuery);void loadActivities();
    });
  }
  async function setDocumentVisibility(confidential:boolean){
    if(!selectedDocument||documentReason.trim().length<10)return;
    const client=createClient();if(!client)return;
    await call(client.rpc("hpsr_internal_set_record_visibility",{p_record_id:selectedDocument.id,p_confidential:confidential,p_reason:documentReason.trim()}),()=>{
      setNotice(confidential?"Registro recolhido do Portal com auditoria administrativa.":"Registro liberado ao Portal com auditoria administrativa.");setSelectedDocument(null);setDocumentReason("");void loadDocuments(documentQuery);void loadActivities();
    });
  }
  if(permitted===null)return <div className="hpsr-page"><PageHeader eyebrow="Administração" title="Interno" description="Verificando identidade administrativa..."/><p className="rounded-xl border border-hpsr-border bg-[#f7eee5] p-5 text-sm">Verificando autorização da Diretora e do Dev...</p></div>;
  if(!permitted)return <div className="hpsr-page"><PageHeader eyebrow="Administração" title="Acesso restrito" description="Área reservada às identidades administrativas autorizadas."/><section className="rounded-xl border border-hpsr-border bg-[#f7eee5] p-5"><p className="font-semibold">O Interno está disponível exclusivamente para a Diretora e o Vice-Diretor / Dev autorizados.</p><Link className="mt-3 inline-block text-sm font-bold text-hpsr-wine underline" href="/dashboard">Voltar ao início</Link></section></div>;
  return <div className="hpsr-page gap-4 pb-5">
    <PageHeader eyebrow="Administração interna" title="Interno" description="Conferência, validação e correção de dados do Hospital São Rafael."/>
    <section className="rounded-[18px] border border-[#d7c2b0] bg-[#f1e4d5] px-4 py-4 sm:px-5">
      <div className="flex items-center gap-3"><span className="rounded-xl border border-[#d0b39d] bg-[#fff8f0] p-2"><ShieldCheck className="text-hpsr-wine" size={23}/></span><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-hpsr-wine">Gestão interna</p><h1 className="text-xl font-black text-hpsr-text">Central Interno</h1><p className="text-xs font-semibold text-hpsr-muted">{profile.characterName} · {profile.role} · uso administrativo com auditoria</p></div></div>
    </section>
    <nav aria-label="Seções do Interno" className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">{sections.map(s=>{const Icon=s.icon;return <button key={s.id} type="button" onClick={()=>{setSection(s.id);setNotice("");setError("");}} aria-current={section===s.id?"page":undefined} className={`flex min-w-0 items-center gap-3 rounded-[15px] border px-4 py-3 text-left transition ${section===s.id?"border-[#ae856b] bg-[#e9d7c6] shadow-[inset_4px_0_0_#75442e]":"border-hpsr-border bg-[#faf3ea] hover:border-[#d0ad92]"}`}><Icon size={21} className="shrink-0 text-hpsr-wine"/><span><span className="block text-sm font-black text-hpsr-text">{s.label}</span><span className="text-xs text-hpsr-muted">{s.detail}</span></span></button>;})}</nav>
    {error&&<p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {notice&&<p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p>}
    {section==="vinculos"&&<GuardianApprovalPanel/>}
    {section==="cadastros"&&<section className="space-y-4 rounded-[19px] border border-hpsr-border bg-[#f7f0e7] p-4 sm:p-5">
      <div className="flex flex-wrap justify-between gap-3"><div><h2 className="flex items-center gap-2 font-black text-hpsr-text"><ClipboardCheck size={19}/>Conferência de pacientes</h2><p className="text-xs text-hpsr-muted">Corrija apenas dados administrativos. Passaportes, históricos e registros médicos não são alterados aqui.</p></div><Link className="rounded-xl border border-hpsr-border bg-[#fffaf4] px-3 py-2 text-xs font-bold text-hpsr-wine" href="/dashboard/prontuarios">Abrir Prontuários</Link></div>
      <form className="flex flex-wrap gap-2" onSubmit={e=>{e.preventDefault();setSelected(null);void loadPatients(query);}}><label className="min-w-[170px] flex-1 text-xs font-bold">Pesquisar por nome ou passaporte<input className={`mt-1 ${inputClass}`} value={query} maxLength={80} onChange={e=>setQuery(e.target.value)} placeholder="Nome ou passaporte"/></label><button type="submit" disabled={loading} className="mt-auto flex items-center gap-2 rounded-xl bg-hpsr-wine px-4 py-3 text-sm font-bold text-white disabled:opacity-50"><Search size={16}/>Pesquisar</button></form>
      <div className="max-h-[270px] space-y-2 overflow-y-auto">{patients.map(p=><button key={p.passport} type="button" onClick={()=>choose(p)} className={`flex w-full justify-between gap-3 rounded-xl border px-3 py-3 text-left text-sm ${selected?.passport===p.passport?"border-hpsr-wine bg-[#f1dfcb]":"border-hpsr-border bg-[#fffaf4]"}`}><span className="font-bold">{p.name}</span><span className="shrink-0 text-xs text-hpsr-muted">{p.passport} · {p.age||"Idade não informada"}</span></button>)}</div>
      {selected&&<div className="space-y-3 rounded-[16px] border border-[#cfae96] bg-[#fffaf4] p-4"><h3 className="font-black">Correção administrativa · {selected.passport}</h3><div className="grid gap-3 md:grid-cols-2"><label className="text-xs font-bold">Nome<input className={`mt-1 ${inputClass}`} value={name} maxLength={160} onChange={e=>setName(e.target.value)}/></label><label className="text-xs font-bold">Idade (texto livre para RP)<input className={`mt-1 ${inputClass}`} value={age} maxLength={60} onChange={e=>setAge(e.target.value)} placeholder="Ex.: 8 meses"/></label></div><label className="block text-xs font-bold">Justificativa obrigatória<textarea className={`mt-1 ${inputClass}`} rows={3} value={reason} maxLength={400} onChange={e=>setReason(e.target.value)} placeholder="Explique a conferência realizada fora do sistema"/></label><p className="text-xs text-hpsr-muted">Passaporte permanece inalterado. O histórico administrativo registra os valores anteriores, os novos e a justificativa.</p><div className="flex gap-2"><button type="button" disabled={loading||name.trim().length<2||reason.trim().length<10} onClick={()=>void correctPatient()} className="rounded-xl bg-hpsr-wine px-4 py-2 text-xs font-bold text-white disabled:opacity-50">Salvar correção</button><button type="button" onClick={()=>setSelected(null)} className="rounded-xl border border-hpsr-border px-4 py-2 text-xs">Cancelar</button></div></div>}
      <div className="flex flex-wrap gap-2 border-t border-hpsr-border pt-3"><Link href="/dashboard/equipe" className="rounded-xl border border-hpsr-border bg-[#fffaf4] px-3 py-2 text-xs font-bold text-hpsr-wine">Cadastros da equipe</Link><Link href="/dashboard/direcao" className="rounded-xl border border-hpsr-border bg-[#fffaf4] px-3 py-2 text-xs font-bold text-hpsr-wine">Relatórios de cadastro</Link></div>
    </section>}
    {section==="documentos"&&<section className="space-y-4 rounded-[19px] border border-hpsr-border bg-[#f7f0e7] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="flex items-center gap-2 font-black text-hpsr-text"><FileText size={19}/>Documentos e registros clínicos</h2><p className="text-xs text-hpsr-muted">Localize documentos e exames, confira publicação e corrija somente metadados administrativos de documentos. O conteúdo clínico não é editável pelo Interno.</p></div><Link href="/dashboard/documentos" className="rounded-xl border border-hpsr-border bg-[#fffaf4] px-3 py-2 text-xs font-bold text-hpsr-wine">Abrir Documentos</Link></div>
      <form className="flex flex-wrap gap-2" onSubmit={e=>{e.preventDefault();setSelectedDocument(null);void loadDocuments(documentQuery);}}><label className="min-w-[220px] flex-1 text-xs font-bold">Pesquisar por paciente, passaporte ou título<input className={`mt-1 ${inputClass}`} value={documentQuery} maxLength={80} onChange={e=>setDocumentQuery(e.target.value)} placeholder="Paciente, passaporte ou documento"/></label><button type="submit" disabled={loading} className="mt-auto flex items-center gap-2 rounded-xl bg-hpsr-wine px-4 py-3 text-sm font-bold text-white disabled:opacity-50"><Search size={16}/>Pesquisar</button></form>
      <div className="max-h-[330px] space-y-2 overflow-y-auto pr-1">{documents.length===0?<p className="rounded-xl border border-dashed border-hpsr-border p-4 text-sm text-hpsr-muted">Nenhum documento ou exame encontrado.</p>:documents.map(item=><button key={item.id} type="button" onClick={()=>chooseDocument(item)} className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left ${selectedDocument?.id===item.id?"border-hpsr-wine bg-[#f1dfcb]":"border-hpsr-border bg-[#fffaf4]"}`}><span className="min-w-0"><span className="block truncate text-sm font-black text-hpsr-text">{item.history_title||item.record_type}</span><span className="mt-1 block truncate text-xs text-hpsr-muted">{item.history_patient_name||"Paciente não informado"} · {item.patient_passport||"Sem passaporte"} · {item.history_doctor_name||"Equipe médica"}</span></span><span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black ${item.is_confidential?"bg-amber-100 text-amber-900":"bg-emerald-100 text-emerald-800"}`}>{item.is_confidential?"SIGILO":"PORTAL"}</span></button>)}</div>
      {selectedDocument&&<div className="space-y-3 border-t border-hpsr-border pt-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wine">Registro selecionado</p><h3 className="font-black text-hpsr-text">{selectedDocument.history_title||selectedDocument.record_type}</h3><p className="text-xs text-hpsr-muted">{selectedDocument.record_type} · atualizado em {formatDate(selectedDocument.updated_at)}{selectedDocument.released_at?` · liberado em ${formatDate(selectedDocument.released_at)}`:""}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${selectedDocument.is_confidential?"bg-amber-100 text-amber-900":"bg-emerald-100 text-emerald-800"}`}>{selectedDocument.is_confidential?"EM SIGILO":"LIBERADO AO PORTAL"}</span></div>
        {selectedDocument.record_type.toLowerCase()==="documento"?<label className="block text-xs font-bold">Título administrativo<input className={`mt-1 ${inputClass}`} value={documentTitle} maxLength={160} onChange={e=>setDocumentTitle(e.target.value)}/></label>:<p className="rounded-xl border border-[#ddc9b8] bg-[#fffaf4] p-3 text-xs font-semibold text-hpsr-muted">Exames são exibidos aqui apenas para conferência de publicação. Alterações clínicas ou de laudo continuam exclusivas do fluxo de Exames.</p>}
        <label className="block text-xs font-bold">Justificativa administrativa<textarea className={`mt-1 ${inputClass}`} rows={3} value={documentReason} maxLength={400} onChange={e=>setDocumentReason(e.target.value)} placeholder="Explique a conferência ou correção realizada"/></label>
        <div className="flex flex-wrap gap-2">{selectedDocument.record_type.toLowerCase()==="documento"?<button type="button" disabled={loading||documentTitle.trim().length<3||documentReason.trim().length<10} onClick={()=>void correctDocumentMetadata()} className="rounded-xl border border-hpsr-wine/20 bg-white px-3 py-2 text-xs font-bold text-hpsr-wine disabled:opacity-50">Salvar metadados</button>:null}{selectedDocument.is_confidential?<button type="button" disabled={loading||documentReason.trim().length<10} onClick={()=>void setDocumentVisibility(false)} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><Eye size={14}/>Liberar ao Portal</button>:<button type="button" disabled={loading||documentReason.trim().length<10} onClick={()=>void setDocumentVisibility(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-hpsr-wine px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><EyeOff size={14}/>Recolher do Portal</button>}<button type="button" onClick={()=>setSelectedDocument(null)} className="rounded-xl border border-hpsr-border px-3 py-2 text-xs">Cancelar</button></div>
        <p className="text-[11px] font-semibold text-hpsr-muted">Uma correção de metadados não altera o corpo clínico nem a versão previamente publicada. Nova publicação de um documento captura a versão estruturada atual.</p>
      </div>}
    </section>}
    {section==="ocorrencias"&&<section className="space-y-4 rounded-[19px] border border-hpsr-border bg-[#f7f0e7] p-4 sm:p-5"><div><h2 className="font-black text-hpsr-text">Ocorrências internas</h2><p className="text-xs text-hpsr-muted">Registre aqui problemas recebidos por RP ou Discord. O sistema não cria conversas ou chamados externos.</p></div>
      <div className="grid gap-3 md:grid-cols-[1fr_190px]"><label className="text-xs font-bold">Título da ocorrência<input value={issueTitle} onChange={e=>setIssueTitle(e.target.value)} maxLength={120} className={`mt-1 ${inputClass}`} placeholder="Ex.: Cadastro com dados divergentes"/></label><label className="text-xs font-bold">Categoria<select className={`mt-1 ${inputClass}`} value={issueCategory} onChange={e=>setIssueCategory(e.target.value)}>{["Cadastro","Vínculo","Acesso","Agendamento","Sistema","Outro"].map(c=><option key={c}>{c}</option>)}</select></label></div><label className="block text-xs font-bold">Detalhes administrativos (sem dados clínicos)<textarea value={issueDetails} onChange={e=>setIssueDetails(e.target.value)} maxLength={1200} rows={3} className={`mt-1 ${inputClass}`} placeholder="Descreva brevemente o que deve ser conferido"/></label><button type="button" disabled={loading||issueTitle.trim().length<4} onClick={()=>void createIssue()} className="rounded-xl bg-hpsr-wine px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">Registrar ocorrência</button>
      <div className="border-t border-hpsr-border pt-4"><div className="flex items-center justify-between"><h3 className="font-black text-hpsr-text">Acompanhamento</h3><button type="button" onClick={()=>void loadActivities()} className="flex gap-1 text-xs font-bold text-hpsr-wine"><RefreshCw size={14}/>Atualizar</button></div><div className="mt-3 space-y-2">{issueList.length===0?<p className="rounded-xl border border-dashed border-hpsr-border p-4 text-sm text-hpsr-muted">Nenhuma ocorrência registrada.</p>:issueList.map(issue=><article key={issue.id} className="rounded-xl border border-hpsr-border bg-[#fffaf4] p-3"><div className="flex flex-wrap justify-between gap-2"><p className="break-words text-sm font-bold">{issue.description}</p><span className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${issue.resolved?"bg-emerald-100 text-emerald-800":"bg-amber-100 text-amber-900"}`}>{issue.resolved?"Resolvida":"Aberta"}</span></div><p className="mt-1 text-xs text-hpsr-muted">{formatDate(issue.created_at)} · {issue.actor||"Interno"}</p>{!issue.resolved&&issue.reference&&<div className="mt-3 flex flex-wrap gap-2"><input className={`flex-1 ${inputClass}`} value={resolution[issue.reference]||""} onChange={e=>setResolution(s=>({...s,[issue.reference!]:e.target.value}))} maxLength={600} placeholder="Como a ocorrência foi resolvida?"/><button type="button" disabled={loading||(resolution[issue.reference]||"").trim().length<8} onClick={()=>void resolveIssue(issue.reference!)} className="rounded-xl bg-hpsr-wine px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Concluir</button></div>}</article>)}</div></div>
    </section>}
    {section==="historico"&&<section className="space-y-3 rounded-[19px] border border-hpsr-border bg-[#f7f0e7] p-4 sm:p-5"><div className="flex justify-between gap-3"><div><h2 className="font-black">Histórico administrativo</h2><p className="text-xs text-hpsr-muted">Decisões de vínculos, correções e ocorrências. Exibe os registros mais recentes.</p></div><button type="button" onClick={()=>void loadActivities()} disabled={loading} className="flex items-center gap-1 self-start rounded-lg border border-hpsr-border bg-[#fffaf4] px-3 py-2 text-xs font-bold"><RefreshCw size={14}/>Atualizar</button></div>{activities.length===0?<p className="rounded-xl border border-dashed border-hpsr-border p-4 text-sm text-hpsr-muted">Nenhuma atividade encontrada.</p>:activities.map(a=><article key={a.id} className="rounded-xl border border-hpsr-border bg-[#fffaf4] p-3"><p className="text-xs font-black uppercase tracking-wider text-hpsr-wine">{a.module} · {a.action}</p><p className="mt-1 break-words text-sm text-hpsr-text">{a.description}</p><p className="mt-2 text-xs text-hpsr-muted">{formatDate(a.created_at)} · {a.actor||"Sistema"}{a.reference?` · Referência: ${a.reference}`:""}</p></article>)}</section>}
  </div>;
}
