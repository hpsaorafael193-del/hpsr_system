"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock3, KeyRound, Loader2, Mail, RefreshCcw, ShieldCheck, TriangleAlert } from "lucide-react";
import { PatientRecordsPanel } from "@/components/public/PatientRecordsPanel";
import { PatientAppointmentsPanel } from "@/components/public/PatientAppointmentsPanel";

type PortalStage = "checking" | "passport" | "code" | "portal";

type SessionResponse = {
  authenticated?: boolean;
  expiresAt?: string;
  passportHint?: string;
};

function formatRemaining(milliseconds: number) {
  if (milliseconds <= 0) return "expirada";
  const totalMinutes = Math.ceil(milliseconds / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes} min`;
}

export function PatientAccessPanel() {
  const [passport, setPassport] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<PortalStage>("checking");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [passportHint, setPassportHint] = useState("");
  const [clock, setClock] = useState(Date.now());

  const sessionRemaining = useMemo(
    () => expiresAt ? new Date(expiresAt).getTime() - clock : 0,
    [clock, expiresAt],
  );

  const resetToLogin = useCallback((reason?: string) => {
    setStage("passport");
    setCode("");
    setExpiresAt(null);
    setPassportHint("");
    setMessage("");
    setError(reason || "");
  }, []);

  const checkSession = useCallback(async (showLoading = false) => {
    if (showLoading) setStage("checking");
    try {
      const response = await fetch("/api/paciente/sessao", { cache: "no-store" });
      const data = await response.json() as SessionResponse;
      if (data.authenticated) {
        setExpiresAt(data.expiresAt || null);
        setPassportHint(data.passportHint || "");
        setStage("portal");
        setError("");
        return true;
      }
      resetToLogin();
      return false;
    } catch {
      resetToLogin("Não foi possível verificar a sessão. Confira sua conexão e tente novamente.");
      return false;
    }
  }, [resetToLogin]);

  useEffect(() => { void checkSession(true); }, [checkSession]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setInterval(() => setResendIn((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendIn]);

  useEffect(() => {
    if (stage !== "portal") return;
    const timer = window.setInterval(() => setClock(Date.now()), 30000);
    const sessionTimer = window.setInterval(() => void checkSession(false), 60000);
    const onVisibility = () => { if (document.visibilityState === "visible") void checkSession(false); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(timer);
      window.clearInterval(sessionTimer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [checkSession, stage]);

  useEffect(() => {
    if (stage === "portal" && expiresAt && sessionRemaining <= 0) {
      resetToLogin("Sua sessão temporária expirou. Solicite um novo código para continuar.");
    }
  }, [expiresAt, resetToLogin, sessionRemaining, stage]);

  async function requestCode() {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/paciente/solicitar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passport }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Não foi possível enviar o código.");
      setStage("code");
      setCode("");
      setMessage(data.message);
      setResendIn(data.resendInSeconds || 60);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível enviar o código.");
    } finally { setBusy(false); }
  }

  async function verifyCode() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/paciente/verificar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passport, code }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Código inválido.");
      await checkSession(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Código inválido.");
    } finally { setBusy(false); }
  }

  async function logout() {
    setBusy(true);
    try { await fetch("/api/paciente/sair", { method: "POST" }); }
    finally { setBusy(false); resetToLogin(); }
  }

  if (stage === "checking") {
    return (
      <div className="rounded-[24px] border border-hpsr-border bg-white/85 p-8 text-center shadow-[0_18px_40px_rgba(82,48,27,0.08)]">
        <Loader2 className="mx-auto animate-spin text-hpsr-wine" size={28} />
        <p className="mt-3 text-sm font-bold text-hpsr-muted">Verificando acesso do paciente...</p>
      </div>
    );
  }

  if (stage === "portal") {
    return (
      <div className="space-y-4">
        <div className="sticky top-2 z-20 rounded-[20px] border border-emerald-200 bg-emerald-50/95 p-3 shadow-sm backdrop-blur sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 shrink-0 text-emerald-700" size={25} />
              <div>
                <h2 className="font-black text-emerald-950">Acesso temporário validado</h2>
                <p className="mt-1 text-xs font-semibold text-emerald-800 sm:text-sm">
                  {passportHint ? `Passaporte ${passportHint} · ` : ""}sessão restante: {formatRemaining(sessionRemaining)}.
                </p>
              </div>
            </div>
            <button type="button" onClick={logout} disabled={busy} className="min-h-[42px] rounded-[13px] border border-emerald-300 bg-white px-4 text-sm font-black text-emerald-800 disabled:opacity-50">
              Encerrar acesso
            </button>
          </div>
        </div>

        <div className="rounded-[18px] border border-amber-300 bg-amber-50 p-3 text-sm font-semibold leading-relaxed text-amber-950">
          <TriangleAlert className="mr-2 inline align-text-bottom" size={18} />
          Ambiente fictício de roleplay. Nenhum exame, documento ou consulta possui validade médica real.
        </div>

        <PatientRecordsPanel onSessionExpired={() => resetToLogin("Sua sessão expirou. Solicite um novo código para continuar.")} />
        <PatientAppointmentsPanel onSessionExpired={() => resetToLogin("Sua sessão expirou. Solicite um novo código para continuar.")} />
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-hpsr-border bg-white/85 p-4 shadow-[0_18px_40px_rgba(82,48,27,0.08)] sm:p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-hpsr-wine text-white"><KeyRound size={20} /></div>
        <div><p className="text-[10px] font-black uppercase tracking-[0.15em] text-hpsr-wineLight">Acesso seguro</p><h2 className="text-lg font-black text-hpsr-text">Entrar no Portal do Paciente</h2></div>
      </div>

      <label className="mt-5 block text-xs font-black uppercase tracking-[0.12em] text-hpsr-muted">Passaporte</label>
      <input value={passport} onChange={(event) => setPassport(event.target.value)} disabled={stage === "code"} placeholder="Informe seu passaporte" autoComplete="off" className="mt-2 min-h-[46px] w-full rounded-[14px] border border-hpsr-border bg-white px-4 text-base font-bold text-hpsr-text outline-none focus:border-hpsr-wine" />

      {stage === "code" && (
        <>
          <label className="mt-4 block text-xs font-black uppercase tracking-[0.12em] text-hpsr-muted">Código de seis dígitos</label>
          <input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} onKeyDown={(event) => { if (event.key === "Enter" && code.length === 6 && !busy) void verifyCode(); }} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" className="mt-2 min-h-[52px] w-full rounded-[14px] border border-hpsr-border bg-white px-4 text-center text-2xl font-black tracking-[0.35em] text-hpsr-text outline-none focus:border-hpsr-wine" />
        </>
      )}

      {message && <p className="mt-4 rounded-[12px] border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-900">{message}</p>}
      {error && <p className="mt-4 rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800">{error}</p>}

      {stage === "passport" ? (
        <button type="button" onClick={requestCode} disabled={busy || !passport.trim()} className="mt-5 inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-[14px] bg-hpsr-wine px-4 text-sm font-black text-white disabled:opacity-50">
          {busy ? <Loader2 className="animate-spin" size={17} /> : <Mail size={17} />} Enviar código por e-mail
        </button>
      ) : (
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={verifyCode} disabled={busy || code.length !== 6} className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-[14px] bg-hpsr-wine px-4 text-sm font-black text-white disabled:opacity-50">
            {busy ? <Loader2 className="animate-spin" size={17} /> : <ShieldCheck size={17} />} Validar código
          </button>
          <button type="button" onClick={requestCode} disabled={busy || resendIn > 0} className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-[14px] border border-hpsr-border bg-white px-4 text-sm font-black text-hpsr-wine disabled:opacity-50">
            <RefreshCcw size={16} /> {resendIn > 0 ? `Reenviar em ${resendIn}s` : "Reenviar código"}
          </button>
          <button type="button" onClick={() => { setStage("passport"); setCode(""); setMessage(""); setError(""); }} className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[14px] px-4 text-xs font-black text-hpsr-muted sm:col-span-2">
            <Clock3 size={15} /> Usar outro passaporte
          </button>
        </div>
      )}
    </div>
  );
}
