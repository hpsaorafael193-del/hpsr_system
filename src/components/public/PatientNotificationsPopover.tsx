"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, CalendarClock, FileCheck2, RefreshCcw, X } from "lucide-react";

type Notice = { id: string; passport: string; kind: string; title: string; description: string; at: string; section: "home" | "appointments" | "pending" | "exam-request" | "records" | "vaccination" | "accompaniment" };
type Profile = { passport: string; name: string };

export function PatientNotificationsPopover({ accountId, profiles, pending, onNavigate, onSessionExpired }: {
  accountId: string;
  profiles: Profile[];
  pending: Profile[];
  onNavigate: (passport: string, section: Notice["section"]) => void;
  onSessionExpired: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [read, setRead] = useState<string[]>([]);
  const [error, setError] = useState("");
  const expiredRef = useRef(onSessionExpired);
  useEffect(() => { expiredRef.current = onSessionExpired; }, [onSessionExpired]);
  const inflightRef = useRef<Promise<void> | null>(null);
  const lastRefreshRef = useRef(0);
  const accountGenerationRef = useRef(0);
  const storageKey = `hpsr-portal-notice-read:${accountId}`;
  const allNames = useMemo(() => new Map([...profiles, ...pending].map((p) => [p.passport, p.name])), [profiles, pending]);
  const profileSignature = [...profiles.map((p) => `active:${p.passport}`), ...pending.map((p) => `pending:${p.passport}`)].sort().join("|");
  useEffect(() => {
    // Nenhum aviso da conta anterior deve aparecer durante outra autenticação.
    accountGenerationRef.current += 1;
    setNotices([]);
    setOpen(false);
    inflightRef.current = null;
    lastRefreshRef.current = 0;
    try { const saved = window.localStorage.getItem(storageKey); setRead(saved ? JSON.parse(saved) : []); }
    catch { setRead([]); }
  }, [storageKey]);
  const refresh = useCallback((force = false): Promise<void> => {
    if (inflightRef.current) return inflightRef.current;
    if (!force && Date.now() - lastRefreshRef.current < 45000) return Promise.resolve();
    const generation = accountGenerationRef.current;
    const request = (async () => { try {
      const response = await fetch("/api/paciente/notificacoes", { cache: "no-store" });
      if (generation !== accountGenerationRef.current) return;
      if (response.status === 401) { expiredRef.current(); return; }
      const data = await response.json();
      if (generation !== accountGenerationRef.current) return;
      if (!response.ok) throw new Error(data.error || "Não foi possível carregar os avisos.");
      const list = (data.notices || []) as Notice[];
      setNotices(list);
      lastRefreshRef.current = Date.now();
      setError("");
      // No primeiro acesso, eventos antigos não devem provocar um alerta artificial.
      const initializedKey = `${storageKey}:initialized`;
      try {
        if (!window.localStorage.getItem(initializedKey)) {
          const old = list.filter((n) => Date.now() - new Date(n.at).getTime() > 86400000).map((n) => n.id);
          const existing = JSON.parse(window.localStorage.getItem(storageKey) || "[]") as string[];
          const initial = Array.from(new Set([...existing, ...old]));
          window.localStorage.setItem(storageKey, JSON.stringify(initial.slice(-500)));
          window.localStorage.setItem(initializedKey, "1");
          setRead(initial);
        }
      } catch { /* Armazenamento indisponível: avisos permanecem acessíveis. */ }
    } catch (caught) { if (generation === accountGenerationRef.current) setError(caught instanceof Error ? caught.message : "Falha ao consultar avisos."); } })();
    inflightRef.current = request;
    void request.finally(() => { if (inflightRef.current === request) inflightRef.current = null; });
    return request;
  }, [storageKey]);
  useEffect(() => {
    void refresh();
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    const interval = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 120000);
    document.addEventListener("visibilitychange", onVisible);
    return () => { window.clearInterval(interval); document.removeEventListener("visibilitychange", onVisible); };
  }, [refresh, profileSignature]);
  const unread = notices.filter((notice) => !read.includes(notice.id)).length;
  const markRead = (ids: string[]) => {
    const next = Array.from(new Set([...read, ...ids])).slice(-500);
    setRead(next);
    try { window.localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
  };
  return <div className="relative shrink-0">
    <button type="button" onClick={() => { setOpen((old) => !old); if (!open) void refresh(true); }}
      aria-label={`Notificações${unread ? `, ${unread} não lidas` : ""}`} aria-expanded={open}
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-[12px] border border-[#d4c0ae] bg-[#f5ede5] text-hpsr-wine shadow-[0_3px_10px_rgba(73,47,34,.045)] transition hover:bg-[#eee1d5]">
      <Bell size={19}/>
      {unread > 0 && <span className="absolute right-1.5 top-1.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-[#672614] px-1 text-[9px] font-black text-white">{unread > 9 ? "9+" : unread}</span>}
    </button>
    {open && <><button className="fixed inset-0 z-[1040] cursor-default" aria-label="Fechar notificações" onClick={() => setOpen(false)}/>
      <section className="fixed left-3 right-3 top-20 z-[1050] max-h-[min(74dvh,520px)] overflow-y-auto rounded-[20px] border border-hpsr-border bg-[#f1e6db] p-3 shadow-[0_20px_65px_rgba(82,48,27,.23)] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[390px]" aria-label="Central de notificações">
        <div className="flex items-center justify-between gap-2 border-b border-hpsr-border pb-2">
          <strong className="text-sm text-hpsr-text">Avisos dos seus perfis</strong>
          <div className="flex gap-1">
            <button type="button" onClick={() => void refresh(true)} aria-label="Atualizar avisos" className="rounded-lg p-2 text-hpsr-wine"><RefreshCcw size={16}/></button>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fechar" className="rounded-lg p-2 text-hpsr-wine"><X size={17}/></button>
          </div>
        </div>
        {error && <p role="alert" className="mt-2 text-xs font-semibold text-rose-700">{error}</p>}
        {!notices.length && !error && <p className="py-5 text-center text-sm text-hpsr-muted">Nenhuma atualização recente.</p>}
        <div className="mt-2 space-y-1.5">
          {notices.map((notice) => <button key={notice.id} type="button"
            onClick={() => { markRead([notice.id]); onNavigate(notice.passport, notice.section); setOpen(false); }}
            className={`flex w-full items-start gap-2 rounded-xl border p-3 text-left ${read.includes(notice.id) ? "border-[#ddc8b5] bg-[#f8f0e8]" : "border-hpsr-wine/25 bg-[#e9d8c9]"}`}>
            {notice.kind === "exam" || notice.kind === "document" ? <FileCheck2 size={18} className="mt-1 shrink-0 text-hpsr-wine"/> : <CalendarClock size={18} className="mt-1 shrink-0 text-hpsr-wine"/>}
            <span className="min-w-0 flex-1">
              <strong className="block text-xs text-hpsr-wine">{allNames.get(notice.passport) || "Dependente"} · {notice.title}</strong>
              <span className="mt-1 block text-xs text-hpsr-muted">{notice.description}</span>
              {notice.at && !Number.isNaN(new Date(notice.at).getTime()) && <span className="mt-1 block text-[10px] text-hpsr-muted">{new Date(notice.at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" })}</span>}
            </span>
            {!read.includes(notice.id) && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-hpsr-wine"/>}
          </button>)}
        </div>
        {unread > 0 && <button type="button" onClick={() => markRead(notices.map((n) => n.id))}
          className="mt-3 w-full rounded-xl border border-hpsr-border bg-white px-3 py-2 text-xs font-black text-hpsr-wine">Marcar todas como lidas</button>}
        <p className="mt-2 text-[10px] text-hpsr-muted">A leitura dos avisos fica salva neste dispositivo.</p>
      </section></>}
  </div>;
}
