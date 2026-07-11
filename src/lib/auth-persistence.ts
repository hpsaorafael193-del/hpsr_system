export const REMEMBER_LOGIN_KEY = "hpsr-remember-login";
export const SESSION_LOGIN_KEY = "hpsr-session-login";

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

export function clearLoginPersistence() {
  localStorage.removeItem(REMEMBER_LOGIN_KEY);
  sessionStorage.removeItem(SESSION_LOGIN_KEY);
}
