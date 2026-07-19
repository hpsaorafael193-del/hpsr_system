import { NextRequest, NextResponse } from "next/server";
import {
  generateAccessCode,
  getServiceClient,
  hashPatientSecret,
  normalizePassport,
  requestFingerprint,
  sendPatientCode,
} from "@/lib/patient-portal/server";

export const runtime = "nodejs";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type JsonRecord = Record<string, unknown>;

type PatientMatch = {
  exists: boolean;
  email: string;
};

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as JsonRecord
    : {};
}

function normalizeEmail(value: unknown) {
  const email = String(value ?? "").trim().toLowerCase();
  return EMAIL_PATTERN.test(email) && email.length <= 254 ? email : "";
}

function findEmailInPayload(value: unknown) {
  const payload = asRecord(value);
  const patient = asRecord(payload.patient);
  const contact = asRecord(payload.contact);
  const candidates = [
    payload.email,
    payload.patientEmail,
    payload.patient_email,
    payload.contactEmail,
    patient.email,
    patient.patientEmail,
    contact.email,
  ];

  for (const candidate of candidates) {
    const email = normalizeEmail(candidate);
    if (email) return email;
  }
  return "";
}


function findPassportInPayload(value: unknown) {
  const payload = asRecord(value);
  const patient = asRecord(payload.patient);
  const candidates = [
    payload.passport,
    payload.patientPassport,
    payload.patient_passport,
    payload.document,
    payload.documentNumber,
    patient.passport,
    patient.patientPassport,
    patient.patient_passport,
    patient.document,
  ];

  for (const candidate of candidates) {
    const passport = normalizePassport(candidate);
    if (passport) return passport;
  }
  return "";
}

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "e-mail cadastrado";
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"*".repeat(Math.max(3, local.length - visible.length))}@${domain}`;
}

async function findPatient(
  supabase: ReturnType<typeof getServiceClient>,
  normalizedPassport: string,
): Promise<PatientMatch> {
  const { data: registeredPatient, error: registryError } = await supabase
    .from("patient_registry")
    .select("passport,email")
    .eq("passport", normalizedPassport)
    .maybeSingle();

  if (registryError) throw registryError;
  if (registeredPatient) {
    return { exists: true, email: normalizeEmail(registeredPatient.email) };
  }

  // O cadastro institucional é a fonte de verdade. Evita varrer prontuários e consultas inteiros.
  return { exists: false, email: "" };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const passport = normalizePassport(body.passport);
    const suppliedEmail = normalizeEmail(body.email);

    if (passport.length < 2 || passport.length > 80) {
      return NextResponse.json(
        { ok: false, error: "Informe um passaporte válido." },
        { status: 400 },
      );
    }

    const supabase = getServiceClient();
    const { data: access, error: accessLookupError } = await supabase
      .from("patient_portal_access")
      .select("id,patient_passport,email,access_enabled")
      .eq("patient_passport", passport)
      .maybeSingle();
    if (accessLookupError) throw accessLookupError;

    let portalAccess = access;

    if (portalAccess && !portalAccess.access_enabled) {
      return NextResponse.json(
        { ok: false, error: "O acesso deste paciente ao portal está desativado." },
        { status: 403 },
      );
    }

    if (!portalAccess) {
      const patient = await findPatient(supabase, passport);
      if (!patient.exists) {
        return NextResponse.json(
          { ok: false, error: "Nenhum paciente foi localizado com esse passaporte." },
          { status: 404 },
        );
      }

      const registeredEmail = patient.email;
      const emailToRegister = registeredEmail || suppliedEmail;

      if (!emailToRegister) {
        return NextResponse.json({
          ok: true,
          needsEmail: true,
          message: "O paciente foi localizado, mas não possui e-mail registrado. Informe um e-mail para receber o código de acesso.",
        });
      }

      if (body.email && !suppliedEmail) {
        return NextResponse.json(
          { ok: false, error: "Informe um e-mail válido." },
          { status: 400 },
        );
      }

      const { data: createdAccess, error: accessError } = await supabase
        .from("patient_portal_access")
        .upsert({
          patient_passport: passport,
          email: emailToRegister,
          access_enabled: true,
        }, { onConflict: "patient_passport" })
        .select("id,patient_passport,email,access_enabled")
        .single();
      if (accessError) throw accessError;
      portalAccess = createdAccess;
      await supabase.from("patient_registry").update({ email: emailToRegister }).eq("passport", passport);
    }

    const accessEmail = normalizeEmail(portalAccess.email);
    if (!accessEmail) {
      if (!suppliedEmail) {
        return NextResponse.json({
          ok: true,
          needsEmail: true,
          message: "O paciente foi localizado, mas não possui e-mail válido registrado. Informe um e-mail para receber o código de acesso.",
        });
      }

      const { data: updatedAccess, error: updateError } = await supabase
        .from("patient_portal_access")
        .update({ email: suppliedEmail })
        .eq("id", portalAccess.id)
        .select("id,patient_passport,email,access_enabled")
        .single();
      if (updateError) throw updateError;
      portalAccess = updatedAccess;
      await supabase.from("patient_registry").update({ email: suppliedEmail }).eq("passport", passport);
    }

    const email = normalizeEmail(portalAccess.email);
    if (!email) {
      return NextResponse.json(
        { ok: false, error: "O e-mail registrado para este paciente é inválido." },
        { status: 400 },
      );
    }

    const { data: lastCode, error: lastCodeError } = await supabase
      .from("patient_access_codes")
      .select("resend_available_at")
      .eq("portal_access_id", portalAccess.id)
      .order("sent_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lastCodeError) throw lastCodeError;

    if (lastCode?.resend_available_at && new Date(lastCode.resend_available_at).getTime() > Date.now()) {
      const wait = Math.max(1, Math.ceil((new Date(lastCode.resend_available_at).getTime() - Date.now()) / 1000));
      return NextResponse.json(
        { ok: false, error: `Aguarde ${wait} segundos antes de reenviar o código.` },
        { status: 429 },
      );
    }

    const { error: invalidateError } = await supabase.rpc("invalidate_patient_access_codes", {
      target_portal_access_id: portalAccess.id,
    });
    if (invalidateError) throw invalidateError;

    const code = generateAccessCode();
    const fingerprint = requestFingerprint(request);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const resendAt = new Date(Date.now() + 60 * 1000).toISOString();

    const { data: createdCode, error: insertError } = await supabase
      .from("patient_access_codes")
      .insert({
        portal_access_id: portalAccess.id,
        code_hash: hashPatientSecret(code),
        expires_at: expiresAt,
        resend_available_at: resendAt,
        request_ip_hash: fingerprint.ipHash,
        user_agent: fingerprint.userAgent,
      })
      .select("id")
      .single();
    if (insertError) throw insertError;

    try {
      await sendPatientCode(email, code);
    } catch (sendError) {
      await supabase.from("patient_access_codes").delete().eq("id", createdCode.id);
      throw sendError;
    }

    return NextResponse.json({
      ok: true,
      message: `Código enviado para ${maskEmail(email)}. Verifique também a caixa de spam.`,
      expiresInSeconds: 900,
      resendInSeconds: 60,
    });
  } catch (error) {
    console.error("[patient-portal] request-code", error);
    const detail = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      {
        ok: false,
        error: "Não foi possível enviar o código agora. Confira o serviço de e-mail e tente novamente.",
        ...(process.env.NODE_ENV === "development" ? { detail } : {}),
      },
      { status: 500 },
    );
  }
}
