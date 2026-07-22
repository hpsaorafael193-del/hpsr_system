import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

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
