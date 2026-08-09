import { brazilIso } from "@/lib/brazil-datetime";
import { NextRequest, NextResponse } from "next/server";
import { getValidPatientSession, normalizePassport } from "@/lib/patient-portal/server";

export const runtime = "nodejs";

function normalizeName(value: unknown) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

export async function POST(request: NextRequest) {
  try {
    const valid = await getValidPatientSession(request);
    if (!valid) return NextResponse.json({ ok: false, error: "Sessão expirada." }, { status: 401 });

    const body = await request.json();
    const name = normalizeName(body.name);
    const passport = normalizePassport(body.passport);
    const age = String(body.age || "").replace(/\D/g, "").trim();
    const birthDate = String(body.birthDate || "").trim() || null;
    const bloodType = String(body.bloodType || "").trim();
    const relationship = normalizeName(body.relationship || "Responsável legal");
    const guardianPassport = normalizePassport(valid.access.patient_passport);
    const numericAge = Number.parseInt(age, 10);

    if (!name || !passport || !age) {
      return NextResponse.json({ ok: false, error: "Informe nome, passaporte e idade da criança." }, { status: 400 });
    }
    if (!Number.isFinite(numericAge) || numericAge < 0 || numericAge >= 18) {
      return NextResponse.json({ ok: false, error: "Este fluxo é exclusivo para pacientes menores de 18 anos." }, { status: 400 });
    }
    if (passport === guardianPassport) {
      return NextResponse.json({ ok: false, error: "A criança não pode usar o mesmo passaporte do responsável." }, { status: 400 });
    }

    const { data: existing, error: lookupError } = await valid.supabase
      .from("patient_registry")
      .select("passport,name,age,birth_date,blood_type")
      .eq("passport", passport)
      .maybeSingle();
    if (lookupError) throw lookupError;

    const normalizedExistingName = normalizeName(existing?.name).toLocaleLowerCase("pt-BR");
    const exactMatch = Boolean(existing && normalizedExistingName === name.toLocaleLowerCase("pt-BR"));
    if (existing && !exactMatch) {
      return NextResponse.json({
        ok: false,
        error: `O passaporte ${passport} já está vinculado a outro nome no Prontuário. Solicite a correção diretamente à equipe médica.`,
      }, { status: 409 });
    }

    const now = brazilIso();
    if (!existing) {
      const { error: patientError } = await valid.supabase.from("patient_registry").insert({
        passport,
        name,
        age,
        birth_date: birthDate,
        blood_type: bloodType,
        created_at: now,
        updated_at: now,
      });
      if (patientError) throw patientError;
    }

    const { data: currentLink, error: currentLinkError } = await valid.supabase
      .from("patient_guardian_links")
      .select("id,access_status")
      .eq("child_passport", passport)
      .eq("guardian_passport", guardianPassport)
      .maybeSingle();
    if (currentLinkError) throw currentLinkError;

    if (currentLink?.access_status === "authorized") {
      return NextResponse.json({
        ok: true,
        patient: { passport, name, relationship, access_type: "guardian" },
        message: "Este vínculo já está confirmado e disponível no portal.",
      });
    }

    const linkPayload = {
      child_passport: passport,
      guardian_passport: guardianPassport,
      relationship,
      access_status: "pending",
      portal_access: false,
      updated_at: now,
    };

    const { error: linkError } = currentLink
      ? await valid.supabase.from("patient_guardian_links").update(linkPayload).eq("id", currentLink.id)
      : await valid.supabase.from("patient_guardian_links").insert({ ...linkPayload, created_at: now });
    if (linkError) throw linkError;

    return NextResponse.json({
      ok: true,
      patient: { passport, name, relationship, access_type: "pending_guardian" },
      matchedExistingRecord: exactMatch,
      message: exactMatch
        ? "Prontuário localizado. O vínculo aguarda uma confirmação médica simples."
        : "Prontuário infantil preparado. O vínculo e os dados aguardam validação médica.",
    });
  } catch (error) {
    console.error("[patient-portal] request dependent link", error);
    return NextResponse.json({ ok: false, error: "Não foi possível enviar a solicitação pediátrica." }, { status: 500 });
  }
}
