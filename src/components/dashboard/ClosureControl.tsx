"use client";

import { useState } from "react";
import { useHospitalClosure } from "@/components/public/ClosureState";
import { hpsrConfirm } from "@/components/ui/HpsrDialogProvider";
import { createClient } from "@/lib/supabase";
import { CLOSURE_CHANGED } from "@/lib/hospital-closure";

export function ClosureControl() {
  const active = useHospitalClosure();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function toggle() {
    if (active === null || busy) return;
    setBusy(true);
    setError("");
    try {
      const confirmed = await hpsrConfirm(active
        ? "O sistema voltará a aceitar novas solicitações e registros."
        : "Novas solicitações e registros serão bloqueados para todos. O histórico, os downloads e a liberação de exames já salvos continuarão disponíveis.",
        active ? "Desativar modo de encerramento?" : "Ativar modo de encerramento?");
      if (!confirmed) return;
      const client = createClient();
      if (!client) throw new Error("Conexão indisponível.");
      const {data, error} = await client.rpc("hpsr_set_closure_mode", {enabled: !active});
      if (error) throw new Error(error.message);
      if (typeof data !== "boolean") throw new Error("Não foi possível confirmar a alteração.");
      window.dispatchEvent(new CustomEvent(CLOSURE_CHANGED, {detail:data}));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Não foi possível alterar o modo.");
    } finally { setBusy(false); }
  }
  return <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-hpsr-border bg-hpsr-bg p-4">
    <div>
      <h2 className="font-black">Modo de encerramento</h2>
      <p role="status" className="mt-1 text-sm text-hpsr-muted">{active === null ? "Estado indisponível. Verifique a conexão e a atualização do banco." : active ? "Ativo · consulta ao histórico e liberação de exames já salvos." : "Desativado · o sistema aceita novos registros."}</p>
      {error && <p role="alert" className="mt-2 text-sm font-semibold">{error}</p>}
    </div>
    <button type="button" disabled={busy || active === null} onClick={() => void toggle()} className="rounded-xl bg-hpsr-wine px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
      {busy ? "Aguarde…" : active ? "Desativar encerramento" : "Ativar encerramento"}
    </button>
  </section>;
}
