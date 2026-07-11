import { createClient, isSupabaseConfigured } from "@/lib/supabase";
import { setLoginPersistence } from "@/lib/auth-persistence";

export type GoogleAuthMode = "login" | "register";

export type GoogleRegistrationData = { name: string; passport: string; crm: string; email?: string; cityPhone?: string; specialty?: string; requestedRole?: string };

export async function startGoogleAuth(mode: GoogleAuthMode, registrationData?: GoogleRegistrationData, rememberConnected = true) {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Configure o Supabase para habilitar o acesso com Google." };
  }

  const client = createClient();
  if (!client) return { ok: false, error: "Não foi possível iniciar a autenticação." };

  if (mode === "register") {
    if (!registrationData?.name.trim() || !registrationData.passport.trim() || !registrationData.crm.trim()) {
      return { ok: false, error: "Preencha nome, passaporte e CRM antes de continuar com Google." };
    }
    sessionStorage.setItem("hpsr-google-registration", JSON.stringify({ ...registrationData, createdAt: new Date().toISOString(), status: "Pendente" }));
  }

  if (mode === "login") setLoginPersistence(rememberConnected);

  const next = mode === "register" ? "/?auth=pending" : "/dashboard";
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}&mode=${mode}`;
  const { error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: { access_type: "offline", prompt: "select_account" },
    },
  });

  if (!error) return { ok: true };
  const providerDisabled = error.message.toLowerCase().includes("provider is not enabled") || error.message.toLowerCase().includes("unsupported provider");
  return { ok: false, error: providerDisabled ? "O login com Google ainda não está habilitado no Supabase. Ative o provedor Google em Authentication → Providers e configure o Client ID e o Client Secret." : error.message };
}
