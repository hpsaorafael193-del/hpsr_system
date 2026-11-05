/** Presentation only. Keep stored values and permission/scheduling keys intact. */
const specialtyLabels: Record<string,string> = {
  "clinico geral":"Clínica Geral", "clinica geral":"Clínica Geral",
  obstetra:"Obstetrícia", obstetricia:"Obstetrícia",
  pediatra:"Pediatria", pediatria:"Pediatria",
  psicologa:"Psicologia", psicologo:"Psicologia", psicologista:"Psicologia", psicologia:"Psicologia",
  psiquiatra:"Psiquiatria", psiquiatria:"Psiquiatria",
  nutricionista:"Nutrição", nutricao:"Nutrição",
  cirurgiao:"Cirurgia", cirurgia:"Cirurgia",
  ginecologista:"Ginecologia", ginecologia:"Ginecologia",
  neurologista:"Neurologia", neurologia:"Neurologia",
  oftalmologista:"Oftalmologia", oftalmologia:"Oftalmologia",
  cardiologista:"Cardiologia", cardiologia:"Cardiologia",
  dermatologista:"Dermatologia", dermatologia:"Dermatologia",
};
export function specialtyLabel(value: string | null | undefined): string {
  return String(value || "").split(/([,;|])/).map(part => {
    const key=part.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const label=specialtyLabels[key];
    return label ? part.replace(part.trim(),label) : part;
  }).join("");
}
