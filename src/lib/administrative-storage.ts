import { mirrorRecord, removeRecord } from "@/lib/data-bridge";
export const RECEIPTS_STORAGE_KEY = "hpsr-financial-receipts";
export const SYSTEM_ACTIVITY_STORAGE_KEY = "hpsr-system-activity-log";
export const PLAN_FINANCIAL_STORAGE_KEY = "hpsr-financial-plan-entries";

export type FinancialReceiptItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type FinancialReceipt = {
  id: string;
  number: string;
  createdAt: string;
  issuedBy: string;
  issuerCrm?: string;
  convenio: string;
  discountPercent: number;
  subtotal: number;
  discountValue: number;
  total: number;
  totalUnits: number;
  tabletHpTotal?: number;
  doctorTotal?: number;
  items: FinancialReceiptItem[];
};


export type FinancialPlanEntry = {
  id: string;
  createdAt: string;
  planId: string;
  planName: string;
  holderName: string;
  holderPassport: string;
  activatedAt: string;
  expiresAt: string;
  dependentsCount: number;
  value: number;
  registeredBy: string;
  insurancePlan?: Record<string, unknown>;
};

export type SystemActivity = {
  id: string;
  createdAt: string;
  module: string;
  action: string;
  description: string;
  actor?: string;
  reference?: string;
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function readFinancialReceipts(): FinancialReceipt[] {
  if (typeof window === "undefined") return [];
  return safeParse<FinancialReceipt[]>(window.localStorage.getItem(RECEIPTS_STORAGE_KEY), []);
}

export async function saveFinancialReceipt(receipt: FinancialReceipt) {
  const result = await mirrorRecord("financial_receipts", { id: receipt.id, number: receipt.number, total: receipt.total, payload: receipt, created_at: receipt.createdAt, updated_at: new Date().toISOString() });
  if (!result.synced) return result;
  if (typeof window !== "undefined") {
    const current = readFinancialReceipts();
    window.localStorage.setItem(RECEIPTS_STORAGE_KEY, JSON.stringify([receipt, ...current.filter((item) => item.id !== receipt.id)]));
  }
  return result;
}

export async function removeFinancialReceipt(id: string) {
  const result = await removeRecord("financial_receipts", id);
  if (!result.synced) return result;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(RECEIPTS_STORAGE_KEY, JSON.stringify(readFinancialReceipts().filter((receipt) => receipt.id !== id)));
  }
  return result;
}


export function readFinancialPlanEntries(): FinancialPlanEntry[] {
  if (typeof window === "undefined") return [];
  return safeParse<FinancialPlanEntry[]>(window.localStorage.getItem(PLAN_FINANCIAL_STORAGE_KEY), []);
}


export function replaceFinancialPlanEntriesCache(entries: FinancialPlanEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PLAN_FINANCIAL_STORAGE_KEY, JSON.stringify(entries));
}

export function saveFinancialPlanEntry(entry: FinancialPlanEntry) {
  if (typeof window === "undefined") return;
  const current = readFinancialPlanEntries();
  const next = [entry, ...current.filter((item) => item.id !== entry.id)];
  window.localStorage.setItem(PLAN_FINANCIAL_STORAGE_KEY, JSON.stringify(next));
  void mirrorRecord("financial_plan_entries", { id: entry.id, plan_id: entry.planId, plan_name: entry.planName, holder_passport: entry.holderPassport, value: entry.value, payload: entry, created_at: entry.createdAt, updated_at: new Date().toISOString() });
}

export function removeFinancialPlanEntry(id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    PLAN_FINANCIAL_STORAGE_KEY,
    JSON.stringify(readFinancialPlanEntries().filter((entry) => entry.id !== id))
  );
  void removeRecord("financial_plan_entries", id);
}

export function readSystemActivities(): SystemActivity[] {
  if (typeof window === "undefined") return [];
  return safeParse<SystemActivity[]>(window.localStorage.getItem(SYSTEM_ACTIVITY_STORAGE_KEY), []);
}

export async function registerSystemActivity(activity: Omit<SystemActivity, "id" | "createdAt"> & { id?: string; createdAt?: string }) {
  const item: SystemActivity = {
    id: activity.id || `activity-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: activity.createdAt || new Date().toISOString(),
    module: activity.module,
    action: activity.action,
    description: activity.description,
    actor: activity.actor,
    reference: activity.reference,
  };
  const result = await mirrorRecord("system_activities", { id: item.id, module: item.module, action: item.action, description: item.description, actor: item.actor, reference: item.reference, created_at: item.createdAt });
  if (result.synced && typeof window !== "undefined") {
    window.localStorage.setItem(SYSTEM_ACTIVITY_STORAGE_KEY, JSON.stringify([item, ...readSystemActivities()].slice(0, 1000)));
  }
  return result;
}
