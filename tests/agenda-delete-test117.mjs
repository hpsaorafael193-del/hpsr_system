import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const page=readFileSync('src/app/dashboard/agendamento/clinica/page.tsx','utf8');
const start=page.indexOf('  async function handleDeleteAppointment('),end=page.indexOf('\n  async function removePublishedSlot',start);
const body=stripTypeScriptTypes('const run = '+page.slice(start,end).trim());
const appointment={id:'QA',patient:'Paciente QA',date:'2026-10-13',time:'14:00',status:'Confirmada',doctorId:'doctor'};
function setup(options={}) {
 const writes=[],alerts=[],filters=[],busy=[];let refresh=0;
 const ref={current:false};
 const row={payload:{doctorId:'doctor',slotId:'original-slot',kept:'original'},status:'Confirmada',updated_at:'2026-10-13T12:00:00Z'};
 const query={eq:(key,value)=>{filters.push([key,value]);return query;},is:(key,value)=>{filters.push([key,value]);return query;},select:()=>query,maybeSingle:async()=>({data:options.stale?null:{id:'QA',status:'Cancelada'},error:options.fail?new Error('DB fail'):null})};
 const client={from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:row,error:null})})}),update:values=>{writes.push(values);return query;}})};
 const run=new Function('canManageAppointment','deleteAppointmentInFlight','quickStatusSavingId','setDeletingAppointmentId','hpsrConfirm','createClient','hpsrAlert','brazilIso','currentUserProfile','loadAppointments',body+';return run;')(
  ()=>options.denied!==true,ref,null,id=>busy.push(id),async()=>options.confirm?.()??options.cancel!==true,()=>client,async(message,title)=>alerts.push({message,title}),()=> '2026-10-13T13:00:00-03:00',{systemName:'Médico QA'},async()=>{refresh++;if(options.refreshFail)throw new Error('refresh fail');});
 return {run,writes,alerts,filters,busy,ref,get refresh(){return refresh;}};
}
let t=setup({denied:true});await t.run(appointment);assert.equal(t.busy.length,0);assert.equal(t.writes.length,0);
t=setup({cancel:true});await t.run(appointment);assert.equal(t.writes.length,0);assert.equal(t.ref.current,false);
t=setup();await t.run(appointment);assert.equal(t.writes.length,1);assert.equal(t.writes[0].status,'Cancelada');assert.equal(t.writes[0].payload.slotId,'original-slot');assert.equal(t.writes[0].payload.kept,'original');assert.equal(t.writes[0].payload.previousStatus,'Confirmada');assert.ok(t.filters.some(([k,v])=>k==='updated_at'&&v==='2026-10-13T12:00:00Z'));assert.equal(t.refresh,1);assert.equal(t.ref.current,false);
t=setup({stale:true});await t.run(appointment);assert.equal(t.refresh,0);assert.match(t.alerts[0].message,/mudou/);
t=setup({fail:true});await t.run(appointment);assert.match(t.alerts[0].message,/DB fail/);assert.equal(t.ref.current,false);
t=setup({refreshFail:true});await t.run(appointment);assert.equal(t.alerts[0].title,'Consulta excluída');
let unlock; t=setup({confirm:()=>new Promise(resolve=>{unlock=resolve;})});const first=t.run(appointment);await t.run(appointment);unlock(true);await first;assert.equal(t.writes.length,1);
assert.ok(page.includes('onClick={() => void handleDeleteAppointment(appointment)}'));
console.log('PASS direct delete action, confirmation/cancel, ownership guard, preserved slot/payload, stale-write filter, duplicate-click lock and committed refresh failure');
