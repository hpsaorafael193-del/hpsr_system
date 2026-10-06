import { NextRequest, NextResponse } from "next/server";
import { getValidPatientSession, resolvePortalPatientPassport } from "@/lib/patient-portal/server";

export const runtime = "nodejs";
export const revalidate = 0;

function sanitizeClinicalHtml(value: unknown) {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/\son\w+\s*=\s*(["']).*?\1/gi, "")
    .replace(/javascript:/gi, "");
}


function safeVaccinationSnapshot(payload: any) {
  const snapshot = payload?.releasedSnapshot;
  if (!snapshot || typeof snapshot !== "object") return null;
  const group = ["adulto", "crianca", "gestante", "idoso"].includes(String(snapshot.group || "")) ? String(snapshot.group) : "";
  if (!group) return null;
  const adultVariant = snapshot.adultVariant === "feminino" ? "feminino" : "masculino";
  const applications = Array.isArray(snapshot.applications) ? snapshot.applications.map((item: any) => ({
    id: String(item?.id || ""),
    patientPassport: String(item?.patientPassport || snapshot.passport || ""),
    patientName: String(item?.patientName || snapshot.patientName || ""),
    group,
    adultVariant: group === "adulto" ? adultVariant : undefined,
    vaccine: String(item?.vaccine || ""),
    dose: String(item?.dose || ""),
    date: String(item?.date || ""),
    lot: String(item?.lot || ""),
    doctorName: String(item?.doctorName || snapshot.doctorName || ""),
    doctorCrm: String(item?.doctorCrm || ""),
    signatureImage: typeof item?.signatureImage === "string" ? item.signatureImage : null,
    createdAt: String(item?.createdAt || ""),
    slotId: String(item?.slotId || ""),
  })).filter((item: any) => item.vaccine && item.date) : [];
  return {
    schemaVersion: Number(snapshot.schemaVersion) || 1,
    cardModel: String(snapshot.cardModel || payload?.cardModel || group),
    group,
    adultVariant,
    patientName: String(snapshot.patientName || payload?.patient?.name || "Paciente"),
    passport: String(snapshot.passport || payload?.patient?.passport || ""),
    birthDate: String(snapshot.birthDate || ""),
    doctorName: String(snapshot.doctorName || payload?.doctorName || "Equipe médica"),
    observations: String(snapshot.observations || ""),
    applications,
  };
}
function resolveRecordDate(payload: any, fallback: string) {
  const performedAt = String(payload?.examPerformedAt || "").trim();
  if (performedAt) return performedAt;
  const date = String(payload?.examDate || "").trim();
  const time = String(payload?.examTime || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return `${date}T${/^\d{2}:\d{2}$/.test(time) ? time : "00:00"}:00-03:00`;
  return fallback;
}

function safeRecord(record: any) {
  const payload = record.payload || {};
  const releasedSnapshot = ["Documento", "documento", "Exame", "exame"].includes(String(record.record_type || ""))
    && payload?.releasedSnapshot && typeof payload.releasedSnapshot === "object"
    ? payload.releasedSnapshot
    : null;
  const visiblePayload = releasedSnapshot || payload;
  return {
    id: record.id,
    type: record.record_type,
    title: visiblePayload.examName || visiblePayload.documentTitle || visiblePayload.title || record.record_type,
    doctor: visiblePayload.doctor?.name || visiblePayload.doctorName || "Equipe médica",
    createdAt: resolveRecordDate(visiblePayload, record.created_at),
    updatedAt: visiblePayload.releasedAt || record.released_at || record.updated_at,
    protocol: visiblePayload.protocol || null,
    html: sanitizeClinicalHtml(
      visiblePayload.finalHtml || visiblePayload.reportHtml || visiblePayload.documentHtml || visiblePayload.html || visiblePayload.editorHtml ||
      (visiblePayload.examName ? `<section><h2>${String(visiblePayload.examName)}</h2>${visiblePayload.patient?.name ? `<p><strong>Paciente:</strong> ${String(visiblePayload.patient.name)}</p>` : ""}${visiblePayload.doctor?.name ? `<p><strong>Médico responsável:</strong> ${String(visiblePayload.doctor.name)}</p>` : ""}<p>${String(visiblePayload.summary || visiblePayload.conclusion || "O exame foi salvo, mas o conteúdo formatado não foi incluído neste registro antigo.")}</p></section>` : "") ||
      (visiblePayload.documentTitle ? `<section><h2>${String(visiblePayload.documentTitle)}</h2>${visiblePayload.patient?.name ? `<p><strong>Paciente:</strong> ${String(visiblePayload.patient.name)}</p>` : ""}${visiblePayload.doctor?.name ? `<p><strong>Médico responsável:</strong> ${String(visiblePayload.doctor.name)}</p>` : ""}<p>${String(visiblePayload.summary || "O documento foi salvo, mas o conteúdo formatado não foi incluído neste registro antigo.")}</p></section>` : "") ||
      (record.record_type === "Vacina" && visiblePayload.vaccine ? `<section><h2>${String(visiblePayload.title || "Registro de vacinação")}</h2><p><strong>Vacina:</strong> ${String(visiblePayload.vaccine.name || "—")}</p><p><strong>Dose:</strong> ${String(visiblePayload.vaccine.dose || "—")}</p><p><strong>Data:</strong> ${String(visiblePayload.vaccine.date || "—")}</p>${visiblePayload.vaccine.lot ? `<p><strong>Lote:</strong> ${String(visiblePayload.vaccine.lot)}</p>` : ""}${visiblePayload.doctor?.name ? `<p><strong>Médico responsável:</strong> ${String(visiblePayload.doctor.name)}${visiblePayload.doctor?.crm ? ` · CRM ${String(visiblePayload.doctor.crm)}` : ""}</p>` : ""}</section>` : "")
    ),
    previewImage: typeof visiblePayload.previewImage === "string" ? visiblePayload.previewImage : null,
    previewImages: Array.isArray(visiblePayload.previewImages)
      ? visiblePayload.previewImages.filter((item: unknown) => typeof item === "string" && item.startsWith("data:image/"))
      : (typeof visiblePayload.previewImage === "string" ? [visiblePayload.previewImage] : []),
    isConfidential: Boolean(record.is_confidential),
  };
}

export async function GET(request: NextRequest) {
  try {
    const patientSession = await getValidPatientSession(request);
    if (!patientSession) return NextResponse.json({ error: "Sessão inválida ou expirada." }, { status: 401 });

    const targetPassport = await resolvePortalPatientPassport(request, patientSession);
    if (!targetPassport) return NextResponse.json({ error: "Acesso não autorizado para este paciente." }, { status: 403 });

    const recordId = request.nextUrl.searchParams.get("id");
    if (recordId?.startsWith("vaccination-card:")) {
      const cardId = recordId.slice("vaccination-card:".length);
      if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(cardId)) return NextResponse.json({ error: "Caderneta inválida." }, { status: 400 });
      const { data: card, error: cardError } = await patientSession.supabase
        .from("clinical_records")
        .select("id,patient_passport,payload,released_at,updated_at")
        .eq("record_type", "CadernetaVacinal")
        .eq("id", cardId).eq("patient_passport", targetPassport)
        .eq("is_confidential", false).not("released_at", "is", null).maybeSingle();
      if (cardError) throw cardError;
      // A busca pode não encontrar a caderneta (ou ela deixar de estar
      // liberada). Garanta a existência do registro antes de acessar seus dados.
      if (!card) return NextResponse.json({ error: "Caderneta não liberada." }, { status: 404 });
      const dynamicCard = safeVaccinationSnapshot(card.payload);
      if (dynamicCard) {
        return NextResponse.json({ ok: true, record: {
          id: recordId, type: "Vacina", title: card.payload?.cardModel === "gestante" ? "Caderneta de vacinação gestacional" : "Caderneta de vacinação", doctor: String(card.payload?.doctorName || "Equipe médica"),
          createdAt: card.released_at, updatedAt: card.updated_at, protocol: null,
          previewImage: null, previewImages: [], vaccinationCard: dynamicCard, isConfidential: false,
        } });
      }

      // Compatibilidade histórica: cadernetas antigas que já possuem PNG no
      // Storage continuam acessíveis, mas novas liberações não criam arquivos.
      const publishedPath = typeof card?.payload?.publishedPath === "string" ? card.payload.publishedPath : "";
      if (!publishedPath || !publishedPath.startsWith(`${cardId}/publish-`))
        return NextResponse.json({ error: "Caderneta não liberada." }, { status: 404 });
      const publishedPaths = Array.isArray(card.payload?.publishedPaths) && card.payload.publishedPaths.length === 2
        && card.payload.publishedPaths.every((path: unknown) => typeof path === "string" && path.startsWith(`${cardId}/publish-`))
        ? card.payload.publishedPaths as string[] : [publishedPath];
      const signedImages: string[] = [];
      for (const path of publishedPaths) {
        const {data:signed,error:signError} = await patientSession.supabase.storage.from("vaccination-cards").createSignedUrl(path,600);
        if(signError || !signed?.signedUrl) throw signError || new Error("Falha ao disponibilizar caderneta.");
        signedImages.push(signed.signedUrl);
      }
      return NextResponse.json({ ok: true, record: {
        id: recordId, type: "Vacina", title: card.payload?.cardModel === "gestante" ? "Caderneta de vacinação gestacional" : "Caderneta de vacinação", doctor: String(card.payload?.doctorName || "Equipe médica"),
        createdAt: card.released_at, updatedAt: card.updated_at, protocol: null,
        previewImage: signedImages[0], previewImages: signedImages, vaccinationCard: null, isConfidential: false,
      } });
    }
    if (recordId) {
      const { data: record, error } = await patientSession.supabase
        .from("clinical_records")
        .select("id,patient_passport,record_type,payload,created_at,updated_at,is_confidential,released_at")
        .eq("id", recordId)
        .eq("patient_passport", targetPassport)
        .in("record_type", ["Exame", "Documento", "Vacina"])
        .eq("is_confidential", false)
        .not("released_at", "is", null)
        .maybeSingle();
      if (error) throw error;
      if (!record) return NextResponse.json({ error: "Registro não encontrado." }, { status: 404 });
      return NextResponse.json({ ok: true, record: safeRecord(record) });
    }

    const { data, error } = await patientSession.supabase
      .from("clinical_records")
      .select("id,record_type,created_at,updated_at,is_confidential,released_at,title:payload->>title,exam_name:payload->>examName,released_exam_name:payload->releasedSnapshot->>examName,document_title:payload->>documentTitle,released_document_title:payload->releasedSnapshot->>documentTitle,doctor_name:payload->doctor->>name,released_doctor_name:payload->releasedSnapshot->doctor->>name,doctor_name_flat:payload->>doctorName,protocol:payload->>protocol,released_protocol:payload->releasedSnapshot->>protocol,exam_date:payload->>examDate,released_exam_date:payload->releasedSnapshot->>examDate,exam_time:payload->>examTime,released_exam_time:payload->releasedSnapshot->>examTime,exam_performed_at:payload->>examPerformedAt,released_exam_performed_at:payload->releasedSnapshot->>examPerformedAt")
      .eq("patient_passport", targetPassport)
      .in("record_type", ["Exame", "Documento", "Vacina"])
      .eq("is_confidential", false)
      .not("released_at", "is", null)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    const records = (data || []).map((record: any) => ({
      id: record.id,
      type: record.record_type,
      title: ["Documento", "documento"].includes(String(record.record_type || ""))
        ? (record.released_document_title || record.document_title || record.title || record.record_type)
        : (record.released_exam_name || record.exam_name || record.document_title || record.title || record.record_type),
      doctor: record.released_doctor_name || record.doctor_name || record.doctor_name_flat || "Equipe médica",
      createdAt: record.released_exam_performed_at || record.exam_performed_at || (record.released_exam_date ? `${record.released_exam_date}T${record.released_exam_time || "00:00"}:00-03:00` : record.exam_date ? `${record.exam_date}T${record.exam_time || "00:00"}:00-03:00` : record.created_at),
      updatedAt: record.released_at || record.updated_at,
      protocol: record.released_protocol || record.protocol || null,
      isConfidential: Boolean(record.is_confidential),
    }));
    // Só a versão formalmente publicada aparece aqui. O rascunho e as
    // observações internas nunca são retornados ao portal do paciente.
    const { data: cards, error: cardError } = await patientSession.supabase
      .from("clinical_records")
      .select("id,payload,released_at,updated_at")
      .eq("patient_passport", targetPassport).eq("record_type", "CadernetaVacinal")
      .eq("is_confidential", false).not("released_at", "is", null)
      .order("released_at", { ascending: false });
    if (cardError) throw cardError;
    const publishedCards = (cards || [])
      .filter((card: any) => Boolean(safeVaccinationSnapshot(card.payload)) || (typeof card.payload?.publishedPath === "string" && card.payload.publishedPath.startsWith(`${card.id}/publish-`)))
      .map((card: any) => ({
      id: `vaccination-card:${card.id}`,
      type: "Vacina", title: card.payload?.cardModel === "gestante" ? "Caderneta de vacinação gestacional" : "Caderneta de vacinação", doctor: String(card.payload?.doctorName || "Equipe médica"),
      createdAt: card.released_at, updatedAt: card.updated_at, protocol: null, isConfidential: false,
    }));
    return NextResponse.json({ ok: true, records: [...publishedCards, ...records] });
  } catch (error) {
    console.error("[patient-portal] records", error);
    return NextResponse.json({ error: "Não foi possível carregar os registros liberados." }, { status: 500 });
  }
}
