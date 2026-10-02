import { NextRequest, NextResponse } from "next/server";
import { getValidPatientSession, resolvePortalPatientPassport } from "@/lib/patient-portal/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const valid = await getValidPatientSession(request);
    if (!valid) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
    const passport = await resolvePortalPatientPassport(request, valid);
    if (!passport) return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
    const planId = request.nextUrl.searchParams.get("planId") || "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(planId)) return NextResponse.json({ error: "Documento inválido." }, { status: 400 });
    const { data: plan, error } = await valid.supabase.from("clinical_followup_plans")
      .select("id,doctor_id,plan_type,planning_released_document_path")
      .eq("id", planId).eq("patient_passport", passport).in("plan_type", ["gestacional", "in_vitro"]).in("specialty", ["Obstetra", "Ginecologia"])
      .not("portal_released_at", "is", null).neq("status", "Arquivado").maybeSingle();
    if (error) throw error;
    const path = plan?.planning_released_document_path;
    if (!plan || !path || !path.startsWith(`${plan.doctor_id}/${plan.id}/`)) return NextResponse.json({ error: "Documento não liberado." }, { status: 404 });
    const { data: file, error: downloadError } = await valid.supabase.storage.from("obstetric-plans").download(path);
    if (downloadError || !file) throw downloadError || new Error("Documento não encontrado.");
    const isDownload = request.nextUrl.searchParams.get("download") === "1";
    const filename = `planejamento-${plan.plan_type === "in_vitro" ? "fiv" : "gestacional"}.png`;
    return new NextResponse(await file.arrayBuffer(), { headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `${isDownload ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    }});
  } catch (caught) {
    console.error("[patient-portal] obstetric planning document", caught);
    return NextResponse.json({ error: "Não foi possível carregar o documento." }, { status: 500 });
  }
}
