import { createBrowserClient } from "@supabase/ssr";
import { createClient as createSupabaseJsClient, type SupabaseClient } from "@supabase/supabase-js";

function getSupabasePublicKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getSupabasePublicKey();
  return Boolean(url?.trim() && key?.trim());
}

let browserClient: SupabaseClient | null | undefined;

export function createClient() {
  if (browserClient !== undefined) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getSupabasePublicKey();

  if (!url?.trim() || !key?.trim()) {
    browserClient = null;
    return browserClient;
  }

  // Mantém uma única instância por aba. Isso evita recriar o cliente,
  // listeners de autenticação e estruturas internas a cada consulta.
  browserClient = createBrowserClient(url, key);
  return browserClient;
}

let passwordRecoveryClient: SupabaseClient | null | undefined;

/**
 * Cliente isolado apenas para recuperação de senha por e-mail.
 *
 * O cliente principal usa PKCE/SSR, que depende do code_verifier salvo no
 * navegador que iniciou o fluxo. Para links de recuperação enviados por
 * e-mail isso é frágil: o paciente pode abrir o link em outro dispositivo ou
 * navegador e receber "PKCE code verifier not found".
 *
 * A recuperação acontece inteiramente no navegador, então usamos implicit
 * flow somente aqui. O token volta no fragmento da URL, é processado pelo
 * supabase-js e não depende do storage do dispositivo que pediu o link.
 * O storageKey separado impede interferência na sessão normal do HPSR.
 */
export function createPasswordRecoveryClient() {
  if (passwordRecoveryClient !== undefined) return passwordRecoveryClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getSupabasePublicKey();

  if (!url?.trim() || !key?.trim()) {
    passwordRecoveryClient = null;
    return passwordRecoveryClient;
  }

  passwordRecoveryClient = createSupabaseJsClient(url, key, {
    auth: {
      flowType: "implicit",
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: false,
      storageKey: "hpsr-password-recovery",
    },
  });

  return passwordRecoveryClient;
}
