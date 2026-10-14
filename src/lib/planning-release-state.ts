/** Campos públicos da folha. Histórico e liberações de outros documentos ficam separados. */
export function integralReleaseState(released: boolean, snapshot: Record<string, unknown> | null, at: string) {
  return {
    portal_released_at: released ? at : null,
    planning_released_document_path: null,
    planning_released_snapshot: released ? snapshot : null,
  };
}

export function individualReleaseState(released: boolean, snapshot: Record<string, unknown> | null, at: string) {
  return {
    individual_released_at: released ? at : null,
    individual_released_document_path: null,
    individual_released_snapshot: released ? snapshot : null,
  };
}
