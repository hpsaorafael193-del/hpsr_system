export const REMEMBER_LOGIN_KEY = "hpsr-remember-login";
export const SESSION_LOGIN_KEY = "hpsr-session-login";
export const AUTH_CONTEXT_KEY = "hpsr-auth-context";

export type AuthContext = "professional" | "patient";

export function setLoginPersistence(remember: boolean) {
  if (remember) {
    localStorage.setItem(REMEMBER_LOGIN_KEY, "true");
    sessionStorage.removeItem(SESSION_LOGIN_KEY);
  } else {
    localStorage.setItem(REMEMBER_LOGIN_KEY, "false");
    sessionStorage.setItem(SESSION_LOGIN_KEY, "true");
  }
}

export function hasValidLoginPersistence() {
  const preference = localStorage.getItem(REMEMBER_LOGIN_KEY);
  if (preference !== "false") return true;
  return sessionStorage.getItem(SESSION_LOGIN_KEY) === "true";
}

export function setAuthContext(context: AuthContext) {
  sessionStorage.setItem(AUTH_CONTEXT_KEY, context);
}

export function getAuthContext(): AuthContext | null {
  const value = sessionStorage.getItem(AUTH_CONTEXT_KEY);
  return value === "professional" || value === "patient" ? value : null;
}

export function clearAuthContext() {
  sessionStorage.removeItem(AUTH_CONTEXT_KEY);
}

export function clearLoginPersistence() {
  localStorage.removeItem(REMEMBER_LOGIN_KEY);
  sessionStorage.removeItem(SESSION_LOGIN_KEY);
  clearAuthContext();
}
