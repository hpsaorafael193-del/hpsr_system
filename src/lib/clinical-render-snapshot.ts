import type { RenderedExamDocument, RenderPatient, RenderDoctor } from "@/data/exames/final-renderer";
import { measureDocumentReportHtml } from "@/lib/document-page-canvas";
import { splitClinicalReportHtmlIntoPages } from "@/data/exames/final-renderer";

export const CLINICAL_RENDER_LAYOUT = Object.freeze({ width: 794, height: 1123, patientNameFont: 13, patientDataFont: 12, signatureWidth: 260, signatureHeight: 50, bodyFont: 12, bodyLineHeight: 16.5, template: "hpsr-institutional-v1" });
export type ExamRenderSnapshot = { kind: "exam"; rendererVersion: 1; layout: { width: number; height: number; patientNameFont: number; patientDataFont: number; signatureWidth: number; signatureHeight: number; bodyFont: number; bodyLineHeight: number; template: string }; document: RenderedExamDocument };
export type DocumentRenderSnapshot = { kind: "document"; rendererVersion: 1; layout: { width: number; height: number; patientNameFont: number; patientDataFont: number; signatureWidth: number; signatureHeight: number; bodyFont: number; bodyLineHeight: number; template: string }; pages: string[]; metadata: { title: string; date: string; patient: RenderPatient; doctor: RenderDoctor & { role?: string; signatureImage?: string | null } } };
export type ClinicalRenderSnapshot = ExamRenderSnapshot | DocumentRenderSnapshot;

// Preserve original signature bytes, not the generated report PNG. Profile uploads
// overwrite signature.png; a mutable URL alone would change historical reports.
export async function preserveOriginalAsset(source: string | null | undefined, signature = false): Promise<string | null> {
  if (!source) return null;
  if (source.startsWith("data:")) return source;
  if (!signature && !source.startsWith("blob:")) return source;
  const response = await fetch(source, { cache: "no-store" });
  if (!response.ok) throw new Error("Não foi possível preservar a assinatura ou o anexo original. Tente novamente antes de salvar.");
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Falha ao ler a assinatura ou o anexo original."));
    reader.readAsDataURL(blob);
  });
}
export async function captureExamSnapshot(document: RenderedExamDocument): Promise<ExamRenderSnapshot> {
  if (!document.metadata.signatureImage) throw new Error("Cadastre ou selecione a imagem da assinatura do médico antes de gerar ou salvar o laudo.");
  const frozen = JSON.parse(JSON.stringify(document)) as RenderedExamDocument;
  frozen.metadata.signatureImage = await preserveOriginalAsset(frozen.metadata.signatureImage, true);
  for (const page of frozen.pages) for (const file of page.manualAttachments || []) {
    file.url = await preserveOriginalAsset(file.url, true) || "";
  }
  return { kind: "exam", rendererVersion: 1, layout: CLINICAL_RENDER_LAYOUT, document: frozen };
}
export async function captureDocumentSnapshot(metadata: DocumentRenderSnapshot["metadata"], pages: string[]): Promise<DocumentRenderSnapshot> {
  if (!metadata.doctor.signatureImage) throw new Error("Cadastre ou selecione a imagem da assinatura do médico antes de gerar ou salvar o documento.");
  const frozen = JSON.parse(JSON.stringify(metadata)) as DocumentRenderSnapshot["metadata"];
  frozen.doctor.signatureImage = await preserveOriginalAsset(frozen.doctor.signatureImage, true);
  return { kind: "document", rendererVersion: 1, layout: { ...CLINICAL_RENDER_LAYOUT, signatureWidth: 200, signatureHeight: 35, bodyFont: 11.2 }, metadata: frozen, pages: [...pages] };
}

export function resolveClinicalSnapshot(payload: Record<string, any>, recordType: string, fallbackDate = ""): { snapshot: ClinicalRenderSnapshot; legacy: boolean } {
  const saved = payload.renderSnapshot;
  if (saved) {
    if (saved.rendererVersion !== 1 || !["exam", "document"].includes(saved.kind)) throw new Error("Este registro usa uma versão de folha não suportada. Atualize o sistema para abri-lo.");
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
  if (recordType.toLowerCase() === "documento") return { legacy: true, snapshot: { kind: "document", rendererVersion: 1, layout: CLINICAL_RENDER_LAYOUT, pages, metadata: { title: payload.documentTitle || payload.title || "Documento médico", date, patient, doctor } } };
  return { legacy: true, snapshot: { kind: "exam", rendererVersion: 1, layout: CLINICAL_RENDER_LAYOUT, document: { metadata: { patient, doctor, signatureImage: doctor.signatureImage || null, date, time: payload.examTime || "", protocol: payload.protocol || "", examName: payload.examName || payload.title || "Exame" }, pages: pages.map((reportHtml, index) => ({ id: `legacy-${index}`, type: "report", label: `Página ${index + 1}`, reportHtml })), automaticAttachments: [] } } };
}
