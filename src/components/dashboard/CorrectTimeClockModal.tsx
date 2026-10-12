"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { brazilDateTimeInput } from "@/lib/brazil-datetime";

type Entry = { id: string; opened_at: string; closed_at: string; updated_at: string; worked_seconds: number; correction_group_id: string | null };
type Period = { key: string; start: string; end: string };
const makePeriod = (start: string, end: string): Period => ({ key: crypto.randomUUID(), start, end });
export function parsePointDateTime(value: string) {
  // Campos civis de Brasília; não dependem do fuso do computador.
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(value)) return NaN;
  const timestamp = new Date(`${value}-03:00`).getTime();
  if (!Number.isFinite(timestamp)) return NaN;
  const civil = new Date(timestamp - 3 * 60 * 60 * 1000).toISOString().slice(0, value.length);
  return civil === value ? timestamp : NaN;
}
const format = (value: string) => new Date(value).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
const duration = (seconds: number) => `${Math.floor(seconds / 3600)}h ${String(Math.floor(seconds % 3600 / 60)).padStart(2, "0")}min`;
const inputValue = (value: string) => {
  const date = new Date(value);
  return `${brazilDateTimeInput(date)}:${String(date.getUTCSeconds()).padStart(2, "0")}`;
};

export function CorrectTimeClockModal({ staff, initial, onClose, onSaved }: {
 staff: { userId: string; user: string }[];
 initial?: { userId: string; id: string };
 onClose: () => void;
 onSaved: () => Promise<void>;
}) {
 const dialog = useRef<HTMLDialogElement>(null);
 const savingRef = useRef(false);
 const saveRequest = useRef<{signature:string;id:string}|null>(null);
 const [groupEntries,setGroupEntries] = useState<Entry[]>([]);
 const [userId, setUserId] = useState(initial && staff.some(person=>person.userId===initial.userId) ? initial.userId : "");
 const [entries, setEntries] = useState<Entry[]>([]);
 const [entryId, setEntryId] = useState("");
 const [periods, setPeriods] = useState<Period[]>([]);
 const [reason, setReason] = useState("");
 const [error, setError] = useState("");
 const [loading, setLoading] = useState(false);
 const [saving, setSaving] = useState(false);
 const entry = entries.find(item => item.id === entryId);

 useEffect(() => { dialog.current?.showModal(); }, []);
 useEffect(() => {
  let cancelled = false;
  setEntries([]); setEntryId(""); setPeriods([]); setError("");
  if (!userId || !staff.some(person=>person.userId===userId)) { setLoading(false); return; }
  setLoading(true);
  const client = createClient();
  if (!client) { setError("Sessão indisponível. Entre novamente no sistema."); setLoading(false); return; }
  void (async () => {
   const result = await client.from("time_clock_entries").select("id,opened_at,closed_at,updated_at,worked_seconds,correction_group_id").eq("user_id",userId).not("closed_at","is",null).order("opened_at",{ascending:false}).limit(30);
   if (cancelled) return;
   if (result.error) setError("Não foi possível carregar os pontos do profissional.");
   else { setEntries(result.data || []); if (initial?.userId === userId && result.data?.some(item => item.id === initial.id)) setEntryId(initial.id); }
   setLoading(false);
  })();
  return () => { cancelled = true; };
 }, [userId, initial?.id, initial?.userId]);
 useEffect(() => {
  let cancelled = false;
  setPeriods([]); setGroupEntries([]); setError(""); setReason(""); saveRequest.current=null;
  if (!entry) return;
  setLoading(true);
  const client=createClient();
  if (!client) { setLoading(false); setError("Sessão indisponível."); return; }
  void (async () => {
   let related: Entry[] = [entry];
   if (entry.correction_group_id) {
    const group=await client.from("time_clock_entries").select("id,opened_at,closed_at,updated_at,worked_seconds,correction_group_id").eq("user_id",userId).eq("correction_group_id",entry.correction_group_id).order("opened_at");
    if(cancelled)return;
    if(group.error || !group.data?.length) {setError("Não foi possível carregar todos os períodos vinculados. Selecione o ponto novamente.");setLoading(false);return;}
    related=group.data;
   }
   const result=await client.from("time_clock_segments").select("entry_id,started_at,ended_at").in("entry_id",related.map(item=>item.id)).order("started_at");
   if (cancelled) return;
   if (result.error) setError("Não foi possível carregar os períodos. Tente selecionar o ponto novamente.");
   else {
    setGroupEntries(related);
    setPeriods(related.flatMap(item=>{
     const segments=result.data?.filter(row=>row.entry_id===item.id) || [];
     return segments.length ? segments.map(row=>makePeriod(inputValue(row.started_at),row.ended_at ? inputValue(row.ended_at) : "")) : [makePeriod(inputValue(item.opened_at),inputValue(item.closed_at))];
    }).sort((a,b)=>parsePointDateTime(a.start)-parsePointDateTime(b.start)));
   }
   setLoading(false);
  })();
  return () => { cancelled=true; };
 }, [entry]);
 const validation=useMemo(() => {
  if (!periods.length) return {error:"Informe pelo menos um período.",seconds:0};
  let previousEnd=-Infinity, seconds=0;
  for (const period of periods) {
   const start=parsePointDateTime(period.start), end=parsePointDateTime(period.end);
   if (!Number.isFinite(start) || !Number.isFinite(end) || end<=start) return {error:"Confira as datas: a saída deve ser posterior à entrada.",seconds:0};
   if (end>Date.now()) return {error:"Não informe horários futuros.",seconds:0};
   if (start<previousEnd) return {error:"Organize os períodos em ordem, sem sobreposição.",seconds:0};
   seconds+=(end-start)/1000; previousEnd=end;
  }
  return {error:"",seconds};
 }, [periods]);
 async function save() {
  if (!entry || !groupEntries.length || loading || savingRef.current || validation.error || !reason.trim()) return;
  const client=createClient(); if (!client) {setError("Sessão indisponível."); return;}
  savingRef.current=true; setSaving(true); setError("");
  try {
   const payload={p_entry_id:entry.id,p_expected_entries:groupEntries.map(item=>({id:item.id,updatedAt:item.updated_at})),p_reason:reason.trim(),p_periods:periods.map(item=>({startedAt:new Date(parsePointDateTime(item.start)).toISOString(),endedAt:new Date(parsePointDateTime(item.end)).toISOString()}))};
   const signature=JSON.stringify(payload);
   if(saveRequest.current?.signature!==signature)saveRequest.current={signature,id:crypto.randomUUID()};
   const result=await client.rpc("admin_correct_time_clock_group",{...payload,p_request_id:saveRequest.current.id});
   if(result.error) {setError(result.error.message || "Não foi possível salvar a correção."); return;}
   if(!Array.isArray(result.data?.entryIds) || result.data.entryIds.length!==periods.length) {setError("Não foi possível confirmar todos os períodos salvos. Tente novamente sem alterar os campos.");return;}
   // O commit já foi confirmado. Falha ao recarregar não significa falha no salvamento.
   try {await onSaved();} finally {onClose();}

  } catch { setError("Não foi possível confirmar a operação. Atualize os pontos antes de tentar novamente."); }
  finally {savingRef.current=false;setSaving(false);}
 }
 const inputClass="mt-1 w-full min-w-0 rounded-xl border border-hpsr-border bg-white p-2 text-xs text-hpsr-text";
 return <dialog ref={dialog} onCancel={event=>{event.preventDefault();if(!saving)onClose();}} aria-labelledby="correct-point-title" className="hpsr-modal-tone m-auto max-h-[90dvh] w-[min(94vw,640px)] overflow-y-auto rounded-2xl bg-[#fffaf4] p-4 text-hpsr-text shadow-xl backdrop:bg-black/50 sm:p-5">
  <div className="mb-4 flex items-center justify-between gap-3"><h2 id="correct-point-title" className="text-base font-black">Corrigir ponto</h2><button type="button" disabled={saving} onClick={onClose} className="rounded-xl border border-hpsr-border px-3 py-2 text-xs font-bold disabled:opacity-50">Fechar</button></div>
  <label className="block text-xs font-bold">Médico<select className="mt-1 w-full min-w-0 rounded-xl border border-hpsr-border bg-white p-2 text-xs" value={userId} disabled={saving} onChange={event=>setUserId(event.target.value)}><option value="">Selecione o médico</option>{staff.map(person=><option key={person.userId} value={person.userId}>{person.user}</option>)}</select></label>
  <label className="mt-3 block text-xs font-bold">Últimos pontos finalizados<select className="mt-1 w-full min-w-0 rounded-xl border border-hpsr-border bg-white p-2 text-xs" value={entryId} disabled={saving || loading || !userId} onChange={event=>setEntryId(event.target.value)}><option value="">{loading ? "Carregando…" : "Selecione o ponto"}</option>{entries.map(item=><option key={item.id} value={item.id}>{format(item.opened_at)} → {format(item.closed_at)} · {duration(Number(item.worked_seconds))}</option>)}</select></label>
  {userId && !loading && !entries.length && <p className="mt-2 text-xs">Nenhum ponto finalizado encontrado.</p>}
  {entry && !loading && <>
   <p className="my-3 text-xs text-hpsr-muted">Horários de Brasília. Informe somente os períodos trabalhados. Para separar os dias, use “Dividir por dia” e ajuste a saída do primeiro dia e a entrada do seguinte. A saída final será preservada.</p>
   <div className="space-y-3">{periods.map((period,index)=><fieldset key={period.key} disabled={saving} className="rounded-xl border border-hpsr-border p-3"><legend className="px-1 text-xs font-bold">Período {index+1}</legend><div className="grid gap-3 sm:grid-cols-2"><label className="min-w-0 text-xs font-bold">Data e hora de entrada<input aria-label={`Entrada do período ${index+1}`} type="datetime-local" step="1" value={period.start} onChange={event=>setPeriods(items=>items.map((item,i)=>i===index?{...item,start:event.target.value}:item))} className={inputClass}/></label><label className="min-w-0 text-xs font-bold">Data e hora de saída<input aria-label={`Saída do período ${index+1}`} type="datetime-local" step="1" value={period.end} onChange={event=>setPeriods(items=>items.map((item,i)=>i===index?{...item,end:event.target.value}:item))} className={inputClass}/></label></div>{periods.length>1 && <button type="button" onClick={()=>setPeriods(items=>items.filter((_,i)=>i!==index))} className="mt-2 text-xs font-bold text-red-700">Remover período</button>}</fieldset>)}</div>
   <button type="button" disabled={saving || Boolean(validation.error)} onClick={()=>{
    const divided:Period[]=[];
    for(const item of periods){let start=parsePointDateTime(item.start);const end=parsePointDateTime(item.end);
     while(start<end){const day=inputValue(new Date(start).toISOString()).slice(0,10);const stop=Math.min(parsePointDateTime(`${day}T00:00:00`)+86400000,end);divided.push(makePeriod(inputValue(new Date(start).toISOString()),inputValue(new Date(stop).toISOString())));start=stop;
      if(divided.length>100){setError("A divisão excede 100 períodos. Divida manualmente em menos períodos.");return;}
     }
    }
    setPeriods(divided);setError("");
   }} className="my-3 mr-2 rounded-xl border border-hpsr-border px-3 py-2 text-xs font-bold">Dividir por dia</button>
   <button type="button" disabled={saving || periods.length>=100} onClick={()=>setPeriods(items=>[...items,makePeriod("",groupEntries[groupEntries.length-1]?.closed_at ? inputValue(groupEntries[groupEntries.length-1].closed_at) : "")])} className="my-3 rounded-xl border border-hpsr-border px-3 py-2 text-xs font-bold">Adicionar período</button>
   <label className="block text-xs font-bold">Motivo da correção<textarea value={reason} disabled={saving} maxLength={2000} onChange={event=>setReason(event.target.value)} className={inputClass} rows={2}/></label>
   <p className="mt-3 text-xs font-bold">Total registrado: {duration(groupEntries.reduce((sum,item)=>sum+Number(item.worked_seconds),0))} · Total corrigido: {validation.error ? "Confira os períodos" : duration(validation.seconds)}</p>
   {validation.error && <p className="mt-2 text-xs text-red-700">{validation.error}</p>}
   <p className="mt-2 text-xs text-hpsr-muted">Cada período permanece como um ponto separado, vinculado à mesma correção. Ao reabrir qualquer um deles, todos os períodos serão carregados. O registro anterior permanece na auditoria.</p>
  </>}
  {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}
  <div className="mt-4 flex justify-end"><button type="button" disabled={!entry || loading || saving || Boolean(validation.error) || !reason.trim()} onClick={()=>void save()} className="rounded-xl bg-hpsr-wine px-4 py-2 text-xs font-black text-white disabled:opacity-50">{saving?"Salvando…":"Salvar correção"}</button></div>
 </dialog>;
}
