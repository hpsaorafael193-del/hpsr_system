"use client";

import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, KeyRound, LockKeyhole } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { createClient } from "@/lib/supabase";

export default function RedefinirSenhaPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("Validando o link de recuperação...");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const client = createClient();
    if (!client) {
      setMessage("Não foi possível conectar ao Supabase.");
      return;
    }

    let active = true;
    const validateSession = async () => {
      const { data } = await client.auth.getSession();
      if (!active) return;
      if (data.session) {
        setReady(true);
        setMessage("");
      } else {
        setMessage("O link é inválido ou expirou. Solicite uma nova redefinição na tela de login.");
      }
    };

    void validateSession();
    const { data: listener } = client.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || session) {
        setReady(true);
        setMessage("");
      }
    });

    return () => {
      active = false;
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
    const client = createClient();
    if (!client) {
      setMessage("Não foi possível conectar ao Supabase.");
      return;
    }
    setSaving(true);
    const { error } = await client.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      setMessage(error.message || "Não foi possível atualizar a senha.");
      return;
    }
    await client.auth.signOut();
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
            <p className="mt-2 text-sm text-white/75">Crie uma nova senha para acessar o painel do Hospital São Rafael.</p>
          </div>

          <div className="p-6">
            {success ? (
              <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 p-5 text-center">
                <CheckCircle2 className="mx-auto text-emerald-700" size={34} />
                <p className="mt-3 font-black text-emerald-900">{message}</p>
                <a href="/login" className="mt-5 inline-flex rounded-[14px] bg-hpsr-wine px-5 py-3 text-sm font-black text-white">Voltar ao login</a>
              </div>
            ) : ready ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <PasswordField label="Nova senha" value={password} onChange={setPassword} />
                <PasswordField label="Confirmar nova senha" value={confirm} onChange={setConfirm} />
                <p className="rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-900">A senha deve ter no mínimo 6 caracteres.</p>
                {message && <p className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{message}</p>}
                <button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-[15px] bg-hpsr-wine px-4 py-3 text-sm font-black text-white disabled:opacity-60"><LockKeyhole size={17} />{saving ? "Salvando..." : "Salvar nova senha"}</button>
              </form>
            ) : (
              <div className="rounded-[16px] border border-hpsr-border bg-[#fffaf4] p-5 text-center text-sm font-semibold text-hpsr-muted">{message}</div>
            )}
          </div>
        </section>
      </main>
    </PublicShell>
  );
}

function PasswordField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-[.12em] text-hpsr-wineLight">{label}</span><div className="flex items-center gap-3 rounded-[15px] border border-hpsr-border bg-[#fffaf4] px-4"><LockKeyhole size={17} className="text-hpsr-wine"/><input type="password" minLength={6} value={value} onChange={(event)=>onChange(event.target.value)} className="min-h-[48px] w-full bg-transparent text-sm font-semibold outline-none" /></div></label>;
}
