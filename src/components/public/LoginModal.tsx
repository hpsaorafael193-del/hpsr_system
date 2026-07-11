"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { BadgeInfo, Hash, IdCard, Lock, LogIn, Mail, Phone, ShieldCheck, Stethoscope, UserRound, X } from "lucide-react";
import { GoogleAuthButton } from "@/components/ui/GoogleAuthButton";
import { currentUserProfile } from "@/data/current-user-profile";
import { createClient, isSupabaseConfigured } from "@/lib/supabase";
import { LOCAL_AUTH_SESSION_KEY, STAFF_REGISTRATION_REQUESTS_KEY } from "@/lib/local-auth";
import { registerSystemActivity } from "@/lib/administrative-storage";

type AccessMode = "login" | "register";

export function LoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<AccessMode>("login");
  const [authMessage, setAuthMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    cityPhone: "",
    passport: "",
    crm: "",
  });
  const router = useRouter();
  const supabaseConfigured = isSupabaseConfigured();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) setMode("login");
  }, [open]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthMessage("");

    if (!supabaseConfigured) {
      localStorage.setItem(LOCAL_AUTH_SESSION_KEY, JSON.stringify({
        approved: true,
        role: currentUserProfile.role,
        systemRole: currentUserProfile.systemRole,
        email: currentUserProfile.email,
        createdAt: new Date().toISOString(),
      }));
      onClose();
      router.push("/dashboard");
      return;
    }

    if (!loginForm.email.trim() || !loginForm.password) {
      setAuthMessage("Informe o e-mail e a senha.");
      return;
    }

    const client = createClient();
    if (!client) {
      setAuthMessage("Não foi possível conectar ao Supabase.");
      return;
    }

    setAuthLoading(true);
    const { data, error } = await client.auth.signInWithPassword({
      email: loginForm.email.trim(),
      password: loginForm.password,
    });

    if (error || !data.user) {
      setAuthLoading(false);
      setAuthMessage(error?.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : error?.message || "Não foi possível entrar.");
      return;
    }

    const { data: profile, error: profileError } = await client
      .from("profiles")
      .select("access_status")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError || profile?.access_status !== "Aprovado") {
      const statusMessage = profile?.access_status === "Recusado"
        ? "Seu cadastro foi recusado pela administração."
        : "Seu cadastro ainda aguarda aprovação da administração.";
      await client.auth.signOut();
      setAuthLoading(false);
      setAuthMessage(statusMessage);
      return;
    }

    setAuthLoading(false);
    onClose();
    router.push("/dashboard");
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = registerForm;
    setAuthMessage("");

    if (!form.name.trim() || !form.passport.trim() || !form.crm.trim() || !form.email.trim()) {
      setAuthMessage("Preencha nome, passaporte, CRM e e-mail.");
      return;
    }
    if (supabaseConfigured && form.password.length < 6) {
      setAuthMessage("A senha deve possuir pelo menos 6 caracteres.");
      return;
    }

    const requestId = `staff-${Date.now()}`;
    const item = {
      id: requestId,
      name: form.name.trim(),
      passport: form.passport.trim(),
      email: form.email.trim(),
      cityPhone: form.cityPhone.trim(),
      discord: "",
      crm: form.crm.trim(),
      specialty: "Clínico Geral",
      requestedRole: "Médico Clínico",
      createdAt: new Date().toISOString(),
      status: "Pendente",
    };

    if (supabaseConfigured) {
      const client = createClient();
      if (!client) {
        setAuthMessage("Não foi possível conectar ao Supabase.");
        return;
      }

      setAuthLoading(true);
      const { data, error } = await client.auth.signUp({
        email: item.email,
        password: form.password,
        options: {
          data: {
            name: item.name,
            passport: item.passport,
            crm: item.crm,
            cityPhone: item.cityPhone,
            specialty: item.specialty,
            requestedRole: item.requestedRole,
            registrationRequestId: requestId,
          },
        },
      });

      if (error) {
        setAuthLoading(false);
        setAuthMessage(error.message);
        return;
      }

      if (data.session) {
        const { error: requestError } = await client.rpc("submit_staff_registration", {
          request_id: requestId,
          request_payload: item,
        });
        if (requestError) {
          setAuthLoading(false);
          setAuthMessage(`Conta criada, mas a solicitação não foi registrada: ${requestError.message}`);
          await client.auth.signOut();
          return;
        }
        await client.auth.signOut();
      }
      setAuthLoading(false);
    } else {
      let current: Array<Record<string, unknown>> = [];
      try { current = JSON.parse(localStorage.getItem(STAFF_REGISTRATION_REQUESTS_KEY) || "[]"); } catch {}
      if (current.some((entry) => entry.passport === item.passport && entry.status === "Pendente")) {
        setAuthMessage("Já existe uma solicitação pendente para este passaporte.");
        return;
      }
      localStorage.setItem(STAFF_REGISTRATION_REQUESTS_KEY, JSON.stringify([item, ...current]));
    }

    registerSystemActivity({
      module: "Cadastros médicos",
      action: "Nova solicitação",
      description: `${item.name} solicitou acesso como ${item.requestedRole}.`,
      actor: item.name,
      reference: item.passport,
    });
    setRegisterForm({ name: "", email: "", password: "", cityPhone: "", passport: "", crm: "" });
    setAuthMessage("Cadastro criado. O acesso permanecerá bloqueado até a aprovação da administração.");
  }

  if (!open || !mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="medical-login-title"
      className="fixed inset-0 z-[99999] grid min-h-dvh place-items-center overflow-y-auto px-4 py-3"
    >
      <button
        type="button"
        aria-label="Fechar modal de login"
        onClick={onClose}
        className="hpsr-modal-backdrop"
      />

      <div className="hpsr-modal-shell my-auto max-w-xl overflow-hidden">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-hpsr-wine/12 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-[#d7b89f]/20 blur-2xl" />

        <div className="relative border-b border-hpsr-border bg-[linear-gradient(135deg,#fffaf4_0%,#f6eadc_58%,#ead8c6_100%)] p-3.5 md:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[15px] bg-[linear-gradient(135deg,#672614,#2a0700)] text-white shadow-[0_8px_18px_rgba(42,7,0,0.14)]">
                <Stethoscope size={19} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-hpsr-wine">Área restrita</p>
                <h2 id="medical-login-title" className="mt-0.5 text-lg font-black text-hpsr-text">Acesso Médico</h2>
                <p className="mt-0.5 max-w-xl text-xs leading-relaxed text-hpsr-muted">
                  {mode === "login"
                    ? "Entre com suas credenciais para acessar o painel interno do Hospital São Rafael."
                    : "Cadastre seu acesso para solicitar entrada no painel interno."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[14px] border border-hpsr-border bg-white/[0.86] text-hpsr-muted transition hover:bg-white hover:text-hpsr-wine"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {[
              "Acesso interno",
              "Dados protegidos",
              "Serviço médico",
            ].map((item) => (
              <div key={item} className="rounded-[12px] border border-hpsr-border bg-white/55 px-2 py-1.5 text-center text-[10px] font-black text-hpsr-wine">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative p-3.5 md:p-5">
          <div className="mb-4 grid grid-cols-2 gap-1.5 rounded-[16px] border border-hpsr-border bg-[#fffaf4] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`rounded-[13px] px-3 py-2 text-sm font-black transition ${
                mode === "login" ? "bg-[linear-gradient(135deg,#672614,#2a0700)] text-white shadow-[0_8px_18px_rgba(42,7,0,0.13)]" : "text-hpsr-text hover:bg-white"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`rounded-[13px] px-3 py-2 text-sm font-black transition ${
                mode === "register" ? "bg-[linear-gradient(135deg,#672614,#2a0700)] text-white shadow-[0_8px_18px_rgba(42,7,0,0.13)]" : "text-hpsr-text hover:bg-white"
              }`}
            >
              Cadastrar
            </button>
          </div>

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-3 rounded-[18px] border border-hpsr-border bg-white/[0.78] p-3.5">
              {supabaseConfigured ? <GoogleAuthButton mode="login" onError={setAuthMessage} /> : (
                <div className="rounded-[14px] border border-blue-200 bg-blue-50 px-3 py-2.5 text-[11px] font-bold leading-relaxed text-blue-900">
                  Modo local ativo. O Supabase ainda não está configurado; o acesso é liberado somente para o perfil Dev cadastrado no sistema.
                </div>
              )}
              {supabaseConfigured && <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[.12em] text-hpsr-muted"><span className="h-px flex-1 bg-hpsr-border"/>ou use as credenciais<span className="h-px flex-1 bg-hpsr-border"/></div>}
              <div className="mb-1 flex items-center gap-2 rounded-[14px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-800">
                <ShieldCheck size={16} />
                Acesso restrito a profissionais autorizados.
              </div>

              {supabaseConfigured && <>
                <AccessField label="E-mail institucional" icon={<Mail size={16} className="text-hpsr-wine" />}>
                  <input type="email" value={loginForm.email} onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))} placeholder="medico@saorafael.com" className="w-full bg-transparent text-[13px] font-semibold text-hpsr-text outline-none placeholder:text-zinc-400" />
                </AccessField>
                <AccessField label="Senha" icon={<Lock size={16} className="text-hpsr-wine" />}>
                  <input type="password" value={loginForm.password} onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))} placeholder="Digite sua senha" className="w-full bg-transparent text-[13px] font-semibold text-hpsr-text outline-none placeholder:text-zinc-400" />
                </AccessField>
              </>}

              <button
                type="submit"
                className="mt-1 inline-flex w-full items-center justify-center gap-2.5 rounded-[15px] bg-[linear-gradient(135deg,#672614,#2a0700)] px-4 py-3 text-sm font-black text-white transition hover:bg-hpsr-wineDark"
              >
                <LogIn size={16} />
                {authLoading ? "Validando..." : supabaseConfigured ? "Entrar no painel" : "Entrar como Dev local"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="max-h-[52vh] space-y-3 overflow-y-auto rounded-[18px] border border-hpsr-border bg-white/[0.78] p-3.5 pr-3">
              {supabaseConfigured && <GoogleAuthButton mode="register" registrationData={{ name: registerForm.name, passport: registerForm.passport, crm: registerForm.crm, email: registerForm.email, cityPhone: registerForm.cityPhone, specialty: "Clínico Geral", requestedRole: "Médico Clínico" }} onError={setAuthMessage} />}
              <div className="rounded-[14px] border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] font-bold leading-relaxed text-blue-900">
                O cadastro será bloqueado até a aprovação da administração. Mesmo com Google, nome, passaporte e CRM são obrigatórios.
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <AccessField label="Nome Completo *" icon={<UserRound size={16} className="text-hpsr-wine" />}>
                  <input
                    type="text"
                    value={registerForm.name}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Nome do médico"
                    className="w-full bg-transparent text-[13px] font-semibold text-hpsr-text outline-none placeholder:text-zinc-400"
                  />
                </AccessField>

                <AccessField label="Email" icon={<Mail size={16} className="text-hpsr-wine" />}>
                  <input
                    type="email"
                    value={registerForm.email}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="email@exemplo.com"
                    className="w-full bg-transparent text-[13px] font-semibold text-hpsr-text outline-none placeholder:text-zinc-400"
                  />
                </AccessField>

                <AccessField label="Senha" icon={<Lock size={16} className="text-hpsr-wine" />}>
                  <input
                    type="password"
                    value={registerForm.password}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder="Crie uma senha"
                    className="w-full bg-transparent text-[13px] font-semibold text-hpsr-text outline-none placeholder:text-zinc-400"
                  />
                </AccessField>

                <AccessField label="Celular (Opcional)" icon={<Phone size={16} className="text-hpsr-wine" />}>
                  <input
                    type="tel"
                    value={registerForm.cityPhone}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, cityPhone: event.target.value }))}
                    placeholder="Telefone na cidade"
                    className="w-full bg-transparent text-[13px] font-semibold text-hpsr-text outline-none placeholder:text-zinc-400"
                  />
                </AccessField>

                <AccessField label="Passaporte *" icon={<IdCard size={16} className="text-hpsr-wine" />}>
                  <input
                    type="text"
                    value={registerForm.passport}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, passport: event.target.value }))}
                    placeholder="Ex: 876"
                    className="w-full bg-transparent text-[13px] font-semibold text-hpsr-text outline-none placeholder:text-zinc-400"
                  />
                </AccessField>

                <AccessField label="CRM *" icon={<Hash size={16} className="text-hpsr-wine" />}>
                  <input
                    type="text"
                    value={registerForm.crm}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, crm: event.target.value }))}
                    placeholder="Ex: 8761504"
                    className="w-full bg-transparent text-[13px] font-semibold text-hpsr-text outline-none placeholder:text-zinc-400"
                  />
                </AccessField>
              </div>

              <div className="flex gap-2.5 rounded-[14px] border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs leading-relaxed text-blue-900">
                <BadgeInfo size={16} className="mt-0.5 shrink-0 text-blue-600" />
                <p>
                  <strong>Como formar o CRM:</strong> use o passaporte do médico junto com o dia e mês de aniversário.
                  Exemplo: passaporte <strong>876</strong> + aniversário <strong>15/04</strong> = <strong>8761504</strong>.
                </p>
              </div>

              <button
                type="submit"
                className="mt-1 inline-flex w-full items-center justify-center gap-2.5 rounded-[15px] bg-[linear-gradient(135deg,#672614,#2a0700)] px-4 py-3 text-sm font-black text-white transition hover:bg-hpsr-wineDark"
              >
                <LogIn size={16} />
                {authLoading ? "Criando cadastro..." : "Criar cadastro"}
              </button>
            </form>
          )}

          {authMessage && <p className="mt-3 rounded-[14px] border border-amber-200 bg-amber-50 px-3 py-2.5 text-center text-[11px] font-bold text-amber-900">{authMessage}</p>}
          <p className="mt-3 rounded-[14px] border border-hpsr-border bg-[#fffaf4] px-3 py-2.5 text-center text-[11px] font-bold leading-relaxed text-hpsr-muted">
            O dashboard só é liberado após a aprovação da solicitação pela administração.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}

function AccessField({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-hpsr-wineLight">{label}</span>
      <div className="flex min-h-[38px] items-center gap-3 rounded-[16px] border border-hpsr-border bg-[#fffaf4] px-4 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition focus-within:border-hpsr-wineLight focus-within:bg-white focus-within:ring-2 focus-within:ring-hpsr-wineLight/20">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] bg-white text-hpsr-wine">
          {icon}
        </span>
        {children}
      </div>
    </label>
  );
}
