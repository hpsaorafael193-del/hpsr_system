const PATIENT_REGISTRY_SYNC_KEY = "hpsr-patient-registry-sync";
const PATIENT_REGISTRY_EVENT = "hpsr:patient-registry-updated";
const PATIENT_REGISTRY_CHANNEL = "hpsr-patient-registry";

export function notifyPatientRegistryUpdated() {
  if (typeof window === "undefined") return;
  const payload = String(Date.now());
  window.dispatchEvent(new CustomEvent(PATIENT_REGISTRY_EVENT));
  try { window.localStorage.setItem(PATIENT_REGISTRY_SYNC_KEY, payload); } catch {}
  try {
    const channel = new BroadcastChannel(PATIENT_REGISTRY_CHANNEL);
    channel.postMessage({ type: "updated", at: payload });
    channel.close();
  } catch {}
}

export function subscribePatientRegistryUpdated(callback: () => void) {
  if (typeof window === "undefined") return () => undefined;

  const onCustom = () => callback();
  const onStorage = (event: StorageEvent) => {
    if (event.key === PATIENT_REGISTRY_SYNC_KEY) callback();
  };

  window.addEventListener(PATIENT_REGISTRY_EVENT, onCustom);
  window.addEventListener("storage", onStorage);

  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel(PATIENT_REGISTRY_CHANNEL);
    channel.addEventListener("message", callback);
  } catch {}

  return () => {
    window.removeEventListener(PATIENT_REGISTRY_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
    if (channel) {
      channel.removeEventListener("message", callback);
      channel.close();
    }
  };
}
