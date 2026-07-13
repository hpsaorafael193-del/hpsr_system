import { NextRequest, NextResponse } from "next/server";
import {
  generateSessionToken,
  getPatientSessionCookieName,
  getServiceClient,
  hashPatientSecret,
  normalizePassport,
  requestFingerprint,
} from "@/lib/patient-portal/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const passport = normalizePassport(body.passport);
    const code = String(body.code ?? "").replace(/\D/g, "");
    if (!passport || code.length !== 6) {
      return NextResponse.json({ ok: false, error: "Confira o passaporte e o código de seis dígitos." }, { status: 400 });
    }

    const supabase = getServiceClient();
    const { data: access } = await supabase
      .from("patient_portal_access")
      .select("id,access_enabled")
      .eq("patient_passport", passport)
      .maybeSingle();
    if (!access?.access_enabled) {
      return NextResponse.json({ ok: false, error: "Código inválido ou expirado." }, { status: 401 });
    }

    const { data: candidate } = await supabase
      .from("patient_access_codes")
      .select("id,code_hash,expires_at,attempt_count,max_attempts,used_at,invalidated_at")
      .eq("portal_access_id", access.id)
      .is("used_at", null)
      .is("invalidated_at", null)
      .order("sent_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!candidate || new Date(candidate.expires_at).getTime() <= Date.now() || candidate.attempt_count >= candidate.max_attempts) {
      return NextResponse.json({ ok: false, error: "Código inválido ou expirado." }, { status: 401 });
    }

    if (candidate.code_hash !== hashPatientSecret(code)) {
      const nextAttempts = candidate.attempt_count + 1;
      await supabase.from("patient_access_codes").update({
        attempt_count: nextAttempts,
        invalidated_at: nextAttempts >= candidate.max_attempts ? new Date().toISOString() : null,
      }).eq("id", candidate.id);
      return NextResponse.json({ ok: false, error: "Código inválido ou expirado." }, { status: 401 });
    }

    const token = generateSessionToken();
    const fingerprint = requestFingerprint(request);
    const sessionExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    const { error: sessionError } = await supabase.from("patient_portal_sessions").insert({
      portal_access_id: access.id,
      token_hash: hashPatientSecret(token),
      expires_at: sessionExpiresAt,
      request_ip_hash: fingerprint.ipHash,
      user_agent: fingerprint.userAgent,
    });
    if (sessionError) throw sessionError;

    await supabase.from("patient_access_codes").update({ used_at: new Date().toISOString() }).eq("id", candidate.id);

    const response = NextResponse.json({ ok: true });
    response.cookies.set(getPatientSessionCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 2 * 60 * 60,
    });
    return response;
  } catch (error) {
    console.error("[patient-portal] verify-code", error);
    return NextResponse.json({ ok: false, error: "Não foi possível validar o código agora." }, { status: 500 });
  }
}
