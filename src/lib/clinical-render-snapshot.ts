import { optimizeClinicalImage, blobDataUrl } from "@/lib/clinical-image-optimization";
import type { RenderedExamDocument, RenderPatient, RenderDoctor } from "@/data/exames/final-renderer";
import { measureDocumentReportHtml } from "@/lib/document-page-canvas";
import { splitClinicalReportHtmlIntoPages } from "@/data/exames/final-renderer";

export const CLINICAL_RENDER_LAYOUT = Object.freeze({ width: 794, height: 1123, patientNameFont: 13, patientDataFont: 12, signatureWidth: 260, signatureHeight: 50, bodyFont: 12, bodyLineHeight: 16.5, template: "hpsr-institutional-v1" });
export type ExamRenderSnapshot = { kind: "exam"; rendererVersion: 1 | 2 | 3 | 4; layout: { width: number; height: number; patientNameFont: number; patientDataFont: number; signatureWidth: number; signatureHeight: number; bodyFont: number; bodyLineHeight: number; template: string; unsignedBodyHeight?: number; signedBodyHeight?: number; sectionGap?: number }; document: RenderedExamDocument };
export type DocumentRenderSnapshot = { kind: "document"; rendererVersion: 1 | 2; layout: { width: number; height: number; patientNameFont: number; patientDataFont: number; signatureWidth: number; signatureHeight: number; bodyFont: number; bodyLineHeight: number; template: string }; pages: string[]; metadata: { title: string; date: string; patient: RenderPatient; doctor: RenderDoctor & { role?: string; signatureImage?: string | null } } };
export type ClinicalRenderSnapshot = ExamRenderSnapshot | DocumentRenderSnapshot;

// Preserve original signature bytes, not the generated report PNG. Profile uploads
// overwrite signature.png; a mutable URL alone would change historical reports.
const preservedAssets = new Map<string, Promise<string>>();
export async function preserveOriginalAsset(source: string | null | undefined, signature = false): Promise<string | null> {
  if (!source) return null;
  if (source.startsWith("/api/clinical-assets?")) return source;
  if (!signature && !/^(data:image\/|blob:)/.test(source)) return source;
  const key = `${signature}:${source}`;
  const cacheable = /^(data:|blob:)/.test(source) || /\/[a-f0-9]{64}\.png(?:\?|$)/i.test(source);
  if (cacheable && preservedAssets.has(key)) return preservedAssets.get(key)!;
  const task = (async () => {
    const response = await fetch(source); if (!response.ok) throw new Error("Não foi possível preservar a imagem. Tente novamente antes de salvar.");
    const original = await response.blob();
    const optimized = await optimizeClinicalImage(original, signature ? "signature" : "attachment");
    return optimized === original && source.startsWith("data:") ? source : blobDataUrl(optimized);
  })();
  if (cacheable && key.length < 12000000) {
    while (preservedAssets.size && (preservedAssets.size >= 8 || [...preservedAssets.keys()].reduce((n,k)=>n+k.length,0)+key.length>12000000)) preservedAssets.delete(preservedAssets.keys().next().value!);
    preservedAssets.set(key, task); task.catch(()=>preservedAssets.delete(key));
  }
  return task;
}
export async function captureExamSnapshot(document: RenderedExamDocument): Promise<ExamRenderSnapshot> {
  if (!document.metadata.signatureImage) throw new Error("Cadastre ou selecione a imagem da assinatura do médico antes de gerar ou salvar o laudo.");
  const frozen = JSON.parse(JSON.stringify(document)) as RenderedExamDocument;
  frozen.metadata.signatureImage = await preserveOriginalAsset(frozen.metadata.signatureImage, true);
  for (const page of frozen.pages) for (const file of page.manualAttachments || []) {
    file.url = await preserveOriginalAsset(file.url, false) || "";
  }
  return { kind: "exam", rendererVersion: frozen.contentRendererVersion === 4 ? 4 : frozen.contentRendererVersion === 3 ? 3 : 2, layout: { ...CLINICAL_RENDER_LAYOUT, patientNameFont: (frozen.contentRendererVersion === 3 || frozen.contentRendererVersion === 4) ? 12 : CLINICAL_RENDER_LAYOUT.patientNameFont, template: frozen.contentRendererVersion === 4 ? "hpsr-exam-sheet-v4" : frozen.contentRendererVersion === 3 ? "hpsr-exam-sheet-v3" : CLINICAL_RENDER_LAYOUT.template, ...(frozen.contentRendererVersion === 4 ? { unsignedBodyHeight: 834, signedBodyHeight: 714, sectionGap: 12 } : {}) }, document: frozen };
}
export async function captureDocumentSnapshot(metadata: DocumentRenderSnapshot["metadata"], pages: string[]): Promise<DocumentRenderSnapshot> {
  if (!metadata.doctor.signatureImage) throw new Error("Cadastre ou selecione a imagem da assinatura do médico antes de gerar ou salvar o documento.");
  const frozen = JSON.parse(JSON.stringify(metadata)) as DocumentRenderSnapshot["metadata"];
  frozen.doctor.signatureImage = await preserveOriginalAsset(frozen.doctor.signatureImage, true);
  return { kind: "document", rendererVersion: 2, layout: { ...CLINICAL_RENDER_LAYOUT, signatureWidth: 200, signatureHeight: 35, bodyFont: 11.4, bodyLineHeight: 15.5 }, metadata: frozen, pages: [...pages] };
}

export function resolveClinicalSnapshot(payload: Record<string, any>, recordType: string, fallbackDate = ""): { snapshot: ClinicalRenderSnapshot; legacy: boolean } {
  const saved = payload.renderSnapshot;
  if (saved) {
    if (!(saved.kind === "exam" ? [1, 2, 3, 4] : [1, 2]).includes(saved.rendererVersion) || !["exam", "document"].includes(saved.kind)) throw new Error("Este registro usa uma versão de folha não suportada. Atualize o sistema para abri-lo.");
    if (saved.kind === "exam" && (!saved.document?.metadata || !saved.document?.pages?.length)) throw new Error("O snapshot da folha está incompleto.");
    if (saved.kind === "document" && (!saved.metadata || !saved.pages?.length)) throw new Error("O snapshot do documento está incompleto.");
    return { snapshot: saved as ClinicalRenderSnapshot, legacy: false };
  }
  const html = String(payload.reportHtml || payload.documentHtml || payload.editorHtml || payload.finalHtml || payload.html || "");
  if (!html) throw new Error("O conteúdo deste registro antigo não foi preservado.");
  const patient = { name: "Paciente", passport: "", age: "", bloodType: "", ...payload.patient } as RenderPatient;
  const doctor = { name: payload.doctorName || "Equipe médica", crm: "", ...payload.doctor };
  const date = String(payload.examDate || payload.savedAt || fallbackDate).slice(0, 10);
  const pages = splitClinicalReportHtmlIntoPages(html, doctor.signatureImage, recordType.toLowerCase() === "documento" ? { measureHeight: measureDocumentReportHtml, capacity: 825 } : undefined);
  if (recordType.toLowerCase() === "documento") return { legacy: true, snapshot: { kind: "document", rendererVersion: 2, layout: CLINICAL_RENDER_LAYOUT, pages, metadata: { title: payload.documentTitle || payload.title || "Documento médico", date, patient, doctor } } };
  return { legacy: true, snapshot: { kind: "exam", rendererVersion: 4, layout: { ...CLINICAL_RENDER_LAYOUT, patientNameFont: 12, template: "hpsr-exam-sheet-v4", unsignedBodyHeight: 834, signedBodyHeight: 714, sectionGap: 12 }, document: { contentRendererVersion: 4, metadata: { patient, doctor, signatureImage: doctor.signatureImage || null, date, time: payload.examTime || "", protocol: payload.protocol || "", examName: payload.examName || payload.title || "Exame" }, pages: pages.map((reportHtml, index) => ({ id: `legacy-${index}`, type: "report", label: `Página ${index + 1}`, reportHtml })), automaticAttachments: [] } } };
}
