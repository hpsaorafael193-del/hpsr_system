"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, ClipboardList, Eye, History, Loader2, RefreshCcw, Send } from "lucide-react";
import { createClient } from "@/lib/supabase";

type Row = {
  id: string;
  form_type: "gestational" | "ivf_ropa";
  status: string;
  answers: Record<string, unknown>;
  requested_at: string;
  submitted_at?: string | null;
  request_note?: string | null;
};

const statusMeta: Record<string, { label: string; className: string }> = {
  requested: { label: "Aguardando paciente", className: "border-[#d9b7a7] bg-[#f4e3d9] text-hpsr-wine" },
  draft: { label: "Em preenchimento", className: "border-[#d7b9aa] bg-[#f5e7de] text-[#6f3c2d]" },
  submitted: { label: "Enviada ao médico", className: "border-[#cfa28e] bg-[#efd8cc] text-hpsr-wine" },
  reviewed: { label: "Analisada", className: "border-[#cfbcae] bg-[#eee4dc] text-[#5b382d]" },
  cancelled: { label: "Encerrada", className: "border-[#d8cbc1] bg-[#f2ece7] text-hpsr-muted" },
};

function prettyKey(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toLocaleUpperCase("pt-BR"));
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function FollowupIntakeFormManager({ patientPassport, patientName, doctorId, doctorName, planType }: {
  patientPassport: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  planType: "gestacional" | "in_vitro";
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const formType = planType === "in_vitro" ? "ivf_ropa" : "gestational";
  const label = formType === "ivf_ropa" ? "Ficha FIV · Método ROPA" : "Ficha de acompanhamento obstétrico";

  const load = useCallback(async () => {
    if (!patientPassport) return;
    const client = createClient();
    if (!client) return;
    const { data, error: readError } = await client
      .from("followup_intake_forms")
      .select("id,form_type,status,answers,requested_at,submitted_at,request_note")
      .eq("patient_passport", patientPassport)
      .eq("form_type", formType)
      .order("requested_at", { ascending: false })
      .limit(10);
    if (readError) {
      setError(readError.message);
      return;
    }
    setRows((data || []) as Row[]);
    setError("");
  }, [patientPassport, formType]);

  useEffect(() => { void load(); }, [load]);

  const latest = rows[0];
  const latestMeta = latest ? (statusMeta[latest.status] || statusMeta.cancelled) : null;
  const hasPendingRequest = latest && ["requested", "draft"].includes(latest.status);
  const primaryLabel = hasPendingRequest ? "Aguardando paciente" : latest ? "Solicitar atualização" : "Solicitar ficha";

  async function requestForm() {
    if (!patientPassport || !doctorId || hasPendingRequest) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const client = createClient();
      if (!client) throw new Error("Supabase indisponível.");
      const specialty = formType === "ivf_ropa" ? "Ginecologia" : "Obstetra";
      const { error: insertError } = await client.from("followup_intake_forms").insert({
        patient_passport: patientPassport,
        doctor_id: doctorId,
        doctor_name: doctorName || "Médico responsável",
        specialty,
        form_type: formType,
        status: "requested",
        answers: {},
      });
      if (insertError) throw insertError;
      setMessage(latest ? "Atualização solicitada. O paciente receberá a nova ficha no Portal." : "Ficha solicitada. O paciente receberá uma notificação no Portal.");
      await load();
    } catch (value) {
      setError(value instanceof Error ? value.message : "Não foi possível solicitar a ficha.");
    } finally {
      setBusy(false);
    }
  }

  async function markReviewed(id: string) {
    setBusy(true);
    setError("");
    try {
      const client = createClient();
      if (!client) throw new Error("Supabase indisponível.");
      const { error: updateError } = await client
        .from("followup_intake_forms")
        .update({ status: "reviewed", reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", id);
      if (updateError) throw updateError;
      await load();
    } catch (value) {
      setError(value instanceof Error ? value.message : "Não foi possível concluir a análise.");
    } finally {
      setBusy(false);
    }
  }

  const answeredCount = useMemo(() => {
    if (!latest) return 0;
    return Object.values(latest.answers || {}).filter((value) => Array.isArray(value) ? value.length > 0 : String(value ?? "").trim().length > 0).length;
  }, [latest]);

  if (!patientPassport) return null;

  return (
    <div className="border-t border-[#d9c1b4] pt-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-[linear-gradient(135deg,#672614,#2a0700)] text-white"><ClipboardList size={15} /></span>
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[.16em] text-hpsr-wineLight">Ficha do acompanhamento</p>
            <h4 className="mt-0.5 text-sm font-black text-hpsr-text">Preparação do caso</h4>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || Boolean(hasPendingRequest)}
            onClick={() => void requestForm()}
            className="inline-flex min-h-[36px] items-center justify-center gap-2 rounded-[10px] border border-hpsr-wine bg-hpsr-wine px-3.5 text-[10px] font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}{primaryLabel}
          </button>
          <button
            type="button"
            onClick={() => setHistoryOpen((value) => !value)}
            className="inline-flex min-h-[36px] items-center justify-center gap-2 rounded-[10px] border border-[#c8a992] bg-[#fff8f3] px-3.5 text-[10px] font-black text-hpsr-wine transition hover:bg-[#f6e5da]"
          >
            <History size={13} />Histórico{rows.length > 0 ? ` (${rows.length})` : ""}
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1.35fr)_minmax(165px,.8fr)_minmax(185px,.9fr)_minmax(185px,.9fr)]">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">Ficha ativa</p>
          <div className="mt-1 flex min-h-[42px] items-center rounded-[10px] border border-[#dec8bb] bg-[#f8efe5] px-3 text-[11px] font-bold text-hpsr-text">{label}</div>
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">Status</p>
          <div className="mt-1 flex min-h-[42px] items-center rounded-[10px] border border-[#dec8bb] bg-[#f8efe5] px-3">{latestMeta ? <span className={`inline-flex min-h-[25px] items-center rounded-full border px-2.5 text-[9px] font-black ${latestMeta.className}`}>{latestMeta.label}</span> : <span className="text-[11px] font-bold text-hpsr-muted">Não solicitada</span>}</div>
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">Solicitada em</p>
          <div className="mt-1 flex min-h-[42px] items-center rounded-[10px] border border-[#dec8bb] bg-[#f8efe5] px-3 text-[11px] font-bold text-hpsr-text">{formatDateTime(latest?.requested_at)}</div>
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-[.12em] text-hpsr-wineLight">Enviada em</p>
          <div className="mt-1 flex min-h-[42px] items-center rounded-[10px] border border-[#dec8bb] bg-[#f8efe5] px-3 text-[11px] font-bold text-hpsr-text">{formatDateTime(latest?.submitted_at)}</div>
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-[10px] border border-[#dec8bb] bg-[#fff8f3]">
        {latest ? (
          <div className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-black text-hpsr-text">{patientName} · {patientPassport}</p>
              <p className="mt-0.5 text-[10px] text-hpsr-muted">{latest.status === "submitted" || latest.status === "reviewed" ? `${answeredCount} campo${answeredCount === 1 ? "" : "s"} respondido${answeredCount === 1 ? "" : "s"}.` : "A ficha ficará disponível no Portal do Paciente enquanto estiver pendente."}</p>
            </div>
            <button type="button" onClick={() => setOpen(open === latest.id ? "" : latest.id)} className="inline-flex min-h-[32px] shrink-0 items-center justify-center gap-1.5 rounded-[8px] border border-[#d8b9a7] bg-white px-3 text-[10px] font-black text-hpsr-wine"><Eye size={12} />Ver ficha<ChevronDown size={12} className={`transition ${open === latest.id ? "rotate-180" : ""}`} /></button>
          </div>
        ) : (
          <div className="px-3 py-3 text-[10px] text-hpsr-muted">Nenhuma ficha foi solicitada para este acompanhamento.</div>
        )}

        {latest && open === latest.id && (
          <div className="border-t border-[#e4d0c3] bg-white px-3 py-3">
            {Object.keys(latest.answers || {}).length > 0 ? (
              <div className="divide-y divide-[#ead9ce]">
                {Object.entries(latest.answers || {}).filter(([, value]) => Array.isArray(value) ? value.length : String(value ?? "").trim()).map(([key, value]) => (
                  <div key={key} className="grid gap-1 py-2.5 sm:grid-cols-[minmax(150px,220px)_1fr] sm:gap-4">
                    <p className="text-[8px] font-black uppercase tracking-[.08em] text-hpsr-wineLight">{prettyKey(key)}</p>
                    <p className="break-words text-[11px] font-semibold leading-relaxed text-hpsr-text">{Array.isArray(value) ? value.join(", ") : String(value)}</p>
                  </div>
                ))}
              </div>
            ) : <p className="text-[10px] text-hpsr-muted">O paciente ainda não enviou respostas para esta ficha.</p>}
            {latest.status === "submitted" && (
              <div className="mt-3 flex justify-end border-t border-[#ead9ce] pt-3">
                <button disabled={busy} onClick={() => void markReviewed(latest.id)} className="inline-flex min-h-[34px] items-center gap-2 rounded-[9px] border border-hpsr-wine bg-white px-3 text-[10px] font-black text-hpsr-wine"><CheckCircle2 size={13} />Marcar como analisada</button>
              </div>
            )}
          </div>
        )}
      </div>

      {historyOpen && rows.length > 0 && (
        <div className="mt-3 border-t border-[#d9c1b4] pt-3">
          <p className="text-[9px] font-black uppercase tracking-[.14em] text-hpsr-wineLight">Histórico de solicitações</p>
          <div className="mt-2 divide-y divide-[#dfc9bb] border-y border-[#dfc9bb]">
            {rows.map((row, index) => {
              const meta = statusMeta[row.status] || statusMeta.cancelled;
              return <div key={row.id} className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="text-[10px] font-black text-hpsr-text">{index === 0 ? "Ficha atual" : `Solicitação ${rows.length - index}`}</p><p className="mt-0.5 text-[9px] text-hpsr-muted">Solicitada em {formatDateTime(row.requested_at)}{row.submitted_at ? ` · enviada em ${formatDateTime(row.submitted_at)}` : ""}</p></div>
                <span className={`inline-flex w-fit min-h-[24px] items-center rounded-full border px-2.5 text-[9px] font-black ${meta.className}`}>{meta.label}</span>
              </div>;
            })}
          </div>
        </div>
      )}

      {(message || error) && (
        <div className="mt-3 flex items-start justify-between gap-3 border-t border-[#d9c1b4] pt-3">
          <p className={`text-[10px] font-bold ${error ? "text-rose-800" : "text-[#644035]"}`}>{error || message}</p>
          <button type="button" onClick={() => void load()} className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-black text-hpsr-wine"><RefreshCcw size={11} />Atualizar</button>
        </div>
      )}
    </div>
  );
}
