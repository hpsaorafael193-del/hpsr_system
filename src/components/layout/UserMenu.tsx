"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, BellRing, CalendarCheck2, CheckCircle2, ChevronDown, Circle, ClipboardList, FlaskConical, LogOut, Pause, Play, RotateCcw, Square, Stethoscope, UserRound, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCurrentUserProfile } from "@/components/auth/CurrentUserProfileProvider";
import { createClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { clearLoginPersistence } from "@/lib/auth-persistence";

type ClockStatus = "Fora de serviço" | "Em serviço" | "Em pausa";
type MedicalNotification = {
  id: string;
  title: string;
  description: string;
  category: "Acompanhamento" | "Consulta" | "Reagendamento" | "Exame";
  createdAt: string;
  unread: boolean;
  payload: Record<string, unknown>;
  status: string;
};

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
  const [notifications, setNotifications] = useState<MedicalNotification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
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

  const sendClockHeartbeat = useCallback(async (close = false) => {
    if (clock.status === "Fora de serviço") return;
    const client = createClient();
    if (!client) return;
    const { data, error: heartbeatError } = await client.rpc("time_clock_heartbeat", { p_close: close });
    if (!heartbeatError && data && typeof data === "object" && "closed" in data && Boolean((data as { closed?: boolean }).closed)) {
      await loadClock();
      await refreshProfile();
    }
  }, [clock.status, loadClock, refreshProfile]);

  useEffect(() => {
    void loadClock();
  }, [loadClock]);
  const canUseMedicalNotifications = useMemo(() => {
    const role = `${currentUserProfile.role || ""} ${currentUserProfile.systemRole || ""}`.toLocaleLowerCase("pt-BR");
    return Boolean(currentUserProfile.id && (currentUserProfile.specialty || role.includes("médic") || role.includes("diretor clínico")));
  }, [currentUserProfile.id, currentUserProfile.role, currentUserProfile.specialty, currentUserProfile.systemRole]);

  const loadNotifications = useCallback(async () => {
    if (!canUseMedicalNotifications || !currentUserProfile.id) {
      setNotifications([]);
      return;
    }
    const client = createClient();
    if (!client) return;
    setNotificationsLoading(true);
    try {
      const columns = "id,patient,passport,status,payload,created_at,updated_at";
      const directQuery = client
        .from("appointments")
        .select(columns)
        .or(`payload->>doctorId.eq.${currentUserProfile.id},payload->>requestedDoctorId.eq.${currentUserProfile.id}`)
        .in("status", ["Solicitação enviada", "Aguardando análise", "Acompanhamento aguardando confirmação"])
        .order("updated_at", { ascending: false })
        .limit(40);

      const { data: directRows, error: directError } = await directQuery;
      if (directError) throw directError;

      let specialtyRows: any[] = [];
      if (currentUserProfile.specialty) {
        const { data, error: specialtyError } = await client
          .from("appointments")
          .select(columns)
          .eq("payload->>specialty", currentUserProfile.specialty)
          .in("status", ["Solicitação enviada", "Aguardando análise", "Acompanhamento aguardando confirmação"])
          .order("created_at", { ascending: false })
          .limit(30);
        if (specialtyError) throw specialtyError;
        specialtyRows = data || [];
      }

      const rows = [...(directRows || []), ...specialtyRows];
      const unique = new Map<string, any>();
      rows.forEach((row: any) => unique.set(String(row.id), row));
      const userId = String(currentUserProfile.id);
      const mapped = [...unique.values()]
        .map((row: any): MedicalNotification | null => {
          const payload = (row.payload || {}) as Record<string, unknown>;
          const requestedDoctorId = String(payload.requestedDoctorId || "");
          const doctorId = String(payload.doctorId || "");
          const readBy = Array.isArray(payload.notificationReadBy) ? payload.notificationReadBy.map(String) : [];
          const directlyRelated = requestedDoctorId === userId || doctorId === userId;
          const specialtyRelated = !requestedDoctorId && String(payload.specialty || "") === String(currentUserProfile.specialty || "");
          if (!directlyRelated && !specialtyRelated) return null;

          const flowType = String(payload.flowType || "Consulta comum");
          const patient = String(row.patient || payload.patient || "Paciente");
          const specialty = String(payload.specialty || "Especialidade não informada");
          let category: MedicalNotification["category"] = "Consulta";
          let title = `Nova solicitação de ${patient}`;
          let description = `${flowType} · ${specialty}`;

          if (row.status === "Acompanhamento aguardando confirmação") {
            category = "Acompanhamento";
            title = `${patient} solicitou acompanhamento`;
            description = `Pré-registro direcionado para você em ${specialty}.`;
          } else if (flowType === "Exames") {
            category = "Exame";
            title = `${patient} enviou uma solicitação de exame`;
            description = String(payload.otherFlowDescription || payload.reason || payload.notes || specialty);
          }

          const actionableStatuses = ["Solicitação enviada", "Aguardando análise", "Acompanhamento aguardando confirmação"];
          if (!actionableStatuses.includes(String(row.status))) return null;
          return {
            id: String(row.id),
            title,
            description,
            category,
            createdAt: String(row.updated_at || row.created_at || ""),
            unread: !readBy.includes(userId) && (Boolean(payload.doctorNotificationUnread) || actionableStatuses.includes(String(row.status))),
            payload,
            status: String(row.status),
          };
        })
        .filter((item: MedicalNotification | null): item is MedicalNotification => Boolean(item))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 50);
      setNotifications(mapped);
    } catch (caught) {
      console.warn("[HPSR] Não foi possível carregar as notificações médicas.", caught);
    } finally {
      setNotificationsLoading(false);
    }
  }, [canUseMedicalNotifications, currentUserProfile.id, currentUserProfile.specialty]);

  useEffect(() => {
    void loadNotifications();
    if (!canUseMedicalNotifications) return;
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void loadNotifications();
    };
    const interval = window.setInterval(refreshWhenVisible, 120000);
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [canUseMedicalNotifications, loadNotifications]);

  const unreadNotificationCount = notifications.filter((item) => item.unread).length;

  async function markNotificationsRead(ids: string[]) {
    const client = createClient();
    if (!client || !currentUserProfile.id || ids.length === 0) return;
    const selected = notifications.filter((item) => ids.includes(item.id));
    await Promise.all(selected.map(async (item) => {
      const currentReadBy = Array.isArray(item.payload.notificationReadBy) ? item.payload.notificationReadBy.map(String) : [];
      const notificationReadBy = Array.from(new Set([...currentReadBy, String(currentUserProfile.id)]));
      const { error: updateError } = await client
        .from("appointments")
        .update({ payload: { ...item.payload, notificationReadBy, doctorNotificationUnread: false } })
        .eq("id", item.id);
      if (updateError) console.warn("[HPSR] Falha ao marcar notificação como lida.", updateError);
    }));
    setNotifications((current) => current.map((item) => ids.includes(item.id) ? { ...item, unread: false, payload: { ...item.payload, notificationReadBy: Array.from(new Set([...(Array.isArray(item.payload.notificationReadBy) ? item.payload.notificationReadBy.map(String) : []), String(currentUserProfile.id)])), doctorNotificationUnread: false } } : item));
  }


  useEffect(() => {
    if (clock.status === "Fora de serviço") return;
    void sendClockHeartbeat(false);
    const heartbeatInterval = window.setInterval(() => { void sendClockHeartbeat(false); }, 30000);
    const closeClock = () => { void sendClockHeartbeat(true); };
    const handleOffline = () => { void sendClockHeartbeat(true); };
    window.addEventListener("pagehide", closeClock);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.clearInterval(heartbeatInterval);
      window.removeEventListener("pagehide", closeClock);
      window.removeEventListener("offline", handleOffline);
    };
  }, [clock.status, sendClockHeartbeat]);

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
    if (client && clock.status !== "Fora de serviço") await client.rpc("time_clock_heartbeat", { p_close: true });
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
        <div className={cn("relative flex h-8 w-8 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#672614,#74321e,#a67a5f)] text-white", unreadNotificationCount > 0 && "ring-2 ring-red-500 ring-offset-2 ring-offset-white animate-pulse")}><UserRound size={18} />{unreadNotificationCount > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-red-600 px-1 text-[8px] font-black leading-none text-white">{unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}</span>}</div>
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

            {canUseMedicalNotifications && <button type="button" role="menuitem" onClick={() => { setOpen(false); setNotificationsOpen(true); void loadNotifications(); }} className="relative flex w-full items-center justify-center gap-2 rounded-[12px] border border-hpsr-border bg-white px-3 py-2.5 text-[11px] font-black text-hpsr-wine transition hover:bg-[#f7f2ea]"><BellRing size={15}/> Minhas notificações{unreadNotificationCount > 0 && <span className="ml-auto rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-black text-white">{unreadNotificationCount}</span>}</button>}
            <button type="button" role="menuitem" onClick={() => { setOpen(false); router.push("/dashboard/perfil"); }} className="flex w-full items-center justify-center gap-2 rounded-[12px] px-3 py-2 text-[11px] font-bold text-hpsr-wine transition hover:bg-[#f7f2ea]"><UserRound size={15}/> Ver perfil completo</button>
            <button type="button" role="menuitem" onClick={handleLogout} className="flex w-full items-center justify-center gap-2 rounded-[12px] px-3 py-2 text-[11px] font-bold text-hpsr-muted transition hover:bg-[#f7f2ea]"><LogOut size={15}/> Sair</button>
          </div>
        </div>
      )}

      {notificationsOpen && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center px-3 py-4 sm:px-5">
          <button type="button" aria-label="Fechar notificações" onClick={() => setNotificationsOpen(false)} className="absolute inset-0 bg-[#2a0700]/45 backdrop-blur-[2px]" />
          <section className="relative z-10 flex max-h-[min(720px,92dvh)] w-full max-w-[620px] flex-col overflow-hidden rounded-[22px] border border-white/80 bg-[#fffaf5] shadow-[0_28px_90px_rgba(42,7,0,.28)]">
            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-hpsr-border bg-white px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative grid h-11 w-11 shrink-0 place-items-center rounded-[15px] bg-hpsr-wine text-white"><BellRing size={20}/>{unreadNotificationCount > 0 && <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-red-600 animate-pulse" />}</div>
                <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[.17em] text-hpsr-wineLight">Central pessoal</p><h2 className="mt-0.5 text-xl font-black text-hpsr-text">Minhas notificações</h2><p className="mt-1 text-xs font-semibold text-hpsr-muted">Pendências e movimentações relacionadas ao seu atendimento.</p></div>
              </div>
              <button type="button" onClick={() => setNotificationsOpen(false)} className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] border border-hpsr-border bg-white text-hpsr-muted hover:bg-[#fff8f0] hover:text-hpsr-wine"><X size={18}/></button>
            </header>
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-hpsr-border bg-[#fffaf5] px-5 py-3">
              <p className="text-xs font-bold text-hpsr-muted">{unreadNotificationCount ? `${unreadNotificationCount} não lida${unreadNotificationCount === 1 ? "" : "s"}` : "Tudo em dia"}</p>
              {unreadNotificationCount > 0 && <button type="button" onClick={() => void markNotificationsRead(notifications.filter((item) => item.unread).map((item) => item.id))} className="text-xs font-black text-hpsr-wine hover:underline">Marcar todas como lidas</button>}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 [scrollbar-gutter:stable]">
              {notificationsLoading && notifications.length === 0 ? (
                <div className="grid min-h-[220px] place-items-center text-sm font-bold text-hpsr-muted">Carregando notificações...</div>
              ) : notifications.length === 0 ? (
                <div className="flex min-h-[250px] flex-col items-center justify-center rounded-[18px] border border-dashed border-hpsr-border bg-white px-5 text-center"><div className="grid h-12 w-12 place-items-center rounded-[18px] bg-[#f7e8e4] text-hpsr-wine"><Bell size={22}/></div><h3 className="mt-4 text-lg font-black text-hpsr-text">Nenhuma pendência</h3><p className="mt-2 max-w-sm text-sm leading-relaxed text-hpsr-muted">Novas solicitações, confirmações e respostas relacionadas a você aparecerão aqui.</p></div>
              ) : (
                <div className="grid gap-2.5">
                  {notifications.map((notification) => {
                    const Icon = notification.category === "Acompanhamento" ? Stethoscope : notification.category === "Reagendamento" ? CalendarCheck2 : notification.category === "Exame" ? FlaskConical : ClipboardList;
                    return <button key={notification.id} type="button" onClick={() => { if (notification.unread) void markNotificationsRead([notification.id]); setNotificationsOpen(false); router.push("/dashboard/agendamento"); }} className={cn("group flex w-full items-start gap-3 rounded-[17px] border p-3.5 text-left transition", notification.unread ? "border-red-200 bg-white shadow-sm" : "border-hpsr-border bg-white/70 hover:bg-white")}>
                      <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-[14px]", notification.unread ? "bg-red-50 text-red-700" : "bg-[#f7eee9] text-hpsr-wine")}><Icon size={18}/></div>
                      <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><p className="text-sm font-black text-hpsr-text">{notification.title}</p>{notification.unread && <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-red-600 animate-pulse" />}</div><p className="mt-1 text-xs font-semibold leading-relaxed text-hpsr-muted">{notification.description}</p><div className="mt-2 flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#f7eee9] px-2.5 py-1 text-[9px] font-black uppercase tracking-[.1em] text-hpsr-wine">{notification.category}</span><span className="text-[10px] font-semibold text-hpsr-muted">{formatNotificationDate(notification.createdAt)}</span></div></div>
                    </button>;
                  })}
                </div>
              )}
            </div>
          </section>
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

function formatSimpleDate(value: string) {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}
function formatNotificationDate(value: string) {
  if (!value) return "Agora";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date);
}
