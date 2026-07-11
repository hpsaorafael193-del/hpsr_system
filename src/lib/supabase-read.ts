import { createClient } from "@/lib/supabase";

export async function readSupabaseRows<T>(
  table: string,
  columns = "*",
  orderColumn = "created_at",
): Promise<{ data: T[]; error?: string; configured: boolean }> {
  const client = createClient();
  if (!client) return { data: [], configured: false };

  const { data, error } = await client
    .from(table)
    .select(columns)
    .order(orderColumn, { ascending: false });

  if (error) return { data: [], error: error.message, configured: true };
  return { data: (data || []) as T[], configured: true };
}
