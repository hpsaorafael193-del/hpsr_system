"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Eye, FileText, Loader2, RefreshCcw, Stethoscope, X } from "lucide-react";

type PatientRecord = {
  id: string;
  type: string;
  title: string;
  doctor: string;
  createdAt: string;
  updatedAt: string;
  protocol: string | null;
  html?: string;
  isConfidential: boolean;
  previewImage?: string | null;
  previewImages?: string[];
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function PatientRecordsPanel({ onSessionExpired }: { onSessionExpired?: () => void }) {
  const [records, setRecords] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeType, setActiveType] = useState<"Todos" | "Exame" | "Documento">("Todos");
  const [selected, setSelected] = useState<PatientRecord | null>(null);

  async function loadRecords(silent = false) {
    if (!silent) setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/paciente/registros", { cache: "no-store" });
      const data = await response.json();
      if (response.status === 401) { onSessionExpired?.(); return; }
      if (!response.ok) throw new Error(data.error || "Não foi possível carregar seus registros.");
      setRecords(data.records || []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível carregar seus registros.");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    void loadRecords();
    const onVisibility = () => { if (document.visibilityState === "visible") void loadRecords(true); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const visibleRecords = useMemo(() => {
    if (activeType === "Todos") return records;
    return records.filter((record) => record.type.toLowerCase().includes(activeType.toLowerCase()));
  }, [activeType, records]);

  async function loadRecordDetail(record: PatientRecord, action: "view" | "download") {
    try {
      const response = await fetch(`/api/paciente/registros?id=${encodeURIComponent(record.id)}`, { cache: "no-store" });
      const data = await response.json();
      if (response.status === 401) { onSessionExpired?.(); return; }
      if (!response.ok) throw new Error(data.error || "Não foi possível carregar o registro.");
      const detailed = data.record as PatientRecord;
      setRecords((current) => current.map((item) => item.id === detailed.id ? { ...item, ...detailed } : item));
      if (action === "view") setSelected(detailed);
      else downloadRecord(detailed);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível carregar o registro.");
    }
  }

  function downloadRecord(record: PatientRecord) {
    const pages = record.previewImages?.length ? record.previewImages : (record.previewImage ? [record.previewImage] : []);
    if (pages.length) {
      pages.forEach((page, index) => {
        const anchor = document.createElement("a");
        anchor.href = page;
        anchor.download = `${record.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "registro"}${pages.length > 1 ? `-pagina-${index + 1}` : ""}.png`;
        anchor.click();
      });
      return;
    }
    const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${record.title}</title><style>body{font-family:Arial,sans-serif;max-width:850px;margin:40px auto;padding:0 24px;color:#32150f}h1{color:#6f2b17}header{border-bottom:2px solid #6f2b17;padding-bottom:16px;margin-bottom:24px}.notice{background:#fff3cd;border:1px solid #f1ce6b;padding:12px;border-radius:10px;margin-bottom:20px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #dbc2ae;padding:8px}</style></head><body><header><h1>Hospital São Rafael - Eldorado</h1><p>${record.title}</p><p>${formatDate(record.createdAt)} · ${record.doctor}</p></header><div class="notice"><strong>Aviso de RP:</strong> documento fictício, sem validade médica real.</div><main>${record.html || "<p>Conteúdo não disponível para exportação.</p>"}</main></body></html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${record.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "registro"}.html`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  if (loading) {
    return <div className="rounded-[24px] border border-hpsr-border bg-white/85 p-6 text-center"><Loader2 className="mx-auto animate-spin text-hpsr-wine" /><p className="mt-3 text-sm font-bold text-hpsr-muted">Carregando exames e documentos liberados...</p></div>;
  }

  return (
    <section className="rounded-[24px] border border-hpsr-border bg-white/85 p-4 shadow-[0_18px_40px_rgba(82,48,27,0.08)] sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-hpsr-wineLight">Área liberada</p>
          <h2 className="text-xl font-black text-hpsr-text">Meus exames e documentos</h2>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button type="button" onClick={() => void loadRecords()} className="shrink-0 rounded-[12px] border border-hpsr-border bg-white px-3 py-2 text-xs font-black text-hpsr-wine"><RefreshCcw className="mr-1.5 inline" size={14} />Atualizar</button>
          {(["Todos", "Exame", "Documento"] as const).map((type) => (
            <button key={type} type="button" onClick={() => setActiveType(type)} className={`shrink-0 rounded-[12px] border px-3 py-2 text-xs font-black ${activeType === type ? "border-hpsr-wine bg-hpsr-wine text-white" : "border-hpsr-border bg-white text-hpsr-wine"}`}>{type}</button>
          ))}
        </div>
      </div>

      {error && <p className="mt-4 rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800">{error}</p>}

      <div className="mt-4 max-h-[520px] space-y-2 overflow-y-auto pr-1">
        {visibleRecords.map((record) => (
          <article key={record.id} className="rounded-[16px] border border-hpsr-border bg-[#fffaf4] p-3.5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {record.type.toLowerCase().includes("exame") ? <Stethoscope size={17} className="shrink-0 text-hpsr-wine" /> : <FileText size={17} className="shrink-0 text-hpsr-wine" />}
                  <h3 className="truncate font-black text-hpsr-text">{record.title}</h3>
                </div>
                <p className="mt-1 text-xs font-semibold text-hpsr-muted">{record.type} · {formatDate(record.createdAt)} · {record.doctor}</p>
                {record.protocol && <p className="mt-1 text-[11px] font-bold text-hpsr-wineLight">Protocolo: {record.protocol}</p>}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => void loadRecordDetail(record, "view")} className="inline-flex items-center gap-2 rounded-[12px] border border-hpsr-border bg-white px-3 py-2 text-xs font-black text-hpsr-wine"><Eye size={15} /> Visualizar</button>
                <button type="button" onClick={() => void loadRecordDetail(record, "download")} className="inline-flex items-center gap-2 rounded-[12px] bg-hpsr-wine px-3 py-2 text-xs font-black text-white"><Download size={15} /> Baixar</button>
              </div>
            </div>
          </article>
        ))}
        {!visibleRecords.length && !error && <div className="rounded-[16px] border border-dashed border-hpsr-border bg-[#fff8f0] p-6 text-center"><FileText className="mx-auto text-hpsr-wine" /><p className="mt-3 font-black text-hpsr-text">Nenhum registro liberado</p><p className="mt-1 text-sm text-hpsr-muted">Exames e documentos em sigilo não aparecem no portal.</p></div>}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-3" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
          <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-[22px] border border-hpsr-border bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-hpsr-border bg-[#fff8f0] p-4"><div><h3 className="font-black text-hpsr-text">{selected.title}</h3><p className="text-xs font-semibold text-hpsr-muted">{formatDate(selected.createdAt)} · {selected.doctor}</p></div><button type="button" onClick={() => setSelected(null)} className="rounded-full border border-hpsr-border bg-white p-2 text-hpsr-wine"><X size={18} /></button></div>
            <div className="max-h-[72vh] overflow-y-auto p-5"><div className="mb-4 rounded-[12px] border border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-950">Conteúdo fictício de roleplay, sem validade médica real.</div>{(selected.previewImages?.length || selected.previewImage) ? <div className="space-y-4">{(selected.previewImages?.length ? selected.previewImages : [selected.previewImage!]).map((page, index) => <img key={`${selected.id}-${index}`} src={page} alt={`${selected.title} — página ${index + 1}`} className="mx-auto h-auto max-w-full rounded-[12px] border border-hpsr-border bg-white" />)}</div> : <div className="prose max-w-none text-hpsr-text" dangerouslySetInnerHTML={{ __html: selected.html || "<p>Este registro antigo não possui conteúdo formatado disponível.</p>" }} />}</div>
          </div>
        </div>
      )}
    </section>
  );
}
