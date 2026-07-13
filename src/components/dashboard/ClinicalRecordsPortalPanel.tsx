"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, FileText, Loader2, Lock, Unlock } from "lucide-react";
import { createClient } from "@/lib/supabase";

type ClinicalRecord = {
  id: string;
  record_type: string;
  payload: any;
  created_at: string;
  is_confidential: boolean;
  released_at: string | null;
};

export function ClinicalRecordsPortalPanel({ passport }: { passport: string }) {
  const [records, setRecords] = useState<ClinicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  async function loadRecords() {
    const client = createClient();
    if (!client) { setLoading(false); return; }
    const { data, error: loadError } = await client
      .from("clinical_records")
      .select("id,record_type,payload,created_at,is_confidential,released_at")
      .eq("patient_passport", passport)
      .order("created_at", { ascending: false });
    if (loadError) setError(loadError.message);
    else setRecords((data || []) as ClinicalRecord[]);
    setLoading(false);
  }

  useEffect(() => { void loadRecords(); }, [passport]);

  async function toggleConfidentiality(record: ClinicalRecord) {
    const client = createClient();
    if (!client) return;
    setBusyId(record.id); setError("");
    const { error: updateError } = await client.rpc("set_clinical_record_confidentiality", {
      target_record_id: record.id,
      confidential: !record.is_confidential,
    });
    if (updateError) setError(updateError.message);
    else await loadRecords();
    setBusyId("");
  }

  if (loading) return <div className="rounded-[16px] border border-hpsr-border bg-[#fff8f0] p-4 text-center"><Loader2 className="mx-auto animate-spin text-hpsr-wine" /></div>;

  return (
    <section className="mt-4 rounded-[16px] border border-hpsr-border bg-[#fff8f0] p-3.5">
      <div className="flex items-center gap-2"><Lock size={17} className="text-hpsr-wine" /><div><h3 className="font-black text-hpsr-text">Acesso no Portal do Paciente</h3><p className="text-xs font-semibold text-hpsr-muted">Controle individual de sigilo para cada exame e documento.</p></div></div>
      {error && <p className="mt-3 rounded-[12px] border border-rose-200 bg-rose-50 p-2 text-xs font-bold text-rose-800">{error}</p>}
      <div className="mt-3 max-h-[420px] space-y-2 overflow-y-auto pr-1">
        {records.map((record) => {
          const title = record.payload?.examName || record.payload?.documentTitle || record.payload?.title || record.record_type;
          return (
            <article key={record.id} className="flex flex-col gap-3 rounded-[14px] border border-hpsr-border bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0"><div className="flex items-center gap-2"><FileText size={16} className="shrink-0 text-hpsr-wine" /><p className="truncate font-black text-hpsr-text">{title}</p></div><p className="mt-1 text-xs font-semibold text-hpsr-muted">{record.record_type} · {new Date(record.created_at).toLocaleString("pt-BR")}</p><span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black ${record.is_confidential ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{record.is_confidential ? <EyeOff size={12} /> : <Eye size={12} />}{record.is_confidential ? "Em sigilo" : "Liberado ao paciente"}</span></div>
              <button type="button" disabled={busyId === record.id} onClick={() => toggleConfidentiality(record)} className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-[12px] px-3 py-2 text-xs font-black text-white disabled:opacity-50 ${record.is_confidential ? "bg-emerald-700" : "bg-hpsr-wine"}`}>{busyId === record.id ? <Loader2 className="animate-spin" size={14} /> : record.is_confidential ? <Unlock size={14} /> : <Lock size={14} />}{record.is_confidential ? "Liberar para paciente" : "Colocar em sigilo"}</button>
            </article>
          );
        })}
        {!records.length && <p className="rounded-[14px] border border-dashed border-hpsr-border bg-white p-4 text-center text-sm font-semibold text-hpsr-muted">Nenhum exame ou documento salvo para este passaporte.</p>}
      </div>
    </section>
  );
}
