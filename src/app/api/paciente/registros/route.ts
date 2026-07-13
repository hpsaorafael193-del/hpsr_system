import { NextRequest, NextResponse } from "next/server";
import { getValidPatientSession } from "@/lib/patient-portal/server";

export const runtime = "nodejs";
export const revalidate = 0;

function sanitizeClinicalHtml(value: unknown) {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/\son\w+\s*=\s*(["']).*?\1/gi, "")
    .replace(/javascript:/gi, "");
}

function safeRecord(record: any) {
  const payload = record.payload || {};
  return {
    id: record.id,
    type: record.record_type,
    title: payload.examName || payload.documentTitle || payload.title || record.record_type,
    doctor: payload.doctor?.name || payload.doctorName || "Equipe médica",
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    protocol: payload.protocol || null,
    html: sanitizeClinicalHtml(
      payload.finalHtml || payload.reportHtml || payload.documentHtml || payload.html || payload.editorHtml ||
      (payload.examName ? `<section><h2>${String(payload.examName)}</h2>${payload.patient?.name ? `<p><strong>Paciente:</strong> ${String(payload.patient.name)}</p>` : ""}${payload.doctor?.name ? `<p><strong>Médico responsável:</strong> ${String(payload.doctor.name)}</p>` : ""}<p>${String(payload.summary || payload.conclusion || "O exame foi salvo, mas o conteúdo formatado não foi incluído neste registro antigo.")}</p></section>` : "") ||
      (payload.documentTitle ? `<section><h2>${String(payload.documentTitle)}</h2>${payload.patient?.name ? `<p><strong>Paciente:</strong> ${String(payload.patient.name)}</p>` : ""}${payload.doctor?.name ? `<p><strong>Médico responsável:</strong> ${String(payload.doctor.name)}</p>` : ""}<p>${String(payload.summary || "O documento foi salvo, mas o conteúdo formatado não foi incluído neste registro antigo.")}</p></section>` : "")
    ),
    previewImage: typeof payload.previewImage === "string" ? payload.previewImage : null,
    previewImages: Array.isArray(payload.previewImages)
      ? payload.previewImages.filter((item: unknown) => typeof item === "string" && item.startsWith("data:image/"))
      : (typeof payload.previewImage === "string" ? [payload.previewImage] : []),
    isConfidential: Boolean(record.is_confidential),
  };
}

export async function GET(request: NextRequest) {
  try {
    const patientSession = await getValidPatientSession(request);
    if (!patientSession) return NextResponse.json({ error: "Sessão inválida ou expirada." }, { status: 401 });

    const { data, error } = await patientSession.supabase
      .from("clinical_records")
      .select("id,patient_passport,record_type,payload,created_at,updated_at,is_confidential,released_at")
      .eq("patient_passport", patientSession.access.patient_passport)
      .eq("is_confidential", false)
      .not("released_at", "is", null)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ ok: true, records: (data || []).map(safeRecord) });
  } catch (error) {
    console.error("[patient-portal] records", error);
    return NextResponse.json({ error: "Não foi possível carregar os registros liberados." }, { status: 500 });
  }
}
