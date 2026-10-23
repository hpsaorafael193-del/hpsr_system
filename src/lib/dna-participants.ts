export type DnaParticipant = { name: string; passport: string; role: string };
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

export function dnaParticipants(primary: DnaParticipant, secondary?: DnaParticipant | null): DnaParticipant[] {
  if (!primary.name.trim() || !primary.passport.trim()) throw new Error("Selecione o paciente principal antes de salvar.");
  if (!secondary) return [primary];
  if (!secondary.name.trim() || !secondary.passport.trim()) throw new Error("Selecione um segundo paciente válido.");
  if (primary.passport.trim().toUpperCase() === secondary.passport.trim().toUpperCase()) throw new Error("Selecione duas pessoas diferentes para o DNA.");
  return [primary, secondary];
}

/** Only this identity block is synchronized; clinical findings remain editable. */
export function syncDnaParticipants(html: string, participants: DnaParticipant[]): string {
  const clean = html.replace(/<section\b[^>]*data-hpsr-block="participantes_dna"[^>]*>[\s\S]*?<\/section>/gi, "");
  if (participants.length < 2) return clean;
  const body = participants.map((p, i) => `<p><strong>Paciente ${i + 1} — ${escapeHtml(p.role)}:</strong> ${escapeHtml(p.name)} · Passaporte: ${escapeHtml(p.passport)}</p>`).join("");
  const block = `<section data-hpsr-block="participantes_dna" data-hpsr-auto-block="true"><h2 data-hpsr-section-heading="true" style="font-size:17px">Participantes do exame de DNA</h2>${body}</section>`;
  return /<\/h1>/i.test(clean) ? clean.replace(/<\/h1>/i, match => match + block) : block + clean;
}
