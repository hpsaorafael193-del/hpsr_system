"use client";

import { useMemo, useState } from "react";
import { History, Search, X } from "lucide-react";

type ApplicationHistoryItem = {
  protocol?: string;
  id?: string;
  name?: string;
  passport?: string;
  desiredRole?: string;
  desired_role?: string;
  status?: string;
  triageDecision?: string;
  interviewStatus?: string;
  interviewResult?: string;
  createdAt?: string;
  created_at?: string;
};

export function ApplicationHistoryModal({ items, onClose, onOpenAnalysis }: { items: ApplicationHistoryItem[]; onClose: () => void; onOpenAnalysis?: (item: ApplicationHistoryItem) => void }) {
  const [search, setSearch] = useState("");
  const visibleItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    if (!query) return items;
    return items.filter((item) => [item.name, item.passport, item.desiredRole, item.desired_role, item.status, item.triageDecision, item.interviewStatus, item.interviewResult]
      .join(" ").toLocaleLowerCase("pt-BR").includes(query));
  }, [items, search]);

  return (
    <div className="fixed inset-0 z-[100002] grid min-h-dvh place-items-center overflow-hidden px-4 py-3">
      <button type="button" aria-label="Fechar histórico" onClick={onClose} className="fixed inset-0 bg-[#1f0805]/68" />
      <div className="hpsr-modal-motion relative z-10 flex max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-[20px] border border-white/50 bg-[#fcf6ee] shadow-[0_32px_100px_rgba(27,10,7,.42)]">
        <div className="border-b border-hpsr-border bg-[linear-gradient(135deg,#fffaf4_0%,#f5e7d8_100%)] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="text-[10px] font-black uppercase tracking-[.16em] text-hpsr-wineLight">Gestão de candidaturas</p><h2 className="mt-1 text-lg font-black text-hpsr-text">Candidatos</h2><p className="mt-1 text-xs text-hpsr-muted">Consulte todos os formulários, acompanhe as etapas e abra a análise quando necessário.</p></div>
            <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-[14px] border border-hpsr-border bg-white text-hpsr-wine"><X size={18}/></button>
          </div>
          <label className="mt-3 flex min-h-[40px] items-center gap-2 rounded-[13px] border border-hpsr-border bg-white px-3"><Search size={15} className="text-hpsr-muted"/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, passaporte ou status" className="w-full bg-transparent text-xs font-semibold outline-none"/></label>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3.5">
          <div className="grid gap-2">
            {visibleItems.map((item, index) => {
              const role = item.desiredRole || item.desired_role || "Cargo não informado";
              const createdAt = item.createdAt || item.created_at;
              return <article key={item.protocol || item.id || `${item.passport}-${index}`} className="rounded-[15px] border border-hpsr-border bg-white p-3">
                <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-sm font-black text-hpsr-text">{item.name || "Candidato"}</p><p className="mt-1 text-xs font-semibold text-hpsr-muted">Passaporte: {item.passport || "Não informado"} · {role}</p></div><span className="rounded-full bg-[#fff1e5] px-2.5 py-1 text-[10px] font-black text-hpsr-wine">{item.status || "Em análise"}</span></div>
                <div className="mt-2 grid gap-1 text-[11px] text-hpsr-muted sm:grid-cols-3"><span>Triagem: <strong>{item.triageDecision || "Pendente"}</strong></span><span>Entrevista: <strong>{item.interviewStatus || "Não agendada"}</strong></span><span>Resultado: <strong>{item.interviewResult || "Pendente"}</strong></span></div>
                {createdAt && <p className="mt-2 text-[10px] text-hpsr-muted">Enviado em {new Date(createdAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p>}
                {onOpenAnalysis && <button type="button" onClick={() => onOpenAnalysis(item)} className="mt-3 rounded-[12px] border border-hpsr-border bg-[#fff8f0] px-3 py-2 text-xs font-black text-hpsr-wine">Ver informações</button>}
              </article>;
            })}
            {!visibleItems.length && <div className="rounded-[15px] border border-dashed border-hpsr-border bg-white p-8 text-center text-sm text-hpsr-muted"><History size={22} className="mx-auto mb-2"/>Nenhum formulário encontrado.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
