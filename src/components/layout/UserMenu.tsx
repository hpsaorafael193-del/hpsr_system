"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ChevronDown, Circle, LogOut, Pause, Play, RotateCcw, Square, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCurrentUserProfile } from "@/components/auth/CurrentUserProfileProvider";
import { createClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { clearLoginPersistence } from "@/lib/auth-persistence";

type ClockStatus = "Fora de serviço" | "Em serviço" | "Em pausa";
type ClockHistory = { id: string; openedAt: string; closedAt: string; workedSeconds: number; status: string };
type RankingRow = { position: number; userId: string; user: string; workedSeconds: number };
type ClockState = {
  status: ClockStatus;
  entryId?: string | null;
  openedAt?: string | null;
  pauseStartedAt?: string | null;
  returnedAt?: string | null;
  workedSeconds: number;
  history: ClockHistory[];
  ranking: RankingRow[];
};

const emptyClock: ClockState = { status: "Fora de serviço", workedSeconds: 0, history: [], ranking: [] };

export function UserMenu() {
  const { profile: currentUserProfile, refreshProfile } = useCurrentUserProfile();
  const [open, setOpen] = useState(false);
  const [clock, setClock] = useState<ClockState>(emptyClock);
  const [loadingClock, setLoadingClock] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(() => Date.now());
  const [clockLoadedAt, setClockLoadedAt] = useState(() => Date.now());
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const loadClock = useCallback(async () => {
    const client = createClient();
    if (!client) {
      setClock((current) => ({ ...current, status: currentUserProfile.serviceStatus as ClockStatus }));
      return;
    }
    setLoadingClock(true);
    const { data, error: requestError } = await client.rpc("get_my_time_clock_state");
    if (!requestError && data) { setClock(normalizeClock(data)); setClockLoadedAt(Date.now()); setTick(Date.now()); }
    else if (requestError) setError("Não foi possível consultar o ponto. Aplique a migration mais recente.");
    setLoadingClock(false);
  }, [currentUserProfile.serviceStatus]);

  useEffect(() => {
    void loadClock();
  }, [loadClock]);

  useEffect(() => {
    if (clock.status === "Fora de serviço") return;
    let interval: number | null = null;
    const syncTimer = () => {
      if (interval !== null) window.clearInterval(interval);
      interval = null;
      if (document.visibilityState !== "visible") return;
      setTick(Date.now());
      interval = window.setInterval(() => setTick(Date.now()), 1000);
    };
    syncTimer();
    document.addEventListener("visibilitychange", syncTimer);
    return () => {
      document.removeEventListener("visibilitychange", syncTimer);
      if (interval !== null) window.clearInterval(interval);
    };
  }, [clock.status]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function handleAction(action: "enter" | "pause" | "return" | "finish") {
    if (actionLoading) return;
    if (action === "finish" && clock.status === "Em pausa") {
      const confirmed = window.confirm("O ponto está em pausa. Deseja encerrar a pausa e finalizar o ponto agora?");
      if (!confirmed) return;
    }
    const client = createClient();
    if (!client) return;
    setActionLoading(true);
    setError("");
    const { data, error: requestError } = await client.rpc("time_clock_action", { p_action: action });
    if (requestError) setError(requestError.message || "Não foi possível registrar a ação.");
    else if (data) {
      setClock(normalizeClock(data));
      setClockLoadedAt(Date.now());
      setTick(Date.now());
      await refreshProfile();
    }
    setActionLoading(false);
  }

  async function handleLogout() {
    const client = createClient();
    if (client) await client.auth.signOut();
    localStorage.removeItem("hpsr-demo-session");
    localStorage.removeItem("hpsr-service-status");
    localStorage.removeItem("hpsr-local-auth-session");
    clearLoginPersistence();
    setOpen(false);
    router.push("/");
  }

  const displaySeconds = useMemo(() => {
    if (clock.status !== "Em serviço" || !clock.openedAt) return clock.workedSeconds || 0;
    return Math.max(0, (clock.workedSeconds || 0) + Math.floor((tick - clockLoadedAt) / 1000));
  }, [clock, tick, clockLoadedAt]);

  const statusClass = clock.status === "Em serviço"
    ? "bg-emerald-50 text-emerald-700"
    : clock.status === "Em pausa"
      ? "bg-amber-50 text-amber-700"
      : "bg-zinc-100 text-zinc-600";

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex min-w-0 items-center gap-2 rounded-[14px] border border-hpsr-border bg-white/[0.86] px-2.5 py-2 transition hover:bg-white"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#672614,#74321e,#a67a5f)] text-white"><UserRound size={18} /></div>
        <div className="hidden min-w-0 text-left sm:block"><p className="truncate text-xs font-semibold text-hpsr-text">{currentUserProfile.systemName}</p></div>
        <span className={cn("hidden items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold md:inline-flex", statusClass)}>
          <Circle size={7} className={cn("fill-current text-current")} />{clock.status}
        </span>
        <ChevronDown size={16} className={cn("text-hpsr-muted transition", open && "rotate-180")} />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-[calc(100%+0.75rem)] z-[45] w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-[18px] border border-hpsr-border bg-[#fffaf5]/95 shadow-[0_18px_50px_rgba(60,25,12,.16)]">
          <div className="border-b border-hpsr-border bg-[#fcf6ee] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,#672614,#74321e,#a67a5f)] text-white"><UserRound size={19} /></div>
              <div className="min-w-0"><p className="truncate text-sm font-semibold text-hpsr-text">{currentUserProfile.systemName}</p><p className="mt-0.5 truncate text-xs text-hpsr-muted">{currentUserProfile.role}</p></div>
            </div>
          </div>

          <div className="space-y-3 p-3">
            <div className={cn("rounded-[14px] px-3 py-2.5 text-xs font-bold", statusClass)}>
              <div className="flex items-center justify-between gap-3">
                <span>{clock.status}</span>
                {clock.status !== "Fora de serviço" && <span className="font-black tabular-nums">{formatDuration(displaySeconds)}</span>}
              </div>
              {clock.status !== "Fora de serviço" && (
                <div className="mt-2 flex items-center gap-1.5 border-t border-current/10 pt-2 text-[10px] font-semibold opacity-80">
                  <CheckCircle2 size={12} />
                  Tempo efetivo vinculado ao ponto atual
                </div>
              )}
            </div>

            {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700">{error}</p>}

            <div className="grid gap-2">
              {clock.status === "Fora de serviço" && <ActionButton icon={<Play size={16}/>} label="Entrar em serviço" onClick={() => handleAction("enter")} loading={actionLoading || loadingClock} primary />}
              {clock.status === "Em serviço" && <div className="grid grid-cols-2 gap-2"><ActionButton icon={<Pause size={16}/>} label="Pausa" onClick={() => handleAction("pause")} loading={actionLoading}/><ActionButton icon={<Square size={16}/>} label="Finalizar" onClick={() => handleAction("finish")} loading={actionLoading} danger /></div>}
              {clock.status === "Em pausa" && <div className="grid grid-cols-2 gap-2"><ActionButton icon={<RotateCcw size={16}/>} label="Retornar" onClick={() => handleAction("return")} loading={actionLoading} primary/><ActionButton icon={<Square size={16}/>} label="Finalizar" onClick={() => handleAction("finish")} loading={actionLoading} danger /></div>}
            </div>

            <button type="button" role="menuitem" onClick={() => { setOpen(false); router.push("/dashboard/perfil"); }} className="flex w-full items-center justify-center gap-2 rounded-[12px] px-3 py-2 text-[11px] font-bold text-hpsr-wine transition hover:bg-[#f7f2ea]"><UserRound size={15}/> Ver perfil completo</button>
            <button type="button" role="menuitem" onClick={handleLogout} className="flex w-full items-center justify-center gap-2 rounded-[12px] px-3 py-2 text-[11px] font-bold text-hpsr-muted transition hover:bg-[#f7f2ea]"><LogOut size={15}/> Sair</button>
          </div>
        </div>
      )}

    </div>
  );
}

function ActionButton({ icon, label, onClick, loading, primary, danger }: { icon: React.ReactNode; label: string; onClick: () => void; loading?: boolean; primary?: boolean; danger?: boolean }) {
  return <button type="button" onClick={onClick} disabled={loading} className={cn("flex min-h-10 items-center justify-center gap-2 rounded-[13px] border px-3 py-2 text-xs font-black transition disabled:cursor-wait disabled:opacity-60", primary && "border-hpsr-wine bg-hpsr-wine text-white hover:brightness-95", danger && "border-red-200 bg-red-50 text-red-700 hover:bg-red-100", !primary && !danger && "border-hpsr-border bg-white text-hpsr-wine hover:bg-[#f7f2ea]")}>{icon}{loading ? "Registrando..." : label}</button>;
}

function normalizeClock(data: any): ClockState {
  return {
    status: (["Em serviço", "Em pausa", "Fora de serviço"].includes(data?.status) ? data.status : "Fora de serviço") as ClockStatus,
    entryId: data?.entryId || null,
    openedAt: data?.openedAt || null,
    pauseStartedAt: data?.pauseStartedAt || null,
    returnedAt: data?.returnedAt || null,
    workedSeconds: Number(data?.workedSeconds || 0),
    history: Array.isArray(data?.history) ? data.history.map((item: any) => ({ ...item, workedSeconds: Number(item.workedSeconds || 0) })) : [],
    ranking: Array.isArray(data?.ranking) ? data.ranking.map((item: any) => ({ ...item, position: Number(item.position || 0), workedSeconds: Number(item.workedSeconds || 0) })) : [],
  };
}
function formatDuration(seconds: number) { const safe = Math.max(0, Math.floor(seconds || 0)); const hours = Math.floor(safe / 3600); const minutes = Math.floor((safe % 3600) / 60); const secs = safe % 60; return `${String(hours).padStart(2,"0")}:${String(minutes).padStart(2,"0")}:${String(secs).padStart(2,"0")}`; }
function formatDate(value: string) { return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value)); }
function formatTime(value: string) { return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }
