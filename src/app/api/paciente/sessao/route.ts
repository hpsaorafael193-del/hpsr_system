import { brazilIso } from "@/lib/brazil-datetime";
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
      .select("patient_passport,email,access_enabled")
      .eq("id", session.portal_access_id)
      .maybeSingle();
    if (!access?.access_enabled) {
      const response = NextResponse.json({ authenticated: false });
      response.cookies.set(getPatientSessionCookieName(), "", { path: "/", maxAge: 0 });
      return response;
    }
    const lastSeenAt = session.last_seen_at ? new Date(session.last_seen_at).getTime() : 0;
    if (!lastSeenAt || Date.now() - lastSeenAt >= 10 * 60 * 1000) {
      await supabase.from("patient_portal_sessions").update({ last_seen_at: brazilIso() }).eq("id", session.id);
    }
    const passport = String(access.patient_passport || "");
    const { data: patient } = await supabase.from("patient_registry").select("name").eq("passport", passport).maybeSingle();
    const [{ data: accessiblePatients }, { data: pendingLinks }] = await Promise.all([
      supabase.rpc("patient_portal_accessible_patients", { target_passport: passport }),
      supabase
        .from("patient_guardian_links")
        .select("child_passport,relationship,access_status,patient_registry!patient_guardian_links_child_passport_fkey(name)")
        .eq("guardian_passport", passport)
        .eq("access_status", "pending")
        .eq("portal_access", false),
    ]);
    const pendingChildLinks = (pendingLinks || []).map((link: any) => ({
      passport: String(link.child_passport || ""),
      name: String(link.patient_registry?.name || "Paciente infantil"),
      relationship: String(link.relationship || "Responsável legal"),
      status: "pending",
    }));
    const accessibleList = (accessiblePatients || []) as any[];
    const accessiblePassports = accessibleList.map((item) => String(item.passport || "")).filter(Boolean);
    const { data: patientContacts } = accessiblePassports.length
      ? await supabase.from("patient_registry").select("passport,email").in("passport", accessiblePassports)
      : { data: [] as any[] };
    const emailByPassport = new Map((patientContacts || []).map((item: any) => [String(item.passport || ""), String(item.email || "").trim()]));
    const accessibleWithContact = accessibleList.map((item) => {
      const itemPassport = String(item.passport || "");
      const registryEmail = emailByPassport.get(itemPassport) || "";
      const accountEmail = itemPassport === passport ? String(access.email || "").trim() : "";
      return { ...item, hasEmail: Boolean(registryEmail || accountEmail) };
    });
    const passportHint = passport.length > 4 ? `${passport.slice(0, 2)}•••${passport.slice(-2)}` : "••••";
    return NextResponse.json({ authenticated: true, expiresAt: session.expires_at, passportHint, patientName: patient?.name || "Paciente", accessiblePatients: accessibleWithContact, pendingChildLinks });
  } catch (error) {
    console.error("[patient-portal] session", error);
    return NextResponse.json({ authenticated: false });
  }
}
