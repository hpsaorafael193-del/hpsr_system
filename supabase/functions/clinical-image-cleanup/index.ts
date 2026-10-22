// @ts-nocheck -- This file runs in the Supabase Deno Edge runtime.
Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return new Response(null, { status: 405 });
  const token = (request.headers.get("authorization") || "").replace(/^Bearer /, "");
  if (!/^[a-f0-9]{64}$/.test(token)) return new Response(null, { status: 401 });
  const url = Deno.env.get("SUPABASE_URL"), serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };
  async function rpc(name: string, args: unknown) {
    const response = await fetch(`${url}/rest/v1/rpc/${name}`, { method: "POST", headers, body: JSON.stringify(args) });
    if (!response.ok) throw new Error(`Cleanup RPC failed: ${name}`);
    return response.status === 204 ? null : response.json();
  }
  try {
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token))), byte => byte.toString(16).padStart(2,"0")).join("");
    if (await rpc("authorize_clinical_image_gc", { token_hash: hash }) !== true) return new Response(null, { status: 401 });
    const candidates = await rpc("clinical_image_cleanup_candidates", { target_owner: null });
    let removed = 0, retained = 0;
    for (const item of candidates || []) {
      if (!["clinical-assets","signatures"].includes(item.bucket_id) || !/^[a-f0-9-]{36}\//i.test(item.path)) continue;
      const used = await rpc("clinical_image_is_used", { target_bucket: item.bucket_id, target_path: item.path });
      if (used) {
        retained++;
        if (item.bucket_id === "signatures") await rpc("complete_signature_cleanup", { target_path: item.path, retained: true });
        continue;
      }
      const deleted = await fetch(`${url}/storage/v1/object/${item.bucket_id}`, { method: "DELETE", headers, body: JSON.stringify({ prefixes: [item.path] }) });
      if (!deleted.ok) continue;
      removed++;
      if (item.bucket_id === "signatures") await rpc("complete_signature_cleanup", { target_path: item.path, retained: false });
    }
    await rpc("complete_signature_cleanup", { target_path: "", retained: false });
    return Response.json({ ok: true, removed, retained });
  } catch { return Response.json({ error: "Cleanup deferred; no clinical record was removed." }, { status: 500 }); }
});

