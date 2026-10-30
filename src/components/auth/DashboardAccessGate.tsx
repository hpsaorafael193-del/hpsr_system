"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase";
import { getAuthContext, hasValidLoginPersistence } from "@/lib/auth-persistence";

export function DashboardAccessGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<"checking" | "approved" | "unavailable">("checking");

  useEffect(() => {
    let active = true;

    async function validateAccess() {
      try {
        window.localStorage.removeItem("hpsr-local-auth-session");
        window.localStorage.removeItem("hpsr-demo-session");
      } catch { /* Local storage is optional; access still requires Supabase approval. */ }
      if (!isSupabaseConfigured()) {
        if (active) setState("unavailable");
        return;
      }

      const client = createClient();
      if (!client) {
        router.replace("/?auth=required");
        return;
      }

      if (getAuthContext() !== "professional" || !hasValidLoginPersistence()) {
        await client.auth.signOut();
        router.replace("/?auth=required");
        return;
      }

      const { data: sessionData } = await client.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        router.replace("/?auth=required");
        return;
      }

      const { data: profile, error } = await client
        .from("profiles")
        .select("access_status")
        .eq("id", user.id)
        .maybeSingle();

      if (error || profile?.access_status !== "Aprovado") {
        const status = profile?.access_status === "Recusado" ? "rejected" : "pending";
        await client.auth.signOut();
        router.replace(`/?auth=${status}`);
        return;
      }

      if (active) setState("approved");
    }

    void validateAccess().catch(() => { if (active) setState("unavailable"); });
    return () => { active = false; };
  }, [router]);

  if (state === "approved") return <>{children}</>;

  if (state === "unavailable") return (
    <div className="grid min-h-screen place-items-center bg-hpsr-bg px-4">
      <div role="alert" className="max-w-md rounded-[18px] border border-hpsr-border bg-hpsr-paper px-6 py-5 text-center shadow-soft">
        <ShieldCheck className="mx-auto text-hpsr-wine" size={30} />
        <h1 className="mt-3 font-black text-hpsr-text">Acesso temporariamente indisponível</h1>
        <p className="mt-2 text-sm text-hpsr-muted">Não foi possível validar o acesso com o serviço de autenticação. Contate a administração ou tente novamente mais tarde.</p>
        <button type="button" onClick={() => router.replace("/")} className="mt-4 rounded-xl bg-hpsr-wine px-4 py-2 text-sm font-bold text-white">Voltar ao início</button>
      </div>
    </div>
  );

  return (
    <div className="grid min-h-screen place-items-center bg-hpsr-bg px-4">
      <div className="rounded-[18px] border border-hpsr-border bg-white px-6 py-5 text-center shadow-soft">
        <ShieldCheck className="mx-auto animate-pulse text-hpsr-wine" size={30} />
        <p className="mt-3 text-sm font-black text-hpsr-text">Validando liberação de acesso...</p>
      </div>
    </div>
  );
}
