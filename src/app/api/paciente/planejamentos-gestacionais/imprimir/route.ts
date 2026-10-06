import { NextRequest, NextResponse } from "next/server";
import { getValidPatientSession, resolvePortalPatientPassport } from "@/lib/patient-portal/server";
import { renderPrintablePlanningDocument } from "@/lib/obstetric-print-document";

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
    const id = request.nextUrl.searchParams.get("id") || "";
    const scope = request.nextUrl.searchParams.get("scope");
    if (!UUID.test(id) || !["integral", "individual"].includes(scope || ""))
      return NextResponse.json({ error: "Documento inválido." }, { status: 400 });

    let snapshot: Record<string, unknown> | null = null;
    let planType: "gestacional" | "in_vitro" = "gestacional";
    if (scope === "integral") {
      const { data, error } = await valid.supabase.from("clinical_followup_plans")
        .select("id,doctor_id,plan_type,planning_released_snapshot,portal_released_at")
        .eq("id", id).eq("patient_passport", passport)
        .in("plan_type", ["gestacional", "in_vitro"])
        .in("specialty", ["Obstetra", "Ginecologia"])
        .neq("status", "Arquivado").not("portal_released_at", "is", null).maybeSingle();
      if (error) throw error;
      if (data?.planning_released_snapshot && typeof data.planning_released_snapshot === "object") {
        snapshot = data.planning_released_snapshot;
        planType = data.plan_type;
      }
    } else {
      const { data: occurrence, error: occurrenceError } = await valid.supabase.from("clinical_followup_occurrences")
        .select("id,plan_id,individual_released_snapshot,individual_released_at")
        .eq("id", id).not("individual_released_at", "is", null).maybeSingle();
      if (occurrenceError) throw occurrenceError;
      if (occurrence) {
        const { data: plan, error } = await valid.supabase.from("clinical_followup_plans")
          .select("id,plan_type").eq("id", occurrence.plan_id)
          .eq("patient_passport", passport)
          .in("plan_type", ["gestacional", "in_vitro"])
          .in("specialty", ["Obstetra", "Ginecologia"])
          .neq("status", "Arquivado").maybeSingle();
        if (error) throw error;
        if (plan && occurrence.individual_released_snapshot && typeof occurrence.individual_released_snapshot === "object") {
          snapshot = occurrence.individual_released_snapshot;
          planType = plan.plan_type;
        }
      }
    }
    if (!snapshot) return NextResponse.json({ error: "Documento não liberado." }, { status: 404 });
    const html = renderPrintablePlanningDocument(scope === "integral" ? "integral" : "individual", planType, snapshot);
    return new NextResponse(html, { headers: {
      "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; img-src 'self'; form-action 'none'; frame-ancestors 'none'",
      "Content-Disposition": "inline",
    } });
  } catch (error) {
    console.error("[patient-portal] dynamic obstetric document", error);
    return NextResponse.json({ error: "Não foi possível abrir o documento." }, { status: 500 });
  }
}
