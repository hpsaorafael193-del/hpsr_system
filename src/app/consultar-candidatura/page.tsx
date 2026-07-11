"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { CheckCircle2, Search, XCircle } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { FormField, inputClass } from "@/components/ui/FormField";
import { createClient } from "@/lib/supabase";

type Application = {
  passport?: string;
  token?: string;
  protocol?: string;
  name?: string;
  desiredRole?: string;
  status?: string;
  triageDecision?: string;
  interviewStatus?: string;
  interviewAt?: string;
  interviewResult?: string;
};

function statusMessage(item: Application) {
  if (item.status === "Recusado" || item.triageDecision === "Recusado") {
    return "Sua candidatura foi recusada após a análise da equipe responsável.";
  }
  if (item.status === "Contratado" || item.interviewResult === "Contratado") {
    return "Sua candidatura foi concluída e você foi contratado pela equipe do hospital.";
  }
  if (item.status === "Não contratado" || item.interviewResult === "Não contratado") {
    return "A entrevista foi concluída, mas a candidatura não avançou para contratação.";
  }
  if (item.status === "Sem resposta" || item.interviewStatus === "Sem resposta") {
    return "A equipe tentou contato para a entrevista, mas ainda não recebeu retorno.";
  }
  if (item.interviewStatus === "Agendada") {
    return `Sua entrevista foi agendada${item.interviewAt ? ` para ${new Date(item.interviewAt).toLocaleString("pt-BR")}` : ""}.`;
  }
  if (item.triageDecision === "Aprovado" || item.status === "Aprovado" || item.status === "entrevista") {
    return "Você foi aprovado na triagem. Um médico entrará em contato pelo Discord para marcar a entrevista.";
  }
  return "Sua candidatura foi recebida e está aguardando análise da equipe responsável.";
}

export default function ConsultApplicationPage() {
  const [passport, setPassport] = useState("");
  const [token, setToken] = useState("");
  const [result, setResult] = useState<Application | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);

    const client = createClient();
    if (!client) {
      setError("O serviço de consulta está indisponível no momento.");
      return;
    }

    const { data, error: queryError } = await client.rpc("consult_staff_application", {
      p_passport: passport.trim(),
      p_token: token.trim(),
    });

    if (queryError || !data) {
      setError(queryError ? "Não foi possível consultar a candidatura." : "Nenhuma candidatura foi encontrada com o passaporte e o token informados.");
      return;
    }

    setResult(data as Application);  }

  return (
    <PublicShell>
      <section className="mx-auto max-w-2xl px-4 py-16">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-hpsr-wineLight">Consulta</p>
        <h1 className="mt-3 text-[clamp(1.45rem,4vw,2rem)] font-black text-hpsr-text">Consultar candidatura</h1>
        <p className="mt-3 text-hpsr-muted">Informe o passaporte e o token gerado no envio da ficha.</p>

        <form onSubmit={handleSubmit} className="mt-8 hpsr-public-card p-3.5 shadow-soft">
          <div className="grid gap-3">
            <FormField label="Passaporte">
              <input value={passport} onChange={(event) => setPassport(event.target.value)} className={inputClass} placeholder="Ex: 12345" required />
            </FormField>
            <FormField label="Token da candidatura">
              <input value={token} onChange={(event) => setToken(event.target.value)} className={inputClass} placeholder="Ex: A7K9Q2MD" required />
            </FormField>
          </div>
          <button type="submit" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#672614,#2a0700)] px-4 py-3 text-sm font-black text-white">
            <Search size={16} /> Consultar
          </button>
        </form>

        {error && <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"><XCircle size={18} className="mt-0.5 shrink-0" />{error}</div>}
        {result && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-start gap-3"><CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-700" /><div><p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">Candidatura localizada</p><h2 className="mt-1 text-lg font-black text-hpsr-text">{result.name || "Candidato"}</h2><p className="mt-1 text-sm font-semibold text-hpsr-muted">{result.protocol || "Sem protocolo"} · {result.desiredRole || "Cargo não informado"}</p><p className="mt-4 text-sm leading-relaxed text-hpsr-text">{statusMessage(result)}</p></div></div>
          </div>
        )}

        <Link href="/trabalhe-conosco" className="mt-6 inline-flex text-sm font-black text-hpsr-wine">Voltar ao edital de recrutamento</Link>
      </section>
    </PublicShell>
  );
}
