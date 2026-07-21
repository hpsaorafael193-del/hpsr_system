"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase";
import { readLocalAuthSession } from "@/lib/local-auth";
import { getAuthContext, hasValidLoginPersistence } from "@/lib/auth-persistence";

export function DashboardAccessGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<"checking" | "approved">("checking");

  useEffect(() => {
    let active = true;

    async function validateAccess() {
      if (!isSupabaseConfigured()) {
        const localSession = readLocalAuthSession();
        if (localSession?.approved && localSession.systemRole === "Dev / Desenvolvedor do Sistema") {
          if (active) setState("approved");
          return;
        }
        router.replace("/?auth=required");
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

    void validateAccess();
    return () => { active = false; };
  }, [router]);

  if (state === "approved") return <>{children}</>;

  return (
    <div className="grid min-h-screen place-items-center bg-hpsr-bg px-4">
      <div className="rounded-[18px] border border-hpsr-border bg-white px-6 py-5 text-center shadow-soft">
        <ShieldCheck className="mx-auto animate-pulse text-hpsr-wine" size={30} />
        <p className="mt-3 text-sm font-black text-hpsr-text">Validando liberação de acesso...</p>
      </div>
    </div>
  );
}
