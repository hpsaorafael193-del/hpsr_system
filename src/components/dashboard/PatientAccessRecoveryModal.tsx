"use client";

import { useState } from "react";
import { Copy, KeyRound, LoaderCircle, ShieldCheck, X } from "lucide-react";
import { createClient } from "@/lib/supabase";

export type PatientAccessRecoveryModalProps = {
  patient: { name: string; passport: string };
  onClose: () => void;
};

export function PatientAccessRecoveryModal({ patient, onClose }: PatientAccessRecoveryModalProps) {
  const [confirmedIdentity, setConfirmedIdentity] = useState(false);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function generate() {
    setError("");
    setMessage("");
    setCode("");
    if (!confirmedIdentity) {
      setError("Confirme a identidade do paciente antes de emitir o código.");
      return;
    }

    setBusy(true);
    try {
      const client = createClient();
      if (!client) throw new Error("Supabase não configurado.");

      const { data: sessionData } = await client.auth.getSession();
      const accessToken = sessionData.session?.access_token || "";
      if (!accessToken) throw new Error("Sua sessão interna expirou. Entre novamente no sistema.");

      const response = await fetch("/api/paciente/recuperacao-assistida", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ passport: patient.passport }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Não foi possível emitir o código temporário.");

      setCode(String(data.code || ""));
      setExpiresAt(String(data.expiresAt || ""));
      setMessage(data.message || "Código temporário emitido.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível emitir o código temporário.");
    } finally {
      setBusy(false);
    }
  }

  async function copyCode() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setMessage("Código copiado. Entregue somente ao paciente já identificado.");
    } catch {
      setError("Não foi possível copiar automaticamente. Copie o código manualmente.");
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#2a0700]/50 p-3 sm:p-5" role="dialog" aria-modal="true" aria-label="Recuperação assistida do Portal do Paciente">
      <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-xl flex-col overflow-hidden rounded-[24px] border border-white/80 bg-[#fffaf4] shadow-2xl">
        <div className="bg-[linear-gradient(135deg,#2a0700,#672614,#9d6b4f)] px-5 py-4 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.14em]"><KeyRound size={14}/>Recuperação assistida</span>
              <h2 className="mt-2 text-xl font-black">{patient.name}</h2>
              <p className="mt-1 text-sm text-white/75">Passaporte {patient.passport}</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-[12px] border border-white/25 bg-white/10 p-2" aria-label="Fechar recuperação"><X size={18}/></button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="rounded-[15px] border border-amber-200 bg-amber-50 p-3.5 text-xs font-semibold leading-relaxed text-amber-950"><strong>Use somente quando o paciente perdeu o acesso ao e-mail e não possui um código pessoal de recuperação.</strong> Confirme a identidade antes de emitir. O código dura 15 minutos, aceita no máximo 5 tentativas e não altera o e-mail cadastrado.</div>
          <label className="mt-4 flex items-start gap-3 rounded-[15px] border border-hpsr-border bg-white p-3.5"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#672614]" checked={confirmedIdentity} onChange={(event) => setConfirmedIdentity(event.target.checked)} /><span className="text-sm font-semibold leading-relaxed text-hpsr-text"><strong>Confirmei a identidade do paciente</strong> antes de iniciar a recuperação.</span></label>
          <button type="button" disabled={busy || !confirmedIdentity} onClick={() => void generate()} className="mt-4 inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-[14px] bg-hpsr-wine px-4 text-sm font-black text-white disabled:opacity-50">{busy ? <LoaderCircle size={17} className="animate-spin"/> : <ShieldCheck size={17}/>}Gerar código temporário</button>
          {code && <div className="mt-4 rounded-[16px] border-2 border-emerald-300 bg-emerald-50 p-4"><p className="text-[10px] font-black uppercase tracking-[.14em] text-emerald-800">Código de uso único</p><div className="mt-2 flex gap-2"><code className="flex-1 select-all rounded-[12px] border border-emerald-200 bg-white px-4 py-3 text-center text-2xl font-black tracking-[.18em] text-emerald-950">{code}</code><button type="button" onClick={() => void copyCode()} className="grid w-12 place-items-center rounded-[12px] border border-emerald-300 bg-white text-emerald-800" title="Copiar código"><Copy size={18}/></button></div>{expiresAt && <p className="mt-2 text-xs font-semibold text-emerald-900">Válido até {new Date(expiresAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })}.</p>}</div>}
          {message && <p className="mt-4 rounded-[13px] border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm font-bold text-emerald-900">{message}</p>}
          {error && <p className="mt-4 rounded-[13px] border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm font-bold text-rose-800">{error}</p>}
        </div>
        <div className="flex justify-end border-t border-hpsr-border bg-white px-5 py-3.5"><button type="button" onClick={onClose} className="rounded-[14px] border border-hpsr-border bg-white px-4 py-2.5 text-sm font-black text-hpsr-text">Fechar</button></div>
      </div>
    </div>
  );
}
