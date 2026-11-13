export async function readClosureStatus(): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Conexão indisponível.");
  const response = await fetch(new URL("/rest/v1/rpc/hpsr_closure_active", url), {
    method: "POST", headers: { apikey: key, "Content-Type": "application/json" },
    body: "{}", cache: "no-store",
  });
  if (!response.ok) throw new Error("Modo de encerramento indisponível.");
  const result = await response.json();
  if (typeof result !== "boolean") throw new Error("Estado de encerramento inválido.");
  return result;
}
