"use client";
import { useEffect, useRef } from "react";
import { renderVaccinationCard } from "@/components/vaccination/VaccinationWorkspace";
import { useVirtualPngPreview } from "@/lib/use-virtual-png-preview";
import type { AdultCardVariant, VaccinationApplication, VaccinationGroup } from "@/lib/vaccination";
type Snapshot = { group: VaccinationGroup; adultVariant?: AdultCardVariant; patientName: string; passport: string; birthDate?: string; doctorName: string; observations?: string; applications?: VaccinationApplication[] };
function VaccinationPage({ snapshot, page, title, autoDownload }: { snapshot: Snapshot; page: number; title: string; autoDownload: boolean }) {
  const downloaded = useRef("");
  const png = useVirtualPngPreview(true, snapshot, page, async () => {
    const canvas = document.createElement("canvas");
    await renderVaccinationCard({ canvas, group: snapshot.group, adultVariant: snapshot.adultVariant || "masculino", applications: snapshot.applications || [], patientName: snapshot.patientName, passport: snapshot.passport, birthDate: snapshot.birthDate || "", doctorName: snapshot.doctorName, observations: snapshot.observations || "", page });
    return new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/png"));
  });
  function download() {
    if (!png.url) return;
    const anchor = document.createElement("a");
    anchor.href = png.url;
    anchor.download = `${title.replace(/[^a-z0-9]+/gi, "-") || "caderneta"}-pagina-${page + 1}.png`;
    anchor.click();
  }
  useEffect(() => {
    if (!autoDownload || !png.url || downloaded.current === png.url) return;
    const timer = window.setTimeout(() => { downloaded.current = png.url; download(); }, page * 250);
    return () => window.clearTimeout(timer);
    // Download uses the URL currently displayed, never a second render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDownload, png.url, page]);
  return <div className="space-y-2 rounded-xl border border-hpsr-border bg-[#f5ece3] p-2 sm:p-3">
    <button type="button" disabled={!png.url} onClick={download} className="min-h-9 rounded-lg bg-hpsr-wine px-3 text-xs font-bold text-white disabled:opacity-50">Baixar página {page + 1}</button>
    {png.error ? <p role="alert" className="text-sm text-red-800">{png.error}</p> : png.url ? <img src={png.url} alt={`${title} — página ${page + 1}`} className="block h-auto w-full bg-white" /> : <p role="status" className="p-4 text-center text-sm">Preparando a carteira completa…</p>}
  </div>;
}
export function SavedVaccinationSheet({ snapshot, title, autoDownload = false }: { snapshot: Snapshot; title: string; autoDownload?: boolean }) {
  return <div className="space-y-4">{Array.from({ length: snapshot.group === "crianca" ? 2 : 1 }, (_, page) => <VaccinationPage key={page} snapshot={snapshot} page={page} title={title} autoDownload={autoDownload} />)}</div>;
}
