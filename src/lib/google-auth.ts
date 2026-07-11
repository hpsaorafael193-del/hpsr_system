import { createClient, isSupabaseConfigured } from "@/lib/supabase";

export type GoogleAuthMode = "login" | "register";

export type GoogleRegistrationData = { name: string; passport: string; crm: string; email?: string; cityPhone?: string; specialty?: string; requestedRole?: string };

export async function startGoogleAuth(mode: GoogleAuthMode, registrationData?: GoogleRegistrationData) {
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

  const next = mode === "register" ? "/?auth=pending" : "/dashboard";
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}&mode=${mode}`;
  const { error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: { access_type: "offline", prompt: "select_account" },
    },
  });

  return error ? { ok: false, error: error.message } : { ok: true };
}
