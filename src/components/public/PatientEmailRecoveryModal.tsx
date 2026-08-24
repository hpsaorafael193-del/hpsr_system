"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { KeyRound, Loader2, ShieldCheck, X } from "lucide-react";

export type PatientEmailRecoveryModalProps = {
  onClose: () => void;
  onRecovered: (email: string, message: string) => void;
};

export function PatientEmailRecoveryModal({ onClose, onRecovered }: PatientEmailRecoveryModalProps) {
  const [passport, setPassport] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!passport.trim() || !recoveryCode.trim()) {
      setError("Informe seu passaporte e o código de recuperação.");
      return;
    }
    if (password.length < 6) {
      setError("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (password !== confirmation) {
      setError("As duas senhas precisam ser iguais.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/paciente/recuperar-sem-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passport, recoveryCode, newPassword: password }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Não foi possível recuperar seu acesso.");

      onRecovered(
        String(data.email || "").trim().toLowerCase(),
        data.message || "Senha redefinida. Entre novamente com a nova senha.",
      );
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível recuperar seu acesso.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1260] flex items-center justify-center bg-[#1f0805]/60 p-3 sm:p-5" role="dialog" aria-modal="true" aria-label="Recuperar acesso sem e-mail">
      <form onSubmit={(event) => void submit(event)} className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-xl flex-col overflow-hidden rounded-[24px] border border-hpsr-border bg-white shadow-2xl">
        <div className="shrink-0 border-b border-hpsr-border bg-[linear-gradient(135deg,#fffaf4_0%,#fff2e6_100%)] px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-2 rounded-full border border-hpsr-border bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[.13em] text-hpsr-wine"><KeyRound size={12}/>Recuperação segura</span>
              <h3 className="mt-2 text-xl font-black text-hpsr-text">Sem acesso ao e-mail cadastrado</h3>
              <p className="mt-1 text-sm font-semibold leading-relaxed text-hpsr-muted">Use seu código pessoal de recuperação ou um código temporário fornecido pelo HPSR após confirmação de identidade. Seu e-mail cadastrado não será alterado.</p>
            </div>
            <button type="button" onClick={onClose} aria-label="Fechar" className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] border border-hpsr-border bg-white text-hpsr-wine"><X size={17}/></button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="grid gap-4">
            <RecoveryField label="Passaporte"><input className="portal-input uppercase" value={passport} onChange={(event) => setPassport(event.target.value.toUpperCase())} autoComplete="off" required /></RecoveryField>
            <RecoveryField label="Código de recuperação"><input className="portal-input uppercase" value={recoveryCode} onChange={(event) => setRecoveryCode(event.target.value.toUpperCase())} autoComplete="one-time-code" placeholder="HPSR-.... ou código temporário" required /></RecoveryField>
            <div className="grid gap-4 sm:grid-cols-2">
              <RecoveryField label="Nova senha"><input className="portal-input" type="password" minLength={6} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></RecoveryField>
              <RecoveryField label="Repetir nova senha"><input className="portal-input" type="password" minLength={6} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></RecoveryField>
            </div>
            <div className="rounded-[14px] border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs font-semibold leading-relaxed text-amber-950"><strong>Sem código?</strong> Procure a equipe do HPSR. Após confirmar sua identidade, um Diretor Técnico / Dev pode emitir um código temporário de uso único.</div>
            {error && <p className="rounded-[13px] border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm font-bold text-rose-800">{error}</p>}
          </div>
        </div>
        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-hpsr-border bg-[#fffaf4] p-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="min-h-[44px] rounded-[13px] border border-hpsr-border bg-white px-4 text-sm font-black text-hpsr-text">Cancelar</button>
          <button disabled={busy} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[13px] bg-hpsr-wine px-4 text-sm font-black text-white disabled:opacity-50">{busy ? <Loader2 size={16} className="animate-spin"/> : <ShieldCheck size={16}/>}Redefinir senha</button>
        </div>
      </form>
    </div>
  );
}

function RecoveryField({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-[11px] font-black uppercase tracking-[.12em] text-hpsr-muted">{label}{children}</label>;
}
