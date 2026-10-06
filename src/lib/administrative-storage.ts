import { brazilIso } from "@/lib/brazil-datetime";
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

export function readFinancialReceipts(): FinancialReceipt[] {
  return [];
}

export async function saveFinancialReceipt(receipt: FinancialReceipt) {
  return mirrorRecord("financial_receipts", { id: receipt.id, number: receipt.number, total: receipt.total, payload: receipt, created_at: receipt.createdAt, updated_at: brazilIso() });
}

export async function removeFinancialReceipt(id: string) {
  return removeRecord("financial_receipts", id);
}

export function readFinancialPlanEntries(): FinancialPlanEntry[] {
  return [];
}

export function replaceFinancialPlanEntriesCache(_entries: FinancialPlanEntry[]) {
  // Supabase é a fonte oficial. Não existe cache financeiro persistente no navegador.
}

export function saveFinancialPlanEntry(entry: FinancialPlanEntry) {
  void mirrorRecord("financial_plan_entries", { id: entry.id, plan_id: entry.planId, plan_name: entry.planName, holder_passport: entry.holderPassport, value: entry.value, payload: entry, created_at: entry.createdAt, updated_at: brazilIso() });
}

export function removeFinancialPlanEntry(id: string) {
  void removeRecord("financial_plan_entries", id);
}

export function readSystemActivities(): SystemActivity[] {
  return [];
}

export async function registerSystemActivity(activity: Omit<SystemActivity, "id" | "createdAt"> & { id?: string; createdAt?: string }) {
  const item: SystemActivity = {
    id: activity.id || `activity-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: activity.createdAt || brazilIso(),
    module: activity.module,
    action: activity.action,
    description: activity.description,
    actor: activity.actor,
    reference: activity.reference,
  };
  return mirrorRecord("system_activities", { id: item.id, module: item.module, action: item.action, description: item.description, actor: item.actor, reference: item.reference, created_at: item.createdAt });
}
