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
      .select("user_id,patient_passport,email,access_enabled")
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
    const { data: patient } = passport
      ? await supabase.from("patient_registry").select("name").eq("passport",passport).maybeSingle()
      : {data:null};
    const {data:guardianAccount} = !patient && access.user_id ? await supabase.from("patient_accounts")
      .select("display_name").eq("user_id",access.user_id).maybeSingle() : {data:null};
    const [{ data: legacyRows, error: legacyError }, {data: directRows,error:directError}] = await Promise.all([
      passport ? supabase.rpc("patient_portal_accessible_patients", {target_passport:passport})
        : Promise.resolve({data:[],error:null}),
      access.user_id ? supabase.from("patient_guardian_links")
        .select("child_passport,relationship,access_status,portal_access,patient_registry!patient_guardian_links_child_passport_fkey(name)")
        .eq("guardian_user_id",access.user_id) : Promise.resolve({data:[],error:null}),
    ]);
    if(legacyError) throw legacyError;
    if(directError) throw directError;
    const accessibleList = [...((legacyRows || []) as any[])];
    const seen = new Set(accessibleList.map(row=>String(row.passport)));
    for(const link of (directRows || []) as any[]) {
      if(link.access_status !== "authorized" || !link.portal_access || seen.has(link.child_passport)) continue;
      accessibleList.push({passport:link.child_passport,name:link.patient_registry?.name || "Paciente infantil",
        relationship:link.relationship,access_type:"guardian"});
      seen.add(link.child_passport);
    }
    const pendingLegacy = passport ? await supabase.from("patient_guardian_links")
      .select("child_passport,relationship,patient_registry!patient_guardian_links_child_passport_fkey(name)")
      .eq("guardian_passport",passport).eq("access_status","pending").eq("portal_access",false)
      : {data:[],error:null};
    if (pendingLegacy.error) throw pendingLegacy.error;
    const pendingMap = new Map<string,any>();
    for(const link of [...(pendingLegacy.data || []),...(directRows || [])] as any[]) {
      if("access_status" in link && link.access_status !== "pending") continue;
      pendingMap.set(link.child_passport,{passport:link.child_passport,
        name:link.patient_registry?.name || "Paciente infantil",relationship:link.relationship,status:"pending"});
    }
    const pendingChildLinks = [...pendingMap.values()];
    const accessiblePassports = accessibleList.map((item) => String(item.passport || "")).filter(Boolean);
    const { data: patientContacts } = accessiblePassports.length
      ? await supabase.from("patient_registry").select("passport,city_phone,discord").in("passport", accessiblePassports)
      : { data: [] as any[] };
    const contactByPassport = new Map<string, { cityPhone: string; discord: string }>((patientContacts || []).map((item: any) => [String(item.passport || ""), { cityPhone: String(item.city_phone || "").trim(), discord: String(item.discord || "").trim() }]));
    const accessibleWithContact = accessibleList.map((item) => {
      const itemPassport = String(item.passport || "");
      const contact = contactByPassport.get(itemPassport) || { cityPhone: "", discord: "" };
      return { ...item, hasClinicalContact: Boolean(contact.discord || contact.cityPhone), discord: contact.discord, cityPhone: contact.cityPhone, preferredContact: contact.discord ? "discord" : contact.cityPhone ? "city_phone" : null };
    });
    const passportHint = passport.length > 4 ? `${passport.slice(0, 2)}•••${passport.slice(-2)}` : "••••";
    return NextResponse.json({ authenticated: true, accountId: access.user_id || passport, expiresAt: session.expires_at, passportHint, patientName: patient?.name || guardianAccount?.display_name || "Responsável", hasOwnProfile: Boolean(patient), accessiblePatients: accessibleWithContact, pendingChildLinks });
  } catch (error) {
    console.error("[patient-portal] session", error);
    return NextResponse.json({ authenticated: false });
  }
}
