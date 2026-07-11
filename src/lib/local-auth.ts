export const LOCAL_AUTH_SESSION_KEY = "hpsr-local-auth-session";
export const STAFF_REGISTRATION_REQUESTS_KEY = "hpsr-staff-registration-requests";

export type LocalAuthSession = {
  approved: true;
  role: string;
  systemRole: string;
  email: string;
  createdAt: string;
};

export function readLocalAuthSession(): LocalAuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(localStorage.getItem(LOCAL_AUTH_SESSION_KEY) || "null") as LocalAuthSession | null;
    return value?.approved ? value : null;
  } catch {
    return null;
  }
}
