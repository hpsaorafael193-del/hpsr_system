"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { brazilDateTimeInput } from "@/lib/brazil-datetime";

type Entry = { id: string; opened_at: string; closed_at: string; updated_at: string; worked_seconds: number };
type Period = { start: string; end: string };
export function parsePointDateTime(value: string) {
  // Campos civis de Brasília; não dependem do fuso do computador.
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(value)) return NaN;
  return new Date(`${value}-03:00`).getTime();
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
 const [userId, setUserId] = useState(initial?.userId || "");
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
  if (!userId) { setLoading(false); return; }
  setLoading(true);
  const client = createClient();
  if (!client) { setError("Sessão indisponível. Entre novamente no sistema."); setLoading(false); return; }
  void (async () => {
   const result = await client.from("time_clock_entries").select("id,opened_at,closed_at,updated_at,worked_seconds").eq("user_id",userId).not("closed_at","is",null).order("opened_at",{ascending:false}).limit(30);
   if (cancelled) return;
   if (result.error) setError("Não foi possível carregar os pontos do profissional.");
   else { setEntries(result.data || []); if (initial?.userId === userId && result.data?.some(item => item.id === initial.id)) setEntryId(initial.id); }
   setLoading(false);
  })();
  return () => { cancelled = true; };
 }, [userId, initial?.id, initial?.userId]);
 useEffect(() => {
  let cancelled = false;
  setPeriods([]); setError(""); setReason("");
  if (!entry) return;
  setLoading(true);
  const client=createClient();
  if (!client) { setLoading(false); setError("Sessão indisponível."); return; }
  void (async () => {
   const result=await client.from("time_clock_segments").select("started_at,ended_at").eq("entry_id",entry.id).order("started_at");
   if (cancelled) return;
   if (result.error) setError("Não foi possível carregar os períodos. Tente selecionar o ponto novamente.");
   else setPeriods(result.data?.length ? result.data.map(row => ({start:inputValue(row.started_at),end:row.ended_at ? inputValue(row.ended_at) : ""})) : [{start:inputValue(entry.opened_at),end:inputValue(entry.closed_at)}]);
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
  if (!entry || loading || savingRef.current || validation.error || !reason.trim()) return;
  const client=createClient(); if (!client) {setError("Sessão indisponível."); return;}
  savingRef.current=true; setSaving(true); setError("");
  try {
   const result=await client.rpc("admin_correct_time_clock_periods",{p_entry_id:entry.id,p_expected_updated_at:entry.updated_at,p_reason:reason.trim(),p_periods:periods.map(item=>({startedAt:new Date(parsePointDateTime(item.start)).toISOString(),endedAt:new Date(parsePointDateTime(item.end)).toISOString()}))});
   if(result.error) {setError(result.error.message || "Não foi possível salvar a correção."); return;}
   await onSaved(); onClose();
  } catch { setError("Não foi possível confirmar a operação. Atualize os pontos antes de tentar novamente."); }
  finally {savingRef.current=false;setSaving(false);}
 }
 const inputClass="mt-1 w-full min-w-0 rounded-xl border border-hpsr-border bg-white p-2 text-xs text-hpsr-text";
 return <dialog ref={dialog} onCancel={event=>{event.preventDefault();if(!saving)onClose();}} aria-labelledby="correct-point-title" className="m-auto max-h-[90dvh] w-[min(94vw,640px)] overflow-y-auto rounded-2xl bg-[#fffaf4] p-4 text-hpsr-text shadow-xl backdrop:bg-black/50 sm:p-5">
  <div className="mb-4 flex items-center justify-between gap-3"><h2 id="correct-point-title" className="text-base font-black">Corrigir ponto</h2><button type="button" disabled={saving} onClick={onClose} className="rounded-xl border border-hpsr-border px-3 py-2 text-xs font-bold disabled:opacity-50">Fechar</button></div>
  <label className="block text-xs font-bold">Médico<select className="mt-1 w-full min-w-0 rounded-xl border border-hpsr-border bg-white p-2 text-xs" value={userId} disabled={saving} onChange={event=>setUserId(event.target.value)}><option value="">Selecione o médico</option>{staff.map(person=><option key={person.userId} value={person.userId}>{person.user}</option>)}</select></label>
  <label className="mt-3 block text-xs font-bold">Últimos pontos finalizados<select className="mt-1 w-full min-w-0 rounded-xl border border-hpsr-border bg-white p-2 text-xs" value={entryId} disabled={saving || loading || !userId} onChange={event=>setEntryId(event.target.value)}><option value="">{loading ? "Carregando…" : "Selecione o ponto"}</option>{entries.map(item=><option key={item.id} value={item.id}>{format(item.opened_at)} → {format(item.closed_at)} · {duration(Number(item.worked_seconds))}</option>)}</select></label>
  {userId && !loading && !entries.length && <p className="mt-2 text-xs">Nenhum ponto finalizado encontrado.</p>}
  {entry && !loading && <>
   <p className="my-3 text-xs text-hpsr-muted">Horários de Brasília. Informe somente os períodos trabalhados. Para separar os dias, ajuste a saída e adicione a próxima entrada.</p>
   <div className="space-y-3">{periods.map((period,index)=><fieldset key={index} disabled={saving} className="rounded-xl border border-hpsr-border p-3"><legend className="px-1 text-xs font-bold">Período {index+1}</legend><div className="grid gap-3 sm:grid-cols-2"><label className="min-w-0 text-xs font-bold">Data e hora de entrada<input aria-label={`Entrada do período ${index+1}`} type="datetime-local" step="1" value={period.start} onChange={event=>setPeriods(items=>items.map((item,i)=>i===index?{...item,start:event.target.value}:item))} className={inputClass}/></label><label className="min-w-0 text-xs font-bold">Data e hora de saída<input aria-label={`Saída do período ${index+1}`} type="datetime-local" step="1" value={period.end} onChange={event=>setPeriods(items=>items.map((item,i)=>i===index?{...item,end:event.target.value}:item))} className={inputClass}/></label></div>{periods.length>1 && <button type="button" onClick={()=>setPeriods(items=>items.filter((_,i)=>i!==index))} className="mt-2 text-xs font-bold text-red-700">Remover período</button>}</fieldset>)}</div>
   <button type="button" disabled={saving || periods.length>=100} onClick={()=>setPeriods(items=>[...items,{start:"",end:""}])} className="my-3 rounded-xl border border-hpsr-border px-3 py-2 text-xs font-bold">Adicionar período</button>
   <label className="block text-xs font-bold">Motivo da correção<textarea value={reason} disabled={saving} maxLength={2000} onChange={event=>setReason(event.target.value)} className={inputClass} rows={2}/></label>
   <p className="mt-3 text-xs font-bold">Total registrado: {duration(Number(entry.worked_seconds))} · Total corrigido: {validation.error ? "Confira os períodos" : duration(validation.seconds)}</p>
   {validation.error && <p className="mt-2 text-xs text-red-700">{validation.error}</p>}
   <p className="mt-2 text-xs text-hpsr-muted">Cada período será salvo como um ponto separado. O registro anterior permanece na auditoria.</p>
  </>}
  {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}
  <div className="mt-4 flex justify-end"><button type="button" disabled={!entry || loading || saving || Boolean(validation.error) || !reason.trim()} onClick={()=>void save()} className="rounded-xl bg-hpsr-wine px-4 py-2 text-xs font-black text-white disabled:opacity-50">{saving?"Salvando…":"Salvar correção"}</button></div>
 </dialog>;
}
