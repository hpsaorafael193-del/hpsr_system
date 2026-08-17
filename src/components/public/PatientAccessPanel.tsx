"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  AlertCircle, Baby, BellRing, CalendarClock, ClipboardPlus, FileHeart, FlaskConical, HeartPulse, HelpCircle,
  Loader2, LockKeyhole, LogIn, Plus, ShieldCheck, Trash2, UserPlus, UserRound, X,
} from "lucide-react";
import { PatientRecordsPanel } from "@/components/public/PatientRecordsPanel";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { PatientAppointmentsPanel } from "@/components/public/PatientAppointmentsPanel";
import { PatientExamRequestsPanel } from "@/components/public/PatientExamRequestsPanel";
import { PatientFollowupsPanel, type PatientFollowupData } from "@/components/public/PatientFollowupsPanel";
import { PatientProfilePanel } from "@/components/public/PatientProfilePanel";
import { createClient } from "@/lib/supabase";
import { clearAuthContext, clearLoginPersistence, setAuthContext } from "@/lib/auth-persistence";
import { formatPhoneNumber } from "@/lib/phone";

type Stage = "checking" | "login" | "register" | "portal";
type PortalSection = "home" | "appointments" | "request" | "followups" | "exam-request" | "records" | "pending" | "profile";
type PortalPatient = { passport: string; name: string; relationship: string; access_type: string; hasEmail?: boolean };
type PendingChildLink = { passport: string; name: string; relationship: string; status: string };
type SessionResponse = { authenticated?: boolean; patientName?: string; accessiblePatients?: PortalPatient[]; pendingChildLinks?: PendingChildLink[] };

type RegisterForm = {
  name: string;
  passport: string;
  age: string;
  bloodType: string;
  phone: string;
  email: string;
  password: string;
  confirmation: string;
  guardianPassports: string[];
};

const PATIENT_EMAIL_STORAGE_KEY = "hpsr_patient_login_email";

const EMPTY_REGISTER: RegisterForm = {
  name: "", passport: "", age: "", bloodType: "", phone: "", email: "", password: "", confirmation: "", guardianPassports: [""],
};

export function PatientAccessPanel() {
  const [stage, setStage] = useState<Stage>("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [register, setRegister] = useState<RegisterForm>(EMPTY_REGISTER);
  const [patientName, setPatientName] = useState("Paciente");
  const [accessiblePatients, setAccessiblePatients] = useState<PortalPatient[]>([]);
  const [selectedPassport, setSelectedPassport] = useState("");
  const [pendingChildLinks, setPendingChildLinks] = useState<PendingChildLink[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [portalSection, setPortalSection] = useState<PortalSection>("home");
  const [childOpen, setChildOpen] = useState(false);
  const [childForm, setChildForm] = useState({ name: "", passport: "", age: "", birthDate: "", bloodType: "", relationship: "Responsável legal" });
  const [followupData, setFollowupData] = useState<PatientFollowupData | null>(null);
  const [followupLoading, setFollowupLoading] = useState(false);
  const [followupError, setFollowupError] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);

  const loadFollowups = useCallback(async (passport: string) => {
    if (!passport) { setFollowupData(null); setFollowupError(""); return; }
    setFollowupLoading(true);
    setFollowupError("");
    try {
      const response = await fetch(`/api/paciente/acompanhamentos?passport=${encodeURIComponent(passport)}`, { cache: "no-store" });
      const data = await response.json();
      if (response.status === 401) return;
      if (!response.ok || !data.ok) throw new Error(data.error || "Não foi possível carregar os acompanhamentos.");
      setFollowupData({
        followups: data.followups || [],
        agendaAvailableCount: Number(data.agendaAvailableCount || 0),
        scheduledCount: Number(data.scheduledCount || 0),
        checkedAt: data.checkedAt,
      });
    } catch (caught) {
      setFollowupError(caught instanceof Error ? caught.message : "Não foi possível carregar os acompanhamentos.");
    } finally {
      setFollowupLoading(false);
    }
  }, []);

  const checkSession = useCallback(async () => {
    try {
      const response = await fetch("/api/paciente/sessao", { cache: "no-store" });
      const data = await response.json() as SessionResponse;
      if (data.authenticated) {
        clearLoginPersistence();
        setAuthContext("patient");
        setPatientName(data.patientName || "Paciente");
        const profiles = data.accessiblePatients || [];
        setAccessiblePatients(profiles);
        setPendingChildLinks(data.pendingChildLinks || []);
        setSelectedPassport((current) => profiles.some((item) => item.passport === current) ? current : (profiles[0]?.passport || ""));
        setStage("portal");
        window.dispatchEvent(new Event("hpsr-patient-session-changed"));
        return true;
      }
    } catch {}
    setStage("login");
    return false;
  }, []);

  useEffect(() => {
    if (stage === "portal" && selectedPassport) void loadFollowups(selectedPassport);
    else if (stage !== "portal") setFollowupData(null);
  }, [loadFollowups, selectedPassport, stage]);

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

  const numericAge = Number.parseInt(register.age.replace(/\D/g, ""), 10);
  const isMinorRegistration = Number.isFinite(numericAge) && numericAge < 18;

  function updateGuardianPassport(index: number, value: string) {
    setRegister((current) => ({
      ...current,
      guardianPassports: current.guardianPassports.map((passport, itemIndex) => itemIndex === index ? value.toUpperCase() : passport),
    }));
  }

  function addGuardianPassport() {
    setRegister((current) => ({ ...current, guardianPassports: [...current.guardianPassports, ""] }));
  }

  function removeGuardianPassport(index: number) {
    setRegister((current) => ({
      ...current,
      guardianPassports: current.guardianPassports.length === 1
        ? [""]
        : current.guardianPassports.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function createAccount() {
    clearFeedback();
    if (register.password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres."); return;
    }
    if (register.password !== register.confirmation) {
      setError("A senha e a confirmação não são iguais."); return;
    }
    const guardians = Array.from(new Set(register.guardianPassports.map((passport) => passport.trim().toUpperCase()).filter(Boolean)));
    if (guardians.includes(register.passport.trim().toUpperCase())) {
      setError("O paciente menor de idade não pode ser informado como o próprio responsável."); return;
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
      try { window.localStorage.setItem("hpsr_password_recovery_origin", "paciente"); } catch {}
      const { error: recoverError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo });
      if (recoverError) throw recoverError;
      setMessage("Enviamos as orientações de recuperação para o e-mail informado.");
    } catch {
      setError("Não foi possível enviar a recuperação de senha.");
    } finally { setBusy(false); }
  }

  async function createChild(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();
    setBusy(true);
    try {
      const response = await fetch("/api/paciente/dependentes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(childForm),
      });
      const data = await response.json();
      if (response.status === 401) { handleSessionExpired(); return; }
      if (!response.ok || !data.ok) throw new Error(data.error || "Não foi possível cadastrar a criança.");
      await checkSession();
      setChildForm({ name: "", passport: "", age: "", birthDate: "", bloodType: "", relationship: "Responsável legal" });
      setChildOpen(false);
      setMessage(data.message || "Solicitação enviada. O prontuário foi preparado e o vínculo aguarda uma confirmação médica simples.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível cadastrar a criança.");
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
      setBusy(false); setStage("login"); setPassword(""); setPatientName("Paciente"); setFollowupData(null); setPortalSection("home"); window.dispatchEvent(new Event("hpsr-patient-session-changed"));
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
      { id: "appointments" as const, icon: CalendarClock, title: "Meus agendamentos", subtitle: "Veja suas consultas e os horários combinados." },
      { id: "request" as const, icon: ClipboardPlus, title: "Solicitar consulta", subtitle: "Peça uma nova consulta. O médico combina o horário depois." },
      { id: "followups" as const, icon: HeartPulse, title: "Acompanhamentos", subtitle: "Veja os atendimentos que seu médico já acompanha." },
      { id: "exam-request" as const, icon: FlaskConical, title: "Solicitar exame", subtitle: "Peça um exame e acompanhe o andamento." },
      { id: "records" as const, icon: FileHeart, title: "Meu prontuário", subtitle: "Veja seus exames, documentos e registros liberados." },
      { id: "pending" as const, icon: AlertCircle, title: "Pendências", subtitle: "Veja avisos ou ajustes que ainda estão em andamento." },
    ];

    return (
      <div className="mx-auto max-w-7xl">
        <div className="grid min-w-0 gap-4">
          <main className="min-w-0 overflow-hidden rounded-[22px] border border-hpsr-border bg-white shadow-[0_14px_34px_rgba(82,48,27,.06)]">
            <div className="flex flex-col gap-3 border-b border-hpsr-border bg-[#fffaf4] p-3.5 sm:p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[.15em] text-hpsr-wineLight">Portal do paciente</p>
                  <h2 className="mt-0.5 text-lg font-black text-hpsr-text">Olá, {patientName}</h2>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                {accessiblePatients.length > 1 && (
                  <div className="w-full sm:w-72">
                    <StyledSelect
                      aria-label="Prontuário em visualização"
                      className="min-h-[40px] w-full rounded-[12px] border border-hpsr-border bg-white px-3 text-sm font-black text-hpsr-text"
                      value={selectedPassport}
                      onChange={(event) => {
                        setSelectedPassport(event.target.value);
                        setPortalSection("home");
                      }}
                    >
                      {accessiblePatients.map((item) => (
                        <option key={item.passport} value={item.passport}>
                          {item.name} · {item.access_type === "self" ? "Titular" : item.relationship}
                        </option>
                      ))}
                    </StyledSelect>
                  </div>
                )}
                <button type="button" onClick={() => setPortalSection("profile")} className={`inline-flex min-h-[40px] items-center justify-center gap-2 rounded-[12px] border px-3 text-xs font-black shadow-sm ${portalSection === "profile" ? "border-hpsr-wine bg-hpsr-wine text-white" : "border-hpsr-border bg-white text-hpsr-wine"}`}><UserRound size={15}/>Meus dados</button>
                <button type="button" onClick={() => setChildOpen(true)} className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-[12px] border border-hpsr-border bg-white px-3 text-xs font-black text-hpsr-wine shadow-sm"><Baby size={15}/>Solicitar vínculo de criança</button>
                </div>
              </div>

              <nav className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6" aria-label="Áreas do portal">
                {sections.map(({ id, icon: Icon, title }) => {
                  const active = portalSection === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPortalSection(id)}
                      className={`flex min-h-[42px] items-center justify-center gap-2 rounded-[12px] border px-3 py-2 text-xs font-black transition ${active ? "border-hpsr-wine bg-hpsr-wine text-white shadow-sm" : "border-hpsr-border bg-white text-hpsr-text hover:border-hpsr-wine/35 hover:bg-[#fffdf9]"}`}
                    >
                      <Icon size={16} />
                      <span>{title}</span>
                      {id === "followups" && Boolean(followupData?.agendaAvailableCount) && <span className={`ml-1 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[9px] font-black ${active ? "bg-white text-hpsr-wine" : "bg-blue-700 text-white"}`}>{followupData?.agendaAvailableCount}</span>}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-3.5 sm:p-4">
              {pendingChildLinks.length > 0 && (
                <div className="mb-3 rounded-[16px] border border-amber-200 bg-amber-50 p-3.5">
                  <p className="text-xs font-black uppercase tracking-[.13em] text-amber-800">Vínculos pediátricos aguardando validação</p>
                  <div className="mt-2 space-y-2">
                    {pendingChildLinks.map((item) => (
                      <div key={item.passport} className="rounded-[12px] border border-amber-200/80 bg-white px-3 py-2.5">
                        <p className="text-sm font-black text-hpsr-text">{item.name}</p>
                        <p className="mt-0.5 text-xs font-semibold text-hpsr-muted">{item.relationship} · {item.passport} · Aguardando confirmação médica</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs font-semibold leading-relaxed text-amber-900">O prontuário já foi localizado ou preparado pelo sistema, mas os dados clínicos só serão liberados após a validação.</p>
                </div>
              )}
              {Boolean(followupData?.agendaAvailableCount) && portalSection === "home" && (
                <button type="button" onClick={() => setPortalSection("followups")} className="mb-3 flex w-full items-start gap-3 rounded-[16px] border-2 border-blue-300 bg-[linear-gradient(135deg,#eff7ff_0%,#dfeeff_100%)] p-3.5 text-left shadow-[0_10px_22px_rgba(37,99,235,.07)]">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-blue-700 text-white"><BellRing size={18}/></span>
                  <span className="min-w-0"><strong className="block text-sm font-black text-blue-950">Agenda disponível em acompanhamento</strong><span className="mt-1 block text-xs font-semibold leading-relaxed text-blue-900">Há atualização em {followupData?.agendaAvailableCount} acompanhamento{followupData?.agendaAvailableCount === 1 ? "" : "s"}. Toque para ver os detalhes.</span></span>
                </button>
              )}
              {portalSection === "home" && (
                <div>
                  <div className="mb-3">
                    <h3 className="text-base font-black text-hpsr-text">O que você precisa?</h3>
                    <p className="mt-0.5 text-xs font-semibold text-hpsr-muted">Escolha uma opção. Cada área mostra só o que você precisa saber naquele momento.</p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {sections.map(({ id, icon: Icon, title, subtitle }) => (
                      <button key={id} type="button" onClick={() => setPortalSection(id)} className="group flex min-h-[92px] items-start gap-3 rounded-[16px] border border-hpsr-border bg-[#fffaf4] p-3.5 text-left transition hover:border-hpsr-wine/35 hover:bg-white hover:shadow-sm">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-white text-hpsr-wine shadow-sm"><Icon size={18}/></span>
                        <span className="min-w-0">
                          <strong className="block text-sm font-black text-hpsr-text">{title}</strong>
                          <span className="mt-1 block text-xs font-semibold leading-relaxed text-hpsr-muted">{subtitle}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {portalSection === "appointments" && <PatientAppointmentsPanel view="scheduled" passport={selectedPassport} onSessionExpired={handleSessionExpired} />}
              {portalSection === "request" && <PatientAppointmentsPanel view="request" passport={selectedPassport} hasEmail={accessiblePatients.find((item) => item.passport === selectedPassport)?.hasEmail} onSessionExpired={handleSessionExpired} />}
              {portalSection === "followups" && <PatientFollowupsPanel data={followupData} loading={followupLoading} error={followupError} onRefresh={() => void loadFollowups(selectedPassport)} />}
              {portalSection === "exam-request" && <PatientExamRequestsPanel passport={selectedPassport} hasEmail={accessiblePatients.find((item) => item.passport === selectedPassport)?.hasEmail} onSessionExpired={handleSessionExpired} />}
              {portalSection === "records" && <PatientRecordsPanel passport={selectedPassport} onSessionExpired={handleSessionExpired} />}
              {portalSection === "pending" && <PatientAppointmentsPanel view="pending" passport={selectedPassport} onSessionExpired={handleSessionExpired} />}
              {portalSection === "profile" && <PatientProfilePanel onSessionExpired={handleSessionExpired} onSaved={async () => { await checkSession(); }} />}
            </div>
          </main>
        </div>
        <PatientPortalHelp open={helpOpen} onOpen={() => setHelpOpen(true)} onClose={() => setHelpOpen(false)} />
      {childOpen && (
        <div className="fixed inset-0 z-[1200] flex items-end justify-center bg-[#2a0700]/55 p-0 sm:items-center sm:p-4">
          <form onSubmit={createChild} className="w-full max-w-lg overflow-hidden rounded-t-[24px] bg-white shadow-2xl sm:rounded-[24px]">
            <div className="flex items-start justify-between bg-hpsr-wine px-5 py-4 text-white">
              <div><p className="text-[10px] font-black uppercase tracking-[.16em] text-white/65">Fluxo pediátrico</p><h3 className="mt-1 text-xl font-black">Solicitar vínculo da criança</h3></div>
              <button type="button" onClick={() => setChildOpen(false)} className="grid h-9 w-9 place-items-center rounded-[11px] border border-white/20 bg-white/10"><X size={17}/></button>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              <Field label="Nome da criança"><input className="portal-input" value={childForm.name} onChange={(e)=>setChildForm((c)=>({...c,name:e.target.value}))} required /></Field>
              <Field label="Passaporte"><input className="portal-input uppercase" value={childForm.passport} onChange={(e)=>setChildForm((c)=>({...c,passport:e.target.value.toUpperCase()}))} required /></Field>
              <Field label="Idade"><input className="portal-input" inputMode="numeric" value={childForm.age} onChange={(e)=>setChildForm((c)=>({...c,age:e.target.value.replace(/\D/g,"")}))} required /></Field>
              <Field label="Data de nascimento"><input type="date" className="portal-input" value={childForm.birthDate} onChange={(e)=>setChildForm((c)=>({...c,birthDate:e.target.value}))} /></Field>
              <Field label="Tipo sanguíneo"><input className="portal-input uppercase" value={childForm.bloodType} onChange={(e)=>setChildForm((c)=>({...c,bloodType:e.target.value.toUpperCase()}))} /></Field>
              <Field label="Vínculo"><input className="portal-input" value={childForm.relationship} onChange={(e)=>setChildForm((c)=>({...c,relationship:e.target.value}))} /></Field>
              <p className="sm:col-span-2 rounded-[14px] border border-hpsr-border bg-[#fffaf4] p-3 text-xs font-semibold leading-relaxed text-hpsr-muted">O sistema compara nome e passaporte com o Prontuário. Quando encontra uma criança, prepara o vínculo; quando não encontra, cria o prontuário infantil pendente. A liberação ocorre somente após uma confirmação médica simples.</p>
            </div>
            <div className="flex gap-3 border-t border-hpsr-border bg-[#fffaf4] p-4"><button type="button" onClick={()=>setChildOpen(false)} className="min-h-[44px] flex-1 rounded-[13px] border border-hpsr-border bg-white text-sm font-black">Cancelar</button><button disabled={busy} type="submit" className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-[13px] bg-hpsr-wine text-sm font-black text-white disabled:opacity-50">{busy?<Loader2 size={16} className="animate-spin"/>:<Baby size={16}/>}Enviar para validação</button></div>
          </form>
        </div>
      )}
      </div>
    );
  }

  return (
    <>
    <div className="mx-auto w-full max-w-7xl overflow-hidden rounded-[28px] border border-hpsr-border bg-white/96 shadow-[0_24px_60px_rgba(82,48,27,.10)]">
      <div className="border-b border-hpsr-border bg-[linear-gradient(180deg,#fffaf4_0%,#fff6ee_100%)] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[.18em] text-hpsr-wineLight">Portal do paciente</p>
            <h2 className="mt-1 text-xl font-black text-hpsr-text">Acesso rápido e seguro</h2>
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
          <div className="mx-auto max-w-2xl">
            <div className="rounded-[28px] border border-hpsr-border bg-[linear-gradient(180deg,#ffffff_0%,#fffaf4_100%)] p-6 shadow-[0_18px_36px_rgba(82,48,27,.06)] sm:p-7">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-hpsr-wine text-white shadow-[0_10px_24px_rgba(103,38,20,.18)]"><LockKeyhole size={21} /></div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[.14em] text-hpsr-wineLight">Acesso seguro</p>
                  <h3 className="text-[1.3rem] font-black leading-tight text-hpsr-text">Entrar na área do paciente</h3>
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
          </div>
        ) : (
          <div className="rounded-[28px] border border-hpsr-border bg-[linear-gradient(180deg,#ffffff_0%,#fffaf4_100%)] p-6 shadow-[0_18px_36px_rgba(82,48,27,.06)] sm:p-7">
            <div className="flex items-start gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-hpsr-wine text-white shadow-[0_12px_28px_rgba(103,38,20,.18)]"><UserPlus size={23} /></div>
              <div>
                <p className="text-xs font-black uppercase tracking-[.14em] text-hpsr-wineLight">Novo acesso</p>
                <h3 className="text-[1.35rem] font-black leading-tight text-hpsr-text">Criar conta do paciente</h3>
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
              <Field label="Idade"><input inputMode="numeric" value={register.age} onChange={(e) => setRegister(v => ({...v, age:e.target.value}))} className="portal-input" /></Field>
              <Field label="Tipo sanguíneo"><StyledSelect value={register.bloodType} onChange={(e) => setRegister(v => ({...v, bloodType:e.target.value}))} className="portal-input"><option value="">Selecione</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option></StyledSelect></Field>
              {isMinorRegistration && (
                <div className="sm:col-span-2 rounded-[18px] border border-[#e4c7bd] bg-[#fff8f4] p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[.12em] text-hpsr-wineLight">Responsável pelo menor <span className="normal-case tracking-normal text-hpsr-muted">(opcional)</span></p>
                      <p className="mt-1 text-sm font-semibold leading-relaxed text-hpsr-muted">Opcional. Caso informado, o responsável precisa existir no prontuário, mas não precisa possuir conta no portal.</p>
                    </div>
                    <button type="button" onClick={addGuardianPassport} className="inline-flex min-h-[38px] shrink-0 items-center justify-center gap-2 rounded-[12px] border border-hpsr-border bg-white px-3 text-xs font-black text-hpsr-wine transition hover:border-hpsr-wineLight">
                      <Plus size={14} /> Adicionar responsável
                    </button>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {register.guardianPassports.map((passport, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          value={passport}
                          onChange={(event) => updateGuardianPassport(index, event.target.value)}
                          placeholder={`Passaporte do responsável ${index + 1}`}
                          className="portal-input min-w-0 flex-1 uppercase"
                        />
                        <button type="button" onClick={() => removeGuardianPassport(index)} aria-label="Remover responsável" className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-[14px] border border-rose-200 bg-white text-rose-700 transition hover:bg-rose-50">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Field label="Telefone"><input inputMode="numeric" maxLength={13} placeholder="(055) 626-323" value={register.phone} onChange={(e) => setRegister(v => ({...v, phone:formatPhoneNumber(e.target.value)}))} className="portal-input" /></Field>
              <Field label="E-mail para acesso e agendamento" wide><input type="email" autoComplete="email" value={register.email} onChange={(e) => setRegister(v => ({...v, email:e.target.value}))} className="portal-input" /><span className="mt-1.5 block text-[11px] font-semibold leading-relaxed text-hpsr-muted">Mantenha este e-mail correto para sua conta. Quando for preciso combinar uma consulta, o médico pode falar com você pelo Discord ou dentro do RP.</span></Field>
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
    <PatientPortalHelp open={helpOpen} onOpen={() => setHelpOpen(true)} onClose={() => setHelpOpen(false)} />
    </>
  );
}

function PatientPortalHelp({ open, onOpen, onClose }: { open: boolean; onOpen: () => void; onClose: () => void }) {
  const items = [
    { icon: ClipboardPlus, title: "Solicitar consulta", text: "Peça uma nova consulta. O horário ainda não está marcado; o médico combina com você depois." },
    { icon: CalendarClock, title: "Meus agendamentos", text: "Veja as consultas que já foram aceitas e os horários que já foram combinados." },
    { icon: HeartPulse, title: "Acompanhamentos", text: "Veja os atendimentos que seu médico já acompanha. Quando a agenda mudar, você recebe um aviso aqui." },
    { icon: FlaskConical, title: "Solicitar exame", text: "Peça um exame e acompanhe o andamento. Pedir um exame não cria uma consulta." },
    { icon: FileHeart, title: "Meu prontuário", text: "Veja exames, documentos e registros que foram liberados para você." },
    { icon: AlertCircle, title: "Pendências", text: "Veja avisos ou ajustes de consultas que ainda estão sendo resolvidos." },
    { icon: UserRound, title: "Meus dados", text: "Atualize seu nome, telefone, e-mail e senha sem depender da equipe." },
  ];

  return (
    <>
      <button type="button" onClick={onOpen} className="fixed bottom-4 right-4 z-[1100] inline-flex min-h-[44px] items-center gap-2 rounded-full border border-hpsr-border bg-hpsr-wine px-4 text-sm font-black text-white shadow-[0_14px_34px_rgba(82,48,27,.24)] transition hover:brightness-105 sm:bottom-5 sm:right-5">
        <HelpCircle size={17}/> Como usar
      </button>
      {open && (
        <div className="fixed inset-0 z-[1250] flex items-end justify-center bg-[#1f0805]/60 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Como usar o Portal do Paciente">
          <div className="max-h-[88dvh] w-full max-w-2xl overflow-hidden rounded-t-[24px] border border-hpsr-border bg-white shadow-2xl sm:rounded-[24px]">
            <div className="flex items-start justify-between gap-3 border-b border-hpsr-border bg-[#fffaf4] px-5 py-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.15em] text-hpsr-wineLight">Ajuda rápida</p>
                <h3 className="mt-1 text-xl font-black text-hpsr-text">Como usar o Portal</h3>
                <p className="mt-1 text-sm font-semibold text-hpsr-muted">Cada opção faz uma coisa. É só escolher o que você precisa.</p>
              </div>
              <button type="button" onClick={onClose} aria-label="Fechar" className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] border border-hpsr-border bg-white text-hpsr-wine"><X size={17}/></button>
            </div>
            <div className="max-h-[calc(88dvh-92px)] overflow-y-auto p-4 sm:p-5">
              <div className="grid gap-2 sm:grid-cols-2">
                {items.map(({ icon: Icon, title, text }) => (
                  <div key={title} className="flex items-start gap-3 rounded-[16px] border border-hpsr-border bg-[#fffaf4] p-3.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[12px] bg-white text-hpsr-wine shadow-sm"><Icon size={17}/></span>
                    <div className="min-w-0"><p className="text-sm font-black text-hpsr-text">{title}</p><p className="mt-1 text-xs font-semibold leading-relaxed text-hpsr-muted">{text}</p></div>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-[15px] border border-blue-200 bg-blue-50 px-4 py-3">
                <p className="text-xs font-black text-blue-950">Sobre horários de consulta</p>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-blue-900">Você não escolhe o horário ao enviar um pedido. O médico combina com você pelo Discord ou dentro do RP, conforme a forma que ele preferir.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return <label className={`block ${wide ? "sm:col-span-2" : ""}`}><span className="mb-2 block text-xs font-black uppercase tracking-[.12em] text-hpsr-muted">{label}</span>{children}</label>;
}
