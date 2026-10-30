"use client";

import { useState, type Dispatch, type SetStateAction, type ReactNode } from "react";
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, Mail, Phone, UserRound, Hash, MessageCircle, Droplets } from "lucide-react";
import { formatCityPhoneNumber, normalizeDiscordId } from "@/lib/phone";
import { StyledSelect } from "@/components/ui/StyledSelect";

export type PatientRegistrationForm = {
  name: string; passport: string; age: string; bloodType: string; phone: string;
  discord: string; email: string; password: string; confirmation: string; guardianPassports: string[];
};
type Props = {
  stage: "login" | "register"; onStage: (stage: "login" | "register") => void;
  email: string; setEmail: (value: string) => void; password: string; setPassword: (value: string) => void;
  rememberConnected: boolean; setRememberConnected: (value: boolean) => void;
  register: PatientRegistrationForm; setRegister: Dispatch<SetStateAction<PatientRegistrationForm>>;
  registrationType: "patient" | "guardian"; onRegistrationType: (value: "patient" | "guardian") => void;
  busy: boolean; message: string; error: string; isMinor: boolean;
  onLogin: () => void; onRegister: () => void; onRecover: () => void; onEmailRecovery: () => void;
};

export function PatientAuthCard(p: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const registering = p.stage === "register";
  const update = (key: keyof PatientRegistrationForm, value: string) => p.setRegister(current => ({ ...current, [key]: value }));
  return <section className="patient-auth-scene" aria-label="Acesso ao Portal do Paciente">
    <div className="patient-auth-background" aria-hidden="true" />
    <div className={`patient-auth-card ${registering ? "patient-auth-card--register" : ""}`}>
      <div className="patient-auth-heading">
        <UserRound size={31} strokeWidth={1.6} aria-hidden="true" />
        <h1>Portal do Paciente</h1>
        <p>{registering ? "Crie sua conta para acompanhar seu cuidado." : "Entre ou cadastre-se para continuar."}</p>
      </div>
      <div className="patient-auth-tabs" aria-label="Opções de acesso">
        <button type="button" disabled={p.busy} aria-pressed={!registering} onClick={() => p.onStage("login")}>Entrar</button>
        <button type="button" disabled={p.busy} aria-pressed={registering} onClick={() => p.onStage("register")}>Cadastrar</button>
      </div>
      <form onSubmit={event => { event.preventDefault(); if (!p.busy) registering ? p.onRegister() : p.onLogin(); }}>
        {registering ? <>
          <div className="patient-auth-account-types" aria-label="Tipo de conta">
            <button type="button" disabled={p.busy} aria-pressed={p.registrationType === "patient"} onClick={() => p.onRegistrationType("patient")}>Sou paciente</button>
            <button type="button" disabled={p.busy} aria-pressed={p.registrationType === "guardian"} onClick={() => p.onRegistrationType("guardian")}>Sou responsável</button>
          </div>
          {p.registrationType === "guardian" && <p className="patient-auth-hint">Crie seu acesso para cadastrar e acompanhar suas crianças, mesmo sem ser paciente do hospital.</p>}
          <div className="patient-auth-grid">
            <AuthField label="Nome completo no RP" icon={<UserRound size={19}/>} wide><input required autoComplete="name" placeholder="Nome do personagem" value={p.register.name} onChange={e => update("name", e.target.value)} /></AuthField>
            {p.registrationType === "patient" && <>
              <AuthField label="Passaporte" icon={<Hash size={19}/>}><input required placeholder="Seu passaporte" value={p.register.passport} onChange={e => update("passport", e.target.value)} /></AuthField>
              <AuthField label="Idade do personagem (anos)"><input required type="number" inputMode="numeric" min={0} max={120} step={1} placeholder="Ex.: 25" value={p.register.age} onChange={e => update("age", e.target.value)} /></AuthField>
              <AuthField label="Telefone da cidade" icon={<Phone size={19}/>}><input type="tel" inputMode="numeric" maxLength={13} placeholder="(055) 000-000" value={p.register.phone} onChange={e => update("phone", formatCityPhoneNumber(e.target.value))} /></AuthField>
              <AuthField label="ID do Discord" icon={<MessageCircle size={19}/>}><input inputMode="numeric" placeholder="ID numérico do perfil" value={p.register.discord} onChange={e => update("discord", normalizeDiscordId(e.target.value))} /></AuthField>
              <AuthField label="Tipo sanguíneo" icon={<Droplets size={19}/>} wide><StyledSelect aria-label="Tipo sanguíneo" value={p.register.bloodType} onChange={e => update("bloodType", e.target.value)}><option value="">Selecione</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option></StyledSelect></AuthField>
              <p className="patient-auth-hint patient-auth-wide">A equipe entra em contato pelo telefone da cidade ou pelo ID do Discord.</p>
              {p.isMinor && <p className="patient-auth-warning patient-auth-wide">Crianças são cadastradas pela conta do responsável, sem conta própria.</p>}
            </>}
            <AuthField label="E-mail da conta" icon={<Mail size={19}/>} wide><input required type="email" autoComplete="email" placeholder="seuemail@exemplo.com" value={p.register.email} onChange={e => update("email", e.target.value)} /></AuthField>
            <AuthField label="Senha" icon={<LockKeyhole size={19}/>}><input required type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={6} placeholder="Crie sua senha" value={p.register.password} onChange={e => update("password", e.target.value)} /><PasswordEye shown={showPassword} onClick={() => setShowPassword(v => !v)} /></AuthField>
            <AuthField label="Confirmar senha" icon={<LockKeyhole size={19}/>}><input required type={showConfirmation ? "text" : "password"} autoComplete="new-password" minLength={6} placeholder="Repita sua senha" value={p.register.confirmation} onChange={e => update("confirmation", e.target.value)} /><PasswordEye shown={showConfirmation} onClick={() => setShowConfirmation(v => !v)} confirmation /></AuthField>
          </div>
          <p className="patient-auth-hint">Use pelo menos 6 caracteres. O e-mail será usado para acesso e recuperação da conta.</p>
        </> : <>
          <div className="patient-auth-login-fields">
            <AuthField label="E-mail da conta" icon={<Mail size={19}/>}><input required type="email" autoComplete="username" placeholder="seuemail@exemplo.com" value={p.email} onChange={e => p.setEmail(e.target.value)} /></AuthField>
            <AuthField label="Senha" icon={<LockKeyhole size={19}/>}><input required type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Digite sua senha" value={p.password} onChange={e => p.setPassword(e.target.value)} /><PasswordEye shown={showPassword} onClick={() => setShowPassword(v => !v)} /></AuthField>
          </div>
          <div className="patient-auth-login-options">
            <label><input type="checkbox" checked={p.rememberConnected} disabled={p.busy} onChange={e => p.setRememberConnected(e.target.checked)} />Manter conectado</label>
            <button type="button" disabled={p.busy} onClick={p.onRecover}>Esqueci minha senha</button>
          </div>
        </>}
        {p.message && <p role="status" className="patient-auth-success">{p.message}</p>}
        {p.error && <p role="alert" className="patient-auth-error">{p.error}</p>}
        <button className="patient-auth-submit" type="submit" disabled={p.busy}>{p.busy ? <Loader2 size={19} className="animate-spin"/> : null}{p.busy ? "Aguarde..." : registering ? "Criar minha conta" : "Acessar portal"}{!p.busy && <ArrowRight size={19}/>}</button>
        {!registering && <button className="patient-auth-email-recovery" type="button" disabled={p.busy} onClick={p.onEmailRecovery}>Não acesso meu e-mail</button>}
      </form>
      <p className="patient-auth-security"><LockKeyhole size={13}/> Seus dados de saúde em segurança.</p>
    </div>
    <p className="patient-auth-footer">Hospital São Rafael <span>·</span> Portal do Paciente</p>
  </section>;
}
function AuthField({label,icon,wide,children}:{label:string;icon?:ReactNode;wide?:boolean;children:ReactNode}) {
  return <label className={`patient-auth-field ${wide ? "patient-auth-wide" : ""}`}><span>{label}</span><div>{icon}<div className="patient-auth-control">{children}</div></div></label>;
}
function PasswordEye({shown,onClick,confirmation=false}:{shown:boolean;onClick:()=>void;confirmation?:boolean}) {
  return <button type="button" className="patient-auth-eye" aria-label={`${shown ? "Ocultar" : "Mostrar"} ${confirmation ? "confirmação da senha" : "senha"}`} aria-pressed={shown} onClick={onClick}>{shown ? <EyeOff size={19}/> : <Eye size={19}/>}</button>;
}
