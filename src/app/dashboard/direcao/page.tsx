"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, BarChart3, CalendarDays, ClipboardCheck, Database, Download, FileSpreadsheet, FlaskConical, Search, ShieldCheck, Sparkles, Stethoscope, UserPlus, Users, WalletCards } from "lucide-react";
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
  const [receipts, setReceipts] = useState<GenericRecord[]>([]);
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
        client.from("system_activities").select("id, module, action, description, actor, reference, created_at").order("created_at", { ascending: false }).limit(600),
        client.from("staff_registration_requests").select("id, passport, name, requested_role, status, payload, created_at").order("created_at", { ascending: false }).limit(300),
        client.from("staff_applications").select("id, passport, name, desired_role, status, payload, created_at").order("created_at", { ascending: false }).limit(300),
        client.from("appointments").select("id, passport, patient, status, payload, created_at").order("created_at", { ascending: false }).limit(500),
        client.from("financial_receipts").select("id, number, total, payload, created_at").order("created_at", { ascending: false }).limit(500),
        client.from("team_members").select("id, passport, name, hospital_role, payload, created_at").order("created_at", { ascending: false }).limit(300),
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
      if (!receiptsResult.error) {
        const rows = (receiptsResult.data || []).map((row: GenericRecord) => ({ ...((row.payload || {}) as GenericRecord), ...row, createdAt: row.created_at }));
        setReceipts(rows);
        setReceiptCount(rows.length);
      }
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

  const periodStart = useMemo(() => getPeriodStart(reportPeriod), [reportPeriod]);
  const periodReceipts = useMemo(
    () => receipts.filter((item) => !periodStart || new Date(item.createdAt || item.created_at || 0).getTime() >= periodStart),
    [receipts, periodStart],
  );

  const analytics = useMemo(() => {
    const countMap = (values: string[]) => {
      const map = new Map<string, number>();
      values.filter(Boolean).forEach((value) => map.set(value, (map.get(value) || 0) + 1));
      return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    };

    const planRanking = countMap([
      ...periodReceipts.map((item) => String(item.convenio || item.planName || "Sem Convênio")),
    ]);

    const serviceRanking = countMap(
      periodReceipts.flatMap((receipt) => Array.isArray(receipt.items) ? receipt.items.map((item: GenericRecord) => String(item.name || item.nome || "Serviço")) : [])
    );

    const examRanking = countMap(
      unified
        .filter((item) => item.module?.toLowerCase() === "exames")
        .map((item) => {
          const full = `${item.action || ""} ${item.description || ""}`;
          const match = full.match(/(?:^|\s)([A-ZÀ-Úa-zà-ú0-9][A-ZÀ-Úa-zà-ú0-9\-\s]{2,60})(?=\s+salvo|\s+emitido|\.|$)/);
          return match?.[1]?.trim() || item.action || "Exame";
        })
    );

    const moduleRanking = countMap(unified.map((item) => item.module || "Sistema"));

    return {
      planRanking,
      serviceRanking,
      examRanking,
      moduleRanking,
      topPlan: planRanking[0],
      topService: serviceRanking[0],
      topExam: examRanking[0],
    };
  }, [periodReceipts, unified]);

  const pendingRegistrations = staffRequests.filter((item)=>item.status === "Pendente").length;
  const pendingApplications = applications.filter((item)=>!["Recusado","Contratado","Não contratado"].includes(item.status)).length;
  const pendingAppointments = appointments.filter((item)=>!["aceito","confirmado","recusado"].includes(String(item.status).toLowerCase())).length;
  const periodRevenue = periodReceipts.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const periodLabel = reportPeriod === "all" ? "Todo o histórico" : `Últimos ${reportPeriod} dias`;



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

  return <div className="hpsr-page gap-3 lg:h-[calc(100dvh-2.4rem)] lg:min-h-0 lg:overflow-hidden">
    <PageHeader eyebrow="Administração" title="Relatório" description="Indicadores operacionais, produção hospitalar e gestão administrativa em uma visão consolidada." />

    <section className="fixed relative inset-auto z-auto block h-auto w-auto shrink-0 overflow-hidden rounded-[20px] border border-white/80 bg-[linear-gradient(135deg,#ffffff_0%,#fff8f1_100%)] p-3.5 shadow-[0_12px_30px_rgba(79,42,21,0.06)]">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-hpsr-wine text-white"><Database size={18}/></span>
          <div className="min-w-0">
            <h2 className="text-sm font-black text-hpsr-text">Gestão de dados e relatórios</h2>
            <p className="truncate text-xs text-hpsr-muted">{periodLabel} · {unified.length} atividades analisadas</p>
          </div>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <label className="flex min-h-[40px] min-w-[165px] items-center gap-2 rounded-[13px] border border-hpsr-border bg-white px-3 text-xs font-black text-hpsr-wine">
            <CalendarDays size={15}/>
            <select value={reportPeriod} onChange={(event)=>setReportPeriod(event.target.value)} className="min-w-0 flex-1 bg-transparent text-xs font-bold text-hpsr-text outline-none">
              <option value="all">Todo o histórico</option><option value="7">Últimos 7 dias</option><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option>
            </select>
          </label>
          <button type="button" onClick={handleExportReport} className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-[13px] bg-hpsr-wine px-4 text-xs font-black text-white transition hover:opacity-90"><Download size={15}/> Exportar relatório</button>
          <ExportMenu onActivities={handleExportActivities} onTeam={handleExportTeam} onApplications={handleExportApplications}/>
        </div>
      </div>
    </section>

    <div className="hpsr-page-scroll min-h-0 flex-1 overscroll-contain pr-1" style={{ overflowY: "auto", overflowX: "hidden" }}>
      <div className="flex min-h-full flex-col gap-3 pb-3">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <Stat icon={<Activity size={18}/>} label="Atividades no período" value={String(unified.length)}/>
          <Stat icon={<Users size={18}/>} label="Equipe cadastrada" value={String(teamMembers.length)}/>
          <Stat icon={<UserPlus size={18}/>} label="Cadastros pendentes" value={String(pendingRegistrations)}/>
          <Stat icon={<ClipboardCheck size={18}/>} label="Candidaturas em fluxo" value={String(pendingApplications)}/>
          <Stat icon={<CalendarDays size={18}/>} label="Agendas pendentes" value={String(pendingAppointments)}/>
          <Stat icon={<WalletCards size={18}/>} label="Receita registrada" value={formatMoney(periodRevenue)}/>
        </section>

        <section className="grid shrink-0 gap-3 xl:grid-cols-[1.15fr_.85fr]">
          <div className="overflow-hidden rounded-[18px] border border-white/80 bg-white shadow-[0_10px_24px_rgba(79,42,21,0.05)]">
            <div className="flex items-center gap-3 border-b border-hpsr-border px-4 py-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-[13px] bg-hpsr-wine text-white"><Sparkles size={17}/></span>
              <div><h2 className="font-black text-hpsr-text">Destaques operacionais</h2><p className="text-xs text-hpsr-muted">Principais resultados identificados automaticamente.</p></div>
            </div>
            <div className="grid gap-px bg-hpsr-border sm:grid-cols-3">
              <InsightCard icon={<WalletCards size={16}/>} label="Plano mais feito" value={analytics.topPlan?.[0] || "Sem dados"} helper={analytics.topPlan ? `${analytics.topPlan[1]} registro(s)` : "Sem movimentações"}/>
              <InsightCard icon={<FlaskConical size={16}/>} label="Exame mais realizado" value={analytics.topExam?.[0] || "Sem dados"} helper={analytics.topExam ? `${analytics.topExam[1]} registro(s)` : "Sem lançamentos"}/>
              <InsightCard icon={<Stethoscope size={16}/>} label="Serviço mais realizado" value={analytics.topService?.[0] || "Sem dados"} helper={analytics.topService ? `${analytics.topService[1]} ocorrência(s)` : "Sem lançamentos"}/>
            </div>
          </div>
          <ChartPanel title="Distribuição operacional" subtitle="Módulos com maior volume no período" items={analytics.moduleRanking.slice(0, 6)} emptyLabel="Nenhuma atividade registrada."/>
        </section>

        <section className="grid shrink-0 gap-3 lg:grid-cols-3">
          <RankingPanel title="Planos mais utilizados" icon={<WalletCards size={17}/>} items={analytics.planRanking.slice(0, 5)} emptyLabel="Nenhum plano registrado."/>
          <RankingPanel title="Exames mais realizados" icon={<FlaskConical size={17}/>} items={analytics.examRanking.slice(0, 5)} emptyLabel="Nenhum exame registrado."/>
          <RankingPanel title="Serviços mais realizados" icon={<Stethoscope size={17}/>} items={analytics.serviceRanking.slice(0, 5)} emptyLabel="Nenhum serviço registrado."/>
        </section>

        <section className="grid min-h-[560px] shrink-0 gap-3 xl:h-[560px] xl:grid-cols-[minmax(0,1fr)_350px]">
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[20px] border border-white/80 bg-white p-4 shadow-[0_12px_30px_rgba(79,42,21,0.06)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hpsr-border pb-3">
              <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-hpsr-wine text-white"><Activity size={19}/></span><div><h2 className="font-black text-hpsr-text">Atividades do sistema</h2><p className="text-xs text-hpsr-muted">Linha do tempo consolidada · até 150 registros</p></div></div>
              <label className="flex min-h-[40px] w-full min-w-0 items-center gap-2 rounded-[13px] border border-hpsr-border bg-[#fffaf4] px-3 sm:w-auto sm:min-w-[270px]"><Search size={16} className="text-hpsr-muted"/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Buscar atividade" className="w-full bg-transparent text-xs font-semibold outline-none"/></label>
            </div>
            <div className="mt-3 grid min-h-0 flex-1 content-start gap-2 overflow-y-auto overscroll-contain pr-2">
              {unified.slice(0,150).map((item)=><ActivityRow key={item.id} item={item}/>) }
              {!unified.length&&<div className="rounded-[15px] border border-dashed border-hpsr-border p-8 text-center text-sm text-hpsr-muted">Nenhuma atividade registrada.</div>}
            </div>
          </div>
          <aside className="grid h-full min-h-0 content-start gap-3 overflow-y-auto overscroll-contain pr-1">
            <Summary title="Solicitações de cadastro" icon={<UserPlus size={17}/>} items={staffRequests.map((item)=>`${item.name || "Profissional"} — ${item.status || "Pendente"}`)}/>
            <Summary title="Candidaturas" icon={<ClipboardCheck size={17}/>} items={applications.map((item)=>`${item.name || "Candidato"} — ${item.status || "Em análise"}`)}/>
            <Summary title="Governança" icon={<ShieldCheck size={17}/>} items={["Histórico centralizado no Supabase", "Solicitações públicas consolidadas", "Recibos vinculados ao Financeiro", "Registros compartilhados entre usuários autorizados"]}/>
          </aside>
        </section>
      </div>
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

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function Stat({icon,label,value}:{icon:React.ReactNode;label:string;value:string}) {
  return <div className="rounded-[17px] border border-white/80 bg-white px-3.5 py-3 shadow-[0_8px_22px_rgba(79,42,21,0.05)]">
    <div className="flex items-center justify-between gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-[11px] bg-[#fff1e5] text-hpsr-wine">{icon}</span><span className="truncate text-xl font-black text-hpsr-text">{value}</span></div>
    <p className="mt-2 truncate text-[9px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">{label}</p>
  </div>;
}

function InsightCard({ icon, label, value, helper }: { icon: React.ReactNode; label: string; value: string; helper: string }) {
  return <div className="min-h-[112px] bg-white p-4">
    <div className="flex items-center gap-2 text-hpsr-wine">{icon}<p className="text-[9px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">{label}</p></div>
    <p className="mt-3 line-clamp-2 text-base font-black leading-tight text-hpsr-text" title={value}>{value}</p>
    <p className="mt-1 text-xs font-semibold text-hpsr-muted">{helper}</p>
  </div>;
}

function MiniBarChart({ items, emptyLabel }: { items: Array<[string, number]>; emptyLabel: string }) {
  const max = items.length ? Math.max(...items.map(([, value]) => value), 1) : 1;
  if (!items.length) return <div className="rounded-[14px] border border-dashed border-hpsr-border p-5 text-center text-xs text-hpsr-muted">{emptyLabel}</div>;
  return <div className="grid gap-2.5">{items.map(([label, value], index) => <div key={`${label}-${index}`} className="grid gap-1">
    <div className="flex items-center justify-between gap-3 text-[11px]"><span className="min-w-0 truncate font-bold text-hpsr-text" title={label}>{label}</span><span className="shrink-0 rounded-full bg-[#fff1e5] px-2 py-0.5 font-black text-hpsr-wine">{value}</span></div>
    <div className="h-2 overflow-hidden rounded-full bg-[#f1e4d6]"><div className="h-full rounded-full bg-[linear-gradient(90deg,#6f2412,#9a4a2e)]" style={{ width: `${Math.max((value / max) * 100, 8)}%` }} /></div>
  </div>)}</div>;
}

function ChartPanel({ title, subtitle, items, emptyLabel }: { title: string; subtitle: string; items: Array<[string, number]>; emptyLabel: string }) {
  return <section className="rounded-[20px] border border-white/80 bg-white p-4 shadow-[0_12px_30px_rgba(79,42,21,0.06)]">
    <div className="mb-3 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-[13px] bg-hpsr-wine text-white"><BarChart3 size={17}/></span><div><h3 className="font-black text-hpsr-text">{title}</h3><p className="text-xs text-hpsr-muted">{subtitle}</p></div></div>
    <MiniBarChart items={items} emptyLabel={emptyLabel}/>
  </section>;
}

function RankingPanel({ title, icon, items, emptyLabel }: { title: string; icon: React.ReactNode; items: Array<[string, number]>; emptyLabel: string }) {
  return <section className="rounded-[20px] border border-white/80 bg-white p-4 shadow-[0_10px_26px_rgba(79,42,21,0.05)]">
    <div className="mb-3 flex items-center justify-between gap-2"><div className="flex items-center gap-2 text-hpsr-wine">{icon}<h3 className="text-sm font-black text-hpsr-text">{title}</h3></div><span className="text-[9px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">Top 5</span></div>
    <MiniBarChart items={items} emptyLabel={emptyLabel}/>
  </section>;
}

function ActivityRow({ item }: { item: SystemActivity }) {
  return <article className="grid gap-2 rounded-[14px] border border-hpsr-border bg-[#fffaf4] px-3 py-2.5 transition hover:border-[#c79b7d] sm:grid-cols-[128px_1fr_auto] sm:items-center">
    <div><p className="text-[9px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">{item.module}</p><p className="mt-1 text-[10px] text-hpsr-muted">{new Date(item.createdAt).getTime() ? new Date(item.createdAt).toLocaleString("pt-BR") : "Data não registrada"}</p></div>
    <div className="min-w-0"><p className="truncate text-xs font-black text-hpsr-text" title={item.action}>{item.action}</p><p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-hpsr-muted">{item.description}</p></div>
    {item.reference && <span className="max-w-[150px] truncate rounded-full border border-hpsr-border bg-white px-2.5 py-1 text-[9px] font-black text-hpsr-wine" title={item.reference}>{item.reference}</span>}
  </article>;
}

function Summary({title,icon,items}:{title:string;icon:React.ReactNode;items:string[]}) {
  return <section className="rounded-[18px] border border-white/80 bg-white p-3.5 shadow-[0_10px_26px_rgba(79,42,21,0.05)]">
    <div className="flex items-center justify-between gap-2 border-b border-hpsr-border pb-2.5"><div className="flex min-w-0 items-center gap-2 text-hpsr-wine">{icon}<h3 className="truncate text-sm font-black text-hpsr-text">{title}</h3></div><span className="shrink-0 rounded-full bg-[#fff1e5] px-2 py-0.5 text-[9px] font-black text-hpsr-wine">{items.length}</span></div>
    <div className="mt-2.5 grid content-start gap-1.5">{items.map((item,index)=><div key={`${item}-${index}`} className="min-h-[34px] rounded-[11px] border border-hpsr-border bg-[#fffaf4] px-3 py-2 text-[11px] font-semibold leading-[1.35] text-hpsr-muted" title={item}>{item}</div>)}{!items.length&&<p className="py-4 text-center text-xs text-hpsr-muted">Nenhum registro disponível.</p>}</div>
  </section>;
}

function ExportMenu({ onActivities, onTeam, onApplications }: { onActivities: () => void; onTeam: () => void; onApplications: () => void }) {
  return <details className="group relative">
    <summary className="flex min-h-[40px] cursor-pointer list-none items-center gap-2 rounded-[13px] border border-hpsr-border bg-white px-3 text-xs font-black text-hpsr-wine transition hover:bg-[#fff8f0]"><FileSpreadsheet size={15}/> Exportações CSV</summary>
    <div className="absolute right-0 z-30 mt-2 grid min-w-[205px] gap-1 rounded-[14px] border border-hpsr-border bg-white p-2 shadow-xl">
      <button type="button" onClick={onActivities} className="rounded-[10px] px-3 py-2 text-left text-xs font-bold text-hpsr-text hover:bg-[#fff8f0]">Atividades do sistema</button>
      <button type="button" onClick={onTeam} className="rounded-[10px] px-3 py-2 text-left text-xs font-bold text-hpsr-text hover:bg-[#fff8f0]">Equipe cadastrada</button>
      <button type="button" onClick={onApplications} className="rounded-[10px] px-3 py-2 text-left text-xs font-bold text-hpsr-text hover:bg-[#fff8f0]">Candidaturas</button>
    </div>
  </details>;
}
