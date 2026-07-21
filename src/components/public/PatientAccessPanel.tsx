"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle, CalendarCheck2, ChevronRight, ClipboardPlus, FileHeart,
  Loader2, LockKeyhole, LogIn, LogOut, ShieldCheck, UserPlus,
} from "lucide-react";
import { PatientRecordsPanel } from "@/components/public/PatientRecordsPanel";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { PatientAppointmentsPanel } from "@/components/public/PatientAppointmentsPanel";
import { createClient } from "@/lib/supabase";
import { clearAuthContext, clearLoginPersistence, setAuthContext } from "@/lib/auth-persistence";
import { formatPhoneNumber } from "@/lib/phone";

type Stage = "checking" | "login" | "register" | "portal";
type PortalSection = "home" | "request" | "scheduled" | "records" | "pending";
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

const PATIENT_EMAIL_STORAGE_KEY = "hpsr_patient_login_email";

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
  const [portalSection, setPortalSection] = useState<PortalSection>("home");

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

  useEffect(() => {
    try {
      const savedEmail = window.localStorage.getItem(PATIENT_EMAIL_STORAGE_KEY) || "";
      if (savedEmail) setEmail(savedEmail);
    } catch {}
    void checkSession();
  }, [checkSession]);

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
      try { window.localStorage.setItem(PATIENT_EMAIL_STORAGE_KEY, email.trim().toLowerCase()); } catch {}
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
        try { window.localStorage.setItem(PATIENT_EMAIL_STORAGE_KEY, register.email.trim().toLowerCase()); } catch {}
        clearLoginPersistence();
        setAuthContext("patient");
        setRegister(EMPTY_REGISTER);
        setMessage(data.message || "Conta vinculada ao Portal do Paciente.");
        await checkSession();
        return;
      }

      setEmail(register.email.trim().toLowerCase());
      try { window.localStorage.setItem(PATIENT_EMAIL_STORAGE_KEY, register.email.trim().toLowerCase()); } catch {}
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
      setBusy(false); setStage("login"); setPassword(""); setPatientName("Paciente"); setPortalSection("home");
    }
  }

  const handleSessionExpired = useCallback(() => {
    setStage("login");
    setError("Sua sessão expirou. Entre novamente para continuar.");
  }, []);

  if (stage === "checking") {
    return (
      <div className="mx-auto max-w-3xl rounded-[24px] border border-hpsr-border bg-white/92 p-5 shadow-[0_18px_45px_rgba(82,48,27,.08)] sm:p-6" aria-busy="true" aria-label="Verificando acesso">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 animate-pulse rounded-[15px] bg-[#ead8c8]" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-28 animate-pulse rounded-full bg-[#ead8c8]" />
            <div className="h-5 w-52 max-w-full animate-pulse rounded-full bg-[#dfc3b0]" />
          </div>
        </div>
        <div className="mt-5 space-y-3">
          <div className="h-12 animate-pulse rounded-[14px] bg-[#f4e9df]" />
          <div className="h-12 animate-pulse rounded-[14px] bg-[#f4e9df]" />
          <div className="h-12 animate-pulse rounded-[14px] bg-[#ead8c8]" />
        </div>
      </div>
    );
  }

  if (stage === "portal") {
    const sections = [
      { id: "request" as const, icon: ClipboardPlus, title: "Solicitar consulta", subtitle: "Envie uma nova solicitação para análise da equipe." },
      { id: "scheduled" as const, icon: CalendarCheck2, title: "Consultas marcadas", subtitle: "Confirme horários e acompanhe seus atendimentos." },
      { id: "records" as const, icon: FileHeart, title: "Meu prontuário", subtitle: "Exames, documentos e serviços liberados pelo HP." },
      { id: "pending" as const, icon: AlertCircle, title: "Pendências", subtitle: "Acompanhe respostas, justificativas e avisos importantes." },
    ];

    return (
      <div className="space-y-5">
        <section className="overflow-hidden rounded-[26px] border border-hpsr-border bg-white/95 shadow-[0_18px_45px_rgba(82,48,27,.08)]">
          <div className="flex flex-col gap-4 border-b border-hpsr-border bg-[#fffaf4] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.16em] text-hpsr-wineLight">Painel do paciente</p>
              <h2 className="mt-1 text-2xl font-black text-hpsr-text">Olá, {patientName}</h2>
              <p className="mt-1 text-sm font-semibold text-hpsr-muted">Escolha abaixo o que precisa acessar.</p>
            </div>
            <button onClick={logout} disabled={busy} className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[13px] border border-hpsr-border bg-white px-4 text-sm font-black text-hpsr-wine disabled:opacity-50">
              <LogOut size={16} /> Sair
            </button>
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
            {sections.map(({ id, icon: Icon, title, subtitle }) => {
              const active = portalSection === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPortalSection(id)}
                  className={`group flex min-h-[142px] flex-col rounded-[19px] border p-4 text-left transition ${active ? "border-hpsr-wine bg-hpsr-wine text-white shadow-[0_12px_28px_rgba(103,38,20,.18)]" : "border-hpsr-border bg-white hover:-translate-y-0.5 hover:border-hpsr-wine/35 hover:bg-[#fffaf4]"}`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-[13px] ${active ? "bg-white/15 text-white" : "bg-[#f7ede3] text-hpsr-wine"}`}><Icon size={20} /></div>
                  <p className={`mt-4 font-black ${active ? "text-white" : "text-hpsr-text"}`}>{title}</p>
                  <p className={`mt-1 text-xs font-semibold leading-relaxed ${active ? "text-white/75" : "text-hpsr-muted"}`}>{subtitle}</p>
                  <ChevronRight size={16} className={`mt-auto self-end ${active ? "text-white/80" : "text-hpsr-wine"}`} />
                </button>
              );
            })}
          </div>
        </section>

        {portalSection === "home" && (
          <section className="rounded-[22px] border border-hpsr-border bg-white/90 p-6 text-center shadow-[0_14px_35px_rgba(82,48,27,.06)]">
            <ShieldCheck className="mx-auto text-hpsr-wine" size={28} />
            <h3 className="mt-3 text-lg font-black text-hpsr-text">Sua área está pronta</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-relaxed text-hpsr-muted">Use uma das quatro opções acima para solicitar atendimento, consultar compromissos, acessar registros liberados ou verificar pendências.</p>
          </section>
        )}
        {portalSection === "request" && <PatientAppointmentsPanel view="request" onSessionExpired={handleSessionExpired} />}
        {portalSection === "scheduled" && <PatientAppointmentsPanel view="scheduled" onSessionExpired={handleSessionExpired} />}
        {portalSection === "records" && <PatientRecordsPanel onSessionExpired={handleSessionExpired} />}
        {portalSection === "pending" && <PatientAppointmentsPanel view="pending" onSessionExpired={handleSessionExpired} />}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl overflow-hidden rounded-[28px] border border-hpsr-border bg-white/96 shadow-[0_24px_60px_rgba(82,48,27,.10)]">
      <div className="border-b border-hpsr-border bg-[linear-gradient(180deg,#fffaf4_0%,#fff6ee_100%)] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[.18em] text-hpsr-wineLight">Portal do paciente</p>
            <h2 className="mt-1 text-2xl font-black text-hpsr-text">Acesso rápido e seguro</h2>
            <p className="mt-1 text-sm font-semibold leading-relaxed text-hpsr-muted">Entre com sua conta ou crie seu acesso para consultar atendimentos, exames, documentos e pendências do HPSR.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-[16px] border border-hpsr-border bg-white/90 p-1.5 shadow-sm">
            <button onClick={() => { setStage("login"); clearFeedback(); }} className={`min-h-[44px] rounded-[12px] px-4 text-sm font-black transition ${stage === "login" ? "bg-hpsr-wine text-white shadow-sm" : "text-hpsr-muted hover:bg-[#fff7ef]"}`}>Entrar</button>
            <button onClick={() => { setStage("register"); clearFeedback(); }} className={`min-h-[44px] rounded-[12px] px-4 text-sm font-black transition ${stage === "register" ? "bg-hpsr-wine text-white shadow-sm" : "text-hpsr-muted hover:bg-[#fff7ef]"}`}>Criar minha conta</button>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {stage === "login" ? (
          <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr] lg:items-start">
            <div className="rounded-[28px] border border-hpsr-border bg-[linear-gradient(180deg,#ffffff_0%,#fffaf4_100%)] p-6 shadow-[0_18px_36px_rgba(82,48,27,.06)] sm:p-7">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-hpsr-wine text-white shadow-[0_10px_24px_rgba(103,38,20,.18)]"><LockKeyhole size={21} /></div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[.14em] text-hpsr-wineLight">Acesso seguro</p>
                  <h3 className="text-[1.45rem] font-black leading-tight text-hpsr-text">Entrar na área do paciente</h3>
                  <p className="mt-1 text-sm font-semibold leading-relaxed text-hpsr-muted">Use o e-mail cadastrado e sua senha para abrir o painel do paciente.</p>
                </div>
              </div>

              <div className="mt-5 rounded-[18px] border border-hpsr-border bg-[#fffaf5] px-4 py-3 text-sm font-semibold leading-relaxed text-hpsr-muted">
                Seu e-mail pode ficar salvo neste dispositivo para agilizar os próximos acessos. <strong className="text-hpsr-text">A senha nunca é armazenada.</strong>
              </div>

              <div className="mt-5 space-y-4">
                <Field label="E-mail"><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="portal-input" placeholder="seu@email.com" /></Field>
                <Field label="Senha"><input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !busy) void login(); }} className="portal-input" placeholder="Sua senha" /></Field>
              </div>

              <button onClick={login} disabled={busy || !email.trim() || !password} className="mt-6 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[18px] bg-hpsr-wine px-5 text-sm font-black text-white shadow-[0_14px_30px_rgba(103,38,20,.16)] transition hover:brightness-105 disabled:opacity-50">{busy ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />} Entrar</button>
              <button onClick={recoverPassword} disabled={busy} className="mt-3 w-full text-center text-sm font-black text-hpsr-wineLight hover:text-hpsr-wine">Esqueci minha senha</button>
            </div>

            <div className="rounded-[24px] border border-hpsr-border bg-[#fffaf4] p-5 shadow-[0_14px_30px_rgba(82,48,27,.05)] sm:p-6">
              <h4 className="text-sm font-black uppercase tracking-[.14em] text-hpsr-wineLight">Como funciona</h4>
              <div className="mt-4 space-y-3">
                <div className="rounded-[16px] border border-hpsr-border bg-white px-4 py-3">
                  <p className="text-sm font-black text-hpsr-text">1. Faça login com seu e-mail</p>
                  <p className="mt-1 text-sm font-semibold leading-relaxed text-hpsr-muted">Seu acesso é vinculado à sua conta de paciente e ao passaporte do prontuário.</p>
                </div>
                <div className="rounded-[16px] border border-hpsr-border bg-white px-4 py-3">
                  <p className="text-sm font-black text-hpsr-text">2. Acesse seu painel</p>
                  <p className="mt-1 text-sm font-semibold leading-relaxed text-hpsr-muted">Depois do login, você poderá solicitar consulta, acompanhar marcações, ver prontuário liberado e pendências.</p>
                </div>
                <div className="rounded-[16px] border border-hpsr-border bg-white px-4 py-3">
                  <p className="text-sm font-black text-hpsr-text">3. Recupere o acesso quando precisar</p>
                  <p className="mt-1 text-sm font-semibold leading-relaxed text-hpsr-muted">Caso esqueça a senha, use a recuperação para receber um novo link de redefinição no e-mail cadastrado.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[28px] border border-hpsr-border bg-[linear-gradient(180deg,#ffffff_0%,#fffaf4_100%)] p-6 shadow-[0_18px_36px_rgba(82,48,27,.06)] sm:p-7">
            <div className="flex items-start gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-hpsr-wine text-white shadow-[0_12px_28px_rgba(103,38,20,.18)]"><UserPlus size={23} /></div>
              <div>
                <p className="text-xs font-black uppercase tracking-[.14em] text-hpsr-wineLight">Novo acesso</p>
                <h3 className="text-[1.55rem] font-black leading-tight text-hpsr-text">Criar conta do paciente</h3>
                <p className="mt-1 max-w-2xl text-sm font-semibold leading-relaxed text-hpsr-muted">Cadastre seu acesso para consultar atendimentos, exames, documentos e demais informações liberadas no Portal do Paciente.</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 rounded-[20px] border border-hpsr-border bg-white/92 p-4 sm:grid-cols-3">
              <div className="rounded-[16px] border border-hpsr-border bg-[#fffaf5] px-4 py-3">
                <p className="text-[11px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Vinculação</p>
                <p className="mt-1 text-sm font-semibold leading-relaxed text-hpsr-muted">O passaporte conecta sua conta ao cadastro institucional.</p>
              </div>
              <div className="rounded-[16px] border border-hpsr-border bg-[#fffaf5] px-4 py-3">
                <p className="text-[11px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Dados essenciais</p>
                <p className="mt-1 text-sm font-semibold leading-relaxed text-hpsr-muted"><strong className="text-hpsr-text">Nome, passaporte, e-mail e senha</strong> são obrigatórios para concluir o cadastro.</p>
              </div>
              <div className="rounded-[16px] border border-hpsr-border bg-[#fffaf5] px-4 py-3">
                <p className="text-[11px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Acesso</p>
                <p className="mt-1 text-sm font-semibold leading-relaxed text-hpsr-muted">Depois de criar a conta, o acesso já poderá ser usado no portal.</p>
              </div>
            </div>

            <div className="mt-5 rounded-[22px] border border-hpsr-border bg-white p-5 shadow-[0_10px_24px_rgba(82,48,27,.04)]">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-hpsr-border pb-3">
                <div>
                  <h4 className="text-base font-black text-hpsr-text">Dados do cadastro</h4>
                  <p className="text-sm font-semibold text-hpsr-muted">Preencha as informações para criar sua conta de paciente.</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome completo" wide><input value={register.name} onChange={(e) => setRegister(v => ({...v, name:e.target.value}))} className="portal-input" /></Field>
              <Field label="Passaporte"><input value={register.passport} onChange={(e) => setRegister(v => ({...v, passport:e.target.value}))} className="portal-input" /></Field>
              <Field label="Idade"><input value={register.age} onChange={(e) => setRegister(v => ({...v, age:e.target.value}))} className="portal-input" /></Field>
              <Field label="Tipo sanguíneo"><StyledSelect value={register.bloodType} onChange={(e) => setRegister(v => ({...v, bloodType:e.target.value}))} className="portal-input"><option value="">Selecione</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option></StyledSelect></Field>
              <Field label="Telefone"><input inputMode="numeric" maxLength={13} placeholder="(055) 626-323" value={register.phone} onChange={(e) => setRegister(v => ({...v, phone:formatPhoneNumber(e.target.value)}))} className="portal-input" /></Field>
              <Field label="E-mail" wide><input type="email" autoComplete="email" value={register.email} onChange={(e) => setRegister(v => ({...v, email:e.target.value}))} className="portal-input" /></Field>
              <Field label="Senha"><input type="password" autoComplete="new-password" value={register.password} onChange={(e) => setRegister(v => ({...v, password:e.target.value}))} className="portal-input" minLength={6} placeholder="Mínimo de 6 caracteres" /></Field>
              <Field label="Confirmar senha"><input type="password" autoComplete="new-password" value={register.confirmation} minLength={6} onChange={(e) => setRegister(v => ({...v, confirmation:e.target.value}))} className="portal-input" /></Field>
              </div>
            </div>
            <button onClick={createAccount} disabled={busy || !register.name || !register.passport || !register.email || !register.password || !register.confirmation} className="mt-5 inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-[16px] bg-hpsr-wine px-4 text-sm font-black text-white shadow-[0_12px_28px_rgba(103,38,20,.16)] transition hover:brightness-105 disabled:opacity-50">{busy ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />} Criar conta</button>
          </div>
        )}

        {message && <p className="mt-5 rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">{message}</p>}
        {error && <p className="mt-5 rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">{error}</p>}
      </div>
    </div>
  );
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return <label className={`block ${wide ? "sm:col-span-2" : ""}`}><span className="mb-2 block text-xs font-black uppercase tracking-[.12em] text-hpsr-muted">{label}</span>{children}</label>;
}
