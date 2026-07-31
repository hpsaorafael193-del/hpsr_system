"use client";

import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { PublicLogo } from "./PublicLogo";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { MedicalLoginButton } from "./MedicalLoginButton";
import { clearAuthContext } from "@/lib/auth-persistence";
import { createClient } from "@/lib/supabase";

type PatientHeaderSession = {
  authenticated?: boolean;
  patientName?: string;
};

export function PublicHeader({ patientPortal = false }: { patientPortal?: boolean }) {
  const [patientName, setPatientName] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const loadPatientSession = useCallback(async () => {
    if (!patientPortal) return;
    try {
      const response = await fetch("/api/paciente/sessao", { cache: "no-store" });
      const data = await response.json() as PatientHeaderSession;
      setAuthenticated(Boolean(data.authenticated));
      setPatientName(String(data.patientName || "Paciente"));
    } catch {
      setAuthenticated(false);
      setPatientName("");
    }
  }, [patientPortal]);

  useEffect(() => {
    void loadPatientSession();
    const refresh = () => void loadPatientSession();
    window.addEventListener("hpsr-patient-session-changed", refresh);
    return () => window.removeEventListener("hpsr-patient-session-changed", refresh);
  }, [loadPatientSession]);

  async function logoutPatient() {
    setLeaving(true);
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
    <header className="sticky top-0 z-30 border-b border-black/5 bg-[#fcf6ee]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 lg:px-5">
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
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex min-w-0 items-center gap-2.5 rounded-[15px] border border-hpsr-border bg-white px-3 py-2 shadow-sm">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[12px] bg-[#f7ede3] text-hpsr-wine">
                <UserRound size={17} />
              </div>
              <div className="hidden min-w-0 sm:block">
                <p className="text-[9px] font-black uppercase tracking-[.13em] text-hpsr-wineLight">Paciente logado</p>
                <p className="max-w-[190px] truncate text-sm font-black text-hpsr-text">{patientName}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void logoutPatient()}
              disabled={leaving}
              className="inline-flex min-h-[43px] items-center justify-center gap-2 rounded-[14px] bg-hpsr-wine px-3.5 text-sm font-black text-white shadow-sm transition hover:brightness-105 disabled:opacity-50"
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
