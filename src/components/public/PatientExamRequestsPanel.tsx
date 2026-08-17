"use client";

import { StyledSelect } from "@/components/ui/StyledSelect";
import { specialties } from "@/data/mock";
import { CheckCircle2, FlaskConical, Loader2, RefreshCcw } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";

type ExamRequest = {
  id: string;
  status: string;
  specialty: string;
  reason: string;
  notes: string;
  answer: string;
  doctor: string;
  createdAt: string;
  updatedAt: string;
};

const fieldClass = "min-h-[44px] w-full rounded-[14px] border border-hpsr-border bg-white px-3 text-sm font-bold text-hpsr-text outline-none focus:border-hpsr-wine";

export function PatientExamRequestsPanel({ passport, hasEmail, onSessionExpired }: { passport?: string; hasEmail?: boolean; onSessionExpired?: () => void }) {
  const [requests, setRequests] = useState<ExamRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [discordId, setDiscordId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/paciente/exames-solicitacoes${passport ? `?passport=${encodeURIComponent(passport)}` : ""}`, { cache: "no-store" });
      const data = await response.json();
      if (response.status === 401) { onSessionExpired?.(); return; }
      if (!response.ok || !data.ok) throw new Error(data.error || "Não foi possível carregar as solicitações de exame.");
      setRequests(data.requests || []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar as solicitações de exame.");
    } finally {
      setLoading(false);
    }
  }, [onSessionExpired, passport]);

  useEffect(() => { void load(); }, [load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError(""); setMessage("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const response = await fetch(`/api/paciente/exames-solicitacoes${passport ? `?passport=${encodeURIComponent(passport)}` : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(data.entries())),
      });
      const result = await response.json();
      if (response.status === 401) { onSessionExpired?.(); return; }
      if (!response.ok || !result.ok) throw new Error(result.error || "Não foi possível enviar a solicitação de exame.");
      setMessage(`Solicitação de exame registrada. Protocolo: ${result.id}`);
      form.reset();
      setDiscordId("");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível enviar a solicitação de exame.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[18px] border border-hpsr-border bg-white/90 p-3.5 sm:p-4">
        <div className="flex items-start gap-3 border-b border-hpsr-border/70 pb-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-hpsr-wine text-white"><FlaskConical size={18}/></span>
          <div>
            <h3 className="text-base font-black text-hpsr-text">Solicitar exame</h3>
            <p className="mt-1 text-xs font-semibold leading-relaxed text-hpsr-muted">Este fluxo é independente de consultas e acompanhamentos. Envie apenas a necessidade do exame; a equipe médica dará continuidade sem criar uma consulta automaticamente.</p>
          </div>
        </div>
        <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-black text-hpsr-muted sm:col-span-2">Área / especialidade
            <StyledSelect name="specialty" required defaultValue="" className={`${fieldClass} mt-1.5`}>
              <option value="" disabled>Selecione</option>
              {specialties.map((item) => <option key={item}>{item}</option>)}
            </StyledSelect>
          </label>
          <label className="text-xs font-black text-hpsr-muted sm:col-span-2">Exame ou necessidade solicitada
            <textarea name="reason" required rows={4} placeholder="Informe qual exame precisa realizar ou a orientação recebida." className={`${fieldClass} mt-1.5 py-3`} />
          </label>
          <label className="text-xs font-black text-hpsr-muted sm:col-span-2">Observações
            <textarea name="notes" rows={3} className={`${fieldClass} mt-1.5 py-3`} />
          </label>
          <div className={`sm:col-span-2 rounded-[16px] border px-3.5 py-3 ${hasEmail ? "border-emerald-200 bg-emerald-50" : "border-blue-200 bg-blue-50"}`}>
            <p className={`text-xs font-black ${hasEmail ? "text-emerald-800" : "text-blue-900"}`}>{hasEmail ? "Contato cadastrado" : "ID do Discord necessário"}</p>
            <p className={`mt-1 text-[11px] font-semibold leading-relaxed ${hasEmail ? "text-emerald-700" : "text-blue-800"}`}>{hasEmail ? "Se a equipe precisar combinar algum detalhe do exame, usará o contato cadastrado." : "Informe o ID numérico do Discord para que a equipe consiga entrar em contato se necessário."}</p>
          </div>
          {!hasEmail && <label className="text-xs font-black text-hpsr-muted sm:col-span-2">ID do Discord
            <input name="discordId" inputMode="numeric" pattern="[0-9]+" required value={discordId} onChange={(event) => setDiscordId(event.target.value.replace(/\D/g, ""))} placeholder="Somente números" className={`${fieldClass} mt-1.5`} />
          </label>}
          {message && <p className="sm:col-span-2 rounded-[12px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800"><CheckCircle2 className="mr-2 inline" size={16}/>{message}</p>}
          {error && <p className="sm:col-span-2 rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-800">{error}</p>}
          <button disabled={saving} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[14px] bg-hpsr-wine px-4 text-sm font-black text-white disabled:opacity-50 sm:col-span-2">{saving ? <Loader2 className="animate-spin" size={17}/> : <FlaskConical size={17}/>} Enviar solicitação de exame</button>
        </form>
      </section>

      <section className="rounded-[18px] border border-hpsr-border bg-white/90 p-3.5 sm:p-4">
        <div className="flex items-center justify-between gap-3 border-b border-hpsr-border/70 pb-3">
          <div><h3 className="text-base font-black text-hpsr-text">Minhas solicitações de exame</h3><p className="mt-0.5 text-xs font-semibold text-hpsr-muted">Acompanhe o andamento sem misturar com sua agenda de consultas.</p></div>
          <button type="button" onClick={() => void load()} className="inline-flex items-center gap-1.5 rounded-[10px] border border-hpsr-border bg-white px-2.5 py-2 text-[11px] font-black text-hpsr-wine"><RefreshCcw size={13}/> Atualizar</button>
        </div>
        {loading ? <div className="flex justify-center py-8"><Loader2 className="animate-spin text-hpsr-wine"/></div> : requests.length ? <div className="mt-3 max-h-[360px] space-y-2 overflow-y-auto pr-1">{requests.map((item) => <article key={item.id} className="rounded-[15px] border border-hpsr-border bg-[#fffaf4] p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black text-hpsr-text">{item.specialty}</p><p className="mt-1 text-xs font-semibold leading-relaxed text-hpsr-muted">{item.reason}</p></div><span className="shrink-0 rounded-full bg-[#f1dfcd] px-2.5 py-1 text-[10px] font-black text-hpsr-wine">{item.status}</span></div>{item.answer && <div className="mt-3 rounded-[12px] border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900"><strong>Resposta da equipe:</strong> {item.answer}</div>}</article>)}</div> : <p className="mt-4 rounded-[14px] border border-dashed border-hpsr-border bg-[#fffaf4] p-4 text-center text-sm font-semibold text-hpsr-muted">Nenhuma solicitação de exame registrada.</p>}
      </section>
    </div>
  );
}
