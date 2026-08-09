export const HPSR_TIME_ZONE = "America/Sao_Paulo";

function partsFor(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: HPSR_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: map.year,
    month: map.month,
    day: map.day,
    hour: map.hour,
    minute: map.minute,
    second: map.second,
  };
}

function offsetFor(date: Date) {
  try {
    const part = new Intl.DateTimeFormat("en-US", {
      timeZone: HPSR_TIME_ZONE,
      timeZoneName: "longOffset",
      hour: "2-digit",
    }).formatToParts(date).find((item) => item.type === "timeZoneName")?.value;
    const match = part?.match(/GMT([+-]\d{2}):?(\d{2})?/i);
    if (match) return `${match[1]}:${match[2] || "00"}`;
  } catch {}
  return "-03:00";
}

/** Data civil usada pelo HPSR. Nunca deriva o dia por UTC. */
export function brazilDate(date: Date = new Date()) {
  const p = partsFor(date);
  return `${p.year}-${p.month}-${p.day}`;
}

export function brazilMonth(date: Date = new Date()) {
  const p = partsFor(date);
  return `${p.year}-${p.month}`;
}

/** Timestamp ISO com o offset de São Paulo, preservando o mesmo instante. */
export function brazilIso(date: Date = new Date()) {
  const p = partsFor(date);
  const milliseconds = String(date.getMilliseconds()).padStart(3, "0");
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}.${milliseconds}${offsetFor(date)}`;
}

export function brazilDateTimeInput(date: Date = new Date()) {
  const p = partsFor(date);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

export function addBrazilDays(days: number, from: Date = new Date()) {
  const p = partsFor(from);
  const base = new Date(Number(p.year), Number(p.month) - 1, Number(p.day), 12, 0, 0, 0);
  base.setDate(base.getDate() + days);
  const y = base.getFullYear();
  const m = String(base.getMonth() + 1).padStart(2, "0");
  const d = String(base.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Converte YYYY-MM-DD para Date local ao meio-dia, evitando interpretação UTC do JS. */
export function parseBrazilDate(value: string) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return new Date(value);
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0, 0);
}
