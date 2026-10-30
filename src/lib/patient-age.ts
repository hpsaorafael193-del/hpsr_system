/** Character age is entered in whole years; never derive a birthday from it. */
export function parsePatientAge(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value).trim();
  if (!/^\d{1,3}$/.test(text)) return null;
  const age = Number(text);
  return Number.isInteger(age) && age >= 0 && age <= 120 ? age : null;
}
