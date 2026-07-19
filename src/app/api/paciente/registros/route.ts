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

    const recordId = request.nextUrl.searchParams.get("id");
    if (recordId) {
      const { data: record, error } = await patientSession.supabase
        .from("clinical_records")
        .select("id,patient_passport,record_type,payload,created_at,updated_at,is_confidential,released_at")
        .eq("id", recordId)
        .eq("patient_passport", patientSession.access.patient_passport)
        .eq("is_confidential", false)
        .not("released_at", "is", null)
        .maybeSingle();
      if (error) throw error;
      if (!record) return NextResponse.json({ error: "Registro não encontrado." }, { status: 404 });
      return NextResponse.json({ ok: true, record: safeRecord(record) });
    }

    const { data, error } = await patientSession.supabase
      .from("clinical_records")
      .select("id,record_type,created_at,updated_at,is_confidential,released_at,title:payload->>title,exam_name:payload->>examName,document_title:payload->>documentTitle,doctor_name:payload->doctor->>name,doctor_name_flat:payload->>doctorName,protocol:payload->>protocol")
      .eq("patient_passport", patientSession.access.patient_passport)
      .eq("is_confidential", false)
      .not("released_at", "is", null)
      .order("created_at", { ascending: false });

    if (error) throw error;
    const records = (data || []).map((record: any) => ({
      id: record.id,
      type: record.record_type,
      title: record.exam_name || record.document_title || record.title || record.record_type,
      doctor: record.doctor_name || record.doctor_name_flat || "Equipe médica",
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      protocol: record.protocol || null,
      isConfidential: Boolean(record.is_confidential),
    }));
    return NextResponse.json({ ok: true, records });
  } catch (error) {
    console.error("[patient-portal] records", error);
    return NextResponse.json({ error: "Não foi possível carregar os registros liberados." }, { status: 500 });
  }
}
