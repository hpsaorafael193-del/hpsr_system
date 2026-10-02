"use client";

import Link from "next/link";
import { Baby, ChevronDown, LogOut, Plus, RefreshCcw, ShieldCheck, UserRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { PublicLogo } from "./PublicLogo";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { MedicalLoginButton } from "./MedicalLoginButton";
import { clearAuthContext } from "@/lib/auth-persistence";
import { createClient } from "@/lib/supabase";
import { PatientNotificationsPopover } from "./PatientNotificationsPopover";

type PatientHeaderSession = {
  authenticated?: boolean;
  patientName?: string;
  accountId?: string;
  hasOwnProfile?: boolean;
  accessiblePatients?: PatientPortalProfile[];
  pendingChildLinks?: PatientPendingProfile[];
};

type PatientPortalProfile = { passport: string; name: string; access_type: string };
type PatientPendingProfile = { passport: string; name: string; status: string };
type HeaderPortalState = {
  accountId: string;
  accessiblePatients: PatientPortalProfile[];
  pendingChildLinks: PatientPendingProfile[];
  selectedPassport: string;
  hasOwnProfile: boolean;
};

export function PublicHeader({ patientPortal = false }: { patientPortal?: boolean }) {
  const [patientName, setPatientName] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [hasOwnProfile, setHasOwnProfile] = useState(false);
  const [profiles, setProfiles] = useState<PatientPortalProfile[]>([]);
  const [pendingProfiles, setPendingProfiles] = useState<PatientPendingProfile[]>([]);
  const [selectedPassport, setSelectedPassport] = useState("");

  const loadPatientSession = useCallback(async () => {
    if (!patientPortal) return;
    try {
      const response = await fetch("/api/paciente/sessao", { cache: "no-store" });
      const data = await response.json() as PatientHeaderSession;
      setAuthenticated(Boolean(data.authenticated));
      setPatientName(String(data.patientName || "Paciente"));
      setAccountId(String(data.accountId || ""));
      const accessible = data.accessiblePatients || [];
      setProfiles(accessible);
      setPendingProfiles(data.pendingChildLinks || []);
      setHasOwnProfile(Boolean(data.hasOwnProfile));
      setSelectedPassport((current) => accessible.some((item) => item.passport === current) ? current : (accessible[0]?.passport || ""));
    } catch {
      setAuthenticated(false);
      setPatientName("");
      setAccountId("");
      setProfiles([]);
      setPendingProfiles([]);
      setSelectedPassport("");
    }
  }, [patientPortal]);

  useEffect(() => {
    void loadPatientSession();
    const refresh = () => void loadPatientSession();
    window.addEventListener("hpsr-patient-session-changed", refresh);
    return () => window.removeEventListener("hpsr-patient-session-changed", refresh);
  }, [loadPatientSession]);

  useEffect(() => {
    if (!patientPortal) return;
    const syncFromPortal = (event: Event) => {
      const detail = (event as CustomEvent<HeaderPortalState>).detail;
      if (!detail) return;
      setAuthenticated(true);
      setAccountId(detail.accountId);
      setProfiles(detail.accessiblePatients);
      setPendingProfiles(detail.pendingChildLinks);
      setHasOwnProfile(detail.hasOwnProfile);
      setSelectedPassport(detail.selectedPassport);
    };
    window.addEventListener("hpsr-patient-portal-updated", syncFromPortal);
    return () => window.removeEventListener("hpsr-patient-portal-updated", syncFromPortal);
  }, [patientPortal]);

  const activeProfile = profiles.find((item) => item.passport === selectedPassport);
  const selectProfile = (passport: string, section = "home") => {
    if (!profiles.some((item) => item.passport === passport)) return;
    setSelectedPassport(passport);
    setProfileMenuOpen(false);
    window.dispatchEvent(new CustomEvent("hpsr-patient-select-profile", { detail: { passport, section } }));
  };
  const openChildRegistration = () => {
    setProfileMenuOpen(false);
    window.dispatchEvent(new Event("hpsr-patient-register-child"));
  };

  async function logoutPatient() {
    setLeaving(true);
    setProfileMenuOpen(false);
    try {
      await fetch("/api/paciente/sair", { method: "POST" });
      clearAuthContext();
      const supabase = createClient();
      if (supabase) await supabase.auth.signOut();
      window.dispatchEvent(new Event("hpsr-patient-session-changed"));
      window.location.reload();
    } finally {
      setLeaving(false);
    }
  }

  return (
    <header className={`sticky top-0 z-[60] border-b backdrop-blur-md ${patientPortal ? "border-[#d5c3b1] bg-[#eee3d7]/95 shadow-[0_4px_18px_rgba(74,47,34,.05)]" : "border-black/5 bg-[#fcf6ee]/95"}`}>
      <div className="mx-auto flex min-w-0 max-w-7xl items-center justify-between gap-2 px-2 py-2 min-[390px]:px-3 sm:gap-3 sm:px-4 lg:px-5">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/" className="shrink-0">
            <PublicLogo compact />
          </Link>
          {patientPortal && (
            <div className="hidden border-l border-hpsr-border pl-4 sm:block">
              <p className="text-[10px] font-black uppercase tracking-[.16em] text-hpsr-wineLight">Área autenticada</p>
              <p className="text-sm font-black text-hpsr-text">Portal do Paciente</p>
            </div>
          )}
        </div>

        {patientPortal && authenticated ? (
          <div className="flex min-w-0 shrink-0 items-center gap-1 min-[390px]:gap-2">
            {accountId && <PatientNotificationsPopover
              accountId={accountId}
              profiles={profiles}
              pending={pendingProfiles}
              onSessionExpired={() => {
                setAuthenticated(false);
                window.dispatchEvent(new Event("hpsr-patient-session-expired"));
              }}
              onNavigate={(passport, section) => {
                if (profiles.some((item) => item.passport === passport)) {
                  selectProfile(passport, section);
                } else if (section === "home") {
                  window.dispatchEvent(new CustomEvent("hpsr-patient-select-profile", { detail: { passport: "", section: "home" } }));
                }
              }}
            />}
            <div className="relative min-w-0">
              <button type="button" onClick={() => setProfileMenuOpen((current) => !current)}
                aria-label="Selecionar perfil do paciente" aria-expanded={profileMenuOpen} aria-haspopup="menu"
                className="flex min-h-[43px] min-w-0 items-center gap-1 rounded-[15px] min-[390px]:gap-2 sm:gap-2.5 border border-[#d4c0ae] bg-[#f5ede5] px-2.5 py-2 text-left shadow-[0_3px_10px_rgba(73,47,34,.045)] transition hover:border-[#a98a76] hover:bg-[#eee1d5] sm:px-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[12px] bg-[#e8d6c6] text-hpsr-wine">
                  {activeProfile?.access_type !== "self" && activeProfile ? <Baby size={17}/> : <UserRound size={17}/>}
                </span>
                <span className="hidden min-w-0 sm:block">
                  <span className="block text-[9px] font-black uppercase tracking-[.13em] text-hpsr-wineLight">{activeProfile?.access_type !== "self" && activeProfile ? "Prontuário selecionado" : "Paciente logado"}</span>
                  <span className="block max-w-[190px] truncate text-sm font-black text-hpsr-text">{activeProfile?.name || patientName}</span>
                </span>
                <ChevronDown size={14} aria-hidden className={`shrink-0 text-hpsr-wine transition-transform ${profileMenuOpen ? "rotate-180" : ""}`}/>
              </button>
              {profileMenuOpen && <>
                <button type="button" className="fixed inset-0 z-40 cursor-default" aria-label="Fechar perfis" onClick={() => setProfileMenuOpen(false)}/>
                <div role="menu" aria-label="Perfis do Portal do Paciente" className="absolute right-0 top-full z-50 mt-2 max-h-[min(70dvh,480px)] w-[min(310px,calc(100vw-1.5rem))] overflow-y-auto rounded-[20px] border border-hpsr-border bg-[#f2e8de] p-2.5 shadow-[0_18px_46px_rgba(72,49,34,.18)]">
                  <p className="px-2 pb-2 text-xs font-black uppercase tracking-[.12em] text-hpsr-wineLight">Selecionar prontuário</p>
                  {profiles.map((item) => <button key={item.passport} role="menuitem" type="button" onClick={() => selectProfile(item.passport)}
                    className={`mb-1 flex w-full items-center gap-2.5 rounded-[13px] border px-3 py-2.5 text-left ${selectedPassport === item.passport ? "border-hpsr-wine/30 bg-[#e6d6c8]" : "border-[#decdbc] bg-[#f9f3ed]"}`}>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#eadacc] text-hpsr-wine">{item.access_type === "self" ? <UserRound size={19}/> : <Baby size={19}/>}</span>
                    <span className="min-w-0 flex-1"><strong className="block truncate text-xs text-hpsr-text">{item.name}</strong><small className="block text-[10px] font-semibold text-hpsr-muted">{item.access_type === "self" ? "Meu perfil" : "Prontuário infantil"}</small></span>
                    {selectedPassport === item.passport && <ShieldCheck size={16} className="shrink-0 text-hpsr-wine"/>}
                  </button>)}
                  {pendingProfiles.map((item) => <div key={item.passport} className="mb-1 flex items-center gap-2.5 rounded-[13px] border border-[#d7bfa0] bg-[#f5e9d8] px-3 py-2.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-amber-800"><Baby size={19}/></span>
                    <span className="min-w-0"><strong className="block truncate text-xs text-hpsr-text">{item.name}</strong><small className="block text-[10px] font-semibold text-amber-800">Aguardando aprovação</small></span>
                  </div>)}
                  {hasOwnProfile && <button role="menuitem" type="button" onClick={() => { setProfileMenuOpen(false); window.dispatchEvent(new Event("hpsr-patient-open-my-data")); }}
                    className="mt-2 flex min-h-[40px] w-full items-center gap-2 rounded-[12px] border border-hpsr-border bg-white px-3 text-xs font-black text-hpsr-wine"><UserRound size={16}/>Meus dados</button>}
                  <button role="menuitem" type="button" onClick={openChildRegistration}
                    className="mt-1 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[13px] border border-hpsr-wine/25 bg-white px-3 text-xs font-black text-hpsr-wine"><Plus size={16}/>Cadastrar filho ou filha</button>
                  <button role="menuitem" type="button" onClick={() => { setProfileMenuOpen(false); void loadPatientSession(); window.dispatchEvent(new Event("hpsr-patient-refresh-profiles")); }}
                    className="mt-1 flex w-full items-center justify-center gap-2 py-2 text-[11px] font-semibold text-hpsr-muted"><RefreshCcw size={12}/>Atualizar perfis</button>
                </div>
              </>}
            </div>
            <button
              type="button"
              onClick={() => void logoutPatient()}
              disabled={leaving}
              className="inline-flex min-h-[43px] items-center justify-center gap-2 rounded-[14px] bg-hpsr-wine px-2.5 min-[390px]:px-3.5 text-sm font-black text-white shadow-sm transition hover:brightness-105 disabled:opacity-50"
            >
              <LogOut size={16} /> <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        ) : (
          <>
            <nav className="hidden items-center gap-2 md:flex">
              <ButtonLink href="/paciente" variant="ghost">Portal do Paciente</ButtonLink>
              <ButtonLink href="/trabalhe-conosco" variant="ghost">Equipe</ButtonLink>
            </nav>
            <MedicalLoginButton className="rounded-2xl px-4 py-2.5 md:px-5" />
          </>
        )}
      </div>
    </header>
  );
}
