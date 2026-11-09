"use client";
import type { FollowupFormType } from "@/lib/pediatric-intake-form";
import { FollowupIntakeAnswers } from "./FollowupIntakeAnswers";
import {useManualRefresh,useLocalRefreshControl} from "@/lib/manual-data-refresh";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { CheckCircle2, ChevronDown, History, Loader2, RefreshCcw, Send } from "lucide-react";
import { createClient } from "@/lib/supabase";
import styles from "./followup-intake.module.css";

type Row = {
  id: string;
  form_type: FollowupFormType;
  status: string;
  answers: Record<string, unknown>;
  requested_at: string;
  submitted_at?: string | null;
  request_note?: string | null;
};

const statusLabels: Record<string, string> = {
  requested: "Aguardando paciente",
  draft: "Em preenchimento",
  submitted: "Enviada ao médico",
  reviewed: "Analisada",
  cancelled: "Encerrada",
};

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

export function FollowupIntakeFormManager({ patientPassport, doctorId, doctorName, planType, canManage = true, hasPortalGuardian = true, refreshVersion = 0 }: {
  patientPassport: string;
  doctorId: string;
  doctorName: string;
  planType: "gestacional" | "in_vitro" | "pediatria";
  canManage?: boolean;
  hasPortalGuardian?: boolean;
  refreshVersion?: number;
}) {
  useLocalRefreshControl(Boolean(patientPassport));
  const [loading, setLoading] = useState(true);
  const [readFailed, setReadFailed] = useState(false);
  const readSequence = useRef(0);
  const answersId = useId();
  const historyId = useId();
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const pediatric = planType === "pediatria";
  const formType = pediatric ? "pediatric" : planType === "in_vitro" ? "ivf_ropa" : "gestational";
  const label = pediatric ? "Ficha técnica — Acompanhamento pediátrico" : formType === "ivf_ropa" ? "Ficha FIV · Método ROPA" : "Ficha de acompanhamento obstétrico";

  const load = useCallback(async () => {
    if (!patientPassport) return;
    const sequence = ++readSequence.current;
    setLoading(true);
    try {
      const client = createClient();
      if (!client) throw new Error("Supabase indisponível.");
      const { data, error: readError } = await client
        .from("followup_intake_forms")
        .select("id,form_type,status,answers,requested_at,submitted_at,request_note")
        .eq("patient_passport", patientPassport)
        .eq("form_type", formType)
        .order("requested_at", { ascending: false })
        .limit(10);
      if (sequence !== readSequence.current) return;
      if (readError) throw new Error(readError.message);
      setRows((data || []) as Row[]);
      setReadFailed(false);
      setError("");
    } catch (value) {
      if (sequence !== readSequence.current) return;
      setReadFailed(true);
      setError(value instanceof Error ? value.message : "Não foi possível carregar a ficha.");
    } finally {
      if (sequence === readSequence.current) setLoading(false);
    }
  }, [patientPassport, formType]);

  useManualRefresh("followup-forms", load, busy || loading);
  useEffect(() => { void load(); }, [load, refreshVersion]);

  const latest = rows[0];
  const getStatus = (status: string) => pediatric && status === "requested"
    ? "Aguardando responsável" : statusLabels[status] || statusLabels.cancelled;
  const visible = pediatric ? rows.find(row => row.id === open) : latest?.id === open ? latest : undefined;
  const hasPendingRequest = latest && ["requested", "draft"].includes(latest.status);
  const primaryLabel = latest ? "Solicitar atualização" : "Solicitar ficha";

  async function requestForm() {
    if (!patientPassport || !doctorId || !canManage || !hasPortalGuardian || hasPendingRequest || loading || readFailed) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const client = createClient();
      if (!client) throw new Error("Supabase indisponível.");
      const specialty = pediatric ? "Pediatria" : formType === "ivf_ropa" ? "Ginecologia" : "Obstetra";
      const { error: insertError } = await client.from("followup_intake_forms").insert({
        patient_passport: patientPassport,
        doctor_id: doctorId,
        doctor_name: doctorName || "Médico responsável",
        specialty,
        form_type: formType,
        status: "requested",
        answers: {},
      });
      if (insertError) throw new Error(insertError.code === "23505" && pediatric ? "Já existe uma ficha pediátrica pendente para esta criança." : insertError.message);
      setMessage(pediatric ? "Ficha solicitada. O responsável poderá respondê-la pelo portal." : latest ? "Atualização solicitada. O paciente receberá a nova ficha no Portal." : "Ficha solicitada. O paciente receberá uma notificação no Portal.");
      await load();
    } catch (value) {
      setError(value instanceof Error ? value.message : "Não foi possível solicitar a ficha.");
    } finally {
      setBusy(false);
    }
  }

  async function markReviewed(id: string) {
    if (!canManage || busy || loading || readFailed) return;
    setBusy(true);
    setError("");
    try {
      const client = createClient();
      if (!client) throw new Error("Supabase indisponível.");
      const { data: updated, error: updateError } = await client
        .from("followup_intake_forms")
        .update({ status: "reviewed", reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", id).eq("status", "submitted").select("id").maybeSingle();
      if (updateError) throw new Error(updateError.message);
      if (!updated) throw new Error("A ficha não está disponível para análise. Atualize e tente novamente.");
      await load();
    } catch (value) {
      setError(value instanceof Error ? value.message : "Não foi possível concluir a análise.");
    } finally {
      setBusy(false);
    }
  }

  if (!patientPassport) return null;

  return (
    <section className={styles.manager} data-pediatric-intake={pediatric || undefined} aria-label="Ficha do acompanhamento" aria-busy={loading}>
      <div className={styles.managerHeading}>
        <div>
          <p className={styles.eyebrow}>Ficha do acompanhamento</p>
          <h3>{label}</h3>
        </div>
        {!hasPendingRequest && <button type="button" className={`${styles.button} ${styles.primary}`}
          disabled={busy || loading || readFailed || !canManage || !hasPortalGuardian} onClick={() => void requestForm()}>
          {busy || loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}{primaryLabel}
        </button>}
      </div>

      <dl className={styles.metadata}>
        <div><dt>Status</dt><dd><span className={styles.status} data-status={latest?.status}>{latest ? getStatus(latest.status) : loading ? "Carregando…" : error ? "Indisponível" : "Não solicitada"}</span></dd></div>
        <div><dt>Solicitada em</dt><dd>{formatDateTime(latest?.requested_at)}</dd></div>
        <div><dt>Enviada em</dt><dd>{formatDateTime(latest?.submitted_at)}</dd></div>
      </dl>

      {pediatric && !hasPortalGuardian && <p className={styles.hint}>Para solicitar a ficha, a criança precisa ter um responsável autorizado a acessar o portal.</p>}

      {latest ? <div className={styles.toolbar}>
        <p className={styles.hint}>{hasPendingRequest ? "Disponível no Portal do Paciente para preenchimento." : latest.status === "cancelled" ? "Esta solicitação foi encerrada." : "Consulte as respostas e as solicitações anteriores."}</p>
        <div className={styles.actions}>
          <button type="button" className={styles.button} aria-expanded={open === latest.id} aria-controls={visible && open === latest.id ? answersId : undefined}
            onClick={() => setOpen(open === latest.id ? "" : latest.id)}>
            {open === latest.id ? "Ocultar ficha" : "Ver ficha"}<ChevronDown size={16} className={open === latest.id ? "rotate-180" : undefined} aria-hidden="true" />
          </button>
          <button type="button" className={styles.button} aria-expanded={historyOpen} aria-controls={historyOpen ? historyId : undefined} onClick={() => setHistoryOpen(value => !value)}>
            <History size={16} aria-hidden="true" />Histórico ({rows.length})
          </button>
        </div>
      </div> : !loading && !error && <p className={styles.hint}>Nenhuma ficha foi solicitada para este acompanhamento.</p>}

      {visible && (
        <div id={answersId} className={styles.details}>
          <h4>Respostas da ficha</h4>
          {pediatric && visible.id !== latest?.id && <p className={styles.hint}>Solicitação de {formatDateTime(visible.requested_at)}</p>}
          <FollowupIntakeAnswers formType={visible.form_type} answers={visible.answers} />
          {canManage && visible.status === "submitted" && <div className={styles.review}>
            <button type="button" disabled={busy || loading || readFailed} onClick={() => void markReviewed(visible.id)} className={`${styles.button} ${styles.primary}`}><CheckCircle2 size={16} aria-hidden="true" />Marcar como analisada</button>
          </div>}
        </div>
      )}

      {historyOpen && rows.length > 0 && <section id={historyId} className={styles.details} aria-label="Histórico de solicitações">
        <h4>Histórico de solicitações</h4>
        <ul className={styles.history}>{rows.map((row, index) => <li key={row.id}>
          <div><strong>{index === 0 ? "Ficha atual" : `Solicitação ${rows.length - index}`}</strong><p className={styles.hint}>Solicitada em {formatDateTime(row.requested_at)}{row.submitted_at ? ` · enviada em ${formatDateTime(row.submitted_at)}` : ""}</p></div>
          <span className={styles.status} data-status={row.status}>{getStatus(row.status)}</span>
          {pediatric && index > 0 && <button type="button" className={styles.button} aria-expanded={open === row.id} onClick={() => setOpen(open === row.id ? "" : row.id)}>{open === row.id ? "Ocultar ficha" : "Ver ficha"}</button>}
        </li>)}</ul>
      </section>}

      {(message || error) && <div className={styles.feedback}>
        <p role={error ? "alert" : "status"} className={error ? styles.error : styles.hint}>{error || message}</p>
        {error && <button type="button" className={styles.button} disabled={loading} onClick={() => void load()}><RefreshCcw size={15} aria-hidden="true" />Tentar novamente</button>}
      </div>}
    </section>
  );
}
