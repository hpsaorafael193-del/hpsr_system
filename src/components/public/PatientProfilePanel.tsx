"use client";

import { FormEvent, useEffect, useState } from "react";
import { KeyRound, Loader2, Save, ShieldCheck, UserRound } from "lucide-react";
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

  useEffect(() => { void load(); }, []);

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
          <ProfileField label="E-mail" wide><input className="portal-input" type="email" autoComplete="email" value={profile.email} onChange={(e)=>setProfile(v=>({...v,email:e.target.value}))} required /><span className="mt-1.5 block text-[11px] font-semibold leading-relaxed text-hpsr-muted">Este também é o e-mail usado para entrar no Portal e recuperar sua senha.</span></ProfileField>
          <ProfileField label="Data de nascimento"><input className="portal-input" type="date" value={profile.birthDate} onChange={(e)=>setProfile(v=>({...v,birthDate:e.target.value}))} /></ProfileField>
          <ProfileField label="Sexo"><StyledSelect className="portal-input" value={profile.sex} onChange={(e)=>setProfile(v=>({...v,sex:e.target.value}))}><option value="">Não informado</option><option value="Masculino">Masculino</option><option value="Feminino">Feminino</option></StyledSelect></ProfileField>
        </div>
        <div className="mt-4 rounded-[13px] border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs font-semibold leading-relaxed text-amber-950"><strong>Passaporte não pode ser alterado aqui.</strong> Ele é usado para ligar sua conta ao seu prontuário.</div>
        <button disabled={saving} className="mt-4 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[13px] bg-hpsr-wine px-4 text-sm font-black text-white disabled:opacity-60">{saving ? <Loader2 className="animate-spin" size={17}/> : <Save size={17}/>}Salvar dados</button>
      </form>

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
