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

const GENERIC_MESSAGE = "Se o passaporte estiver habilitado, um código será enviado ao e-mail cadastrado.";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const passport = normalizePassport(body.passport);
    if (passport.length < 2 || passport.length > 80) {
      return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
    }

    const supabase = getServiceClient();
    const { data: access } = await supabase
      .from("patient_portal_access")
      .select("id,email,access_enabled")
      .eq("patient_passport", passport)
      .maybeSingle();

    if (!access?.access_enabled || !access.email) {
      return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
    }

    const { data: lastCode } = await supabase
      .from("patient_access_codes")
      .select("resend_available_at")
      .eq("portal_access_id", access.id)
      .order("sent_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastCode?.resend_available_at && new Date(lastCode.resend_available_at).getTime() > Date.now()) {
      const wait = Math.max(1, Math.ceil((new Date(lastCode.resend_available_at).getTime() - Date.now()) / 1000));
      return NextResponse.json({ ok: false, error: `Aguarde ${wait} segundos antes de reenviar o código.` }, { status: 429 });
    }

    await supabase.rpc("invalidate_patient_access_codes", { target_portal_access_id: access.id });

    const code = generateAccessCode();
    const fingerprint = requestFingerprint(request);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const resendAt = new Date(Date.now() + 60 * 1000).toISOString();

    const { error: insertError } = await supabase.from("patient_access_codes").insert({
      portal_access_id: access.id,
      code_hash: hashPatientSecret(code),
      expires_at: expiresAt,
      resend_available_at: resendAt,
      request_ip_hash: fingerprint.ipHash,
      user_agent: fingerprint.userAgent,
    });
    if (insertError) throw insertError;

    await sendPatientCode(access.email, code);
    return NextResponse.json({ ok: true, message: GENERIC_MESSAGE, expiresInSeconds: 900, resendInSeconds: 60 });
  } catch (error) {
    console.error("[patient-portal] request-code", error);
    return NextResponse.json({ ok: false, error: "Não foi possível enviar o código agora. Tente novamente em instantes." }, { status: 500 });
  }
}
