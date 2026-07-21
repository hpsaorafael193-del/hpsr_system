const PHONE_DIGIT_LIMIT = 9;

export function phoneDigits(value: string | null | undefined): string {
  return String(value ?? "").replace(/\D/g, "").slice(0, PHONE_DIGIT_LIMIT);
}

export function formatPhoneNumber(value: string | null | undefined): string {
  const digits = phoneDigits(value);
  if (!digits) return "";
  if (digits.length <= 3) return `(${digits}`;

  const area = digits.slice(0, 3);
  const first = digits.slice(3, 6);
  const last = digits.slice(6, 9);

  return `(${area}) ${first}${last ? `-${last}` : ""}`;
}

export function formatPhoneDisplay(value: string | null | undefined, fallback = "—"): string {
  const text = String(value ?? "").trim();
  if (!text || text === "—" || text === "Não informado") return text || fallback;
  return formatPhoneNumber(text) || fallback;
}
