"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, CalendarDays, ClipboardCheck, Database, Download, FileSpreadsheet, Search, ShieldCheck, UserPlus, Users, WalletCards } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { type SystemActivity } from "@/lib/administrative-storage";
import { createClient } from "@/lib/supabase";
import { exportAdministrativeReport, type AdministrativeMember } from "@/lib/export-administrative-report";

type GenericRecord = Record<string, any>;
type SupabaseActivityRow = { id: string; module: string; action: string; description: string; actor?: string | null; reference?: string | null; created_at: string };


export default function DirectionPage() {
  const [activities, setActivities] = useState<SystemActivity[]>([]);
  const [staffRequests, setStaffRequests] = useState<GenericRecord[]>([]);
  const [applications, setApplications] = useState<GenericRecord[]>([]);
  const [appointments, setAppointments] = useState<GenericRecord[]>([]);
  const [receiptCount, setReceiptCount] = useState(0);
  const [teamMembers, setTeamMembers] = useState<AdministrativeMember[]>([]);
  const [search, setSearch] = useState("");
  const [reportPeriod, setReportPeriod] = useState("all");

  useEffect(() => {
    async function loadDirectionData() {
      const client = createClient();
      if (!client) {
        setActivities([]);
        setStaffRequests([]);
        setApplications([]);
        setAppointments([]);
        setReceiptCount(0);
        setTeamMembers([]);
        return;
      }

      const [activityResult, staffResult, applicationsResult, appointmentsResult, receiptsResult, teamResult] = await Promise.all([
        client.from("system_activities").select("id, module, action, description, actor, reference, created_at").order("created_at", { ascending: false }),
        client.from("staff_registration_requests").select("id, passport, name, requested_role, status, payload, created_at").order("created_at", { ascending: false }),
        client.from("staff_applications").select("id, passport, name, desired_role, status, payload, created_at").order("created_at", { ascending: false }),
        client.from("appointments").select("id, passport, patient, status, payload, created_at").order("created_at", { ascending: false }),
        client.from("financial_receipts").select("id", { count: "exact", head: true }),
        client.from("team_members").select("id, passport, name, hospital_role, payload, created_at").order("created_at", { ascending: false }),
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
      if (!teamResult.error) {
        setTeamMembers((teamResult.data || []).map((row: GenericRecord) => {
          const payload = (row.payload || {}) as GenericRecord;
          return {
            name: row.name || payload.name || "Profissional",
            passport: row.passport || payload.passport || "",
            crm: payload.crm || "",
            hospitalRole: row.hospital_role || payload.hospitalRole || "Não informado",
            specialty: payload.specialty || "",
            department: payload.department || "",
            joinedAt: payload.joinedAt || row.created_at || "",
            history: Array.isArray(payload.history) ? payload.history : [],
          };
        }));
      }
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
    const periodStart = getPeriodStart(reportPeriod);
    return [...activities, ...derived]
      .sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime())
      .filter((item) => !periodStart || new Date(item.createdAt).getTime() >= periodStart)
      .filter((item)=>!q || [item.module,item.action,item.description,item.actor,item.reference].join(" ").toLowerCase().includes(q));
  }, [activities, staffRequests, applications, appointments, search, reportPeriod]);

  const pendingRegistrations = staffRequests.filter((item)=>item.status === "Pendente").length;
  const pendingApplications = applications.filter((item)=>!["Recusado","Contratado","Não contratado"].includes(item.status)).length;
  const pendingAppointments = appointments.filter((item)=>!["aceito","confirmado","recusado"].includes(String(item.status).toLowerCase())).length;



  function handleExportActivities() {
    exportCsv(
      `atividades-hpsr-${fileDate()}.csv`,
      ["Data", "Módulo", "Ação", "Descrição", "Responsável", "Referência"],
      unified.map((item) => [
        formatDateTime(item.createdAt),
        item.module,
        item.action,
        item.description,
        item.actor || "",
        item.reference || "",
      ]),
    );
  }

  function handleExportTeam() {
    exportCsv(
      `equipe-hpsr-${fileDate()}.csv`,
      ["Nome", "Passaporte", "CRM", "Cargo", "Especialidade", "Departamento", "Entrada"],
      teamMembers.map((member) => [
        member.name,
        member.passport,
        member.crm,
        member.hospitalRole,
        member.specialty,
        member.department,
        formatDateTime(member.joinedAt),
      ]),
    );
  }

  function handleExportApplications() {
    const periodStart = getPeriodStart(reportPeriod);
    const rows = applications.filter((item) => !periodStart || new Date(item.createdAt || item.created_at || 0).getTime() >= periodStart);
    exportCsv(
      `candidaturas-hpsr-${fileDate()}.csv`,
      ["Nome", "Passaporte", "Cargo desejado", "Status", "Triagem", "Entrevista", "Resultado", "Data"],
      rows.map((item) => [
        item.name || "",
        item.passport || "",
        item.desiredRole || item.desired_role || "",
        item.status || "",
        item.triageDecision || "",
        item.interviewStatus || "",
        item.interviewResult || "",
        formatDateTime(item.createdAt || item.created_at),
      ]),
    );
  }

  function handleExportReport() {
    exportAdministrativeReport(teamMembers, applications.map((item) => ({
      name: item.name || "Candidato",
      passport: item.passport || "",
      discord: item.discord || "",
      desiredRole: item.desiredRole || item.desired_role || "",
      interestArea: item.interestArea || "",
      createdAt: item.createdAt || item.created_at || "",
      triageDecision: item.triageDecision || "",
      status: item.status || "",
      decisionAt: item.decisionAt || "",
      interviewStatus: item.interviewStatus || "",
      interviewAt: item.interviewAt || "",
      interviewResult: item.interviewResult || "",
      interviewNotes: item.interviewNotes || "",
      notes: item.notes || "",
    })));
  }

  return <div className="hpsr-page gap-3">
    <PageHeader eyebrow="Administração" title="Relatório" description="Visão consolidada das atividades, solicitações e registros administrativos do sistema." />
    <section className="shrink-0 rounded-[18px] border border-white/70 bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-hpsr-wine">
        <Database size={18}/>
        <div>
          <h2 className="text-sm font-black text-hpsr-text">Gestão de dados e relatórios</h2>
          <p className="text-xs text-hpsr-muted">Escolha o período e exporte somente o conjunto de dados necessário.</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-start gap-2">
        <label className="flex min-h-[42px] min-w-[170px] items-center gap-2 rounded-[14px] border border-hpsr-border bg-[#fffaf4] px-3 text-xs font-black text-hpsr-wine">
          Período
          <select value={reportPeriod} onChange={(event)=>setReportPeriod(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm font-bold text-hpsr-text outline-none">
            <option value="all">Todo o histórico</option>
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>
        </label>
        <button type="button" onClick={handleExportReport} className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[14px] bg-hpsr-wine px-4 text-sm font-black text-white transition hover:opacity-90">
          <Download size={17}/> Exportar relatório
        </button>
        <button type="button" onClick={handleExportActivities} className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[14px] border border-hpsr-border bg-white px-4 text-sm font-black text-hpsr-wine transition hover:bg-[#fff8f0]">
          <FileSpreadsheet size={17}/> Atividades CSV
        </button>
        <button type="button" onClick={handleExportTeam} className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[14px] border border-hpsr-border bg-white px-4 text-sm font-black text-hpsr-wine transition hover:bg-[#fff8f0]">
          <Users size={17}/> Equipe CSV
        </button>
        <button type="button" onClick={handleExportApplications} className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[14px] border border-hpsr-border bg-white px-4 text-sm font-black text-hpsr-wine transition hover:bg-[#fff8f0]">
          <ClipboardCheck size={17}/> Candidaturas CSV
        </button>
      </div>
    </section>
    <div className="hpsr-page-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={<UserPlus size={19}/>} label="Cadastros pendentes" value={String(pendingRegistrations)}/>
        <Stat icon={<ClipboardCheck size={19}/>} label="Candidaturas em fluxo" value={String(pendingApplications)}/>
        <Stat icon={<CalendarDays size={19}/>} label="Solicitações de agenda" value={String(pendingAppointments)}/>
        <Stat icon={<WalletCards size={19}/>} label="Recibos financeiros" value={String(receiptCount)}/>
      </section>

      <section className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-h-0 flex-col rounded-[18px] border border-white/70 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hpsr-border pb-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-[15px] bg-hpsr-wine text-white"><Activity size={20}/></span><div><h2 className="font-black text-hpsr-text">Atividades do sistema</h2><p className="text-sm text-hpsr-muted">Linha do tempo administrativa consolidada.</p></div></div><label className="flex min-h-[42px] w-full min-w-0 sm:w-auto sm:min-w-[280px] items-center gap-3 rounded-[15px] border border-hpsr-border bg-[#fffaf4] px-3"><Search size={17} className="text-hpsr-muted"/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Buscar atividade" className="w-full bg-transparent text-sm font-semibold outline-none"/></label></div>
          <div className="mt-4 grid min-h-0 flex-1 content-start gap-2 overflow-y-auto overscroll-contain pr-2">{unified.slice(0,150).map((item)=><article key={item.id} className="grid gap-2 rounded-[15px] border border-hpsr-border bg-[#fffaf4] p-3 sm:grid-cols-[150px_1fr_auto] sm:items-center"><div><p className="text-[10px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">{item.module}</p><p className="mt-1 text-xs text-hpsr-muted">{new Date(item.createdAt).getTime() ? new Date(item.createdAt).toLocaleString("pt-BR") : "Data não registrada"}</p></div><div><p className="text-sm font-black text-hpsr-text">{item.action}</p><p className="mt-1 text-xs leading-relaxed text-hpsr-muted">{item.description}</p></div>{item.reference && <span className="rounded-full border border-hpsr-border bg-white px-2.5 py-1 text-[10px] font-black text-hpsr-wine">{item.reference}</span>}</article>)}{!unified.length&&<div className="rounded-[15px] border border-dashed border-hpsr-border p-8 text-center text-sm text-hpsr-muted">Nenhuma atividade registrada.</div>}</div>
        </div>
        <aside className="grid min-h-0 content-start gap-3 overflow-y-auto overscroll-contain pr-1">
          <Summary title="Solicitações de cadastro" icon={<UserPlus size={18}/>} items={staffRequests.map((item)=>`${item.name || "Profissional"} — ${item.status || "Pendente"}`)}/>
          <Summary title="Candidaturas" icon={<ClipboardCheck size={18}/>} items={applications.map((item)=>`${item.name || "Candidato"} — ${item.status || "Em análise"}`)}/>
          <Summary title="Governança" icon={<ShieldCheck size={18}/>} items={["Histórico centralizado no Supabase", "Solicitações públicas consolidadas", "Recibos vinculados ao Financeiro", "Registros compartilhados entre usuários autorizados"]}/>
        </aside>
      </section>
    </div>
  </div>;
}


function getPeriodStart(period: string) {
  if (period === "all") return 0;
  const days = Number(period);
  return Number.isFinite(days) ? Date.now() - days * 24 * 60 * 60 * 1000 : 0;
}

function formatDateTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("pt-BR");
}

function fileDate() {
  return new Date().toISOString().slice(0, 10);
}

function exportCsv(filename: string, headers: string[], rows: Array<Array<unknown>>) {
  const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map((row) => row.map(escape).join(";")).join("\n");
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function Stat({icon,label,value}:{icon:React.ReactNode;label:string;value:string}){return <div className="rounded-[17px] border border-white/70 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><span className="text-hpsr-wine">{icon}</span><span className="text-2xl font-black text-hpsr-text">{value}</span></div><p className="mt-3 text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">{label}</p></div>}
function Summary({title,icon,items}:{title:string;icon:React.ReactNode;items:string[]}){return <section className="rounded-[18px] border border-white/70 bg-white p-4 shadow-sm"><div className="flex items-center gap-2 border-b border-hpsr-border pb-3 text-hpsr-wine"><span>{icon}</span><h3 className="font-black text-hpsr-text">{title}</h3></div><div className="mt-3 grid gap-2">{items.slice(0,8).map((item,index)=><div key={`${item}-${index}`} className="rounded-[13px] border border-hpsr-border bg-[#fffaf4] px-3 py-2 text-xs font-semibold text-hpsr-muted">{item}</div>)}{!items.length&&<p className="text-sm text-hpsr-muted">Nenhum registro disponível.</p>}</div></section>}
