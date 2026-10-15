"use client";

import {useEffect,useRef,useSyncExternalStore} from "react";
import {RefreshCw} from "lucide-react";

type Job={run:()=>Promise<unknown>;blocked:boolean};
type State={revision:number;running:boolean;message:string};
const jobs=new Map<string,Job>();
const listeners=new Set<()=>void>();
const localControls=new Set<symbol>();
let state:State={revision:0,running:false,message:""};
const serverState:State={revision:0,running:false,message:""};
let pending:Promise<void>|null=null;
function publish(change:Partial<State>={}) {state={...state,...change,revision:state.revision+1};listeners.forEach(listener=>listener());}
// Controls register only while mounted/visible; route cleanup restores the global button.
export function registerLocalRefreshControl() {
 const token=Symbol();localControls.add(token);publish();
 return ()=>{if(localControls.delete(token))publish();};
}
export function useLocalRefreshControl(enabled=true) {
 useEffect(()=>enabled ? registerLocalRefreshControl() : undefined,[enabled]);
}
export function hasLocalRefreshControl() {return localControls.size>0;}
export function registerManualRefresh(id:string,run:()=>Promise<unknown>,blocked=false) {
 const job={run,blocked};jobs.set(id,job);publish({message:""});
 return ()=>{if(jobs.get(id)===job){jobs.delete(id);publish({message:""});}};
}
export function useManualRefresh(id:string,run:()=>Promise<unknown>,blocked=false,enabled=true) {
 const latest=useRef(run);latest.current=run;
 useEffect(()=>enabled ? registerManualRefresh(id,()=>latest.current(),blocked) : undefined,[id,blocked,enabled]);
}
export function refreshVisibleData(scope?:string) {
 if(pending)return pending;
 const selected=[...jobs].filter(([id])=>!scope||id===scope||id.startsWith(`${scope}:`)).map(([,job])=>job);
 if(!selected.length||selected.some(job=>job.blocked))return Promise.resolve();
 publish({running:true,message:"Consultando dados…"});
 pending=(async()=>{
  const results=await Promise.allSettled(selected.map(job=>Promise.resolve().then(job.run)));
  publish({running:false,message:results.some(result=>result.status==="rejected") ? "Uma consulta falhou. Confira os avisos da área e tente novamente." : "Consulta concluída."});
 })().finally(()=>{pending=null;});
 return pending;
}
export function ManualRefreshButton({scope,className="",compact=false,globalControl=false}:{scope?:string;className?:string;compact?:boolean;globalControl?:boolean}) {
 const snapshot=useSyncExternalStore(listener=>{listeners.add(listener);return ()=>{listeners.delete(listener);};},()=>state,()=>serverState);
 const selected=[...jobs].filter(([id])=>!scope||id===scope||id.startsWith(`${scope}:`)).map(([,job])=>job);
 useLocalRefreshControl(!globalControl && selected.length>0);
 if(!selected.length || (globalControl && hasLocalRefreshControl()))return null;
 return <span className={`inline-flex min-w-0 items-center gap-2 ${className}`}><button type="button" aria-label="Atualizar dados da área aberta" title={selected.some(job=>job.blocked) ? "Aguarde a operação em andamento para atualizar." : "Consultar os dados mais recentes sem recarregar a página"} disabled={snapshot.running||selected.some(job=>job.blocked)} onClick={()=>void refreshVisibleData(scope)} className="inline-flex min-h-[38px] shrink-0 items-center justify-center gap-2 rounded-[11px] border border-[#c8a992] bg-[#f5e8dc] px-3 text-xs font-bold text-hpsr-wine shadow-sm transition hover:bg-[#eee0d2] disabled:cursor-wait disabled:opacity-55"><RefreshCw size={15} className={snapshot.running?"animate-spin":""}/><span className={compact?"hidden sm:inline":""}>{snapshot.running?"Atualizando…":"Atualizar"}</span></button><span role="status" aria-live="polite" className="sr-only">{snapshot.message}</span></span>;
}
