import "server-only";
import { createHash, randomBytes, randomInt } from "crypto";
import { createClient } from "@supabase/supabase-js";

const SESSION_COOKIE = "hpsr_patient_session";

export function getPatientSessionCookieName() {
  return SESSION_COOKIE;
}

export function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Supabase server credentials are not configured.");
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getPepper() {
  const pepper = process.env.PATIENT_PORTAL_CODE_SECRET;
  if (!pepper) throw new Error("PATIENT_PORTAL_CODE_SECRET is not configured.");
  return pepper;
}

export function normalizePassport(value: unknown) {
  return String(value ?? "").trim().replace(/\s+/g, "").toUpperCase();
}

export function hashPatientSecret(value: string) {
  return createHash("sha256").update(`${getPepper()}:${value}`).digest("hex");
}

export function generateAccessCode() {
  return String(randomInt(100000, 1000000));
}

export function generateSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function requestFingerprint(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const agent = request.headers.get("user-agent") || "unknown";
  return {
    ipHash: hashPatientSecret(`ip:${forwarded}`),
    userAgent: agent.slice(0, 500),
  };
}

export async function sendPatientCode(email: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "Hospital São Rafael <no-reply@hpn-saorafael.com.br>";
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Código de acesso — Hospital São Rafael",
      html: `
        <div style="font-family:Arial,sans-serif;background:#fffaf4;padding:28px;color:#32150f">
          <div style="max-width:560px;margin:auto;background:#fff;border:1px solid #ead7c7;border-radius:18px;padding:28px">
            <h1 style="font-size:22px;margin:0 0 14px;color:#6f2b17">Portal do Paciente</h1>
            <p style="line-height:1.6">Use o código abaixo para acessar sua área temporária:</p>
            <div style="font-size:34px;font-weight:800;letter-spacing:8px;text-align:center;background:#f8eee4;border-radius:14px;padding:18px;margin:20px 0">${code}</div>
            <p style="line-height:1.6"><strong>Validade:</strong> 15 minutos. O código pode ser usado apenas uma vez.</p>
            <p style="font-size:12px;color:#7a6258;line-height:1.5">Ambiente fictício de roleplay. As informações exibidas não possuem validade médica real.</p>
          </div>
        </div>`,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend error ${response.status}: ${detail.slice(0, 500)}`);
  }
}

export async function getValidPatientSession(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookieName = getPatientSessionCookieName();
  const token = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`))
    ?.slice(cookieName.length + 1);
  if (!token) return null;

  const supabase = getServiceClient();
  const { data: session } = await supabase
    .from("patient_portal_sessions")
    .select("id,expires_at,revoked_at,portal_access_id")
    .eq("token_hash", hashPatientSecret(decodeURIComponent(token)))
    .maybeSingle();
  if (!session || session.revoked_at || new Date(session.expires_at).getTime() <= Date.now()) return null;

  const { data: access } = await supabase
    .from("patient_portal_access")
    .select("id,patient_passport,email,access_enabled")
    .eq("id", session.portal_access_id)
    .maybeSingle();
  if (!access?.access_enabled) return null;

  await supabase.from("patient_portal_sessions").update({ last_seen_at: new Date().toISOString() }).eq("id", session.id);
  return { supabase, session, access };
}
