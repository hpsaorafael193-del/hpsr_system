"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import dynamic from "next/dynamic";
import {
  AlertCircle, ArrowRight, Baby, BellRing, CalendarClock, CalendarDays, CheckCircle2, ClipboardList, ClipboardPlus, FileHeart, FileText, FlaskConical, HeartPulse, HelpCircle, Home, Syringe,
  Loader2, LockKeyhole, LogIn, MailX, Plus, ShieldCheck, Trash2, UserPlus, UserRound, Users, X,
  type LucideIcon,
} from "lucide-react";
import { PatientGestationalPlansPanel } from "@/components/public/PatientGestationalPlansPanel";
import { PatientFollowupFormsPanel } from "@/components/public/PatientFollowupFormsPanel";
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
type PortalSection = "home" | "consultations" | "exams" | "documents" | "accompaniment" | "family" | "appointments" | "request" | "followups" | "exam-request" | "records" | "gestation" | "ivf" | "vaccination" | "pending" | "profile";
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
    const activeName = selectedProfile?.name || patientName;

    const quickAccess = [
      { id: "home" as const, icon: Home, title: "Início" },
      { id: "consultations" as const, icon: CalendarDays, title: "Consultas" },
      { id: "exams" as const, icon: FlaskConical, title: "Exames" },
      { id: "documents" as const, icon: FileText, title: "Documentos" },
      { id: "accompaniment" as const, icon: HeartPulse, title: "Acompanhamento" },
    ];

    const nextAppointment = activeFollowups?.followups
      .filter((item) => item.nextOccurrence?.scheduleState === "scheduled" && item.nextOccurrence.scheduledAt)
      .sort((a, b) => new Date(a.nextOccurrence?.scheduledAt || 0).getTime() - new Date(b.nextOccurrence?.scheduledAt || 0).getTime())[0];
    const nextAppointmentDate = nextAppointment?.nextOccurrence?.scheduledAt ? new Date(nextAppointment.nextOccurrence.scheduledAt) : null;
    const nextAppointmentValid = Boolean(nextAppointmentDate && !Number.isNaN(nextAppointmentDate.getTime()));

    const goToProfile = (passport: string) => {
      const match = accessiblePatients.find((item) => item.passport === passport);
      if (!match) return;
      setSelectedPassport(match.passport);
      openPortalSection("home");
    };

    return (
      <div className="w-full px-1.5 pb-5 pt-3 sm:px-3 sm:pt-4 lg:px-4 xl:px-5">
        <div className="overflow-hidden bg-[#f2ebe3] shadow-[0_10px_28px_rgba(66,39,25,.045)] lg:rounded-[16px]">
          {selectedPassport ? (
            <>
              <section className={`grid border-b border-[#ded0c3] lg:grid-cols-[43%_57%] ${isChildProfile ? "min-h-[278px]" : "min-h-[240px]"}`}>
                <div className={`flex flex-col justify-center bg-[radial-gradient(circle_at_15%_15%,rgba(255,250,244,.76),transparent_36%),linear-gradient(120deg,#f4ede4_0%,#ebe1d6_100%)] px-6 sm:px-9 lg:px-10 ${isChildProfile ? "py-7 lg:py-8" : "py-6 lg:py-7"}`}>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[.18em] text-[#8c6d5c]">{isChildProfile ? "Portal da criança" : "Portal do Paciente"}</p>
                  <h1 className="max-w-[650px] text-[clamp(2rem,4vw,3.25rem)] font-black leading-[1.02] tracking-[-.04em] text-[#4c281b]">{isChildProfile ? `Cuidando de ${activeName}, com tudo no lugar certo.` : "Cuidado humanizado, com mais praticidade."}</h1>
                  <p className="mt-3 max-w-xl text-[clamp(.95rem,1.35vw,1.08rem)] font-medium leading-relaxed text-[#7e7168]">{isChildProfile ? `Consultas, exames, documentos e solicitações deste perfil são sempre relacionados a ${activeName}.` : "Resolva pelo Portal o que não precisa esperar sua ida ao hospital."}</p>
                  {isChildProfile && <div className="mt-4 flex w-fit max-w-full items-center gap-3 rounded-[12px] border border-[#cdb8a9] bg-[#f8eee5] px-3.5 py-2.5 shadow-[0_8px_20px_rgba(83,39,27,.05)]"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#672614] text-white"><Baby size={16}/></span><span className="min-w-0"><strong className="block truncate text-xs font-black text-[#4e291c]">Perfil infantil ativo: {activeName}</strong><span className="mt-0.5 block text-[11px] font-semibold text-[#846f63]">Tudo o que você fizer agora será para esta criança.</span></span></div>}
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button type="button" onClick={() => openPortalSection("followups")} className="inline-flex min-h-[46px] items-center justify-center gap-3 rounded-[8px] bg-[#65331f] px-7 text-sm font-black text-white transition hover:brightness-105">{isChildProfile ? `Escolher horário para ${activeName}` : "Escolher um horário"} <ArrowRight size={18}/></button>
                    <button type="button" onClick={() => openPortalSection("request")} className="inline-flex min-h-[46px] items-center justify-center gap-3 rounded-[8px] border border-[#704630] bg-transparent px-7 text-sm font-black text-[#5f321f] transition hover:bg-[#fbf4ec]/80">{isChildProfile ? `Pedir consulta para ${activeName}` : "Pedir nova consulta"} <ArrowRight size={18}/></button>
                  </div>
                  <p className="mt-2 max-w-xl text-[11px] font-semibold leading-relaxed text-[#8a786d]">Já recebeu horários do médico? <strong className="text-[#5f321f]">Escolha um horário.</strong> Ainda precisa pedir atendimento? <strong className="text-[#5f321f]">Peça uma consulta.</strong></p>
                </div>
                <div className="relative min-h-[210px] overflow-hidden bg-[#eadfd6] lg:min-h-[240px]">
                  <div className="absolute inset-0 scale-[1.012] bg-[url('/portal-paciente-banner.webp')] bg-cover bg-center filter saturate-[.72] contrast-[1.12] brightness-[.94]" />
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(76,25,18,.66)_0%,rgba(103,38,20,.42)_18%,rgba(103,38,20,.20)_42%,rgba(103,38,20,.06)_68%,rgba(103,38,20,0)_100%)]" />
                  <div className="absolute inset-y-0 left-0 w-[22%] bg-[linear-gradient(90deg,rgba(76,25,18,.50)_0%,rgba(103,38,20,.22)_55%,rgba(103,38,20,0)_100%)]" />
                  <div className="absolute inset-x-0 bottom-0 h-[16%] bg-[linear-gradient(0deg,rgba(88,32,21,.14),rgba(88,32,21,0))]" />
                </div>
              </section>

              {isChildProfile && (
                <section className="flex flex-col gap-3 border-b border-[#d8c5b8] bg-[#eaded3] px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#672614] text-white"><Baby size={17}/></span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[.15em] text-[#8b6758]">Você está cuidando de</p>
                      <p className="truncate text-sm font-black text-[#4e291c]">{activeName}</p>
                    </div>
                    <span className="hidden h-7 w-px bg-[#ccb7a9] sm:block" />
                    <p className="hidden text-xs font-semibold text-[#79675d] sm:block">Todas as áreas abaixo usam os dados desta criança.</p>
                  </div>
                  <button type="button" onClick={() => openPortalSection("family")} className="inline-flex min-h-[38px] shrink-0 items-center justify-center gap-2 rounded-[8px] border border-[#b99c8b] bg-[#f8efe7] px-3.5 text-xs font-black text-[#672614] transition hover:bg-[#f3e6db]"><Users size={14}/> Trocar perfil</button>
                </section>
              )}

              <section className="grid border-b border-[#ded0c3] bg-[#f6efe7] sm:grid-cols-2 lg:grid-cols-5">
                {quickAccess.map(({ id, icon: Icon, title }, index) => (
                  <button key={`${title}-${index}`} type="button" onClick={() => openPortalSection(id)} className="group flex min-h-[76px] items-center gap-4 border-b border-[#ded0c3] px-6 py-4 text-left transition hover:bg-[#eee5dc] sm:[&:nth-child(odd)]:border-r lg:border-b-0 lg:border-r lg:[&:nth-child(odd)]:border-r lg:last:border-r-0">
                    <Icon size={26} strokeWidth={1.7} className="shrink-0 text-[#672614]"/>
                    <strong className="min-w-0 flex-1 text-[15px] font-bold text-[#4f2c20]">{title}</strong><ArrowRight size={15} className="text-[#672614]"/>
                  </button>
                ))}
              </section>

              <main ref={portalContentRef} tabIndex={-1} className="scroll-mt-24 outline-none" aria-live="polite">
                {pendingChildLinks.length > 0 && (
                  <div className="mx-5 mt-5 border-l-4 border-amber-500 bg-amber-50 px-4 py-3 sm:mx-8">
                    <p className="text-sm font-black text-amber-900">Cadastro de criança aguardando validação</p>
                    <p className="mt-1 text-xs font-semibold leading-relaxed text-amber-900/80">A equipe do Hospital São Rafael precisa confirmar o vínculo antes de liberar as informações da criança.</p>
                  </div>
                )}

                {portalSection === "home" && (
                  <div className="px-6 py-8 sm:px-10 lg:px-12 lg:py-10">
                    <div className="grid gap-5 lg:grid-cols-[1.08fr_.92fr]">
                      <section className="rounded-[18px] border border-[#ddcfc2] bg-[#f6efe7] p-5 sm:p-6">
                        <div className="flex items-center justify-between gap-3">
                          <div><p className="text-[11px] font-black uppercase tracking-[.15em] text-[#927566]">Próximo atendimento</p><h2 className="mt-1 text-[clamp(1.45rem,2.4vw,1.9rem)] font-bold text-[#4e291c]">{nextAppointment ? (isChildProfile ? `Próxima consulta de ${activeName}` : "Sua próxima consulta") : (isChildProfile ? `Nenhuma consulta confirmada para ${activeName}` : "Nenhuma consulta confirmada")}</h2></div>
                          <CalendarDays size={25} className="text-[#672614]"/>
                        </div>
                        {nextAppointment && nextAppointmentDate && nextAppointmentValid ? <div className="mt-5 flex flex-col gap-5 border-t border-[#ddcfc2] pt-5 sm:flex-row sm:items-center">
                          <div className="min-w-[88px] border-b border-[#ddcfc2] pb-4 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-5"><strong className="block text-4xl leading-none text-[#4e291c]">{nextAppointmentDate.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit" })}</strong><span className="mt-1 block text-sm font-black uppercase text-[#6d4435]">{nextAppointmentDate.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", month: "short" }).replace(".", "")}</span></div>
                          <div className="min-w-0 flex-1"><p className="text-lg font-bold text-[#4e291c]">{nextAppointment.doctorName}</p><p className="mt-1 text-sm text-[#82736a]">{nextAppointment.specialty}</p><p className="mt-2 text-xs font-semibold text-[#672614]">{nextAppointmentDate.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long", hour: "2-digit", minute: "2-digit" })}</p></div>
                          <button type="button" onClick={() => openPortalSection("appointments")} className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[8px] border border-[#672614] px-4 text-xs font-black text-[#672614]">Ver detalhes <ArrowRight size={15}/></button>
                        </div> : <div className="mt-5 flex items-center justify-between gap-4 border-t border-[#ddcfc2] pt-5"><p className="text-sm text-[#82736a]">Quando uma consulta for confirmada, ela aparece aqui.</p><button type="button" onClick={() => openPortalSection("consultations")} className="text-xs font-black text-[#672614] underline underline-offset-4">Ver consultas</button></div>}
                      </section>

                      <section className="rounded-[18px] border border-[#ddcfc2] bg-[#f6efe7] p-5 sm:p-6">
                        <div className="flex items-center justify-between gap-3"><div><p className="text-[11px] font-black uppercase tracking-[.15em] text-[#927566]">Ações rápidas</p><h2 className="mt-1 text-[clamp(1.45rem,2.4vw,1.9rem)] font-bold text-[#4e291c]">O que você precisa?</h2></div><ArrowRight size={22} className="text-[#672614]"/></div>
                        <div className="mt-4 divide-y divide-[#ddcfc2] border-t border-[#ddcfc2]">
                          <button type="button" onClick={() => openPortalSection("followups")} className="flex w-full items-center gap-3 py-3.5 text-left"><CalendarClock size={19} className="text-[#672614]"/><strong className="flex-1 text-sm text-[#4d291d]">{isChildProfile ? `Escolher horário para ${activeName}` : "Escolher horário do médico"}</strong><ArrowRight size={15}/></button>
                          <button type="button" onClick={() => openPortalSection("request")} className="flex w-full items-center gap-3 py-3.5 text-left"><ClipboardPlus size={19} className="text-[#672614]"/><strong className="flex-1 text-sm text-[#4d291d]">{isChildProfile ? `Pedir consulta para ${activeName}` : "Pedir nova consulta"}</strong><ArrowRight size={15}/></button>
                          <button type="button" onClick={() => openPortalSection("exam-request")} className="flex w-full items-center gap-3 py-3.5 text-left"><FlaskConical size={19} className="text-[#672614]"/><strong className="flex-1 text-sm text-[#4d291d]">{isChildProfile ? `Pedir exame para ${activeName}` : "Pedir exame"}</strong><ArrowRight size={15}/></button>
                        </div>
                      </section>
                    </div>

                    {Boolean(activeFollowups?.agendaAvailableCount) && <button type="button" onClick={() => openPortalSection("followups")} className="mt-5 flex w-full items-center gap-3 rounded-[14px] border border-[#d8c1b3] bg-[#f3e7df] px-4 py-3 text-left"><BellRing size={18} className="text-[#672614]"/><strong className="flex-1 text-sm text-[#672614]">Seu médico publicou novos horários.</strong><span className="text-xs font-black text-[#672614]">Escolher <ArrowRight size={13} className="inline"/></span></button>}

                    <div className="mt-5 grid gap-5 lg:grid-cols-[1.08fr_.92fr]">
                      <section className="rounded-[18px] border border-[#ddcfc2] bg-[#f6efe7] p-5 sm:p-6">
                        <div className="flex items-center justify-between gap-3"><div><p className="text-[11px] font-black uppercase tracking-[.15em] text-[#927566]">Meu acompanhamento</p><h2 className="mt-1 text-xl font-bold text-[#4e291c]">Seu cuidado, etapa por etapa</h2></div><HeartPulse size={24} className="text-[#672614]"/></div>
                        {showGestation || showIVF ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{showGestation && <button type="button" onClick={() => openPortalSection("gestation")} className="flex items-center gap-3 rounded-[14px] border border-[#ddcfc2] bg-[#fcf8f3] px-4 py-4 text-left"><Baby size={21} className="text-[#672614]"/><span className="flex-1"><strong className="block text-sm text-[#4e291c]">Gestação</strong><span className="mt-1 block text-xs text-[#82736a]">Ver planejamento</span></span><ArrowRight size={15}/></button>}{showIVF && <button type="button" onClick={() => openPortalSection("ivf")} className="flex items-center gap-3 rounded-[14px] border border-[#ddcfc2] bg-[#fcf8f3] px-4 py-4 text-left"><HeartPulse size={21} className="text-[#672614]"/><span className="flex-1"><strong className="block text-sm text-[#4e291c]">Fertilização in vitro</strong><span className="mt-1 block text-xs text-[#82736a]">Ver etapas</span></span><ArrowRight size={15}/></button>}</div> : <p className="mt-4 text-sm text-[#82736a]">Nenhum acompanhamento liberado no momento.</p>}
                      </section>

                      <section className="rounded-[18px] border border-[#ddcfc2] bg-[#f6efe7] p-5 sm:p-6">
                        <div className="flex items-center justify-between gap-3"><div><p className="text-[11px] font-black uppercase tracking-[.15em] text-[#927566]">Minha família</p><h2 className="mt-1 text-xl font-bold text-[#4e291c]">Crianças vinculadas</h2></div><Users size={24} className="text-[#672614]"/></div>
                        <div className="mt-4 flex flex-wrap gap-2">{accessiblePatients.filter((item) => item.access_type !== "self").slice(0, 3).map((item) => <button type="button" key={item.passport} onClick={() => goToProfile(item.passport)} className="rounded-full border border-[#ddcfc2] bg-[#fcf8f3] px-3 py-2 text-xs font-bold text-[#4e291c]">{item.name}</button>)}{!accessiblePatients.some((item) => item.access_type !== "self") && <span className="text-xs text-[#82736a]">Nenhuma criança vinculada.</span>}</div>
                        <button type="button" onClick={() => setChildOpen(true)} className="mt-4 inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-[8px] bg-[#65331f] px-4 text-sm font-black text-white"><Plus size={16}/> Cadastrar criança</button>
                      </section>
                    </div>
                  </div>
                )}

                {portalSection === "consultations" && <PortalChoicePage eyebrow="Consultas" title="O que você quer fazer?" description="Escolha uma opção. Pedir uma consulta e confirmar um horário são ações diferentes.">
                  <PortalChoice icon={CalendarClock} title="Escolher um horário" text="Seu médico já disponibilizou horários? Entre aqui para escolher uma opção e confirmar." emphasis onClick={() => openPortalSection("followups")} />
                  <PortalChoice icon={ClipboardPlus} title="Pedir nova consulta" text="Use quando você precisa solicitar um novo atendimento. O pedido não confirma data nem horário." onClick={() => openPortalSection("request")} />
                  <PortalChoice icon={CheckCircle2} title="Minhas consultas" text="Veja consultas já confirmadas, retornos e histórico de atendimentos." onClick={() => openPortalSection("appointments")} />
                  <PortalChoice icon={AlertCircle} title="Pedidos em andamento" text="Acompanhe solicitações que ainda dependem de análise ou resposta da equipe." onClick={() => openPortalSection("pending")} />
                </PortalChoicePage>}

                {portalSection === "exams" && <div className="px-5 py-7 sm:px-8 lg:px-10"><div className="mb-6 flex flex-col gap-3 border-b border-[#ddcfc2] pb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[11px] font-black uppercase tracking-[.15em] text-[#927566]">Exames</p><h2 className="mt-1 text-2xl font-bold text-[#4e291c]">Seus exames em um só lugar</h2><p className="mt-2 text-sm text-[#82736a]">Peça um novo exame ou consulte resultados que já foram liberados pela equipe.</p></div><button type="button" onClick={() => openPortalSection("exam-request")} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[8px] bg-[#65331f] px-5 text-sm font-black text-white"><Plus size={16}/> Pedir um exame</button></div><PatientRecordsPanel key={`${selectedPassport}:exams`} passport={selectedPassport} mode="exams" onSessionExpired={handleSessionExpired}/></div>}

                {portalSection === "documents" && <div className="px-5 py-7 sm:px-8 lg:px-10"><div className="mb-5 border-b border-[#ddcfc2] pb-5"><p className="text-[11px] font-black uppercase tracking-[.15em] text-[#927566]">Documentos</p><h2 className="mt-1 text-2xl font-bold text-[#4e291c]">Receitas e documentos</h2><p className="mt-2 text-sm text-[#82736a]">Aqui ficam receitas, atestados, laudos e outros documentos liberados para você.</p></div><PatientRecordsPanel key={`${selectedPassport}:documents`} passport={selectedPassport} mode="documents" onSessionExpired={handleSessionExpired}/></div>}

                {portalSection === "accompaniment" && <div className="px-5 py-7 sm:px-8 lg:px-10">
                  <SectionIntro eyebrow="Acompanhamento" title="Meu acompanhamento" text="Planejamentos, etapas e formulários enviados pela sua equipe ficam reunidos aqui."/>
                  <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
                    <section className="rounded-[18px] border border-[#ddcfc2] bg-[#f6efe7] p-5">
                      <p className="text-[11px] font-black uppercase tracking-[.14em] text-[#927566]">Planos de cuidado</p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {showGestation && <button type="button" onClick={() => openPortalSection("gestation")} className="flex min-h-[96px] items-center gap-4 rounded-[14px] border border-[#ddcfc2] bg-[#fcf8f3] px-4 text-left"><Baby size={25} className="text-[#672614]"/><span className="flex-1"><strong className="block text-base text-[#4e291c]">Gestação</strong><span className="mt-1 block text-xs text-[#82736a]">Planejamento e etapas</span></span><ArrowRight size={16}/></button>}
                        {showIVF && <button type="button" onClick={() => openPortalSection("ivf")} className="flex min-h-[96px] items-center gap-4 rounded-[14px] border border-[#ddcfc2] bg-[#fcf8f3] px-4 text-left"><HeartPulse size={25} className="text-[#672614]"/><span className="flex-1"><strong className="block text-base text-[#4e291c]">Fertilização in vitro</strong><span className="mt-1 block text-xs text-[#82736a]">Planejamento e etapas</span></span><ArrowRight size={16}/></button>}
                        {!showGestation && !showIVF && <div className="sm:col-span-2 rounded-[14px] border border-dashed border-[#d7c8ba] px-4 py-8 text-center"><HeartPulse size={25} className="mx-auto text-[#672614]"/><p className="mt-2 text-sm font-bold text-[#4e291c]">Nenhum plano liberado</p></div>}
                      </div>
                    </section>
                    <section className="rounded-[18px] border border-[#ddcfc2] bg-[#f4eee7] p-5">
                      <div className="mb-4 flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#e5ded5] text-[#672614]"><ClipboardList size={19}/></span><div><p className="text-[11px] font-black uppercase tracking-[.14em] text-[#927566]">Fichas</p><h3 className="mt-1 text-lg font-bold text-[#4e291c]">Fichas do acompanhamento</h3><p className="mt-1 text-xs text-[#82736a]">Quando sua equipe solicitar uma atualização, ela aparecerá aqui.</p></div></div>
                      <PatientFollowupFormsPanel passport={selectedPassport} onSessionExpired={handleSessionExpired}/>
                    </section>
                  </div>
                </div>}

                {portalSection === "family" && <div className="px-5 py-7 sm:px-8 lg:px-10"><div className="border-b border-[#ddcfc2] pb-5"><p className="text-[11px] font-black uppercase tracking-[.15em] text-[#927566]">Minha família</p><h2 className="mt-1 text-2xl font-bold text-[#4e291c]">Escolha quem você está cuidando</h2><p className="mt-2 text-sm text-[#82736a]">Cada pessoa tem suas próprias consultas, exames e documentos. Ao trocar aqui, todo o Portal passa a mostrar apenas os dados dela.</p></div><div className="mt-5 divide-y divide-[#ddcfc2] border-y border-[#ddcfc2]">{accessiblePatients.map((item) => <button key={item.passport} type="button" onClick={() => goToProfile(item.passport)} className="flex w-full items-center gap-4 py-4 text-left"><span className="grid h-11 w-11 place-items-center rounded-full bg-[#eee2d5] text-[#65331f]">{item.access_type === "self" ? <UserRound size={19}/> : <Baby size={19}/>}</span><span className="min-w-0 flex-1"><strong className="block truncate text-sm text-[#4e291c]">{item.name}</strong><span className="mt-1 block text-xs text-[#82736a]">{item.access_type === "self" ? "Minha conta" : "Criança vinculada"}</span></span>{item.passport === selectedPassport ? <span className="text-xs font-black text-[#672614]">Selecionado</span> : <ArrowRight size={17}/>}</button>)}</div><button type="button" onClick={() => setChildOpen(true)} className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-[8px] bg-[#65331f] px-5 text-sm font-black text-white"><Plus size={16}/> Cadastrar criança</button></div>}

                {portalSection === "appointments" && <div className="px-5 py-7 sm:px-8 lg:px-10"><SectionIntro eyebrow="Consultas" title="Minhas consultas" text="Veja o que já está confirmado. Para escolher um horário novo, use “Escolher um horário”."/><div className="space-y-4"><PatientFollowupSummaryPanel data={activeFollowups} loading={followupLoading} error={followupError} onOpenHours={() => openPortalSection("followups")} /><PatientAppointmentsPanel key={`${selectedPassport}:scheduled`} view="scheduled" passport={selectedPassport} onSessionExpired={handleSessionExpired} onOpenRecords={() => openPortalSection("documents")} /></div></div>}
                {portalSection === "request" && <div className="px-5 py-7 sm:px-8 lg:px-10"><SectionIntro eyebrow="Consultas" title="Pedir nova consulta" text="Envie um pedido de atendimento. Isso não reserva nem confirma um horário; a equipe ainda precisa analisar sua solicitação."/><PatientAppointmentsPanel key={`${selectedPassport}:request`} view="request" passport={selectedPassport} hasClinicalContact={selectedProfile?.hasClinicalContact} onSessionExpired={handleSessionExpired} /></div>}
                {portalSection === "followups" && <div className="px-5 py-7 sm:px-8 lg:px-10"><SectionIntro eyebrow="Consultas" title="Escolher um horário" text="Use esta área somente quando seu médico já tiver publicado opções de horário. Escolha uma delas para confirmar sua consulta."/><PatientFollowupsPanel key={selectedPassport} data={activeFollowups} loading={followupLoading} error={followupError} passport={selectedPassport} onRefresh={() => void loadFollowups(selectedPassport, true)} /></div>}
                {portalSection === "exam-request" && <div className="px-5 py-7 sm:px-8 lg:px-10"><SectionIntro eyebrow="Exames" title="Pedir um exame" text="Envie sua solicitação de exame. Esta ação não cria uma consulta nem reserva horário médico."/><PatientExamRequestsPanel key={selectedPassport} passport={selectedPassport} hasClinicalContact={selectedProfile?.hasClinicalContact} onSessionExpired={handleSessionExpired} /></div>}
                {portalSection === "gestation" && showGestation && <div className="px-5 py-7 sm:px-8 lg:px-10"><SectionIntro eyebrow="Acompanhamento" title="Gestação" text="Veja as etapas, orientações e informações que sua médica liberou para você."/><PatientGestationalPlansPanel passport={selectedPassport} planType="gestacional" onSessionExpired={handleSessionExpired} /></div>}
                {portalSection === "ivf" && showIVF && <div className="px-5 py-7 sm:px-8 lg:px-10"><SectionIntro eyebrow="Acompanhamento" title="Fertilização in vitro" text="Acompanhe as etapas e informações liberadas pela equipe responsável."/><PatientGestationalPlansPanel passport={selectedPassport} planType="in_vitro" onSessionExpired={handleSessionExpired} /></div>}
                {portalSection === "records" && <div className="px-5 py-7 sm:px-8 lg:px-10"><PatientRecordsPanel key={`${selectedPassport}:records`} passport={selectedPassport} mode={isChildProfile ? "documents" : "all"} onSessionExpired={handleSessionExpired} /></div>}
                {portalSection === "vaccination" && isChildProfile && <div className="px-5 py-7 sm:px-8 lg:px-10"><SectionIntro eyebrow="Vacinação" title={`Vacinação de ${activeName}`} text="Veja a caderneta, registros aplicados e informações liberadas pela equipe."/><PatientRecordsPanel key={`${selectedPassport}:vaccination`} passport={selectedPassport} mode="vaccination" onSessionExpired={handleSessionExpired} /></div>}
                {portalSection === "pending" && <div className="px-5 py-7 sm:px-8 lg:px-10"><SectionIntro eyebrow="Consultas" title="Pedidos em andamento" text="Acompanhe solicitações que ainda estão aguardando uma definição da equipe."/><PatientAppointmentsPanel key={`${selectedPassport}:pending`} view="pending" passport={selectedPassport} onSessionExpired={handleSessionExpired} onOpenRecords={() => openPortalSection("documents")} /></div>}
                {portalSection === "profile" && <div className="px-5 py-7 sm:px-8 lg:px-10"><SectionIntro eyebrow="Minha conta" title="Meus dados" text="Atualize seus dados de acesso e contato."/><PatientProfilePanel onSessionExpired={handleSessionExpired} onSaved={async () => { await checkSession(); }} /></div>}
              </main>

              <section className="mx-5 mb-5 flex flex-col gap-4 rounded-[8px] bg-[#eee6dc] px-5 py-5 sm:mx-8 sm:flex-row sm:items-center sm:justify-between lg:mx-10">
                <div className="flex items-center gap-4"><span className="grid h-12 w-12 place-items-center rounded-full bg-[#e8dbc6] text-[#672614]"><HeartPulse size={24}/></span><div><h3 className="text-lg font-bold text-[#4e291c]">Seu acompanhamento, organizado</h3><p className="mt-1 text-sm text-[#82736a]">Planejamentos e etapas em um só lugar.</p></div></div>
                {(showGestation || showIVF) && <button type="button" onClick={() => openPortalSection(showGestation ? "gestation" : "ivf")} className="inline-flex shrink-0 items-center gap-2 text-sm font-black text-[#672614] underline underline-offset-4">Ver meu acompanhamento <ArrowRight size={16}/></button>}
              </section>
            </>
          ) : (
            <div className="px-6 py-10 sm:px-10">
              <p className="text-[11px] font-black uppercase tracking-[.15em] text-[#927566]">Minha família</p>
              <h2 className="mt-1 text-2xl font-bold text-[#4e291c]">Cadastre a criança que você acompanha</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#82736a]">Depois da validação do Hospital São Rafael, você poderá acessar consultas, exames, documentos e vacinação da criança pela mesma conta.</p>
              <button type="button" onClick={() => setChildOpen(true)} className="mt-5 inline-flex min-h-[46px] items-center gap-2 rounded-[8px] bg-[#65331f] px-5 text-sm font-black text-white"><Plus size={16}/> Cadastrar criança</button>
            </div>
          )}
        </div>
        <PatientPortalHelp open={helpOpen} onOpen={() => setHelpOpen(true)} onClose={() => setHelpOpen(false)} />
        {childOpen && (
          <div className="hpsr-modal-tone fixed inset-0 z-[1200] flex items-end justify-center bg-[#2a0700]/55 p-0 sm:items-center sm:p-4">
            <form onSubmit={createChild} className="flex max-h-[94dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[24px] bg-white shadow-2xl sm:max-h-[88dvh] sm:rounded-[24px]">
              <div className="flex items-start justify-between bg-hpsr-wine px-5 py-4 text-white">
                <div><p className="text-[10px] font-black uppercase tracking-[.16em] text-white/65">Minha família</p><h3 className="mt-1 text-xl font-black">Cadastrar criança</h3></div>
                <button type="button" onClick={() => setChildOpen(false)} className="grid h-9 w-9 place-items-center rounded-[11px] border border-white/20 bg-white/10"><X size={17}/></button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5"><div className="grid gap-3 sm:grid-cols-2">
                <Field label="Nome da criança"><input className="portal-input" value={childForm.name} onChange={(e)=>setChildForm((c)=>({...c,name:e.target.value}))} required /></Field>
                <Field label="Passaporte"><input className="portal-input uppercase" value={childForm.passport} onChange={(e)=>setChildForm((c)=>({...c,passport:e.target.value.toUpperCase()}))} required /></Field>
                <Field label="Idade da criança"><div className="flex gap-2"><input inputMode="numeric" min="0" max="999" className="portal-input min-w-0 flex-1" placeholder="Ex.: 8" value={childForm.age} onChange={(e)=>setChildForm(c=>({...c,age:e.target.value.replace(/\D/g,"").slice(0,3)}))} required /><StyledSelect className="portal-input w-32" value={childForm.ageUnit} onChange={(e)=>setChildForm(c=>({...c,ageUnit:e.target.value}))}><option value="meses">meses</option><option value="anos">anos</option></StyledSelect></div></Field>
                <Field label="Seu vínculo com a criança"><StyledSelect className="portal-input" value={childForm.relationship} onChange={(e)=>setChildForm(c=>({...c,relationship:e.target.value}))}><option>Mãe</option><option>Pai</option><option>Tutor</option><option>Responsável legal</option><option>Outro</option></StyledSelect></Field>
                <Field label="Outro responsável (opcional)"><input className="portal-input" value={childForm.additionalGuardianName} placeholder="Nome do outro responsável" onChange={(e)=>setChildForm(c=>({...c,additionalGuardianName:e.target.value}))}/><span className="mt-1 block text-xs text-hpsr-muted">Informar o nome não concede acesso. Cada responsável deve ter sua própria conta e autorização.</span></Field>
                <p className="sm:col-span-2 rounded-[14px] border border-hpsr-border bg-[#fffaf4] p-3 text-xs font-semibold text-hpsr-muted">Se a criança já possui cadastro no hospital, os dados existentes serão preservados. A Direção confirma o vínculo antes de liberar o acesso.</p>
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

              <button onClick={login} disabled={busy || !email.trim() || !password} className="mt-6 inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-[18px] bg-hpsr-wine px-5 text-sm font-black text-white shadow-[0_14px_30px_rgba(103,38,20,.16)] transition hover:brightness-105 disabled:opacity-50">{busy ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />} Acessar Portal</button>
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
                  <p className="text-sm font-semibold text-hpsr-muted">{registrationType === "guardian" ? "Uma conta própria para cadastrar seus filhos, mesmo que você não seja paciente do hospital." : "Preencha as informações para criar sua conta de paciente."}</p>
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
    { icon: ClipboardPlus, title: "Pedir nova consulta", text: "Use quando você precisa de um atendimento novo. O pedido ainda não reserva data nem horário." },
    { icon: CalendarClock, title: "Escolher um horário", text: "Use quando seu médico já publicou horários para você. Escolha uma opção para confirmar a consulta." },
    { icon: HeartPulse, title: "Minhas consultas", text: "Veja consultas e retornos que já foram confirmados." },
    { icon: FlaskConical, title: "Pedir um exame", text: "Envie uma solicitação de exame. Isso não cria nem agenda uma consulta." },
    { icon: FileHeart, title: "Receitas e documentos", text: "Veja receitas, atestados, laudos e outros documentos que a equipe liberou para você." },
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
                <p className="mt-1 text-[11px] font-semibold leading-relaxed text-[#405f53] sm:text-xs"><strong>Escolher um horário</strong> é para quando o médico já publicou opções para você. <strong>Pedir nova consulta</strong> é para solicitar um atendimento que ainda será analisado pela equipe.</p>
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

function SectionIntro({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return <div className="mb-5 border-b border-[#ddcfc2] pb-5"><p className="text-[11px] font-black uppercase tracking-[.15em] text-[#927566]">{eyebrow}</p><h2 className="mt-1 text-2xl font-bold text-[#4e291c]">{title}</h2><p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#82736a]">{text}</p></div>;
}

function PortalChoicePage({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return <div className="px-5 py-7 sm:px-8 lg:px-10"><SectionIntro eyebrow={eyebrow} title={title} text={description}/><div className="divide-y divide-[#ddcfc2] border-y border-[#ddcfc2]">{children}</div></div>;
}

function PortalChoice({ icon: Icon, title, text, onClick, emphasis = false }: { icon: LucideIcon; title: string; text: string; onClick: () => void; emphasis?: boolean }) {
  return <button type="button" onClick={onClick} className={`flex w-full items-center gap-4 px-2 py-5 text-left transition ${emphasis ? "bg-[#f3e7df] hover:bg-[#ebddd3]" : "hover:bg-[#f5eee6]"}`}><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${emphasis ? "bg-[#672614] text-white" : "bg-[#eee2d5] text-[#65331f]"}`}><Icon size={19}/></span><span className="min-w-0 flex-1"><strong className="block text-sm text-[#4e291c]">{title}</strong><span className="mt-1 block text-xs leading-relaxed text-[#82736a]">{text}</span></span><ArrowRight size={18} className="shrink-0 text-[#6d5143]"/></button>;
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return <label className={`block ${wide ? "sm:col-span-2" : ""}`}><span className="mb-2 block text-xs font-black uppercase tracking-[.12em] text-hpsr-muted">{label}</span>{children}</label>;
}
