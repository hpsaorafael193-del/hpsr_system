"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays, FileHeart, FileText, Loader2, LockKeyhole, LogIn,
  Mail, RefreshCcw, ShieldCheck, Stethoscope, UserPlus,
} from "lucide-react";
import { PatientRecordsPanel } from "@/components/public/PatientRecordsPanel";
import { PatientAppointmentsPanel } from "@/components/public/PatientAppointmentsPanel";
import { createClient } from "@/lib/supabase";
import { clearAuthContext, clearLoginPersistence, setAuthContext } from "@/lib/auth-persistence";

type Stage = "checking" | "login" | "register" | "portal";
type SessionResponse = { authenticated?: boolean; patientName?: string };

type RegisterForm = {
  name: string;
  passport: string;
  age: string;
  bloodType: string;
  phone: string;
  email: string;
  password: string;
  confirmation: string;
};

const EMPTY_REGISTER: RegisterForm = {
  name: "", passport: "", age: "", bloodType: "", phone: "", email: "", password: "", confirmation: "",
};

export function PatientAccessPanel() {
  const [stage, setStage] = useState<Stage>("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [register, setRegister] = useState<RegisterForm>(EMPTY_REGISTER);
  const [patientName, setPatientName] = useState("Paciente");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const checkSession = useCallback(async () => {
    try {
      const response = await fetch("/api/paciente/sessao", { cache: "no-store" });
      const data = await response.json() as SessionResponse;
      if (data.authenticated) {
        clearLoginPersistence();
        setAuthContext("patient");
        setPatientName(data.patientName || "Paciente");
        setStage("portal");
        return true;
      }
    } catch {}
    setStage("login");
    return false;
  }, []);

  useEffect(() => { void checkSession(); }, [checkSession]);

  function clearFeedback() { setMessage(""); setError(""); }

  async function login() {
    clearFeedback(); setBusy(true);
    try {
      const supabase = createClient();
      if (!supabase) throw new Error("O serviço de acesso não está configurado.");
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (authError || !data.session) throw new Error("E-mail ou senha inválidos.");
      const response = await fetch("/api/paciente/estabelecer-sessao", {
        method: "POST",
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      const result = await response.json();
      if (!response.ok) {
        await supabase.auth.signOut();
        throw new Error(result.error || "Não foi possível abrir o portal.");
      }
      clearLoginPersistence();
      setAuthContext("patient");
      await checkSession();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível entrar.");
    } finally { setBusy(false); }
  }

  async function createAccount() {
    clearFeedback();
    if (register.password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres."); return;
    }
    if (register.password !== register.confirmation) {
      setError("A senha e a confirmação não são iguais."); return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      if (!supabase) throw new Error("O serviço de acesso não está configurado.");

      // Uma conta profissional pode também ser vinculada como paciente. Quando o e-mail
      // já pertence ao hospital, a mesma senha confirma a identidade sem criar outro usuário.
      const existingLogin = await supabase.auth.signInWithPassword({
        email: register.email.trim().toLowerCase(),
        password: register.password,
      });
      const accessToken = existingLogin.data.session?.access_token || "";

      const response = await fetch("/api/paciente/cadastrar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(register),
      });
      const data = await response.json();
      if (!response.ok) {
        if (accessToken) await supabase.auth.signOut();
        throw new Error(data.error || "Não foi possível criar a conta.");
      }

      if (accessToken) {
        const sessionResponse = await fetch("/api/paciente/estabelecer-sessao", {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const sessionResult = await sessionResponse.json();
        if (!sessionResponse.ok) throw new Error(sessionResult.error || "Não foi possível abrir o portal.");
        clearLoginPersistence();
        setAuthContext("patient");
        setRegister(EMPTY_REGISTER);
        setMessage(data.message || "Conta vinculada ao Portal do Paciente.");
        await checkSession();
        return;
      }

      setEmail(register.email);
      setPassword("");
      setRegister(EMPTY_REGISTER);
      setStage("login");
      setMessage(data.message || "Conta criada. Entre com seu e-mail e senha.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível criar a conta.");
    } finally { setBusy(false); }
  }

  async function recoverPassword() {
    clearFeedback();
    if (!email.trim()) { setError("Informe seu e-mail antes de solicitar a recuperação."); return; }
    setBusy(true);
    try {
      const supabase = createClient();
      if (!supabase) throw new Error("O serviço de acesso não está configurado.");
      const redirectTo = `${window.location.origin}/redefinir-senha`;
      const { error: recoverError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo });
      if (recoverError) throw recoverError;
      setMessage("Enviamos as orientações de recuperação para o e-mail informado.");
    } catch {
      setError("Não foi possível enviar a recuperação de senha.");
    } finally { setBusy(false); }
  }

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/paciente/sair", { method: "POST" });
      clearAuthContext();
      const supabase = createClient();
      if (supabase) await supabase.auth.signOut();
    } finally {
      setBusy(false); setStage("login"); setPassword(""); setPatientName("Paciente");
    }
  }

  const handleSessionExpired = useCallback(() => {
    setStage("login");
    setError("Sua sessão expirou. Entre novamente para continuar.");
  }, []);

  if (stage === "checking") {
    return <div className="rounded-[24px] border border-hpsr-border bg-white/90 p-10 text-center"><Loader2 className="mx-auto animate-spin text-hpsr-wine" /><p className="mt-3 text-sm font-bold text-hpsr-muted">Preparando sua área...</p></div>;
  }

  if (stage === "portal") {
    return (
      <div className="space-y-5">
        <section className="rounded-[24px] border border-hpsr-border bg-white/90 p-4 shadow-[0_18px_45px_rgba(82,48,27,.08)] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[.14em] text-hpsr-wineLight">Central do paciente</p>
              <h2 className="mt-1 text-2xl font-black text-hpsr-text">Olá, {patientName}</h2>
              <p className="mt-1 text-sm font-semibold text-hpsr-muted">Consultas, agenda e registros liberados em um só lugar.</p>
            </div>
            <button onClick={logout} disabled={busy} className="min-h-[42px] rounded-[13px] border border-hpsr-border bg-white px-4 text-sm font-black text-hpsr-wine disabled:opacity-50">Sair</button>
          </div>
          <nav className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["#agenda-paciente", CalendarDays, "Minha agenda", "Horários e consultas"],
              ["#registros-paciente", FileHeart, "Meus exames", "Resultados liberados"],
              ["#registros-paciente", FileText, "Documentos", "Arquivos disponíveis"],
              ["#agenda-paciente", Stethoscope, "Atendimentos", "Solicitações e histórico"],
            ].map(([href, Icon, title, subtitle]) => (
              <a key={String(title)} href={String(href)} className="group rounded-[18px] border border-hpsr-border bg-hpsr-beige/35 p-4 transition hover:-translate-y-0.5 hover:border-hpsr-wine/30 hover:bg-white">
                <Icon size={21} className="text-hpsr-wine" />
                <p className="mt-3 font-black text-hpsr-text">{String(title)}</p>
                <p className="mt-1 text-xs font-semibold text-hpsr-muted">{String(subtitle)}</p>
              </a>
            ))}
          </nav>
        </section>
        <section id="agenda-paciente" className="scroll-mt-4"><PatientAppointmentsPanel onSessionExpired={handleSessionExpired} /></section>
        <section id="registros-paciente" className="scroll-mt-4"><PatientRecordsPanel onSessionExpired={handleSessionExpired} /></section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl rounded-[26px] border border-hpsr-border bg-white/90 p-4 shadow-[0_20px_55px_rgba(82,48,27,.10)] sm:p-6">
      <div className="flex rounded-[15px] bg-hpsr-beige/60 p-1">
        <button onClick={() => { setStage("login"); clearFeedback(); }} className={`min-h-[42px] flex-1 rounded-[12px] text-sm font-black ${stage === "login" ? "bg-white text-hpsr-wine shadow-sm" : "text-hpsr-muted"}`}>Entrar</button>
        <button onClick={() => { setStage("register"); clearFeedback(); }} className={`min-h-[42px] flex-1 rounded-[12px] text-sm font-black ${stage === "register" ? "bg-white text-hpsr-wine shadow-sm" : "text-hpsr-muted"}`}>Criar minha conta</button>
      </div>

      {stage === "login" ? (
        <div className="mt-6">
          <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-hpsr-wine text-white"><LockKeyhole size={20} /></div><div><p className="text-xs font-black uppercase tracking-[.14em] text-hpsr-wineLight">Acesso seguro</p><h2 className="text-xl font-black text-hpsr-text">Entrar na área do paciente</h2></div></div>
          <Field label="E-mail"><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="portal-input" placeholder="seu@email.com" /></Field>
          <Field label="Senha"><input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !busy) void login(); }} className="portal-input" placeholder="Sua senha" /></Field>
          <button onClick={login} disabled={busy || !email.trim() || !password} className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[14px] bg-hpsr-wine px-4 text-sm font-black text-white disabled:opacity-50">{busy ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />} Entrar</button>
          <button onClick={recoverPassword} disabled={busy} className="mt-3 w-full text-center text-sm font-black text-hpsr-wineLight">Esqueci minha senha</button>
        </div>
      ) : (
        <div className="mt-6">
          <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-hpsr-wine text-white"><UserPlus size={20} /></div><div><p className="text-xs font-black uppercase tracking-[.14em] text-hpsr-wineLight">Novo acesso</p><h2 className="text-xl font-black text-hpsr-text">Criar conta do paciente</h2></div></div>
          <p className="mt-3 text-sm font-semibold leading-relaxed text-hpsr-muted">O passaporte vincula sua conta ao cadastro institucional e aos registros liberados para você.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Nome completo" wide><input value={register.name} onChange={(e) => setRegister(v => ({...v, name:e.target.value}))} className="portal-input" /></Field>
            <Field label="Passaporte"><input value={register.passport} onChange={(e) => setRegister(v => ({...v, passport:e.target.value}))} className="portal-input" /></Field>
            <Field label="Idade"><input value={register.age} onChange={(e) => setRegister(v => ({...v, age:e.target.value}))} className="portal-input" /></Field>
            <Field label="Tipo sanguíneo"><input value={register.bloodType} onChange={(e) => setRegister(v => ({...v, bloodType:e.target.value}))} className="portal-input" placeholder="Ex.: O+" /></Field>
            <Field label="Telefone"><input value={register.phone} onChange={(e) => setRegister(v => ({...v, phone:e.target.value}))} className="portal-input" /></Field>
            <Field label="E-mail" wide><input type="email" autoComplete="email" value={register.email} onChange={(e) => setRegister(v => ({...v, email:e.target.value}))} className="portal-input" /></Field>
            <Field label="Senha"><input type="password" autoComplete="new-password" value={register.password} onChange={(e) => setRegister(v => ({...v, password:e.target.value}))} className="portal-input" minLength={6} placeholder="Mínimo de 6 caracteres" /></Field>
            <Field label="Confirmar senha"><input type="password" autoComplete="new-password" value={register.confirmation} minLength={6} onChange={(e) => setRegister(v => ({...v, confirmation:e.target.value}))} className="portal-input" /></Field>
          </div>
          <button onClick={createAccount} disabled={busy || !register.name || !register.passport || !register.email || !register.password || !register.confirmation} className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[14px] bg-hpsr-wine px-4 text-sm font-black text-white disabled:opacity-50">{busy ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />} Criar conta</button>
        </div>
      )}
      {message && <p className="mt-4 rounded-[13px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-900">{message}</p>}
      {error && <p className="mt-4 rounded-[13px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-800">{error}</p>}
    </div>
  );
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return <label className={`block ${wide ? "sm:col-span-2" : ""}`}><span className="mb-2 block text-xs font-black uppercase tracking-[.12em] text-hpsr-muted">{label}</span>{children}</label>;
}
