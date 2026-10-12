"use client";

import styles from "./time-clock-report.module.css";

import { brazilDateTimeInput, brazilIso } from "@/lib/brazil-datetime";

import { CorrectTimeClockModal, parsePointDateTime } from "@/components/dashboard/CorrectTimeClockModal";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { useEffect, useMemo, useState } from "react";
import { Activity, BarChart3, Clock3, Eye, Pencil, Search, List, Download, History, RefreshCw, ShieldCheck, Square, UsersRound } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { hpsrPrompt } from "@/components/ui/HpsrDialogProvider";

type Entry = { id: string; userId: string; user: string; openedAt: string; closedAt?: string | null; workedSeconds: number; status: string };
type Ranking = { position: number; userId: string; user: string; workedSeconds: number };
type Report = { monthStart: string; ranking: Ranking[]; totalUsers: number; totalWorkedSeconds: number; closedAt: string };
type Audit = { id: string; actor?: string; target?: string; action: string; reason?: string; createdAt: string };
type ReportData = { entries: Entry[]; reports: Report[]; audit: Audit[]; currentRanking: Ranking[]; activeStaff: {userId:string;user:string}[]; serverNow?: string };
const emptyData: ReportData = { entries: [], reports: [], audit: [], currentRanking: [], activeStaff: [], serverNow: undefined };

export function TimeClockAdministrativeReport() {
  const [data, setData] = useState<ReportData>(emptyData);
  const [correction, setCorrection] = useState<{ userId: string; id: string } | null | undefined>(undefined);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [closedSearch, setClosedSearch] = useState("");
  const [showAllClosed, setShowAllClosed] = useState(false);
  const [showAllAudit, setShowAllAudit] = useState(false);
  const [consultedMonth, setConsultedMonth] = useState("");
  const [detail, setDetail] = useState<Entry | null>(null);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [liveAnchorMs, setLiveAnchorMs] = useState(() => Date.now());
  const [liveNowMs, setLiveNowMs] = useState(() => Date.now());

  async function load() {
    const client = createClient();
    if (!client) { setError("Conexão indisponível. Tente novamente."); setLoading(false); return; }
    setLoading(true); setError("");
    const result = await client.rpc("get_time_clock_admin_report");
    if (result.error) setError("Não foi possível carregar os relatórios de ponto. Aplique a migration mais recente.");
    else {
      const raw = result.data || {};
      const normalized: ReportData = {
        entries: Array.isArray(raw.entries) ? raw.entries.map(normalizeNumbers) : [],
        reports: Array.isArray(raw.reports) ? raw.reports.map((item: any) => ({ ...item, totalUsers: Number(item.totalUsers || 0), totalWorkedSeconds: Number(item.totalWorkedSeconds || 0), ranking: Array.isArray(item.ranking) ? item.ranking.map(normalizeNumbers) : [] })) : [],
        audit: Array.isArray(raw.audit) ? raw.audit : [],
        currentRanking: Array.isArray(raw.currentRanking) ? raw.currentRanking.map(normalizeNumbers) : [],
        activeStaff: Array.isArray(raw.activeStaff) ? raw.activeStaff : [],
        serverNow: typeof raw.serverNow === "string" ? raw.serverNow : undefined,
      };
      const receivedAt = Date.now();
      setLiveAnchorMs(receivedAt);
      setLiveNowMs(receivedAt);
      setData(normalized);
      if (!selectedMonth && normalized.reports[0]) setSelectedMonth(normalized.reports[0].monthStart);
    }
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);
  useEffect(() => {
    const timer = window.setInterval(() => setLiveNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const selectedReport = useMemo(() => data.reports.find((item) => item.monthStart === consultedMonth), [data.reports, consultedMonth]);
  const openEntries = useMemo(() => data.entries.filter((entry) => !entry.closedAt), [data.entries]);
  const closedEntries = useMemo(() => data.entries.filter((entry) => Boolean(entry.closedAt)), [data.entries]);
  const liveElapsedSeconds = Math.max(0, Math.floor((liveNowMs - liveAnchorMs) / 1000));
  const liveSecondsForEntry = (entry: Entry) => entry.workedSeconds + (!entry.closedAt && entry.status === "Em serviço" ? liveElapsedSeconds : 0);
  const activeUserIds = useMemo(() => new Set(data.entries.filter((entry) => !entry.closedAt && entry.status === "Em serviço").map((entry) => entry.userId)), [data.entries]);
  const liveCurrentRanking = useMemo(() => data.currentRanking
    .map((row) => ({ ...row, workedSeconds: row.workedSeconds + (activeUserIds.has(row.userId) ? liveElapsedSeconds : 0) }))
    .sort((a, b) => b.workedSeconds - a.workedSeconds || a.user.localeCompare(b.user, "pt-BR"))
    .map((row, index) => ({ ...row, position: index + 1 })), [data.currentRanking, activeUserIds, liveElapsedSeconds]);

  async function setClosedAt(entry: Entry) {
    const initial = toLocalDateTimeInput(entry.closedAt || brazilIso());
    const value = await hpsrPrompt(
      entry.closedAt ? "Novo horário de encerramento (AAAA-MM-DDTHH:mm):" : "Horário em que o ponto deve ser encerrado (AAAA-MM-DDTHH:mm):",
      initial,
      "Ajustar encerramento do ponto"
    );
    if (!value) return;
    const parsed = new Date(parsePointDateTime(value));
    if (Number.isNaN(parsed.getTime())) { setError("Horário de encerramento inválido."); return; }
    const client = createClient();
    if (!client) return;
    setLoading(true); setError("");
    const result = await client.rpc("admin_set_time_clock_closed_at", {
      p_entry_id: entry.id,
      p_closed_at: brazilIso(parsed),
    });
    if (result.error) setError(result.error.message || "Não foi possível atualizar o encerramento do ponto.");
    else await load();
    setLoading(false);
  }

  function exportReport() {
    if (!selectedReport) return;
    const rows = [["Posição", "Usuário", "Horas efetivamente trabalhadas"], ...selectedReport.ranking.map((row) => [String(row.position), row.user, formatDuration(row.workedSeconds)])];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `ranking-ponto-${selectedReport.monthStart}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  const correctionStaff = data.activeStaff;

  const filteredClosed = closedEntries.filter(entry => entry.user.toLocaleLowerCase("pt-BR").includes(closedSearch.trim().toLocaleLowerCase("pt-BR")));
  return <section className={styles.report}>
    {correction !== undefined && <CorrectTimeClockModal staff={correctionStaff} initial={correction || undefined} onClose={() => setCorrection(undefined)} onSaved={async () => { setNotice("Correção salva. Todos os períodos foram registrados."); try { await load(); } catch { setError("A correção foi salva, mas não foi possível recarregar a lista. Clique em Atualizar."); setLoading(false); } }} />}
    {detail && <PointDetails entry={detail} onClose={()=>setDetail(null)} onCorrect={()=>{setCorrection({userId:detail.userId,id:detail.id});setDetail(null);}}/>}
    {notice && <p role="status" className={styles.notice}>{notice}</p>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <div className={styles.topGrid}>
      <div className={styles.panel}>
        <div className={styles.header}><span className={styles.icon}><Clock3 size={24}/></span><div><h2>Pontos abertos</h2><p>{loading ? "Carregando registros..." : `${openEntries.length} registros em andamento`}</p></div><div className={styles.actions}><button title="Atualizar pontos" aria-label="Atualizar pontos" disabled={loading} onClick={()=>void load()}><RefreshCw size={16} className={loading ? "animate-spin" : ""}/></button><button disabled={loading} onClick={()=>{setNotice("");setCorrection(null);}}><Pencil size={16}/>Corrigir ponto</button></div></div>
        <div className={styles.tableScroll}><table><thead><tr><th>Médico</th><th>Entrada</th><th>Tempo em serviço</th><th>Status</th><th>Ação</th></tr></thead><tbody>{openEntries.map(entry=><tr key={entry.id}><td><Person name={entry.user}/></td><td>{formatDateTime(entry.openedAt)}</td><td className={styles.duration}>{formatDuration(liveSecondsForEntry(entry))}</td><td><span className={styles.status} data-active={entry.status === "Em serviço"}>{entry.status}</span></td><td><button disabled={loading} onClick={()=>void setClosedAt(entry)}><Square size={12}/>Encerrar ponto</button></td></tr>)}{!openEntries.length && <tr><td colSpan={5}><Empty text={loading ? "Carregando pontos..." : "Nenhum ponto aberto no momento."}/></td></tr>}</tbody></table></div>
      </div>
      <div className={styles.panel}>
        <div className={styles.header}><BarChart3 size={27}/><div><h2>Ranking do mês</h2><p>{new Intl.DateTimeFormat("pt-BR",{month:"long",year:"numeric",timeZone:"America/Sao_Paulo"}).format(new Date(liveNowMs))} · ao vivo</p></div></div>
        <RankingList ranking={liveCurrentRanking}/>
        <div className={styles.archive}><h3><History size={17}/>Rankings arquivados</h3><div className={styles.archiveControls}><StyledSelect value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)}><option value="">Selecionar mês</option>{data.reports.map(item=><option key={item.monthStart} value={item.monthStart}>{formatMonth(item.monthStart)}</option>)}</StyledSelect><button disabled={!selectedMonth} onClick={()=>setConsultedMonth(selectedMonth)}><Search size={16}/>Consultar</button></div>{selectedReport && <><div className={styles.archiveTitle}><strong>{formatMonth(selectedReport.monthStart)}</strong><button onClick={exportReport}><Download size={15}/>Exportar ranking</button></div><RankingList ranking={selectedReport.ranking}/></>}{!data.reports.length && <p className={styles.archiveEmpty}>Nenhum ranking mensal arquivado.</p>}</div>
      </div>
    </div>
    <div className={styles.panel}>
      <div className={styles.header}><span className={styles.icon}><Clock3 size={24}/></span><div><h2>Pontos encerrados recentemente</h2><p>Últimos registros finalizados no sistema</p></div><div className={styles.actions}><label className={styles.search}><Search size={17}/><input aria-label="Buscar médico nos pontos encerrados" value={closedSearch} onChange={e=>setClosedSearch(e.target.value)} placeholder="Buscar médico..."/></label><button aria-expanded={showAllClosed} onClick={()=>setShowAllClosed(!showAllClosed)}><List size={16}/>{showAllClosed ? "Ver recentes" : "Ver todos"}</button></div></div>
      <div className={styles.tableScroll}><table><thead><tr><th>Médico</th><th>Entrada</th><th>Saída</th><th>Duração</th><th>Detalhes</th><th>Correção</th></tr></thead><tbody>{filteredClosed.slice(0,showAllClosed ? undefined : 5).map(entry=><tr key={entry.id}><td><Person name={entry.user}/></td><td>{formatDateTime(entry.openedAt)}</td><td>{formatDateTime(entry.closedAt)}</td><td className={styles.duration}>{formatDuration(entry.workedSeconds)}</td><td><button onClick={()=>setDetail(entry)}><Eye size={15}/>Ver detalhes</button></td><td><button disabled={loading} onClick={()=>{setNotice("");setCorrection({userId:entry.userId,id:entry.id});}}><Pencil size={14}/>Corrigir ponto</button></td></tr>)}{!filteredClosed.length && <tr><td colSpan={6}><Empty text="Nenhum ponto encerrado encontrado."/></td></tr>}</tbody></table></div>
    </div>
    <div className={styles.panel}>
      <div className={styles.header}><span className={styles.icon}><ShieldCheck size={24}/></span><div><h2>Auditoria do sistema</h2><p>Histórico de alterações nos registros de ponto</p></div><button className={styles.headerButton} aria-expanded={showAllAudit} onClick={()=>setShowAllAudit(!showAllAudit)}><List size={16}/>{showAllAudit ? "Ver recentes" : "Ver auditoria completa"}</button></div>
      <div className={styles.tableScroll}><table><thead><tr><th>Data e hora</th><th>Responsável</th><th>Ação</th><th>Médico vinculado</th><th>Motivo</th></tr></thead><tbody>{data.audit.slice(0,showAllAudit ? undefined : 5).map(item=><tr key={item.id}><td>{formatDateTime(item.createdAt)}</td><td><Person name={item.actor || "Administrador"}/></td><td>{item.action}</td><td><Person name={item.target || "Profissional"}/></td><td className={styles.reason}>{item.reason || "—"}</td></tr>)}{!data.audit.length && <tr><td colSpan={5}><Empty text="Nenhuma intervenção administrativa registrada."/></td></tr>}</tbody></table></div>
    </div>
  </section>;
}

function Person({name}:{name:string}) { return <span className={styles.person}><UsersRound size={16}/>{name}</span>; }
function PointDetails({entry,onClose,onCorrect}:{entry:Entry;onClose:()=>void;onCorrect:()=>void}) {
 const [element,setElement]=useState<HTMLDialogElement|null>(null);
 useEffect(()=>{if(element && !element.open)element.showModal();},[element]);
 return <dialog ref={setElement} onCancel={onClose} className={`hpsr-modal-tone ${styles.dialog}`}><h2>Detalhes do ponto</h2><dl>{[["Médico",entry.user],["Entrada",formatDateTime(entry.openedAt)],["Saída",formatDateTime(entry.closedAt)],["Tempo contabilizado",formatDuration(entry.workedSeconds)],["Status",entry.status]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><div className={styles.actions}><button onClick={onCorrect}><Pencil size={15}/>Corrigir ponto</button><button autoFocus onClick={onClose}>Fechar</button></div></dialog>;
}

function RankingList({ ranking }: { ranking: Ranking[] }) { return <div className={styles.ranking}>{ranking.map(row=><div key={row.userId}><span className={styles.position} data-position={row.position}>{row.position}</span><Person name={row.user}/><strong>{formatDuration(row.workedSeconds)}</strong></div>)}{!ranking.length && <Empty text="Nenhuma hora contabilizada neste período."/>}</div>; }
function Empty({ text }: { text: string }) { return <p className={styles.empty}>{text}</p>; }
function normalizeNumbers(item: any) { return { ...item, position: Number(item.position || 0), workedSeconds: Number(item.workedSeconds || 0) }; }
function formatDuration(seconds: number) { const safe = Math.max(0, Math.floor(seconds || 0)); const h = Math.floor(safe / 3600); const m = Math.floor((safe % 3600) / 60); return `${h}h ${String(m).padStart(2, "0")}min`; }
function toLocalDateTimeInput(value: string) {
  const date = new Date(value);
  return brazilDateTimeInput(date);
}
function formatDateTime(value?: string | null) { return value ? new Date(value).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—"; }
function formatMonth(value: string) { const [year, month] = value.slice(0, 7).split("-").map(Number); return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1)); }

