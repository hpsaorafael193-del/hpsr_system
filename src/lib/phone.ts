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


const CITY_PREFIX = "055";
const CITY_LOCAL_DIGITS = 6;

export function cityPhoneLocalDigits(value: string | null | undefined): string {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith(CITY_PREFIX) && digits.length >= CITY_PREFIX.length) {
    return digits.slice(CITY_PREFIX.length, CITY_PREFIX.length + CITY_LOCAL_DIGITS);
  }
  return digits.slice(0, CITY_LOCAL_DIGITS);
}

export function formatCityPhoneNumber(value: string | null | undefined): string {
  const local = cityPhoneLocalDigits(value);
  if (!local) return "";
  const first = local.slice(0, 3);
  const last = local.slice(3, 6);
  return `(055) ${first}${last ? `-${last}` : ""}`;
}

export function isValidCityPhone(value: string | null | undefined): boolean {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length === CITY_LOCAL_DIGITS || (digits.length === CITY_PREFIX.length + CITY_LOCAL_DIGITS && digits.startsWith(CITY_PREFIX));
}

export function normalizeDiscordId(value: string | null | undefined): string {
  return String(value ?? "").replace(/\D/g, "").slice(0, 20);
}

export function isValidDiscordId(value: string | null | undefined): boolean {
  return /^[0-9]{17,20}$/.test(String(value ?? "").trim());
}
