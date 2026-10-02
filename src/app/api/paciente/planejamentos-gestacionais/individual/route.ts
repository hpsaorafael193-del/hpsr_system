import { NextRequest, NextResponse } from "next/server";
import { getValidPatientSession, resolvePortalPatientPassport } from "@/lib/patient-portal/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    const valid = await getValidPatientSession(request);
    if (!valid) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
    const passport = await resolvePortalPatientPassport(request, valid);
    if (!passport) return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
    const occurrenceId = request.nextUrl.searchParams.get("occurrenceId") || "";
    if (!UUID.test(occurrenceId)) return NextResponse.json({ error: "Documento inválido." }, { status: 400 });

    const { data: occurrence, error: occurrenceError } = await valid.supabase.from("clinical_followup_occurrences")
      .select("id,plan_id,doctor_id,individual_released_at,individual_released_document_path")
      .eq("id", occurrenceId).not("individual_released_at", "is", null).maybeSingle();
    if (occurrenceError) throw occurrenceError;
    if (!occurrence) return NextResponse.json({ error: "Documento não liberado." }, { status: 404 });

    const { data: plan, error: planError } = await valid.supabase.from("clinical_followup_plans")
      .select("id,patient_passport,plan_type,status")
      .eq("id", occurrence.plan_id).eq("patient_passport", passport).in("plan_type", ["gestacional", "in_vitro"]).in("specialty", ["Obstetra", "Ginecologia"]).neq("status", "Arquivado").maybeSingle();
    if (planError) throw planError;
    const path = occurrence.individual_released_document_path;
    if (!plan || !path || !path.startsWith(`${occurrence.doctor_id}/${occurrence.plan_id}/individual/${occurrence.id}/`)) return NextResponse.json({ error: "Documento não liberado." }, { status: 404 });

    const { data: file, error: downloadError } = await valid.supabase.storage.from("obstetric-plans").download(path);
    if (downloadError || !file) throw downloadError || new Error("Documento não encontrado.");
    const isDownload = request.nextUrl.searchParams.get("download") === "1";
    const filename = `planejamento-${plan.plan_type === "in_vitro" ? "fiv" : "gestacional"}-individual.png`;
    return new NextResponse(await file.arrayBuffer(), { headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `${isDownload ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    }});
  } catch (caught) {
    console.error("[patient-portal] obstetric individual document", caught);
    return NextResponse.json({ error: "Não foi possível carregar o documento individual." }, { status: 500 });
  }
}
