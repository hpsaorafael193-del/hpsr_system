"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PublicShell } from "@/components/public/PublicShell";
import { FormField, inputClass } from "@/components/ui/FormField";
import { registerSystemActivity } from "@/lib/administrative-storage";
import { createClient } from "@/lib/supabase";
import { setLoginPersistence } from "@/lib/auth-persistence";

type Request = {
  id: string;
  authUserId?: string;
  name: string;
  passport: string;
  email: string;
  cityPhone: string;
  discord: string;
  crm: string;
  specialty: string;
  requestedRole: string;
  createdAt: string;
  status: "Pendente" | "Aprovado" | "Recusado";
};

const initialForm = {
  name: "",
  passport: "",
  email: "",
  cityPhone: "",
  discord: "",
  crm: "",
  specialty: "Clínico Geral",
  requestedRole: "Estagiário de Enfermagem",
};

function LoginContent() {
  const searchParams = useSearchParams();
  const [register, setRegister] = useState(searchParams.get("google") === "register" || searchParams.get("register") === "1");
  const [message, setMessage] = useState("");
  const [authUserId, setAuthUserId] = useState<string>();
  const [form, setForm] = useState(initialForm);
  const [password, setPassword] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [rememberConnected, setRememberConnected] = useState(true);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(true);

  useEffect(() => {
    const authState = searchParams.get("auth");
    if (authState === "pending") setMessage("Seu cadastro ainda aguarda aprovação da administração.");
    if (authState === "rejected") setMessage("Seu cadastro foi recusado pela administração.");
    if (authState === "required") setMessage("Entre com uma conta liberada para acessar o dashboard.");
    const savedEmail = localStorage.getItem("hpsr-saved-login-email") || "";
    if (savedEmail) setLoginEmail(savedEmail);
  }, [searchParams]);

  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));


  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const client = createClient();
    if (!client) { setMessage("Configure o Supabase para utilizar o login."); return; }
    if (!loginEmail.trim() || !loginPassword) { setMessage("Informe e-mail e senha."); return; }
    setBusy(true);
    const { data, error } = await client.auth.signInWithPassword({ email: loginEmail.trim(), password: loginPassword });
    if (error || !data.user) { setMessage("Credenciais inválidas."); setBusy(false); return; }
    const { data: profile } = await client.from("profiles").select("access_status").eq("id", data.user.id).maybeSingle();
    if (profile?.access_status !== "Aprovado") {
      await client.auth.signOut();
      setMessage(profile?.access_status === "Recusado" ? "Seu cadastro foi recusado." : "Seu cadastro ainda aguarda aprovação da administração.");
      setBusy(false);
      return;
    }
    setLoginPersistence(true);
    if (rememberEmail) localStorage.setItem("hpsr-saved-login-email", loginEmail.trim());
    else localStorage.removeItem("hpsr-saved-login-email");
    window.location.href = "/dashboard";
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim() || !form.passport.trim() || !form.email.trim() || !form.discord.trim()) {
      setMessage("Preencha nome, passaporte, e-mail e Discord.");
      return;
    }

    setBusy(true);
    let resolvedAuthUserId = authUserId;
    const client = createClient();
    if (!resolvedAuthUserId) {
      if (!client) { setMessage("Configure o Supabase para criar o cadastro."); setBusy(false); return; }
      if (password.length < 6) { setMessage("A senha deve ter no mínimo 6 caracteres."); setBusy(false); return; }
      const { data, error } = await client.auth.signUp({ email: form.email.trim(), password, options: { data: { full_name: form.name.trim() } } });
      if (error || !data.user) { setMessage(error?.message || "Não foi possível criar a conta."); setBusy(false); return; }
      resolvedAuthUserId = data.user.id;
    }

    const createdAt = new Date().toISOString();
    const item: Request = {
      id: `staff-${Date.now()}`,
      authUserId: resolvedAuthUserId,
      ...form,
      createdAt,
      status: "Pendente",
    };

    if (!client) { setMessage("Não foi possível conectar ao Supabase."); setBusy(false); return; }
    const { error: requestError } = await client.rpc("submit_staff_registration", { request_id: item.id, request_payload: item });
    if (requestError) {
      setMessage(`A conta foi criada, mas a solicitação não foi registrada: ${requestError.message}`);
      await client.auth.signOut();
      setBusy(false);
      return;
    }
    await client.auth.signOut();

    void registerSystemActivity({
      module: "Cadastros médicos",
      action: "Nova solicitação",
      description: `${item.name} solicitou acesso como ${item.requestedRole}.`,
      actor: item.name,
      reference: item.passport,
    });

    setMessage("Solicitação enviada. Aguarde a aprovação da administração do hospital.");
    setAuthUserId(undefined);
    setPassword("");
    setForm(initialForm);
    setBusy(false);
  }

  return (
    <PublicShell>
      <section className="mx-auto grid min-h-[calc(100vh-82px)] max-w-7xl items-center gap-6 px-4 py-10 lg:grid-cols-2 lg:px-5">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-hpsr-wineLight">Área interna</p>
          <h1 className="mt-3 text-[clamp(1.7rem,5vw,2.55rem)] font-black text-hpsr-text">Login da equipe</h1>
          <p className="mt-4 max-w-xl text-hpsr-muted">Acesso restrito para profissionais autorizados.</p>
          <button
            type="button"
            onClick={() => {
              setRegister((value) => !value);
              setMessage("");
            }}
            className="mt-5 rounded-[14px] border border-hpsr-border bg-white px-4 py-3 text-sm font-black text-hpsr-wine"
          >
            {register ? "Voltar para o login" : "Solicitar cadastro médico"}
          </button>
        </div>

        {!register ? (
          <form onSubmit={handleLogin} className="hpsr-public-card p-4 shadow-soft">
            <div className="space-y-4">
              <FormField label="E-mail institucional"><input className={inputClass} type="email" value={loginEmail} onChange={(e)=>setLoginEmail(e.target.value)} /></FormField>
              <FormField label="Senha"><div className="relative"><input className={`${inputClass} pr-20`} type={showLoginPassword ? "text" : "password"} value={loginPassword} onChange={(e)=>setLoginPassword(e.target.value)} /><button type="button" onClick={() => setShowLoginPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-hpsr-wine">{showLoginPassword ? "Ocultar" : "Mostrar"}</button></div></FormField>
            </div>
            <div className="mt-4 space-y-2">
              <label className="flex cursor-pointer items-start gap-3 rounded-[14px] border border-hpsr-border bg-[#fffaf4] px-3 py-3">
                <input type="checkbox" checked={rememberEmail} onChange={(event) => setRememberEmail(event.target.checked)} className="mt-0.5 h-4 w-4 accent-hpsr-wine" />
                <span><span className="block text-sm font-black text-hpsr-text">Salvar e-mail</span><span className="mt-0.5 block text-xs text-hpsr-muted">Preenche automaticamente o e-mail no próximo acesso.</span></span>
              </label>
              <div className="rounded-[14px] border border-emerald-200 bg-emerald-50 px-3 py-3 text-xs font-bold text-emerald-800">A sessão permanecerá ativa ao atualizar, fechar e abrir novamente o navegador.</div>
            </div>
            {message && <p className="mt-4 rounded-[14px] border border-hpsr-border bg-[#fff8f0] px-3 py-2 text-sm font-semibold">{message}</p>}
            <button disabled={busy} className="mt-6 flex w-full justify-center rounded-[14px] bg-hpsr-wineLight px-4 py-3 font-black text-white disabled:opacity-60">{busy ? "Validando..." : "Entrar no painel"}</button>
          </form>
        ) : (
          <form onSubmit={submit} className="hpsr-public-card max-h-[78vh] overflow-y-auto p-4 shadow-soft">
            <h2 className="text-xl font-black text-hpsr-text">Solicitar acesso à equipe</h2>
            <p className="mt-1 text-sm text-hpsr-muted">A solicitação será enviada para aprovação administrativa.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <FormField label="Nome completo"><input className={inputClass} value={form.name} onChange={(e) => update("name", e.target.value)} /></FormField>
              <FormField label="Passaporte"><input className={inputClass} value={form.passport} onChange={(e) => update("passport", e.target.value)} /></FormField>
              <FormField label="E-mail"><input className={inputClass} type="email" value={form.email} onChange={(e) => update("email", e.target.value)} /></FormField>
              {!authUserId && <FormField label="Senha"><div className="relative"><input className={`${inputClass} pr-20`} type={showRegisterPassword ? "text" : "password"} value={password} minLength={6} onChange={(e)=>setPassword(e.target.value)} /><button type="button" onClick={() => setShowRegisterPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-hpsr-wine">{showRegisterPassword ? "Ocultar" : "Mostrar"}</button></div></FormField>}
              {!authUserId && <div className="sm:col-span-2 rounded-[14px] border-2 border-amber-400 bg-amber-50 px-4 py-3 text-sm font-black text-amber-900 shadow-sm">A senha deve ter no mínimo 6 caracteres.</div>}
              <FormField label="Telefone"><input className={inputClass} value={form.cityPhone} onChange={(e) => update("cityPhone", e.target.value)} /></FormField>
              <FormField label="Discord"><input className={inputClass} value={form.discord} onChange={(e) => update("discord", e.target.value)} /></FormField>
              <FormField label="CRM"><input className={inputClass} value={form.crm} onChange={(e) => update("crm", e.target.value)} /></FormField>
              <FormField label="Especialidade"><input className={inputClass} value={form.specialty} onChange={(e) => update("specialty", e.target.value)} /></FormField>
              <FormField label="Cargo solicitado">
                <select className={inputClass} value={form.requestedRole} onChange={(e) => update("requestedRole", e.target.value)}>
                  <option>Estagiário de Enfermagem</option>
                </select>
              </FormField>
            </div>
            {message && <p className="mt-4 rounded-[14px] border border-hpsr-border bg-[#fff8f0] px-3 py-2 text-sm font-semibold">{message}</p>}
            <button disabled={busy} className="mt-5 w-full rounded-[14px] bg-hpsr-wineLight px-4 py-3 font-black text-white disabled:opacity-60">{busy ? "Enviando..." : "Enviar solicitação de cadastro"}</button>
          </form>
        )}
      </section>
    </PublicShell>
  );
}


export default function LoginPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-hpsr-bg px-4"><div className="rounded-[18px] border border-hpsr-border bg-white px-6 py-5 text-center shadow-soft"><p className="text-sm font-black text-hpsr-text">Carregando acesso...</p></div></div>}>
      <LoginContent />
    </Suspense>
  );
}
