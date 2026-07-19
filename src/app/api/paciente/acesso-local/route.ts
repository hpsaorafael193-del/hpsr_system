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
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, error: "O acesso local está disponível somente no ambiente de desenvolvimento." }, { status: 404 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const passport = normalizePassport(body.passport);
    if (!passport) {
      return NextResponse.json({ ok: false, error: "Informe o passaporte do paciente." }, { status: 400 });
    }

    const supabase = getServiceClient();
    const { data: access, error: accessError } = await supabase
      .from("patient_portal_access")
      .select("id,access_enabled")
      .eq("patient_passport", passport)
      .maybeSingle();

    if (accessError) throw accessError;
    if (!access) {
      return NextResponse.json({
        ok: false,
        error: "Este passaporte ainda não possui acesso ao Portal do Paciente. Libere o portal no cadastro do paciente antes de testar.",
      }, { status: 404 });
    }
    if (!access.access_enabled) {
      return NextResponse.json({ ok: false, error: "O acesso deste paciente ao portal está desativado." }, { status: 403 });
    }

    const token = generateSessionToken();
    const fingerprint = requestFingerprint(request);
    const sessionExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    const { error: sessionError } = await supabase.from("patient_portal_sessions").insert({
      portal_access_id: access.id,
      token_hash: hashPatientSecret(token),
      expires_at: sessionExpiresAt,
      request_ip_hash: fingerprint.ipHash,
      user_agent: `${fingerprint.userAgent} [LOCAL DEV ACCESS]`.slice(0, 500),
    });
    if (sessionError) throw sessionError;

    const response = NextResponse.json({ ok: true, expiresAt: sessionExpiresAt });
    response.cookies.set(getPatientSessionCookieName(), token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 2 * 60 * 60,
    });
    return response;
  } catch (error) {
    console.error("[patient-portal] local-access", error);
    return NextResponse.json({ ok: false, error: "Não foi possível iniciar o acesso local ao portal." }, { status: 500 });
  }
}
