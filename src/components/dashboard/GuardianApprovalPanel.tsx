"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ShieldCheck, RefreshCw, UsersRound } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useCurrentUserProfile } from "@/components/auth/CurrentUserProfileProvider";

type GuardianLink = {
  id: string; child_passport: string; guardian_passport: string | null;
  guardian_name: string | null; additional_guardian_name: string | null;
  relationship: string; access_status: string; reviewed_at: string | null;
  decision_note: string | null;
  patient_registry?: { name?: string } | null;
};
const statusLabels: Record<string,string> = {pending:"Pendente",authorized:"Autorizado",suspended:"Suspenso",ended:"Encerrado"};

export function GuardianApprovalPanel() {
  const { profile } = useCurrentUserProfile();
  const [permitted,setPermitted] = useState(false);
  const [rows,setRows] = useState<GuardianLink[]>([]);
  const [filter,setFilter] = useState("pending");
  const [loading,setLoading] = useState(false);
  const [busy,setBusy] = useState("");
  const [error,setError] = useState("");
  const [feedback,setFeedback] = useState("");
  const [reason,setReason] = useState("");
  const [selectedAction,setSelectedAction] = useState<{id:string;status:"suspended"|"ended"|"authorized"}|null>(null);

  useEffect(()=>{
    let active=true;
    const client=createClient();
    if(!client || !["Diretora","Vice Diretor / Dev"].includes(profile.role)){setPermitted(false);return;}
    void client.rpc("hpsr_can_access_internal").then(({data,error})=>{if(active)setPermitted(!error && data===true);});
    return ()=>{active=false;};
  },[profile.id,profile.role]);
  const load=useCallback(async()=>{
    if(!permitted)return;
    const client=createClient();if(!client)return;
    setLoading(true);setError("");
    const {data,error:requestError}=await client.from("patient_guardian_links")
      .select("id,child_passport,guardian_passport,guardian_name,additional_guardian_name,relationship,access_status,reviewed_at,decision_note,patient_registry!patient_guardian_links_child_passport_fkey(name)")
      .order("created_at",{ascending:false}).limit(250);
    if(requestError)setError("Não foi possível carregar os vínculos: "+requestError.message);
    else setRows((data||[]) as unknown as GuardianLink[]);
    setLoading(false);
  },[permitted]);
  useEffect(()=>{void load();},[load]);
  const visible=useMemo(()=>filter==="all"?rows:rows.filter(r=>r.access_status===filter),[rows,filter]);
  async function decide(item:GuardianLink,status:"authorized"|"suspended"|"ended",note=""){
    if(!permitted || !profile.id || busy)return;
    const client=createClient();if(!client)return;
    setBusy(item.id);setError("");setFeedback("");
    const {data,error:changeError}=await client.from("patient_guardian_links").update({
      access_status:status,portal_access:status==="authorized",reviewed_by:profile.id,
      reviewed_at:new Date().toISOString(),decision_note:note.trim()||null,updated_at:new Date().toISOString(),
    }).eq("id",item.id).eq("access_status",item.access_status).select("id").maybeSingle();
    if(changeError)setError(changeError.message);
    else if(!data)setError("O vínculo mudou durante a análise. Atualize a listagem.");
    else {setFeedback(status==="authorized"?"Vínculo autorizado.":status==="suspended"?"Vínculo suspenso.":"Vínculo encerrado.");setSelectedAction(null);setReason("");await load();}
    setBusy("");
  }
  if(!permitted)return <p className="rounded-xl border border-hpsr-border bg-[#f7eee5] p-4 text-sm text-hpsr-muted">Verificando acesso ao Interno...</p>;
  return <section className="rounded-[19px] border border-hpsr-border bg-[#f7f0e7] p-4 sm:p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2"><UsersRound size={20} className="text-hpsr-wine"/>
        <div><h2 className="font-black text-hpsr-text">Vínculos familiares</h2><p className="mt-1 text-xs font-semibold text-hpsr-muted">Conferência externa no RP ou Discord. A autorização é individual para cada responsável.</p></div>
      </div>
      <button type="button" onClick={()=>void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-[12px] border border-hpsr-border bg-[#fffaf4] px-3 py-2 text-xs font-black text-hpsr-wine"><RefreshCw size={14}/>Atualizar</button>
    </div>
    <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Situação dos vínculos">
      {[['pending','Pendentes'],['authorized','Autorizados'],['suspended','Suspensos'],['ended','Encerrados'],['all','Todos']].map(([key,label])=><button key={key} type="button" onClick={()=>setFilter(key)} className={`rounded-[11px] border px-3 py-2 text-xs font-bold ${filter===key?'border-hpsr-wine bg-hpsr-wine text-white':'border-hpsr-border bg-[#fffaf4] text-hpsr-text'}`}>{label} ({key==='all'?rows.length:rows.filter(r=>r.access_status===key).length})</button>)}
    </div>
    {error&&<p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-800">{error}</p>}
    {feedback&&<p role="status" className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">{feedback}</p>}
    <div className="mt-3 space-y-2">
      {loading?<p className="text-sm text-hpsr-muted">Carregando...</p>:visible.length===0?<p className="rounded-xl border border-dashed border-hpsr-border bg-[#fffaf4] p-4 text-sm font-semibold text-hpsr-muted">Nenhum vínculo nesta situação.</p>:visible.map(item=><article key={item.id} className="rounded-[14px] border border-hpsr-border bg-[#fffaf4] p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0"><p className="text-sm font-black text-hpsr-text">{item.patient_registry?.name||"Criança"} · {item.child_passport}</p>
            <p className="mt-1 text-xs font-semibold text-hpsr-muted">Responsável: {item.guardian_name||(item.guardian_passport?`Passaporte ${item.guardian_passport}`:"Conta cadastrada")} · {item.relationship}</p>
            {item.additional_guardian_name&&<p className="mt-1 text-xs text-hpsr-muted">Outro responsável informado: {item.additional_guardian_name} (sem acesso automático)</p>}
            {item.reviewed_at&&<p className="mt-1 text-xs text-hpsr-muted">Última análise: {new Date(item.reviewed_at).toLocaleString("pt-BR")}</p>}
            {item.decision_note&&<p className="mt-1 text-xs text-hpsr-muted">Observação administrativa: {item.decision_note}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-hpsr-border px-2 py-1 text-xs font-bold">{statusLabels[item.access_status]||item.access_status}</span>
            {item.access_status!=='authorized'&&item.access_status!=='ended'&&<button disabled={!!busy} type="button" onClick={()=>void decide(item,'authorized')} className="inline-flex items-center gap-1 rounded-[11px] bg-hpsr-wine px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><ShieldCheck size={14}/>{item.access_status==='suspended'?'Reativar':'Aprovar'}</button>}
            {item.access_status==='authorized'&&<button disabled={!!busy} type="button" onClick={()=>{setSelectedAction({id:item.id,status:'suspended'});setReason('');}} className="rounded-[11px] border border-amber-300 px-3 py-2 text-xs font-bold text-amber-800">Suspender</button>}
            {item.access_status!=='ended'&&<button disabled={!!busy} type="button" onClick={()=>{setSelectedAction({id:item.id,status:'ended'});setReason('');}} className="rounded-[11px] border border-rose-300 px-3 py-2 text-xs font-bold text-rose-800">Encerrar</button>}
          </div>
        </div>
        {selectedAction?.id===item.id&&<div className="mt-3 space-y-2 border-t border-hpsr-border pt-3"><label className="block text-xs font-bold">Motivo da decisão</label><textarea value={reason} maxLength={400} onChange={e=>setReason(e.target.value)} rows={2} className="w-full rounded-xl border border-hpsr-border bg-white p-3 text-sm" placeholder="Registre o motivo administrativo (mínimo de 6 caracteres)"/><div className="flex gap-2"><button type="button" disabled={!!busy||reason.trim().length<6} onClick={()=>void decide(item,selectedAction.status,reason)} className="rounded-lg bg-hpsr-wine px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Confirmar decisão</button><button type="button" onClick={()=>setSelectedAction(null)} className="rounded-lg border border-hpsr-border px-3 py-2 text-xs">Cancelar</button></div></div>}
      </article>)}
    </div>
  </section>;
}
