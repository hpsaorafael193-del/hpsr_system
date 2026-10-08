"use client";
import { useEffect, useRef, useState } from "react";
import { renderExamPage } from "@/lib/exam-page-canvas";
import { renderSavedDocumentCanvas } from "@/lib/document-page-canvas";
import { resolveClinicalSnapshot, type ClinicalRenderSnapshot } from "@/lib/clinical-render-snapshot";
import { useVirtualPngPreview } from "@/lib/use-virtual-png-preview";

export function SavedClinicalSheet({ payload, recordType, savedAt = "", title = "registro", autoDownload = false }: { payload: Record<string, any>; recordType: string; savedAt?: string; title?: string; autoDownload?: boolean }) {
  const downloaded = useRef<string | null>(null);
  const legacyImages: string[] = !payload.renderSnapshot ? (payload.previewImages || (payload.previewImage ? [payload.previewImage] : [])).filter((value: unknown) => typeof value === "string" && /^(data:image\/|blob:|https?:\/\/)/.test(value)) : [];
  const [resolved, setResolved] = useState<{ snapshot: ClinicalRenderSnapshot; legacy: boolean } | null>(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  useEffect(() => {
    let active = true;
    setResolved(null); setError(""); setPage(0);
    if (legacyImages.length) return;
    void document.fonts.ready.then(() => {
      try { const next = resolveClinicalSnapshot(payload, recordType, savedAt); if (active) setResolved(next); }
      catch (cause) { if (active) setError(cause instanceof Error ? cause.message : "Falha ao reconstruir a folha."); }
    });
    return () => { active = false; };
  }, [payload, recordType, savedAt]);
  const snapshot = resolved?.snapshot;
  const signatureMissing = snapshot ? snapshot.kind === "exam" ? !snapshot.document.metadata.signatureImage : !snapshot.metadata.doctor.signatureImage : false;
  const count = snapshot ? snapshot.kind === "exam" ? snapshot.document.pages.length : snapshot.pages.length : legacyImages.length;
  const png = useVirtualPngPreview(Boolean(snapshot), snapshot, page, async () => {
    if (!snapshot) return null;
    if (snapshot.kind === "exam") return renderExamPage(snapshot.document, page);
    const canvas = await renderSavedDocumentCanvas(snapshot, page);
    return canvas ? new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/png")) : null;
  });
  const imageUrl = png.url || legacyImages[page] || "";
  function download() {
    if (!imageUrl) return;
    const anchor = document.createElement("a"); anchor.href = imageUrl;
    anchor.download = `${title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9_-]+/gi, "_") || "registro"}_pagina_${page + 1}.png`;
    anchor.click();
  }
  useEffect(() => {
    if (autoDownload && imageUrl && downloaded.current !== imageUrl) { downloaded.current = imageUrl; download(); }
    // The button and automatic download share the currently displayed blob.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDownload, imageUrl]);
  return <div className="mx-auto w-full max-w-[794px] space-y-3">
    {signatureMissing && !resolved?.legacy && <p role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">Este registro não preservou a imagem da assinatura na época do salvamento. O nome do médico no rodapé é sua identificação, não uma assinatura.</p>}
    {resolved?.legacy && <p role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">Folha reconstruída dos dados de um registro antigo. A assinatura, anexos e configurações que não foram preservados na época não podem ser recuperados fielmente.</p>}
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-hpsr-border bg-[#fffaf4] p-2">
      <div className="flex items-center gap-2"><button type="button" disabled={!count || page === 0} onClick={() => setPage(value => value - 1)} className="min-h-9 rounded-lg border border-hpsr-border px-3 text-xs font-bold disabled:opacity-40">Anterior</button><span className="text-xs font-bold">Página {count ? page + 1 : 0}/{count}</span><button type="button" disabled={!count || page >= count - 1} onClick={() => setPage(value => value + 1)} className="min-h-9 rounded-lg border border-hpsr-border px-3 text-xs font-bold disabled:opacity-40">Próxima</button></div>
      <button type="button" disabled={!imageUrl} onClick={download} className="min-h-9 rounded-lg bg-hpsr-wine px-3 text-xs font-bold text-white disabled:opacity-40">Baixar PNG desta página</button>
    </div>
    {error || png.error ? <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-900">{error || png.error}</p> : imageUrl ? <img src={imageUrl} width={794} height={1123} className="block h-auto w-full bg-white shadow-xl" alt={`${title} — página ${page + 1}`} /> : <p role="status" className="rounded-xl bg-white p-6 text-center text-sm">Preparando a folha completa…</p>}
  </div>;
}
