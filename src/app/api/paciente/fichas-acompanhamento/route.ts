import { NextRequest, NextResponse } from "next/server";
import { brazilIso } from "@/lib/brazil-datetime";
import { getValidPatientSession, normalizePassport, pediatricIntakeGuardianPassports, resolvePortalPatientPassport } from "@/lib/patient-portal/server";

import { sanitizePediatricIntakeAnswers } from "@/lib/pediatric-intake-form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const valid = await getValidPatientSession(request);
    if (!valid) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
    const passport = await resolvePortalPatientPassport(request, valid);
    if (!passport) return NextResponse.json({ error: "Perfil não autorizado." }, { status: 403 });
    const isGuardian = passport !== normalizePassport(valid.access.patient_passport)
      && (await pediatricIntakeGuardianPassports(valid)).has(passport);
    let query = valid.supabase.from("followup_intake_forms")
      .select("id,patient_passport,doctor_name,specialty,form_type,status,answers,requested_at,updated_at,submitted_at,reviewed_at,request_note")
      .eq("patient_passport", passport).neq("status", "cancelled");
    if (!isGuardian) query = query.neq("form_type", "pediatric");
    const { data, error } = await query.order("requested_at", { ascending: false }).limit(30);
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
    const submit = body.submit === true;
    let answers = body.answers && typeof body.answers === "object" ? body.answers : {};
    const { data: current, error: readError } = await valid.supabase.from("followup_intake_forms")
      .select("id,status,patient_passport,form_type,updated_at").eq("id", id).eq("patient_passport", passport).maybeSingle();
    if (readError) throw readError;
    if (!current || !["requested", "draft"].includes(current.status)) return NextResponse.json({ error: "Esta ficha não está disponível para edição." }, { status: 409 });
    if (current.form_type === "pediatric") {
      const guardians = await pediatricIntakeGuardianPassports(valid);
      if (!guardians.has(passport)) return NextResponse.json({ error: "Esta ficha só pode ser preenchida por um responsável autorizado." }, { status: 403 });
      answers = sanitizePediatricIntakeAnswers(answers, passport);
      if (submit && answers.commitment !== "Estou de acordo") {
        return NextResponse.json({ error: "Confirme o compromisso com o RP antes de enviar a ficha." }, { status: 400 });
      }
    }
    const now = brazilIso();
    const { data, error } = await valid.supabase.from("followup_intake_forms").update({
      answers,
      status: submit ? "submitted" : "draft",
      updated_at: now,
      submitted_at: submit ? now : null,
    }).eq("id", id).eq("patient_passport", passport).eq("form_type", current.form_type)
      .eq("status", current.status).eq("updated_at", current.updated_at).select("id,status,updated_at,submitted_at").maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "A ficha foi atualizada. Reabra-a para conferir a versão atual." }, { status: 409 });
    return NextResponse.json({ ok: true, form: data });
  } catch (error) {
    console.error("[patient-portal] save followup form", error);
    return NextResponse.json({ error: "Não foi possível salvar a ficha." }, { status: 500 });
  }
}
