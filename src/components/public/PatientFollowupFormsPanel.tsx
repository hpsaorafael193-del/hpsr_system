"use client";
import { useHospitalClosure } from "./ClosureState";
import { showClosureNotice } from "@/lib/hospital-closure";
import { followupFormLabels, pediatricIntakeIntro, type FollowupFormType, type IntakeQuestion as Question } from "@/lib/pediatric-intake-form";
import { followupIntakeSections } from "@/lib/followup-intake-questions";
import { formatFollowupBirthType } from "@/lib/followup-birth-options";
import {useManualRefresh} from "@/lib/manual-data-refresh";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, ClipboardList, Loader2, Save, Send, X } from "lucide-react";

type IntakeForm = {
  id: string;
  doctor_name: string;
  specialty: string;
  form_type: FollowupFormType;
  patient_passport: string;
  status: "requested" | "draft" | "submitted" | "reviewed";
  answers: Record<string, any>;
  requested_at: string;
  submitted_at?: string | null;
  request_note?: string | null;
};

const yesNo = ["Sim", "Não"];
function initialAnswers(form: IntakeForm) {
  return form.form_type === "pediatric" ? { ...form.answers, childPassport: form.patient_passport } : form.answers || {};
}

function QuestionField({ q, answers, setAnswer, disabled }: { q: Question; answers: Record<string, any>; setAnswer: (key:string,value:any)=>void; disabled:boolean }) {
  const fieldId = useId();
  if (q.showIf && answers[q.showIf[0]] !== q.showIf[1]) return null;
  const rawValue = answers[q.key] ?? (q.type === "multi" ? [] : "");
  const value = q.key === "birthType" ? formatFollowupBirthType(rawValue) : rawValue;
  const options = q.type === "yesno" ? yesNo : (q.options || []);
  return <div className={`grid content-start gap-2 ${q.key === "commitment" ? "md:col-span-2" : ""}`}>
    <label id={fieldId + "-label"} htmlFor={fieldId} className="text-sm font-bold text-[#4e291c]">{q.label}</label>
    {q.hint && <p className="text-xs leading-relaxed text-[#82736a]">{q.hint}</p>}
    {q.type === "textarea" ? <textarea id={fieldId} disabled={disabled} value={value} onChange={(e)=>setAnswer(q.key,e.target.value)} className="min-h-[96px] rounded-[12px] border border-[#d7c8ba] bg-[#fcf8f3] p-3 text-sm outline-none focus:border-[#672614] disabled:opacity-70"/> :
    ["yesno","single","multi"].includes(q.type || "") ? <div role="group" aria-labelledby={fieldId + "-label"} className="flex flex-wrap gap-2">{options.map((option)=>{
      const checked = q.type === "multi" ? (value as string[]).includes(option) : value === option;
      return <button key={option} type="button" aria-pressed={checked} disabled={disabled} onClick={()=>q.type === "multi" ? setAnswer(q.key, checked ? (value as string[]).filter((x)=>x!==option) : [...(value as string[]),option]) : setAnswer(q.key,option)} className={`rounded-[10px] border px-3 py-2 text-xs font-bold transition ${checked ? "border-[#672614] bg-[#672614] text-white" : "border-[#d7c8ba] bg-[#fcf8f3] text-[#5d4033]"}`}>{option}</button>;
    })}</div> : <input id={fieldId} type={q.type === "date" ? "date" : "text"} readOnly={q.key === "childPassport"} disabled={disabled} value={value} onChange={(e)=>setAnswer(q.key,e.target.value)} className="min-h-[42px] rounded-[12px] border border-[#d7c8ba] bg-[#fcf8f3] px-3 text-sm outline-none focus:border-[#672614] disabled:opacity-70"/>}
  </div>;
}

export function PatientFollowupFormsPanel({ passport, onSessionExpired, pendingOnly = false }: { passport:string; onSessionExpired:()=>void; pendingOnly?:boolean }) {
  const closed = useHospitalClosure();
  const [forms,setForms]=useState<IntakeForm[]>([]); const [loading,setLoading]=useState(true); const [busy,setBusy]=useState(""); const [error,setError]=useState(""); const [openId,setOpenId]=useState(""); const [drafts,setDrafts]=useState<Record<string,Record<string,any>>>({});
  const requestGeneration = useRef(0);
  useEffect(() => { if (closed) setOpenId(""); }, [closed]);
  useManualRefresh(`patient-intake:${passport}`,()=>load(true),Boolean(busy || openId));
  async function load(preserveDraft=false){ const generation=++requestGeneration.current; setLoading(true); try { const r=await fetch(`/api/paciente/fichas-acompanhamento?passport=${encodeURIComponent(passport)}`,{cache:"no-store"}); if(generation!==requestGeneration.current)return; if(r.status===401){onSessionExpired();return;} const p=await r.json(); if(generation!==requestGeneration.current)return; if(!r.ok) throw new Error(p.error||"Erro ao carregar fichas."); setForms(p.forms||[]); setDrafts(current=>Object.fromEntries((p.forms||[]).map((f:IntakeForm)=>[f.id,preserveDraft && ["requested","draft"].includes(f.status) ? current[f.id] || initialAnswers(f) : initialAnswers(f)]))); setError(""); } catch(e){if(generation===requestGeneration.current)setError(e instanceof Error?e.message:"Erro ao carregar fichas.");} finally{if(generation===requestGeneration.current)setLoading(false);} }
  useEffect(()=>{setForms([]);setDrafts({});setOpenId("");void load();return()=>{requestGeneration.current++;};},[passport]);
  useEffect(()=>{
    if(!openId) return;
    const previous=document.body.style.overflow;
    document.body.style.overflow="hidden";
    return()=>{document.body.style.overflow=previous;};
  },[openId]);
  const pending=useMemo(()=>forms.filter(f=>f.status==="requested"||f.status==="draft"),[forms]);
  async function save(form:IntakeForm,submit=false){setBusy(form.id);try{const r=await fetch(`/api/paciente/fichas-acompanhamento?passport=${encodeURIComponent(passport)}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:form.id,answers:drafts[form.id]||{},submit})});if(r.status===401){onSessionExpired();return;}const p=await r.json();if(!r.ok)throw new Error(p.error||"Falha ao salvar.");await load();if(submit)setOpenId("");}catch(e){setError(e instanceof Error?e.message:"Falha ao salvar.");}finally{setBusy("");}}
  if(pendingOnly && !loading && !error && !pending.length)return null;
  if(loading)return <div className="flex min-h-[120px] items-center justify-center"><Loader2 className="animate-spin text-[#672614]"/></div>;
  return <section className="space-y-4">
    {error&&!openId&&<p role="alert" className="rounded-[12px] border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800">{error}</p>}
    {pending.length>0&&<div className="rounded-[18px] border border-[#c89f8d] bg-[#f4e6dc] p-4"><div className="flex items-start gap-3"><ClipboardList className="mt-0.5 text-[#672614]"/><div><p className="text-[11px] font-black uppercase tracking-[.14em] text-[#8a5b4b]">Ficha solicitada</p><h3 className="mt-1 text-lg font-bold text-[#4e291c]">Sua equipe precisa de algumas informações</h3><p className="mt-1 text-sm text-[#78675e]">Preencha e envie a ficha para o médico responsável. O acompanhamento continua sob controle da equipe médica.</p></div></div></div>}
    {!forms.length&&<div className="rounded-[16px] border border-dashed border-[#d7c8ba] p-5 text-center text-sm text-[#82736a]">Nenhuma ficha solicitada no momento.</div>}
    {(pendingOnly ? pending : forms).map(form=>{const editable=form.status==="requested"||form.status==="draft";return <article key={form.id} className="overflow-hidden rounded-[18px] border border-[#ddcfc2] bg-[#f8f2eb]"><button type="button" onClick={()=>closed && editable ? showClosureNotice() : setOpenId(form.id)} className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-[#f2e7de]"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#ead8cb] text-[#672614]"><ClipboardList size={19}/></span><span className="min-w-0 flex-1"><strong className="block text-sm text-[#4e291c]">{`Ficha técnica — ${followupFormLabels[form.form_type]}`}</strong><span className="mt-1 block text-xs text-[#82736a]">{form.doctor_name||"Equipe médica"} · {form.status==="submitted"?"Enviada ao médico":form.status==="reviewed"?"Analisada":form.status==="draft"?"Em preenchimento":"Pendente de preenchimento"}</span></span><span className="shrink-0 text-xs font-black text-[#672614]">{editable?"Preencher":"Ver ficha"}</span>{form.status==="reviewed"&&<CheckCircle2 size={18} className="shrink-0 text-[#672614]"/>}</button></article>})}
    {openId && typeof document!=="undefined" && (()=>{const form=forms.find(item=>item.id===openId); if(!form)return null; const editable=form.status==="requested"||form.status==="draft"; if (closed && editable) return null; const sections=followupIntakeSections[form.form_type]; return createPortal(<div className="hpsr-modal-tone fixed inset-0 z-[260] flex items-center justify-center bg-[rgba(42,7,0,.74)] p-2 backdrop-blur-[2px] sm:p-5"><button type="button" className="absolute inset-0" aria-label="Fechar ficha" onClick={()=>setOpenId("")}/><div className="relative flex max-h-[96dvh] w-full max-w-[980px] flex-col overflow-hidden rounded-[24px] border border-[#d6b9a8] bg-[#f8eee5] shadow-[0_26px_90px_rgba(62,21,12,.32)]"><header className="relative flex shrink-0 items-start justify-between gap-4 border-b border-[#ddc8bb] bg-[linear-gradient(120deg,#f8eadf_0%,#f4e2d5_100%)] px-5 py-4 sm:px-6 before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-[#672614]"><div className="flex min-w-0 items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-[linear-gradient(135deg,#672614,#2a0700)] text-white"><ClipboardList size={20}/></span><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[.15em] text-[#9a5b47]">Formulário do acompanhamento</p><h3 className="mt-1 text-lg font-black text-[#4e291c] sm:text-xl">{`Ficha técnica — ${followupFormLabels[form.form_type]}`}</h3><p className="mt-1 text-xs font-semibold text-[#82736a]">{form.doctor_name||"Equipe médica"} · {form.status==="submitted"?"Enviada ao médico":form.status==="reviewed"?"Analisada":form.status==="draft"?"Em preenchimento":"Pendente de preenchimento"}</p></div></div><button type="button" onClick={()=>setOpenId("")} className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] border border-[#d3b39d] bg-[#fffaf6] text-[#672614]"><X size={18}/></button></header><div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">{error&&<p role="alert" className="mb-4 rounded-[12px] border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800">{error}</p>}{form.form_type==="pediatric"&&<p className="mb-5 text-sm leading-relaxed text-[#5f4033]">{pediatricIntakeIntro}</p>}{form.request_note&&<p className="mb-5 rounded-[14px] border border-[#ddc8bb] bg-[#efe0d5] p-3 text-sm leading-relaxed text-[#5f4033]">{form.request_note}</p>}<div className="space-y-6">{sections.map(section=><section key={section.title} className="rounded-[18px] border border-[#ddcfc2] bg-[#fffaf7] p-4 sm:p-5"><h4 className="border-b border-[#e5d6cb] pb-3 text-base font-black text-[#4e291c]">{section.title}</h4><div className="mt-4 grid gap-4 md:grid-cols-2">{section.questions.map(q=><QuestionField key={q.key} q={q} answers={drafts[form.id]||{}} disabled={!editable||busy===form.id} setAnswer={(key,value)=>setDrafts(d=>({...d,[form.id]:{...(d[form.id]||{}),[key]:value}}))}/>)}</div></section>)}</div></div><footer className="shrink-0 border-t border-[#ddc8bb] bg-[#f3e3d7] px-4 py-3 sm:px-6"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><p className="text-[11px] font-semibold text-[#82736a]">{editable?"Você pode salvar e continuar depois ou enviar quando terminar.":"Esta ficha já foi enviada e permanece disponível somente para consulta."}</p><div className="flex flex-col gap-2 sm:flex-row">{editable&&<><button type="button" disabled={busy===form.id} onClick={()=>void save(form,false)} className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[11px] border border-[#672614] bg-[#fffaf6] px-4 text-sm font-black text-[#672614] disabled:opacity-50"><Save size={16}/>Salvar e continuar depois</button><button type="button" disabled={busy===form.id} onClick={()=>void save(form,true)} className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[11px] bg-[#672614] px-5 text-sm font-black text-white disabled:opacity-50">{busy===form.id?<Loader2 size={16} className="animate-spin"/>:<Send size={16}/>}Enviar ao médico</button></>}<button type="button" onClick={()=>setOpenId("")} className="inline-flex min-h-[42px] items-center justify-center rounded-[11px] border border-[#c9aa97] bg-[#fffaf6] px-4 text-sm font-black text-[#672614]">Fechar</button></div></div></footer></div></div>,document.body);})()}
  </section>;
}
