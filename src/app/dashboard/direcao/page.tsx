"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, CalendarDays, ClipboardCheck, FileClock, Search, ShieldCheck, UserPlus, WalletCards } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { type SystemActivity } from "@/lib/administrative-storage";
import { createClient } from "@/lib/supabase";

type GenericRecord = Record<string, any>;
type SupabaseActivityRow = { id: string; module: string; action: string; description: string; actor?: string | null; reference?: string | null; created_at: string };


export default function DirectionPage() {
  const [activities, setActivities] = useState<SystemActivity[]>([]);
  const [staffRequests, setStaffRequests] = useState<GenericRecord[]>([]);
  const [applications, setApplications] = useState<GenericRecord[]>([]);
  const [appointments, setAppointments] = useState<GenericRecord[]>([]);
  const [receiptCount, setReceiptCount] = useState(0);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadDirectionData() {
      const client = createClient();
      if (!client) {
        setActivities([]);
        setStaffRequests([]);
        setApplications([]);
        setAppointments([]);
        setReceiptCount(0);
        return;
      }

      const [activityResult, staffResult, applicationsResult, appointmentsResult, receiptsResult] = await Promise.all([
        client.from("system_activities").select("id, module, action, description, actor, reference, created_at").order("created_at", { ascending: false }),
        client.from("staff_registration_requests").select("id, passport, name, requested_role, status, payload, created_at").order("created_at", { ascending: false }),
        client.from("staff_applications").select("id, passport, name, desired_role, status, payload, created_at").order("created_at", { ascending: false }),
        client.from("appointments").select("id, passport, patient, status, payload, created_at").order("created_at", { ascending: false }),
        client.from("financial_receipts").select("id", { count: "exact", head: true }),
      ]);

      if (!activityResult.error) {
        setActivities(((activityResult.data || []) as SupabaseActivityRow[]).map((row) => ({
          id: row.id,
          module: row.module,
          action: row.action,
          description: row.description,
          actor: row.actor || undefined,
          reference: row.reference || undefined,
          createdAt: row.created_at,
        })));
      }
      if (!staffResult.error) setStaffRequests((staffResult.data || []).map((row) => ({ ...((row.payload || {}) as GenericRecord), ...row, createdAt: row.created_at, requestedRole: row.requested_role })));
      if (!applicationsResult.error) setApplications((applicationsResult.data || []).map((row) => ({ ...((row.payload || {}) as GenericRecord), ...row, protocol: row.id, createdAt: row.created_at, desiredRole: row.desired_role })));
      if (!appointmentsResult.error) setAppointments((appointmentsResult.data || []).map((row) => ({ ...((row.payload || {}) as GenericRecord), ...row, patientName: row.patient, createdAt: row.created_at })));
      if (!receiptsResult.error) setReceiptCount(receiptsResult.count || 0);
    }

    void loadDirectionData();
  }, []);

  const unified = useMemo(() => {
    const derived: SystemActivity[] = [
      ...staffRequests.map((item) => ({ id: `staff-${item.id}`, createdAt: item.createdAt || new Date(0).toISOString(), module: "Cadastros médicos", action: `Solicitação ${item.status || "Pendente"}`, description: `${item.name || "Profissional"} solicitou acesso como ${item.requestedRole || "cargo não informado"}.`, reference: item.passport })),
      ...applications.map((item) => ({ id: `application-${item.protocol}`, createdAt: item.createdAt || new Date(0).toISOString(), module: "Candidaturas", action: item.status || "Em análise", description: `${item.name || "Candidato"} · ${item.desiredRole || "cargo não informado"}.`, reference: item.protocol })),
      ...appointments.map((item, index) => ({ id: `appointment-${item.id || index}`, createdAt: item.createdAt || item.requestedAt || new Date(0).toISOString(), module: "Agendamentos", action: item.status || "Solicitação recebida", description: `${item.patientName || item.name || "Paciente"} · ${item.specialty || item.type || "Atendimento"}.`, reference: item.passport })),
    ];
    const q = search.trim().toLowerCase();
    return [...activities, ...derived].sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()).filter((item)=>!q || [item.module,item.action,item.description,item.actor,item.reference].join(" ").toLowerCase().includes(q));
  }, [activities, staffRequests, applications, appointments, search]);

  const pendingRegistrations = staffRequests.filter((item)=>item.status === "Pendente").length;
  const pendingApplications = applications.filter((item)=>!["Recusado","Contratado","Não contratado"].includes(item.status)).length;
  const pendingAppointments = appointments.filter((item)=>!["aceito","confirmado","recusado"].includes(String(item.status).toLowerCase())).length;

  return <div className="hpsr-page gap-3">
    <PageHeader eyebrow="Administração" title="Relatório" description="Visão consolidada das atividades, solicitações e registros administrativos do sistema." />
    <div className="hpsr-page-scroll space-y-3">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={<UserPlus size={19}/>} label="Cadastros pendentes" value={String(pendingRegistrations)}/>
        <Stat icon={<ClipboardCheck size={19}/>} label="Candidaturas em fluxo" value={String(pendingApplications)}/>
        <Stat icon={<CalendarDays size={19}/>} label="Solicitações de agenda" value={String(pendingAppointments)}/>
        <Stat icon={<WalletCards size={19}/>} label="Recibos financeiros" value={String(receiptCount)}/>
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-[18px] border border-white/70 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hpsr-border pb-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-[15px] bg-hpsr-wine text-white"><Activity size={20}/></span><div><h2 className="font-black text-hpsr-text">Atividades do sistema</h2><p className="text-sm text-hpsr-muted">Linha do tempo administrativa consolidada.</p></div></div><label className="flex min-h-[42px] w-full min-w-0 sm:w-auto sm:min-w-[280px] items-center gap-3 rounded-[15px] border border-hpsr-border bg-[#fffaf4] px-3"><Search size={17} className="text-hpsr-muted"/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Buscar atividade" className="w-full bg-transparent text-sm font-semibold outline-none"/></label></div>
          <div className="mt-4 grid max-h-[min(62dvh,760px)] gap-2 overflow-y-auto overscroll-contain pr-2">{unified.slice(0,150).map((item)=><article key={item.id} className="grid gap-2 rounded-[15px] border border-hpsr-border bg-[#fffaf4] p-3 sm:grid-cols-[150px_1fr_auto] sm:items-center"><div><p className="text-[10px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">{item.module}</p><p className="mt-1 text-xs text-hpsr-muted">{new Date(item.createdAt).getTime() ? new Date(item.createdAt).toLocaleString("pt-BR") : "Data não registrada"}</p></div><div><p className="text-sm font-black text-hpsr-text">{item.action}</p><p className="mt-1 text-xs leading-relaxed text-hpsr-muted">{item.description}</p></div>{item.reference && <span className="rounded-full border border-hpsr-border bg-white px-2.5 py-1 text-[10px] font-black text-hpsr-wine">{item.reference}</span>}</article>)}{!unified.length&&<div className="rounded-[15px] border border-dashed border-hpsr-border p-8 text-center text-sm text-hpsr-muted">Nenhuma atividade registrada.</div>}</div>
        </div>
        <aside className="grid content-start gap-3">
          <Summary title="Solicitações de cadastro" icon={<UserPlus size={18}/>} items={staffRequests.map((item)=>`${item.name || "Profissional"} — ${item.status || "Pendente"}`)}/>
          <Summary title="Candidaturas" icon={<ClipboardCheck size={18}/>} items={applications.map((item)=>`${item.name || "Candidato"} — ${item.status || "Em análise"}`)}/>
          <Summary title="Governança" icon={<ShieldCheck size={18}/>} items={["Histórico centralizado no Supabase", "Solicitações públicas consolidadas", "Recibos vinculados ao Financeiro", "Registros compartilhados entre usuários autorizados"]}/>
        </aside>
      </section>
    </div>
  </div>;
}

function Stat({icon,label,value}:{icon:React.ReactNode;label:string;value:string}){return <div className="rounded-[17px] border border-white/70 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><span className="text-hpsr-wine">{icon}</span><span className="text-2xl font-black text-hpsr-text">{value}</span></div><p className="mt-3 text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">{label}</p></div>}
function Summary({title,icon,items}:{title:string;icon:React.ReactNode;items:string[]}){return <section className="rounded-[18px] border border-white/70 bg-white p-4 shadow-sm"><div className="flex items-center gap-2 border-b border-hpsr-border pb-3 text-hpsr-wine"><span>{icon}</span><h3 className="font-black text-hpsr-text">{title}</h3></div><div className="mt-3 grid gap-2">{items.slice(0,8).map((item,index)=><div key={`${item}-${index}`} className="rounded-[13px] border border-hpsr-border bg-[#fffaf4] px-3 py-2 text-xs font-semibold text-hpsr-muted">{item}</div>)}{!items.length&&<p className="text-sm text-hpsr-muted">Nenhum registro disponível.</p>}</div></section>}
