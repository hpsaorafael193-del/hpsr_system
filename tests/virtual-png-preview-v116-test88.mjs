import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
const code=stripTypeScriptTypes(readFileSync('src/lib/use-virtual-png-preview.ts','utf8')).replace(/^import .*;$/gm,'').replace('export function','function');
const slots=[];let cursor=0;let scheduled=false;let active=true;const effects=[];let enabled=true;let snapshot={};let page=0;let output;
const requests=[];const urls=new Map();const revoked=[];let count=0;
const URL={createObjectURL(blob){const url='blob:test-'+ ++count;urls.set(url,blob);return url},revokeObjectURL(url){revoked.push(url);urls.delete(url)}};
function schedule(){if(!scheduled&&active){scheduled=true;queueMicrotask(()=>{scheduled=false;render()})}}
function useRef(value){const i=cursor++;slots[i]??={current:value};return slots[i]}
function useState(value){const i=cursor++;slots[i]??={value};return [slots[i].value,v=>{slots[i].value=v;schedule()}]}
function useEffect(fn,deps){const i=cursor++;const old=slots[i];if(!old||deps.some((d,j)=>!Object.is(d,old.deps[j]))){slots[i]={deps,cleanup:old?.cleanup};effects.push(()=>{slots[i].cleanup?.();slots[i].cleanup=fn()})}}
const hook=new Function('useEffect','useRef','useState','URL',code+';return useVirtualPngPreview;')(useEffect,useRef,useState,URL);
function render(){cursor=0;output=hook(enabled,snapshot,page,()=>new Promise((resolve,reject)=>requests.push({resolve,reject})));while(effects.length)effects.shift()()}
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
render();assert.equal(output.url,'');const png=new Blob(['same pixels'],{type:'image/png'});requests[0].resolve(png);await tick();const first=output.url;assert.equal(urls.get(first),png);
render();await tick();assert.equal(requests.length,1,'No regeneration on unrelated renders');assert.equal(output.url,first,'Preview URL is stable for downloading the exact blob');
page=1;render();assert.equal(output.url,'');assert.ok(revoked.includes(first));page=2;render();requests[1].resolve(new Blob(['stale']));await tick();assert.equal(output.url,'','Late old page must not replace current page');requests[2].resolve(new Blob(['page 3']));await tick();const last=output.url;
enabled=false;render();await tick();assert.equal(output.url,'');assert.ok(revoked.includes(last));assert.equal(urls.size,0,'Closing releases all generated PNGs');
enabled=true;snapshot={};render();requests[3].reject(new Error('render failed'));await tick();assert.match(output.error,/render failed/);assert.equal(output.url,'');
active=false;for(const slot of slots)slot?.cleanup?.();
console.log('PASS exact blob reuse, no extra render, stale-page protection, error status and URL cleanup');
