import { NextRequest, NextResponse } from "next/server";
import { brazilIso } from "@/lib/brazil-datetime";
import { getValidPatientSession, resolvePortalPatientPassport } from "@/lib/patient-portal/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const valid = await getValidPatientSession(request);
    if (!valid) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
    const passport = await resolvePortalPatientPassport(request, valid);
    if (!passport) return NextResponse.json({ error: "Perfil não autorizado." }, { status: 403 });
    const { data, error } = await valid.supabase.from("followup_intake_forms")
      .select("id,patient_passport,doctor_name,specialty,form_type,status,answers,requested_at,updated_at,submitted_at,reviewed_at,request_note")
      .eq("patient_passport", passport).neq("status", "cancelled").order("requested_at", { ascending: false }).limit(30);
    if (error) throw error;
    return NextResponse.json({ ok: true, forms: data || [] }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[patient-portal] followup forms", error);
    return NextResponse.json({ error: "Não foi possível carregar as fichas." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const valid = await getValidPatientSession(request);
    if (!valid) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
    const body = await request.json();
    const passport = await resolvePortalPatientPassport(request, valid);
    if (!passport) return NextResponse.json({ error: "Perfil não autorizado." }, { status: 403 });
    const id = String(body.id || "");
    const submit = Boolean(body.submit);
    const answers = body.answers && typeof body.answers === "object" ? body.answers : {};
    const { data: current, error: readError } = await valid.supabase.from("followup_intake_forms")
      .select("id,status,patient_passport").eq("id", id).eq("patient_passport", passport).maybeSingle();
    if (readError) throw readError;
    if (!current || !["requested", "draft"].includes(current.status)) return NextResponse.json({ error: "Esta ficha não está disponível para edição." }, { status: 409 });
    const now = brazilIso();
    const { data, error } = await valid.supabase.from("followup_intake_forms").update({
      answers,
      status: submit ? "submitted" : "draft",
      updated_at: now,
      submitted_at: submit ? now : null,
    }).eq("id", id).select("id,status,updated_at,submitted_at").single();
    if (error) throw error;
    return NextResponse.json({ ok: true, form: data });
  } catch (error) {
    console.error("[patient-portal] save followup form", error);
    return NextResponse.json({ error: "Não foi possível salvar a ficha." }, { status: 500 });
  }
}
