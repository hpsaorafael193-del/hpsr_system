/**
 * Uma consulta da fila clínica por usuário/aba atende simultaneamente ao sino e
 * ao indicador da agenda. Não persiste dados médicos em localStorage nem no servidor.
 */
import { createClient } from "@/lib/supabase";

export const CLINICAL_BOARD_CHANGED_EVENT = "hpsr-clinical-board-changed";
const FRESH_FOR_MS = 10_000;

type ClinicalBoardRow = { can_claim?: boolean; [key: string]: any };
type CachedBoard = {
  userId: string;
  fetchedAt: number;
  data: ClinicalBoardRow[];
  inFlight: Promise<ClinicalBoardRow[]> | null;
  generation: number;
};
let cached: CachedBoard | null = null;
let generation = 0;

export function invalidateClinicalBoard() {
  generation += 1;
  cached = null;
}

export async function loadSharedClinicalBoard(userId: string): Promise<ClinicalBoardRow[]> {
  const now = Date.now();
  if (cached?.userId === userId) {
    if (cached.inFlight) return cached.inFlight;
    if (now - cached.fetchedAt < FRESH_FOR_MS) return cached.data;
  }
  const client = createClient();
  if (!client) throw new Error("Supabase não configurado.");
  const requestGeneration = generation;
  const entry: CachedBoard = { userId, fetchedAt: 0, data: [], inFlight: null, generation: requestGeneration };
  const promise = Promise.resolve(client.rpc("hpsr_my_clinical_request_board", { p_limit: 400 })).then(({ data, error }) => {
    if (error) throw error;
    const rows = Array.isArray(data) ? data as ClinicalBoardRow[] : [];
    // Uma notificação em tempo real pode invalidar a consulta durante a resposta.
    if (cached === entry && generation === requestGeneration) {
      entry.data = rows;
      entry.fetchedAt = Date.now();
    }
    return rows;
  }).finally(() => { if (cached === entry) entry.inFlight = null; });
  entry.inFlight = promise;
  cached = entry;
  return promise;
}
