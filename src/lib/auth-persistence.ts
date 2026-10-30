import { parseCookieHeader, serializeCookieHeader, type CookieOptions } from "@supabase/ssr";

export const REMEMBER_LOGIN_KEY = "hpsr-remember-login";
export const SESSION_LOGIN_KEY = "hpsr-session-login";
export const AUTH_CONTEXT_KEY = "hpsr-auth-context";
const PERSISTENCE_COOKIE = "hpsr-login-persistence";
export const REMEMBER_SESSION_SECONDS = 30 * 24 * 60 * 60;
export type AuthContext = "professional" | "patient";

function readCookie(name: string) {
  if (typeof document === "undefined") return null;
  return parseCookieHeader(document.cookie).find(cookie => cookie.name === name)?.value ?? null;
}

function readStorage(key: string) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function writeStorage(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* Cookies continue to own the session. */ }
}

/** Browser session cookies when unchecked; refreshes preserve the selected mode. */
export function loginCookieOptions(options: CookieOptions, remember: boolean): CookieOptions {
  if (options.maxAge === 0) return options; // Never turn a deletion into a live cookie.
  const { expires: _expires, maxAge: _maxAge, ...sessionOptions } = options;
  return remember ? { ...sessionOptions, maxAge: REMEMBER_SESSION_SECONDS } : sessionOptions;
}

function writeCookie(name: string, value: string, remember: boolean) {
  if (typeof document === "undefined") return;
  document.cookie = serializeCookieHeader(name, value, loginCookieOptions({
    path: "/", sameSite: "lax", secure: window.location.protocol === "https:",
  }, remember));
}

export function getRememberLoginPreference(context: AuthContext = "professional") {
  const value = readStorage(`${REMEMBER_LOGIN_KEY}-${context}`);
  if (value !== null) return value === "true";
  return context === "professional" ? readStorage(REMEMBER_LOGIN_KEY) !== "false" : true;
}

export function rememberCurrentSession() {
  return readCookie(PERSISTENCE_COOKIE) !== "session";
}

export function setLoginPersistence(remember: boolean, context: AuthContext = "professional") {
  writeStorage(`${REMEMBER_LOGIN_KEY}-${context}`, String(remember));
  writeStorage(REMEMBER_LOGIN_KEY, String(remember));
  writeCookie(PERSISTENCE_COOKIE, remember ? "remember" : "session", remember);
  try {
    if (remember) sessionStorage.removeItem(SESSION_LOGIN_KEY);
    else sessionStorage.setItem(SESSION_LOGIN_KEY, "true");
  } catch { /* The browser-session cookie works across tabs without sessionStorage. */ }
}

export function hasValidLoginPersistence() {
  if (readCookie(PERSISTENCE_COOKIE)) return true;
  // Compatibility for an already-open session from older versions.
  if (readStorage(REMEMBER_LOGIN_KEY) !== "false") return true;
  try { return sessionStorage.getItem(SESSION_LOGIN_KEY) === "true"; } catch { return false; }
}

export function setAuthContext(context: AuthContext) {
  writeCookie(AUTH_CONTEXT_KEY, context, rememberCurrentSession());
  try { sessionStorage.setItem(AUTH_CONTEXT_KEY, context); } catch { /* Cookie is sufficient. */ }
}

export function getAuthContext(): AuthContext | null {
  let value = readCookie(AUTH_CONTEXT_KEY);
  if (!value) {
    try { value = sessionStorage.getItem(AUTH_CONTEXT_KEY); } catch { /* No legacy context. */ }
  }
  return value === "professional" || value === "patient" ? value : null;
}

/** Keep the remembered portal aligned with the refreshed Supabase cookies. */
export function renewLoginPersistence() {
  const context = getAuthContext();
  if (context && rememberCurrentSession()) {
    writeCookie(PERSISTENCE_COOKIE, "remember", true);
    writeCookie(AUTH_CONTEXT_KEY, context, true);
  }
}

export function clearAuthContext() {
  if (typeof document !== "undefined") document.cookie = serializeCookieHeader(AUTH_CONTEXT_KEY, "", { path: "/", maxAge: 0 });
  try { sessionStorage.removeItem(AUTH_CONTEXT_KEY); } catch { /* Cookie cleared above. */ }
}

export function clearLoginPersistence() {
  try { localStorage.removeItem(REMEMBER_LOGIN_KEY); sessionStorage.removeItem(SESSION_LOGIN_KEY); } catch { /* Best effort. */ }
  if (typeof document !== "undefined") document.cookie = serializeCookieHeader(PERSISTENCE_COOKIE, "", { path: "/", maxAge: 0 });
  clearAuthContext();
}
