'use client';
import {useEffect,useState} from 'react';
import {pediatricDocumentPages,renderPediatricDocument,type PediatricSnapshot} from '@/lib/pediatric-document';
import {useVirtualPngPreview} from '@/lib/use-virtual-png-preview';
export function PediatricDocumentViewer({snapshot,onReady}:{snapshot:PediatricSnapshot;onReady?:(ready:boolean)=>void}){
 const [active,setActive]=useState(true),[generation,setGeneration]=useState(0);
 useEffect(()=>{setActive(true);const timer=setTimeout(()=>setActive(false),10*60*1000);return()=>clearTimeout(timer)},[snapshot,generation]);
 const [page,setPage]=useState(0);const pages=pediatricDocumentPages(snapshot);const index=Math.min(page,pages.length-1);
 const {url,error}=useVirtualPngPreview(active,snapshot,index,()=>renderPediatricDocument(snapshot,index));
 useEffect(()=>{onReady?.(Boolean(url)&&!error)},[url,error,onReady]);
 if(!active)return <button type="button" className="underline" onClick={()=>setGeneration(v=>v+1)}>Recriar imagem para visualizar ou baixar</button>;
 return <div><div className="mb-3 flex flex-wrap items-center gap-3"><button disabled={index===0} onClick={()=>setPage(index-1)} type="button">Anterior</button><span>{index+1} / {pages.length}</span><button disabled={index===pages.length-1} onClick={()=>setPage(index+1)} type="button">Próxima</button>{url&&<a className="font-bold underline" href={url} download={`planejamento-pediatrico-${index+1}.png`}>Baixar PNG desta página</a>}</div>{error?<p role="alert">{error}</p>:url?<img src={url} alt={`Planejamento pediátrico, página ${index+1}`} className="mx-auto h-auto w-full max-w-[800px] rounded-lg"/>:<p role="status">Gerando página…</p>}</div>;
}
