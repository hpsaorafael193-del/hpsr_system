/** Compatibility for forms answered before cesareans moved to Hospital São Rafael. */
export function formatFollowupBirthType(value: unknown) {
  return value === "Cesárea (HP Sul)" ? "Cesárea hospitalar" : value;
}
