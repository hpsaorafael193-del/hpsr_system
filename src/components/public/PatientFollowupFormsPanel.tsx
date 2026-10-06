"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, ClipboardList, Loader2, Save, Send, X } from "lucide-react";

type IntakeForm = {
  id: string;
  doctor_name: string;
  specialty: string;
  form_type: "gestational" | "ivf_ropa";
  status: "requested" | "draft" | "submitted" | "reviewed";
  answers: Record<string, any>;
  requested_at: string;
  submitted_at?: string | null;
  request_note?: string | null;
};

type Question = { key: string; label: string; type?: "text" | "textarea" | "yesno" | "single" | "multi"; options?: string[]; hint?: string; showIf?: [string, string] };
type Section = { title: string; questions: Question[] };

const yesNo = ["Sim", "Não"];
const gestationalSections: Section[] = [
  { title: "Identificação no RP", questions: [
    { key:"name", label:"Nome" }, { key:"passport", label:"Passaporte" }, { key:"age", label:"Idade da personagem" }, { key:"contact", label:"Contato" },
    { key:"bloodType", label:"Tipo sanguíneo" }, { key:"weight", label:"Peso da mãe" },
    { key:"relationship", label:"Estado civil / relacionamento no RP", type:"single", options:["Solteira","Relacionamento estável","Casada"] },
    { key:"partnerName", label:"Nome do(a) parceiro(a) no RP" }, { key:"partnerPassport", label:"Passaporte do(a) parceiro(a)" },
  ]},
  { title: "Dados da gestação", questions: [
    { key:"pregnancyStarted", label:"A gestação já iniciou no RP?", type:"yesno" },
    { key:"currentPregnancyTime", label:"Tempo atual de gestação (semanas ou meses)", showIf:["pregnancyStarted","Sim"] },
    { key:"pregnancyType", label:"Tipo de gestação", type:"single", options:["Única","Gemelar"] },
    { key:"babySex", label:"Sexo do bebê", type:"single", options:["Menino","Menina"] },
    { key:"babyName", label:"Nome do bebê (se já definido)" }, { key:"dueDate", label:"Data prevista para o parto" },
    { key:"plannedPregnancy", label:"A gestação foi", type:"single", options:["Planejada","Não planejada"] },
  ]},
  { title: "Histórico obstétrico", questions: [
    { key:"firstPregnancy", label:"Esta é a primeira gestação da personagem?", type:"yesno" },
    { key:"previousPregnancies", label:"Quantas gestações anteriores?", showIf:["firstPregnancy","Não"] },
    { key:"previousEvents", label:"Já ocorreu no RP", type:"multi", options:["Aborto","Parto prematuro","Complicações na gestação","Nenhuma ocorrência"] },
    { key:"previousEventsDetails", label:"Explique brevemente, se necessário", type:"textarea" },
  ]},
  { title: "Planejamento da gestação", questions: [
    { key:"prenatalHpsr", label:"Pretende realizar acompanhamento pré-natal no Hospital São Rafael?", type:"yesno" },
    { key:"includeComplications", label:"Deseja incluir complicações na gestação?", type:"yesno" },
    { key:"complications", label:"Se sim, quais?", type:"textarea", hint:"Ex.: pressão alta gestacional, sangramento, diabetes gestacional, descolamento de placenta.", showIf:["includeComplications","Sim"] },
    { key:"symptoms", label:"Sintomas que deseja interpretar durante a gestação", type:"multi", options:["Enjoos","Azia","Dor lombar","Inchaço","Contrações de treinamento","Cansaço excessivo"] },
  ]},
  { title: "Planejamento do parto", questions: [
    { key:"birthType", label:"Tipo de parto desejado", type:"single", options:["Normal hospitalar","Cesárea (HP Sul)","Humanizado (Jacuzzi)"] },
    { key:"birthStyle", label:"Estilo do parto no RP", type:"single", options:["Rápido (cenas resumidas)","Detalhado (procedimento médico completo)"] },
    { key:"birthCompanion", label:"Quem estará presente no parto?", hint:"Apenas um acompanhante dentro da sala." },
    { key:"birthComplications", label:"Deseja incluir intercorrências no parto?", type:"yesno" },
    { key:"birthComplicationsDetails", label:"Se sim, quais?", type:"textarea", hint:"Ex.: cordão umbilical enrolado, sofrimento fetal, trabalho de parto prolongado, hemorragia pós-parto.", showIf:["birthComplications","Sim"] },
  ]},
  { title: "Pós-parto", questions: [
    { key:"breastfeeding", label:"Deseja incluir amamentação no RP?", type:"yesno" },
    { key:"pediatricFollowup", label:"Deseja acompanhamento pediátrico para o bebê?", type:"yesno" },
    { key:"postpartumGynecology", label:"Deseja consulta ginecológica pós-parto?", type:"yesno" },
    { key:"observations", label:"Observações, ideias, dúvidas ou pedidos específicos", type:"textarea" },
  ]},
];

const ivfSections: Section[] = [
  { title:"Mãe genética — doadora do óvulo", questions:[
    {key:"geneticName",label:"Nome"},{key:"geneticPassport",label:"Passaporte"},{key:"geneticAge",label:"Idade da personagem"},{key:"geneticContact",label:"Contato na cidade"},{key:"geneticRh",label:"Fator Rh"},
    {key:"geneticChildren",label:"Possui filhos no RP?",type:"yesno"},{key:"geneticCondition",label:"Possui condição médica relevante no RP?",type:"yesno"},{key:"geneticConditionDetails",label:"Se sim, qual?",showIf:["geneticCondition","Sim"]},{key:"previousFertility",label:"Já realizou tratamento de fertilidade antes no RP?",type:"yesno"},
  ]},
  { title:"Mãe gestante", questions:[
    {key:"gestationalName",label:"Nome"},{key:"gestationalPassport",label:"Passaporte"},{key:"gestationalAge",label:"Idade da personagem"},{key:"gestationalContact",label:"Contato na cidade"},{key:"gestationalRh",label:"Fator Rh"},
    {key:"priorPregnancy",label:"Já teve alguma gestação no RP?",type:"yesno"},{key:"priorPregnancyCount",label:"Quantas gestações?",showIf:["priorPregnancy","Sim"]},
  ]},
  { title:"Informações do casal", questions:[
    {key:"relationshipDuration",label:"Há quanto tempo as personagens estão juntas no RP?"},{key:"fullFivHpsr",label:"Pretendem realizar todo o processo de FIV com acompanhamento médico do Hospital São Rafael?",type:"yesno"},
  ]},
  { title:"Planejamento da gestação", questions:[
    {key:"pregnancyType",label:"A gestação será",type:"single",options:["Única","Gemelar (gêmeos)"]},{key:"prenatalHpsr",label:"Pretendem realizar acompanhamento pré-natal completo no Hospital São Rafael?",type:"yesno"},
  ]},
  { title:"Acordos sobre o procedimento no RP", questions:[
    {key:"storyAgreement",label:"Ambas estão de acordo com o enredo e com o vínculo emocional que isso pode gerar no RP?",type:"yesno"},
    {key:"sceneStyle",label:"Como preferem que as cenas médicas sejam?",type:"single",options:["Realistas e detalhadas","Resumidas (comandos básicos)"]},
    {key:"humanDialogue",label:"Desejam incluir emoção e diálogo humano nas consultas?",type:"yesno"},
    {key:"sensitiveLimits",label:"Alguma das partes possui limite de exposição corporal ou descrição sensível?",type:"yesno"},
    {key:"sensitiveLimitsDetails",label:"Se sim, qual limite?",type:"textarea",hint:"Ex.: exame transvaginal, coleta de material, punção ovariana.",showIf:["sensitiveLimits","Sim"]},
  ]},
  { title:"Desenvolvimento da história", questions:[
    {key:"embryoResult",label:"Resultado desejado da transferência embrionária",type:"single",options:["Beta-HCG positivo (gravidez confirmada)","Beta-HCG negativo"]},
    {key:"storyTone",label:"Preferem que o RP tenha",type:"single",options:["História leve","História emocional"]},
    {key:"narrativeElements",label:"Desejam incluir algum elemento narrativo no RP?",type:"yesno"},
    {key:"narrativeElementsDetails",label:"Quais elementos?",type:"textarea",hint:"Ex.: ansiedade, preparação do quarto, revelação da gravidez, apoio familiar.",showIf:["narrativeElements","Sim"]},
    {key:"negativeResultPlan",label:"Caso o Beta-HCG seja negativo, pretendem",type:"single",options:["Repetir o processo de FIV no RP","Encerrar a história","Decidir posteriormente"]},
  ]},
  { title:"Compromisso com o RP", questions:[
    {key:"commitment",label:"Declaro que compreendo que o processo de FIV no RP exige planejamento prévio, respeito ao RP médico e desenvolvimento gradual da história.",type:"single",options:["Estou de acordo"]},
    {key:"observations",label:"Observações, dúvidas, ideias de RP e detalhes importantes",type:"textarea"},
  ]},
];

function QuestionField({ q, answers, setAnswer, disabled }: { q: Question; answers: Record<string, any>; setAnswer: (key:string,value:any)=>void; disabled:boolean }) {
  if (q.showIf && answers[q.showIf[0]] !== q.showIf[1]) return null;
  const value = answers[q.key] ?? (q.type === "multi" ? [] : "");
  const options = q.type === "yesno" ? yesNo : (q.options || []);
  return <div className="grid gap-2">
    <label className="text-sm font-bold text-[#4e291c]">{q.label}</label>
    {q.hint && <p className="text-xs leading-relaxed text-[#82736a]">{q.hint}</p>}
    {q.type === "textarea" ? <textarea disabled={disabled} value={value} onChange={(e)=>setAnswer(q.key,e.target.value)} className="min-h-[96px] rounded-[12px] border border-[#d7c8ba] bg-[#fcf8f3] p-3 text-sm outline-none focus:border-[#672614] disabled:opacity-70"/> :
    ["yesno","single","multi"].includes(q.type || "") ? <div className="flex flex-wrap gap-2">{options.map((option)=>{
      const checked = q.type === "multi" ? (value as string[]).includes(option) : value === option;
      return <button key={option} type="button" disabled={disabled} onClick={()=>q.type === "multi" ? setAnswer(q.key, checked ? (value as string[]).filter((x)=>x!==option) : [...(value as string[]),option]) : setAnswer(q.key,option)} className={`rounded-[10px] border px-3 py-2 text-xs font-bold transition ${checked ? "border-[#672614] bg-[#672614] text-white" : "border-[#d7c8ba] bg-[#fcf8f3] text-[#5d4033]"}`}>{option}</button>;
    })}</div> : <input disabled={disabled} value={value} onChange={(e)=>setAnswer(q.key,e.target.value)} className="min-h-[42px] rounded-[12px] border border-[#d7c8ba] bg-[#fcf8f3] px-3 text-sm outline-none focus:border-[#672614] disabled:opacity-70"/>}
  </div>;
}

export function PatientFollowupFormsPanel({ passport, onSessionExpired }: { passport:string; onSessionExpired:()=>void }) {
  const [forms,setForms]=useState<IntakeForm[]>([]); const [loading,setLoading]=useState(true); const [busy,setBusy]=useState(""); const [error,setError]=useState(""); const [openId,setOpenId]=useState(""); const [drafts,setDrafts]=useState<Record<string,Record<string,any>>>({});
  async function load(){ setLoading(true); try { const r=await fetch(`/api/paciente/fichas-acompanhamento?passport=${encodeURIComponent(passport)}`,{cache:"no-store"}); if(r.status===401){onSessionExpired();return;} const p=await r.json(); if(!r.ok) throw new Error(p.error||"Erro ao carregar fichas."); setForms(p.forms||[]); setDrafts(Object.fromEntries((p.forms||[]).map((f:IntakeForm)=>[f.id,f.answers||{}]))); setError(""); } catch(e){setError(e instanceof Error?e.message:"Erro ao carregar fichas.");} finally{setLoading(false);} }
  useEffect(()=>{void load();},[passport]);
  useEffect(()=>{
    if(!openId) return;
    const previous=document.body.style.overflow;
    document.body.style.overflow="hidden";
    return()=>{document.body.style.overflow=previous;};
  },[openId]);
  const pending=useMemo(()=>forms.filter(f=>f.status==="requested"||f.status==="draft"),[forms]);
  async function save(form:IntakeForm,submit=false){setBusy(form.id);try{const r=await fetch(`/api/paciente/fichas-acompanhamento?passport=${encodeURIComponent(passport)}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:form.id,answers:drafts[form.id]||{},submit})});if(r.status===401){onSessionExpired();return;}const p=await r.json();if(!r.ok)throw new Error(p.error||"Falha ao salvar.");await load();if(submit)setOpenId("");}catch(e){setError(e instanceof Error?e.message:"Falha ao salvar.");}finally{setBusy("");}}
  if(loading)return <div className="flex min-h-[120px] items-center justify-center"><Loader2 className="animate-spin text-[#672614]"/></div>;
  return <section className="space-y-4">
    {error&&<p className="rounded-[12px] border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800">{error}</p>}
    {pending.length>0&&<div className="rounded-[18px] border border-[#c89f8d] bg-[#f4e6dc] p-4"><div className="flex items-start gap-3"><ClipboardList className="mt-0.5 text-[#672614]"/><div><p className="text-[11px] font-black uppercase tracking-[.14em] text-[#8a5b4b]">Ficha solicitada</p><h3 className="mt-1 text-lg font-bold text-[#4e291c]">Sua equipe precisa de algumas informações</h3><p className="mt-1 text-sm text-[#78675e]">Preencha e envie a ficha para o médico responsável. O acompanhamento continua sob controle da equipe médica.</p></div></div></div>}
    {!forms.length&&<div className="rounded-[16px] border border-dashed border-[#d7c8ba] p-5 text-center text-sm text-[#82736a]">Nenhuma ficha solicitada no momento.</div>}
    {forms.map(form=>{const editable=form.status==="requested"||form.status==="draft";return <article key={form.id} className="overflow-hidden rounded-[18px] border border-[#ddcfc2] bg-[#f8f2eb]"><button type="button" onClick={()=>setOpenId(form.id)} className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-[#f2e7de]"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#ead8cb] text-[#672614]"><ClipboardList size={19}/></span><span className="min-w-0 flex-1"><strong className="block text-sm text-[#4e291c]">{form.form_type==="ivf_ropa"?"Ficha técnica — FIV (Método ROPA)":"Ficha técnica — Acompanhamento obstétrico"}</strong><span className="mt-1 block text-xs text-[#82736a]">{form.doctor_name||"Equipe médica"} · {form.status==="submitted"?"Enviada ao médico":form.status==="reviewed"?"Analisada":form.status==="draft"?"Em preenchimento":"Pendente de preenchimento"}</span></span><span className="shrink-0 text-xs font-black text-[#672614]">{editable?"Preencher":"Ver ficha"}</span>{form.status==="reviewed"&&<CheckCircle2 size={18} className="shrink-0 text-[#672614]"/>}</button></article>})}
    {openId && typeof document!=="undefined" && (()=>{const form=forms.find(item=>item.id===openId); if(!form)return null; const editable=form.status==="requested"||form.status==="draft"; const sections=form.form_type==="ivf_ropa"?ivfSections:gestationalSections; return createPortal(<div className="fixed inset-0 z-[260] flex items-center justify-center bg-[rgba(42,7,0,.74)] p-2 backdrop-blur-[2px] sm:p-5"><button type="button" className="absolute inset-0" aria-label="Fechar ficha" onClick={()=>setOpenId("")}/><div className="relative flex max-h-[96dvh] w-full max-w-[980px] flex-col overflow-hidden rounded-[24px] border border-[#d6b9a8] bg-[#f8eee5] shadow-[0_26px_90px_rgba(62,21,12,.32)]"><header className="relative flex shrink-0 items-start justify-between gap-4 border-b border-[#ddc8bb] bg-[linear-gradient(120deg,#f8eadf_0%,#f4e2d5_100%)] px-5 py-4 sm:px-6 before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-[#672614]"><div className="flex min-w-0 items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-[linear-gradient(135deg,#672614,#2a0700)] text-white"><ClipboardList size={20}/></span><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[.15em] text-[#9a5b47]">Formulário do acompanhamento</p><h3 className="mt-1 text-lg font-black text-[#4e291c] sm:text-xl">{form.form_type==="ivf_ropa"?"Ficha técnica — FIV (Método ROPA)":"Ficha técnica — Acompanhamento obstétrico"}</h3><p className="mt-1 text-xs font-semibold text-[#82736a]">{form.doctor_name||"Equipe médica"} · {form.status==="submitted"?"Enviada ao médico":form.status==="reviewed"?"Analisada":form.status==="draft"?"Em preenchimento":"Pendente de preenchimento"}</p></div></div><button type="button" onClick={()=>setOpenId("")} className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] border border-[#d3b39d] bg-[#fffaf6] text-[#672614]"><X size={18}/></button></header><div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">{form.request_note&&<p className="mb-5 rounded-[14px] border border-[#ddc8bb] bg-[#efe0d5] p-3 text-sm leading-relaxed text-[#5f4033]">{form.request_note}</p>}<div className="space-y-6">{sections.map(section=><section key={section.title} className="rounded-[18px] border border-[#ddcfc2] bg-[#fffaf7] p-4 sm:p-5"><h4 className="border-b border-[#e5d6cb] pb-3 text-base font-black text-[#4e291c]">{section.title}</h4><div className="mt-4 grid gap-4 md:grid-cols-2">{section.questions.map(q=><QuestionField key={q.key} q={q} answers={drafts[form.id]||{}} disabled={!editable||busy===form.id} setAnswer={(key,value)=>setDrafts(d=>({...d,[form.id]:{...(d[form.id]||{}),[key]:value}}))}/>)}</div></section>)}</div></div><footer className="shrink-0 border-t border-[#ddc8bb] bg-[#f3e3d7] px-4 py-3 sm:px-6"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><p className="text-[11px] font-semibold text-[#82736a]">{editable?"Você pode salvar e continuar depois ou enviar quando terminar.":"Esta ficha já foi enviada e permanece disponível somente para consulta."}</p><div className="flex flex-col gap-2 sm:flex-row">{editable&&<><button type="button" disabled={busy===form.id} onClick={()=>void save(form,false)} className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[11px] border border-[#672614] bg-[#fffaf6] px-4 text-sm font-black text-[#672614] disabled:opacity-50"><Save size={16}/>Salvar e continuar depois</button><button type="button" disabled={busy===form.id} onClick={()=>void save(form,true)} className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[11px] bg-[#672614] px-5 text-sm font-black text-white disabled:opacity-50">{busy===form.id?<Loader2 size={16} className="animate-spin"/>:<Send size={16}/>}Enviar ao médico</button></>}<button type="button" onClick={()=>setOpenId("")} className="inline-flex min-h-[42px] items-center justify-center rounded-[11px] border border-[#c9aa97] bg-[#fffaf6] px-4 text-sm font-black text-[#672614]">Fechar</button></div></div></footer></div></div>,document.body);})()}
  </section>;
}
