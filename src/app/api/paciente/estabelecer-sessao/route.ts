import { NextRequest, NextResponse } from "next/server";
import { generateSessionToken, getPatientSessionCookieName, getServiceClient, hashPatientSecret, requestFingerprint } from "@/lib/patient-portal/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization") || "";
    const accessToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (!accessToken) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });

    const supabase = getServiceClient();
    const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !authData.user) return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });

    const { data: account } = await supabase
      .from("patient_accounts")
      .select("user_id,patient_passport,email")
      .eq("user_id", authData.user.id)
      .maybeSingle();
    if (!account) return NextResponse.json({ error: "Esta conta não está vinculada a um paciente." }, { status: 403 });

    let { data: portalAccess } = await supabase
      .from("patient_portal_access")
      .select("id,access_enabled")
      .eq("patient_passport", account.patient_passport)
      .maybeSingle();
    if (!portalAccess) {
      const inserted = await supabase.from("patient_portal_access").insert({
        patient_passport: account.patient_passport,
        email: account.email,
        access_enabled: true,
      }).select("id,access_enabled").single();
      if (inserted.error) throw inserted.error;
      portalAccess = inserted.data;
    }
    if (!portalAccess.access_enabled) return NextResponse.json({ error: "O acesso deste paciente está desativado." }, { status: 403 });

    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const fingerprint = requestFingerprint(request);
    const { error: sessionError } = await supabase.from("patient_portal_sessions").insert({
      portal_access_id: portalAccess.id,
      token_hash: hashPatientSecret(token),
      expires_at: expiresAt.toISOString(),
      request_ip_hash: fingerprint.ipHash,
      user_agent: fingerprint.userAgent,
    });
    if (sessionError) throw sessionError;

    await supabase.from("patient_accounts").update({ last_login_at: new Date().toISOString() }).eq("user_id", authData.user.id);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(getPatientSessionCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });
    return response;
  } catch (error) {
    console.error("[patient-portal] establish session", error);
    return NextResponse.json({ error: "Não foi possível abrir a área do paciente." }, { status: 500 });
  }
}
