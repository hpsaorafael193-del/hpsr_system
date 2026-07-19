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

  // Compatibilidade para registros anteriores à criação do cadastro institucional.
  const [{ data: records, error: recordsError }, { data: appointments, error: appointmentsError }] = await Promise.all([
    supabase.from("clinical_records").select("patient_passport,payload"),
    supabase.from("appointments").select("passport,patient,payload"),
  ]);
  if (recordsError) throw recordsError;
  if (appointmentsError) throw appointmentsError;

  for (const row of records || []) {
    const storedPassport = normalizePassport(row.patient_passport) || findPassportInPayload(row.payload);
    if (storedPassport !== normalizedPassport) continue;
    const payload = asRecord(row.payload);
    const patient = asRecord(payload.patient);
    const email = findEmailInPayload(row.payload);
    await supabase.from("patient_registry").upsert({
      passport: normalizedPassport,
      name: String(patient.name || payload.patientName || `Paciente ${normalizedPassport}`),
      age: String(patient.age || payload.age || "") || null,
      blood_type: String(patient.bloodType || payload.bloodType || "") || null,
      city_phone: String(patient.cityPhone || payload.cityPhone || "") || null,
      email: email || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "passport" });
    return { exists: true, email };
  }

  for (const row of appointments || []) {
    const storedPassport = normalizePassport(row.passport) || findPassportInPayload(row.payload);
    if (storedPassport !== normalizedPassport) continue;
    const payload = asRecord(row.payload);
    const patient = asRecord(payload.patient);
    const email = findEmailInPayload(row.payload);
    await supabase.from("patient_registry").upsert({
      passport: normalizedPassport,
      name: String(row.patient || patient.name || payload.patientName || `Paciente ${normalizedPassport}`),
      email: email || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "passport" });
    return { exists: true, email };
  }

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
    const { data: accessRows, error: accessLookupError } = await supabase
      .from("patient_portal_access")
      .select("id,patient_passport,email,access_enabled");
    if (accessLookupError) throw accessLookupError;

    let access = (accessRows || []).find(
      (row) => normalizePassport(row.patient_passport) === passport,
    ) || null;

    if (access && !access.access_enabled) {
      return NextResponse.json(
        { ok: false, error: "O acesso deste paciente ao portal está desativado." },
        { status: 403 },
      );
    }

    if (!access) {
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
      access = createdAccess;
      await supabase.from("patient_registry").update({ email: emailToRegister }).eq("passport", passport);
    }

    const accessEmail = normalizeEmail(access.email);
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
        .eq("id", access.id)
        .select("id,patient_passport,email,access_enabled")
        .single();
      if (updateError) throw updateError;
      access = updatedAccess;
      await supabase.from("patient_registry").update({ email: suppliedEmail }).eq("passport", passport);
    }

    const email = normalizeEmail(access.email);
    if (!email) {
      return NextResponse.json(
        { ok: false, error: "O e-mail registrado para este paciente é inválido." },
        { status: 400 },
      );
    }

    const { data: lastCode, error: lastCodeError } = await supabase
      .from("patient_access_codes")
      .select("resend_available_at")
      .eq("portal_access_id", access.id)
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
      target_portal_access_id: access.id,
    });
    if (invalidateError) throw invalidateError;

    const code = generateAccessCode();
    const fingerprint = requestFingerprint(request);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const resendAt = new Date(Date.now() + 60 * 1000).toISOString();

    const { data: createdCode, error: insertError } = await supabase
      .from("patient_access_codes")
      .insert({
        portal_access_id: access.id,
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
