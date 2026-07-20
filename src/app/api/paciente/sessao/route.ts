import { NextRequest, NextResponse } from "next/server";
import { getPatientSessionCookieName, getServiceClient, hashPatientSecret } from "@/lib/patient-portal/server";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(getPatientSessionCookieName())?.value;
    if (!token) return NextResponse.json({ authenticated: false });
    const supabase = getServiceClient();
    const { data: session } = await supabase
      .from("patient_portal_sessions")
      .select("id,expires_at,revoked_at,portal_access_id,last_seen_at")
      .eq("token_hash", hashPatientSecret(token))
      .maybeSingle();
    if (!session || session.revoked_at || new Date(session.expires_at).getTime() <= Date.now()) {
      const response = NextResponse.json({ authenticated: false });
      response.cookies.set(getPatientSessionCookieName(), "", { path: "/", maxAge: 0 });
      return response;
    }
    const { data: access } = await supabase
      .from("patient_portal_access")
      .select("patient_passport,access_enabled")
      .eq("id", session.portal_access_id)
      .maybeSingle();
    if (!access?.access_enabled) {
      const response = NextResponse.json({ authenticated: false });
      response.cookies.set(getPatientSessionCookieName(), "", { path: "/", maxAge: 0 });
      return response;
    }
    const lastSeenAt = session.last_seen_at ? new Date(session.last_seen_at).getTime() : 0;
    if (!lastSeenAt || Date.now() - lastSeenAt >= 10 * 60 * 1000) {
      await supabase.from("patient_portal_sessions").update({ last_seen_at: new Date().toISOString() }).eq("id", session.id);
    }
    const passport = String(access.patient_passport || "");
    const passportHint = passport.length > 4 ? `${passport.slice(0, 2)}•••${passport.slice(-2)}` : "••••";
    return NextResponse.json({ authenticated: true, expiresAt: session.expires_at, passportHint });
  } catch (error) {
    console.error("[patient-portal] session", error);
    return NextResponse.json({ authenticated: false });
  }
}
