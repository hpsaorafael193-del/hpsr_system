"use client";

import { FormEvent, useEffect, useState } from "react";
import { Copy, KeyRound, Loader2, Save, ShieldCheck, UserRound } from "lucide-react";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { formatPhoneNumber } from "@/lib/phone";

type Profile = {
  passport: string;
  name: string;
  birthDate: string;
  sex: string;
  phone: string;
  email: string;
};

const EMPTY: Profile = { passport: "", name: "", birthDate: "", sex: "", phone: "", email: "" };

export function PatientProfilePanel({ onSessionExpired, onSaved }: { onSessionExpired: () => void; onSaved: () => void | Promise<void> }) {
  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [recoveryConfigured, setRecoveryConfigured] = useState(false);
  const [recoveryExpiresAt, setRecoveryExpiresAt] = useState<string | null>(null);
  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [recoveryBusy, setRecoveryBusy] = useState(false);

  async function load() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/paciente/perfil", { cache: "no-store" });
      const data = await response.json();
      if (response.status === 401) { onSessionExpired(); return; }
      if (!response.ok || !data.ok) throw new Error(data.error || "Não foi possível carregar seus dados.");
      setProfile(data.profile || EMPTY);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar seus dados.");
    } finally { setLoading(false); }
  }

  async function loadRecoveryStatus() {
    try {
      const response = await fetch("/api/paciente/codigo-recuperacao", { cache: "no-store" });
      const data = await response.json();
      if (response.status === 401) { onSessionExpired(); return; }
      if (!response.ok || !data.ok) return;
      setRecoveryConfigured(Boolean(data.configured));
      setRecoveryExpiresAt(data.expiresAt || null);
    } catch {}
  }

  useEffect(() => { void load(); void loadRecoveryStatus(); }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/paciente/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await response.json();
      if (response.status === 401) { onSessionExpired(); return; }
      if (!response.ok || !data.ok) throw new Error(data.error || "Não foi possível salvar seus dados.");
      if (data.email) {
        try { window.localStorage.setItem("hpsr_patient_login_email", String(data.email)); } catch {}
      }
      setMessage(data.message || "Seus dados foram atualizados.");
      await onSaved();
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível salvar seus dados.");
    } finally { setSaving(false); }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    if (newPassword.length < 6) return setError("A nova senha deve ter no mínimo 6 caracteres.");
    if (newPassword !== confirmPassword) return setError("As duas novas senhas precisam ser iguais.");
    setPasswordBusy(true);
    try {
      const response = await fetch("/api/paciente/alterar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (response.status === 401) { onSessionExpired(); return; }
      if (!response.ok || !data.ok) throw new Error(data.error || "Não foi possível alterar sua senha.");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setPasswordOpen(false);
      setMessage(data.message || "Senha alterada com sucesso.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível alterar sua senha.");
    } finally { setPasswordBusy(false); }
  }

  async function generateRecoveryCode() {
    setError(""); setMessage(""); setRecoveryCode("");
    if (!recoveryPassword) return setError("Informe sua senha atual para gerar o código de recuperação.");
    setRecoveryBusy(true);
    try {
      const response = await fetch("/api/paciente/codigo-recuperacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: recoveryPassword }),
      });
      const data = await response.json();
      if (response.status === 401) { onSessionExpired(); return; }
      if (!response.ok || !data.ok) throw new Error(data.error || "Não foi possível gerar o código de recuperação.");
      setRecoveryCode(String(data.recoveryCode || ""));
      setRecoveryConfigured(true);
      setRecoveryExpiresAt(data.expiresAt || null);
      setRecoveryPassword("");
      setMessage("Código de recuperação gerado. Guarde-o fora do Portal; ele não será exibido novamente depois que você sair desta tela.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível gerar o código de recuperação.");
    } finally { setRecoveryBusy(false); }
  }

  async function copyRecoveryCode() {
    if (!recoveryCode) return;
    try { await navigator.clipboard.writeText(recoveryCode); setMessage("Código copiado. Guarde-o em um local seguro."); }
    catch { setError("Não foi possível copiar automaticamente. Selecione o código e copie manualmente."); }
  }

  if (loading) return <div className="flex min-h-48 items-center justify-center text-sm font-bold text-hpsr-muted"><Loader2 className="mr-2 animate-spin" size={18}/>Carregando seus dados...</div>;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-[#f3e4d8] text-hpsr-wine"><UserRound size={19}/></span>
        <div><h3 className="text-lg font-black text-hpsr-text">Meus dados</h3><p className="mt-0.5 text-sm font-semibold text-hpsr-muted">Atualize seus dados sem precisar pedir para a equipe.</p></div>
      </div>

      <form onSubmit={save} className="rounded-[18px] border border-hpsr-border bg-[#fffaf4] p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <ProfileField label="Nome" wide><input className="portal-input" value={profile.name} onChange={(e)=>setProfile(v=>({...v,name:e.target.value}))} required /></ProfileField>
          <ProfileField label="Passaporte"><input className="portal-input bg-[#f4ede7] text-hpsr-muted" value={profile.passport} disabled /></ProfileField>
          <ProfileField label="Telefone"><input className="portal-input" inputMode="numeric" maxLength={13} value={profile.phone} onChange={(e)=>setProfile(v=>({...v,phone:formatPhoneNumber(e.target.value)}))} /></ProfileField>
          <ProfileField label="E-mail de acesso" wide><input className="portal-input bg-[#f4ede7] text-hpsr-muted" type="email" autoComplete="email" value={profile.email} readOnly aria-readonly="true" /><span className="mt-1.5 block text-[11px] font-semibold leading-relaxed text-hpsr-muted"><strong className="text-hpsr-text">E-mail protegido.</strong> Ele identifica sua conta e não pode ser trocado por aqui. Se perder o acesso a essa caixa de e-mail, use o código de recuperação abaixo ou procure a equipe do HPSR.</span></ProfileField>
          <ProfileField label="Data de nascimento"><input className="portal-input" type="date" value={profile.birthDate} onChange={(e)=>setProfile(v=>({...v,birthDate:e.target.value}))} /></ProfileField>
          <ProfileField label="Sexo"><StyledSelect className="portal-input" value={profile.sex} onChange={(e)=>setProfile(v=>({...v,sex:e.target.value}))}><option value="">Não informado</option><option value="Masculino">Masculino</option><option value="Feminino">Feminino</option></StyledSelect></ProfileField>
        </div>
        <div className="mt-4 rounded-[13px] border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs font-semibold leading-relaxed text-amber-950"><strong>Passaporte não pode ser alterado aqui.</strong> Ele é usado para ligar sua conta ao seu prontuário.</div>
        <button disabled={saving} className="mt-4 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[13px] bg-hpsr-wine px-4 text-sm font-black text-white disabled:opacity-60">{saving ? <Loader2 className="animate-spin" size={17}/> : <Save size={17}/>}Salvar dados</button>
      </form>

      <div className="mt-4 rounded-[18px] border border-hpsr-border bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0"><p className="text-sm font-black text-hpsr-text">Código de recuperação</p><p className="mt-0.5 text-xs font-semibold leading-relaxed text-hpsr-muted">Serve para redefinir sua senha caso você perca o acesso ao e-mail cadastrado. O código não permite trocar seu e-mail.</p></div>
          <span className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-black ${recoveryConfigured ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>{recoveryConfigured ? "Proteção configurada" : "Ainda não configurado"}</span>
        </div>
        {recoveryExpiresAt && recoveryConfigured && <p className="mt-3 text-xs font-semibold text-hpsr-muted">Código ativo até {new Date(recoveryExpiresAt).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}. Gerar outro invalida o anterior.</p>}
        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <input className="portal-input" type="password" autoComplete="current-password" placeholder="Senha atual" value={recoveryPassword} onChange={(e)=>setRecoveryPassword(e.target.value)} />
          <button type="button" disabled={recoveryBusy || !recoveryPassword} onClick={()=>void generateRecoveryCode()} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[13px] bg-hpsr-wine px-4 text-sm font-black text-white disabled:opacity-50">{recoveryBusy ? <Loader2 className="animate-spin" size={16}/> : <KeyRound size={16}/>} {recoveryConfigured ? "Gerar novo código" : "Gerar código"}</button>
        </div>
        {recoveryCode && <div className="mt-4 rounded-[16px] border-2 border-emerald-300 bg-emerald-50 p-4"><p className="text-[10px] font-black uppercase tracking-[.14em] text-emerald-800">Exibido somente agora</p><div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center"><code className="min-w-0 flex-1 select-all break-all rounded-[12px] border border-emerald-200 bg-white px-3 py-3 text-center text-sm font-black tracking-[.08em] text-emerald-950">{recoveryCode}</code><button type="button" onClick={()=>void copyRecoveryCode()} className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[12px] border border-emerald-300 bg-white px-3 text-xs font-black text-emerald-800"><Copy size={15}/>Copiar</button></div><p className="mt-2 text-[11px] font-semibold leading-relaxed text-emerald-900">Guarde fora do sistema. Por segurança, o HPSR armazena apenas o hash deste código e não consegue mostrá-lo novamente.</p></div>}
      </div>

      <div className="mt-4 rounded-[18px] border border-hpsr-border bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-sm font-black text-hpsr-text">Senha</p><p className="mt-0.5 text-xs font-semibold text-hpsr-muted">Você pode trocar sua senha por aqui quando quiser.</p></div>
          <button type="button" onClick={()=>setPasswordOpen(v=>!v)} className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-[12px] border border-hpsr-border bg-[#fffaf4] px-3 text-xs font-black text-hpsr-wine"><KeyRound size={15}/>{passwordOpen ? "Cancelar" : "Alterar senha"}</button>
        </div>
        {passwordOpen && <form onSubmit={changePassword} className="mt-4 grid gap-3 border-t border-hpsr-border pt-4 sm:grid-cols-2">
          <ProfileField label="Senha atual" wide><input className="portal-input" type="password" autoComplete="current-password" value={currentPassword} onChange={(e)=>setCurrentPassword(e.target.value)} required /></ProfileField>
          <ProfileField label="Nova senha"><input className="portal-input" type="password" autoComplete="new-password" minLength={6} value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} required /></ProfileField>
          <ProfileField label="Repetir nova senha"><input className="portal-input" type="password" autoComplete="new-password" minLength={6} value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} required /></ProfileField>
          <div className="sm:col-span-2"><button disabled={passwordBusy} className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[12px] bg-hpsr-wine px-4 text-sm font-black text-white disabled:opacity-60">{passwordBusy ? <Loader2 className="animate-spin" size={16}/> : <ShieldCheck size={16}/>}Salvar nova senha</button></div>
        </form>}
      </div>

      {message && <p className="mt-4 rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">{message}</p>}
      {error && <p className="mt-4 rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">{error}</p>}
    </div>
  );
}

function ProfileField({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return <label className={`block ${wide ? "sm:col-span-2" : ""}`}><span className="mb-1.5 block text-xs font-black text-hpsr-muted">{label}</span>{children}</label>;
}
