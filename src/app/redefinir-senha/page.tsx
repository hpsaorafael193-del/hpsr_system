"use client";

import { FormEvent, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, KeyRound, LockKeyhole, RefreshCw } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { createPasswordRecoveryClient } from "@/lib/supabase";

const expiredMessage = "Este link não pode mais ser usado. Solicite um novo link de recuperação.";

export default function RedefinirSenhaPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("Validando o link de recuperação...");
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [origin, setOrigin] = useState<"paciente" | "equipe">("paciente");

  useEffect(() => {
    const client = createPasswordRecoveryClient();
    if (!client) {
      setChecking(false);
      setMessage("Não foi possível conectar ao Supabase.");
      return;
    }

    let active = true;
    let resolved = false;
    let expiryTimer: number | undefined;

    const url = new URL(window.location.href);
    const queryOrigin = url.searchParams.get("origem");
    let preferredOrigin: "paciente" | "equipe" | null =
      queryOrigin === "equipe" ? "equipe" : queryOrigin === "paciente" ? "paciente" : null;

    if (!preferredOrigin) {
      try {
        const saved = window.localStorage.getItem("hpsr_password_recovery_origin");
        if (saved === "paciente" || saved === "equipe") preferredOrigin = saved;
      } catch {}
    }

    // Links antigos sem identificação pertencem ao Portal do Paciente por padrão.
    // Isso evita que uma recuperação do paciente caia no login interno da equipe.
    setOrigin(preferredOrigin || "paciente");

    const detectOrigin = async (userId?: string) => {
      if (!active || preferredOrigin || !userId) return;
      try {
        const [{ data: patientAccount }, { data: staffProfile }] = await Promise.all([
          client.from("patient_accounts").select("user_id").eq("user_id", userId).maybeSingle(),
          client.from("profiles").select("id").eq("id", userId).maybeSingle(),
        ]);
        if (active) setOrigin(patientAccount && !staffProfile ? "paciente" : "equipe");
      } catch {}
    };

    const acceptSession = (session?: { user?: { id?: string } } | null) => {
      if (!active || resolved) return;
      resolved = true;
      if (expiryTimer) window.clearTimeout(expiryTimer);
      setReady(true);
      setChecking(false);
      setMessage("");
      void detectOrigin(session?.user?.id);
      // Remove parâmetros/tokens da barra sem perder a origem usada nos botões da tela.
      window.history.replaceState({}, document.title, url.pathname);
    };

    const rejectLink = (_detail?: string) => {
      if (!active || resolved) return;
      resolved = true;
      setReady(false);
      setChecking(false);
      // Não expõe mensagens internas de Auth (PKCE, storage, tokens) ao paciente.
      setMessage(expiredMessage);
    };

    const queryError = url.searchParams.get("error_description") || url.searchParams.get("error");
    const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
    const hashError = hash.get("error_description") || hash.get("error");
    if (queryError || hashError) {
      const detail = queryError || hashError || undefined;
      rejectLink(detail ? decodeURIComponent(detail.replace(/\+/g, " ")) : undefined);
      return () => { active = false; };
    }

    // O cliente do Supabase processa o retorno da recuperação e emite PASSWORD_RECOVERY.
    // Não trocamos o code manualmente aqui: tentar fazer as duas coisas pode consumir
    // o mesmo código duas vezes e transformar um link válido em "expirado".
    const { data: listener } = client.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" && session) acceptSession(session);
    });

    // Dá tempo para o SDK concluir o processamento do callback. Sessões normais não
    // liberam esta tela: somente PASSWORD_RECOVERY é aceito.
    expiryTimer = window.setTimeout(() => {
      if (!resolved) rejectLink();
    }, 10000);

    return () => {
      active = false;
      if (expiryTimer) window.clearTimeout(expiryTimer);
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (password.length < 6) {
      setMessage("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setMessage("A confirmação não corresponde à nova senha.");
      return;
    }
    const client = createPasswordRecoveryClient();
    if (!client) {
      setMessage("Não foi possível conectar ao Supabase.");
      return;
    }
    setSaving(true);
    const { error } = await client.auth.updateUser({ password });
    if (error) {
      setSaving(false);
      setMessage(error.message || "Não foi possível atualizar a senha.");
      return;
    }
    try { window.localStorage.removeItem("hpsr_password_recovery_origin"); } catch {}
    await client.auth.signOut({ scope: "local" });
    setSaving(false);
    setSuccess(true);
    setReady(false);
    setMessage("Senha redefinida com sucesso. Entre novamente usando a nova senha.");
  }

  return (
    <PublicShell>
      <main className="mx-auto flex min-h-[calc(100vh-82px)] max-w-2xl items-center px-4 py-10">
        <section className="w-full overflow-hidden rounded-[24px] border border-white/80 bg-white shadow-[0_24px_70px_rgba(79,42,21,0.14)]">
          <div className="bg-[linear-gradient(135deg,#6f2b17_0%,#321008_100%)] px-6 py-7 text-white">
            <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-white/15"><KeyRound size={24} /></div>
            <p className="mt-4 text-[10px] font-black uppercase tracking-[.18em] text-white/70">Segurança de acesso</p>
            <h1 className="mt-1 text-2xl font-black">Redefinir senha</h1>
            <p className="mt-2 text-sm text-white/75">Crie uma nova senha para acessar o Hospital São Rafael.</p>
          </div>

          <div className="p-6">
            {success ? (
              <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 p-5 text-center">
                <CheckCircle2 className="mx-auto text-emerald-700" size={34} />
                <p className="mt-3 font-black text-emerald-900">{message}</p>
                <a href={origin === "paciente" ? "/paciente" : "/?acesso=medico"} className="mt-5 inline-flex rounded-[14px] bg-hpsr-wine px-5 py-3 text-sm font-black text-white">{origin === "paciente" ? "Voltar ao Portal do Paciente" : "Voltar ao login"}</a>
              </div>
            ) : ready ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <PasswordField label="Nova senha" value={password} onChange={setPassword} />
                <PasswordField label="Confirmar nova senha" value={confirm} onChange={setConfirm} />
                <p className="rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-900">A senha deve ter no mínimo 6 caracteres.</p>
                {message && <p className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{message}</p>}
                <button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-[15px] bg-hpsr-wine px-4 py-3 text-sm font-black text-white disabled:opacity-60"><LockKeyhole size={17} />{saving ? "Salvando..." : "Salvar nova senha"}</button>
              </form>
            ) : checking ? (
              <div className="rounded-[16px] border border-hpsr-border bg-[#fffaf4] p-5 text-center text-sm font-semibold text-hpsr-muted">
                <RefreshCw className="mx-auto mb-3 animate-spin text-hpsr-wine" size={25} />
                {message}
              </div>
            ) : (
              <div className="rounded-[18px] border border-amber-200 bg-amber-50 p-5 text-center">
                <AlertCircle className="mx-auto text-amber-700" size={32} />
                <p className="mt-3 text-sm font-bold leading-relaxed text-amber-950">{message}</p>
                <a href={origin === "paciente" ? "/paciente" : "/?acesso=medico"} className="mt-5 inline-flex rounded-[14px] bg-hpsr-wine px-5 py-3 text-sm font-black text-white">Solicitar novo link</a>
              </div>
            )}
          </div>
        </section>
      </main>
    </PublicShell>
  );
}

function PasswordField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-[.12em] text-hpsr-wineLight">{label}</span><div className="flex items-center gap-3 rounded-[15px] border border-hpsr-border bg-[#fffaf4] px-4"><LockKeyhole size={17} className="text-hpsr-wine"/><input type="password" minLength={6} autoComplete="new-password" value={value} onChange={(event)=>onChange(event.target.value)} className="min-h-[48px] w-full bg-transparent text-sm font-semibold outline-none" /></div></label>;
}
