"use client";

import { useEffect, useState } from "react";
import { Clock3, FileText, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { hpsrAlert, hpsrConfirm } from "@/components/ui/HpsrDialogProvider";

type HistoryItem = { id: string; title: string; patient: string; doctor: string; createdAt: string };

export function ClinicalHistoryButton({ recordType }: { recordType: "Exame" | "Documento" }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const client = createClient();
    if (!client) return;
    let active = true;
    setLoading(true);
    void client.from("clinical_records").select("id,record_type,created_at,title:payload->>title,exam_name:payload->>examName,document_title:payload->>documentTitle,patient_name:payload->patient->>name,patient_name_flat:payload->>patientName,doctor_name:payload->doctor->>name,doctor_name_flat:payload->>doctorName").eq("record_type", recordType).order("created_at", { ascending: false }).limit(150).then(({ data }: { data: any[] | null }) => {
      if (!active) return;
      setItems((data || []).map((row: any) => {
        return {
          id: String(row.id),
          title: String(row.exam_name || row.document_title || row.title || recordType),
          patient: String(row.patient_name || row.patient_name_flat || "Paciente não informado"),
          doctor: String(row.doctor_name || row.doctor_name_flat || "Médico não informado"),
          createdAt: String(row.created_at || ""),
        };
      }));
      setLoading(false);
    });
    return () => { active = false; };
  }, [open, recordType]);

  async function deleteItem(item: HistoryItem) {
    const confirmed = await hpsrConfirm(
      `Deseja excluir definitivamente “${item.title}”?`,
      recordType === "Exame" ? "Excluir exame" : "Excluir documento"
    );
    if (!confirmed) return;
    const client = createClient();
    if (!client) {
      await hpsrAlert("Supabase não configurado.", "Não foi possível excluir");
      return;
    }
    const { error } = await client.from("clinical_records").delete().eq("id", item.id);
    if (error) {
      await hpsrAlert(error.message, "Não foi possível excluir");
      return;
    }
    setItems((current) => current.filter((entry) => entry.id !== item.id));
    window.dispatchEvent(new CustomEvent("hpsr:clinical-record-deleted", { detail: { id: item.id, recordType } }));
  }

  return <>
    <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-full border border-[#dec8b6] bg-white px-3 py-2 text-xs font-black text-hpsr-text shadow-[0_4px_10px_rgba(42,7,0,0.04)] hover:border-hpsr-wine/40">
      <Clock3 size={14} /> Histórico
    </button>
    {open && <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/55 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <div className="flex max-h-[78vh] w-full max-w-2xl flex-col overflow-hidden rounded-[22px] border border-hpsr-border bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-hpsr-border bg-[#fff8f0] p-4">
          <div><p className="text-[10px] font-black uppercase tracking-[.15em] text-hpsr-wineLight">Histórico</p><h3 className="text-lg font-black text-hpsr-text">{recordType === "Exame" ? "Exames salvos" : "Documentos salvos"}</h3></div>
          <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-hpsr-border bg-white p-2 text-hpsr-wine"><X size={18} /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {loading ? <p className="py-8 text-center text-sm font-bold text-hpsr-muted">Carregando histórico...</p> : items.length ? <div className="space-y-2">{items.map((item) => <article key={item.id} className="rounded-[15px] border border-hpsr-border bg-[#fffaf4] p-3">
            <div className="flex items-start gap-3"><FileText size={17} className="mt-0.5 shrink-0 text-hpsr-wine" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-hpsr-text">{item.title}</p><p className="mt-1 text-xs font-semibold text-hpsr-muted">Paciente: {item.patient}</p><p className="text-xs font-semibold text-hpsr-muted">Médico: {item.doctor}</p><p className="mt-1 text-[10px] font-bold text-hpsr-wineLight">{item.createdAt ? new Date(item.createdAt).toLocaleString("pt-BR") : "Data não informada"}</p></div><button type="button" onClick={() => void deleteItem(item)} className="inline-flex h-9 shrink-0 items-center gap-2 rounded-[11px] border border-rose-200 bg-rose-50 px-3 text-[11px] font-black text-rose-700 hover:bg-rose-100" aria-label={`Excluir ${recordType.toLowerCase()}`}><Trash2 size={14} /> Excluir</button></div>
          </article>)}</div> : <p className="py-8 text-center text-sm font-bold text-hpsr-muted">Nenhum registro salvo.</p>}
        </div>
      </div>
    </div>}
  </>;
}
