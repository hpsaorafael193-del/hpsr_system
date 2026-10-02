"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import dynamic from "next/dynamic";
import {
  AlertCircle, Baby, BellRing, CalendarClock, ClipboardPlus, FileHeart, FlaskConical, HeartPulse, HelpCircle, Syringe,
  Loader2, LockKeyhole, LogIn, MailX, Plus, ShieldCheck, Trash2, UserPlus, UserRound, X,
} from "lucide-react";
import { PatientGestationalPlansPanel } from "@/components/public/PatientGestationalPlansPanel";
import { PatientRecordsPanel } from "@/components/public/PatientRecordsPanel";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { PatientAppointmentsPanel } from "@/components/public/PatientAppointmentsPanel";
import { PatientExamRequestsPanel } from "@/components/public/PatientExamRequestsPanel";
import { PatientFollowupSummaryPanel, PatientFollowupsPanel, type PatientFollowupData } from "@/components/public/PatientFollowupsPanel";
import { PatientProfilePanel } from "@/components/public/PatientProfilePanel";
import { createClient, createPasswordRecoveryClient } from "@/lib/supabase";
import { clearAuthContext, clearLoginPersistence, setAuthContext } from "@/lib/auth-persistence";
import { formatCityPhoneNumber, normalizeDiscordId } from "@/lib/phone";

type Stage = "checking" | "login" | "register" | "portal";
type PortalSection = "home" | "appointments" | "request" | "followups" | "exam-request" | "records" | "gestation" | "ivf" | "vaccination" | "pending" | "profile";
type PortalPatient = { passport: string; name: string; relationship: string; access_type: string; hasClinicalContact?: boolean; discord?: string; cityPhone?: string; preferredContact?: "discord" | "city_phone" | null };
type PendingChildLink = { passport: string; name: string; relationship: string; status: string };
type SessionResponse = { authenticated?: boolean; accountId?: string; patientName?: string; accessiblePatients?: PortalPatient[]; pendingChildLinks?: PendingChildLink[]; hasOwnProfile?: boolean };

type RegisterForm = {
  name: string;
  passport: string;
  age: string;
  bloodType: string;
  phone: string;
  discord: string;
  email: string;
  password: string;
  confirmation: string;
  guardianPassports: string[];
};

const PatientEmailRecoveryModal = dynamic(
  () => import("@/components/public/PatientEmailRecoveryModal").then((module) => module.PatientEmailRecoveryModal),
  { ssr: false },
);

const PATIENT_EMAIL_STORAGE_KEY = "hpsr_patient_login_email";

const EMPTY_REGISTER: RegisterForm = {
  name: "", passport: "", age: "", bloodType: "", phone: "", discord: "", email: "", password: "", confirmation: "", guardianPassports: [""],
};

export function PatientAccessPanel() {
  const [stage, setStage] = useState<Stage>("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [register, setRegister] = useState<RegisterForm>(EMPTY_REGISTER);
  const [registrationType, setRegistrationType] = useState<"patient" | "guardian">("patient");
  const [patientName, setPatientName] = useState("Paciente");
  const [accountId, setAccountId] = useState("");
  const [showGestation, setShowGestation] = useState(false);
  const [showIVF, setShowIVF] = useState(false);
  const [hasOwnProfile,setHasOwnProfile] = useState(true);
  const [accessiblePatients, setAccessiblePatients] = useState<PortalPatient[]>([]);
  const [selectedPassport, setSelectedPassport] = useState("");
  const [pendingChildLinks, setPendingChildLinks] = useState<PendingChildLink[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [portalSection, setPortalSection] = useState<PortalSection>("home");
  const [childOpen, setChildOpen] = useState(false);
  const [childForm, setChildForm] = useState({ name: "", passport: "", age: "", ageUnit: "anos", relationship: "Responsável legal", additionalGuardianName: "" });
  const [followupData, setFollowupData] = useState<PatientFollowupData | null>(null);
  const [followupPassport, setFollowupPassport] = useState("");
  const [followupLoading, setFollowupLoading] = useState(false);
  const [followupError, setFollowupError] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const portalContentRef = useRef<HTMLDivElement>(null);
  const shouldFocusPortalSectionRef = useRef(false);
  const followupInFlightRef = useRef<{ passport: string; request: Promise<void> } | null>(null);
  const followupLastLoadedRef = useRef<{ passport: string; at: number } | null>(null);
  const followupSequenceRef = useRef(0);

  const focusPortalContent = useCallback(() => {
    const content = portalContentRef.current;
    if (!content) return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    content.focus({ preventScroll: true });
    content.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }, []);

  const openPortalSection = useCallback((section: PortalSection) => {
    if (section === portalSection) {
      window.requestAnimationFrame(focusPortalContent);
      return;
    }
    shouldFocusPortalSectionRef.current = true;
    setPortalSection(section);
  }, [focusPortalContent, portalSection]);

  useEffect(() => {
    if (stage !== "portal" || !shouldFocusPortalSectionRef.current) return;
    shouldFocusPortalSectionRef.current = false;
    const frame = window.requestAnimationFrame(focusPortalContent);
    return () => window.cancelAnimationFrame(frame);
  }, [focusPortalContent, portalSection, stage]);

  const loadFollowups = useCallback((passport: string, force = false): Promise<void> => {
    if (!passport) { setFollowupData(null); setFollowupError(""); return Promise.resolve(); }
    const activeRequest = followupInFlightRef.current;
    if (activeRequest?.passport === passport) return activeRequest.request;
    if (!force && followupLastLoadedRef.current?.passport === passport
        && Date.now() - followupLastLoadedRef.current.at < 20_000) return Promise.resolve();
    const sequence = ++followupSequenceRef.current;
    setFollowupLoading(true);
    setFollowupError("");
    const request = (async () => {
      try {
        const response = await fetch(`/api/paciente/acompanhamentos?passport=${encodeURIComponent(passport)}`, { cache: "no-store" });
        const data = await response.json();
        if (sequence !== followupSequenceRef.current) return;
        if (response.status === 401) return;
        if (!response.ok || !data.ok) throw new Error(data.error || "Não foi possível carregar os acompanhamentos.");
        followupLastLoadedRef.current = { passport, at: Date.now() };
        setFollowupPassport(passport);
        setFollowupData({
          followups: data.followups || [],
          agendaAvailableCount: Number(data.agendaAvailableCount || 0),
          scheduledCount: Number(data.scheduledCount || 0),
          checkedAt: data.checkedAt,
        });
      } catch (caught) {
        if (sequence === followupSequenceRef.current) setFollowupError(caught instanceof Error ? caught.message : "Não foi possível carregar os acompanhamentos.");
      } finally {
        if (sequence === followupSequenceRef.current) setFollowupLoading(false);
      }
    })();
    followupInFlightRef.current = { passport, request };
    void request.finally(() => {
      if (followupInFlightRef.current?.request === request) followupInFlightRef.current = null;
    });
    return request;
  }, []);

  const checkSession = useCallback(async () => {
    try {
      const response = await fetch("/api/paciente/sessao", { cache: "no-store" });
      const data = await response.json() as SessionResponse;
      if (data.authenticated) {
        clearLoginPersistence();
        setAuthContext("patient");
        setPatientName(data.patientName || "Paciente");
        setAccountId(data.accountId || "");
        setHasOwnProfile(Boolean(data.hasOwnProfile));
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

  // O cabeçalho público hospeda os perfis e as notificações; o Portal mantém o
  // prontuário ativo e valida toda seleção contra os vínculos da sessão.
  useEffect(() => {
    if (stage !== "portal") return;
    window.dispatchEvent(new CustomEvent("hpsr-patient-portal-updated", { detail: {
      accountId, accessiblePatients, pendingChildLinks, selectedPassport, hasOwnProfile,
    } }));
  }, [stage, accountId, accessiblePatients, pendingChildLinks, selectedPassport, hasOwnProfile]);

  useEffect(() => {
    const selectFromHeader = (event: Event) => {
      const { passport, section } = (event as CustomEvent<{ passport: string; section: PortalSection }>).detail || {};
      if (stage !== "portal") return;
      const match = accessiblePatients.find((item) => item.passport === passport);
      if (match) {
        setSelectedPassport(match.passport);
        setPortalSection(section === "vaccination" && match.access_type === "self" ? "records" : (section || "home"));
      } else if (!passport && section === "home") {
        setPortalSection("home");
      }
    };
    const registerFromHeader = () => { if (stage === "portal") setChildOpen(true); };
    const openMyData = () => {
      if (stage !== "portal" || !hasOwnProfile) return;
      const self = accessiblePatients.find((item) => item.access_type === "self");
      if (self) setSelectedPassport(self.passport);
      openPortalSection("profile");
    };
    const refreshProfiles = () => { if (stage === "portal") void checkSession(); };
    const expireSession = () => { setStage("login"); setError("Sua sessão expirou. Entre novamente para continuar."); };
    window.addEventListener("hpsr-patient-select-profile", selectFromHeader);
    window.addEventListener("hpsr-patient-register-child", registerFromHeader);
    window.addEventListener("hpsr-patient-open-my-data", openMyData);
    window.addEventListener("hpsr-patient-refresh-profiles", refreshProfiles);
    window.addEventListener("hpsr-patient-session-expired", expireSession);
    return () => {
      window.removeEventListener("hpsr-patient-select-profile", selectFromHeader);
      window.removeEventListener("hpsr-patient-register-child", registerFromHeader);
      window.removeEventListener("hpsr-patient-open-my-data", openMyData);
      window.removeEventListener("hpsr-patient-refresh-profiles", refreshProfiles);
      window.removeEventListener("hpsr-patient-session-expired", expireSession);
    };
  }, [stage, accessiblePatients, hasOwnProfile, openPortalSection, checkSession]);

  useEffect(() => {
    if (stage !== "portal" || !selectedPassport) { setShowGestation(false); setShowIVF(false); return; }
    let active = true;
    setShowGestation(false);
    setShowIVF(false);
    fetch(`/api/paciente/contexto?passport=${encodeURIComponent(selectedPassport)}`, { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() : null)
      .then((data) => { if (active) { setShowGestation(Boolean(data?.showGestation)); setShowIVF(Boolean(data?.showIVF)); } })
      .catch(() => { if (active) { setShowGestation(false); setShowIVF(false); } });
    return () => { active = false; };
  }, [selectedPassport, stage]);

  useEffect(() => {
    // Uma resposta de outro perfil nunca pode permanecer na tela após a troca.
    followupSequenceRef.current += 1;
    followupInFlightRef.current = null;
    setFollowupLoading(false);
    setFollowupData(null);
    setFollowupPassport("");
    setFollowupError("");
    followupLastLoadedRef.current = null;
    if (stage === "portal" && selectedPassport) void loadFollowups(selectedPassport);
    else if (stage !== "portal") {
      followupSequenceRef.current += 1;
      followupInFlightRef.current = null;
      followupLastLoadedRef.current = null;
      setFollowupData(null);
    }
  }, [loadFollowups, selectedPassport, stage]);

  useEffect(() => {
    if (stage !== "portal" || !selectedPassport) return;
    const refreshVisiblePortal = () => {
      if (document.visibilityState === "visible") void loadFollowups(selectedPassport);
    };
    window.addEventListener("focus", refreshVisiblePortal);
    document.addEventListener("visibilitychange", refreshVisiblePortal);
    return () => {
      window.removeEventListener("focus", refreshVisiblePortal);
      document.removeEventListener("visibilitychange", refreshVisiblePortal);
    };
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
    if (registrationType === "patient" && isMinorRegistration) {
      setError("Crianças não precisam de conta própria. Crie a conta de responsável e cadastre a criança por ela."); return;
    }
    const guardians = registrationType === "patient"
      ? Array.from(new Set(register.guardianPassports.map((passport) => passport.trim().toUpperCase()).filter(Boolean))) : [];
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

      const response = await fetch(registrationType === "guardian" ? "/api/paciente/conta-responsavel" : "/api/paciente/cadastrar", {
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
      const supabase = createPasswordRecoveryClient();
      if (!supabase) throw new Error("O serviço de acesso não está configurado.");
      const redirectTo = `${window.location.origin}/redefinir-senha?origem=paciente`;
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
        body: JSON.stringify({ ...childForm, age: `${childForm.age.trim()} ${childForm.ageUnit}` }),
      });
      const data = await response.json();
      if (response.status === 401) { handleSessionExpired(); return; }
      if (!response.ok || !data.ok) throw new Error(data.error || "Não foi possível cadastrar a criança.");
      await checkSession();
      setChildForm({ name: "", passport: "", age: "", ageUnit: "anos", relationship: "Responsável legal", additionalGuardianName: "" });
      setChildOpen(false);
      setMessage(data.message || "Solicitação enviada. O passaporte foi registrado e o vínculo aguarda validação pela Direção.");
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
      setBusy(false); setStage("login"); setPassword(""); setPatientName("Paciente"); setAccountId(""); setFollowupData(null); setPortalSection("home"); window.dispatchEvent(new Event("hpsr-patient-session-changed"));
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
    const selectedProfile = accessiblePatients.find((item) => item.passport === selectedPassport);
    const activeFollowups = followupPassport === selectedPassport ? followupData : null;
    const isChildProfile = selectedProfile?.access_type !== "self" && Boolean(selectedProfile);
    // Ordem funcional fixa; acompanhamentos específicos aparecem somente quando liberados.
    const sections = [
      { id: "request" as const, icon: ClipboardPlus, title: "Solicitar consulta", subtitle: "Peça um atendimento." },
      { id: "exam-request" as const, icon: FlaskConical, title: "Solicitar exame", subtitle: "Peça e acompanhe exames." },
      { id: "appointments" as const, icon: CalendarClock, title: "Meus agendamentos", subtitle: "Consultas e retornos." },
      { id: "followups" as const, icon: CalendarClock, title: "Horários do médico", subtitle: "Escolha um horário publicado." },
      { id: "records" as const, icon: FileHeart, title: "Prontuário e documentos", subtitle: "Seus registros liberados." },
      { id: "pending" as const, icon: AlertCircle, title: "Pendências", subtitle: "Solicitações que exigem atenção." },
      ...(showGestation ? [{ id: "gestation" as const, icon: Baby, title: "Gestação", subtitle: "Seu planejamento gestacional." }] : []),
      ...(showIVF ? [{ id: "ivf" as const, icon: HeartPulse, title: "FIV", subtitle: "Seu planejamento de FIV." }] : []),
      ...(isChildProfile ? [{ id: "vaccination" as const, icon: Syringe, title: "Vacinação", subtitle: "Caderneta infantil." }] : []),
    ];

    return (
      <div className="mx-auto max-w-7xl">
        <div className="grid min-w-0 gap-4">
          <main className="min-w-0 overflow-hidden rounded-[22px] border border-[#d6c3b0] bg-[#f4ece3] shadow-[0_11px_29px_rgba(77,50,32,.06)]">
            <div className="flex flex-col gap-3 border-b border-[#d7c6b5] bg-[#eaddcf] p-3.5 sm:p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.12em] text-hpsr-wineLight">Área do paciente</p>
                  <h2 className="mt-0.5 text-lg font-bold text-hpsr-text">Olá, {patientName}</h2>
                </div>
              </div>

              {accessiblePatients.length > 0 && <nav className="hpsr-touch-scroll flex w-full gap-2 overflow-x-auto pb-1" aria-label="Áreas do portal">
                {sections.map(({ id, icon: Icon, title }) => {
                  const active = portalSection === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => openPortalSection(id)}
                      className={`flex min-h-[42px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[12px] border px-3 py-2 text-xs font-black transition ${active ? "border-hpsr-wine bg-hpsr-wine text-white shadow-[0_2px_6px_rgba(80,39,27,.10)]" : "border-[#d5c0ac] bg-[#f7f0e9] text-hpsr-text hover:border-[#b5967f] hover:bg-[#eee0d3]"}`}
                    >
                      <Icon size={16} />
                      <span>{title}</span>
                      {id === "followups" && Boolean(activeFollowups?.agendaAvailableCount) && <span className={`ml-1 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[9px] font-black ${active ? "bg-white text-hpsr-wine" : "bg-[#537368] text-white"}`}>{activeFollowups?.agendaAvailableCount}</span>}
                    </button>
                  );
                })}
              </nav>}
            </div>

            <div className="hpsr-patient-content p-3.5 sm:p-4">
              {pendingChildLinks.length > 0 && (
                <div className="mb-3 rounded-[16px] border border-amber-200 bg-amber-50 p-3.5">
                  <p className="text-xs font-black uppercase tracking-[.13em] text-amber-800">Vínculos pediátricos aguardando validação</p>
                  <div className="mt-2 space-y-2">
                    {pendingChildLinks.map((item) => (
                      <div key={item.passport} className="rounded-[12px] border border-amber-200/80 bg-white px-3 py-2.5">
                        <p className="text-sm font-black text-hpsr-text">{item.name}</p>
                        <p className="mt-0.5 text-xs font-semibold text-hpsr-muted">{item.relationship} · {item.passport} · Aguardando a Direção</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs font-semibold leading-relaxed text-amber-900">O prontuário já foi localizado ou preparado pelo sistema, mas os dados clínicos só serão liberados após a validação.</p>
                </div>
              )}
              {!selectedPassport && <div className="mb-3 rounded-[16px] border border-[#d6c3b0] bg-[#efe3d7] p-4">
                <h3 className="text-base font-bold text-hpsr-text">Seu espaço no HP São Rafael</h3>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-hpsr-muted">Cadastre seus filhos e acompanhe a validação dos vínculos. Após a aprovação, selecione a criança no perfil do cabeçalho para acessar o prontuário.</p>
                <button type="button" onClick={() => setChildOpen(true)} className="mt-3 inline-flex min-h-[42px] items-center gap-2 rounded-[12px] bg-hpsr-wine px-4 text-xs font-black text-white"><Plus size={16}/>Cadastrar filho ou filha</button>
              </div>}
              {selectedPassport && <div ref={portalContentRef} tabIndex={-1} className="scroll-mt-24 outline-none sm:scroll-mt-20" aria-live="polite">
              {Boolean(followupData?.agendaAvailableCount) && portalSection === "home" && (
                <button type="button" onClick={() => openPortalSection("followups")} className="mb-3 flex w-full items-start gap-3 rounded-[16px] border border-[#b7c3c0] bg-[linear-gradient(135deg,#e5eae5_0%,#d9e4df_100%)] p-3.5 text-left shadow-[0_6px_16px_rgba(64,87,79,.05)]">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-[#537368] text-white"><BellRing size={18}/></span>
                  <span className="min-w-0"><strong className="block text-sm font-black text-[#304c41]">Novos horários do médico</strong><span className="mt-1 block text-xs font-semibold leading-relaxed text-[#405f53]">{followupData?.agendaAvailableCount} atendimento{followupData?.agendaAvailableCount === 1 ? "" : "s"} com horários disponíveis. Veja e confirme.</span></span>
                </button>
              )}
              {portalSection === "home" && (
                <div>
                  <div className="mb-3">
                    <h3 className="text-base font-bold text-hpsr-text">Seu espaço no HP São Rafael</h3>
                    <p className="mt-1 text-sm font-semibold leading-relaxed text-hpsr-muted">Solicite atendimentos, escolha horários publicados e consulte seus documentos. As novidades ficam no sino; os perfis infantis, no cabeçalho.</p>
                    <p className="mt-2 text-xs font-bold text-hpsr-wine">Prontuário: {selectedProfile?.name || patientName}</p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {sections.map(({ id, icon: Icon, title, subtitle }) => (
                      <button key={id} type="button" onClick={() => openPortalSection(id)} className="group flex min-h-[82px] items-start gap-3 rounded-[15px] border border-[#ddccbb] bg-[#eee3d8] p-3 text-left transition hover:border-[#b5967f] hover:bg-[#e8d9ca] hover:shadow-[0_4px_13px_rgba(76,46,32,.06)]">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[12px] border border-[#dfcab9] bg-[#dfcebe] text-hpsr-wine"><Icon size={18}/></span>
                        <span className="min-w-0">
                          <strong className="block text-sm font-bold text-hpsr-text">{title}</strong>
                          <span className="mt-0.5 block text-[11px] leading-snug text-hpsr-muted">{subtitle}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {portalSection === "appointments" && <div className="space-y-4"><PatientFollowupSummaryPanel data={activeFollowups} loading={followupLoading} error={followupError} onOpenHours={() => openPortalSection("followups")} /><PatientAppointmentsPanel key={`${selectedPassport}:scheduled`} view="scheduled" passport={selectedPassport} onSessionExpired={handleSessionExpired} onOpenRecords={() => openPortalSection("records")} /></div>}
              {portalSection === "request" && <PatientAppointmentsPanel key={`${selectedPassport}:request`} view="request" passport={selectedPassport} hasClinicalContact={accessiblePatients.find((item) => item.passport === selectedPassport)?.hasClinicalContact} onSessionExpired={handleSessionExpired} />}
              {portalSection === "followups" && <PatientFollowupsPanel key={selectedPassport} data={activeFollowups} loading={followupLoading} error={followupError} passport={selectedPassport} onRefresh={() => void loadFollowups(selectedPassport, true)} />}
              {portalSection === "exam-request" && <PatientExamRequestsPanel key={selectedPassport} passport={selectedPassport} hasClinicalContact={accessiblePatients.find((item) => item.passport === selectedPassport)?.hasClinicalContact} onSessionExpired={handleSessionExpired} />}
              {portalSection === "gestation" && showGestation && <PatientGestationalPlansPanel passport={selectedPassport} planType="gestacional" onSessionExpired={handleSessionExpired} />}
              {portalSection === "ivf" && showIVF && <PatientGestationalPlansPanel passport={selectedPassport} planType="in_vitro" onSessionExpired={handleSessionExpired} />}
              {portalSection === "records" && <PatientRecordsPanel key={`${selectedPassport}:records`} passport={selectedPassport} mode={isChildProfile ? "documents" : "all"} onSessionExpired={handleSessionExpired} />}
              {portalSection === "vaccination" && isChildProfile && <PatientRecordsPanel key={`${selectedPassport}:vaccination`} passport={selectedPassport} mode="vaccination" onSessionExpired={handleSessionExpired} />}
              {portalSection === "pending" && <PatientAppointmentsPanel key={`${selectedPassport}:pending`} view="pending" passport={selectedPassport} onSessionExpired={handleSessionExpired} onOpenRecords={() => openPortalSection("records")} />}
              {portalSection === "profile" && <PatientProfilePanel onSessionExpired={handleSessionExpired} onSaved={async () => { await checkSession(); }} />}
              </div>}
            </div>
          </main>
        </div>
        <PatientPortalHelp open={helpOpen} onOpen={() => setHelpOpen(true)} onClose={() => setHelpOpen(false)} />
      {childOpen && (
        <div className="hpsr-modal-tone fixed inset-0 z-[1200] flex items-end justify-center bg-[#2a0700]/55 p-0 sm:items-center sm:p-4">
          <form onSubmit={createChild} className="flex max-h-[94dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[24px] bg-white shadow-2xl sm:max-h-[88dvh] sm:rounded-[24px]">
            <div className="flex items-start justify-between bg-hpsr-wine px-5 py-4 text-white">
              <div><p className="text-[10px] font-black uppercase tracking-[.16em] text-white/65">Fluxo pediátrico</p><h3 className="mt-1 text-xl font-black">Solicitar vínculo da criança</h3></div>
              <button type="button" onClick={() => setChildOpen(false)} className="grid h-9 w-9 place-items-center rounded-[11px] border border-white/20 bg-white/10"><X size={17}/></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5"><div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nome da criança"><input className="portal-input" value={childForm.name} onChange={(e)=>setChildForm((c)=>({...c,name:e.target.value}))} required /></Field>
              <Field label="Passaporte"><input className="portal-input uppercase" value={childForm.passport} onChange={(e)=>setChildForm((c)=>({...c,passport:e.target.value.toUpperCase()}))} required /></Field>
              <Field label="Idade da criança">
                <div className="flex gap-2">
                  <input inputMode="numeric" min="0" max="999" className="portal-input min-w-0 flex-1" placeholder="Ex.: 8" value={childForm.age} onChange={(e)=>setChildForm(c=>({...c,age:e.target.value.replace(/\D/g,"").slice(0,3)}))} required />
                  <StyledSelect className="portal-input w-32" value={childForm.ageUnit} onChange={(e)=>setChildForm(c=>({...c,ageUnit:e.target.value}))}><option value="meses">meses</option><option value="anos">anos</option></StyledSelect>
                </div>
              </Field>
              <Field label="Seu vínculo com a criança"><StyledSelect className="portal-input" value={childForm.relationship} onChange={(e)=>setChildForm(c=>({...c,relationship:e.target.value}))}><option>Mãe</option><option>Pai</option><option>Tutor</option><option>Responsável legal</option><option>Outro</option></StyledSelect></Field>
              <Field label="Outro responsável (opcional)"><input className="portal-input" value={childForm.additionalGuardianName} placeholder="Nome do outro responsável" onChange={(e)=>setChildForm(c=>({...c,additionalGuardianName:e.target.value}))}/><span className="mt-1 block text-xs text-hpsr-muted">Informar o nome não concede acesso. Cada responsável deve ter sua própria conta e autorização.</span></Field>
              <p className="sm:col-span-2 rounded-[14px] border border-hpsr-border bg-[#fffaf4] p-3 text-xs font-semibold text-hpsr-muted">Informe o passaporte único do RP. Se a criança já tem prontuário, ele será preservado. A equipe confirma o vínculo fora do sistema, pelo Discord ou durante o RP; somente a Direção libera o acesso.</p>
            </div></div>
            <div className="flex shrink-0 gap-3 border-t border-hpsr-border bg-[#fffaf4] p-4"><button type="button" onClick={()=>setChildOpen(false)} className="min-h-[44px] flex-1 rounded-[13px] border border-hpsr-border bg-white text-sm font-black">Cancelar</button><button disabled={busy} type="submit" className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-[13px] bg-hpsr-wine text-sm font-black text-white disabled:opacity-50">{busy?<Loader2 size={16} className="animate-spin"/>:<Baby size={16}/>}Enviar para validação</button></div>
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
            <button onClick={() => { setStage("login"); clearFeedback(); }} className={`min-h-[44px] rounded-[12px] px-4 text-sm font-black transition ${stage === "login" ? "bg-hpsr-wine text-white shadow-sm" : "text-hpsr-muted hover:bg-[#fff7ef]"}`}>Login</button>
            <button onClick={() => { setStage("register"); clearFeedback(); }} className={`min-h-[44px] rounded-[12px] px-4 text-sm font-black transition ${stage === "register" ? "bg-hpsr-wine text-white shadow-sm" : "text-hpsr-muted hover:bg-[#fff7ef]"}`}>Cadastro</button>
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
                  <h3 className="text-[1.3rem] font-black leading-tight text-hpsr-text">Acesse sua conta</h3>
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

              <button onClick={login} disabled={busy || !email.trim() || !password} className="mt-6 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[18px] bg-hpsr-wine px-5 text-sm font-black text-white shadow-[0_14px_30px_rgba(103,38,20,.16)] transition hover:brightness-105 disabled:opacity-50">{busy ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />} Acessar Portal</button>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button onClick={recoverPassword} disabled={busy} className="min-h-[42px] rounded-[13px] border border-hpsr-border bg-white px-3 text-center text-sm font-black text-hpsr-wineLight transition hover:border-hpsr-wine/30 hover:text-hpsr-wine">Esqueci minha senha</button>
                <button type="button" onClick={() => { clearFeedback(); setRecoveryOpen(true); }} disabled={busy} className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[13px] border border-hpsr-border bg-[#fffaf4] px-3 text-center text-sm font-black text-hpsr-wine transition hover:border-hpsr-wine/30"><MailX size={15}/>Não acesso meu e-mail</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[28px] border border-hpsr-border bg-[linear-gradient(180deg,#ffffff_0%,#fffaf4_100%)] p-6 shadow-[0_18px_36px_rgba(82,48,27,.06)] sm:p-7">
            <div className="flex items-start gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-hpsr-wine text-white shadow-[0_12px_28px_rgba(103,38,20,.18)]"><UserPlus size={23} /></div>
              <div>
                <p className="text-xs font-black uppercase tracking-[.14em] text-hpsr-wineLight">Novo acesso</p>
                <h3 className="text-[1.35rem] font-black leading-tight text-hpsr-text">{registrationType === "guardian" ? "Criar conta de responsável" : "Criar conta do paciente"}</h3>
                <p className="mt-1 max-w-2xl text-sm font-semibold leading-relaxed text-hpsr-muted">Cadastre seu acesso para consultar atendimentos, exames, documentos e demais informações liberadas no Portal do Paciente.</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 rounded-[15px] bg-[#f4e9df] p-2">
              <button type="button" onClick={()=>{setRegistrationType("patient");clearFeedback();}} className={`min-h-[42px] flex-1 rounded-[12px] px-3 text-sm font-black ${registrationType==="patient"?"bg-hpsr-wine text-white":"bg-white text-hpsr-wine"}`}>Sou paciente</button>
              <button type="button" onClick={()=>{setRegistrationType("guardian");clearFeedback();}} className={`min-h-[42px] flex-1 rounded-[12px] px-3 text-sm font-black ${registrationType==="guardian"?"bg-hpsr-wine text-white":"bg-white text-hpsr-wine"}`}>Sou responsável</button>
            </div>
            {registrationType === "patient" &&             <div className="mt-5 grid gap-3 rounded-[20px] border border-hpsr-border bg-white/92 p-4 sm:grid-cols-3">
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
            </div>}
            <div className="mt-5 rounded-[22px] border border-hpsr-border bg-white p-5 shadow-[0_10px_24px_rgba(82,48,27,.04)]">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-hpsr-border pb-3">
                <div>
                  <h4 className="text-base font-black text-hpsr-text">Dados do cadastro</h4>
                  <p className="text-sm font-semibold text-hpsr-muted">{registrationType === "guardian" ? "Uma conta própria para cadastrar seus filhos, sem precisar de prontuário." : "Preencha as informações para criar sua conta de paciente."}</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome completo" wide><input value={register.name} onChange={(e) => setRegister(v => ({...v, name:e.target.value}))} className="portal-input" /></Field>
              {registrationType === "patient" && <><Field label="Passaporte"><input value={register.passport} onChange={(e) => setRegister(v => ({...v, passport:e.target.value}))} className="portal-input" /></Field>
              <Field label="Idade"><input inputMode="numeric" value={register.age} onChange={(e) => setRegister(v => ({...v, age:e.target.value}))} className="portal-input" /></Field>
              <Field label="Tipo sanguíneo"><StyledSelect value={register.bloodType} onChange={(e) => setRegister(v => ({...v, bloodType:e.target.value}))} className="portal-input"><option value="">Selecione</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option></StyledSelect></Field></>}
              {registrationType === "patient" && isMinorRegistration && <p className="sm:col-span-2 rounded-[14px] border border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-900">Para cadastrar uma criança, utilize a conta do responsável. A criança não precisa de conta própria.</p>}
              {registrationType === "patient" && <><Field label="Telefone"><input inputMode="numeric" maxLength={13} placeholder="(055) 626-323" value={register.phone} onChange={(e) => setRegister(v => ({...v, phone:formatCityPhoneNumber(e.target.value)}))} className="portal-input" /></Field>
              <Field label="ID do Discord"><input inputMode="numeric" placeholder="ID numérico do seu perfil" value={register.discord} onChange={(e) => setRegister(v => ({...v, discord:normalizeDiscordId(e.target.value)}))} className="portal-input" /><span className="mt-1.5 block text-[11px] font-semibold text-hpsr-muted">Preferencial para contato da equipe. Use o ID do perfil/usuário do Discord, não o passaporte da cidade.</span></Field></>}
              <Field label="E-mail da conta" wide><input type="email" autoComplete="email" value={register.email} onChange={(e) => setRegister(v => ({...v, email:e.target.value}))} className="portal-input" /><span className="mt-1.5 block text-[11px] font-semibold leading-relaxed text-hpsr-muted">Este e-mail é usado somente para acesso, recuperação de senha e funções do sistema. Para atendimento, a equipe usa o telefone da cidade ou o ID do Discord.</span></Field>
              <Field label="Senha"><input type="password" autoComplete="new-password" value={register.password} onChange={(e) => setRegister(v => ({...v, password:e.target.value}))} className="portal-input" minLength={6} placeholder="Mínimo de 6 caracteres" /></Field>
              <Field label="Confirmar senha"><input type="password" autoComplete="new-password" value={register.confirmation} minLength={6} onChange={(e) => setRegister(v => ({...v, confirmation:e.target.value}))} className="portal-input" /></Field>
              </div>
            </div>
            <button onClick={createAccount} disabled={busy || !register.name || (registrationType === "patient" && !register.passport) || !register.email || !register.password || !register.confirmation} className="mt-5 inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-[16px] bg-hpsr-wine px-4 text-sm font-black text-white shadow-[0_12px_28px_rgba(103,38,20,.16)] transition hover:brightness-105 disabled:opacity-50">{busy ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />} Criar conta</button>
          </div>
        )}

        {message && <p className="mt-5 rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">{message}</p>}
        {error && <p className="mt-5 rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">{error}</p>}
      </div>
    </div>
    {recoveryOpen && (
      <PatientEmailRecoveryModal
        onClose={() => setRecoveryOpen(false)}
        onRecovered={(loginEmail, successMessage) => {
          if (loginEmail) {
            setEmail(loginEmail);
            try { window.localStorage.setItem(PATIENT_EMAIL_STORAGE_KEY, loginEmail); } catch {}
          }
          setPassword("");
          setMessage(successMessage);
        }}
      />
    )}
    <PatientPortalHelp open={helpOpen} onOpen={() => setHelpOpen(true)} onClose={() => setHelpOpen(false)} />
    </>
  );
}

function PatientPortalHelp({ open, onOpen, onClose }: { open: boolean; onOpen: () => void; onClose: () => void }) {
  const items = [
    { icon: ClipboardPlus, title: "Solicitar consulta", text: "Peça uma consulta nova. Depois, o médico combina o dia e o horário com você." },
    { icon: CalendarClock, title: "Horários do médico", text: "É aqui que aparecem os horários publicados pelo seu médico. Escolha e confirme um deles." },
    { icon: HeartPulse, title: "Meus agendamentos", text: "Veja seus acompanhamentos e tudo que já foi confirmado ou combinado com os médicos." },
    { icon: FlaskConical, title: "Solicitar exame", text: "Peça um exame. Isso não cria uma consulta." },
    { icon: FileHeart, title: "Meu prontuário", text: "Veja exames, documentos e registros liberados para você." },
    { icon: AlertCircle, title: "Pendências", text: "Veja se existe algum aviso ou ajuste em andamento." },
    { icon: UserRound, title: "Meus dados", text: "Atualize seus dados de contato e sua senha." },
  ];

  return (
    <>
      <button type="button" onClick={onOpen} className="fixed bottom-4 right-4 z-[1100] inline-flex min-h-[44px] items-center gap-2 rounded-full border border-hpsr-border bg-hpsr-wine px-4 text-sm font-black text-white shadow-[0_14px_34px_rgba(82,48,27,.24)] transition hover:brightness-105 sm:bottom-5 sm:right-5">
        <HelpCircle size={17}/> Como usar
      </button>
      {open && (
        <div className="hpsr-modal-tone fixed inset-0 z-[1250] flex items-center justify-center bg-[#1f0805]/60 p-3 sm:p-5" role="dialog" aria-modal="true" aria-label="Como usar o Portal do Paciente">
          <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[22px] border border-hpsr-border bg-white shadow-2xl sm:max-h-[88dvh] sm:rounded-[26px]">
            <div className="shrink-0 border-b border-hpsr-border bg-[linear-gradient(135deg,#fffaf4_0%,#fff2e6_100%)] px-4 py-4 sm:px-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-hpsr-border bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[.12em] text-hpsr-wine"><HelpCircle size={12}/> Ajuda rápida</span>
                  <h3 className="mt-2 text-lg font-black text-hpsr-text sm:text-xl">Como usar o Portal</h3>
                  <p className="mt-1 max-w-xl text-xs font-semibold leading-relaxed text-hpsr-muted sm:text-sm">Escolha o que você precisa. Cada área tem uma função simples.</p>
                </div>
                <button type="button" onClick={onClose} aria-label="Fechar" className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] border border-hpsr-border bg-white text-hpsr-wine shadow-sm"><X size={17}/></button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3.5 sm:p-5">
              <div className="grid gap-2 sm:grid-cols-2">
                {items.map(({ icon: Icon, title, text }, index) => (
                  <div key={title} className={`flex items-start gap-3 rounded-[15px] border p-3.5 ${index === 1 ? "border-blue-200 bg-blue-50/80" : "border-hpsr-border bg-[#fffaf4]"}`}>
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-[11px] shadow-sm ${index === 1 ? "bg-[#537368] text-white" : "bg-white text-hpsr-wine"}`}><Icon size={17}/></span>
                    <div className="min-w-0"><p className="text-sm font-black text-hpsr-text">{title}</p><p className="mt-1 text-[11px] font-semibold leading-relaxed text-hpsr-muted sm:text-xs">{text}</p></div>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-[15px] border border-blue-200 bg-blue-50 px-3.5 py-3">
                <p className="text-xs font-black text-[#304c41]">Onde vejo os horários?</p>
                <p className="mt-1 text-[11px] font-semibold leading-relaxed text-[#405f53] sm:text-xs"><strong>Horários do médico</strong> é onde aparecem os horários que ele publicou para você escolher. Depois de confirmar, o atendimento aparece em <strong>Meus agendamentos</strong>.</p>
              </div>
            </div>
            <div className="shrink-0 border-t border-hpsr-border bg-white p-3 sm:p-4">
              <button type="button" onClick={onClose} className="inline-flex min-h-[44px] w-full items-center justify-center rounded-[13px] bg-hpsr-wine px-4 text-sm font-black text-white shadow-sm">Entendi</button>
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
