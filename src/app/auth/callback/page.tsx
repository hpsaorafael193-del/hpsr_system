"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PublicShell } from "@/components/public/PublicShell";
import { createClient } from "@/lib/supabase";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Validando acesso com Google...");

  useEffect(() => {
    async function finishAuthentication() {
      const client = createClient();
      const code = searchParams.get("code");
      const mode = searchParams.get("mode") === "register" ? "register" : "login";
      const next = searchParams.get("next") || (mode === "register" ? "/?google=register" : "/dashboard");

      if (!client || !code) {
        setMessage("Não foi possível concluir o acesso com Google.");
        return;
      }

      const { error } = await client.auth.exchangeCodeForSession(code);
      if (error) {
        setMessage(`Falha ao autenticar: ${error.message}`);
        return;
      }

      if (mode === "register") {
        const rawRegistration = sessionStorage.getItem("hpsr-google-registration");
        if (!rawRegistration) {
          await client.auth.signOut();
          router.replace("/?auth=registration-data-missing");
          return;
        }
        const registration = JSON.parse(rawRegistration) as Record<string, string>;
        const requestId = `staff-${Date.now()}`;
        const payload = { ...registration, id: requestId, email: (await client.auth.getUser()).data.user?.email || registration.email || "" };
        const { error: requestError } = await client.rpc("submit_staff_registration", { request_id: requestId, request_payload: payload });
        sessionStorage.removeItem("hpsr-google-registration");
        await client.auth.signOut();
        if (requestError) {
          setMessage(`Conta Google validada, mas a solicitação não foi registrada: ${requestError.message}`);
          return;
        }
        router.replace("/?auth=pending");
        return;
      }

      if (mode === "login") {
        const { data: authData } = await client.auth.getUser();
        if (authData.user) {
          const { data: profile } = await client
            .from("profiles")
            .select("access_status")
            .eq("id", authData.user.id)
            .maybeSingle();

          if (profile?.access_status !== "Aprovado") {
            await client.auth.signOut();
            router.replace(`/?auth=pending`);
            return;
          }
        }
      }

      router.replace(next);
    }

    void finishAuthentication();
  }, [router, searchParams]);

  return (
    <PublicShell>
      <section className="mx-auto grid min-h-[calc(100vh-82px)] max-w-3xl place-items-center px-4 py-12">
        <div className="hpsr-public-card w-full p-6 text-center shadow-soft">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-hpsr-wineLight">Autenticação segura</p>
          <h1 className="mt-3 text-2xl font-black text-hpsr-text">Acesso com Google</h1>
          <p className="mt-3 text-sm text-hpsr-muted">{message}</p>
        </div>
      </section>
    </PublicShell>
  );
}


export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center">Processando autenticação...</div>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
