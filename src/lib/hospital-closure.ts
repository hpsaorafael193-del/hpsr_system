export const CLOSURE_MESSAGE = "O Hospital São Rafael do Norte está encerrando suas atividades. Esta ação não está mais disponível.";
export const CLOSURE_EVENT = "hpsr:closure-notice";
export const CLOSURE_CHANGED = "hpsr:closure-changed";

export function showClosureNotice() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CLOSURE_EVENT));
}

export async function closureFetch(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);
  if (response.status === 403 && typeof window !== "undefined") {
    const body = await response.clone().json().catch(() => null);
    if (body?.message === CLOSURE_MESSAGE) {
      window.dispatchEvent(new CustomEvent(CLOSURE_CHANGED, { detail: true }));
      showClosureNotice();
    }
  }
  return response;
}
