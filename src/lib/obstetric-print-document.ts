/** Documento dinâmico imprimível. Usa exclusivamente o snapshot já liberado.
 * Não lê nem renderiza observações internas ou rascunhos médicos. */
export type PrintableScope = "integral" | "individual";
export type PrintableKind = "gestacional" | "in_vitro";

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[char] || char));
}
function field(value: unknown, maximum = 5000): string {
  return escapeHtml(typeof value === "string" || typeof value === "number" ? String(value).slice(0, maximum) : "");
}
function formattedDate(value: unknown): string {
  const date = typeof value === "string" ? value.slice(0, 10) : "";
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date.split("-").reverse().join("/") : "—";
}
function section(title: string, text: unknown): string {
  const content = field(text);
  return content ? `<section class="text-section"><h3>${title}</h3><p>${content}</p></section>` : "";
}

export function renderPrintablePlanningDocument(scope: PrintableScope, kind: PrintableKind, snapshot: Record<string, unknown>): string {
  const ivf = kind === "in_vitro";
  const title = ivf ? "Planejamento de fertilização in vitro" : "Planejamento gestacional";
  const patient = field(snapshot.patient_name, 150);
  const doctor = field(snapshot.doctor_name, 150);
  const passport = field(snapshot.patient_passport, 50);
  const head = `<header><div class="crest"><span>SR</span></div><div><p class="eyebrow">HOSPITAL SÃO RAFAEL</p><h1>${title}</h1><p class="subtitle">${scope === "individual" ? "Registro de consulta / etapa liberado pelo médico" : "Cronograma integral liberado pelo médico"}</p></div></header>
  <div class="identity"><div><b>Paciente</b><span>${patient}</span></div>${passport ? `<div><b>Passaporte</b><span>${passport}</span></div>` : ""}<div><b>Médico responsável</b><span>${doctor}</span></div></div>`;
  let body = "";
  if (scope === "integral") {
    const steps = Array.isArray(snapshot.consultation_schedule) ? snapshot.consultation_schedule.slice(0, 24) : [];
    body = `<div class="dates"><div><b>Data inicial</b><span>${formattedDate(snapshot.start_date)}</span></div><div><b>${ivf ? "Previsão β-hCG" : "Previsão do parto"}</b><span>${formattedDate(snapshot.end_date)}</span></div></div>
    <h2>Planejamento previsto por ${ivf ? "etapa" : "consulta"}</h2><div class="steps">${steps.map((raw, index) => {
      if (!raw || typeof raw !== "object") return "";
      const step = raw as Record<string, unknown>;
      const label = field(step.marker || step.title, 140);
      const planned = field(step.planned_text || step.description, 5000);
      return `<article class="step"><div class="step-header"><strong>${ivf ? "Etapa" : "Consulta"} ${field(step.number || index + 1, 10)}</strong><span>${formattedDate(step.date)}</span><em>${label}</em></div><p>${planned || "Sem descrição adicional."}</p></article>`;
    }).join("")}</div>`;
  } else {
    body = `<div class="dates"><div><b>${ivf ? "Etapa" : "Consulta"}</b><span>${field(snapshot.step_number, 10)} · ${field(snapshot.marker || snapshot.title, 150)}</span></div><div><b>Data</b><span>${formattedDate(snapshot.planned_date)}</span></div></div>
    ${section("Planejamento previsto", snapshot.planned_text)}
    ${section("Resumo do atendimento", snapshot.evolution_text)}
    ${section("Exames realizados", snapshot.exams_performed)}
    ${section("Explicação dos exames", snapshot.exam_explanation)}
    ${section("Observações compartilhadas", snapshot.patient_observations)}
    ${section("Conduta, orientações e retorno", snapshot.conduct_text)}`;
  }
  // A impressão do navegador permite Salvar como PDF sem produzir um objeto no Storage.
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title} — São Rafael</title><style>
  :root{color-scheme:light}*{box-sizing:border-box}body{margin:0;background:#f2e5d9;font-family:Arial,Helvetica,sans-serif;color:#48291f}main{max-width:980px;margin:24px auto;padding:46px;background:#fffaf4;border:1px solid #dbc0ab;box-shadow:0 7px 36px #45271b12;border-radius:18px}
  header{display:flex;align-items:center;gap:22px;border-bottom:3px solid #7b382a;padding-bottom:26px}.crest{display:flex;align-items:center;justify-content:center;flex-shrink:0;width:76px;height:76px;border-radius:18px;background:#572116;color:white;font:700 28px Georgia,serif}.eyebrow{font-size:12px;letter-spacing:3px;color:#a76381;font-weight:900}h1{font:700 30px Georgia,serif;margin:8px 0;color:#50251b}.subtitle{font-size:14px;color:#806358;margin:0}.identity{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-top:25px}.identity div,.dates div{display:flex;flex-direction:column;gap:8px;border:1px solid #e2c9b8;border-radius:13px;padding:14px;background:#f6e9dd}.identity b,.dates b{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#91516a}.identity span,.dates span{font-weight:700}.dates{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px;margin:20px 0}h2{color:#6b2d23;font:700 23px Georgia,serif;margin:26px 0 18px}.steps{display:grid;gap:12px}.step{padding:18px;border:1px solid #dfc4af;border-radius:14px;background:#fff7ef;break-inside:avoid}.step-header{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.step-header strong{color:#672b20}.step-header span{background:#783b2a;color:#fff;padding:6px 10px;border-radius:8px;font-size:13px}.step-header em{font-style:normal;color:#9c5473;font-weight:700}.step p,.text-section p{white-space:pre-wrap;line-height:1.65;margin:13px 0 0;font-size:15px}.text-section{margin:16px 0;padding:18px;border:1px solid #dfc4af;background:#fff7ef;border-radius:14px;break-inside:avoid}.text-section h3{margin:0;color:#7e405a;font-size:15px}footer{margin-top:28px;border-top:1px solid #dcc4b6;padding-top:16px;color:#856b60;font-size:12px}.tools{display:flex;gap:12px;justify-content:center;margin:16px auto}.tools button{padding:12px 24px;background:#6c3022;color:#fff;border:0;border-radius:10px;cursor:pointer;font-weight:700}@media print{@page{size:A4;margin:12mm}body{background:#fff}main{box-shadow:none;border:0;border-radius:0;max-width:none;margin:0;padding:0}.tools{display:none}.step,.text-section{break-inside:avoid}}
  </style></head><body><div class="tools"><span>Para salvar como PDF, use Ctrl+P (ou Imprimir no menu do navegador).</span></div><main>${head}${body}<footer>Hospital São Rafael · Documento apresentado conforme liberação médica. Revisões anteriores permanecem no histórico institucional.</footer></main></body></html>`;
}
