"use client";

import { StyledSelect } from "@/components/ui/StyledSelect";
import { useEffect, useMemo, useState } from "react";
import { Activity, Clock3, Download, History, RefreshCw, ShieldCheck, Square, UsersRound } from "lucide-react";
import { createClient } from "@/lib/supabase";

type Entry = { id: string; user: string; openedAt: string; closedAt?: string | null; workedSeconds: number; status: string };
type Ranking = { position: number; userId: string; user: string; workedSeconds: number };
type Report = { monthStart: string; ranking: Ranking[]; totalUsers: number; totalWorkedSeconds: number; closedAt: string };
type Audit = { id: string; actor?: string; target?: string; action: string; reason?: string; createdAt: string };
type ReportData = { entries: Entry[]; reports: Report[]; audit: Audit[]; currentRanking: Ranking[] };
const emptyData: ReportData = { entries: [], reports: [], audit: [], currentRanking: [] };

export function TimeClockAdministrativeReport() {
  const [data, setData] = useState<ReportData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  async function load() {
    const client = createClient();
    if (!client) return;
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
      };
      setData(normalized);
      if (!selectedMonth && normalized.reports[0]) setSelectedMonth(normalized.reports[0].monthStart);
    }
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);
  const selectedReport = useMemo(() => data.reports.find((item) => item.monthStart === selectedMonth), [data.reports, selectedMonth]);
  const openEntries = useMemo(() => data.entries.filter((entry) => !entry.closedAt), [data.entries]);
  const closedEntries = useMemo(() => data.entries.filter((entry) => Boolean(entry.closedAt)), [data.entries]);

  async function setClosedAt(entry: Entry) {
    const initial = toLocalDateTimeInput(entry.closedAt || new Date().toISOString());
    const value = window.prompt(
      entry.closedAt ? "Novo horário de encerramento (AAAA-MM-DDTHH:mm):" : "Horário em que o ponto deve ser encerrado (AAAA-MM-DDTHH:mm):",
      initial,
    );
    if (!value) return;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) { setError("Horário de encerramento inválido."); return; }
    const client = createClient();
    if (!client) return;
    setLoading(true); setError("");
    const result = await client.rpc("admin_set_time_clock_closed_at", {
      p_entry_id: entry.id,
      p_closed_at: parsed.toISOString(),
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

  return <section className="space-y-4">
    <div className="rounded-[22px] border border-white/80 bg-white p-4 shadow-[0_12px_30px_rgba(79,42,21,0.06)] sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-hpsr-wine text-white"><Clock3 size={20}/></span>
          <div><p className="text-[10px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Controle de jornada</p><h2 className="font-black text-hpsr-text">Relatórios de ponto</h2><p className="text-xs text-hpsr-muted">Acompanhe pontos ativos, ranking mensal e registros encerrados.</p></div>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading} className="flex min-h-10 items-center gap-2 rounded-[13px] border border-hpsr-border bg-white px-3 text-xs font-black text-hpsr-wine disabled:opacity-60"><RefreshCw size={15} className={loading ? "animate-spin" : ""}/> Atualizar</button>
      </div>
      {error && <p className="mt-3 rounded-[13px] bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{error}</p>}
    </div>

    <div className="rounded-[22px] border border-red-100 bg-white p-4 shadow-[0_12px_30px_rgba(79,42,21,0.05)] sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-red-50 text-red-700"><Activity size={18}/></span><div><h3 className="text-sm font-black text-hpsr-text">Pontos em aberto</h3><p className="text-xs text-hpsr-muted">Profissionais que ainda estão em serviço ou com jornada não finalizada.</p></div></div>
        <span className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-black text-red-700">{openEntries.length} em aberto</span>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {openEntries.map((entry) => <div key={entry.id} className="rounded-[16px] border border-red-100 bg-[#fffafa] p-4">
          <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black text-hpsr-text">{entry.user}</p><p className="mt-1 text-xs font-semibold text-hpsr-muted">Entrada: {formatDateTime(entry.openedAt)}</p><p className="mt-1 text-xs font-semibold text-hpsr-muted">Situação: {entry.status}</p></div><span className="rounded-[11px] bg-white px-3 py-2 text-sm font-black tabular-nums text-hpsr-wine shadow-sm">{formatDuration(entry.workedSeconds)}</span></div>
          <button type="button" onClick={() => void setClosedAt(entry)} disabled={loading} className="mt-4 flex min-h-10 w-full items-center justify-center gap-2 rounded-[12px] bg-red-700 px-3 text-xs font-black text-white disabled:opacity-50"><Square size={13}/> Encerrar ponto</button>
        </div>)}
        {!openEntries.length && <div className="lg:col-span-2"><Empty text="Nenhum ponto aberto no momento."/></div>}
      </div>
    </div>

    <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
      <div className="rounded-[22px] border border-hpsr-border bg-white p-4 shadow-[0_12px_30px_rgba(79,42,21,0.05)] sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#fff2e8] text-hpsr-wine"><UsersRound size={18}/></span><div><h3 className="text-sm font-black text-hpsr-text">Ranking do mês atual</h3><p className="text-xs text-hpsr-muted">Todos os profissionais aprovados aparecem, inclusive com 0h.</p></div></div><span className="text-[10px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">Pontos encerrados</span></div>
        <RankingList ranking={data.currentRanking}/>
      </div>
      <div className="rounded-[22px] border border-hpsr-border bg-white p-4 shadow-[0_12px_30px_rgba(79,42,21,0.05)] sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><History size={17} className="text-hpsr-wine"/><div><h3 className="text-sm font-black text-hpsr-text">Rankings arquivados</h3><p className="text-xs text-hpsr-muted">Meses já encerrados.</p></div></div><div className="flex min-w-[220px] gap-2"><StyledSelect value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}><option value="">Nenhum mês fechado</option>{data.reports.map((item) => <option key={item.monthStart} value={item.monthStart}>{formatMonth(item.monthStart)}</option>)}</StyledSelect><button onClick={exportReport} disabled={!selectedReport} className="rounded-[12px] border border-hpsr-border bg-white p-2.5 text-hpsr-wine disabled:opacity-40" title="Exportar ranking"><Download size={16}/></button></div></div>
        {selectedReport ? <RankingList ranking={selectedReport.ranking}/> : <Empty text="Nenhum ranking mensal arquivado."/>}
      </div>
    </div>

    <div className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
      <div className="rounded-[22px] border border-hpsr-border bg-white p-4 shadow-[0_12px_30px_rgba(79,42,21,0.05)] sm:p-5"><h3 className="mb-3 text-sm font-black text-hpsr-text">Pontos encerrados recentemente</h3><div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">{closedEntries.map((entry) => <div key={entry.id} className="grid gap-2 rounded-[14px] border border-hpsr-border bg-[#fffaf4] px-3 py-3 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="text-xs font-black text-hpsr-text">{entry.user}</p><p className="mt-1 text-[11px] text-hpsr-muted">Entrada {formatDateTime(entry.openedAt)} · encerramento {formatDateTime(entry.closedAt)}</p></div><div className="flex items-center gap-2"><span className="text-xs font-black tabular-nums text-hpsr-wine">{formatDuration(entry.workedSeconds)}</span><button type="button" onClick={() => void setClosedAt(entry)} disabled={loading} className="rounded-[9px] border border-hpsr-border bg-white px-2 py-1.5 text-[10px] font-black text-hpsr-wine disabled:opacity-50">Editar encerramento</button></div></div>)}{!closedEntries.length && <Empty text="Nenhum ponto encerrado."/>}</div></div>
      <div className="rounded-[22px] border border-hpsr-border bg-white p-4 shadow-[0_12px_30px_rgba(79,42,21,0.05)] sm:p-5"><div className="mb-3 flex items-center gap-2"><ShieldCheck size={16} className="text-hpsr-wine"/><h3 className="text-sm font-black text-hpsr-text">Auditoria administrativa</h3></div><div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">{data.audit.map((item) => <div key={item.id} className="rounded-[12px] border border-hpsr-border bg-[#fffaf4] px-3 py-2.5"><p className="text-xs font-black text-hpsr-text">{item.action}</p><p className="mt-1 text-[11px] text-hpsr-muted">{item.actor || "Administrador"} · {item.target || "Profissional"}</p>{item.reason && <p className="mt-1 text-[11px] text-hpsr-muted">{item.reason}</p>}</div>)}{!data.audit.length && <Empty text="Nenhuma intervenção administrativa registrada."/>}</div></div>
    </div>
  </section>;
}

function RankingList({ ranking }: { ranking: Ranking[] }) { return <div className="max-h-64 space-y-2 overflow-y-auto pr-1">{ranking.map((row) => <div key={row.userId} className="grid grid-cols-[42px_1fr_auto] items-center gap-2 rounded-[12px] border border-hpsr-border bg-white px-3 py-2.5"><span className="text-sm font-black text-hpsr-wine">{row.position}º</span><span className="truncate text-xs font-black text-hpsr-text">{row.user}</span><span className="text-xs font-black tabular-nums text-hpsr-wine">{formatDuration(row.workedSeconds)}</span></div>)}{!ranking.length && <Empty text="Nenhuma hora encerrada neste período."/>}</div>; }
function Empty({ text }: { text: string }) { return <p className="rounded-[12px] border border-dashed border-hpsr-border px-3 py-5 text-center text-xs text-hpsr-muted">{text}</p>; }
function normalizeNumbers(item: any) { return { ...item, position: Number(item.position || 0), workedSeconds: Number(item.workedSeconds || 0) }; }
function formatDuration(seconds: number) { const safe = Math.max(0, Math.floor(seconds || 0)); const h = Math.floor(safe / 3600); const m = Math.floor((safe % 3600) / 60); return `${h}h ${String(m).padStart(2, "0")}min`; }
function toLocalDateTimeInput(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}
function formatDateTime(value?: string | null) { return value ? new Date(value).toLocaleString("pt-BR") : "—"; }
function formatMonth(value: string) { const [year, month] = value.slice(0, 7).split("-").map(Number); return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1)); }

