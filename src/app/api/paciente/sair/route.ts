import { NextRequest, NextResponse } from "next/server";
import { getPatientSessionCookieName, getServiceClient, hashPatientSecret } from "@/lib/patient-portal/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(getPatientSessionCookieName())?.value;
  if (token) {
    try {
      const supabase = getServiceClient();
      await supabase.from("patient_portal_sessions").update({ revoked_at: new Date().toISOString() }).eq("token_hash", hashPatientSecret(token));
    } catch (error) {
      console.error("[patient-portal] logout", error);
    }
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(getPatientSessionCookieName(), "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
