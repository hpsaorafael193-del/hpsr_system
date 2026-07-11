import { createClient, isSupabaseConfigured } from "@/lib/supabase";

export type SyncResult = { synced: boolean; error?: string };

export async function mirrorRecord(table: string, payload: Record<string, unknown>, conflict = "id"): Promise<SyncResult> {
  if (!isSupabaseConfigured()) return { synced: false };
  const client = createClient();
  if (!client) return { synced: false };
  const { error } = await client.from(table).upsert(payload, { onConflict: conflict });
  if (error) {
    console.error(`[HPSR Supabase] ${table}:`, error.message);
    return { synced: false, error: error.message };
  }
  return { synced: true };
}

export async function removeRecord(table: string, id: string): Promise<SyncResult> {
  if (!isSupabaseConfigured()) return { synced: false };
  const client = createClient();
  if (!client) return { synced: false };
  const { error } = await client.from(table).delete().eq("id", id);
  if (error) return { synced: false, error: error.message };
  return { synced: true };
}

export function normalizeForDatabase<T extends Record<string, unknown>>(record: T) {
  return { ...record, updated_at: new Date().toISOString() };
}
