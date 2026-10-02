"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Download, Eye, FileText, Loader2, RefreshCcw, Stethoscope, Syringe, X } from "lucide-react";

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
  return new Date(value).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
}

export function PatientRecordsPanel({ onSessionExpired, passport, mode = "all" }: { onSessionExpired?: () => void; passport?: string; mode?: "all" | "documents" | "vaccination" }) {
  const [records, setRecords] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeType, setActiveType] = useState<"Todos" | "Exame" | "Vacina" | "Documento">("Todos");
  const [selected, setSelected] = useState<PatientRecord | null>(null);
  const [pendingMultiDownload, setPendingMultiDownload] = useState<{ pages: string[]; safeName: string } | null>(null);
  const lastRecordsLoadRef = useRef<{ passport: string; at: number } | null>(null);
  const recordsInFlightRef = useRef<Promise<void> | null>(null);
  const recordsSequenceRef = useRef(0);
  const onSessionExpiredRef = useRef(onSessionExpired);
  useEffect(() => { onSessionExpiredRef.current = onSessionExpired; }, [onSessionExpired]);

  const loadRecords = useCallback((silent = false, force = false): Promise<void> => {
    const passportKey = passport || "";
    if (recordsInFlightRef.current) return recordsInFlightRef.current;
    if (!force && lastRecordsLoadRef.current?.passport === passportKey
        && Date.now() - lastRecordsLoadRef.current.at < 20_000) return Promise.resolve();
    const sequence = ++recordsSequenceRef.current;
    if (!silent) setLoading(true);
    setError("");
    const request = (async () => {
      try {
        const response = await fetch(`/api/paciente/registros${passport ? `?passport=${encodeURIComponent(passport)}` : ""}`, { cache: "no-store" });
        const data = await response.json();
        if (sequence !== recordsSequenceRef.current) return;
        if (response.status === 401) { onSessionExpiredRef.current?.(); return; }
        if (!response.ok) throw new Error(data.error || "Não foi possível carregar seus registros.");
        lastRecordsLoadRef.current = { passport: passportKey, at: Date.now() };
        setRecords(data.records || []);
      } catch (requestError) {
        if (sequence === recordsSequenceRef.current) setError(requestError instanceof Error ? requestError.message : "Não foi possível carregar seus registros.");
      } finally {
        if (!silent && sequence === recordsSequenceRef.current) setLoading(false);
      }
    })();
    recordsInFlightRef.current = request;
    void request.finally(() => { if (recordsInFlightRef.current === request) recordsInFlightRef.current = null; });
    return request;
  }, [passport]);

  useEffect(() => {
    // Evita manter aberto um exame de outro prontuário ao alternar perfis.
    setSelected(null);
    setPendingMultiDownload(null);
    setRecords([]);
    recordsSequenceRef.current += 1;
    recordsInFlightRef.current = null;
    void loadRecords(false, true);
    const onVisibility = () => { if (document.visibilityState === "visible") void loadRecords(true); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      recordsSequenceRef.current += 1;
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [loadRecords]);

  const visibleRecords = useMemo(() => {
    const scoped = mode === "vaccination" ? records.filter((record) => record.type.toLowerCase().includes("vacina"))
      : mode === "documents" ? records.filter((record) => !record.type.toLowerCase().includes("vacina")) : records;
    if (activeType === "Todos" || mode !== "all") return scoped;
    return scoped.filter((record) => record.type.toLowerCase().includes(activeType.toLowerCase()));
  }, [activeType, records, mode]);

  async function loadRecordDetail(record: PatientRecord, action: "view" | "download") {
    try {
      const response = await fetch(`/api/paciente/registros?id=${encodeURIComponent(record.id)}${passport ? `&passport=${encodeURIComponent(passport)}` : ""}`, { cache: "no-store" });
      const data = await response.json();
      if (response.status === 401) { onSessionExpired?.(); return; }
      if (!response.ok) throw new Error(data.error || "Não foi possível carregar o registro.");
      const detailed = data.record as PatientRecord;
      setRecords((current) => current.map((item) => item.id === detailed.id ? { ...item, ...detailed } : item));
      if (action === "view") setSelected(detailed);
      else await downloadRecord(detailed);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível carregar o registro.");
    }
  }

  async function downloadRecord(record: PatientRecord) {
    const pages = record.previewImages?.length ? record.previewImages : (record.previewImage ? [record.previewImage] : []);
    const safeName = record.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "registro";
    if (pages.length === 1) {
      // URLs assinadas do bucket privado são remotas: criar um Blob local
      // para o navegador respeitar o nome do PNG, sem tornar o bucket público.
      let href = pages[0];
      let temporaryUrl: string | null = null;
      if (/^https?:\/\//i.test(href)) {
        try {
          const imageResponse = await fetch(href, { cache: "no-store" });
          if (!imageResponse.ok) throw new Error("A imagem da caderneta não está mais disponível. Reabra o registro para renovar o acesso.");
          temporaryUrl = URL.createObjectURL(await imageResponse.blob());
          href = temporaryUrl;
        } catch (error) {
          setError(error instanceof Error ? error.message : "Falha ao baixar a imagem.");
          return;
        }
      }
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = `${safeName}.png`;
      anchor.click();
      if (temporaryUrl) window.setTimeout(() => URL.revokeObjectURL(temporaryUrl!), 2000);
      return;
    }
    if (pages.length > 1) {
      setPendingMultiDownload({ pages, safeName });
      return;
    }
    const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${record.title}</title><style>body{font-family:Arial,sans-serif;max-width:850px;margin:40px auto;padding:0 24px;color:#32150f}h1{color:#6f2b17}header{border-bottom:2px solid #6f2b17;padding-bottom:16px;margin-bottom:24px}.notice{background:#fff3cd;border:1px solid #f1ce6b;padding:12px;border-radius:10px;margin-bottom:20px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #dbc2ae;padding:8px}</style></head><body><header><h1>Hospital São Rafael</h1><p>${record.title}</p><p>${formatDate(record.createdAt)} · ${record.doctor}</p></header><div class="notice"><strong>Aviso institucional:</strong> documento disponibilizado pelo Hospital São Rafael.</div><main>${record.html || "<p>Conteúdo não disponível para exportação.</p>"}</main></body></html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${safeName}.html`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }


  function confirmMultiPageDownload() {
    if (!pendingMultiDownload) return;
    const { pages, safeName } = pendingMultiDownload;
    setPendingMultiDownload(null);

    pages.forEach((page, index) => {
      window.setTimeout(() => {
        const anchor = document.createElement("a");
        anchor.href = page;
        anchor.download = `${safeName}-pagina-${index + 1}.png`;
        anchor.rel = "noopener";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
      }, index * 300);
    });
  }

  if (loading) {
    return <div className="rounded-[24px] border border-hpsr-border bg-[#f5ece3] p-6 text-center"><Loader2 className="mx-auto animate-spin text-hpsr-wine" /><p className="mt-3 text-sm font-bold text-hpsr-muted">Carregando seu prontuário...</p></div>;
  }

  return (
    <section className="rounded-[24px] border border-hpsr-border bg-[#f5ece3] p-4 shadow-[0_10px_27px_rgba(82,48,27,0.055)] sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-hpsr-wineLight">Seu prontuário</p>
          <h2 className="text-xl font-black text-hpsr-text">{mode === "vaccination" ? "Carteira de vacinação" : mode === "documents" ? "Prontuário e documentos" : "Meus registros"}</h2>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button type="button" onClick={() => void loadRecords(false, true)} className="shrink-0 rounded-[12px] border border-hpsr-border bg-white px-3 py-2 text-xs font-black text-hpsr-wine"><RefreshCcw className="mr-1.5 inline" size={14} />Atualizar</button>
          {mode === "all" && (["Todos", "Exame", "Vacina", "Documento"] as const).map((type) => (
            <button key={type} type="button" onClick={() => setActiveType(type)} className={`shrink-0 rounded-[12px] border px-3 py-2 text-xs font-black ${activeType === type ? "border-hpsr-wine bg-hpsr-wine text-white" : "border-hpsr-border bg-white text-hpsr-wine"}`}>{type}</button>
          ))}
        </div>
      </div>

      {error && <p className="mt-4 rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800">{error}</p>}

      <div className="hpsr-touch-scroll mt-4 max-h-[min(520px,62dvh)] space-y-2 overflow-y-auto pr-1">
        {visibleRecords.map((record) => (
          <article key={record.id} className="rounded-[16px] border border-hpsr-border bg-[#eee3d8] p-3.5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {record.type.toLowerCase().includes("exame") ? <Stethoscope size={17} className="shrink-0 text-hpsr-wine" /> : record.type.toLowerCase().includes("vacin") ? <Syringe size={17} className="shrink-0 text-hpsr-wine" /> : <FileText size={17} className="shrink-0 text-hpsr-wine" />}
                  <h3 className="min-w-0 break-words font-black leading-snug text-hpsr-text [overflow-wrap:anywhere]">{record.title}</h3>
                </div>
                <p className="mt-1 break-words text-xs font-semibold leading-relaxed text-hpsr-muted [overflow-wrap:anywhere]">{record.type} · {formatDate(record.createdAt)} · {record.doctor}</p>
                {record.protocol && <p className="mt-1 text-[11px] font-bold text-hpsr-wineLight">Protocolo: {record.protocol}</p>}
              </div>
              <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                <button type="button" onClick={() => void loadRecordDetail(record, "view")} className="inline-flex items-center gap-2 rounded-[12px] border border-hpsr-border bg-white px-3 py-2 text-xs font-black text-hpsr-wine"><Eye size={15} /> Visualizar</button>
                <button type="button" onClick={() => void loadRecordDetail(record, "download")} className="inline-flex items-center gap-2 rounded-[12px] bg-hpsr-wine px-3 py-2 text-xs font-black text-white"><Download size={15} /> Baixar</button>
              </div>
            </div>
          </article>
        ))}
        {!visibleRecords.length && !error && <div className="rounded-[16px] border border-dashed border-hpsr-border bg-[#fff8f0] p-6 text-center"><FileText className="mx-auto text-hpsr-wine" /><p className="mt-3 font-black text-hpsr-text">Nenhum registro liberado</p><p className="mt-1 text-sm text-hpsr-muted">Exames, vacinas e documentos em sigilo não aparecem no portal.</p></div>}
      </div>

      {pendingMultiDownload && (
        <div className="hpsr-modal-tone fixed inset-0 z-[130] flex items-end justify-center bg-black/55 p-2 sm:items-center sm:p-3" onMouseDown={(event) => { if (event.target === event.currentTarget) setPendingMultiDownload(null); }}>
          <div className="w-full max-w-md rounded-t-[22px] border border-hpsr-border bg-white p-5 shadow-2xl sm:rounded-[22px]">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-amber-100 p-2.5 text-amber-800"><AlertTriangle size={22} /></div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-black text-hpsr-text">Permita vários downloads</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-hpsr-muted">
                  Este exame possui {pendingMultiDownload.pages.length} páginas. Cada página será baixada separadamente em PNG.
                </p>
                <div className="mt-3 rounded-[12px] border border-amber-300 bg-amber-50 p-3 text-sm font-semibold leading-5 text-amber-950">
                  O navegador pode solicitar autorização para baixar vários arquivos. Quando o aviso aparecer, escolha <strong>Permitir</strong> para receber todas as páginas.
                </div>
              </div>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setPendingMultiDownload(null)} className="rounded-[12px] border border-hpsr-border bg-white px-4 py-2.5 text-sm font-black text-hpsr-wine">Cancelar</button>
              <button type="button" onClick={confirmMultiPageDownload} className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-hpsr-wine px-4 py-2.5 text-sm font-black text-white"><Download size={16} /> Entendi, baixar todas</button>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="hpsr-modal-tone fixed inset-0 z-[120] flex items-end justify-center overflow-y-auto bg-black/55 p-2 sm:items-center sm:p-3" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
          <div className="flex max-h-[96dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[22px] border border-hpsr-border bg-white shadow-2xl sm:max-h-[92dvh] sm:rounded-[22px]">
            <div className="flex items-center justify-between border-b border-hpsr-border bg-[#fff8f0] p-4"><div><h3 className="font-black text-hpsr-text">{selected.title}</h3><p className="text-xs font-semibold text-hpsr-muted">{formatDate(selected.createdAt)} · {selected.doctor}</p></div><button type="button" onClick={() => setSelected(null)} className="rounded-full border border-hpsr-border bg-white p-2 text-hpsr-wine"><X size={18} /></button></div>
            <div className="hpsr-touch-scroll min-h-0 flex-1 overflow-y-auto p-3 sm:p-5"><div className="mb-4 rounded-[12px] border border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-950">Conteúdo disponibilizado pelo Hospital São Rafael.</div>{(selected.previewImages?.length || selected.previewImage) ? <div className="space-y-4">{(selected.previewImages?.length ? selected.previewImages : [selected.previewImage!]).map((page, index) => <img key={`${selected.id}-${index}`} src={page} alt={`${selected.title} — página ${index + 1}`} className="mx-auto h-auto max-w-full rounded-[12px] border border-hpsr-border bg-white" />)}</div> : <iframe title={`Documento clínico: ${selected.title}`} sandbox="" referrerPolicy="no-referrer" loading="lazy" className="h-[min(64dvh,720px)] min-h-[280px] w-full max-w-full rounded-xl border border-hpsr-border bg-white" srcDoc={`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob: https:; style-src 'unsafe-inline'; font-src data:; base-uri 'none'; form-action 'none'"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font:15px/1.55 Arial,sans-serif;padding:14px;overflow-wrap:anywhere;color:#321b14;}img,table{max-width:100%;}table{display:block;overflow-x:auto;}</style>${selected.html || "<p>Este registro antigo não possui conteúdo formatado disponível.</p>"}`} />}</div>
          </div>
        </div>
      )}
    </section>
  );
}
